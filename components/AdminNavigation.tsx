'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isSuperAdmin } from '@/lib/permissions'

export default function AdminNavigation() {
  const pathname = usePathname()
  const { userRole } = useAuth()

  const navItems = [
    {
      href: '/admin/dashboard',
      label: '仪表板 Dashboard',
      className: 'btn btn-outline',
      visible: true
    },
    {
      href: '/admin/posts/create',
      label: '发布文章 Create Post',
      className: 'btn primary-orange',
      visible: true
    },
    {
      href: '/admin/events/create',
      label: '创建活动 Create Event',
      className: 'btn bg-black hover:bg-gray-800 text-white',
      visible: true
    },
    {
      href: '/admin/files',
      label: '文件管理 File Management',
      className: 'btn bg-orange-600 hover:bg-orange-700 text-white',
      visible: true
    },
    {
      href: '/admin/manage-admins',
      label: '管理员管理 Admin Management',
      className: 'btn bg-red-600 hover:bg-red-700 text-white',
      visible: isSuperAdmin(userRole) // 只有超级管理员可见
    }
  ]

  const visibleItems = navItems.filter(item => item.visible)

  return (
    <div className="flex gap-4 flex-wrap">
      {visibleItems.map((item) => (
        <Link 
          key={item.href}
          href={item.href} 
          className={`${item.className} ${pathname === item.href ? 'btn-active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}