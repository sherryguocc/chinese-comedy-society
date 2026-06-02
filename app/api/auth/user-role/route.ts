import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabase, getSupabaseAdmin } from '@/lib/supabase'
import { getCachedRole, setCachedRole } from '@/lib/cache' 
import type { Profile } from '@/types/database'

const SUPER_ADMIN_EMAIL = 'sherryguocc@gmail.com'

async function resolveCurrentUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (!error && user) return user
  }

  const cookieClient = createRouteHandlerClient({ cookies })
  const { data: { user } } = await cookieClient.auth.getUser()
  return user
}

async function getCurrentUserRoleResult(request: NextRequest) {
  const user = await resolveCurrentUser(request)
  if (!user) {
    return {
      status: 401,
      body: { error: '未授权' },
    }
  }

  const userId = user.id

  const cached = getCachedRole(userId)
  if (cached) {
    return {
      status: 200,
      body: cached,
    }
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data: profileData } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle() as { data: Profile | null }

  const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL

  const result = {
    userRole: isSuperAdmin ? 'super_admin' : profileData?.role || 'guest',
    profileData,
    adminData: isSuperAdmin ? { id: userId } : null,
  }

  setCachedRole(userId, result)

  return {
    status: 200,
    body: result,
  }
}

export async function GET(request: NextRequest) {
  try {
    const result = await getCurrentUserRoleResult(request)
    return NextResponse.json(result.body, { status: result.status })

  } catch (error: unknown) {
    console.error('[API] GET /user-role error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await getCurrentUserRoleResult(request)
    return NextResponse.json(result.body, { status: result.status })

  } catch (err) {
    console.error('[API] POST /user-role error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
