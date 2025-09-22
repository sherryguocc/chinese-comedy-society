'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { File } from '@/types/database'
import AdminLayout from '@/components/AdminLayout'

export default function FileManagementPage() {
  const { profile } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadLoading, setUploadLoading] = useState(false)

  // 文件上传表单状态
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    file: null as File | null
  })

  // 允许的文档文件类型
  const allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/rtf'
  ]

  const maxFileSize = 50 * 1024 * 1024 // 50MB

  useEffect(() => {
    if (profile?.role === 'admin') {
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

      if (error) throw error
      setFiles(data || [])
    } catch (error: any) {
      console.error('获取文件列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadForm.file || !uploadForm.title.trim() || !profile?.id) return

    // 验证文件类型
    if (!allowedFileTypes.includes(uploadForm.file.type)) {
      alert('不支持的文件类型！只允许上传文档文件（PDF、Word、Excel、PowerPoint、TXT等）')
      return
    }

    // 验证文件大小
    if (uploadForm.file.size > maxFileSize) {
      alert('文件大小超过限制！最大允许50MB')
      return
    }

    setUploadLoading(true)
    try {
      // 生成唯一文件名
      const fileExt = uploadForm.file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `documents/${fileName}`

      // 上传文件到Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, uploadForm.file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // 保存文件信息到数据库
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          title: uploadForm.title.trim(),
          description: uploadForm.description.trim() || null,
          path: filePath,
          file_name: uploadForm.file.name,
          file_size: uploadForm.file.size,
          file_type: uploadForm.file.type,
          uploader_id: profile.id
        })

      if (dbError) throw dbError

      // 重置表单
      setUploadForm({
        title: '',
        description: '',
        file: null
      })

      // 刷新文件列表
      await fetchFiles()
      alert('文件上传成功！')

    } catch (error: any) {
      console.error('文件上传失败:', error)
      alert(`上传失败: ${error.message}`)
    } finally {
      setUploadLoading(false)
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

  if (profile?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">
          权限不足 Access Denied
        </h1>
        <p className="mt-4">您没有访问文件管理的权限。</p>
        <p>You don't have permission to access file management.</p>
      </div>
    )
  }

  return (
    <AdminLayout 
      title="文件管理 File Management" 
      showBackButton={true}
    >
      {/* 文件上传区域 */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">文件上传 File Upload</h2>
          
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">文件标题 Title *</span>
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="input input-bordered"
                  placeholder="请输入文件标题"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">选择文件 File *</span>
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                  className="file-input file-input-bordered"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf"
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">文件描述 Description</span>
              </label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                className="textarea textarea-bordered"
                placeholder="请输入文件描述（可选）"
                rows={3}
              />
            </div>

            <div className="text-sm text-gray-500">
              <p>• 支持的文件类型：PDF、Word、Excel、PowerPoint、TXT、RTF</p>
              <p>• 最大文件大小：50MB</p>
            </div>

            <div className="card-actions">
              <button
                type="submit"
                disabled={uploadLoading || !uploadForm.file || !uploadForm.title.trim()}
                className="btn primary-orange"
              >
                {uploadLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    上传中...
                  </>
                ) : (
                  '上传文件 Upload File'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 文件列表 */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">
            已上传文件 Uploaded Files
            <div className="badge badge-secondary">{files.length}</div>
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : files.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>标题 Title</th>
                    <th>文件名 File Name</th>
                    <th>大小 Size</th>
                    <th>类型 Type</th>
                    <th>上传者 Uploader</th>
                    <th>上传时间 Created</th>
                    <th>操作 Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.id}>
                      <td>
                        <div>
                          <div className="font-semibold">{file.title}</div>
                          {file.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {file.description.substring(0, 50)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="text-sm">{file.file_name}</td>
                      <td className="text-sm">{formatFileSize(file.file_size)}</td>
                      <td className="text-sm">{file.file_type.split('/')[1]?.toUpperCase()}</td>
                      <td className="text-sm">{file.uploader?.full_name || file.uploader?.email}</td>
                      <td className="text-sm">{new Date(file.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => deleteFile(file.id, file.path)}
                            className="btn btn-sm btn-error"
                          >
                            删除 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-base-200 rounded-lg">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-xl font-bold mb-2">暂无文件</h3>
              <p className="text-base-content/60">
                还没有上传任何文件，请使用上面的表单上传文档。
                <br />
                No files uploaded yet. Please use the form above to upload documents.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

