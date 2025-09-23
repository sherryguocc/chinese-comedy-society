'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { ReactNode, useEffect, useState } from 'react'
import AdminNavigation from './AdminNavigation'

interface AdminLayoutProps {
  children: ReactNode
  title?: string
  showBackButton?: boolean
}

export default function AdminLayout({ 
  children, 
  title = "管理后台 Admin Dashboard",
  showBackButton = false 
}: AdminLayoutProps) {
  const { profile, loading, refreshProfile, user } = useAuth()
  const [timeoutReached, setTimeoutReached] = useState(false)

  // 添加超时机制 - 5秒后如果还在loading就显示错误
  useEffect(() => {
    let timeout: NodeJS.Timeout
    
    if (loading) {
      timeout = setTimeout(() => {
        setTimeoutReached(true)
      }, 5000) // 5秒超时
    } else {
      setTimeoutReached(false)
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [loading])

  // 如果正在加载，显示加载状态
  if (loading && !timeoutReached) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4">正在验证权限...</p>
            
            {/* 开发模式下显示调试信息 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="alert alert-info mt-4 max-w-md mx-auto">
                <div className="text-sm">
                  <div>Debug: Loading = {loading.toString()}</div>
                  <div>Debug: Has User = {!!user?.id}</div>
                  <div>Debug: Profile Role = {profile?.role || 'null'}</div>
                  <div>Debug: User Email = {profile?.email || 'null'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 如果超时或者没有用户，显示错误页面
  if (timeoutReached || (!loading && !user)) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">
          {timeoutReached ? '权限验证超时 Authentication Timeout' : '未登录 Not Logged In'}
        </h1>
        <p className="mt-4">
          {timeoutReached 
            ? '权限验证超时，请刷新页面或重新登录。Authentication timeout, please refresh or login again.'
            : '请先登录后再访问管理后台。Please login first to access admin dashboard.'
          }
        </p>
        
        <div className="mt-6 space-x-4">
          <button 
            onClick={() => {
              setTimeoutReached(false)
              refreshProfile()
            }}
            className="btn btn-primary"
          >
            重新验证 Retry
          </button>
          <Link href="/auth/login" className="btn btn-outline">
            重新登录 Login
          </Link>
        </div>
        
        {/* 调试信息 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="alert alert-info mt-4 max-w-md mx-auto">
            <div className="text-sm">
              <div>Debug: Timeout Reached = {timeoutReached.toString()}</div>
              <div>Debug: Has User = {!!user?.id}</div>
              <div>Debug: Profile Role = {profile?.role || 'null'}</div>
              <div>Debug: Loading = {loading.toString()}</div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 如果不是管理员，显示权限不足
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">
          权限不足 Access Denied
        </h1>
        <p className="mt-4">您没有访问管理后台的权限。</p>
        <p>You don't have permission to access the admin dashboard.</p>
        
        <div className="mt-6">
          <Link href="/" className="btn btn-primary">
            返回首页 Back to Home
          </Link>
        </div>
        
        {/* 调试信息 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="alert alert-info mt-4 max-w-md mx-auto">
            <div className="text-sm">
              <div>Debug: Profile Role = {profile?.role || 'null'}</div>
              <div>Debug: Loading = {loading.toString()}</div>
              <div>Debug: Has User = {!!user?.id}</div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 统一的管理员头部 */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        <AdminNavigation />
      </div>
      
      {/* 面包屑导航 */}
      <div className="text-sm breadcrumbs mb-6">
        <ul>
          <li><Link href="/admin/dashboard">管理后台</Link></li>
          {title !== "管理后台 Admin Dashboard" && (
            <li className="text-base-content/60">{title.split(' ')[0]}</li>
          )}
        </ul>
      </div>

      {/* 页面内容 */}
      {children}
    </div>
  )
}
