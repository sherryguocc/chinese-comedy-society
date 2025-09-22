'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // 获取当前会话
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('获取会话失败:', error)
          return
        }

        if (mounted) {
          setUser(session?.user ?? null)
          
          if (session?.user) {
            await fetchProfile(session.user.id)
          } else {
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('初始化认证失败:', error)
        if (mounted) {
          setLoading(false)
        }
      } finally {
        if (mounted) {
          setInitializing(false)
        }
      }
    }

    initializeAuth()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('Auth state change:', event, session?.user?.email)
      
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // 对于登录和注册事件，稍等片刻确保数据库操作完成
        if (event === 'SIGNED_IN' || event === 'SIGNED_UP' || event === 'TOKEN_REFRESHED') {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string, retryCount = 0) => {
    if (!userId) return

    try {
      console.log(`获取用户资料: ${userId} (尝试 ${retryCount + 1})`)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data && retryCount < 2) {
        // 如果没有找到profile，等待后重试
        console.log(`未找到用户资料，${2000}ms后重试...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        return fetchProfile(userId, retryCount + 1)
      }

      if (!data) {
        console.log('未找到用户资料，尝试手动创建...')
        const { data: userData } = await supabase.auth.getUser()
        
        if (userData.user) {
          const profileData = {
            id: userId,
            email: userData.user.email!,
            full_name: userData.user.user_metadata?.full_name || null,
            username: null,
            phone_number: null,
            role: 'guest' as const
          }
          
          console.log('创建用户资料数据:', profileData)

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single()

          if (createError) {
            console.error('创建用户资料失败:', createError)
            throw createError
          } else {
            console.log('用户资料创建成功:', newProfile)
            setProfile(newProfile)
          }
        }
      } else {
        console.log('用户资料加载成功:', data)
        setProfile(data)
      }
    } catch (error) {
      console.error('获取用户资料失败:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (!user?.id) {
      console.log('没有用户，无法刷新资料')
      return
    }
    
    console.log('刷新用户资料:', user.id)
    setLoading(true)
    await fetchProfile(user.id, 0)
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
    return data
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    setUser(null)
    setProfile(null)
  }

  // 在初始化完成前显示loading
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}