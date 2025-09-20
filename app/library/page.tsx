'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { File } from '@/types/database'

export default function LibraryPage() {
  const { user, profile } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const isMember = profile?.role === 'member' || profile?.role === 'admin'

  useEffect(() => {
    if (isMember) {
      fetchFiles()
    } else {
      setLoading(false)
    }
  }, [isMember])

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select(`
          *,
          uploader:profiles(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (file: File) => {
    if (!isMember) return

    setDownloadingId(file.id)
    try {
      // Call API to get signed URL for download
      const response = await fetch('/api/sign-download-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath: file.file_path }),
      })

      if (!response.ok) throw new Error('Failed to generate download URL')

      const { url } = await response.json()
      
      // Create download link and trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = file.title
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('下载失败，请稍后重试。 Download failed, please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold mb-4">
            需要登录 Login Required
          </h1>
          <p className="text-base-content/70 mb-6">
            请先登录以访问资料库。 Please login to access the library.
          </p>
          <a href="/auth/login" className="btn btn-primary">
            登录 Login
          </a>
        </div>
      </div>
    )
  }

  if (!isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👥</div>
          <h1 className="text-3xl font-bold mb-4">
            仅限会员 Members Only
          </h1>
          <p className="text-base-content/70 mb-6">
            只有会员才能访问资料库。请联系管理员升级您的账户。
            <br />
            Only members can access the library. Please contact admin to upgrade your account.
          </p>
          <div className="badge badge-outline badge-lg">
            当前角色 Current Role: {profile?.role}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          资料库 Library
        </h1>
        <div className="badge badge-primary badge-lg">
          会员专享 Members Only
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="skeleton h-6 w-48"></div>
                <div className="skeleton h-16 w-full"></div>
                <div className="skeleton h-4 w-32"></div>
                <div className="skeleton h-10 w-24"></div>
              </div>
            </div>
          ))}
        </div>
      ) : files.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map((file) => (
            <div key={file.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <h2 className="card-title text-lg">
                  📄 {file.title}
                </h2>
                {file.description && (
                  <p className="text-base-content/70 mb-4">
                    {file.description}
                  </p>
                )}
                <div className="space-y-2 text-sm text-base-content/60">
                  <p>大小 Size: {formatFileSize(file.file_size)}</p>
                  <p>上传者 Uploader: {file.uploader?.full_name || file.uploader?.email}</p>
                  <p>上传时间 Uploaded: {new Date(file.created_at).toLocaleDateString('zh-CN')}</p>
                </div>
                <div className="card-actions justify-end mt-4">
                  <button
                    onClick={() => handleDownload(file)}
                    disabled={downloadingId === file.id}
                    className={`btn btn-primary ${downloadingId === file.id ? 'loading' : ''}`}
                  >
                    {downloadingId === file.id ? '下载中... Downloading...' : '下载 Download'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-2xl font-bold mb-2">
            暂无文件 No Files Available
          </h3>
          <p className="text-base-content/60">
            管理员还未上传任何PDF文件。
            <br />
            No PDF files have been uploaded by administrators yet.
          </p>
        </div>
      )}
    </div>
  )
}