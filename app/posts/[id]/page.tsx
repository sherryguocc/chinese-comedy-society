'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { canComment, getRoleDisplayName } from '@/lib/permissions'
import { Post, Comment } from '@/types/database'

export default function PostDetailPage() {
  const params = useParams()
  const postId = Array.isArray(params.id) ? params.id[0] : params.id
  const { user, userRole } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const userCanComment = canComment(userRole)

  const fetchPost = async () => {
    if (!postId) return

    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(id, full_name, role)
        `)
        .eq('id', postId)
        .single()

      if (error) throw error
      setPost(data)
    } catch (error) {
      console.error('Error fetching post:', error)
    }
  }

  const fetchComments = async () => {
    if (!postId) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles(id, full_name, role)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userCanComment) {
      alert('您需要会员及以上权限才能发表评论。You need member access or above to comment.')
      return
    }

    if (!user || !newComment.trim()) return

    setSubmitting(true)
    try {
      const { error } = await (supabase as any)
        .from('comments')
        .insert({
          content: newComment.trim(),
          post_id: postId,
          author_id: user.id
        })

      if (error) throw error

      setNewComment('')
      await fetchComments()
    } catch (error) {
      console.error('Error submitting comment:', error)
      alert('评论发布失败。Failed to submit comment.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    fetchPost()
    fetchComments()
  }, [postId])

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
        <h1 className="text-2xl font-bold">文章未找到 / Post Not Found</h1>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 文章内容 */}
      <article className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <h1 className="card-title text-3xl mb-4">{post.title}</h1>
          <div className="text-sm text-base-content/60 mb-6">
            作者 / Author: {post.author?.full_name} | 
            发布时间 / Published: {new Date(post.created_at).toLocaleDateString()}
          </div>
          <div className="prose max-w-none">
            {post.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4">{paragraph}</p>
            ))}
          </div>
        </div>
      </article>

      {/* 评论区 */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">评论 Comments ({comments.length})</h2>

          {/* 评论表单 */}
          {userCanComment ? (
            user ? (
              <form onSubmit={handleSubmitComment} className="mb-6">
                <textarea
                  className="textarea textarea-bordered w-full mb-4"
                  placeholder="写下您的评论... / Write your comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !newComment.trim()}
                >
                  {submitting ? '发布中... / Posting...' : '发布评论 / Post Comment'}
                </button>
              </form>
            ) : (
              <div className="alert alert-info mb-6">
                <span>请登录后发表评论 / Please log in to comment</span>
              </div>
            )
          ) : (
            <div className="alert alert-warning mb-6">
              <span>
                您当前是 {getRoleDisplayName(userRole || 'guest')}，需要会员及以上权限才能发表评论。
                You are currently {getRoleDisplayName(userRole || 'guest')}, and member access or above is required to comment.
              </span>
            </div>
          )}

          {/* 评论列表 */}
          <div className="space-y-4">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="border-l-4 border-primary pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{comment.author?.full_name}</span>
                    <span className="badge badge-outline badge-sm">
                      {getRoleDisplayName(comment.author?.role || 'guest')}
                    </span>
                    <span className="text-xs text-base-content/60">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-base-content/80">{comment.content}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-base-content/60 py-8">
                还没有评论，来发表第一个评论吧！ / No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}