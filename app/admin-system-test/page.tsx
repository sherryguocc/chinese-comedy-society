'use client'

import { useAuth } from '@/contexts/AuthContext'
import { isAdmin, isSuperAdmin } from '@/lib/permissions'

export default function AdminSystemTestPage() {
  const { user, profile, admin, userRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">管理员系统测试页面</h1>
      
      <div className="grid gap-6">
        {/* 用户基本信息 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">用户基本信息</h2>
            <div className="space-y-2">
              <p><strong>登录状态:</strong> {user ? '已登录' : '未登录'}</p>
              <p><strong>用户ID:</strong> {user?.id || '无'}</p>
              <p><strong>邮箱:</strong> {user?.email || '无'}</p>
              <p><strong>当前角色:</strong> <span className="badge badge-primary">{userRole || '无'}</span></p>
            </div>
          </div>
        </div>

        {/* Profile 信息 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Profile 信息 (会员/访客)</h2>
            {profile ? (
              <div className="space-y-2">
                <p><strong>ID:</strong> {profile.id}</p>
                <p><strong>邮箱:</strong> {profile.email}</p>
                <p><strong>姓名:</strong> {profile.full_name || '未设置'}</p>
                <p><strong>角色:</strong> <span className="badge badge-secondary">{profile.role}</span></p>
                <p><strong>创建时间:</strong> {new Date(profile.created_at).toLocaleDateString('zh-CN')}</p>
              </div>
            ) : (
              <p className="text-gray-500">无 Profile 数据 (用户可能是管理员)</p>
            )}
          </div>
        </div>

        {/* Admin 信息 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Admin 信息 (管理员)</h2>
            {admin ? (
              <div className="space-y-2">
                <p><strong>ID:</strong> {admin.id}</p>
                <p><strong>邮箱:</strong> {admin.email}</p>
                <p><strong>姓名:</strong> {admin.full_name || '未设置'}</p>
                <p><strong>超级管理员:</strong> 
                  <span className={`badge ${admin.is_super_admin ? 'badge-error' : 'badge-warning'}`}>
                    {admin.is_super_admin ? '是' : '否'}
                  </span>
                </p>
                <p><strong>创建时间:</strong> {new Date(admin.created_at).toLocaleDateString('zh-CN')}</p>
                <p><strong>创建者:</strong> {admin.created_by || '系统'}</p>
                <div>
                  <strong>权限:</strong>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(admin.permissions).map(([key, value]) => (
                      <span 
                        key={key} 
                        className={`badge ${value ? 'badge-success' : 'badge-outline'}`}
                      >
                        {key.replace('_', ' ')}: {value ? '✓' : '✗'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">无 Admin 数据 (用户不是管理员)</p>
            )}
          </div>
        </div>

        {/* 权限检查 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">权限检查</h2>
            <div className="space-y-2">
              <p><strong>是否为管理员:</strong> 
                <span className={`badge ${isAdmin(userRole) ? 'badge-success' : 'badge-outline'}`}>
                  {isAdmin(userRole) ? '是' : '否'}
                </span>
              </p>
              <p><strong>是否为超级管理员:</strong> 
                <span className={`badge ${isSuperAdmin(userRole) ? 'badge-error' : 'badge-outline'}`}>
                  {isSuperAdmin(userRole) ? '是' : '否'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* 导航测试 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">导航测试</h2>
            <div className="space-y-4">
              <div>
                <p className="mb-2">普通用户页面:</p>
                <div className="space-x-2">
                  <a href="/posts" className="btn btn-sm btn-outline">文章列表</a>
                  <a href="/events" className="btn btn-sm btn-outline">活动列表</a>
                  <a href="/files" className="btn btn-sm btn-outline">文件下载</a>
                </div>
              </div>
              
              {isAdmin(userRole) && (
                <div>
                  <p className="mb-2">管理员页面:</p>
                  <div className="space-x-2">
                    <a href="/admin/dashboard" className="btn btn-sm btn-primary">管理面板</a>
                    <a href="/admin/posts/create" className="btn btn-sm btn-primary">创建文章</a>
                    <a href="/admin/events/create" className="btn btn-sm btn-primary">创建活动</a>
                    <a href="/admin/files" className="btn btn-sm btn-primary">文件管理</a>
                  </div>
                </div>
              )}
              
              {isSuperAdmin(userRole) && (
                <div>
                  <p className="mb-2">超级管理员页面:</p>
                  <div className="space-x-2">
                    <a href="/admin/manage-admins" className="btn btn-sm btn-error">管理员管理</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}