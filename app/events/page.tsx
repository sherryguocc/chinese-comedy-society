'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Event, EventType } from '@/types/database'
import EventCalendar from '@/components/EventCalendar'
import { getSafeExternalUrl } from '@/lib/utils'

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
    const timezone = 'Pacific/Auckland'
    const start = new Date(startTime)

    const startStr = new Intl.DateTimeFormat('en-NZ', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(start)

    if (endTime) {
      const end = new Date(endTime)
      const endStr = new Intl.DateTimeFormat('en-NZ', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(end)
      return `${startStr} - ${endStr}`
    }

    return startStr
  }

  const isUpcoming = (startTime: string) => {
    return new Date(startTime) > new Date()
  }

  const formatSelectedDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Pacific/Auckland',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(date)
  }

  const renderEventLink = (link?: string) => {
    if (!link) {
      return null
    }

    const url = getSafeExternalUrl(link)
    if (url) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
          {link}
        </a>
      )
    }

    return <span className="break-all">{link}</span>
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
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">
            <span className="sm:hidden">活动日历<br />Events Calendar</span>
            <span className="hidden sm:inline">活动日历 Events Calendar</span>
          </h1>
          <div className="text-sm sm:text-base text-base-content/60 space-y-1">
            <p>查看华人喜剧协会的活动安排</p>
            <p>Browse upcoming Chinese Comedy Society events across New Zealand.</p>
          </div>
        </div>
        
        <div className="tabs tabs-boxed w-full md:w-auto mt-4 md:mt-0">
          <button 
            className={`tab flex-1 md:flex-none h-auto py-2 px-2 text-xs sm:text-sm text-center leading-tight ${viewMode === 'calendar' ? 'tab-active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            <span className="sm:hidden">📅 日历<br />Calendar</span>
            <span className="hidden sm:inline">📅 日历 / Calendar</span>
          </button>
          <button 
            className={`tab flex-1 md:flex-none h-auto py-2 px-2 text-xs sm:text-sm text-center leading-tight ${viewMode === 'list' ? 'tab-active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <span className="sm:hidden">📋 列表<br />List</span>
            <span className="hidden sm:inline">📋 列表 / List</span>
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
                  {formatSelectedDate(selectedDate)}
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
                            {event.link && (
                              <div className="text-xs text-gray-600 mb-2">
                                <span className="mr-1">🔗</span>
                                {renderEventLink(event.link)}
                              </div>
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
                        <div className="flex flex-wrap items-center gap-2">
                          <span>⏰</span>
                          <span className="min-w-0">{formatEventTime(event.start_time, event.end_time)}</span>
                          {isUpcoming(event.start_time) && (
                            <span className="badge badge-success badge-sm whitespace-nowrap text-[10px] sm:text-xs">
                              <span className="sm:hidden">即将 / Soon</span>
                              <span className="hidden sm:inline">即将举行 / Upcoming</span>
                            </span>
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

                        {event.link && (
                          <div className="flex items-start gap-2">
                            <span>🔗</span>
                            {renderEventLink(event.link)}
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