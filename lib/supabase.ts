// lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

declare global {
  // ✅ keep strong types on the singletons
  var __supabase: SupabaseClient<Database> | undefined
  var __supabaseAdmin: SupabaseClient<Database> | undefined
}

// ✅ typed client (RLS on)
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
      debug: false,
    },
  })

if (typeof window !== 'undefined') globalThis.__supabase = supabase
if (process.env.NODE_ENV !== 'production') globalThis.__supabase = supabase

// ✅ typed admin client (server only, bypasses RLS)
export const supabaseAdmin: SupabaseClient<Database> =
  globalThis.__supabaseAdmin ??
  createClient<Database>(
    supabaseUrl,
    (supabaseServiceRoleKey || supabaseAnonKey)!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  )

if (process.env.NODE_ENV !== 'production') globalThis.__supabaseAdmin = supabaseAdmin
