'use client'

import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { supabase } from '@/lib/supabase'
import { Event } from '@/types/database'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          creator:profiles(*)
        `)
        .order('start_date', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start_date,
    end: event.end_date,
    extendedProps: event,
  }))

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event.extendedProps)
  }

  const closeModal = () => {
    setSelectedEvent(null)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="skeleton h-8 w-48 mb-8"></div>
        <div className="skeleton h-96 w-full"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          活动日历 Events Calendar
        </h1>
      </div>

      {/* Calendar */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={calendarEvents}
            eventClick={handleEventClick}
            height="auto"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek'
            }}
            locale="zh-cn"
            buttonText={{
              today: '今天 Today',
              month: '月 Month',
              week: '周 Week',
            }}
            eventDisplay="block"
            eventColor="#570df8"
            eventTextColor="#ffffff"
            dayCellClassNames="cursor-pointer hover:bg-base-200"
            eventClassNames="cursor-pointer hover:opacity-80"
          />
        </div>
      </div>

      {/* Upcoming Events List */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="text-2xl font-bold mb-6">
            即将举行的活动 Upcoming Events
          </h2>

          {events.length > 0 ? (
            <div className="space-y-4">
              {events
                .filter(event => new Date(event.start_date) >= new Date())
                .slice(0, 5)
                .map((event) => (
                  <div
                    key={event.id}
                    className="border border-base-300 rounded-lg p-4 hover:bg-base-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-base-content/70">
                          <span>
                            📅 {new Date(event.start_date).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {event.location && <span>📍 {event.location}</span>}
                        </div>
                        {event.description && (
                          <p className="text-base-content/80 mt-2 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <button className="btn btn-outline btn-sm">
                        查看详情 View Details
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-bold mb-2">
                暂无活动 No Events
              </h3>
              <p className="text-base-content/60">
                目前没有计划的活动。请关注我们的更新！
                <br />
                No events are currently scheduled. Stay tuned for updates!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={closeModal}
            >
              ✕
            </button>
            
            <h3 className="font-bold text-2xl mb-4">{selectedEvent.title}</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">活动详情 Event Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">开始时间 Start:</span>
                    <br />
                    {new Date(selectedEvent.start_date).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div>
                    <span className="font-medium">结束时间 End:</span>
                    <br />
                    {new Date(selectedEvent.end_date).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {selectedEvent.location && (
                    <div className="md:col-span-2">
                      <span className="font-medium">地点 Location:</span>
                      <br />
                      {selectedEvent.location}
                    </div>
                  )}
                </div>
              </div>

              {selectedEvent.description && (
                <div>
                  <h4 className="font-semibold text-lg mb-2">活动描述 Description</h4>
                  <p className="text-base-content/80 whitespace-pre-wrap">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              <div className="text-sm text-base-content/60">
                创建者 Created by: {selectedEvent.creator?.full_name || selectedEvent.creator?.email}
              </div>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={closeModal}>
                关闭 Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}