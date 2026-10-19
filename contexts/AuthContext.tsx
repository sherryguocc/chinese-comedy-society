'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, Admin, UserRole } from '@/types/database';
import { getUserRole, clearUserRoleCache } from '@/lib/permissions';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  admin: Admin | null;
  userRole: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  // 添加内存缓存标志
  const [dataFetched, setDataFetched] = useState(false)
  
  // 在初始化时检查localStorage
  const getInitialUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('chinese-comedy-society-user');
      const timestamp = localStorage.getItem('chinese-comedy-society-user-timestamp');
      
      if (!cached || !timestamp) return null;
      
      // 检查缓存是否过期（30分钟）
      const cacheAge = Date.now() - parseInt(timestamp);
      const CACHE_EXPIRY = 30 * 60 * 1000; // 30分钟
      
      if (cacheAge > CACHE_EXPIRY) {
        console.log('[AuthContext] User cache expired, clearing');
        localStorage.removeItem('chinese-comedy-society-user');
        localStorage.removeItem('chinese-comedy-society-user-timestamp');
        return null;
      }
      
      return JSON.parse(cached);
    } catch {
      return null;
    }
  };

  const getInitialProfile = (): Profile | null => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('chinese-comedy-society-profile');
      const timestamp = localStorage.getItem('chinese-comedy-society-profile-timestamp');
      
      if (!cached || !timestamp) return null;
      
      // 检查缓存是否过期（30分钟）
      const cacheAge = Date.now() - parseInt(timestamp);
      const CACHE_EXPIRY = 30 * 60 * 1000; // 30分钟
      
      if (cacheAge > CACHE_EXPIRY) {
        console.log('[AuthContext] Profile cache expired, clearing');
        localStorage.removeItem('chinese-comedy-society-profile');
        localStorage.removeItem('chinese-comedy-society-profile-timestamp');
        return null;
      }
      
      return JSON.parse(cached);
    } catch {
      return null;
    }
  };

  const getInitialAdmin = (): Admin | null => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('chinese-comedy-society-admin');
      const timestamp = localStorage.getItem('chinese-comedy-society-admin-timestamp');
      
      if (!cached || !timestamp) return null;
      
      // 检查缓存是否过期（30分钟）
      const cacheAge = Date.now() - parseInt(timestamp);
      const CACHE_EXPIRY = 30 * 60 * 1000; // 30分钟
      
      if (cacheAge > CACHE_EXPIRY) {
        console.log('[AuthContext] Admin cache expired, clearing');
        localStorage.removeItem('chinese-comedy-society-admin');
        localStorage.removeItem('chinese-comedy-society-admin-timestamp');
        return null;
      }
      
      return JSON.parse(cached);
    } catch {
      return null;
    }
  };

  const getInitialUserRole = (): UserRole | null => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('chinese-comedy-society-user-role');
      const timestamp = localStorage.getItem('chinese-comedy-society-user-role-timestamp');
      
      if (!cached || !timestamp) return null;
      
      // 检查缓存是否过期（30分钟）
      const cacheAge = Date.now() - parseInt(timestamp);
      const CACHE_EXPIRY = 30 * 60 * 1000; // 30分钟
      
      if (cacheAge > CACHE_EXPIRY) {
        console.log('[AuthContext] UserRole cache expired, clearing');
        localStorage.removeItem('chinese-comedy-society-user-role');
        localStorage.removeItem('chinese-comedy-society-user-role-timestamp');
        return null;
      }
      
      return JSON.parse(cached);
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState<User | null>(null); // 服务端渲染时始终为 null
  const [profile, setProfile] = useState<Profile | null>(null); // 服务端渲染时始终为 null
  const [admin, setAdmin] = useState<Admin | null>(null); // 管理员数据
  const [userRole, setUserRole] = useState<UserRole | null>(null); // 当前用户角色
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // 组件挂载后初始化用户状态
  useEffect(() => {
    setMounted(true)
    // 客户端挂载后才设置缓存的用户状态
    const cachedUser = getInitialUser()
    const cachedProfile = getInitialProfile()
    const cachedAdmin = getInitialAdmin()
    const cachedUserRole = getInitialUserRole()
    
    console.log('[AuthContext] Initializing with cached data:', {
      hasUser: !!cachedUser,
      hasProfile: !!cachedProfile,
      hasAdmin: !!cachedAdmin,
      userRole: cachedUserRole
    })
    
    setUser(cachedUser)
    setProfile(cachedProfile)
    setAdmin(cachedAdmin)
    setUserRole(cachedUserRole)
    
    // 如果有缓存的用户数据和角色数据，就不需要显示loading
    const hasCompleteCache = cachedUser && cachedUserRole
    setLoading(!hasCompleteCache)
    
    console.log('[AuthContext] Initial loading state set to:', !hasCompleteCache)
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
        localStorage.setItem('chinese-comedy-society-user-timestamp', Date.now().toString());
      } else {
        localStorage.removeItem('chinese-comedy-society-user');
        localStorage.removeItem('chinese-comedy-society-user-timestamp');
      }
    }
  }, [user]);

  // 缓存profile到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (profile) {
        localStorage.setItem('chinese-comedy-society-profile', JSON.stringify(profile));
        localStorage.setItem('chinese-comedy-society-profile-timestamp', Date.now().toString());
      } else {
        localStorage.removeItem('chinese-comedy-society-profile');
        localStorage.removeItem('chinese-comedy-society-profile-timestamp');
      }
    }
  }, [profile]);

  // 缓存admin到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (admin) {
        localStorage.setItem('chinese-comedy-society-admin', JSON.stringify(admin));
        localStorage.setItem('chinese-comedy-society-admin-timestamp', Date.now().toString());
      } else {
        localStorage.removeItem('chinese-comedy-society-admin');
        localStorage.removeItem('chinese-comedy-society-admin-timestamp');
      }
    }
  }, [admin]);

  // 缓存userRole到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (userRole) {
        localStorage.setItem('chinese-comedy-society-user-role', JSON.stringify(userRole));
        localStorage.setItem('chinese-comedy-society-user-role-timestamp', Date.now().toString());
      } else {
        localStorage.removeItem('chinese-comedy-society-user-role');
        localStorage.removeItem('chinese-comedy-society-user-role-timestamp');
      }
    }
  }, [userRole]);

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
            localStorage.removeItem('chinese-comedy-society-user-timestamp');
            localStorage.removeItem('chinese-comedy-society-profile');
            localStorage.removeItem('chinese-comedy-society-profile-timestamp');
            localStorage.removeItem('chinese-comedy-society-admin');
            localStorage.removeItem('chinese-comedy-society-admin-timestamp');
            localStorage.removeItem('chinese-comedy-society-user-role');
            localStorage.removeItem('chinese-comedy-society-user-role-timestamp');
          }
          setUser(null);
          setProfile(null);
          setAdmin(null);
          setUserRole(null);
          setLoading(false);
          return;
        }
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // 简化：总是获取用户数据，让 getUserRole 内部处理缓存
          await fetchUserData(session.user.id, false, session.access_token);
        } else {
          setProfile(null);
          setAdmin(null);
          setUserRole(null);
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
            localStorage.removeItem('chinese-comedy-society-user-timestamp');
            localStorage.removeItem('chinese-comedy-society-profile');
            localStorage.removeItem('chinese-comedy-society-profile-timestamp');
            localStorage.removeItem('chinese-comedy-society-admin');
            localStorage.removeItem('chinese-comedy-society-admin-timestamp');
            localStorage.removeItem('chinese-comedy-society-user-role');
            localStorage.removeItem('chinese-comedy-society-user-role-timestamp');
          }
        }
        
        if (mounted) {
          setUser(null);
          setProfile(null);
          setAdmin(null);
          setUserRole(null);
          setLoading(false);
        }
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    };

    // 页面可见性变化处理（防抖处理）- 优化以减少不必要的验证
    const handleVisibilityChange = debounce(async () => {
      if (document.visibilityState === 'visible') {
        // 只有在用户数据缺失或明确需要时才进行检查
        // 如果已经有完整的用户数据，就不需要重新验证
        if (user && userRole && dataFetched) {
          console.log('Page visible again, but user data is complete, skipping check');
          return;
        }
        
        console.log('Page visible again, checking session validity...');
        // 页面重新可见时，延迟检查会话是否仍然有效
        // 给用户一些时间让自动刷新完成
        setTimeout(async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session && mounted) {
              console.log('Session expired while page was hidden, signing out');
              setUser(null);
              setProfile(null);
              setAdmin(null);
              setUserRole(null);
              setDataFetched(false);
              if (typeof window !== 'undefined') {
                localStorage.removeItem('chinese-comedy-society-user');
                localStorage.removeItem('chinese-comedy-society-user-timestamp');
                localStorage.removeItem('chinese-comedy-society-profile');
                localStorage.removeItem('chinese-comedy-society-profile-timestamp');
                localStorage.removeItem('chinese-comedy-society-admin');
                localStorage.removeItem('chinese-comedy-society-admin-timestamp');
                localStorage.removeItem('chinese-comedy-society-user-role');
                localStorage.removeItem('chinese-comedy-society-user-role-timestamp');
              }
            } else if (session && !user) {
              // 只有在有会话但没有用户数据时才重新获取
              console.log('Session exists but no user data, refetching...');
              setUser(session.user);
              await fetchUserData(session.user.id, false);
            }
          } catch (error) {
            console.warn('Failed to check session on visibility change:', error);
          }
        }, 1000); // 延迟1秒检查
      }
    }, 3000); // 增加防抖时间到3秒，减少频繁检查

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state change:', event, !!session?.user);
      
      // 处理认证错误，特别是无效的refresh token
      if (event === 'SIGNED_OUT' && !session) {
        // 清理本地存储的无效数据
        if (typeof window !== 'undefined') {
          localStorage.removeItem('chinese-comedy-society-user');
          localStorage.removeItem('chinese-comedy-society-user-timestamp');
          localStorage.removeItem('chinese-comedy-society-profile');
          localStorage.removeItem('chinese-comedy-society-profile-timestamp');
          localStorage.removeItem('chinese-comedy-society-admin');
          localStorage.removeItem('chinese-comedy-society-admin-timestamp');
          localStorage.removeItem('chinese-comedy-society-user-role');
          localStorage.removeItem('chinese-comedy-society-user-role-timestamp');
        }
        setUser(null);
        setProfile(null);
        setAdmin(null);
        setUserRole(null);
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
            localStorage.removeItem('chinese-comedy-society-user-timestamp');
            localStorage.removeItem('chinese-comedy-society-profile');
            localStorage.removeItem('chinese-comedy-society-profile-timestamp');
            localStorage.removeItem('chinese-comedy-society-admin');
            localStorage.removeItem('chinese-comedy-society-admin-timestamp');
            localStorage.removeItem('chinese-comedy-society-user-role');
            localStorage.removeItem('chinese-comedy-society-user-role-timestamp');
          }
        }
      }
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // 简化：让 getUserRole 内部处理缓存逻辑
        const currentUserId = session.user.id;
        const hasUserChanged = user?.id !== currentUserId;
        
        console.log('[AuthContext] onAuthStateChange:', {
          event,
          hasUserChanged,
          currentUserId,
          previousUserId: user?.id
        });
        
        // 用户变化时强制刷新，否则使用缓存。
        // 用 setTimeout 跳出回调：在 onAuthStateChange 里 await 其他 supabase 调用会死锁，
        // 导致 loading 永远是 true（这就是"导航栏显示后台、页面却说没权限"的原因）。
        const accessToken = session.access_token;
        setTimeout(() => {
          if (mounted) fetchUserData(currentUserId, hasUserChanged, accessToken);
        }, 0);
      } else {
        setProfile(null);
        setAdmin(null);
        setUserRole(null);
        setDataFetched(false);
        setLoading(false);
      }
    });

    // 添加页面可见性和窗口焦点监听器 - 暂时禁用以避免干扰用户工作流程
    // if (typeof document !== 'undefined') {
    //   document.addEventListener('visibilitychange', handleVisibilityChange);
    // }
    
    // 监听窗口焦点变化（可选，更精确的控制）- 暂时禁用
    // let handleFocus: (() => void) | undefined;
    // if (typeof window !== 'undefined') {
    //   handleFocus = debounce(() => {
    //     // 窗口重新获得焦点时，也可以进行类似的检查
    //     if (user && document.visibilityState === 'visible') {
    //       // 这里可以添加额外的逻辑
    //       console.log('Window focused, user session active');
    //     }
    //   }, 1000);
    //   
    //   window.addEventListener('focus', handleFocus);
    // }

    return () => {
      mounted = false;
      subscription.unsubscribe();
      // if (typeof document !== 'undefined') {
      //   document.removeEventListener('visibilitychange', handleVisibilityChange);
      // }
      // if (typeof window !== 'undefined' && handleFocus) {
      //   window.removeEventListener('focus', handleFocus);
      // }
    };
  }, []); // 移除 user 依赖，避免无限循环

  const fetchUserData = async (userId: string, forceRefresh: boolean = false, accessToken?: string) => {
    try {
      console.log('🎯 [AuthContext] fetchUserData called with:', { userId, forceRefresh });
      
      // 只在没有用户数据时才显示loading，避免已有用户头像时的闪烁
      if (!profile && !admin && !userRole) {
        console.log('⏳ [AuthContext] Setting loading to true for data fetch');
        setLoading(true);
      }
      
      // 使用新的getUserRole函数来获取用户数据
      console.log('🚀 [AuthContext] Calling getUserRole with userId:', userId, 'forceRefresh:', forceRefresh);
      const { userRole: role, profileData, adminData } = await getUserRole(accessToken, forceRefresh);
      
      console.log('✅ [AuthContext] getUserRole completed! Result:', {
        role,
        hasProfile: !!profileData,
        hasAdmin: !!adminData,
        profileRole: profileData?.role
      });
      
      setProfile(profileData);
      setAdmin(adminData);
      setUserRole(role);
      setDataFetched(true); // 标记数据已获取
    } catch (error: unknown) {
      const err = error as Error
      console.error('Fetch user data error:', err.message);
      setProfile(null);
      setAdmin(null);
      setUserRole(null);
      setDataFetched(false);
    } finally {
      console.log('[AuthContext] Setting loading to false');
      setLoading(false); // 总是设置loading为false
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
      setAdmin(null);
      setUserRole(null);
      setDataFetched(false);
      setLoading(false);
      
      // 清理缓存
      clearUserRoleCache();
      
      // 清理所有本地存储
      if (typeof window !== 'undefined') {
        localStorage.removeItem('chinese-comedy-society-auth');
        localStorage.removeItem('chinese-comedy-society-user');
        localStorage.removeItem('chinese-comedy-society-user-timestamp');
        localStorage.removeItem('chinese-comedy-society-profile');
        localStorage.removeItem('chinese-comedy-society-profile-timestamp');
        localStorage.removeItem('chinese-comedy-society-admin');
        localStorage.removeItem('chinese-comedy-society-admin-timestamp');
        localStorage.removeItem('chinese-comedy-society-user-role');
        localStorage.removeItem('chinese-comedy-society-user-role-timestamp');
      }
    } catch (err: any) {
      console.error('SignOut error:', err);
      
      // 即使出错也要清理本地状态
      setUser(null);
      setProfile(null);
      setAdmin(null);
      setUserRole(null);
      setDataFetched(false);
      setLoading(false);
      
      // 清理缓存
      clearUserRoleCache();
      
      // 清理本地存储
      if (typeof window !== 'undefined') {
        localStorage.removeItem('chinese-comedy-society-auth');
        localStorage.removeItem('chinese-comedy-society-user');
        localStorage.removeItem('chinese-comedy-society-user-timestamp');
        localStorage.removeItem('chinese-comedy-society-profile');
        localStorage.removeItem('chinese-comedy-society-profile-timestamp');
        localStorage.removeItem('chinese-comedy-society-admin');
        localStorage.removeItem('chinese-comedy-society-admin-timestamp');
        localStorage.removeItem('chinese-comedy-society-user-role');
        localStorage.removeItem('chinese-comedy-society-user-role-timestamp');
      }
      
      // 只在非会话错误时抛出异常
      if (!err.message?.includes('Auth session missing')) {
        throw err;
      }
    }
  };

  const refreshProfile = async (forceRefresh: boolean = true) => {
    if (user?.id) {
      await fetchUserData(user.id, forceRefresh);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        admin,
        userRole,
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