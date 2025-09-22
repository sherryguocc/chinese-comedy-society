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
    file: null as globalThis.File | null
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

  // 测试Storage连接的函数
  const testStorageConnection = async () => {
    try {
      console.log('测试Storage连接...')
      
      // 1. 测试列出buckets - 这可能会因为权限问题失败
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
        
        if (bucketsError) {
          console.error('获取buckets失败 (这是正常的，可能是权限限制):', bucketsError)
          console.log('跳过bucket列表检查，直接测试files bucket...')
        } else {
          console.log('可用的buckets:', buckets)
          const filesBucket = buckets.find(b => b.name === 'files')
          if (filesBucket) {
            console.log('Files bucket存在:', filesBucket)
          }
        }
      } catch (listError) {
        console.log('无法列出buckets，但这不影响文件上传功能')
      }
      
      // 2. 直接测试files bucket的上传功能
      console.log('直接测试files bucket上传功能...')
      const testContent = new Blob(['test content for storage test'], { type: 'text/plain' })
      const testPath = `test/${Date.now()}.txt`
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('files')
        .upload(testPath, testContent)
      
      if (uploadError) {
        console.error('测试上传失败:', uploadError)
        alert(`Storage权限测试失败: ${uploadError.message}\n\n可能的解决方案:\n1. 检查files bucket是否为public\n2. 检查Storage policies设置\n3. 确认RLS策略正确`)
        return
      }
      
      console.log('测试上传成功:', uploadData)
      
      // 3. 删除测试文件
      const { error: deleteError } = await supabase.storage.from('files').remove([testPath])
      if (deleteError) {
        console.warn('删除测试文件失败:', deleteError)
      } else {
        console.log('测试文件删除成功')
      }
      
      alert('Storage连接和权限测试通过！可以正常上传文件。')
      
    } catch (error: any) {
      console.error('Storage连接测试失败:', error)
      alert(`Storage连接测试失败: ${error.message}`)
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
      // 调试信息
      console.log('=== 开始文件上传流程 ===')
      console.log('当前用户:', profile)
      console.log('用户ID:', profile?.id)
      console.log('用户角色:', profile?.role)
      console.log('文件信息:', {
        name: uploadForm.file.name,
        size: uploadForm.file.size,
        type: uploadForm.file.type,
        lastModified: uploadForm.file.lastModified
      })

      // 检查文件大小，对大文件给出提示
      const fileSizeInMB = uploadForm.file.size / (1024 * 1024)
      console.log(`文件大小: ${fileSizeInMB.toFixed(2)} MB`)
      
      if (fileSizeInMB > 10) {
        console.log('文件较大，可能需要更长的上传时间')
      }
      
      // 生成唯一文件名
      const fileExt = uploadForm.file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `documents/${fileName}`

      console.log('生成的文件路径:', filePath)
      console.log('文件扩展名:', fileExt)

      // 检查Supabase客户端状态
      console.log('检查认证状态...')
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('获取用户认证状态失败:', userError)
        throw new Error(`认证状态检查失败: ${userError.message}`)
      }
      
      console.log('当前认证用户:', user?.email)
      
      if (!user) {
        throw new Error('用户未登录，请重新登录后再试')
      }

      // 开始上传到Storage
      console.log('=== 开始上传到Storage ===')
      console.log('Storage Bucket: files')
      console.log('上传路径:', filePath)
      console.log('文件对象:', uploadForm.file.constructor.name)
      
      // 根据文件大小动态设置超时时间
      const timeoutDuration = Math.max(60000, fileSizeInMB * 10000) // 最少60秒，每MB增加10秒
      console.log(`设置超时时间: ${timeoutDuration / 1000}秒`)
      
      // 尝试使用简化的上传选项
      console.log('使用简化的上传配置...')
      const uploadPromise = supabase.storage
        .from('files')
        .upload(filePath, uploadForm.file, {
          upsert: false
        })

      console.log('Storage上传请求已发送，等待响应...')

      // 动态超时
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => {
          console.log('上传超时，文件大小:', fileSizeInMB.toFixed(2), 'MB')
          reject(new Error(`Storage上传超时(${timeoutDuration / 1000}秒)。文件大小: ${fileSizeInMB.toFixed(2)}MB`))
        }, timeoutDuration)
      )

      const result = await Promise.race([uploadPromise, timeoutPromise])
      const { error: uploadError, data: uploadData } = result as any

      console.log('Storage上传结果:', { uploadError, uploadData })

      if (uploadError) {
        console.error('=== Storage上传错误详情 ===')
        console.error('错误对象:', uploadError)
        console.error('错误消息:', uploadError.message)
        console.error('错误代码:', uploadError.statusCode)
        console.error('错误详情:', uploadError.error)
        
        // 根据具体错误类型提供解决方案
        if (uploadError.statusCode === 403) {
          throw new Error(`Storage权限被拒绝。请检查:\n1. files bucket是否存在\n2. bucket是否为public\n3. Storage policies是否正确设置`)
        } else if (uploadError.statusCode === 404) {
          throw new Error(`Storage bucket "files" 不存在。请在Supabase Dashboard中创建名为 "files" 的bucket`)
        } else if (uploadError.statusCode === 413) {
          throw new Error(`文件太大，超过Storage限制`)
        } else if (uploadError.message?.includes('timeout') || uploadError.message?.includes('network')) {
          throw new Error(`网络连接问题。请检查:\n1. 网络连接是否稳定\n2. 尝试较小的文件\n3. 稍后重试`)
        } else {
          throw new Error(`Storage上传失败: ${uploadError.message}`)
        }
      }

      if (!uploadData) {
        throw new Error('Storage上传成功但未返回数据')
      }

      console.log('=== Storage上传成功 ===')
      console.log('上传数据:', uploadData)

      // 简化验证步骤 - 不验证文件存在性，直接进行数据库操作
      console.log('跳过文件存在性验证，直接保存数据库记录...')

      // 保存文件信息到数据库
      console.log('=== 开始保存到数据库 ===')
      
      const fileData = {
        title: uploadForm.title.trim(),
        description: uploadForm.description.trim() || null,
        path: filePath,
        file_name: uploadForm.file.name,
        file_size: uploadForm.file.size,
        file_type: uploadForm.file.type,
        uploader_id: profile.id
      }
      
      console.log('数据库插入数据:', fileData)

      const { error: dbError, data: insertedData } = await supabase
        .from('files')
        .insert(fileData)
        .select('*')

      if (dbError) {
        console.error('=== 数据库插入错误 ===')
        console.error('错误详情:', {
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          code: dbError.code
        })
        
        // 清理已上传的文件
        console.log('清理Storage中的文件...')
        try {
          await supabase.storage.from('files').remove([filePath])
          console.log('✓ 文件清理成功')
        } catch (cleanupError) {
          console.error('文件清理失败:', cleanupError)
        }
        
        throw new Error(`数据库保存失败: ${dbError.message}`)
      }

      console.log('=== 数据库保存成功 ===')
      console.log('插入的数据:', insertedData)

      // 重置表单
      setUploadForm({
        title: '',
        description: '',
        file: null
      })

      // 重置文件输入
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      // 刷新文件列表
      await fetchFiles()
      
      console.log('=== 文件上传完成 ===')
      alert('文件上传成功！')

    } catch (error: any) {
      console.error('=== 文件上传失败 ===')
      console.error('错误详情:', error)
      console.error('错误堆栈:', error.stack)
      
      // 提供更友好的错误信息
      let errorMessage = error.message || '未知错误'
      
      if (error.message?.includes('超时')) {
        errorMessage += '\n\n建议:\n1. 检查网络连接\n2. 尝试上传较小的文件\n3. 稍后重试'
      }
      
      alert(`上传失败: ${errorMessage}`)
    } finally {
      setUploadLoading(false)
      console.log('=== 上传流程结束 ===')
    }
  }

  // 添加一个简化的测试上传函数
  const testSimpleUpload = async () => {
    try {
      console.log('=== 测试简单上传 ===')
      
      // 创建一个小的测试文件
      const testContent = 'Test file content for upload test'
      const testBlob = new Blob([testContent], { type: 'text/plain' })
      const testPath = `test/simple-test-${Date.now()}.txt`
      
      console.log('测试文件路径:', testPath)
      console.log('测试文件大小:', testBlob.size, 'bytes')
      
      const { error, data } = await supabase.storage
        .from('files')
        .upload(testPath, testBlob)
      
      if (error) {
        console.error('简单上传测试失败:', error)
        alert(`简单上传测试失败: ${error.message}`)
        return
      }
      
      console.log('简单上传测试成功:', data)
      
      // 清理测试文件
      await supabase.storage.from('files').remove([testPath])
      
      alert('简单上传测试成功！可以尝试上传您的文件。')
      
    } catch (error: any) {
      console.error('简单上传测试失败:', error)
      alert(`简单上传测试失败: ${error.message}`)
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

  return (
    <AdminLayout title="文件管理 File Management" showBackButton={true}>
      {/* 文件上传区域 */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title text-2xl">文件上传 File Upload</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={testStorageConnection}
                className="btn btn-outline btn-sm"
              >
                🔧 测试Storage连接
              </button>
              <button
                type="button"
                onClick={testSimpleUpload}
                className="btn btn-outline btn-sm"
              >
                📤 测试简单上传
              </button>
            </div>
          </div>
          
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
              <p>• 大文件上传可能需要较长时间，请耐心等待</p>
              <p>• 如果上传超时，请尝试较小的文件或稍后重试</p>
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


