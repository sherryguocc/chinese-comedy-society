// types/roles.ts

import { UserRole, Admin, Profile } from '@/types/database'

export type UserRoleData = {
  userRole: UserRole
  profileData: Profile | null
  adminData: Admin | null
}

// 权限常量定义
export const PERMISSIONS = {
  VIEW_CONTENT: 'VIEW_CONTENT',
  DOWNLOAD_FILES: 'DOWNLOAD_FILES',
  CREATE_COMMENTS: 'CREATE_COMMENTS',
  CREATE_POSTS: 'CREATE_POSTS',
  CREATE_EVENTS: 'CREATE_EVENTS',
  UPLOAD_FILES: 'UPLOAD_FILES',
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_ADMINS: 'MANAGE_ADMINS',
  SYSTEM_SETTINGS: 'SYSTEM_SETTINGS',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// 角色对应权限映射
const rolePermissions: Record<UserRole, Permission[]> = {
  guest: [PERMISSIONS.VIEW_CONTENT],
  member: [
    PERMISSIONS.VIEW_CONTENT,
    PERMISSIONS.DOWNLOAD_FILES,
    PERMISSIONS.CREATE_COMMENTS,
  ],
  admin: [
    PERMISSIONS.VIEW_CONTENT,
    PERMISSIONS.DOWNLOAD_FILES,
    PERMISSIONS.CREATE_COMMENTS,
    PERMISSIONS.CREATE_POSTS,
    PERMISSIONS.CREATE_EVENTS,
    PERMISSIONS.UPLOAD_FILES,
  ],
  super_admin: [
    PERMISSIONS.VIEW_CONTENT,
    PERMISSIONS.DOWNLOAD_FILES,
    PERMISSIONS.CREATE_COMMENTS,
    PERMISSIONS.CREATE_POSTS,
    PERMISSIONS.CREATE_EVENTS,
    PERMISSIONS.UPLOAD_FILES,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ADMINS,
    PERMISSIONS.SYSTEM_SETTINGS,
  ],
}

// 权限判断函数
export const hasPermission = (userRole: UserRole | null, permission: Permission): boolean => {
  if (!userRole) return false
  return rolePermissions[userRole]?.includes(permission) ?? false
}

// 角色辅助函数
export const isSuperAdmin = (role: UserRole | null) => role === 'super_admin'
export const isAdmin = (role: UserRole | null) => ['admin', 'super_admin'].includes(role ?? '')
export const isMember = (role: UserRole | null) => ['member', 'admin', 'super_admin'].includes(role ?? '')

const roleDisplayNames: Record<UserRole, string> = {
  guest: '访客Guest',
  member: '会员Member',
  admin: '管理员Admin',
  super_admin: '超级管理员Super Admin',
}

export const getRoleDisplayName = (role: string) => {
  return roleDisplayNames[role as UserRole] || role
}

// 动态生成权限判断函数
export const canDownload = (role: UserRole | null) => hasPermission(role, PERMISSIONS.DOWNLOAD_FILES)
export const canComment = (role: UserRole | null) => hasPermission(role, PERMISSIONS.CREATE_COMMENTS)
export const canCreateContent = (role: UserRole | null) => hasPermission(role, PERMISSIONS.CREATE_POSTS)
export const canManageUsers = (role: UserRole | null) => hasPermission(role, PERMISSIONS.MANAGE_USERS)

// 🧠 角色缓存机制
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟
let roleCache: Record<string, { data: UserRoleData; timestamp: number }> = {}

export async function getUserRole(_userId?: string, forceRefresh = false): Promise<UserRoleData> {
  const cacheKey = 'user_role_current_user'

  if (!forceRefresh && roleCache[cacheKey] && Date.now() - roleCache[cacheKey].timestamp < CACHE_DURATION) {
    console.log('📋 [getUserRole] Using cached role data')
    return roleCache[cacheKey].data
  }

  try {
    console.log('🌐 [getUserRole] Fetching role from API for current user')

    const response = await fetch('/api/auth/user-role', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const result = (await response.json()) as UserRoleData

    roleCache[cacheKey] = {
      data: result,
      timestamp: Date.now(),
    }

    console.log(`✅ [getUserRole] Role: ${result.userRole}`)

    return result
  } catch (err) {
    console.error(`❌ [getUserRole] Error: ${(err as Error).message}`)

    return {
      userRole: 'guest',
      profileData: null,
      adminData: null,
    }
  }
}

// 清除缓存
export function clearUserRoleCache(userId?: string) {
  if (userId) delete roleCache['user_role_current_user']
  else roleCache = {}
}

// 🔐 前端权限检查辅助函数
export async function checkUserPermission(permission: Permission): Promise<boolean> {
  try {
    const { userRole } = await getUserRole()
    return hasPermission(userRole, permission)
  } catch (error) {
    console.error('Error checking user permission:', error)
    return false
  }
}

// 🛡️ API 调用前的权限预检查
export const PreflightPermissionCheck = {
  async canUpdateUserRole(): Promise<boolean> {
    return await checkUserPermission(PERMISSIONS.MANAGE_USERS)
  },
  
  async canManageSuperAdmins(): Promise<boolean> {
    return await checkUserPermission(PERMISSIONS.MANAGE_ADMINS)
  },
  
  async canCreateContent(): Promise<boolean> {
    return await checkUserPermission(PERMISSIONS.CREATE_POSTS)
  },
  
  async canUploadFiles(): Promise<boolean> {
    return await checkUserPermission(PERMISSIONS.UPLOAD_FILES)
  }
}

// 🔄 用于 React 组件的权限 Hook 数据
export interface PermissionState {
  loading: boolean
  userRole: UserRole | null
  permissions: {
    canView: boolean
    canDownload: boolean
    canComment: boolean
    canCreateContent: boolean
    canManageUsers: boolean
    canManageAdmins: boolean
  }
}
