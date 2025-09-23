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

  const [user, setUser] = useState<User | null>(getInitialUser);
  const [profile, setProfile] = useState<Profile | null>(getInitialProfile);
  // 如果有缓存的用户数据，初始loading为false，否则为true
  const [loading, setLoading] = useState(!getInitialUser());
  const [initializing, setInitializing] = useState(true);

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
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setProfile(null);
          setLoading(false);
        }
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state change:', event, !!session?.user);
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && (error as any).code !== 'PGRST116') {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('Fetch profile error:', error);
      setProfile(null);
    } finally {
      setLoading(false);
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