import { UserRole } from '@/types/database'

export const PERMISSIONS = {
  // 管理员权限
  CREATE_POST: ['admin'] as UserRole[],
  EDIT_POST: ['admin'] as UserRole[],
  DELETE_POST: ['admin'] as UserRole[],
  CREATE_EVENT: ['admin'] as UserRole[],
  EDIT_EVENT: ['admin'] as UserRole[],
  DELETE_EVENT: ['admin'] as UserRole[],
  UPLOAD_FILE: ['admin'] as UserRole[],
  DELETE_FILE: ['admin'] as UserRole[],
  MANAGE_USERS: ['admin'] as UserRole[],
  
  // 会员权限
  COMMENT_POST: ['member', 'admin'] as UserRole[],
  DOWNLOAD_FILE: ['member', 'admin'] as UserRole[],
  
  // 访客权限
  VIEW_POST: ['guest', 'member', 'admin'] as UserRole[],
  VIEW_EVENT: ['guest', 'member', 'admin'] as UserRole[],
} as const

export function hasPermission(userRole: UserRole | null, permission: keyof typeof PERMISSIONS): boolean {
  const debug = process.env.NODE_ENV === 'development'
  
  if (debug) {
    console.log('[Permissions] hasPermission check:', {
      userRole,
      userRoleType: typeof userRole,
      permission,
      allowedRoles: PERMISSIONS[permission]
    })
  }
  
  if (!userRole) {
    if (debug) console.log('[Permissions] hasPermission: no userRole, returning false')
    return false
  }
  
  // 确保角色名称是小写
  const normalizedRole = userRole.toLowerCase() as UserRole
  const result = PERMISSIONS[permission].includes(normalizedRole)
  
  if (debug) {
    console.log('[Permissions] hasPermission result:', {
      originalRole: userRole,
      normalizedRole,
      result,
      includes: PERMISSIONS[permission].includes(normalizedRole)
    })
  }
  
  return result
}

export function requirePermission(userRole: UserRole | null, permission: keyof typeof PERMISSIONS): void {
  if (!hasPermission(userRole, permission)) {
    throw new Error(`权限不足 Insufficient permissions: ${permission}`)
  }
}

// 角色验证函数
export function isValidRole(role: string): role is UserRole {
  return ['guest', 'member', 'admin'].includes(role.toLowerCase())
}
