'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { hasPermission, canEditEvent } from '@/lib/permissions'
import { formatNzDateTime } from '@/lib/datetime'
import AdminLayout from '@/components/AdminLayout'
import { EVENT_TYPE_OPTIONS } from '@/components/EventForm'
import type { Event } from '@/types/database'

type EventRow = Event & { creator?: { id: string; full_name?: string | null; username?: string | null } | null }

export default function AdminEventsPage() {
  const { user, userRole } = useAuth()
  const canSeeAll = hasPermission(userRole, 'EDIT_ALL_EVENTS')

  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [onlyMine, setOnlyMine] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchEvents = async () => {
    if (!user) return
    setLoading(true)
    let query = supabase
      .from('events')
      .select('*, creator:profiles(id, full_name, username)')
      .order('start_time', { ascending: false })

    // 活动管理员只看自己的；admin 可以切换"只看我的"
    if (!canSeeAll || onlyMine) query = query.eq('create_by', user.id)

    const { data, error } = await query
    if (error) {
      setMessage({ type: 'error', text: `加载失败 Failed to load: ${error.message}` })
    } else {
      setEvents((data as EventRow[]) || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (hasPermission(userRole, 'CREATE_EVENTS')) fetchEvents()
  }, [userRole, user?.id, onlyMine])

  const handleDelete = async (event: EventRow) => {
    if (!confirm(`确定删除活动「${event.title}」吗？此操作不可撤销。\nDelete "${event.title}"?`)) return
    setDeletingId(event.id)
    // .select() 让被 RLS 拦下的删除返回空数组，而不是"静默成功"
    const { data, error } = await supabase.from('events').delete().eq('id', event.id).select('id')
    setDeletingId(null)
    if (error || !data?.length) {
      setMessage({ type: 'error', text: `删除失败 Delete failed: ${error?.message || '没有权限 Permission denied'}` })
      return
    }
    setEvents(prev => prev.filter(e => e.id !== event.id))
    setMessage({ type: 'success', text: '已删除 Deleted' })
  }

  const now = Date.now()

  return (
    <AdminLayout
      title={canSeeAll ? '活动管理 Events' : '我的活动 My Events'}
      requiredPermission="CREATE_EVENTS"
    >
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-6`}>
          <span>{message.text}</span>
          <button className="btn btn-ghost btn-xs" onClick={() => setMessage(null)}>✕</button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Link href="/admin/events/create" className="btn btn-primary btn-sm">
          ➕ 创建活动 New Event
        </Link>
        {canSeeAll && (
          <label className="label cursor-pointer gap-2">
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={onlyMine}
              onChange={e => setOnlyMine(e.target.checked)}
            />
            <span className="label-text">只看我发布的 Only mine</span>
          </label>
        )}
      </div>

      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body p-0 sm:p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : events.length === 0 ? (
            <p className="text-center py-12 text-base-content/60">
              还没有活动 No events yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>活动 Event</th>
                    <th className="hidden sm:table-cell">时间 (NZ)</th>
                    {canSeeAll && <th className="hidden md:table-cell">发布人 By</th>}
                    <th className="text-right">操作 Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => {
                    const type = EVENT_TYPE_OPTIONS.find(o => o.value === event.event_type)
                    const past = new Date(event.end_time || event.start_time).getTime() < now
                    const editable = canEditEvent(userRole, user?.id, event.create_by)
                    return (
                      <tr key={event.id} className={past ? 'opacity-60' : ''}>
                        <td>
                          <div className="font-semibold">
                            {type?.icon} {event.title}
                          </div>
                          <div className="text-xs text-base-content/60 flex flex-wrap gap-2 mt-1">
                            <span className="badge badge-outline badge-sm">{type?.label}</span>
                            {past && <span className="badge badge-ghost badge-sm">已结束 Past</span>}
                            <span className="sm:hidden">{formatNzDateTime(event.start_time)}</span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell text-sm whitespace-nowrap">
                          {formatNzDateTime(event.start_time)}
                        </td>
                        {canSeeAll && (
                          <td className="hidden md:table-cell text-sm">
                            {event.creator?.full_name || event.creator?.username || '—'}
                          </td>
                        )}
                        <td>
                          {editable && (
                            <div className="flex gap-2 justify-end">
                              <Link href={`/admin/events/${event.id}/edit`} className="btn btn-outline btn-sm">
                                编辑 Edit
                              </Link>
                              <button
                                className="btn btn-error btn-outline btn-sm"
                                disabled={deletingId === event.id}
                                onClick={() => handleDelete(event)}
                              >
                                {deletingId === event.id ? '删除中…' : '删除 Delete'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
