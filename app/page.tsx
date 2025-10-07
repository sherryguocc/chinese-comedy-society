'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin, isSuperAdmin } from '@/lib/permissions'

export default function HomePage() {
  const { user, profile, admin, userRole, loading } = useAuth()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 开发模式调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="alert alert-info mb-8">
          <div className="text-sm">
            <h3 className="font-bold">🔧 开发调试信息:</h3>
            <div className="mt-2 space-y-1">
              <div>用户状态: {user ? '已登录' : '未登录'}</div>
              <div>用户角色: {userRole || '无'}</div>
              <div>是否管理员: {isAdmin(userRole) ? '是' : '否'}</div>
              <div>是否超级管理员: {isSuperAdmin(userRole) ? '是' : '否'}</div>
              <div>Profile数据: {profile ? '有' : '无'}</div>
              <div>Admin数据: {admin ? '有' : '无'}</div>
              <div>加载状态: {loading ? '加载中' : '已完成'}</div>
              {isAdmin(userRole) && (
                <div className="mt-2">
                  <Link href="/admin/dashboard" className="btn btn-sm btn-primary">
                    前往管理后台
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">华人喜剧协会</h1>
            <h2 className="text-3xl font-bold mt-2">Chinese Comedy Society</h2>
            <p className="py-6">
              欢迎来到华人喜剧协会！一个专为喜剧爱好者打造的双语社区。
              <br />
              Welcome to Chinese Comedy Society! A bilingual community for comedy enthusiasts.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/events" className="btn btn-primary">
                查看活动 View Events
              </Link>
              <Link href="/posts" className="btn btn-outline">
                阅读文章 Read Posts
              </Link>
              <Link href="/library" className="btn btn-primary">
                下载资料 Access Library
              </Link>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}