import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// 使用全局变量确保单例模式
declare global {
  var __supabase: ReturnType<typeof createClient> | undefined
  var __supabaseAdmin: ReturnType<typeof createClient> | undefined
}

// Regular client for client-side operations (respects RLS)
export const supabase = globalThis.__supabase ?? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'chinese-comedy-society-auth',
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
})

if (process.env.NODE_ENV !== 'production') globalThis.__supabase = supabase

// Admin client for server-side operations only (bypasses RLS)
export const supabaseAdmin = globalThis.__supabaseAdmin ?? createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
)

if (process.env.NODE_ENV !== 'production') globalThis.__supabaseAdmin = supabaseAdmin