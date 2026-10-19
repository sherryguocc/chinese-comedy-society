'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { hasPermission } from '@/lib/permissions'
import AdminLayout from '@/components/AdminLayout'
import type { File } from '@/types/database'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NZ', { day: '2-digit', month: '2-digit', year: 'numeric' })

export default function AdminDashboardPage() {
  const { userRole } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cards = [
    { href: '/admin/posts/create', icon: '📝', title: '创建文章 New Post', desc: '发布新的文章内容', show: hasPermission(userRole, 'CREATE_POSTS') },
    {
      href: '/admin/events',
      icon: '📅',
      title: hasPermission(userRole, 'EDIT_ALL_EVENTS') ? '活动管理 Events' : '我的活动 My Events',
      desc: hasPermission(userRole, 'EDIT_ALL_EVENTS') ? '查看、编辑和删除所有活动' : '查看、编辑和删除我发布的活动',
      show: hasPermission(userRole, 'CREATE_EVENTS'),
    },
    { href: '/admin/events/create', icon: '➕', title: '创建活动 New Event', desc: '发布新的活动信息', show: hasPermission(userRole, 'CREATE_EVENTS') },
    { href: '/admin/files', icon: '📁', title: '文件管理 Files', desc: '上传、重命名和删除文件', show: hasPermission(userRole, 'UPLOAD_FILES') },
    { href: '/admin/users', icon: '👥', title: '用户管理 Users', desc: '审批新会员、管理角色', show: hasPermission(userRole, 'MANAGE_USERS') },
  ]

  const fetchFiles = async () => {
    try {
      setError(null)
      setLoading(true)
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      setFiles(data || [])
    } catch (e: any) {
      setError(`获取文件列表失败: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const canSeeFiles = hasPermission(userRole, 'UPLOAD_FILES')

  useEffect(() => {
    if (canSeeFiles) fetchFiles()
  }, [canSeeFiles])

  return (
    <AdminLayout title="管理后台 Admin Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {cards.filter(c => c.show).map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="card bg-base-100 shadow hover:shadow-lg transition-shadow border border-base-200"
          >
            <div className="card-body p-5">
              <h2 className="card-title text-lg">{card.icon} {card.title}</h2>
              <p className="text-base-content/70">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {canSeeFiles && (
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body">
          <div className="flex justify-between items-center mb-2">
            <h2 className="card-title">最近文件 Recent Files</h2>
            <Link href="/admin/files" className="link link-primary text-sm">查看全部 View all →</Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : error ? (
            <div className="alert alert-error">
              <span>{error}</span>
              <button onClick={fetchFiles} className="btn btn-sm">重试 Retry</button>
            </div>
          ) : files.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>标题 Title</th>
                    <th>文件名 File Name</th>
                    <th>上传时间 Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map(file => (
                    <tr key={file.id}>
                      <td className="font-medium">{file.title}</td>
                      <td className="text-sm">{file.file_name}</td>
                      <td className="text-sm">{formatDate(file.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-base-content/60">还没有文件 No files yet</p>
          )}
        </div>
      </div>
      )}
    </AdminLayout>
  )
}
