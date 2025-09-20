'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Post, Comment } from '@/types/database'

export default function PostDetailPage() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (id) {
      fetchPost()
      fetchComments()
    }
  }, [id])

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setPost(data)
    } catch (error) {
      console.error('Error fetching post:', error)
      router.push('/posts')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('post_id', id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content: newComment.trim(),
          post_id: id as string,
          author_id: user.id,
        })

      if (error) throw error

      setNewComment('')
      fetchComments() // Refresh comments
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const canComment = profile?.role === 'member' || profile?.role === 'admin'

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="skeleton h-8 w-64 mb-4"></div>
        <div className="skeleton h-64 w-full mb-8"></div>
        <div className="skeleton h-32 w-full"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">文章未找到 Post Not Found</h1>
        <Link href="/posts" className="btn btn-primary">
          返回文章列表 Back to Posts
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="breadcrumbs text-sm mb-6">
        <ul>
          <li><Link href="/">首页 Home</Link></li>
          <li><Link href="/posts">文章 Posts</Link></li>
          <li>{post.title}</li>
        </ul>
      </div>

      {/* Post Content */}
      <article className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <h1 className="text-4xl font-bold mb-6">{post.title}</h1>
          
          {/* Author Info */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-12">
                <span className="text-xl">
                  {post.author?.full_name?.[0] || post.author?.email?.[0] || 'U'}
                </span>
              </div>
            </div>
            <div>
              <p className="font-medium text-lg">
                {post.author?.full_name || post.author?.email}
              </p>
              <p className="text-base-content/60">
                发布于 Published on {new Date(post.created_at).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>

          {/* Post Content */}
          <div className="prose max-w-none">
            {post.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-lg leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <section className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="text-2xl font-bold mb-6">
            评论 Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          {user ? (
            canComment ? (
              <form onSubmit={handleSubmitComment} className="mb-8">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">发表评论 Leave a Comment</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    placeholder="分享您的想法... Share your thoughts..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  ></textarea>
                </div>
                <div className="form-control mt-4">
                  <button
                    type="submit"
                    className={`btn btn-primary ${submitting ? 'loading' : ''}`}
                    disabled={submitting || !newComment.trim()}
                  >
                    {submitting ? '发布中... Posting...' : '发布评论 Post Comment'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="alert alert-info mb-8">
                <span>只有会员可以发表评论。 Only members can post comments.</span>
              </div>
            )
          ) : (
            <div className="alert alert-warning mb-8">
              <span>
                请先 <Link href="/auth/login" className="link">登录</Link> 后发表评论。
                Please <Link href="/auth/login" className="link">login</Link> to post comments.
              </span>
            </div>
          )}

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="border-l-4 border-primary pl-4">
                  <div className="flex items-start gap-3">
                    <div className="avatar placeholder">
                      <div className="bg-secondary text-secondary-content rounded-full w-10">
                        <span className="text-sm">
                          {comment.author?.full_name?.[0] || comment.author?.email?.[0] || 'U'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">
                          {comment.author?.full_name || comment.author?.email}
                        </span>
                        <span className="text-sm text-base-content/60">
                          {new Date(comment.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-base-content/90">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-base-content/60">
                暂无评论，来发表第一条吧！ No comments yet, be the first to comment!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}