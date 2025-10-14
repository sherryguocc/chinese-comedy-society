'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { canDownload } from '@/lib/permissions'
import { File } from '@/types/database'

export default function LibraryPage() {
  const { user, userRole } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const userCanDownload = canDownload(userRole)

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
    if (!userCanDownload) {
      alert('您需要会员权限才能下载文件 Member access required to download files')
      return
    }

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">资料库 Library</h1>
          <p className="text-base-content/60 mt-2">
            当前用户: {user?.email || '未登录'} | 
            角色: {getRoleDisplayName(userRole || 'guest')} |
            下载权限: {userCanDownload ? '✅' : '❌'}
          </p>
        </div>
      </div>

      {!userCanDownload && (
        <div className="alert alert-warning mb-6">
          <span>
            📝 您当前是{getRoleDisplayName(userRole || 'guest')}，只能浏览文件。
            需要会员及以上权限才能下载文件。
          </span>
        </div>
      )}

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
        <>
          {files.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {files.map((file) => (
                <div key={file.id} className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h2 className="card-title text-lg">{file.title}</h2>
                    {file.description && (
                      <p className="text-sm text-base-content/70 mb-4">{file.description}</p>
                    )}
                    
                    <div className="text-xs text-base-content/60 space-y-1">
                      <div>📁 {file.file_name}</div>
                      <div>📏 {(file.file_size / 1024 / 1024).toFixed(2)} MB</div>
                      <div>👤 上传者: {file.uploader?.full_name || '未知'}</div>
                      <div>📅 {new Date(file.created_at).toLocaleDateString()}</div>
                    </div>

                    <div className="card-actions justify-end mt-4">
                      {userCanDownload ? (
                        <button
                          onClick={() => handleDownload(file)}
                          className="btn btn-primary btn-sm"
                        >
                          下载 Download
                        </button>
                      ) : (
                        <button
                          className="btn btn-disabled btn-sm"
                          title="需要会员权限"
                        >
                          需要会员权限
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-bold mb-2">暂无文件</h3>
              <p className="text-base-content/60">资料库还没有文件。</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}