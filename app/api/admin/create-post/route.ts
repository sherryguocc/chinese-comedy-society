import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireRole } from '@/lib/server-auth'

// 发布文章：仅 admin / super_admin。作者固定为当前登录用户。
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'admin')
    if (auth instanceof NextResponse) return auth

    const { title, content } = await request.json()

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const { data, error } = await (getSupabaseAdmin().from('posts') as any)
      .insert({
        title: title.trim(),
        content,
        author_id: auth.user.id,
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error: unknown) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
