import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireRole } from '@/lib/server-auth'
import { isSuperAdmin } from '@/lib/permissions'
import type { UserRole } from '@/types/database'

// 规则：
// - admin / super_admin 都可以在 guest ⇄ member 之间切换
// - 只有 super_admin 可以把人设为 admin，或修改已有 admin 的角色
// - super_admin 不能通过 API 设置或修改（只在数据库中设置）
// - 不能修改自己的角色
const ASSIGNABLE_ROLES: UserRole[] = ['guest', 'member', 'admin']

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'admin')
    if (auth instanceof NextResponse) return auth

    const { targetUserId, newRole } = await request.json()

    if (!targetUserId || !newRole) {
      return NextResponse.json(
        { error: 'Missing required fields: targetUserId, newRole' },
        { status: 400 }
      )
    }

    if (!ASSIGNABLE_ROLES.includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be: guest, member, or admin' },
        { status: 400 }
      )
    }

    if (targetUserId === auth.user.id) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: target } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', targetUserId)
      .maybeSingle() as { data: { id: string; role: UserRole } | null }

    if (!target) {
      return NextResponse.json(
        { error: 'User not found in profiles table' },
        { status: 404 }
      )
    }

    if (target.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin role cannot be changed via API' },
        { status: 403 }
      )
    }

    const touchesAdmin = newRole === 'admin' || target.role === 'admin'
    if (touchesAdmin && !isSuperAdmin(auth.role)) {
      return NextResponse.json(
        { error: 'Only the super admin can grant or revoke admin role' },
        { status: 403 }
      )
    }

    const { data: updatedProfile, error: updateError } = await (supabaseAdmin
      .from('profiles') as any)
      .update({ role: newRole })
      .eq('id', targetUserId)
      .select('id, full_name, email, role')
      .maybeSingle()

    if (updateError) {
      console.error('[API] Failed to update user role:', updateError.message)
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      )
    }

    console.log(`[AUDIT] Role change: ${targetUserId} ${target.role} → ${newRole} by ${auth.user.id}`)

    return NextResponse.json({
      success: true,
      message: `User role updated to ${newRole}`,
      profile: updatedProfile,
    })
  } catch (error: unknown) {
    console.error('[API] Error updating user role:', (error as Error).message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
