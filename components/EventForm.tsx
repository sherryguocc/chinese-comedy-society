'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EventType } from '@/types/database'
import { nzLocalToISO, formatNzDateTime, formatNzTime } from '@/lib/datetime'
import { getSafeExternalUrl } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export const EVENT_TYPE_OPTIONS: { value: EventType; label: string; icon: string; description: string }[] = [
  { value: 'show', label: '演出', icon: '🎭', description: '正式的喜剧演出活动' },
  { value: 'openmic', label: '开放麦', icon: '🎤', description: '开放麦克风活动' },
  { value: 'training', label: '培训', icon: '📚', description: '喜剧技能培训和工作坊' },
  { value: 'meetup', label: '聚会', icon: '👥', description: '社区聚会和交流活动' },
  { value: 'readingsession', label: '读稿会', icon: '📖', description: '读稿和讨论会' },
]

/** 表单值：时间是 datetime-local 格式的新西兰墙上时间 */
export type EventFormValues = {
  title: string
  description: string
  start_time: string
  end_time: string
  location: string
  link: string
  event_type: EventType
  organiser: string
}

/** 提交给数据库的字段（时间已转换为带时区的 ISO） */
export type EventPayload = {
  title: string
  description: string
  start_time: string
  end_time: string | null
  location: string
  link: string | null
  event_type: EventType
  organiser: string
}

const DEFAULT_ORGANISER = '华人喜剧协会CCS'
const NEW_ORGANISER = '__new__'

export const EMPTY_EVENT_FORM: EventFormValues = {
  title: '',
  description: '',
  start_time: '',
  end_time: '',
  location: '',
  link: '',
  event_type: 'meetup',
  organiser: DEFAULT_ORGANISER,
}

interface EventFormProps {
  initialValues?: EventFormValues
  submitLabel: string
  submittingLabel: string
  onSubmit: (payload: EventPayload) => Promise<void>
}

