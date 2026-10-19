'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/permissions'
import type { File as FileRecord } from '@/types/database'
import AdminLayout from '@/components/AdminLayout'

// 允许的文档类型和大小
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/rtf',
]
const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf'
const MAX_SIZE = 50 * 1024 * 1024 // 50MB

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NZ', { day: '2-digit', month: '2-digit', year: 'numeric' })

const formatSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

type EditState = { id: string; title: string; description: string } | null

export default function FileManagementPage() {
  const { user, userRole } = useAuth()
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 上传
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 编辑
  const [editing, setEditing] = useState<EditState>(null)
  const [saving, setSaving] = useState(false)

  // 删除
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchFiles = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('files')
      .select('*, uploader:profiles(id, full_name, username, role)')
      .order('created_at', { ascending: false })
    if (error) {
      setMessage({ type: 'error', text: `获取文件列表失败 Failed to load files: ${error.message}` })
    } else {
      setFiles(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin(userRole)) fetchFiles()
  }, [userRole])

  // ---------- 上传 ----------
  const handleFileChange = (file: globalThis.File | null) => {
    setSelectedFile(file)
    // 未填标题时，用文件名（去掉扩展名）作为默认标题
    if (file && !form.title.trim()) {
      setForm(f => ({ ...f, title: file.name.replace(/\.[^.]+$/, '') }))
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!selectedFile || !form.title.trim() || !user) return

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setMessage({ type: 'error', text: '不支持的文件类型。仅支持 PDF、Word、Excel、PowerPoint、TXT、RTF。' })
      return
    }
    if (selectedFile.size > MAX_SIZE) {
      setMessage({ type: 'error', text: '文件超过 50MB 限制。File exceeds 50MB.' })
      return
    }

    setUploading(true)
    const ext = selectedFile.name.split('.').pop()
    const path = `documents/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(path, selectedFile, { upsert: false })
      if (uploadError) throw new Error(`上传到存储失败 Storage upload failed: ${uploadError.message}`)

      const { error: dbError } = await (supabase.from('files') as any).insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        path,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        uploader_id: user.id,
      })
      if (dbError) {
        // 数据库写入失败时清理已上传的文件
        await supabase.storage.from('files').remove([path])
        throw new Error(`保存文件信息失败 Failed to save record: ${dbError.message}`)
      }

      setForm({ title: '', description: '' })
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setMessage({ type: 'success', text: '上传成功 Uploaded successfully' })
      await fetchFiles()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setUploading(false)
    }
  }

  // ---------- 编辑 ----------
  const handleSaveEdit = async () => {
    if (!editing || !editing.title.trim()) return
    setSaving(true)
    const { error } = await (supabase.from('files') as any)
      .update({
        title: editing.title.trim(),
        description: editing.description.trim() || null,
      })
      .eq('id', editing.id)
    setSaving(false)

    if (error) {
      setMessage({ type: 'error', text: `保存失败 Save failed: ${error.message}` })
      return
    }
    setFiles(prev =>
      prev.map(f =>
        f.id === editing.id
          ? { ...f, title: editing.title.trim(), description: editing.description.trim() || undefined }
          : f
      )
    )
    setEditing(null)
    setMessage({ type: 'success', text: '已保存 Saved' })
  }

  // ---------- 删除 ----------
  const handleDelete = async (file: FileRecord) => {
    if (!confirm(`确定删除「${file.title}」吗？此操作不可撤销。\nDelete "${file.title}"? This cannot be undone.`)) return
    setDeletingId(file.id)
    try {
      const { error: storageError } = await supabase.storage.from('files').remove([file.path])
      if (storageError) throw storageError
      const { error: dbError } = await supabase.from('files').delete().eq('id', file.id)
      if (dbError) throw dbError
      setFiles(prev => prev.filter(f => f.id !== file.id))
      setMessage({ type: 'success', text: '已删除 Deleted' })
    } catch (err: any) {
      setMessage({ type: 'error', text: `删除失败 Delete failed: ${err.message}` })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminLayout title="文件管理 File Management" requiredPermission="UPLOAD_FILES">
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-6`}>
          <span>{message.text}</span>
          <button className="btn btn-ghost btn-xs" onClick={() => setMessage(null)}>✕</button>
        </div>
      )}

      {/* 上传 */}
      <div className="card bg-base-100 shadow border border-base-200 mb-8">
        <div className="card-body">
          <h2 className="card-title">上传文件 Upload</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="form-control">
                <span className="label-text mb-1">选择文件 File *</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT}
                  onChange={e => handleFileChange(e.target.files?.[0] || null)}
                  className="file-input file-input-bordered w-full"
                  required
                />
              </label>
              <label className="form-control">
                <span className="label-text mb-1">标题 Title *</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="显示给会员的文件名"
                  required
                />
              </label>
            </div>
            <label className="form-control">
              <span className="label-text mb-1">描述 Description</span>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="textarea textarea-bordered w-full"
                placeholder="可选 Optional"
                rows={2}
              />
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={uploading || !selectedFile || !form.title.trim()}
                className="btn btn-primary"
              >
                {uploading && <span className="loading loading-spinner loading-sm"></span>}
                {uploading ? '上传中… Uploading…' : '上传 Upload'}
              </button>
              <span className="text-sm text-base-content/60">
                PDF / Word / Excel / PowerPoint / TXT / RTF，最大 50MB
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* 文件列表 */}
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body">
          <h2 className="card-title">
            全部文件 All Files
            <span className="badge badge-neutral">{files.length}</span>
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : files.length === 0 ? (
            <p className="text-center py-8 text-base-content/60">还没有文件 No files yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>标题 Title</th>
                    <th className="hidden md:table-cell">原文件名 File</th>
                    <th className="hidden sm:table-cell">大小 Size</th>
                    <th className="hidden sm:table-cell">上传时间 Uploaded</th>
                    <th className="text-right">操作 Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map(file =>
                    editing?.id === file.id ? (
                      <tr key={file.id} className="bg-base-200">
                        <td colSpan={5}>
                          <div className="space-y-2">
                            <input
                              className="input input-bordered input-sm w-full"
                              value={editing.title}
                              onChange={e => setEditing({ ...editing, title: e.target.value })}
                              placeholder="标题 Title"
                              autoFocus
                            />
                            <textarea
                              className="textarea textarea-bordered textarea-sm w-full"
                              value={editing.description}
                              onChange={e => setEditing({ ...editing, description: e.target.value })}
                              placeholder="描述 Description"
                              rows={2}
                            />
                            <div className="flex gap-2 justify-end">
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>
                                取消 Cancel
                              </button>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={handleSaveEdit}
                                disabled={saving || !editing.title.trim()}
                              >
                                {saving ? '保存中…' : '保存 Save'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={file.id}>
                        <td>
                          <div className="font-semibold">{file.title}</div>
                          {file.description && (
                            <div className="text-xs text-base-content/60 line-clamp-2">{file.description}</div>
                          )}
                        </td>
                        <td className="hidden md:table-cell text-sm">{file.file_name}</td>
                        <td className="hidden sm:table-cell text-sm whitespace-nowrap">{formatSize(file.file_size)}</td>
                        <td className="hidden sm:table-cell text-sm whitespace-nowrap">{formatDate(file.created_at)}</td>
                        <td>
                          <div className="flex gap-2 justify-end">
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() =>
                                setEditing({ id: file.id, title: file.title, description: file.description || '' })
                              }
                            >
                              编辑 Edit
                            </button>
                            <button
                              className="btn btn-error btn-outline btn-sm"
                              onClick={() => handleDelete(file)}
                              disabled={deletingId === file.id}
                            >
                              {deletingId === file.id ? '删除中…' : '删除 Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
