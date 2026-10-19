'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import EventForm, { type EventPayload } from '@/components/EventForm'

export default function CreateEventPage() {
  const { user } = useAuth()
  const router = useRouter()

  const handleCreate = async (payload: EventPayload) => {
    if (!user?.id) throw new Error('用户信息未加载，请刷新页面重试 Please refresh and try again')

    const { error } = await (supabase.from('events') as any).insert({
      ...payload,
      create_by: user.id, // RLS 要求必须是自己
    })
    if (error) throw new Error(`创建失败 Failed to create event: ${error.message}`)

    router.push('/admin/events')
  }

  return (
    <AdminLayout title="创建活动 Create Event" requiredPermission="CREATE_EVENTS">
      <EventForm submitLabel="创建活动 Create Event" submittingLabel="创建中… Creating…" onSubmit={handleCreate} />
    </AdminLayout>
  )
}
