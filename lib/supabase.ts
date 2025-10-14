// lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

declare global {
  var __supabase: SupabaseClient<Database> | undefined
  var __supabaseAdmin: SupabaseClient<Database> | undefined
}

// ✅ Anonymous typed client (client-safe, RLS on)
export const supabase: SupabaseClient<Database> =
  globalThis.__supabase ??
  createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: 'chinese-comedy-society-auth',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  })

if (typeof window !== 'undefined') globalThis.__supabase = supabase
if (process.env.NODE_ENV !== 'production') globalThis.__supabase = supabase

// ✅ Service role admin client (server-only, no RLS)
// 🔒 只能在服务端使用，永不导出已初始化的实例
let adminInstance: SupabaseClient<Database> | null = null

export const getSupabaseAdmin = (): SupabaseClient<Database> => {
  // 🛡️ 检查是否在服务端环境
  if (typeof window !== 'undefined') {
    throw new Error('❌ getSupabaseAdmin() should only be called on the server')
  }

  // 🔑 检查 Service Role Key 是否存在
  if (!supabaseServiceRoleKey) {
    throw new Error('❌ SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }

  // 🏠 本地开发时允许缓存实例
  if (!adminInstance) {
    adminInstance = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })

    // 仅在开发环境缓存到全局变量
    if (process.env.NODE_ENV !== 'production') {
      globalThis.__supabaseAdmin = adminInstance
    }
  }

  return adminInstance
}
