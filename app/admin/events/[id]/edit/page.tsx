'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { canEditEvent, hasPermission } from '@/lib/permissions'
import { isoToNzLocalInput } from '@/lib/datetime'
import AdminLayout from '@/components/AdminLayout'
import EventForm, { type EventFormValues, type EventPayload } from '@/components/EventForm'
import type { Event } from '@/types/database'

export default function EditEventPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const { user, userRole } = useAuth()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !hasPermission(userRole, 'CREATE_EVENTS')) return
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle()
      if (error) setLoadError(error.message)
      else if (!data) setLoadError('活动不存在 Event not found')
      else setEvent(data as Event)
      setLoading(false)
    }
    load()
  }, [id, userRole])

  const handleUpdate = async (payload: EventPayload) => {
    if (!event) return
    // .select() 让被 RLS 拦下的更新返回空数组，便于提示"没有权限"
    const { data, error } = await (supabase.from('events') as any)
      .update(payload)
      .eq('id', event.id)
      .select('id')
    if (error) throw new Error(`保存失败 Save failed: ${error.message}`)
    if (!data?.length) throw new Error('没有权限修改这个活动 You cannot edit this event')
    router.push('/admin/events')
  }

  const toFormValues = (e: Event): EventFormValues => ({
    title: e.title,
    description: e.description || '',
    start_time: isoToNzLocalInput(e.start_time),
    end_time: e.end_time ? isoToNzLocalInput(e.end_time) : '',
    location: e.location || '',
    link: e.link || '',
    event_type: e.event_type,
    organiser: e.organiser || '',
  })

  let content: React.ReactNode
  if (loading) {
    content = (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    )
  } else if (loadError || !event) {
    content = (
      <div className="alert alert-error">
        <span>{loadError || '活动不存在 Event not found'}</span>
        <Link href="/admin/events" className="btn btn-sm">返回 Back</Link>
      </div>
    )
  } else if (!canEditEvent(userRole, user?.id, event.create_by)) {
    content = (
      <div className="alert alert-warning">
        <span>你只能编辑自己发布的活动。You can only edit events you created.</span>
        <Link href="/admin/events" className="btn btn-sm">返回 Back</Link>
      </div>
    )
  } else {
    content = (
      <EventForm
        key={event.id}
        initialValues={toFormValues(event)}
        submitLabel="保存修改 Save"
        submittingLabel="保存中… Saving…"
        onSubmit={handleUpdate}
      />
    )
  }

  return (
    <AdminLayout title="编辑活动 Edit Event" requiredPermission="CREATE_EVENTS">
      {content}
    </AdminLayout>
  )
}
