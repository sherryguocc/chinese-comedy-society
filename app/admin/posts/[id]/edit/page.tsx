'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { canEditPost, hasPermission } from '@/lib/permissions'
import AdminLayout from '@/components/AdminLayout'
import PostForm, { type PostPayload } from '@/components/PostForm'

type PostRecord = { id: string; title: string; content: string; author_id: string }

export default function EditPostPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const { user, userRole } = useAuth()

  const [post, setPost] = useState<PostRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !hasPermission(userRole, 'CREATE_POSTS')) return
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, content, author_id')
        .eq('id', id)
        .maybeSingle()
      if (error) setLoadError(error.message)
      else if (!data) setLoadError('文章不存在 Post not found')
      else setPost(data as PostRecord)
      setLoading(false)
    }
    load()
  }, [id, userRole])

  const handleUpdate = async ({ title, content }: PostPayload) => {
    if (!post) return
    // .select() 让被 RLS 拦下的更新返回空数组，便于提示"没有权限"
    const { data, error } = await (supabase.from('posts') as any)
      .update({ title, content })
      .eq('id', post.id)
      .select('id')
    if (error) throw new Error(`保存失败 Save failed: ${error.message}`)
    if (!data?.length) throw new Error('没有权限修改这篇文章 You cannot edit this post')
    router.push('/admin/posts')
  }

  let content: React.ReactNode
  if (loading) {
    content = (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    )
  } else if (loadError || !post) {
    content = (
      <div className="alert alert-error">
        <span>{loadError || '文章不存在 Post not found'}</span>
        <Link href="/admin/posts" className="btn btn-sm">返回 Back</Link>
      </div>
    )
  } else if (!canEditPost(userRole, user?.id, post.author_id)) {
    content = (
      <div className="alert alert-warning">
        <span>你只能编辑自己发布的文章。You can only edit posts you published.</span>
        <Link href="/admin/posts" className="btn btn-sm">返回 Back</Link>
      </div>
    )
  } else {
    content = (
      <PostForm
        key={post.id}
        initialTitle={post.title}
        initialContent={post.content}
        submitLabel="保存修改 Save"
        submittingLabel="保存中… Saving…"
        onSubmit={handleUpdate}
      />
    )
  }

  return (
    <AdminLayout title="编辑文章 Edit Post" requiredPermission="CREATE_POSTS">
      {content}
    </AdminLayout>
  )
}
