'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  // 在初始化时检查localStorage
  const getInitialUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('chinese-comedy-society-user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const getInitialProfile = (): Profile | null => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('chinese-comedy-society-profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState<User | null>(null); // 服务端渲染时始终为 null
  const [profile, setProfile] = useState<Profile | null>(null); // 服务端渲染时始终为 null
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // 组件挂载后初始化用户状态
  useEffect(() => {
    setMounted(true)
    // 客户端挂载后才设置缓存的用户状态
    setUser(getInitialUser())
    setProfile(getInitialProfile())
    setLoading(!getInitialUser())
  }, [])

  // 防抖函数，避免频繁的会话检查
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // 缓存用户状态到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('chinese-comedy-society-user', JSON.stringify(user));
      } else {
        localStorage.removeItem('chinese-comedy-society-user');
      }
    }
  }, [user]);

  // 缓存profile到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (profile) {
        localStorage.setItem('chinese-comedy-society-profile', JSON.stringify(profile));
      } else {
        localStorage.removeItem('chinese-comedy-society-profile');
      }
    }
  }, [profile]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        // 如果获取会话时出错（比如无效的refresh token），清理本地存储
        if (error) {
          console.warn('Session error during initialization:', error);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('chinese-comedy-society-user');
            localStorage.removeItem('chinese-comedy-society-profile');
          }
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      } catch (error: any) {
        console.error('Auth initialization error:', error);
        
        // 如果是无效的refresh token错误，清理本地存储
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found')) {
          console.log('Clearing invalid token data from localStorage');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('chinese-comedy-society-user');
            localStorage.removeItem('chinese-comedy-society-profile');
          }
        }
        
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    };

    // 页面可见性变化处理（防抖处理）
    const handleVisibilityChange = debounce(async () => {
      if (document.visibilityState === 'visible') {
        // 页面重新可见时，延迟检查会话是否仍然有效
        // 给用户一些时间让自动刷新完成
        setTimeout(async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session && mounted) {
              console.log('Session expired while page was hidden, signing out');
              setUser(null);
              setProfile(null);
              if (typeof window !== 'undefined') {
                localStorage.removeItem('chinese-comedy-society-user');
                localStorage.removeItem('chinese-comedy-society-profile');
              }
            }
          } catch (error) {
            console.warn('Failed to check session on visibility change:', error);
          }
        }, 1000); // 延迟1秒检查
      }
    }, 2000); // 防抖2秒

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state change:', event, !!session?.user);
      
      // 处理认证错误，特别是无效的refresh token
      if (event === 'SIGNED_OUT' && !session) {
        // 清理本地存储的无效数据
        if (typeof window !== 'undefined') {
          localStorage.removeItem('chinese-comedy-society-user');
          localStorage.removeItem('chinese-comedy-society-profile');
        }
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
      
      // 处理会话错误（如refresh token失效）
      if (event === 'INITIAL_SESSION' && !session) {
        // 如果初始会话获取失败，可能是因为token无效
        if (typeof window !== 'undefined') {
          const cachedUser = localStorage.getItem('chinese-comedy-society-user');
          if (cachedUser) {
            console.log('Clearing cached user data due to session failure');
            localStorage.removeItem('chinese-comedy-society-user');
            localStorage.removeItem('chinese-comedy-society-profile');
          }
        }
      }
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // 添加页面可见性和窗口焦点监听器
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    
    // 监听窗口焦点变化（可选，更精确的控制）
    let handleFocus: (() => void) | undefined;
    if (typeof window !== 'undefined') {
      handleFocus = debounce(() => {
        // 窗口重新获得焦点时，也可以进行类似的检查
        if (user && document.visibilityState === 'visible') {
          // 这里可以添加额外的逻辑
          console.log('Window focused, user session active');
        }
      }, 1000);
      
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (typeof window !== 'undefined' && handleFocus) {
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, []); // 移除 user 依赖，避免无限循环

  const fetchProfile = async (userId: string) => {
    try {
      // 只在没有profile时才显示loading，避免已有用户头像时的闪烁
      if (!profile) {
        setLoading(true);
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('Fetch profile error:', error);
      setProfile(null);
    } finally {
      // 只在之前设置了loading时才重置
      if (!profile) {
        setLoading(false);
      }
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Supabase signIn error:', error);
        throw error;
      }
    } catch (err) {
      console.error('SignIn error:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      // 检查是否有当前会话
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // 只有在有会话的情况下才调用signOut
        const { error } = await supabase.auth.signOut();
        if (error && error.message !== 'Auth session missing!') {
          console.error('SignOut error:', error);
          throw error;
        }
      }
      
      // 无论如何都清理本地状态
      setUser(null);
      setProfile(null);
      setLoading(false);
      
      // 清理所有本地存储
      if (typeof window !== 'undefined') {
        localStorage.removeItem('chinese-comedy-society-auth');
        localStorage.removeItem('chinese-comedy-society-user');
        localStorage.removeItem('chinese-comedy-society-profile');
      }
    } catch (err: any) {
      console.error('SignOut error:', err);
      
      // 即使出错也要清理本地状态
      setUser(null);
      setProfile(null);
      setLoading(false);
      
      // 清理本地存储
      if (typeof window !== 'undefined') {
        localStorage.removeItem('chinese-comedy-society-auth');
        localStorage.removeItem('chinese-comedy-society-user');
        localStorage.removeItem('chinese-comedy-society-profile');
      }
      
      // 只在非会话错误时抛出异常
      if (!err.message?.includes('Auth session missing')) {
        throw err;
      }
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}