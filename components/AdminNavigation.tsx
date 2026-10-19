'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { hasPermission, getRoleDisplayName } from '@/lib/permissions'

type NavItem = { href: string; label: string; icon: string; show: boolean }

export default function AdminNavigation() {
  const pathname = usePathname()
  const { userRole } = useAuth()

  const items: NavItem[] = [
    { href: '/admin/dashboard', label: '仪表板 Dashboard', icon: '🏠', show: true },
    { href: '/admin/posts/create', label: '创建文章 New Post', icon: '📝', show: hasPermission(userRole, 'CREATE_POSTS') },
    { href: '/admin/events/create', label: '创建活动 New Event', icon: '📅', show: hasPermission(userRole, 'CREATE_EVENTS') },
    { href: '/admin/files', label: '文件管理 Files', icon: '📁', show: hasPermission(userRole, 'UPLOAD_FILES') },
    { href: '/admin/users', label: '用户管理 Users', icon: '👥', show: hasPermission(userRole, 'MANAGE_USERS') },
  ]

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  return (
    // 大屏：左侧固定宽度侧栏；小屏：顶部可横向滚动的菜单
    <aside className="lg:w-56 shrink-0">
      <div className="hidden lg:block mb-4 px-2">
        <h2 className="text-lg font-bold">管理后台</h2>
        <p className="text-sm text-base-content/60">{getRoleDisplayName(userRole || 'guest')}</p>
      </div>

      <ul className="menu menu-horizontal lg:menu-vertical flex-nowrap overflow-x-auto w-full bg-base-200 rounded-box p-2 gap-1 whitespace-nowrap">
        {items.filter(i => i.show).map(item => (
          <li key={item.href}>
            <Link href={item.href} className={isActive(item.href) ? 'active' : ''}>
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          </li>
        ))}
        <li className="hidden lg:block mt-2 border-t border-base-300 pt-2">
          <Link href="/" className="text-base-content/60">← 返回网站 Back to site</Link>
        </li>
      </ul>
    </aside>
  )
}
