import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const SUPER_ADMIN_EMAIL = 'sherryguocc@gmail.com'

// GET 方法：获取超级管理员列表（只有 super_admin 可以查看）
export async function GET(request: NextRequest) {
  try {
    // 验证请求者身份
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      )
    }

    // super_admin 只通过固定邮箱判定
    if (user.email?.toLowerCase() !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }

    console.log(`[API] Super admin ${user.id} requesting admin list`)
    
    return NextResponse.json({
      success: true,
      admins: [{ id: user.id, email: SUPER_ADMIN_EMAIL }],
      adminIds: [user.id],
      count: 1
    })

  } catch (error: unknown) {
    const err = error as Error
    console.error('[API] Error fetching admin list:', err.message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST 方法：当前系统不允许添加新的超级管理员
export async function POST(request: NextRequest) {
  try {
    // 验证请求者身份
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      )
    }

    // super_admin 只通过固定邮箱判定
    if (user.email?.toLowerCase() !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }

    await request.json().catch(() => null)

    return NextResponse.json({
      success: false,
      message: 'Super admin is fixed to sherryguocc@gmail.com and cannot be changed via API'
    }, {
      status: 403
    })

  } catch (error: unknown) {
    const err = error as Error
    console.error('[API] Error adding new admin:', err.message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}