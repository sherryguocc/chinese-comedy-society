'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Post } from '@/types/database'

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLatestPosts()
  }, [])

  const fetchLatestPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="hero min-h-96 bg-gradient-to-r from-orange-500 to-black rounded-lg mb-12">
        <div className="hero-content text-center text-white">
          <div className="max-w-md">
            <h1 className="mb-5 text-5xl font-bold">
              华人喜剧协会
            </h1>
            <h2 className="mb-5 text-3xl font-bold">
              Chinese Comedy Society
            </h2>
            <p className="mb-5">
              欢迎来到我们的华人喜剧协会！分享笑声，传播快乐。
              <br />
              Welcome to our bilingual comedy community! Share laughter, spread joy.
            </p>
            <Link href="/posts" className="btn primary-orange">
              探索文章 Explore Posts
            </Link>
          </div>
        </div>
      </div>

      {/* Latest Posts Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">
            最新文章 Latest Posts
          </h2>
          <Link href="/posts" className="btn btn-outline">
            查看全部 View All
          </Link>
        </div>

        {loading ? (
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
                    {post.content.substring(0, 150)}...
                  </p>
                  <div className="card-actions justify-between items-center mt-4">
                    <div className="text-sm text-base-content/60">
                      By {post.author?.full_name || post.author?.email}
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
          <div className="text-center py-12">
            <p className="text-lg text-base-content/60">
              暂无文章发布 No posts yet
            </p>
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-orange-500 to-orange-700 text-white">
          <div className="card-body text-center">
            <h3 className="card-title justify-center">资料库 Library</h3>
            <p>访问独家PDF资源 Access exclusive PDF resources</p>
            <Link href="/library" className="btn btn-black bg-black hover:bg-gray-800 text-white">
              进入 Enter
            </Link>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-black to-gray-800 text-white">
          <div className="card-body text-center">
            <h3 className="card-title justify-center">活动 Events</h3>
            <p>查看即将举行的活动 View upcoming events</p>
            <Link href="/events" className="btn primary-orange">
              查看 View
            </Link>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-600 to-orange-800 text-white">
          <div className="card-body text-center">
            <h3 className="card-title justify-center">加入我们 Join Us</h3>
            <p>成为会员解锁更多功能 Become a member to unlock more features</p>
            <Link href="/auth/register" className="btn bg-black hover:bg-gray-800 text-white">
              注册 Register
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}