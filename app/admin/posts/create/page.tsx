'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'

export default function CreatePost() {
  const { profile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    published: false,
    excerpt: ''
  })

  // 格式化按钮处理
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      setFormData({ ...formData, content: editorRef.current.innerHTML })
    }
  }

  // 图片上传处理
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB')
      return
    }

    setUploadingImage(true)
    try {
      // 生成唯一文件名
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `post-images/${fileName}`

      // 上传到Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      // 插入图片到编辑器
      const imgHtml = `<img src="${publicUrl}" alt="文章图片" style="max-width: 100%; height: auto; margin: 10px 0;" />`
      document.execCommand('insertHTML', false, imgHtml)
      
      if (editorRef.current) {
        setFormData({ ...formData, content: editorRef.current.innerHTML })
      }

      alert('图片上传成功！')
    } catch (error: any) {
      console.error('图片上传失败:', error)
      alert(`图片上传失败: ${error.message}`)
    } finally {
      setUploadingImage(false)
    }
  }

  // 内容变化处理
  const handleContentChange = () => {
    if (editorRef.current) {
      setFormData({ ...formData, content: editorRef.current.innerHTML })
    }
  }

  // 生成摘要
  const generateExcerpt = (htmlContent: string) => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    const textContent = tempDiv.textContent || tempDiv.innerText || ''
    return textContent.substring(0, 200) + (textContent.length > 200 ? '...' : '')
  }

  // 表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('请填写标题和内容')
      return
    }

    setLoading(true)
    try {
      const excerpt = generateExcerpt(formData.content)
      
      const { error } = await (supabase as any)
        .from('posts')
        .insert({
          title: formData.title.trim(),
          content: formData.content,
          excerpt: excerpt,
          author_id: profile?.id,
          published: formData.published
        })

      if (error) throw error

      alert('文章发布成功！')
      router.push('/admin/dashboard')
    } catch (error: any) {
      console.error('发布失败:', error)
      alert(`发布失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout title="发布文章 Create Post" showBackButton={true}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {/* 标题输入 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-lg font-semibold">文章标题 Title *</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input input-bordered text-lg"
                placeholder="请输入文章标题"
                required
              />
            </div>

            {/* 富文本编辑器工具栏 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-lg font-semibold">文章内容 Content *</span>
              </label>
              
              {/* 工具栏 */}
              <div className="flex flex-wrap gap-2 p-3 bg-base-200 rounded-t-lg border">
                {/* 文本格式化 */}
                <button
                  type="button"
                  onClick={() => formatText('bold')}
                  className="btn btn-sm"
                  title="粗体"
                >
                  <strong>B</strong>
                </button>
                <button
                  type="button"
                  onClick={() => formatText('italic')}
                  className="btn btn-sm"
                  title="斜体"
                >
                  <em>I</em>
                </button>
                <button
                  type="button"
                  onClick={() => formatText('underline')}
                  className="btn btn-sm"
                  title="下划线"
                >
                  <u>U</u>
                </button>

                <div className="divider divider-horizontal"></div>

                {/* 标题格式 */}
                <button
                  type="button"
                  onClick={() => formatText('formatBlock', 'h1')}
                  className="btn btn-sm"
                  title="标题1"
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => formatText('formatBlock', 'h2')}
                  className="btn btn-sm"
                  title="标题2"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => formatText('formatBlock', 'h3')}
                  className="btn btn-sm"
                  title="标题3"
                >
                  H3
                </button>

                <div className="divider divider-horizontal"></div>

                {/* 列表 */}
                <button
                  type="button"
                  onClick={() => formatText('insertOrderedList')}
                  className="btn btn-sm"
                  title="有序列表"
                >
                  1.
                </button>
                <button
                  type="button"
                  onClick={() => formatText('insertUnorderedList')}
                  className="btn btn-sm"
                  title="无序列表"
                >
                  •
                </button>

                <div className="divider divider-horizontal"></div>

                {/* 对齐 */}
                <button
                  type="button"
                  onClick={() => formatText('justifyLeft')}
                  className="btn btn-sm"
                  title="左对齐"
                >
                  ⬅
                </button>
                <button
                  type="button"
                  onClick={() => formatText('justifyCenter')}
                  className="btn btn-sm"
                  title="居中"
                >
                  ↔
                </button>
                <button
                  type="button"
                  onClick={() => formatText('justifyRight')}
                  className="btn btn-sm"
                  title="右对齐"
                >
                  ➡
                </button>

                <div className="divider divider-horizontal"></div>

                {/* 图片上传 */}
                <label className="btn btn-sm primary-orange">
                  {uploadingImage ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      上传中...
                    </>
                  ) : (
                    <>📷 插入图片</>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>

                {/* 撤销重做 */}
                <button
                  type="button"
                  onClick={() => formatText('undo')}
                  className="btn btn-sm"
                  title="撤销"
                >
                  ↶
                </button>
                <button
                  type="button"
                  onClick={() => formatText('redo')}
                  className="btn btn-sm"
                  title="重做"
                >
                  ↷
                </button>
              </div>

              {/* 编辑区域 */}
              <div
                ref={editorRef}
                contentEditable
                className="min-h-96 p-4 border border-t-0 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                style={{ lineHeight: '1.6' }}
                onInput={handleContentChange}
                onPaste={(e) => {
                  // 延迟更新以确保粘贴内容被处理
                  setTimeout(handleContentChange, 10)
                }}
              />
              
              <div className="label">
                <span className="label-text-alt">
                  支持富文本格式、图片插入。图片大小限制5MB。
                </span>
              </div>
            </div>

            {/* 发布选项 */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="checkbox checkbox-primary"
                />
                <span className="label-text">立即发布 Publish immediately</span>
              </label>
              <div className="label">
                <span className="label-text-alt">
                  取消勾选将保存为草稿，可稍后发布
                </span>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="card-actions justify-end mt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-outline"
                disabled={loading}
              >
                取消 Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.content.trim()}
                className="btn primary-orange"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    发布中...
                  </>
                ) : (
                  formData.published ? '发布文章 Publish' : '保存草稿 Save Draft'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  )
}

