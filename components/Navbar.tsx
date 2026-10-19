'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getRoleDisplayName, isAdmin, isMember, canAccessAdminArea } from '@/lib/permissions'

export default function Navbar() {
  const { user, profile, userRole, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="navbar bg-base-100 shadow-lg flex-wrap xl:flex-nowrap items-start xl:items-center gap-y-2">
      <div className="navbar-start w-full xl:w-auto">
        <div className="dropdown">
          <div 
            tabIndex={0} 
            role="button" 
            className="btn btn-ghost xl:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
            </svg>
          </div>
          {isMenuOpen && (
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li><Link href="/">首页 / Home</Link></li>
              <li><Link href="/posts">文章 / Posts</Link></li>
              <li><Link href="/events">活动 / Events</Link></li>
              <li><Link href="/library">资料库 / Library</Link></li>
              {isMember(userRole) && (
                <li><Link href="/files">文件 / Files</Link></li>
              )}
              {canAccessAdminArea(userRole) && (
                <li><Link href="/admin/dashboard">后台 / Admin</Link></li>
              )}
            </ul>
          )}
        </div>
        <Link href="/" className="btn btn-ghost text-sm sm:text-base xl:text-xl px-2 sm:px-3 leading-tight whitespace-normal">Chinese Comedy Society</Link>
      </div>
      
      <div className="navbar-center hidden xl:flex">
        <ul className="menu menu-horizontal px-1 flex-nowrap whitespace-nowrap">
          <li><Link href="/">首页 / Home</Link></li>
          <li><Link href="/posts">文章 / Posts</Link></li>
          <li><Link href="/events">活动 / Events</Link></li>
          <li><Link href="/library">资料库 / Library</Link></li>
          {isMember(userRole) && (
            <li><Link href="/files">文件 / Files</Link></li>
          )}
          {canAccessAdminArea(userRole) && (
            <li><Link href="/admin/dashboard">后台 / Admin</Link></li>
          )}
        </ul>
      </div>
      
      <div className="navbar-end w-full xl:w-auto justify-end shrink-0">
        {user ? (
          <div className="dropdown dropdown-end">
            {/* daisyUI 的 .avatar > div 默认是 display:block，所以原来的 flex 居中不生效；
                加上 placeholder 才会变成 flex 并居中 */}
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
              <div className="w-10 rounded-full bg-primary text-primary-content ring-2 ring-primary/20 ring-offset-2 ring-offset-base-100">
                <span className="text-base font-semibold leading-none select-none">
                  {(profile?.full_name?.trim() || user.email || '?').charAt(0).toUpperCase()}
                </span>
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
              <li><Link href="/profile">设置 / Profile</Link></li>
              {isAdmin(userRole) && (
                <li><Link href="/admin/users">用户 / Users</Link></li>
              )}
              <li><button onClick={signOut}>登出 / Logout</button></li>
            </ul>
          </div>
        ) : (
          <div className="flex w-full justify-end gap-2">
            <Link href="/auth/login" className="btn btn-ghost btn-sm text-xs sm:text-sm whitespace-nowrap">登录<span className="hidden sm:inline">&nbsp;/ Login</span></Link>
            <Link href="/auth/register" className="btn btn-primary btn-sm text-xs sm:text-sm whitespace-nowrap">注册<span className="hidden sm:inline">&nbsp;/ Register</span></Link>
          </div>
        )}
      </div>
    </div>
  )
}