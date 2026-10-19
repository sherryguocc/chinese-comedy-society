import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireRole } from '@/lib/server-auth'

// 用户列表（含 email，仅 admin / super_admin 可见）
// 排序：guest（待审批）在前，同一角色内按注册时间倒序
const ROLE_ORDER: Record<string, number> = { guest: 0, member: 1, event_manager: 2, admin: 3, super_admin: 4 }

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'admin')
    if (auth instanceof NextResponse) return auth

    const { data, error } = await getSupabaseAdmin()
      .from('profiles')
      .select('id, email, full_name, username, role, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[API] list users error:', error.message)
      return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
    }

    const users = (data as any[]).sort(
      (a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)
    )

    return NextResponse.json({ users, currentUserId: auth.user.id, currentRole: auth.role })
  } catch (error) {
    console.error('[API] GET /admin/users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
