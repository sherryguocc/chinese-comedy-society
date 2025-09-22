'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { AdminOnly } from '@/components/PermissionGuard'

export default function CreatePost() {
  const { profile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    published: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          title: formData.title,
          content: formData.content,
          author_id: profile.id,
          published: formData.published
        })

      if (error) throw error

      alert('文章发布成功！ Post created successfully!')
      router.push('/posts')
    } catch (error) {
      console.error('发布文章失败 Error creating post:', error)
      alert('发布失败 Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">权限不足 Access Denied</h1>
        <p className="mt-4">您没有发布文章的权限。You don't have permission to create posts.</p>
      </div>
    )
  }

  return (
    <AdminOnly>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">发布文章 Create Post</h1>
          <button 
            onClick={() => router.back()} 
            className="btn btn-outline"
          >
            返回 Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              {/* 标题 */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-lg font-semibold">文章标题 Post Title</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="请输入文章标题 Enter post title..."
                  required
                />
              </div>

              {/* 内容 */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-lg font-semibold">文章内容 Post Content</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="textarea textarea-bordered w-full h-64"
                  placeholder="请输入文章内容 Enter post content..."
                  required
                />
              </div>

              {/* 发布状态 */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start space-x-4">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text">立即发布 Publish immediately</span>
                </label>
              </div>

              {/* 提交按钮 */}
              <div className="card-actions justify-end mt-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="btn btn-outline"
                >
                  取消 Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn primary-orange"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      发布中...
                    </>
                  ) : (
                    '发布文章 Publish Post'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminOnly>
  )
}
