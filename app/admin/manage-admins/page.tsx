'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { SuperAdminOnly } from '@/components/PermissionGuard'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'
import { Profile, Admin, AdminPermissions } from '@/types/database'

interface AdminWithProfile extends Admin {
  created_by_admin?: Admin
}

export default function ManageAdminsPage() {
  const { userRole, admin: currentAdmin } = useAuth()
  const [admins, setAdmins] = useState<AdminWithProfile[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null)
  const [promotingMember, setPromotingMember] = useState(false)

  // 默认管理员权限
  const defaultPermissions: AdminPermissions = {
    manage_users: true,
    manage_posts: true,
    manage_events: true,
    manage_files: true,
    manage_admins: false,
    system_settings: false
  }

  const [newAdminPermissions, setNewAdminPermissions] = useState<AdminPermissions>(defaultPermissions)

  useEffect(() => {
    fetchAdmins()
    fetchMembers()
  }, [])

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select(`
          *,
          created_by_admin:created_by(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAdmins(data || [])
    } catch (err: any) {
      console.error('Error fetching admins:', err)
      setError('获取管理员列表失败')
    }
  }

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'member')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMembers(data || [])
    } catch (err: any) {
      console.error('Error fetching members:', err)
      setError('获取会员列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePromoteMember = async () => {
    if (!selectedMember || !currentAdmin) return

    setPromotingMember(true)
    try {
      // 1. 创建管理员记录
      const { error: insertError } = await supabase
        .from('admins')
        .insert({
          id: selectedMember.id,
          email: selectedMember.email,
          full_name: selectedMember.full_name,
          permissions: newAdminPermissions,
          created_by: currentAdmin.id,
          is_super_admin: false
        })

      if (insertError) throw insertError

      // 2. 从 profiles 表删除该用户记录
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedMember.id)

      if (deleteError) throw deleteError

      // 刷新列表
      await fetchAdmins()
      await fetchMembers()
      
      // 关闭模态框
      setShowPromoteModal(false)
      setSelectedMember(null)
      setNewAdminPermissions(defaultPermissions)
      
      alert('成功升级为管理员!')
    } catch (err: any) {
      console.error('Error promoting member:', err)
      alert('升级失败: ' + err.message)
    } finally {
      setPromotingMember(false)
    }
  }

  const handleDemoteAdmin = async (adminToDemote: Admin) => {
    if (!currentAdmin || adminToDemote.is_super_admin) {
      alert('无法降级超级管理员')
      return
    }

    if (!confirm(`确定要将 ${adminToDemote.full_name || adminToDemote.email} 降级为会员吗？`)) {
      return
    }

    try {
      // 1. 创建 profile 记录
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: adminToDemote.id,
          email: adminToDemote.email,
          full_name: adminToDemote.full_name,
          role: 'member'
        })

      if (insertError) throw insertError

      // 2. 删除管理员记录
      const { error: deleteError } = await supabase
        .from('admins')
        .delete()
        .eq('id', adminToDemote.id)

      if (deleteError) throw deleteError

      // 刷新列表
      await fetchAdmins()
      await fetchMembers()
      
      alert('已降级为会员!')
    } catch (err: any) {
      console.error('Error demoting admin:', err)
      alert('降级失败: ' + err.message)
    }
  }

  const updateAdminPermissions = async (adminToUpdate: Admin, newPermissions: AdminPermissions) => {
    if (!currentAdmin || adminToUpdate.is_super_admin) {
      alert('无法修改超级管理员权限')
      return
    }

    try {
      const { error } = await supabase
        .from('admins')
        .update({ 
          permissions: newPermissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminToUpdate.id)

      if (error) throw error

      await fetchAdmins()
      alert('权限更新成功!')
    } catch (err: any) {
      console.error('Error updating permissions:', err)
      alert('权限更新失败: ' + err.message)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <SuperAdminOnly
      fallback={
        <AdminLayout>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-red-600">访问被拒绝</h1>
            <p className="mt-4">只有超级管理员可以访问此页面</p>
          </div>
        </AdminLayout>
      }
    >
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">管理员管理</h1>
            <p className="text-gray-600 mt-2">管理系统管理员和权限设置</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {/* 现有管理员列表 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">现有管理员</h2>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>邮箱</th>
                      <th>权限</th>
                      <th>创建时间</th>
                      <th>创建者</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            {admin.full_name || '未设置'}
                            {admin.is_super_admin && (
                              <span className="badge badge-error">超级管理员</span>
                            )}
                          </div>
                        </td>
                        <td>{admin.email}</td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(admin.permissions).map(([key, value]) => 
                              value && (
                                <span key={key} className="badge badge-sm">
                                  {key.replace('_', ' ')}
                                </span>
                              )
                            )}
                          </div>
                        </td>
                        <td>{new Date(admin.created_at).toLocaleDateString('zh-CN')}</td>
                        <td>{admin.created_by_admin?.full_name || admin.created_by_admin?.email || '系统'}</td>
                        <td>
                          {!admin.is_super_admin && (
                            <div className="flex gap-2">
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  const newPerms = { ...admin.permissions }
                                  setNewAdminPermissions(newPerms)
                                  // 这里可以打开权限编辑模态框
                                }}
                              >
                                编辑权限
                              </button>
                              <button 
                                className="btn btn-sm btn-error"
                                onClick={() => handleDemoteAdmin(admin)}
                              >
                                降级
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 会员升级区域 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">升级会员为管理员</h2>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>邮箱</th>
                      <th>加入时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td>{member.full_name || '未设置'}</td>
                        <td>{member.email}</td>
                        <td>{new Date(member.created_at).toLocaleDateString('zh-CN')}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => {
                              setSelectedMember(member)
                              setShowPromoteModal(true)
                            }}
                          >
                            升级为管理员
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 升级确认模态框 */}
          {showPromoteModal && selectedMember && (
            <div className="modal modal-open">
              <div className="modal-box">
                <h3 className="font-bold text-lg">升级会员为管理员</h3>
                <p className="py-4">
                  确定要将 <strong>{selectedMember.full_name || selectedMember.email}</strong> 升级为管理员吗？
                </p>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">设置权限：</h4>
                  {Object.entries(defaultPermissions).map(([key, defaultValue]) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={newAdminPermissions[key as keyof AdminPermissions] || false}
                        onChange={(e) => {
                          setNewAdminPermissions(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))
                        }}
                      />
                      <span>{key.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>

                <div className="modal-action">
                  <button 
                    className="btn"
                    onClick={() => {
                      setShowPromoteModal(false)
                      setSelectedMember(null)
                      setNewAdminPermissions(defaultPermissions)
                    }}
                  >
                    取消
                  </button>
                  <button 
                    className="btn btn-success"
                    onClick={handlePromoteMember}
                    disabled={promotingMember}
                  >
                    {promotingMember ? '升级中...' : '确认升级'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </SuperAdminOnly>
  )
}