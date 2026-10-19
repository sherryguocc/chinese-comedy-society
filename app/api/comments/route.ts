import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireRole, PUBLIC_PROFILE_FIELDS } from '@/lib/server-auth'

const COMMENT_SELECT = `*, author:profiles(${PUBLIC_PROFILE_FIELDS})`

// 评论对所有人可见，只返回作者的公开字段
export async function GET(request: NextRequest) {
  try {
    const postId = new URL(request.url).searchParams.get('postId')

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await getSupabaseAdmin()
      .from('comments')
      .select(COMMENT_SELECT)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ comments: data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 发表评论：仅会员及以上；作者身份从 token 中取，不信任请求体
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'member')
    if (auth instanceof NextResponse) return auth

    const { content, postId } = await request.json()
    const trimmed = typeof content === 'string' ? content.trim() : ''

    if (!trimmed || !postId) {
      return NextResponse.json(
        { error: 'Content and post ID are required' },
        { status: 400 }
      )
    }

    if (trimmed.length > 2000) {
      return NextResponse.json(
        { error: 'Comment is too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    const { data, error } = await (getSupabaseAdmin().from('comments') as any)
      .insert({
        content: trimmed,
        post_id: postId,
        author_id: auth.user.id,
      })
      .select(COMMENT_SELECT)
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ comment: data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
