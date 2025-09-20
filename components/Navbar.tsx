'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()

  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><Link href="/">首页 Home</Link></li>
            <li><Link href="/posts">文章 Posts</Link></li>
            <li><Link href="/library">资料库 Library</Link></li>
            <li><Link href="/events">活动 Events</Link></li>
            {user && <li><Link href="/profile">个人 Profile</Link></li>}
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost text-xl">
          华人喜剧协会 Chinese Comedy Society
        </Link>
      </div>
      
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link href="/">首页 Home</Link></li>
          <li><Link href="/posts">文章 Posts</Link></li>
          <li><Link href="/library">资料库 Library</Link></li>
          <li><Link href="/events">活动 Events</Link></li>
          {user && <li><Link href="/profile">个人 Profile</Link></li>}
        </ul>
      </div>
      
      <div className="navbar-end">
        {user ? (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                {profile?.full_name?.[0] || profile?.email?.[0] || 'U'}
              </div>
            </div>
            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li>
                <span className="text-sm">
                  {profile?.full_name || profile?.email}
                  <div className="badge badge-sm badge-outline">{profile?.role}</div>
                </span>
              </li>
              <li><Link href="/profile">个人资料 Profile</Link></li>
              <li><button onClick={signOut}>退出登录 Sign Out</button></li>
            </ul>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/auth/login" className="btn btn-ghost">
              登录 Login
            </Link>
            <Link href="/auth/register" className="btn btn-primary">
              注册 Register
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}