'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

      if (error) throw error

      await refreshProfile()
      setEditing(false)
      setMessage('个人资料更新成功！ Profile updated successfully!')
    } catch (error: any) {
      setMessage(`更新失败：${error.message} Update failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'badge-error'
      case 'member':
        return 'badge-success'
      default:
        return 'badge-neutral'
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理员 - 拥有所有权限 Administrator - Full access'
      case 'member':
        return '会员 - 可以下载文件和发表评论 Member - Can download files and post comments'
      default:
        return '访客 - 仅可浏览内容 Guest - View content only'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold mb-4">
            需要登录 Login Required
          </h1>
          <a href="/auth/login" className="btn btn-primary">
            登录 Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8">
        个人资料 Profile
      </h1>

      {message && (
        <div className={`alert ${message.includes('成功') || message.includes('successfully') ? 'alert-success' : 'alert-error'} mb-6`}>
          <span>{message}</span>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-8">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-20">
                <span className="text-3xl">
                  {profile?.full_name?.[0] || profile?.email?.[0] || 'U'}
                </span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {profile?.full_name || '未设置姓名 No name set'}
              </h2>
              <p className="text-base-content/70">{profile?.email}</p>
              <div className={`badge ${getRoleBadgeColor(profile?.role || 'guest')} mt-2`}>
                {profile?.role?.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Role Information */}
          <div className="card bg-base-200 mb-6">
            <div className="card-body">
              <h3 className="card-title text-lg">
                角色权限 Role Permissions
              </h3>
              <p className="text-base-content/80">
                {getRoleDescription(profile?.role || 'guest')}
              </p>
              
              <div className="mt-4">
                <h4 className="font-semibold mb-2">权限列表 Permissions:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li className="text-green-600">✓ 查看文章和活动 View posts and events</li>
                  {(profile?.role === 'member' || profile?.role === 'admin') && (
                    <>
                      <li className="text-green-600">✓ 下载PDF文件 Download PDF files</li>
                      <li className="text-green-600">✓ 发表评论 Post comments</li>
                    </>
                  )}
                  {profile?.role === 'admin' && (
                    <>
                      <li className="text-green-600">✓ 管理内容 Manage content</li>
                      <li className="text-green-600">✓ 管理用户 Manage users</li>
                    </>
                  )}
                  {profile?.role === 'guest' && (
                    <>
                      <li className="text-red-600">✗ 下载文件 Download files</li>
                      <li className="text-red-600">✗ 发表评论 Post comments</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">
              基本信息 Basic Information
            </h3>

            {editing ? (
              <form onSubmit={handleUpdateProfile}>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">姓名 Full Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="输入您的姓名 Enter your name"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">邮箱 Email</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered"
                    value={profile?.email || ''}
                    disabled
                  />
                  <label className="label">
                    <span className="label-text-alt">邮箱不可修改 Email cannot be changed</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">角色 Role</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={profile?.role || 'guest'}
                    disabled
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      请联系管理员更改角色 Contact admin to change role
                    </span>
                  </label>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    className={`btn btn-primary ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? '保存中... Saving...' : '保存 Save'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setEditing(false)
                      setFullName(profile?.full_name || '')
                    }}
                  >
                    取消 Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-base-content/70">姓名 Full Name</label>
                  <p className="text-lg">{profile?.full_name || '未设置 Not set'}</p>
                </div>
                <div>
                  <label className="text-sm text-base-content/70">邮箱 Email</label>
                  <p className="text-lg">{profile?.email}</p>
                </div>
                <div>
                  <label className="text-sm text-base-content/70">角色 Role</label>
                  <p className="text-lg">{profile?.role}</p>
                </div>
                <div>
                  <label className="text-sm text-base-content/70">注册时间 Member Since</label>
                  <p className="text-lg">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('zh-CN') : 'Unknown'}
                  </p>
                </div>

                <button
                  className="btn btn-outline"
                  onClick={() => setEditing(true)}
                >
                  编辑资料 Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Membership Upgrade Notice */}
      {profile?.role === 'guest' && (
        <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content mt-6">
          <div className="card-body">
            <h3 className="card-title">
              升级为会员 Upgrade to Member
            </h3>
            <p>
              成为会员即可享受更多功能：下载PDF资源、参与讨论等。
              <br />
              Become a member to unlock more features: download PDFs, participate in discussions.
            </p>
            <div className="card-actions justify-end">
              <div className="btn btn-accent">
                联系管理员 Contact Admin
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}