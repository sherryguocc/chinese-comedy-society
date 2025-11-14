import { NextRequest, NextResponse } from 'next/server'
import { supabase, getSupabaseAdmin } from '@/lib/supabase'
import { Database } from '@/types/database'
import { getCachedRole, setCachedRole } from '@/lib/cache' 
import type { UserRoleRPCResult } from '@/types/database'
import type { PostgrestSingleResponse } from '@supabase/supabase-js'

// ✅ 从 Database 泛型中取出 admin 表和 profile 表的 Row 类型
type AdminRow = Database['public']['Tables']['admins']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']

export async function GET(request: NextRequest) {
  try {
    if (typeof window !== 'undefined') {
      return NextResponse.json({ error: '此API只能在服务端调用' }, { status: 403 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: '服务配置错误' }, { status: 500 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 })
    }

    const userId = user.id
    const supabaseAdmin = getSupabaseAdmin()

    // 检查 super admin
    const { data: adminData } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('id', userId)
      .maybeSingle() as { data: AdminRow | null }

    if (adminData) {
      return NextResponse.json({
        userRole: 'super_admin',
        profileData: null,
        adminData: { id: userId }
      })
    }

    // 检查 profile
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle() as { data: ProfileRow | null }

    return NextResponse.json({
      userRole: profileData?.role || 'guest',
      profileData: profileData,
      adminData: null
    })

  } catch (error: unknown) {
    console.error('[API] GET /user-role error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // ✅ 使用缓存
    const cached = getCachedRole(userId)
    if (cached) {
      return NextResponse.json(cached)
    }

    const supabaseAdmin = getSupabaseAdmin()

    // ✅ 直接调用 RPC，不用 withTimeout
    const { data, error }: PostgrestSingleResponse<UserRoleRPCResult> =
      await supabaseAdmin
        .rpc('get_user_role', { uid: userId } as any)
        .single()


    if (error || !data) {
      return NextResponse.json({
        userRole: 'guest',
        profileData: null,
        adminData: null
      })
    }

    const result = {
      userRole: data.is_admin ? 'super_admin' : data.role || 'guest',
      profileData: data.profile,
      adminData: data.is_admin ? { id: userId } : null
    }

    setCachedRole(userId, result)
    return NextResponse.json(result)

  } catch (err) {
    console.error('[API] POST /user-role error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
