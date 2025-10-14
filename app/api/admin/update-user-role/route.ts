import { NextRequest, NextResponse } from 'next/server'
import { supabase, getSupabaseAdmin } from '@/lib/supabase'
import { Database } from '@/types/database'

type ProfileRole = Database['public']['Tables']['profiles']['Row']['role']

// POST 方法：修改用户角色（只有 super_admin 可以操作）
export async function POST(request: NextRequest) {
  try {
    // 验证请求者身份
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      )
    }

    // 🔒 获取 admin 客户端
    const supabaseAdmin = getSupabaseAdmin()

    // 检查请求者是否为 super_admin
    const { data: adminData } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!adminData) {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }

    // 解析请求体
    const { targetUserId, newRole } = await request.json()

    if (!targetUserId || !newRole) {
      return NextResponse.json(
        { error: 'Missing required fields: targetUserId, newRole' },
        { status: 400 }
      )
    }

    // 验证角色值
    const validRoles: ProfileRole[] = ['guest', 'member', 'admin']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be: guest, member, or admin' },
        { status: 400 }
      )
    }

    console.log(`[API] Super admin ${user.id} changing user ${targetUserId} role to ${newRole}`)

    // 更新用户角色
    const { data: updatedProfile, error: updateError } = await (supabaseAdmin
      .from('profiles') as any)
      .update({ role: newRole })
      .eq('id', targetUserId)
      .select()
      .maybeSingle()

    if (updateError) {
      console.error('[API] Failed to update user role:', updateError.message)
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      )
    }

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'User not found in profiles table' },
        { status: 404 }
      )
    }

    // 记录操作日志（可选）
    console.log(`[AUDIT] Role change: ${targetUserId} → ${newRole} by ${user.id}`)

    return NextResponse.json({
      success: true,
      message: `User role updated to ${newRole}`,
      profile: updatedProfile
    })

  } catch (error: unknown) {
    const err = error as Error
    console.error('[API] Error updating user role:', err.message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}