'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Post } from '@/types/database'

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchPost(params.id as string)
    }
  }, [params.id])

  const fetchPost = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('id', id)
        .eq('published', true)
        .single()

      if (error) throw error
      setPost(data)
    } catch (error) {
      console.error('获取文章失败:', error)
      router.push('/posts')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">文章未找到</h1>
        <p>Article not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <article className="bg-base-100 shadow-xl rounded-lg overflow-hidden">
        {/* 文章头部 */}
        <div className="p-8 border-b">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center text-base-content/60 text-sm">
            <div className="user-avatar user-avatar-sm mr-3">
              {post.author?.full_name?.[0] || post.author?.email?.[0] || 'A'}
            </div>
            <div>
              <div className="font-medium">
                {post.author?.full_name || post.author?.email}
              </div>
              <div>
                {new Date(post.created_at).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 文章内容 */}
        <div className="p-8">
          <div
            className="prose prose-lg max-w-none"
            style={{
              lineHeight: '1.8',
              fontSize: '16px',
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* 文章底部 */}
        <div className="p-8 bg-base-200 border-t">
          <button onClick={() => router.back()} className="btn btn-outline">
            返回 Back
          </button>
        </div>
      </article>
    </div>
  )
}