'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Post } from '@/types/database'
import { AdminOnly } from '@/components/PermissionGuard'

interface LatestPostsSectionProps {
  initialPosts: Post[]
}

export default function LatestPostsSection({ initialPosts }: LatestPostsSectionProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLatestPosts = async () => {
    try {
      setError(null)
      setLoading(true)
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(id, email, username, full_name, phone_number, role, created_at)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        throw error
      }

      setPosts(data || [])
    } catch (error: any) {
      console.error('Error fetching posts:', error)
      setError(`获取文章失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">
          最新文章 Latest Posts
        </h2>
        <div className="flex gap-2">
          <Link href="/posts" className="btn btn-outline">
            查看全部 View All
          </Link>
          <AdminOnly>
            <Link href="/admin/posts/create" className="btn primary-orange">
              发布文章 Create Post
            </Link>
          </AdminOnly>
        </div>
      </div>

      {error ? (
        <div className="alert alert-error">
          <span>{error}</span>
          <button 
            onClick={fetchLatestPosts} 
            className="btn btn-sm"
          >
            重试 Retry
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="skeleton h-4 w-28"></div>
                <div className="skeleton h-32 w-full"></div>
                <div className="skeleton h-4 w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-lg">{post.title}</h3>
                <p className="text-base-content/70 line-clamp-3">
                  {post.content?.substring(0, 150)}...
                </p>
                <div className="card-actions justify-between items-center mt-4">
                  <div className="text-sm text-base-content/60">
                    By {post.author?.full_name || post.author?.email || 'Unknown'}
                  </div>
                  <Link href={`/posts/${post.id}`} className="btn btn-primary btn-sm">
                    阅读更多 Read More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold mb-2">暂无文章发布</h3>
          <p className="text-base-content/60 mb-4">
            还没有发布任何文章，请稍后再来查看。
            <br />
            No posts have been published yet. Please check back later.
          </p>
          <AdminOnly>
            <Link href="/admin/posts/create" className="btn primary-orange">
              发布第一篇文章 Create First Post
            </Link>
          </AdminOnly>
        </div>
      )}
    </section>
  )
}
