'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { AdminOnly } from '@/components/PermissionGuard'
import { File } from '@/types/database'
import Link from 'next/link'

export default function AdminFilesPage() {
  const { user } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ 获取文件列表（仅在 AdminOnly 内执行）
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

  // ✅ 仅在挂载后调用
  useEffect(() => {
      fetchFiles()
  }, [])

  // ✅ 页面主体
  return (
    <AdminOnly
      fallback={
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-red-500">权限不足 Access Denied</h1>
          <p className="mt-4">您没有访问文件管理页面的权限。</p>
          <Link href="/" className="btn btn-primary mt-6">
            返回首页 Back to Home
          </Link>
        </div>
      }
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">文件管理 File Management</h1>
          <Link href="/admin" className="btn bg-black hover:bg-gray-800 text-white">
            返回管理后台 Back to Dashboard
          </Link>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
            <button onClick={fetchFiles} className="btn btn-sm ml-4">
              重试 Retry
            </button>
          </div>
        )}

        {/* 文件列表 */}
        {!loading && !error && (
          <>
            {files.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>标题 Title</th>
                      <th>描述 Description</th>
                      <th>文件名 File Name</th>
                      <th>上传时间 Created</th>
                      <th>操作 Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
                      <tr key={file.id}>
                        <td className="font-medium">{file.title}</td>
                        <td>{file.description || '-'}</td>
                        <td>{file.file_name}</td>
                        <td>{new Date(file.created_at).toLocaleDateString()}</td>
                        <td>
                          <a
                            href={`https://YOUR_SUPABASE_BUCKET_URL/${file.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline"
                          >
                            下载 Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-base-200 rounded-lg">
                <div className="text-6xl mb-4">📂</div>
                <h3 className="text-xl font-bold mb-2">暂无文件</h3>
                <p className="text-base-content/60">
                  当前还没有文件上传，请稍后再试。
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminOnly>
  )
}
