'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { EventType } from '@/types/database'
import { isAdmin } from '@/lib/permissions'
import AdminLayout from '@/components/AdminLayout'
import AccessDeniedPanel from '@/components/AccessDeniedPanel'
import { getSafeExternalUrl } from '@/lib/utils'

// 活动类型选项
const EVENT_TYPE_OPTIONS: { value: EventType; label: string; icon: string; description: string }[] = [
  { value: 'show', label: '演出', icon: '🎭', description: '正式的喜剧演出活动' },
  { value: 'openmic', label: '开放麦', icon: '🎤', description: '开放麦克风活动' },
  { value: 'training', label: '培训', icon: '📚', description: '喜剧技能培训和工作坊' },
  { value: 'meetup', label: '聚会', icon: '👥', description: '社区聚会和交流活动' },
  { value: 'readingsession', label: '读稿会', icon: '📖', description: '读稿和讨论会' }
]

export default function CreateEvent() {
  const { userRole, loading, user, admin } = useAuth()
  const router = useRouter()
  const [submitLoading, setSubmitLoading] = useState(false)
  const [authTimeout, setAuthTimeout] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    link: '',
    event_type: 'meetup' as EventType,
    organiser: '华人喜剧协会CCS'
  })

  const linkUrl = getSafeExternalUrl(formData.link)

  // 添加超时检测
  useEffect(() => {
    let timeout: NodeJS.Timeout
    
    if (loading) {
      timeout = setTimeout(() => {
        setAuthTimeout(true)
      }, 8000) // 8秒超时
    } else {
      setAuthTimeout(false)
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) {
      alert('用户信息未加载，请刷新页面重试')
      return
    }

    setSubmitLoading(true)
    
    // 添加5秒超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('操作超时 Operation timeout')), 5000)
    })

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        location: formData.location,
        link: formData.link.trim() || null,
        event_type: formData.event_type,
        organiser: formData.organiser,
        create_by: user.id
      }

      console.log('Creating event with data:', eventData)
      console.log('Admin info:', { 
        id: admin?.id || user.id, 
        role: userRole, 
        email: user.email 
      })

      // 添加超时控制的数据库操作
      const insertPromise = supabase
        .from('events')
        // @ts-ignore - Temporary fix for Supabase type inference
        .insert(eventData)
        .select() // 添加select来获取插入的数据

      console.log('Starting database insert...')
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database operation timeout after 15 seconds')), 15000)
      })
      
      const { data, error } = await Promise.race([insertPromise, timeoutPromise])

      console.log('Insert result:', { data, error })

      if (error) {
        console.error('Database error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('Event created successfully:', data)
      alert('活动创建成功！ Event created successfully!')
      router.push('/events')
    } catch (error: any) {
      console.error('创建活动失败 Error creating event:', error)
      
      // 更详细的错误信息
      let errorMessage = '创建失败 Failed to create event'
      if (error.message) {
        errorMessage += `: ${error.message}`
      }
      if (error.details) {
        errorMessage += ` (详情: ${error.details})`
      }
      
      alert(errorMessage)
    } finally {
      setSubmitLoading(false)
    }
  }

  // 如果验证超时
  if (authTimeout) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-orange-500">权限验证超时</h1>
        <p className="mt-4">权限验证超时，请刷新页面重试。</p>
        <div className="mt-6 space-x-4">
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            刷新页面 Refresh
          </button>
          <button 
            onClick={() => router.push('/admin/dashboard')}
            className="btn btn-outline"
          >
            返回管理后台 Back to Admin
          </button>
        </div>
      </div>
    )
  }

  // 如果还在加载
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4">正在验证权限...</p>
          </div>
        </div>
      </div>
    )
  }

  // 如果没有用户或不是管理员
  if (!user || !isAdmin(userRole)) {
    return (
      <AccessDeniedPanel
        messageZh="您没有创建活动的权限。"
        messageEn="You don't have permission to create events."
        showLoginButton={!user}
      />
    )
  }

  return (
    <AdminLayout title="创建活动 Create Event" showBackButton={true}>
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

            {/* 活动类型 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-lg font-semibold">活动类型 Event Type</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <label key={option.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="event_type"
                      value={option.value}
                      checked={formData.event_type === option.value}
                      onChange={(e) => setFormData({ ...formData, event_type: e.target.value as EventType })}
                      className="sr-only"
                    />
                    <div className={`
                      border-2 rounded-lg p-4 transition-all hover:shadow-md
                      ${formData.event_type === option.value 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{option.icon}</span>
                        <div>
                          <div className="font-semibold">{option.label}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
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

            {/* 时间设置 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-lg font-semibold">开始时间 Start Time *</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-lg font-semibold">结束时间 End Time</span>
                  <span className="label-text-alt">可选 Optional</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="input input-bordered w-full"
                  min={formData.start_time} // 结束时间不能早于开始时间
                />
              </div>
            </div>

            {/* 地点和组织者 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-lg font-semibold">活动组织者 Organiser</span>
                </label>
                <input
                  type="text"
                  value={formData.organiser}
                  onChange={(e) => setFormData({ ...formData, organiser: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="请输入组织者名称 Enter organiser name..."
                />
              </div>
            </div>

            {/* 活动链接（购票/联系方式） */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-lg font-semibold">活动链接 Link</span>
                <span className="label-text-alt">可选 Optional</span>
              </label>
              <input
                type="text"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="input input-bordered w-full"
                placeholder="购票链接或联系方式 (URL / WeChat / Phone...)"
              />
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
                disabled={submitLoading}
                className="btn primary-orange"
              >
                {submitLoading ? (
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

        {/* 预览卡片 */}
        {formData.title && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title mb-4">活动预览 Event Preview</h3>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">
                    {EVENT_TYPE_OPTIONS.find(opt => opt.value === formData.event_type)?.icon}
                  </span>
                  <div>
                    <h4 className="font-semibold text-lg">{formData.title}</h4>
                    <span className="badge badge-outline">
                      {EVENT_TYPE_OPTIONS.find(opt => opt.value === formData.event_type)?.label}
                    </span>
                  </div>
                </div>
                
                {formData.start_time && (
                  <p className="text-sm text-gray-500 mb-1">
                    ⏰ {new Date(formData.start_time).toLocaleString('zh-CN')}
                    {formData.end_time && (
                      ` - ${new Date(formData.end_time).toLocaleString('zh-CN')}`
                    )}
                  </p>
                )}
                
                {formData.location && (
                  <p className="text-sm text-gray-500 mb-1">
                    📍 {formData.location}
                  </p>
                )}
                
                {formData.organiser && (
                  <p className="text-sm text-gray-500 mb-2">
                    👤 {formData.organiser}
                  </p>
                )}

                {formData.link && (
                  <div className="text-sm mb-2 break-all">
                    <span className="mr-1">🔗</span>
                    {linkUrl ? (
                      <a
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {formData.link}
                      </a>
                    ) : (
                      <span className="text-gray-600">{formData.link}</span>
                    )}
                  </div>
                )}
                
                {formData.description && (
                  <p className="text-sm text-gray-700 text-clamp-3">
                    {formData.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </form>
   </AdminLayout>
  )
}

