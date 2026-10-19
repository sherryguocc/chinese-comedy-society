'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'
import PostForm, { type PostPayload } from '@/components/PostForm'

export default function CreatePostPage() {
  const { user } = useAuth()
  const router = useRouter()

  const handleCreate = async ({ title, content }: PostPayload) => {
    if (!user?.id) throw new Error('用户信息未加载，请刷新页面重试 Please refresh and try again')

    const { error } = await (supabase.from('posts') as any).insert({
      title,
      content,
      author_id: user.id, // RLS 要求必须是自己
    })
    if (error) throw new Error(`发布失败 Failed to publish: ${error.message}`)

    router.push('/admin/posts')
  }

  return (
    <AdminLayout title="发布文章 New Post" requiredPermission="CREATE_POSTS">
      <PostForm submitLabel="发布文章 Publish" submittingLabel="发布中… Publishing…" onSubmit={handleCreate} />
    </AdminLayout>
  )
}
