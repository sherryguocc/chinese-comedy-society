'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isSuperAdmin, hasPermission } from '@/lib/permissions'

export default function AdminNavigation() {
  const pathname = usePathname()
  const { userRole } = useAuth()

  const isActive = (path: string) => pathname === path

  const canCreatePosts = hasPermission(userRole, 'CREATE_POSTS')
  const canCreateEvents = hasPermission(userRole, 'CREATE_EVENTS')
  const canUploadFiles = hasPermission(userRole, 'UPLOAD_FILES')
  const canManageUsers = hasPermission(userRole, 'MANAGE_USERS')

  return (
    <aside className="w-64 min-h-screen bg-base-200 p-4">
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-2">管理后台</h2>
        <p className="text-sm text-base-content/60">
          {userRole === 'super_admin' ? '超级管理员' : '管理员'}
        </p>
      </div>

      <ul className="menu space-y-2">
        <li>
          <Link 
            href="/admin/dashboard" 
            className={isActive('/admin/dashboard') ? 'active' : ''}
          >
            🏠 仪表板
          </Link>
        </li>

        {canCreatePosts && (
          <li>
            <Link 
              href="/admin/posts/create" 
              className={isActive('/admin/posts/create') ? 'active' : ''}
            >
              📝 创建文章
            </Link>
          </li>
        )}

        {canCreateEvents && (
          <li>
            <Link 
              href="/admin/events/create" 
              className={isActive('/admin/events/create') ? 'active' : ''}
            >
              📅 创建活动
            </Link>
          </li>
        )}

        {canUploadFiles && (
          <li>
            <Link 
              href="/admin/files/upload" 
              className={isActive('/admin/files/upload') ? 'active' : ''}
            >
              📁 文件上传
            </Link>
          </li>
        )}

        {canManageUsers && (
          <li>
            <Link 
              href="/admin/users" 
              className={isActive('/admin/users') ? 'active' : ''}
            >
              👥 用户管理
            </Link>
          </li>
        )}

        <li><hr/></li>
        
        <li>
          <Link href="/" className="text-base-content/60">
            ← 返回网站
          </Link>
        </li>
      </ul>
    </aside>
  )
}