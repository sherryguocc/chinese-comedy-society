'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    phone_number: '',
    email: ''
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        phone_number: profile.phone_number || '',
        email: profile.email || ''
      })
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null,
          username: formData.username || null,
          phone_number: formData.phone_number || null,
        })
        .eq('id', user.id)

      if (error) throw error

      await refreshProfile()
      alert('个人资料更新成功！Profile updated successfully!')
    } catch (error: any) {
      console.error('更新个人资料失败:', error)
      alert(`更新失败 Update failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">请先登录</h1>
        <p>Please login to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl mb-6">
            个人资料 Personal Profile
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 用户头像区域 */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="avatar">
                <div className="w-20 h-20 rounded-full bg-orange-500 text-white flex items-center justify-center text-2xl">
                  {formData.full_name?.[0] || formData.username?.[0] || formData.email?.[0] || 'U'}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {formData.full_name || formData.username || '未设置姓名'}
                </h2>
                <div className="badge badge-outline">{profile?.role}</div>
              </div>
            </div>

            {/* 邮箱 (只读) */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">邮箱 Email</span>
              </label>
              <input
                type="email"
                value={formData.email}
                className="input input-bordered bg-gray-100"
                disabled
              />
              <label className="label">
                <span className="label-text-alt text-gray-500">邮箱地址无法修改</span>
              </label>
            </div>

            {/* 姓名 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">姓名 Full Name</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="input input-bordered"
                placeholder="请输入您的姓名"
              />
            </div>

            {/* 用户名 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">用户名 Username</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input input-bordered"
                placeholder="请输入用户名"
              />
              <label className="label">
                <span className="label-text-alt">用户名将显示在您的文章和评论中</span>
              </label>
            </div>

            {/* 电话号码 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">电话号码 Phone Number</span>
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="input input-bordered"
                placeholder="请输入电话号码"
              />
            </div>

            {/* 账户信息 */}
            <div className="divider">账户信息 Account Info</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">用户ID:</span>
                <div className="font-mono text-xs">{user.id}</div>
              </div>
              <div>
                <span className="text-gray-500">注册时间:</span>
                <div>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '未知'}</div>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="card-actions justify-end mt-8">
              <button
                type="submit"
                disabled={loading}
                className="btn primary-orange"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    更新中...
                  </>
                ) : (
                  '更新资料 Update Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}