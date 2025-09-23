'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminNavigation() {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/admin/dashboard',
      label: '仪表板 Dashboard',
      className: 'btn btn-outline'
    },
    {
      href: '/admin/posts/create',
      label: '发布文章 Create Post',
      className: 'btn primary-orange'
    },
    {
      href: '/admin/events/create',
      label: '创建活动 Create Event',
      className: 'btn bg-black hover:bg-gray-800 text-white'
    },
    {
      href: '/admin/files',
      label: '文件管理 File Management',
      className: 'btn bg-orange-600 hover:bg-orange-700 text-white'
    }
  ]

  return (
    <div className="flex gap-4 flex-wrap">
      {navItems.map((item) => (
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