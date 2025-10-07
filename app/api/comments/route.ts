import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles(id, email, username, full_name, phone_number, role, created_at)
      `)
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

export async function POST(request: NextRequest) {
  try {
    const { content, postId, authorId } = await request.json()

    if (!content || !postId || !authorId) {
      return NextResponse.json(
        { error: 'Content, post ID, and author ID are required' },
        { status: 400 }
      )
    }

    // Verify user is a member or admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authorId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!['member', 'admin'].includes((profile as any).role)) {
      return NextResponse.json(
        { error: 'Only members can post comments' },
        { status: 403 }
      )
    }

    const { data, error } = await (supabase as any)
      .from('comments')
      .insert({
        content,
        post_id: postId,
        author_id: authorId,
      })
      .select(`
        *,
        author:profiles(id, email, username, full_name, phone_number, role, created_at)
      `)
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