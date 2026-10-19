// lib/server-auth.ts
// 服务端统一鉴权：从请求中解析当前用户，并从 profiles 表读取角色。
// 只能在 Route Handlers / Server Actions 中使用。

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isAdmin, isMember, isSuperAdmin, isEventManagerOrAbove } from '@/lib/permissions'
import type { Profile, UserRole } from '@/types/database'

export type AuthResult = {
  user: User
  profile: Profile | null
  role: UserRole
}

/**
 * 从 Authorization: Bearer <access_token> 解析当前用户。
 * 浏览器端 session 目前存在 localStorage，所以前端调用 API 时需要带上这个 header。
 */
export async function getRequestAuth(request: NextRequest): Promise<AuthResult | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  const admin = getSupabaseAdmin()

  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return null

  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle() as { data: Profile | null }

  // 角色唯一来源：profiles.role（super_admin 也存在数据库里）
  const role: UserRole = (profile?.role as UserRole) ?? 'guest'

  return { user, profile, role }
}

type RoleLevel = 'member' | 'event_manager' | 'admin' | 'super_admin'

const roleCheck: Record<RoleLevel, (role: UserRole) => boolean> = {
  member: isMember,
  event_manager: isEventManagerOrAbove,
  admin: isAdmin,
  super_admin: isSuperAdmin,
}

/**
 * 要求当前请求的用户至少具有某个角色。
 * 返回 AuthResult，或者一个可以直接 return 的错误响应。
 */
export async function requireRole(
  request: NextRequest,
  level: RoleLevel
): Promise<AuthResult | NextResponse> {
  const auth = await getRequestAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!roleCheck[level](auth.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return auth
}

/** 公开场景下可以安全返回的作者字段（不含 email / phone_number） */
export const PUBLIC_PROFILE_FIELDS = 'id, full_name, username, role'