export default function EventForm({ initialValues = EMPTY_EVENT_FORM, submitLabel, submittingLabel, onSubmit }: EventFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<EventFormValues>(initialValues)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 组织者下拉：来自历史活动（按使用次数排序），也可以填写新的
  const [organisers, setOrganisers] = useState<string[]>(() =>
    Array.from(new Set([DEFAULT_ORGANISER, ...(initialValues.organiser?.trim() ? [initialValues.organiser.trim()] : [])]))
  )
  const [customOrganiser, setCustomOrganiser] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('events').select('organiser')
      const counts = new Map<string, number>()
      ;(data as { organiser: string | null }[] | null)?.forEach(({ organiser }) => {
        const name = organiser?.trim()
        if (name) counts.set(name, (counts.get(name) || 0) + 1)
      })
      const list = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name)
      // 默认组织者和当前值（编辑旧活动时）始终在列表里
      const current = initialValues.organiser?.trim()
      setOrganisers(Array.from(new Set([DEFAULT_ORGANISER, ...list, ...(current ? [current] : [])])))
    }
    load()
  }, [initialValues.organiser])

  const linkUrl = getSafeExternalUrl(formData.link)
  const typeOption = EVENT_TYPE_OPTIONS.find(o => o.value === formData.event_type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.end_time && formData.end_time < formData.start_time) {
      setError('结束时间不能早于开始时间 End time must be after start time')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description,
        // datetime-local 的值是新西兰墙上时间，转成带时区的时刻再存
        start_time: nzLocalToISO(formData.start_time),
        end_time: formData.end_time ? nzLocalToISO(formData.end_time) : null,
        location: formData.location,
        link: formData.link.trim() || null,
        event_type: formData.event_type,
        organiser: formData.organiser.trim(),
      })
    } catch (err: any) {
      setError(err?.message || '保存失败 Save failed')
    } finally {
      setSubmitting(false)
    }
  }

  const set = <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) =>
    setFormData(prev => ({ ...prev, [key]: value }))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg font-semibold">活动标题 Event Title *</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => set('title', e.target.value)}
              className="input input-bordered w-full"
              placeholder="请输入活动标题 Enter event title..."
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg font-semibold">活动类型 Event Type</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {EVENT_TYPE_OPTIONS.map(option => (
                <label key={option.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="event_type"
                    value={option.value}
                    checked={formData.event_type === option.value}
                    onChange={e => set('event_type', e.target.value as EventType)}
                    className="sr-only"
                  />
                  <div
                    className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${
                      formData.event_type === option.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
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

          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg font-semibold">活动描述 Event Description *</span>
            </label>
            <textarea
              value={formData.description}
              onChange={e => set('description', e.target.value)}
              className="textarea textarea-bordered w-full h-32"
              placeholder="请输入活动描述 Enter event description..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-lg font-semibold">开始时间 Start Time *</span>
                <span className="label-text-alt">新西兰时间 NZ time</span>
              </label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={e => set('start_time', e.target.value)}
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
                onChange={e => set('end_time', e.target.value)}
                className="input input-bordered w-full"
                min={formData.start_time}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-lg font-semibold">活动地点 Location</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={e => set('location', e.target.value)}
                className="input input-bordered w-full"
                placeholder="请输入活动地点 Enter location..."
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-lg font-semibold">活动组织者 Organiser</span>
              </label>
              {customOrganiser ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.organiser}
                    onChange={e => set('organiser', e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="输入新的组织者名称 New organiser name"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    title="从列表选择 Choose from list"
                    onClick={() => {
                      setCustomOrganiser(false)
                      set('organiser', organisers[0] || DEFAULT_ORGANISER)
                    }}
                  >
                    ↩
                  </button>
                </div>
              ) : (
                <select
                  className="select select-bordered w-full"
                  value={formData.organiser}
                  onChange={e => {
                    if (e.target.value === NEW_ORGANISER) {
                      setCustomOrganiser(true)
                      set('organiser', '')
                    } else {
                      set('organiser', e.target.value)
                    }
                  }}
                >
                  {organisers.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  <option value={NEW_ORGANISER}>➕ 新的组织者… New organiser…</option>
                </select>
              )}
              <span className="label-text-alt mt-1 text-base-content/60">
                新填写的组织者保存后，下次会出现在列表里
              </span>
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg font-semibold">活动链接 Link</span>
              <span className="label-text-alt">可选 Optional</span>
            </label>
            <input
              type="text"
              value={formData.link}
              onChange={e => set('link', e.target.value)}
              className="input input-bordered w-full"
              placeholder="购票链接或联系方式 (URL / WeChat / Phone...)"
            />
          </div>

          <div className="card-actions justify-end mt-6">
            <button type="button" onClick={() => router.back()} className="btn btn-outline">
              取消 Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting && <span className="loading loading-spinner loading-sm"></span>}
              {submitting ? submittingLabel : submitLabel}
            </button>
          </div>
        </div>
      </div>

      {formData.title && (
        <div className="card bg-base-100 shadow border border-base-200">
          <div className="card-body">
            <h3 className="card-title mb-2">活动预览 Event Preview</h3>
            <div className="border border-base-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{typeOption?.icon}</span>
                <div>
                  <h4 className="font-semibold text-lg">{formData.title}</h4>
                  <span className="badge badge-outline">{typeOption?.label}</span>
                </div>
              </div>
              {formData.start_time && (
                <p className="text-sm text-gray-500 mb-1">
                  ⏰ {formatNzDateTime(nzLocalToISO(formData.start_time))}
                  {formData.end_time && ` - ${formatNzTime(nzLocalToISO(formData.end_time))}`} (NZ)
                </p>
              )}
              {formData.location && <p className="text-sm text-gray-500 mb-1">📍 {formData.location}</p>}
              {formData.organiser && <p className="text-sm text-gray-500 mb-2">👤 {formData.organiser}</p>}
              {formData.link && (
                <div className="text-sm mb-2 break-all">
                  <span className="mr-1">🔗</span>
                  {linkUrl ? (
                    <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {formData.link}
                    </a>
                  ) : (
                    <span className="text-gray-600">{formData.link}</span>
                  )}
                </div>
              )}
              {formData.description && (
                <p className="text-sm text-gray-700 whitespace-pre-line line-clamp-3">{formData.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
