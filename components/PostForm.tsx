'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export type PostPayload = { title: string; content: string }

interface PostFormProps {
  initialTitle?: string
  initialContent?: string
  submitLabel: string
  submittingLabel: string
  onSubmit: (payload: PostPayload) => Promise<void>
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

// 工具栏按钮：[显示, 标题, execCommand 命令, 参数]
const TOOLBAR: [React.ReactNode, string, string, string?][][] = [
  [[<strong key="b">B</strong>, '粗体 Bold', 'bold'], [<em key="i">I</em>, '斜体 Italic', 'italic'], [<u key="u">U</u>, '下划线 Underline', 'underline']],
  [['H2', '大标题 Heading', 'formatBlock', 'h2'], ['H3', '小标题 Subheading', 'formatBlock', 'h3'], ['¶', '正文 Paragraph', 'formatBlock', 'p']],
  [['1.', '有序列表', 'insertOrderedList'], ['•', '无序列表', 'insertUnorderedList'], ['❝', '引用 Quote', 'formatBlock', 'blockquote']],
  [['⬅', '左对齐', 'justifyLeft'], ['↔', '居中', 'justifyCenter'], ['➡', '右对齐', 'justifyRight']],
  [['↶', '撤销 Undo', 'undo'], ['↷', '重做 Redo', 'redo']],
]

const isEmptyHtml = (html: string) =>
  !html.replace(/<(?!img)[^>]*>/gi, '').replace(/&nbsp;/g, '').trim() && !/<img/i.test(html)

export default function PostForm({
  initialTitle = '',
  initialContent = '',
  submitLabel,
  submittingLabel,
  onSubmit,
}: PostFormProps) {
  const router = useRouter()
  const editorRef = useRef<HTMLDivElement>(null)
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 编辑器是非受控的 contentEditable：只在初始化时写入一次内容
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialContent
  }, [initialContent])

  const syncContent = () => {
    if (editorRef.current) setContent(editorRef.current.innerHTML)
  }

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    syncContent()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)

    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件 Please choose an image')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('图片不能超过 5MB Image must be under 5MB')
      return
    }

    setUploadingImage(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `post-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
      exec('insertHTML', `<img src="${publicUrl}" alt="" style="max-width:100%;height:auto;margin:10px 0;" />`)
    } catch (err: any) {
      setError(`图片上传失败 Image upload failed: ${err.message}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const html = editorRef.current?.innerHTML ?? content
    if (!title.trim() || isEmptyHtml(html)) {
      setError('请填写标题和内容 Please fill in title and content')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({ title: title.trim(), content: html })
    } catch (err: any) {
      setError(err?.message || '保存失败 Save failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg font-semibold">文章标题 Title *</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input input-bordered text-lg w-full"
              placeholder="请输入文章标题 Enter title"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg font-semibold">文章内容 Content *</span>
            </label>

            <div className="flex flex-wrap items-center gap-1 p-2 bg-base-200 rounded-t-lg border border-base-300">
              {TOOLBAR.map((group, gi) => (
                <div key={gi} className="flex gap-1 pr-2 mr-1 border-r border-base-300 last:border-r-0">
                  {group.map(([label, tip, cmd, val]) => (
                    <button
                      key={tip}
                      type="button"
                      title={tip}
                      className="btn btn-sm btn-ghost min-w-9"
                      // 用 onMouseDown + preventDefault，避免点击按钮时编辑器失去选区
                      onMouseDown={e => {
                        e.preventDefault()
                        exec(cmd, val)
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ))}
              <label className={`btn btn-sm btn-primary ml-auto ${uploadingImage ? 'btn-disabled' : ''}`}>
                {uploadingImage ? <span className="loading loading-spinner loading-xs"></span> : '📷'}
                {uploadingImage ? '上传中…' : '插入图片 Image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            </div>

            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="prose max-w-none min-h-96 p-4 border border-t-0 border-base-300 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              onInput={syncContent}
              onBlur={syncContent}
            />
            <div className="label">
              <span className="label-text-alt">支持富文本格式和图片（单张 ≤ 5MB）。</span>
            </div>
          </div>

          <div className="card-actions justify-end mt-4">
            <button type="button" onClick={() => router.back()} className="btn btn-outline" disabled={submitting}>
              取消 Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || uploadingImage}>
              {submitting && <span className="loading loading-spinner loading-sm"></span>}
              {submitting ? submittingLabel : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
