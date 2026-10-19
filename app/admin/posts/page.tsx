'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { hasPermission, canEditPost } from '@/lib/permissions'
import { formatNzDate } from '@/lib/datetime'
import AdminLayout from '@/components/AdminLayout'

type PostRow = {
  id: string
  title: string
  author_id: string
  created_at: string
  author?: { id: string; full_name?: string | null; username?: string | null } | null
}

export default function AdminPostsPage() {
  const { user, userRole } = useAuth()
  const canEditAll = hasPermission(userRole, 'EDIT_ALL_POSTS')

  const [posts, setPosts] = useState<PostRow[]>([])
  const [loading, setLoading] = useState(true)
  const [onlyMine, setOnlyMine] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchPosts = async () => {
    if (!user) return
    setLoading(true)
    let query = supabase
      .from('posts')
      .select('id, title, author_id, created_at, author:profiles(id, full_name, username)')
      .order('created_at', { ascending: false })
    if (onlyMine) query = query.eq('author_id', user.id)

    const { data, error } = await query
    if (error) setMessage({ type: 'error', text: `加载失败 Failed to load: ${error.message}` })
    else setPosts((data as unknown as PostRow[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    if (hasPermission(userRole, 'CREATE_POSTS')) fetchPosts()
  }, [userRole, user?.id, onlyMine])

  const handleDelete = async (post: PostRow) => {
    if (!confirm(`确定删除文章「${post.title}」吗？文章下的评论也会一起删除，此操作不可撤销。\nDelete "${post.title}" and its comments?`)) return
    setDeletingId(post.id)
    // .select() 让被 RLS 拦下的删除返回空数组，而不是"静默成功"
    const { data, error } = await supabase.from('posts').delete().eq('id', post.id).select('id')
    setDeletingId(null)
    if (error || !data?.length) {
      setMessage({ type: 'error', text: `删除失败 Delete failed: ${error?.message || '没有权限 Permission denied'}` })
      return
    }
    setPosts(prev => prev.filter(p => p.id !== post.id))
    setMessage({ type: 'success', text: '已删除 Deleted' })
  }

  return (
    <AdminLayout title="文章管理 Posts" requiredPermission="CREATE_POSTS">
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-6`}>
          <span>{message.text}</span>
          <button className="btn btn-ghost btn-xs" onClick={() => setMessage(null)}>✕</button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Link href="/admin/posts/create" className="btn btn-primary btn-sm">
          ➕ 发布文章 New Post
        </Link>
        <label className="label cursor-pointer gap-2">
          <input
            type="checkbox"
            className="toggle toggle-sm"
            checked={onlyMine}
            onChange={e => setOnlyMine(e.target.checked)}
          />
          <span className="label-text">只看我发布的 Only mine</span>
        </label>
        {!canEditAll && (
          <span className="text-sm text-base-content/60">你可以编辑和删除自己发布的文章。</span>
        )}
      </div>

      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body p-0 sm:p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center py-12 text-base-content/60">还没有文章 No posts yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>标题 Title</th>
                    <th className="hidden md:table-cell">作者 Author</th>
                    <th className="hidden sm:table-cell">发布时间 Published</th>
                    <th className="text-right">操作 Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map(post => {
                    const editable = canEditPost(userRole, user?.id, post.author_id)
                    return (
                      <tr key={post.id}>
                        <td>
                          <Link href={`/posts/${post.id}`} className="font-semibold link link-hover" target="_blank">
                            {post.title}
                          </Link>
                          <div className="text-xs text-base-content/60 md:hidden">
                            {post.author?.full_name || post.author?.username || '—'} · {formatNzDate(post.created_at)}
                          </div>
                        </td>
                        <td className="hidden md:table-cell text-sm">
                          {post.author?.full_name || post.author?.username || '—'}
                          {post.author_id === user?.id && <span className="badge badge-ghost badge-sm ml-2">我 Me</span>}
                        </td>
                        <td className="hidden sm:table-cell text-sm whitespace-nowrap">{formatNzDate(post.created_at)}</td>
                        <td>
                          {editable ? (
                            <div className="flex gap-2 justify-end">
                              <Link href={`/admin/posts/${post.id}/edit`} className="btn btn-outline btn-sm">
                                编辑 Edit
                              </Link>
                              <button
                                className="btn btn-error btn-outline btn-sm"
                                disabled={deletingId === post.id}
                                onClick={() => handleDelete(post)}
                              >
                                {deletingId === post.id ? '删除中…' : '删除 Delete'}
                              </button>
                            </div>
                          ) : (
                            <div className="text-right text-xs text-base-content/40">—</div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
