'use client'

import React, { useState, useMemo } from 'react'
import { Event, EventType } from '@/types/database'

interface EventCalendarProps {
  events: Event[]
  onDateClick: (date: Date, dayEvents: Event[]) => void
  selectedDate?: Date
}

// 活动类型配色方案
const EVENT_TYPE_COLORS: Record<EventType, string> = {
  show: 'bg-red-500 text-white',
  openmic: 'bg-orange-500 text-white', 
  training: 'bg-blue-500 text-white',
  meetup: 'bg-green-500 text-white',
  readingsession: 'bg-purple-500 text-white'
}

// 活动类型中文名称
const EVENT_TYPE_NAMES: Record<EventType, string> = {
  show: '演出Show',
  openmic: '开放麦Open Mic',
  training: '培训Training',
  meetup: '聚会Meetup',
  readingsession: '读稿会Discussion Session'
}

export default function EventCalendar({ events, onDateClick, selectedDate }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // 获取当前月份的第一天和最后一天
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  
  // 获取日历开始日期（包含上个月的日期以填满第一周）
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay())
  
  // 获取日历结束日期（包含下个月的日期以填满最后一周）
  const endDate = new Date(lastDayOfMonth)
  endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()))
  
  // 生成日历天数数组
  const calendarDays = useMemo(() => {
    const days = []
    const current = new Date(startDate)
    
    while (current <= endDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }, [startDate, endDate])
  
  // 按日期分组事件
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Event[]> = {}
    
    // 将数据库时间字符串作为本地时间处理
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
    
    events.forEach(event => {
      const eventDate = parseAsLocalTime(event.start_time)
      // 使用本地时间生成日期键
      const year = eventDate.getFullYear()
      const month = String(eventDate.getMonth() + 1).padStart(2, '0')
      const day = String(eventDate.getDate()).padStart(2, '0')
      const dateKey = `${year}-${month}-${day}`
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(event)
    })
    
    return grouped
  }, [events])
  
  // 获取指定日期的事件
  const getEventsForDate = (date: Date) => {
    // 使用本地时间生成日期键，避免UTC转换
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateKey = `${year}-${month}-${day}`
    return eventsByDate[dateKey] || []
  }
  
  // 获取指定日期的事件类型统计
  const getEventTypeCountsForDate = (date: Date) => {
    const dayEvents = getEventsForDate(date)
    const counts: Partial<Record<EventType, number>> = {}
    
    dayEvents.forEach(event => {
      counts[event.event_type] = (counts[event.event_type] || 0) + 1
    })
    
    return counts
  }
  
  // 导航到上个月
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }
  
  // 导航到下个月
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }
  
  // 检查是否是当前月份的日期
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }
  
  // 检查是否是今天
  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }
  
  // 检查是否是选中的日期
  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* 日历头部 */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={previousMonth}
          className="btn btn-ghost btn-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-xl font-bold">
          {currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
        </h2>
        
        <button 
          onClick={nextMonth}
          className="btn btn-ghost btn-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* 星期标题 */}
      <div className="grid grid-cols-7 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="text-center font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(date => {
          const dayEvents = getEventsForDate(date)
          const eventCounts = getEventTypeCountsForDate(date)
          
          return (
            <div
              key={date.toISOString()}
              onClick={() => onDateClick(date, dayEvents)}
              className={`
                aspect-square p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors
                ${!isCurrentMonth(date) ? 'text-gray-400 bg-gray-50' : ''}
                ${isToday(date) ? 'bg-orange-100 border-orange-300' : ''}
                ${isSelected(date) ? 'bg-orange-200 border-orange-400' : ''}
              `}
            >
              <div className="h-full flex flex-col">
                {/* 日期数字 */}
                <div className="text-sm font-medium mb-1">
                  {date.getDate()}
                </div>
                
                {/* 事件类型指示器 */}
                <div className="flex-1 flex flex-wrap gap-1">
                  {Object.entries(eventCounts).map(([eventType, count]) => (
                    <div
                      key={eventType}
                      className={`
                        text-xs px-1 py-0.5 rounded-full font-bold
                        ${EVENT_TYPE_COLORS[eventType as EventType]}
                      `}
                      title={`${EVENT_TYPE_NAMES[eventType as EventType]}: ${count}个`}
                    >
                      {count}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* 图例 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">活动类型图例 Event type color</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(EVENT_TYPE_NAMES).map(([type, name]) => (
            <div key={type} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${EVENT_TYPE_COLORS[type as EventType]}`} />
              <span className="text-xs text-gray-600">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}