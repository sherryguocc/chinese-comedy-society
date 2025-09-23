'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { File } from '@/types/database'
import { MemberOnly, AdminOnly } from '@/components/PermissionGuard'

export default function FilesViewPage() {
  const { user, profile } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (profile?.role === 'member' || profile?.role === 'admin') {
      fetchFiles()
    }
  }, [profile])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('files')
        .select(`
          *,
          uploader:profiles(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('获取文件失败:', error)
        return
      }
      
      setFiles(data || [])
    } catch (error) {
      console.error('获取文件失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('files')
        .download(filePath)

      if (error) throw error

      // 创建下载链接
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
      alert('下载失败，请稍后重试')
    }
  }

  const deleteFile = async (fileId: string, filePath: string) => {
    if (!confirm('确定要删除这个文件吗？此操作不可撤销。')) return

    try {
      // 从Storage删除文件
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([filePath])

      if (storageError) throw storageError

      // 从数据库删除记录
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)

      if (dbError) throw dbError

      // 更新本地状态
      setFiles(files.filter(f => f.id !== fileId))
      alert('文件删除成功！')

    } catch (error: any) {
      console.error('删除文件失败:', error)
      alert(`删除失败: ${error.message}`)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredFiles = files.filter(file =>
    file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">文件库 Files</h1>
        <p className="text-lg mb-4">请先登录以访问文件库</p>
        <p>Please login to access the files</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">文件库 Files</h1>
        <div className="flex items-center gap-4">
          <div className="badge badge-outline">
            {profile?.role === 'admin' ? '管理员' : profile?.role === 'member' ? '会员' : '访客'}
          </div>
          <AdminOnly>
            <a href="/admin/files" className="btn btn-primary btn-sm">
              文件管理 Manage Files
            </a>
          </AdminOnly>
        </div>
      </div>

      <MemberOnly
        fallback={
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold mb-4">会员专享资源</h2>
            <p className="text-lg text-base-content/60 mb-6">
              文件库仅对会员开放，请联系管理员升级您的账户
              <br />
              File access is restricted to members only. Please contact admin to upgrade your account.
            </p>
            
            {/* 显示当前用户角色调试信息 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="alert alert-info mt-4 max-w-md mx-auto">
                <div className="text-sm">
                  <div>Debug Info:</div>
                  <div>User ID: {user?.id || 'None'}</div>
                  <div>Profile Role: {profile?.role || 'None'}</div>
                  <div>Profile Loading: {loading.toString()}</div>
                </div>
              </div>
            )}
          </div>
        }
      >
        {/* 搜索功能 */}
        <div className="mb-6 flex justify-between items-center">
          <div className="form-control max-w-md">
            <input
              type="text"
              placeholder="搜索文件..."
              className="input input-bordered"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={fetchFiles}
            className="btn btn-outline btn-sm"
            disabled={loading}
          >
            {loading ? '刷新中...' : '🔄 刷新'}
          </button>
        </div>

        {/* 权限测试信息 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="alert alert-info mb-6">
            <div className="text-sm">
              <div><strong>权限测试信息:</strong></div>
              <div>当前角色: {profile?.role}</div>
              <div>文件数量: {files.length}</div>
              <div>加载状态: {loading ? '加载中' : '已完成'}</div>
            </div>
          </div>
        )}

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
                    <p className="text-base-content/70 text-sm mb-2">
                      {file.description}
                    </p>
                  )}

                  <div className="text-xs text-base-content/60 space-y-1">
                    <div>文件名: {file.file_name}</div>
                    <div>大小: {formatFileSize(file.file_size)}</div>
                    <div>类型: {file.file_type.split('/')[1]?.toUpperCase()}</div>
                    <div>上传者: {file.uploader?.full_name || file.uploader?.email}</div>
                    <div>上传时间: {new Date(file.created_at).toLocaleDateString()}</div>
                  </div>

                  <div className="card-actions justify-between mt-4">
                    <button
                      onClick={() => downloadFile(file.path, file.file_name)}
                      className="btn primary-orange btn-sm"
                    >
                      下载 Download
                    </button>
                    
                    <AdminOnly>
                      <button
                        onClick={() => deleteFile(file.id, file.path)}
                        className="btn btn-error btn-sm"
                      >
                        删除 Delete
                      </button>
                    </AdminOnly>
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
              {searchTerm ? '请尝试其他搜索词' : '管理员还没有上传任何文件'}
            </p>
            
            <AdminOnly>
              <div className="mt-4">
                <a href="/admin/files" className="btn btn-primary">
                  上传文件 Upload Files
                </a>
              </div>
            </AdminOnly>
          </div>
        )}
      </MemberOnly>
    </div>
  )
}