'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

const DEBUG = false; // 暂时禁用调试日志以减少噪音
const TAG = '[Auth]';

// Small helper to log conditionally
const log = (...args: any[]) => {
  if (DEBUG) console.log(TAG, ...args);
};
const warn = (...args: any[]) => {
  if (DEBUG) console.warn(TAG, ...args);
};
const errorLog = (...args: any[]) => {
  if (DEBUG) console.error(TAG, ...args);
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;        // profile loading state
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);       // specifically for profile fetching
  const [initializing, setInitializing] = useState(true); // boot-time flag

  // 从本地存储恢复 profile 状态
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedProfile = localStorage.getItem('auth_profile')
      if (cachedProfile) {
        try {
          const parsed = JSON.parse(cachedProfile)
          setProfile(parsed)
          log('Restored profile from cache:', parsed)
        } catch (e) {
          log('Failed to parse cached profile, clearing cache')
          localStorage.removeItem('auth_profile')
        }
      }
    }
  }, [])

  // 缓存 profile 到本地存储
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (profile) {
        localStorage.setItem('auth_profile', JSON.stringify(profile))
        log('Cached profile to localStorage')
      } else {
        localStorage.removeItem('auth_profile')
        log('Cleared profile cache')
      }
    }
  }, [profile])

  // Log state snapshots whenever these change
  useEffect(() => {
    log('State snapshot ->', {
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      hasProfile: !!profile,
      profileRole: profile?.role ?? null,
      profileRoleType: typeof profile?.role,
      profileData: profile ? { id: profile.id, email: profile.email, role: profile.role } : null,
      loading,
      initializing,
    });
  }, [user, profile, loading, initializing]);

  useEffect(() => {
    log('Mount: initializing auth flow...');

    let mounted = true;

    const initializeAuth = async () => {
      log('initializeAuth: start getSession()');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        log('initializeAuth: getSession() result', {
          hasSession: !!session,
          userId: session?.user?.id ?? null,
          error: error?.message ?? null,
        });

        if (error) {
          warn('initializeAuth: getSession error', error);
        }

        if (!mounted) return;

        setUser(session?.user ?? null);

        if (session?.user) {
          // We have a session → fetch profile
          log('initializeAuth: session user found → fetchProfile');
          await fetchProfile(session.user.id);
        } else {
          // No session → no profile
          log('initializeAuth: no session, stop profile loading');
          setLoading(false);
        }
      } catch (err) {
        errorLog('initializeAuth: unexpected failure', err);
        if (mounted) setLoading(false);
      } finally {
        if (mounted) {
          log('initializeAuth: finished');
          setInitializing(false);
        }
      }
    };

    initializeAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      log('onAuthStateChange:', {
        event,
        hasSession: !!session,
        userEmail: session?.user?.email ?? null,
        userId: session?.user?.id ?? null,
      });

      setUser(session?.user ?? null);

      if (session?.user) {
        // 避免不必要的profile重新获取
        if (event === 'SIGNED_IN' || (event === 'TOKEN_REFRESHED' && !profile)) {
          log('onAuthStateChange: fetching profile for event:', event);
          if (event === 'SIGNED_IN') {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
          await fetchProfile(session.user.id);
        }
      } else {
        // Signed out or session revoked
        log('onAuthStateChange: no user, clear profile');
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      log('Unmount: cleanup auth subscription');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // 移除profile依赖，避免重复订阅

  // Fetch profile with retries
  const fetchProfile = async (userId: string, retryCount = 0) => {
    if (!userId) {
      warn('fetchProfile: called without userId');
      setLoading(false);
      return;
    }

    try {
      if (retryCount === 0) setLoading(true);
      log(`fetchProfile: start (try ${retryCount + 1}), userId=${userId}`);

      // Check current auth state for debugging
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      log('fetchProfile: current auth state', {
        authUserId: user?.id ?? null,
        authUserEmail: user?.email ?? null,
        authError: authError?.message ?? null,
        queryingUserId: userId,
      });

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      log('fetchProfile: query result', {
        hasData: !!data,
        error: error?.message ?? null,
        code: (error as any)?.code ?? null,
        hint: (error as any)?.hint ?? null,
        details: (error as any)?.details ?? null,
      });

      // If database returned an error that is not "row not found"
      if (error && (error as any).code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        if (retryCount < 2) {
          const delay = 1000; // 减少重试延迟
          log(`fetchProfile: not found → retry after ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchProfile(userId, retryCount + 1);
        } else {
          warn('fetchProfile: still not found after retries, setProfile(null)');
          setProfile(null);
          setLoading(false);
          return;
        }
      }

      // Found profile
      log('fetchProfile: success', { 
        profileId: (data as any).id, 
        role: (data as any).role,
        roleType: typeof (data as any).role,
        fullData: data 
      });
      setProfile(data);
      setLoading(false);
      log('fetchProfile: profile set, loading=false');
    } catch (err) {
      errorLog('fetchProfile: failure', err);
      setProfile(null);
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user?.id) {
      warn('refreshProfile: no user, skip');
      return;
    }
    log('refreshProfile: start', { userId: user.id });
    setLoading(true);
    await fetchProfile(user.id, 0);
    log('refreshProfile: completed');
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    log('signUp: called', { email, hasFullName: !!fullName });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          // Safe-guard: window may be undefined on SSR, but this file is a Client Component.
          emailRedirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : undefined,
        },
      });

      log('signUp: result', {
        userId: data.user?.id ?? null,
        session: !!data.session,
        error: error?.message ?? null,
      });

      if (error) throw error;

      // NOTE: Depending on email confirmation, there may be NO session yet.
      // Profile row is usually created via DB trigger or a server-side edge function.
      // We let onAuthStateChange handle profile fetching if/when session appears.
      return data as any;
    } catch (err: any) {
      errorLog('signUp: failure', err);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    log('signIn: called', { email });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      log('signIn: result', {
        userId: data.user?.id ?? null,
        hasSession: !!data.session,
        error: error?.message ?? null,
      });

      if (error) throw error;
      return data as any;
    } catch (err: any) {
      errorLog('signIn: failure', err);
      throw err;
    }
  };

  const signOut = async () => {
    log('signOut: called');

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      log('signOut: success, clear local states');
      setUser(null);
      setProfile(null);
      setLoading(false);
    } catch (err: any) {
      errorLog('signOut: failure', err);
      throw err;
    }
  };

  // Boot-time spinner
  if (initializing) {
    log('Render: initializing=true → show spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  log('Render: provide context to children');
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
    // This error helps you catch "hook used outside provider" bugs quickly.
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
