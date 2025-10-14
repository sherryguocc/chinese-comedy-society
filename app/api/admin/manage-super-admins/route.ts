import { NextRequest, NextResponse } from 'next/server'
import { supabase, getSupabaseAdmin } from '@/lib/supabase'
import { Database } from '@/types/database'

type AdminRow = Database['public']['Tables']['admins']['Row']
type AdminInsert = Database['public']['Tables']['admins']['Insert']

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

    // 🔒 获取 admin 客户端
    const supabaseAdmin = getSupabaseAdmin()

    // 检查请求者是否为 super_admin
    const { data: adminData } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!adminData) {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }

    console.log(`[API] Super admin ${user.id} requesting admin list`)

    // 获取所有超级管理员
    const { data: adminsList, error: listError } = await supabaseAdmin
      .from('admins')
      .select('id')

    if (listError) {
      console.error('[API] Failed to fetch admin list:', listError.message)
      return NextResponse.json(
        { error: 'Failed to fetch admin list' },
        { status: 500 }
      )
    }

    // 可以选择性地获取这些管理员的基本信息（从 auth.users 或 profiles）
    const adminIds = adminsList?.map((admin: AdminRow) => admin.id) || []
    
    return NextResponse.json({
      success: true,
      admins: adminsList,
      adminIds,
      count: adminsList?.length || 0
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

// POST 方法：添加新的超级管理员（只有现有 super_admin 可以操作）
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

    // 🔒 获取 admin 客户端
    const supabaseAdmin = getSupabaseAdmin()

    // 检查请求者是否为 super_admin
    const { data: adminData } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!adminData) {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }

    // 解析请求体
    const { newAdminUserId } = await request.json()

    if (!newAdminUserId) {
      return NextResponse.json(
        { error: 'Missing required field: newAdminUserId' },
        { status: 400 }
      )
    }

    console.log(`[API] Super admin ${user.id} adding new admin: ${newAdminUserId}`)

    // 检查目标用户是否已经是超级管理员
    const { data: existingAdmin } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('id', newAdminUserId)
      .maybeSingle()

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'User is already a super admin' },
        { status: 409 }
      )
    }

    // 添加新的超级管理员
    const insertData: AdminInsert = { id: newAdminUserId }
    const { data: newAdmin, error: insertError } = await (supabaseAdmin
      .from('admins') as any)
      .insert(insertData)
      .select()
      .maybeSingle()

    if (insertError) {
      console.error('[API] Failed to add new admin:', insertError.message)
      return NextResponse.json(
        { error: 'Failed to add new admin' },
        { status: 500 }
      )
    }

    // 记录操作日志
    console.log(`[AUDIT] New super admin added: ${newAdminUserId} by ${user.id}`)

    return NextResponse.json({
      success: true,
      message: 'New super admin added successfully',
      newAdmin
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