'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin, isSuperAdmin } from '@/lib/permissions'

export default function Navbar() {
  const { user, userRole, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      guest: '访客',
      member: '会员',
      admin: '管理员',
      super_admin: '超级管理员'
    }
    return roleNames[role as keyof typeof roleNames] || role
  }

  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="navbar-start">
        <div className="dropdown">
          <div 
            tabIndex={0} 
            role="button" 
            className="btn btn-ghost lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
            </svg>
          </div>
          {isMenuOpen && (
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li><Link href="/">首页 Home</Link></li>
              <li><Link href="/posts">文章 Posts</Link></li>
              <li><Link href="/events">活动 Events</Link></li>
              <li><Link href="/library">资料库 Library</Link></li>
              {['member', 'admin', 'super_admin'].includes(userRole || '') && (
                <li><Link href="/files">文件 Files</Link></li>
              )}
              {isAdmin(userRole) && (
                <li><Link href="/admin/dashboard">管理后台 Admin</Link></li>
              )}
            </ul>
          )}
        </div>
        <Link href="/" className="btn btn-ghost text-xl">Chinese Comedy Society</Link>
      </div>
      
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link href="/">首页 Home</Link></li>
          <li><Link href="/posts">文章 Posts</Link></li>
          <li><Link href="/events">活动 Events</Link></li>
          <li><Link href="/library">资料库 Library</Link></li>
          {['member', 'admin', 'super_admin'].includes(userRole || '') && (
            <li><Link href="/files">文件 Files</Link></li>
          )}
          {isAdmin(userRole) && (
            <li><Link href="/admin/dashboard">管理后台 Admin</Link></li>
          )}
        </ul>
      </div>
      
      <div className="navbar-end">
        {user ? (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            </div>
            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li className="disabled">
                <span className="text-xs">
                  {user.email}<br/>
                  <span className="badge badge-outline badge-xs">
                    {getRoleDisplayName(userRole || 'guest')}
                  </span>
                </span>
              </li>
              <li><hr/></li>
              <li><Link href="/profile">个人设置 Profile</Link></li>
              {isSuperAdmin(userRole) && (
                <li><Link href="/admin/users">用户管理 Users</Link></li>
              )}
              <li><button onClick={signOut}>登出 Logout</button></li>
            </ul>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/auth/login" className="btn btn-ghost">登录 Login</Link>
            <Link href="/auth/register" className="btn btn-primary">注册 Register</Link>
          </div>
        )}
      </div>
    </div>
  )
}