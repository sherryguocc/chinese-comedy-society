'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { File } from '@/types/database'

export default function LibraryPage() {
  const { user, profile } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [mounted, setMounted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // 仅在登录时联表查询 uploader；访客只查 files
  const fetchFiles = async (withUploader: boolean) => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const base = supabase.from('files')
      const query = withUploader
        ? base.select(`
            id, title, description, file_name, file_size, created_at, path,
            uploader:profiles(id, full_name, avatar_url)
          `)
        : base.select(`id, title, description, file_name, file_size, created_at, path`)

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('获取文件失败:', error)
        setFiles([])
        setErrorMsg(error.message)
      } else {
        setFiles(data || [])
      }
    } catch (e: any) {
      console.error('获取文件失败:', e)
      setFiles([])
      setErrorMsg(e?.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchFiles(!!user) // 登录才联 profiles；访客不联表，避免被 profiles RLS 拦截
  }, [user])

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">资料库 Library</h1>
        <div className="text-center py-12">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4">正在加载...</p>
        </div>
      </div>
    )
  }

  const downloadFile = async (filePath: string, fileName: string) => {
    // 权限检查（Only members can download）
    if (!user || !profile || !['member', 'admin'].includes(profile.role)) {
      alert('只有会员才能下载文件，请联系管理员升级账户 / Only members can download files, please contact admin to upgrade your account')
      return
    }

    try {
      const { data, error } = await supabase.storage.from('files').download(filePath)
      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('下载失败:', error)
      alert('下载失败，请稍后重试 / Download failed, please try again later')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isMember = user && profile && ['member', 'admin'].includes(profile.role)

  const filteredFiles = files.filter((file) =>
    (file.title ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.description ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.file_name ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">资料库 Library</h1>
        <div className="flex items-center gap-2">
          <div className="badge badge-outline">
            {!user
              ? '访客 Guest'
              : profile?.role === 'admin'
              ? '管理员 Admin'
              : profile?.role === 'member'
              ? '会员 Member'
              : '访客 Guest'}
          </div>
        </div>
      </div>

      {!isMember && (
        <div className="alert alert-info mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 className="font-bold">会员专享下载 Member Exclusive Downloads</h3>
            <div className="text-xs">
              只有会员才能下载文件。请联系管理员升级您的账户。
              <br />
              You can browse all materials, but only members can download files. Please contact admin to upgrade your account.
            </div>
          </div>
        </div>
      )}

      {/* 错误提示（如果因为 RLS 或查询报错） */}
      {errorMsg && (
        <div className="alert alert-error mb-6 text-sm">
          <span>加载出错：{errorMsg}</span>
        </div>
      )}

      <div className="mb-6">
        <div className="form-control max-w-md">
          <input
            type="text"
            placeholder="搜索文件 Search files..."
            className="input input-bordered"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="skeleton h-4 w-28"></div>
                <div className="skeleton h-20 w-full"></div>
                <div className="skeleton h-4 w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file) => (
            <div key={file.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-lg">{file.title}</h3>

                {file.description && (
                  <p className="text-base-content/70 text-sm mb-2">{file.description}</p>
                )}

                <div className="text-xs text-base-content/60 space-y-1">
                  <div>文件名 File: {file.file_name || 'N/A'}</div>
                  <div>大小 Size: {formatFileSize(file.file_size as unknown as number)}</div>
                  <div>上传时间 Uploaded: {file.created_at ? new Date(file.created_at as any).toLocaleDateString() : 'N/A'}</div>
                </div>

                <div className="card-actions justify-end mt-4">
                  {isMember ? (
                    <button
                      onClick={() => downloadFile((file as any).path, file.file_name || file.title)}
                      className="btn btn-primary btn-sm"
                    >
                      下载 Download
                    </button>
                  ) : (
                    <div className="text-center text-sm text-base-content/60">
                      <div className="flex items-center justify-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        只有会员才能下载
                      </div>
                      <div className="text-xs mt-1 opacity-75">Members only download</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-bold mb-2">
            {searchTerm ? '未找到匹配的文件' : '暂无文件'}
          </h3>
          <p className="text-base-content/60">
            {searchTerm ? '请尝试其他搜索词 Try other search terms' : '管理员还没有上传任何文件 No files uploaded yet'}
          </p>
        </div>
      )}
    </div>
  )
}
