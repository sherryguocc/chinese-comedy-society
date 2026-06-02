import { NextRequest, NextResponse } from 'next/server'
import { supabase, getSupabaseAdmin } from '@/lib/supabase'
import { Database } from '@/types/database'
import { clearCachedRole } from '@/lib/cache'

type ProfileRole = Database['public']['Tables']['profiles']['Row']['role']
const SUPER_ADMIN_EMAIL = 'sherryguocc@gmail.com'

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

    // super_admin 只通过固定邮箱判定
    if (user.email?.toLowerCase() !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }

    // 🔒 获取 admin 客户端
    const supabaseAdmin = getSupabaseAdmin()

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

    // 清理角色缓存，确保权限变更立即生效
    clearCachedRole(targetUserId)

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