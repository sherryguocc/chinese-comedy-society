'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { AdminOnly } from '@/components/PermissionGuard'
import { hasPermission } from '@/lib/permissions'
import { File } from '@/types/database'
import Link from 'next/link'
import AccessDeniedPanel from '@/components/AccessDeniedPanel'

export default function AdminDashboardPage() {
  const { user, userRole } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const canManageUsers = hasPermission(userRole, 'MANAGE_USERS')
  const canUploadFiles = hasPermission(userRole, 'UPLOAD_FILES')
  const canCreatePosts = hasPermission(userRole, 'CREATE_POSTS')
  const canCreateEvents = hasPermission(userRole, 'CREATE_EVENTS')

  const fetchFiles = async () => {
    try {
      setError(null)
      setLoading(true)

      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (e: any) {
      console.error('Error fetching files:', e)
      setError(`获取文件列表失败: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  return (
    <AdminOnly
      fallback={
        <AccessDeniedPanel
          messageZh="您需要管理员权限才能访问此页面。"
          messageEn="You need admin access to view this page."
        />
      }
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">管理后台 Admin Dashboard</h1>
            <p className="text-base-content/60 mt-2">
              当前角色：{userRole === 'super_admin' ? '超级管理员' : '管理员'}
            </p>
          </div>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {canCreatePosts && (
            <Link href="/admin/posts/create" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <h2 className="card-title">📝 创建文章</h2>
                <p>发布新的文章内容</p>
              </div>
            </Link>
          )}

          {canCreateEvents && (
            <Link href="/admin/events/create" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <h2 className="card-title">📅 创建活动</h2>
                <p>发布新的活动信息</p>
              </div>
            </Link>
          )}

          {canUploadFiles && (
            <Link href="/admin/files/upload" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <h2 className="card-title">📁 文件管理</h2>
                <p>上传和管理文件</p>
              </div>
            </Link>
          )}

          {canManageUsers && (
            <Link href="/admin/users" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <h2 className="card-title">👥 用户管理</h2>
                <p>管理用户和权限</p>
              </div>
            </Link>
          )}
        </div>

        {/* 文件列表部分 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">最近文件 Recent Files</h2>
            
            {loading && (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            )}

            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
                <button onClick={fetchFiles} className="btn btn-sm ml-4">
                  重试 Retry
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                {files.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="table table-zebra">
                      <thead>
                        <tr>
                          <th>标题 Title</th>
                          <th>文件名 File Name</th>
                          <th>上传时间 Created</th>
                          <th>操作 Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {files.slice(0, 10).map((file) => (
                          <tr key={file.id}>
                            <td className="font-medium">{file.title}</td>
                            <td>{file.file_name}</td>
                            <td>{new Date(file.created_at).toLocaleDateString()}</td>
                            <td>
                              <a
                                href={`https://YOUR_SUPABASE_BUCKET_URL/${file.path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline"
                              >
                                查看
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📂</div>
                    <h3 className="text-xl font-bold mb-2">暂无文件</h3>
                    <p className="text-base-content/60">还没有文件上传。</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AdminOnly>
  )
}