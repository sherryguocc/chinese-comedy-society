'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { ReactNode } from 'react'

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
  const { profile, loading, refreshProfile } = useAuth()

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4">正在验证权限...</p>
            
            {/* 刷新按钮 */}
            <button 
              onClick={refreshProfile}
              className="btn btn-outline btn-sm mt-4"
            >
              刷新权限 Refresh
            </button>
            
            {/* 开发模式下显示调试信息 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="alert alert-info mt-4 max-w-md mx-auto">
                <div className="text-sm">
                  <div>Debug: Loading = {loading.toString()}</div>
                  <div>Debug: Has User = {!!profile?.id}</div>
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

  // 如果不是管理员，显示权限不足
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">
          权限不足 Access Denied
        </h1>
        <p className="mt-4">您没有访问管理后台的权限。</p>
        <p>You don't have permission to access the admin dashboard.</p>
        
        {/* 调试信息 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="alert alert-info mt-4 max-w-md mx-auto">
            <div className="text-sm">
              <div>Debug: Profile Role = {profile?.role || 'null'}</div>
              <div>Debug: Loading = {loading.toString()}</div>
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
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Link href="/admin/dashboard" className="btn btn-circle btn-outline">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
          )}
          <h1 className="text-3xl font-bold">{title}</h1>
        </div>
        
        <div className="flex gap-4">
          <Link href="/admin/posts/create" className="btn primary-orange">
            发布文章 Create Post
          </Link>
          <Link href="/admin/events/create" className="btn bg-black hover:bg-gray-800 text-white">
            创建活动 Create Event
          </Link>
          <Link href="/admin/files" className="btn bg-orange-600 hover:bg-orange-700 text-white">
            文件管理 File Management
          </Link>
        </div>
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
