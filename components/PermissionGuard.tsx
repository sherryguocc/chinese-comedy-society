'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { hasPermission, PERMISSIONS, isAdmin, isSuperAdmin } from '@/lib/permissions'

interface PermissionGuardProps {
  permission: keyof typeof PERMISSIONS
  children: ReactNode
  fallback?: ReactNode
}

export default function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { userRole, loading, user } = useAuth()
  if (loading || !user) return <>{fallback}</>

  if (!userRole || !hasPermission(userRole, permission)) return <>{fallback}</>

  return <>{children}</>
}

// Admin 专用（包括超级管理员）
export function AdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const { userRole, loading, user } = useAuth()

  if (process.env.NODE_ENV === 'development') {
    console.log('AdminOnly Check:', {
      hasUser: !!user,
      userRole,
      isAdminUser: isAdmin(userRole),
      loading,
    })
  }

  // 如果没有用户或仍在加载，返回 fallback
  if (!user || loading) return <>{fallback}</>
  
  // 检查是否为管理员（admin 或 super_admin）
  if (!isAdmin(userRole)) return <>{fallback}</>

  return <>{children}</>
}

// Super Admin 专用
export function SuperAdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const { userRole, loading, user } = useAuth()

  if (process.env.NODE_ENV === 'development') {
    console.log('SuperAdminOnly Check:', {
      hasUser: !!user,
      userRole,
      isSuperAdmin: isSuperAdmin(userRole),
      loading,
    })
  }

  // 如果没有用户或仍在加载，返回 fallback
  if (!user || loading) return <>{fallback}</>
  
  // 检查是否为超级管理员
  if (!isSuperAdmin(userRole)) return <>{fallback}</>

  return <>{children}</>
}

// Member 专用（member、admin 或 super_admin 可访问）
export function MemberOnly({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const { userRole, loading, user } = useAuth()
  
  if (process.env.NODE_ENV === 'development') {
    console.log('MemberOnly Check:', {
      hasUser: !!user,
      userRole,
      isAdminUser: isAdmin(userRole),
      loading,
      condition1: userRole !== 'member',
      condition2: !isAdmin(userRole),
      finalCheck: userRole !== 'member' && !isAdmin(userRole)
    })
  }
  
  if (loading || !user) return <>{fallback}</>

  // Member, admin, 或 super_admin 都可以访问
  if (userRole !== 'member' && !isAdmin(userRole)) return <>{fallback}</>

  return <>{children}</>
}
