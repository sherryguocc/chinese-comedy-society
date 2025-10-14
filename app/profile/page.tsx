'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { MemberOnly } from '@/components/PermissionGuard'
import { canDownload } from '@/lib/permissions'
import { File } from '@/types/database'

export default function FilesPage() {
  const { user, userRole } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFiles = async () => {
    try {
      setError(null)
      setLoading(true)

      const { data, error } = await supabase
        .from('files')
        .select(`
          *,
          uploader:profiles(id, full_name, role)
        `)
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

  const handleDownload = async (file: File) => {
    try {
      const { data, error } = await supabase.storage
        .from('files')
        .download(file.path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: any) {
      console.error('Error downloading file:', e)
      alert(`下载失败: ${e.message}`)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      guest: '访客',
      member: '会员', 
      admin: '管理员',
      super_admin: '超级管理员'
    }
    return roleNames[role as keyof typeof roleNames] || role
  }

  return (
    <MemberOnly
      fallback={
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-red-500">权限不足 Access Denied</h1>
          <p className="mt-4">您需要会员及以上权限才能访问文件页面。</p>
          <p className="text-sm text-base-content/60 mt-2">
            当前角色: {getRoleDisplayName(userRole || 'guest')}
          </p>
        </div>
      }
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">文件管理 Files</h1>
            <p className="text-base-content/60 mt-2">
              当前角色: {getRoleDisplayName(userRole || 'guest')}
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
            <button onClick={fetchFiles} className="btn btn-sm ml-4">
              重试 Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>标题 Title</th>
                  <th>文件名 File Name</th>
                  <th>大小 Size</th>
                  <th>上传者 Uploader</th>
                  <th>上传时间 Created</th>
                  <th>操作 Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id}>
                    <td className="font-medium">{file.title}</td>
                    <td>{file.file_name}</td>
                    <td>{(file.file_size / 1024 / 1024).toFixed(2)} MB</td>
                    <td>{file.uploader?.full_name || '未知'}</td>
                    <td>{new Date(file.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleDownload(file)}
                        className="btn btn-sm btn-outline"
                      >
                        下载 Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {files.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-xl font-bold mb-2">暂无文件</h3>
                <p className="text-base-content/60">还没有文件上传。</p>
              </div>
            )}
          </div>
        )}
      </div>
    </MemberOnly>
  )
}