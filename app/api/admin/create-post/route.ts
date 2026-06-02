import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const SUPER_ADMIN_EMAIL = 'sherryguocc@gmail.com'

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the post data from the request
    const { title, content, author_id } = await request.json()

    // Verify the user is trying to create a post as themselves
    if (author_id !== user.id) {
      return NextResponse.json(
        { error: 'Cannot create post for another user' },
        { status: 403 }
      )
    }

    // Verify user has the right role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL

    if (!isSuperAdmin && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Create the post
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title,
        content,
        author_id
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}