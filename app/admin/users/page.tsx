'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { getRoleDisplayName, isAdmin, isSuperAdmin } from '@/lib/permissions'
import AdminLayout from '@/components/AdminLayout'
import type { UserRole } from '@/types/database'

type UserRow = {
  id: string
  email: string
  full_name?: string | null
  username?: string | null
  role: UserRole
  created_at: string
}

type Filter = 'guest' | 'member' | 'admin' | 'all'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'guest', label: '待审批 Pending' },
  { key: 'member', label: '会员 Members' },
  { key: 'admin', label: '管理员 Admins' },
  { key: 'all', label: '全部 All' },
]

const ROLE_BADGE: Record<UserRole, string> = {
  guest: 'badge-ghost',
  member: 'badge-success',
  admin: 'badge-info',
  super_admin: 'badge-primary',
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NZ', { day: '2-digit', month: '2-digit', year: 'numeric' })

async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }
}

export default function UserManagementPage() {
  const { user, userRole } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('guest')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const canManageAdmins = isSuperAdmin(userRole)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', { headers: await authHeaders() })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
      setUsers(body.users)
    } catch (err: any) {
      setMessage({ type: 'error', text: `加载用户失败 Failed to load users: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin(userRole)) fetchUsers()
  }, [userRole])

  const changeRole = async (target: UserRow, newRole: UserRole, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return
    setBusyId(target.id)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/update-user-role', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ targetUserId: target.id, newRole }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
      setUsers(prev => prev.map(u => (u.id === target.id ? { ...u, role: newRole } : u)))
      setMessage({
        type: 'success',
        text: `${displayName(target)} → ${getRoleDisplayName(newRole)}`,
      })
    } catch (err: any) {
      setMessage({ type: 'error', text: `操作失败 Failed: ${err.message}` })
    } finally {
      setBusyId(null)
    }
  }

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { guest: 0, member: 0, admin: 0, all: users.length }
    users.forEach(u => {
      if (u.role === 'guest') c.guest++
      else if (u.role === 'member') c.member++
      else c.admin++
    })
    return c
  }, [users])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter(u => {
      const roleOk =
        filter === 'all' ||
        (filter === 'admin' ? u.role === 'admin' || u.role === 'super_admin' : u.role === filter)
      const searchOk =
        !q ||
        u.email?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q)
      return roleOk && searchOk
    })
  }, [users, filter, search])

  const renderActions = (u: UserRow) => {
    if (u.id === user?.id || u.role === 'super_admin') {
      return <span className="text-xs text-base-content/40">—</span>
    }
    const busy = busyId === u.id
    return (
      <div className="flex flex-wrap gap-2 justify-end">
        {u.role === 'guest' && (
          <button className="btn btn-success btn-sm" disabled={busy} onClick={() => changeRole(u, 'member')}>
            批准为会员 Approve
          </button>
        )}
        {u.role === 'member' && (
          <button
            className="btn btn-outline btn-sm"
            disabled={busy}
            onClick={() => changeRole(u, 'guest', `确定取消 ${displayName(u)} 的会员资格吗？\nRevoke membership?`)}
          >
            取消会员 Revoke
          </button>
        )}
        {u.role === 'member' && canManageAdmins && (
          <button
            className="btn btn-info btn-outline btn-sm"
            disabled={busy}
            onClick={() => changeRole(u, 'admin', `确定把 ${displayName(u)} 设为管理员吗？\nMake admin?`)}
          >
            设为管理员 Make admin
          </button>
        )}
        {u.role === 'admin' && canManageAdmins && (
          <button
            className="btn btn-warning btn-outline btn-sm"
            disabled={busy}
            onClick={() => changeRole(u, 'member', `确定撤销 ${displayName(u)} 的管理员权限吗？\nRemove admin?`)}
          >
            撤销管理员 Remove admin
          </button>
        )}
        {busy && <span className="loading loading-spinner loading-sm self-center"></span>}
      </div>
    )
  }

  return (
    <AdminLayout title="用户管理 User Management">
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-6`}>
          <span>{message.text}</span>
          <button className="btn btn-ghost btn-xs" onClick={() => setMessage(null)}>✕</button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div role="tablist" className="tabs tabs-boxed flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              role="tab"
              className={`tab ${filter === f.key ? 'tab-active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="ml-1 opacity-70">({counts[f.key]})</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          className="input input-bordered input-sm md:ml-auto md:w-64"
          placeholder="搜索姓名或邮箱 Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body p-0 sm:p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : visible.length === 0 ? (
            <p className="text-center py-12 text-base-content/60">
              {filter === 'guest' ? '没有待审批的用户 No pending users' : '没有匹配的用户 No users found'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>用户 User</th>
                    <th>角色 Role</th>
                    <th className="hidden sm:table-cell">注册时间 Joined</th>
                    <th className="text-right">操作 Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="font-medium">{u.full_name || u.username || '—'}</div>
                        <div className="text-xs text-base-content/60 break-all">{u.email}</div>
                      </td>
                      <td>
                        <span className={`badge ${ROLE_BADGE[u.role] ?? 'badge-ghost'} whitespace-nowrap`}>
                          {getRoleDisplayName(u.role)}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell text-sm whitespace-nowrap">{formatDate(u.created_at)}</td>
                      <td>{renderActions(u)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {!canManageAdmins && (
        <p className="text-sm text-base-content/60 mt-4">
          管理员可以批准或取消会员；任免管理员需要超级管理员操作。
        </p>
      )}
    </AdminLayout>
  )
}

function displayName(u: UserRow) {
  return u.full_name || u.username || u.email
}
