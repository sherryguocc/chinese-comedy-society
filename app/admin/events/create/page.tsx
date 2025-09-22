'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'

export default function CreateEvent() {
  const { profile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    published: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('events')
        .insert({
          title: formData.title,
          description: formData.description,
          event_date: formData.event_date,
          location: formData.location,
          author_id: profile.id,
          published: formData.published
        })

      if (error) throw error

      alert('活动创建成功！ Event created successfully!')
      router.push('/events')
    } catch (error) {
      console.error('创建活动失败 Error creating event:', error)
      alert('创建失败 Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">权限不足 Access Denied</h1>
        <p className="mt-4">您没有创建活动的权限。You don't have permission to create events.</p>
      </div>
    )
  }

  return (
    <AdminLayout 
      title="创建活动 Create Event" 
      showBackButton={true}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {/* 活动标题 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-lg font-semibold">活动标题 Event Title</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input input-bordered w-full"
                placeholder="请输入活动标题 Enter event title..."
                required
              />
            </div>

            {/* 活动描述 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-lg font-semibold">活动描述 Event Description</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="textarea textarea-bordered w-full h-32"
                placeholder="请输入活动描述 Enter event description..."
                required
              />
            </div>

            {/* 活动日期和地点 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-lg font-semibold">活动日期 Event Date</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-lg font-semibold">活动地点 Location</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="请输入活动地点 Enter location..."
                />
              </div>
            </div>

            {/* 发布状态 */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start space-x-4">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="checkbox checkbox-primary"
                />
                <span className="label-text">立即发布 Publish immediately</span>
              </label>
            </div>

            {/* 提交按钮 */}
            <div className="card-actions justify-end mt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-outline"
              >
                取消 Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn primary-orange"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    创建中...
                  </>
                ) : (
                  '创建活动 Create Event'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  )
}

