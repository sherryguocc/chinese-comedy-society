'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const [mounted, setMounted] = useState(false)
  const { user, profile, signOut, loading } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  // 在组件mounted之前显示简化版本
  if (!mounted || loading) {
    return (
      <div className="navbar bg-gradient-to-r from-black to-orange-900 shadow-lg">
        <div className="navbar-start">
          <Link href="/" className="flex items-center space-x-3 px-2">
            <img 
              src="/logo.png" 
              alt="华人喜剧协会 Chinese Comedy Society" 
              className="logo-circle"
            />
            <span className="text-white text-lg font-bold hidden sm:block">
              华人喜剧协会
            </span>
          </Link>
        </div>
        
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li><Link href="/" className="text-white hover:text-orange-300 border-0">首页 Home</Link></li>
            <li><Link href="/posts" className="text-white hover:text-orange-300 border-0">文章 Posts</Link></li>
            <li><Link href="/events" className="text-white hover:text-orange-300 border-0">活动 Events</Link></li>
            <li><Link href="/library" className="text-white hover:text-orange-300 border-0">资料库 Library</Link></li>
          </ul>
        </div>
        
        <div className="navbar-end">
          <div className="flex gap-2">
            <Link href="/auth/login" className="btn btn-ghost text-white hover:text-orange-300 border-0">
              登录 Login
            </Link>
            <Link href="/auth/register" className="btn bg-orange-500 hover:bg-orange-600 text-white border-0">
              注册 Register
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 如果已登录，显示完整导航
  return (
    <div className="navbar bg-gradient-to-r from-black to-orange-900 shadow-lg">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden text-white border-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><Link href="/">首页 Home</Link></li>
            <li><Link href="/posts">文章 Posts</Link></li>
            <li><Link href="/events">活动 Events</Link></li>
            <li><Link href="/library">资料库 Library</Link></li>
            {profile?.role === 'admin' && (
              <li><Link href="/admin/dashboard">管理后台 Admin</Link></li>
            )}
          </ul>
        </div>
        <Link href="/" className="flex items-center space-x-3 px-2">
          <img 
            src="/logo.png" 
            alt="华人喜剧协会 Chinese Comedy Society" 
            className="logo-circle"
          />
          <span className="text-white text-lg font-bold hidden sm:block">
            华人喜剧协会
          </span>
        </Link>
      </div>
      
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link href="/" className="text-white hover:text-orange-300 border-0">首页 Home</Link></li>
          <li><Link href="/posts" className="text-white hover:text-orange-300 border-0">文章 Posts</Link></li>
          <li><Link href="/events" className="text-white hover:text-orange-300 border-0">活动 Events</Link></li>
          <li><Link href="/library" className="text-white hover:text-orange-300 border-0">资料库 Library</Link></li>
          {profile?.role === 'admin' && (
            <li><Link href="/admin/dashboard" className="text-white hover:text-orange-300 border-0">管理后台 Admin</Link></li>
          )}
        </ul>
      </div>
      
      <div className="navbar-end">
        {user ? (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar border-0">
              <div className="w-10 rounded-full bg-orange-500 text-white flex items-center justify-center">
                {profile?.full_name?.[0] || profile?.username?.[0] || profile?.email?.[0] || 'U'}
              </div>
            </div>
            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li>
                <span className="text-sm">
                  <div className="font-semibold">
                    {profile?.full_name || profile?.username || profile?.email?.split('@')[0]}
                  </div>
                  {profile?.username && profile?.full_name && (
                    <div className="text-xs text-gray-500">@{profile.username}</div>
                  )}
                  {profile?.role && (
                    <div className="badge badge-sm badge-outline">{profile.role}</div>
                  )}
                </span>
              </li>
              <li><button onClick={signOut}>退出登录 Sign Out</button></li>
            </ul>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/auth/login" className="btn btn-ghost text-white hover:text-orange-300 border-0">
              登录 Login
            </Link>
            <Link href="/auth/register" className="btn bg-orange-500 hover:bg-orange-600 text-white border-0">
              注册 Register
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}