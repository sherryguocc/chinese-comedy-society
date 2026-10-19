'use client'

import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { canAccessAdminArea, hasPermission, type Permission } from '@/lib/permissions'
import AdminNavigation from './AdminNavigation'
import AccessDeniedPanel from './AccessDeniedPanel'

interface AdminLayoutProps {
  children: ReactNode
  title?: string
  /** 访问本页需要的权限；不传则任何能进入后台的角色（admin / event_manager）都可访问 */
  requiredPermission?: Permission
  /** @deprecated 保留兼容旧调用，已不使用 */
  showBackButton?: boolean
}

export default function AdminLayout({
  children,
  title = '管理后台 Admin Dashboard',
  requiredPermission,
}: AdminLayoutProps) {
  const { userRole, loading, refreshProfile, user } = useAuth()
  const [timeoutReached, setTimeoutReached] = useState(false)

  // 加载超过 8 秒提示重试
  useEffect(() => {
    if (!loading) {
      setTimeoutReached(false)
      return
    }
    const timeout = setTimeout(() => setTimeoutReached(true), 8000)
    return () => clearTimeout(timeout)
  }, [loading])

  if (loading && !timeoutReached) {
    return (
      <div className="flex flex-col justify-center items-center min-h-64 py-16">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="mt-4 text-base-content/60">正在验证权限… Checking access…</p>
      </div>
    )
  }

  if (timeoutReached || !user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-error">
          {timeoutReached ? '权限验证超时 Authentication Timeout' : '未登录 Not Logged In'}
        </h1>
        <p className="mt-4">
          {timeoutReached
            ? '请刷新页面或重新登录。Please refresh or log in again.'
            : '请先登录后再访问管理后台。Please log in to access the admin area.'}
        </p>
        <div className="mt-6 flex justify-center gap-4">
          {timeoutReached && (
            <button
              onClick={() => {
                setTimeoutReached(false)
                refreshProfile()
              }}
              className="btn btn-primary"
            >
              重新验证 Retry
            </button>
          )}
          <Link href="/auth/login" className="btn btn-outline">
            登录 Login
          </Link>
        </div>
      </div>
    )
  }

  if (!canAccessAdminArea(userRole) || (requiredPermission && !hasPermission(userRole, requiredPermission))) {
    return (
      <AccessDeniedPanel
        messageZh="您没有访问此页面的权限。"
        messageEn="You don't have permission to view this page."
      />
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        <div className="w-full lg:w-auto lg:sticky lg:top-4">
          <AdminNavigation />
        </div>

        <main className="flex-1 min-w-0 w-full">
          <h1 className="text-2xl lg:text-3xl font-bold mb-6">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  )
}
