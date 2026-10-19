'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { hasPermission, PERMISSIONS, isAdmin, isSuperAdmin, isMember } from '@/lib/permissions'

// fallback：确定没有权限时显示
// loadingFallback：角色还在加载时显示（默认什么都不显示，避免先闪一下"权限不足"）
interface PermissionGuardProps {
  permission: keyof typeof PERMISSIONS
  children: ReactNode
  fallback?: ReactNode
  loadingFallback?: ReactNode
}

interface SimpleGuardProps {
  children: ReactNode
  fallback?: ReactNode
  loadingFallback?: ReactNode
}

export default function PermissionGuard({
  permission,
  children,
  fallback = null,
  loadingFallback = null,
}: PermissionGuardProps) {
  const { userRole, loading, user } = useAuth()
  if (loading) return <>{loadingFallback}</>
  if (!user) return <>{fallback}</>

  if (!userRole || !hasPermission(userRole, permission)) return <>{fallback}</>

  return <>{children}</>
}

// Admin 专用（包括超级管理员）
export function AdminOnly({
  children,
  fallback = null,
  loadingFallback = null,
}: SimpleGuardProps) {
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
  if (loading) return <>{loadingFallback}</>
  if (!user) return <>{fallback}</>
  
  // 检查是否为管理员（admin 或 super_admin）
  if (!isAdmin(userRole)) return <>{fallback}</>

  return <>{children}</>
}

// Super Admin 专用
export function SuperAdminOnly({
  children,
  fallback = null,
  loadingFallback = null,
}: SimpleGuardProps) {
  const { userRole, loading, user } = useAuth()

  if (process.env.NODE_ENV === 'development') {
    console.log('SuperAdminOnly Check:', {
      hasUser: !!user,
      userRole,
      isSuperAdminUser: isSuperAdmin(userRole),
      loading,
    })
  }

  if (loading) return <>{loadingFallback}</>
  if (!user) return <>{fallback}</>
  
  if (!isSuperAdmin(userRole)) return <>{fallback}</>

  return <>{children}</>
}

// Member 专用（member、admin 或 super_admin 可访问）
export function MemberOnly({
  children,
  fallback = null,
  loadingFallback = null,
}: SimpleGuardProps) {
  const { userRole, loading, user } = useAuth()
  
  if (process.env.NODE_ENV === 'development') {
    console.log('MemberOnly Check:', {
      hasUser: !!user,
      userRole,
      isMemberUser: isMember(userRole),
      loading,
    })
  }
  
  if (loading) return <>{loadingFallback}</>
  if (!user) return <>{fallback}</>

  // Member, admin, 或 super_admin 都可以访问
  if (!isMember(userRole)) return <>{fallback}</>

  return <>{children}</>
}
