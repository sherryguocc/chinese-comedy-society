'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Post } from '@/types/database'

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

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
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          文章列表 Posts
        </h1>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">搜索文章 Search Posts</span>
          </label>
          <input
            type="text"
            placeholder="输入关键词 Enter keywords..."
            className="input input-bordered w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="skeleton h-6 w-64"></div>
                <div className="skeleton h-20 w-full"></div>
                <div className="skeleton h-4 w-32"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredPosts.map((post) => (
            <div key={post.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <h2 className="card-title text-2xl mb-4">
                  <Link href={`/posts/${post.id}`} className="link link-hover">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-base-content/80 mb-4 line-clamp-3">
                  {post.content.substring(0, 200)}...
                </p>
                <div className="card-actions justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-full w-8">
                        <span className="text-xs">
                          {post.author?.full_name?.[0] || post.author?.email?.[0] || 'U'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {post.author?.full_name || post.author?.email}
                      </p>
                      <p className="text-xs text-base-content/60">
                        {new Date(post.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <Link href={`/posts/${post.id}`} className="btn btn-primary">
                    阅读全文 Read Full
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-2xl font-bold mb-2">
            {searchTerm ? '未找到相关文章' : '暂无文章'}
          </h3>
          <p className="text-base-content/60">
            {searchTerm ? 'No posts found matching your search' : 'No posts available yet'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="btn btn-outline mt-4"
            >
              清除搜索 Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  )
}