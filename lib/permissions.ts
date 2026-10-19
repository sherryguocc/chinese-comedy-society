// types/roles.ts

import { UserRole, Admin, Profile } from '@/types/database'
import { supabase } from '@/lib/supabase'

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
  CREATE_POSTS: 'CREATE_POSTS',         // 发布文章 + 编辑/删除自己的文章
  EDIT_ALL_POSTS: 'EDIT_ALL_POSTS',     // 编辑/删除任何人的文章（仅超级管理员）
  CREATE_EVENTS: 'CREATE_EVENTS',       // 发布活动 + 编辑/删除自己发布的活动
  EDIT_ALL_EVENTS: 'EDIT_ALL_EVENTS',   // 编辑/删除任何人发布的活动
  UPLOAD_FILES: 'UPLOAD_FILES',
  MANAGE_USERS: 'MANAGE_USERS',         // guest ⇄ member ⇄ event_manager
  MANAGE_ADMINS: 'MANAGE_ADMINS',       // 任免 admin
  SYSTEM_SETTINGS: 'SYSTEM_SETTINGS',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// 角色层级：guest < member < event_manager < admin < super_admin
const MEMBER_PERMS: Permission[] = [
  PERMISSIONS.VIEW_CONTENT,
  PERMISSIONS.DOWNLOAD_FILES,
  PERMISSIONS.CREATE_COMMENTS,
]
const EVENT_MANAGER_PERMS: Permission[] = [...MEMBER_PERMS, PERMISSIONS.CREATE_EVENTS]
const ADMIN_PERMS: Permission[] = [
  ...EVENT_MANAGER_PERMS,
  PERMISSIONS.EDIT_ALL_EVENTS,
  PERMISSIONS.CREATE_POSTS,
  PERMISSIONS.UPLOAD_FILES,
  PERMISSIONS.MANAGE_USERS,
]

const rolePermissions: Record<UserRole, Permission[]> = {
  guest: [PERMISSIONS.VIEW_CONTENT],
  member: MEMBER_PERMS,
  event_manager: EVENT_MANAGER_PERMS,
  admin: ADMIN_PERMS,
  super_admin: [...ADMIN_PERMS, PERMISSIONS.EDIT_ALL_POSTS, PERMISSIONS.MANAGE_ADMINS, PERMISSIONS.SYSTEM_SETTINGS],
}

// 权限判断函数
export const hasPermission = (userRole: UserRole | null, permission: Permission): boolean => {
  if (!userRole) return false
  return rolePermissions[userRole]?.includes(permission) ?? false
}

// 角色辅助函数
export const isSuperAdmin = (role: UserRole | null) => role === 'super_admin'
export const isAdmin = (role: UserRole | null) => ['admin', 'super_admin'].includes(role ?? '')
export const isMember = (role: UserRole | null) =>
  ['member', 'event_manager', 'admin', 'super_admin'].includes(role ?? '')
export const isEventManagerOrAbove = (role: UserRole | null) =>
  ['event_manager', 'admin', 'super_admin'].includes(role ?? '')
/** 能否进入后台（admin 看到全部功能，event_manager 只看到活动） */
export const canAccessAdminArea = isEventManagerOrAbove

const roleDisplayNames: Record<UserRole, string> = {
  guest: '访客Guest',
  member: '会员Member',
  event_manager: '活动管理员Event Manager',
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

/** 当前用户能否编辑/删除某篇文章 */
export const canEditPost = (role: UserRole | null, userId: string | undefined, authorId: string) =>
  hasPermission(role, PERMISSIONS.EDIT_ALL_POSTS) ||
  (hasPermission(role, PERMISSIONS.CREATE_POSTS) && !!userId && userId === authorId)

/** 当前用户能否编辑/删除某个活动 */
export const canEditEvent = (role: UserRole | null, userId: string | undefined, eventCreatorId: string) =>
  hasPermission(role, PERMISSIONS.EDIT_ALL_EVENTS) ||
  (hasPermission(role, PERMISSIONS.CREATE_EVENTS) && !!userId && userId === eventCreatorId)

// 🧠 角色缓存机制
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟
let roleCache: Record<string, { data: UserRoleData; timestamp: number }> = {}

/**
 * 获取当前用户角色。
 * 在 onAuthStateChange 回调里调用时必须传入 accessToken：
 * 回调内再调用 supabase.auth.getSession() 会因为 auth 锁而死锁（永远不返回）。
 */
export async function getUserRole(accessTokenArg?: string, forceRefresh = false): Promise<UserRoleData> {
  const cacheKey = 'user_role_current_user'

  if (!forceRefresh && roleCache[cacheKey] && Date.now() - roleCache[cacheKey].timestamp < CACHE_DURATION) {
    console.log('📋 [getUserRole] Using cached role data')
    return roleCache[cacheKey].data
  }

  try {
    console.log('🌐 [getUserRole] Fetching role from API for current user')

    const accessToken = accessTokenArg
      ?? (await supabase.auth.getSession()).data.session?.access_token

    const response = await fetch('/api/auth/user-role', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`/api/auth/user-role returned ${response.status}: ${body}`)
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
