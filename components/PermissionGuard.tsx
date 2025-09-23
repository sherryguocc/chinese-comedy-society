'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

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
  const { profile, loading, user } = useAuth()
  if (loading || !user) return <>{fallback}</>

  const role = profile?.role ?? null
  if (!role || !hasPermission(role, permission)) return <>{fallback}</>

  return <>{children}</>
}

// Admin 专用
export function AdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const { profile, loading, user } = useAuth()

  if (process.env.NODE_ENV === 'development') {
    console.log('AdminOnly Check:', {
      hasUser: !!user,
      profileRole: profile?.role,
      isAdmin: profile?.role === 'admin',
      loading,
    })
  }

  // 如果没有用户，返回 fallback
  if (!user) return <>{fallback}</>
  
  // 如果有 profile 且角色不是 admin，返回 fallback
  if (profile && profile.role !== 'admin') return <>{fallback}</>
  
  // 如果仍在加载但没有 profile，返回 fallback
  if (loading && !profile) return <>{fallback}</>
  
  // 如果有 profile 且是 admin，显示内容
  if (profile?.role === 'admin') return <>{children}</>

  // 其他情况返回 fallback
  return <>{fallback}</>
}

// Member 专用（member 或 admin 可访问）
export function MemberOnly({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const { profile, loading, user } = useAuth()
  if (loading || !user) return <>{fallback}</>

  const role = profile?.role
  if (role !== 'member' && role !== 'admin') return <>{fallback}</>

  return <>{children}</>
}
