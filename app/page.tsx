'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Post } from '@/types/database'
import PermissionGuard, { AdminOnly, MemberOnly } from '@/components/PermissionGuard'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, profile, loading: authLoading } = useAuth()

  useEffect(() => {
    // 等待认证加载完成后再获取文章
    if (!authLoading) {
      fetchLatestPosts()
    }
  }, [authLoading])

  const fetchLatestPosts = async () => {
    try {
      setError(null)
      setLoading(true)
      console.log('开始获取文章...')
      
      // 先尝试不加 published 过滤条件，看看能否获取到任何文章
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('获取文章时出错:', error)
        throw error
      }

      console.log('成功获取文章:', data)
      setPosts(data || [])
    } catch (error: any) {
      console.error('Error fetching posts:', error)
      setError(`获取文章失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 如果认证还在加载中，显示loading
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-96">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 调试信息 - 仅开发环境 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="alert alert-info mb-4 text-xs">
          <div>
            <div>User: {user?.email || 'Not logged in'}</div>
            <div>Role: {profile?.role || 'No profile'}</div>
            <div>Auth Loading: {authLoading.toString()}</div>
            <div>Posts Loading: {loading.toString()}</div>
            <div>Posts Count: {posts.length}</div>
            {error && <div className="text-error">Error: {error}</div>}
          </div>
        </div>
      )}

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
            <div className="flex gap-4 justify-center mt-6">
              <Link href="/posts" className="btn primary-orange">
                探索文章 Explore Posts
              </Link>
              <AdminOnly>
                <Link href="/admin/dashboard" className="btn bg-black hover:bg-gray-800 text-white">
                  管理后台 Admin
                </Link>
              </AdminOnly>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Posts Section */}
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

      {/* Quick Links */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-orange-500 to-orange-700 text-white">
          <div className="card-body text-center">
            <h3 className="card-title justify-center">资料库 Library</h3>
            <p>
              <MemberOnly fallback="会员专享资源 Member exclusive resources">
                访问独家PDF资源 Access exclusive PDF resources
              </MemberOnly>
            </p>
            <MemberOnly 
              fallback={
                <Link href="/auth/register" className="btn bg-black hover:bg-gray-800 text-white">
                  成为会员 Become Member
                </Link>
              }
            >
              <Link href="/library" className="btn bg-black hover:bg-gray-800 text-white">
                进入 Enter
              </Link>
            </MemberOnly>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-black to-gray-800 text-white">
          <div className="card-body text-center">
            <h3 className="card-title justify-center">活动 Events</h3>
            <p>查看即将举行的活动 View upcoming events</p>
            <div className="flex gap-2 justify-center">
              <Link href="/events" className="btn primary-orange">
                查看 View
              </Link>
              <AdminOnly>
                <Link href="/admin/events/create" className="btn bg-orange-600 hover:bg-orange-700 text-white">
                  创建活动 Create
                </Link>
              </AdminOnly>
            </div>
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