'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database'
import { AdminOnly } from '@/components/PermissionGuard'
import Link from 'next/link'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchUsers()
    }
  }, [profile])

  const fetchUsers = async () => {
    try {
      setError(null)
      setLoading(true)
      console.log('开始获取用户列表...')
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('获取用户列表时出错:', error)
        throw error
      }

      console.log('成功获取用户列表:', data)
      // 调试：检查用户数据结构
      if (data && data.length > 0) {
        console.log('用户数据字段:', Object.keys(data[0]))
      }
      setUsers(data || [])
    } catch (error: any) {
      console.error('获取用户列表失败 Error fetching users:', error)
      setError(`获取用户列表失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const upgradeToMember = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'member' })
        .eq('id', userId)

      if (error) throw error
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: 'member' } : user
      ))
      
      alert('用户已升级为会员 User upgraded to member successfully!')
    } catch (error) {
      console.error('升级用户失败 Error upgrading user:', error)
      alert('升级失败 Upgrade failed')
    }
  }

  const downgradeToGuest = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'guest' })
        .eq('id', userId)

      if (error) throw error
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: 'guest' } : user
      ))
      
      alert('用户已降级为访客 User downgraded to guest successfully!')
    } catch (error) {
      console.error('降级用户失败 Error downgrading user:', error)
      alert('降级失败 Downgrade failed')
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">
          权限不足 Access Denied
        </h1>
        <p className="mt-4">您没有访问管理后台的权限。</p>
        <p>You don't have permission to access the admin dashboard.</p>
      </div>
    )
  }

  return (
    <AdminOnly>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">管理后台 Admin Dashboard</h1>
          <div className="flex gap-4">
            <Link href="/admin/posts/create" className="btn primary-orange">
              发布文章 Create Post
            </Link>
            <Link href="/admin/events/create" className="btn bg-black hover:bg-gray-800 text-white">
              创建活动 Create Event
            </Link>
          </div>
        </div>

        {/* 用户管理 User Management */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">用户管理 User Management</h2>
            
            {error ? (
              <div className="alert alert-error">
                <span>{error}</span>
                <button 
                  onClick={fetchUsers} 
                  className="btn btn-sm"
                >
                  重试 Retry
                </button>
              </div>
            ) : loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>用户 User</th>
                      <th>邮箱 Email</th>
                      <th>用户名 Username</th>
                      <th>电话 Phone</th>
                      <th>角色 Role</th>
                      <th>注册时间 Created</th>
                      <th>操作 Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="flex items-center space-x-3">
                            <div className="avatar">
                              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm">
                                {user.full_name?.[0] || user.username?.[0] || user.email?.[0] || 'U'}
                              </div>
                            </div>
                            <div>
                              <div className="font-bold text-sm">
                                {user.full_name || '未设置姓名'}
                              </div>
                              {user.username && (
                                <div className="text-xs text-gray-500">
                                  @{user.username}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-sm">{user.email}</td>
                        <td className="text-sm">{user.username || '未设置'}</td>
                        <td className="text-sm">{user.phone_number || '未设置'}</td>
                        <td>
                          <div className={`badge ${
                            user.role === 'admin' ? 'badge-error' :
                            user.role === 'member' ? 'badge-warning' : 'badge-neutral'
                          }`}>
                            {user.role}
                          </div>
                        </td>
                        <td className="text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="flex gap-2">
                            {user.role === 'guest' && (
                              <button 
                                onClick={() => upgradeToMember(user.id)}
                                className="btn btn-sm primary-orange"
                              >
                                升级会员 Upgrade
                              </button>
                            )}
                            {user.role === 'member' && (
                              <button 
                                onClick={() => downgradeToGuest(user.id)}
                                className="btn btn-sm btn-outline"
                              >
                                降级访客 Downgrade
                              </button>
                            )}
                            {user.role === 'admin' && (
                              <span className="text-sm text-gray-500">
                                仅可在Supabase后台修改
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-base-200 rounded-lg">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-bold mb-2">暂无用户</h3>
                <p className="text-base-content/60">
                  还没有用户注册，请等待用户注册后再来管理。
                  <br />
                  No users have registered yet. Please wait for users to register.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 快速统计 Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat bg-orange-500 text-white rounded-lg">
            <div className="stat-title text-orange-100">总用户 Total Users</div>
            <div className="stat-value">{users.length}</div>
          </div>
          <div className="stat bg-black text-white rounded-lg">
            <div className="stat-title text-gray-300">会员 Members</div>
            <div className="stat-value">{users.filter(u => u.role === 'member').length}</div>
          </div>
          <div className="stat bg-orange-600 text-white rounded-lg">
            <div className="stat-title text-orange-100">访客 Guests</div>
            <div className="stat-value">{users.filter(u => u.role === 'guest').length}</div>
          </div>
        </div>
      </div>
    </AdminOnly>
  )
}

