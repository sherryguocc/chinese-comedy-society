'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Event } from '@/types/database'
import { AdminOnly } from '@/components/PermissionGuard'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('published', true)
        .order('event_date', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('获取活动失败 Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          活动列表 Events
        </h1>
        <AdminOnly>
          <Link href="/admin/events/create" className="btn primary-orange">
            创建活动 Create Event
          </Link>
        </AdminOnly>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="skeleton h-6 w-48"></div>
                <div className="skeleton h-20 w-full"></div>
                <div className="skeleton h-4 w-32"></div>
              </div>
            </div>
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-6">
          {events.map((event) => {
            const eventDate = formatEventDate(event.start_time)
            const isUpcoming = new Date(event.start_time) > new Date()
            
            return (
              <div key={event.id} className={`card bg-base-100 shadow-xl ${isUpcoming ? 'border-l-4 border-orange-500' : ''}`}>
                <div className="card-body">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="card-title text-xl mb-2">
                        {event.title}
                        {isUpcoming && (
                          <div className="badge badge-primary">即将举行 Upcoming</div>
                        )}
                      </h2>
                      <p className="text-base-content/70 mb-4">
                        {event.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-base-content/60">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {eventDate.date} {eventDate.time}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.location}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          创建者: {event.author?.full_name || event.author?.email}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-base-content/60 mb-4">
            暂无活动 No Events Yet
          </h2>
          <p className="text-base-content/50">
            还没有安排任何活动，请稍后再来查看。
            <br />
            No events have been scheduled yet. Please check back later.
          </p>
        </div>
      )}
    </div>
  )
}