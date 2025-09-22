'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Post } from '@/types/database'
import { AdminOnly } from '@/components/PermissionGuard'

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('获取文章失败 Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          文章列表 Posts
        </h1>
        <AdminOnly>
          <Link href="/admin/posts/create" className="btn primary-orange">
            发布文章 Create Post
          </Link>
        </AdminOnly>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
                <h2 className="card-title text-lg">
                  <Link href={`/posts/${post.id}`} className="link link-hover">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-base-content/70 line-clamp-3">
                  {post.content.substring(0, 150)}...
                </p>
                <div className="card-actions justify-between items-center mt-4">
                  <div className="text-sm text-base-content/60">
                    <div>作者: {post.author?.full_name || post.author?.email}</div>
                    <div>发布: {new Date(post.created_at).toLocaleDateString()}</div>
                  </div>
                  <Link href={`/posts/${post.id}`} className="btn btn-primary btn-sm">
                    阅读全文 Read More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-base-content/60 mb-4">
            暂无文章 No Posts Yet
          </h2>
          <p className="text-base-content/50">
            还没有发布任何文章，请稍后再来查看。
            <br />
            No posts have been published yet. Please check back later.
          </p>
        </div>
      )}
    </div>
  )
}