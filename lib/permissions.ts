import { UserRole } from '@/types/database'

export const PERMISSIONS = {
  // 管理员权限
  CREATE_POST: ['admin'],
  EDIT_POST: ['admin'],
  DELETE_POST: ['admin'],
  CREATE_EVENT: ['admin'],
  EDIT_EVENT: ['admin'],
  DELETE_EVENT: ['admin'],
  UPLOAD_FILE: ['admin'],
  DELETE_FILE: ['admin'],
  MANAGE_USERS: ['admin'],
  
  // 会员权限
  COMMENT_POST: ['member', 'admin'],
  DOWNLOAD_FILE: ['member', 'admin'],
  
  // 访客权限
  VIEW_POST: ['guest', 'member', 'admin'],
  VIEW_EVENT: ['guest', 'member', 'admin'],
} as const

export function hasPermission(userRole: UserRole | null, permission: keyof typeof PERMISSIONS): boolean {
  if (!userRole) return false
  
  // 确保角色名称是小写
  const normalizedRole = userRole.toLowerCase() as UserRole
  return PERMISSIONS[permission].includes(normalizedRole)
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

// 标准化角色名称
export function normalizeRole(role: string): UserRole {
  const normalized = role.toLowerCase()
  if (isValidRole(normalized)) {
    return normalized
  }
  return 'guest' // 默认返回guest
}
