'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Event, EventType } from '@/types/database'
import EventCalendar from '@/components/EventCalendar'

// 活动类型名称
const EVENT_TYPE_NAMES: Record<EventType, string> = {
  show: '演出 / Show',
  openmic: '开放麦 / Open Mic',
  training: '培训 / Training',
  meetup: '聚会 / Meetup',
  readingsession: '读稿会 / Discussion Session'
}

// 活动类型图标
const EVENT_TYPE_ICONS: Record<EventType, string> = {
  show: '🎭',
  openmic: '🎤',
  training: '📚',
  meetup: '👥',
  readingsession: '📖'
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([])
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true })

      if (error) throw error
      
      console.log('Fetched events:', data)
      setEvents(data || [])
    } catch (error: any) {
      console.error('获取活动失败 Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (date: Date, dayEvents: Event[]) => {
    setSelectedDate(date)
    setSelectedEvents(dayEvents)
  }

  const formatEventTime = (startTime: string, endTime?: string) => {
    // 将数据库时间字符串作为本地时间处理
    // 移除时区信息，将其作为本地时间解析
    const parseAsLocalTime = (timeStr: string) => {
      // 移除时区信息 (+00, Z, 等)
      let cleanTimeStr = timeStr.replace(/[\+\-]\d{2}:?\d{2}$/, '').replace(/Z$/, '')
      
      // 确保格式为 YYYY-MM-DDTHH:mm:ss
      if (cleanTimeStr.includes(' ')) {
        cleanTimeStr = cleanTimeStr.replace(' ', 'T')
      }
      
      // 添加秒如果缺失
      if (!cleanTimeStr.includes(':') || cleanTimeStr.split(':').length < 3) {
        if (cleanTimeStr.split(':').length === 2) {
          cleanTimeStr += ':00'
        }
      }
      
      return new Date(cleanTimeStr)
    }

    const start = parseAsLocalTime(startTime)
    const startStr = start.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    if (endTime) {
      const end = parseAsLocalTime(endTime)
      const endStr = end.toLocaleDateString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
      return `${startStr} - ${endStr}`
    }

    return startStr
  }

  const isUpcoming = (startTime: string) => {
    return new Date(startTime) > new Date()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题和视图切换 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">活动日历 Events Calendar</h1>
          <div className="text-base-content/60 space-y-1">
            <p>查看华人喜剧协会的活动安排</p>
            <p>Browse upcoming Chinese Comedy Society events across New Zealand.</p>
          </div>
        </div>
        
        <div className="tabs tabs-boxed w-full md:w-auto mt-4 md:mt-0">
          <button 
            className={`tab py-2 px-3 text-xs sm:text-sm ${viewMode === 'calendar' ? 'tab-active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            📅 日历 / Calendar
          </button>
          <button 
            className={`tab py-2 px-3 text-xs sm:text-sm ${viewMode === 'list' ? 'tab-active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            📋 列表 / List
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 日历组件 */}
          <div className="lg:col-span-2">
            <EventCalendar 
              events={events}
              onDateClick={handleDateClick}
              selectedDate={selectedDate}
            />
          </div>
          
          {/* 选中日期的活动详情 */}
          <div className="lg:col-span-1">
            {selectedDate ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <p className="text-xs text-gray-500 mb-2">所选日期 / Selected Date</p>
                <h3 className="text-lg font-bold mb-4">
                  {selectedDate.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </h3>
                
                {selectedEvents.length > 0 ? (
                  <div className="space-y-4">
                    {selectedEvents.map((event) => (
                      <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">
                            {EVENT_TYPE_ICONS[event.event_type]}
                          </span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{event.title}</h4>
                            <p className="text-xs text-gray-600 mb-2">
                              {EVENT_TYPE_NAMES[event.event_type]}
                            </p>
                            <p className="text-xs text-gray-500 mb-1">
                              ⏰ {formatEventTime(event.start_time, event.end_time)}
                            </p>
                            {event.location && (
                              <p className="text-xs text-gray-500 mb-1">
                                📍 {event.location} 
                              </p>
                            )}
                            {event.organiser && (
                              <p className="text-xs text-gray-500 mb-2">
                                👤 {event.organiser}
                              </p>
                            )}
                            {event.description && (
                              <p className="text-xs text-gray-700 text-clamp-4">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📅</div>
                    <p>这一天没有活动安排 / No events on this day</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-500">
                <div className="text-4xl mb-2">👆</div>
                <p>点击日历上的日期查看当天活动 / Click a date to view events</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 列表视图 */
        <div className="space-y-6">
          {events.length > 0 ? (
            events.map((event) => (
              <div key={event.id} className={`card bg-base-100 shadow-xl ${isUpcoming(event.start_time) ? 'border-l-4 border-orange-500' : ''}`}>
                <div className="card-body">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">
                          {EVENT_TYPE_ICONS[event.event_type]}
                        </span>
                        <div>
                          <h2 className="card-title text-xl">{event.title}</h2>
                          <span className="badge badge-outline">
                            {EVENT_TYPE_NAMES[event.event_type]}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-base-content/70 space-y-1 mb-3">
                        <div className="flex items-center gap-2">
                          <span>⏰</span>
                          <span>{formatEventTime(event.start_time, event.end_time)}</span>
                          {isUpcoming(event.start_time) && (
                            <span className="badge badge-success badge-sm">即将举行 / Upcoming</span>
                          )}
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <span>📍</span>
                            <span>{event.location}</span>
                          </div>
                        )}
                        
                        {event.organiser && (
                          <div className="flex items-center gap-2">
                            <span>👤</span>
                            <span>{event.organiser}</span>
                          </div>
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-base-content/80 text-sm text-clamp-3">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-base-200 rounded-lg">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-bold mb-2">暂无活动 / No events yet</h3>
              <p className="text-base-content/60">
                目前还没有安排任何活动，请稍后再来查看。
                <br />
                No events scheduled yet. Please check back later.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}