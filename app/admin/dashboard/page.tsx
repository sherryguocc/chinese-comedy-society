'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database'
import AdminLayout from '@/components/AdminLayout'
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

  // Load users for admin
  const fetchUsers = async () => {
    try {
      setError(null)
      setLoading(true)

      console.log('Admin Dashboard: Fetching users...')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Admin Dashboard: Query result', {
        data,
        error,
        dataLength: data?.length || 0
      })

      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      console.error('Admin Dashboard: Fetch users error', error)
      setError(`获取用户列表失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Promote to member
  const upgradeToMember = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'member' })
        .eq('id', userId)
      if (error) throw error

      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: 'member' } : u)))
      alert('用户已升级为会员 User upgraded to member successfully!')
    } catch (e) {
      console.error('Error upgrading user:', e)
      alert('升级失败 Upgrade failed')
    }
  }

  // Demote to guest
  const downgradeToGuest = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'guest' })
        .eq('id', userId)
      if (error) throw error

      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: 'guest' } : u)))
      alert('用户已降级为访客 User downgraded to guest successfully!')
    } catch (e) {
      console.error('Error downgrading user:', e)
      alert('降级失败 Downgrade failed')
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">权限不足 Access Denied</h1>
        <p className="mt-4">您没有访问管理后台的权限。</p>
        <p>You don't have permission to access the admin dashboard.</p>
      </div>
    )
  }

  return (
    <AdminLayout>
      

      {/* User management */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">用户管理 User Management</h2>

          {/* 开发模式调试信息 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="alert alert-info mb-4">
              <div className="text-sm">
                <div>Debug: Users Array Length = {users.length}</div>
                <div>Debug: Loading = {loading.toString()}</div>
                <div>Debug: Error = {error || 'null'}</div>
                <div>Debug: Profile Role = {profile?.role}</div>
              </div>
            </div>
          )}

          {error ? (
            <div className="alert alert-error">
              <span>{error}</span>
              <button onClick={fetchUsers} className="btn btn-sm">重试 Retry</button>
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
                            <div className="user-avatar user-avatar-sm">
                              {user.full_name?.[0]?.toUpperCase() ||
                               user.username?.[0]?.toUpperCase() ||
                               user.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-sm">
                              {user.full_name || '未设置姓名'}
                            </div>
                            {user.username && (
                              <div className="text-xs text-gray-500">@{user.username}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-sm">{user.email}</td>
                      <td className="text-sm">{user.username || '未设置'}</td>
                      <td className="text-sm">{user.phone_number || '未设置'}</td>
                      <td>
                        <div className={`badge ${
                          user.role === 'admin' ? 'badge-error'
                            : user.role === 'member' ? 'badge-warning'
                            : 'badge-neutral'
                        }`}>
                          {user.role}
                        </div>
                      </td>
                      <td className="text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2">
                          {user.role === 'guest' && (
                            <button onClick={() => upgradeToMember(user.id)} className="btn btn-sm primary-orange">
                              升级会员 Upgrade
                            </button>
                          )}
                          {user.role === 'member' && (
                            <button onClick={() => downgradeToGuest(user.id)} className="btn btn-sm btn-outline">
                              降级访客 Downgrade
                            </button>
                          )}
                          {user.role === 'admin' && (
                            <span className="text-sm text-gray-500">仅可在Supabase后台修改</span>
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

      {/* Quick stats */}
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
    </AdminLayout>
  )
}

