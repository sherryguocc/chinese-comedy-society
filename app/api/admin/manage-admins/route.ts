import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { AdminPermissions } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const { action, userId, permissions, currentAdminId } = await request.json()

    if (!userId || !currentAdminId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // 验证当前用户是否为超级管理员
    const { data: currentAdmin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', currentAdminId)
      .eq('is_super_admin', true)
      .single()

    if (adminError || !currentAdmin) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    if (action === 'promote') {
      // 从 profiles 表获取用户信息
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .eq('role', 'member')
        .single()

      if (profileError || !userProfile) {
        return NextResponse.json({ error: '用户不存在或不是会员' }, { status: 404 })
      }

      // 创建管理员记录
      const { error: insertError } = await supabase
        .from('admins')
        .insert({
          id: userId,
          email: userProfile.email,
          full_name: userProfile.full_name,
          permissions: permissions as AdminPermissions,
          created_by: currentAdminId,
          is_super_admin: false
        })

      if (insertError) {
        return NextResponse.json({ error: '创建管理员记录失败: ' + insertError.message }, { status: 500 })
      }

      // 删除 profiles 记录
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (deleteError) {
        return NextResponse.json({ error: '删除用户档案失败: ' + deleteError.message }, { status: 500 })
      }

      return NextResponse.json({ message: '升级成功' })

    } else if (action === 'demote') {
      // 检查目标用户是否为管理员且非超级管理员
      const { data: targetAdmin, error: targetError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', userId)
        .single()

      if (targetError || !targetAdmin) {
        return NextResponse.json({ error: '管理员不存在' }, { status: 404 })
      }

      if (targetAdmin.is_super_admin) {
        return NextResponse.json({ error: '无法降级超级管理员' }, { status: 403 })
      }

      // 创建 profiles 记录
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: targetAdmin.email,
          full_name: targetAdmin.full_name,
          role: 'member'
        })

      if (insertError) {
        return NextResponse.json({ error: '创建用户档案失败: ' + insertError.message }, { status: 500 })
      }

      // 删除管理员记录
      const { error: deleteError } = await supabase
        .from('admins')
        .delete()
        .eq('id', userId)

      if (deleteError) {
        return NextResponse.json({ error: '删除管理员记录失败: ' + deleteError.message }, { status: 500 })
      }

      return NextResponse.json({ message: '降级成功' })

    } else if (action === 'update_permissions') {
      // 更新管理员权限
      const { error: updateError } = await supabase
        .from('admins')
        .update({ 
          permissions: permissions as AdminPermissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .eq('is_super_admin', false) // 确保不能修改超级管理员

      if (updateError) {
        return NextResponse.json({ error: '更新权限失败: ' + updateError.message }, { status: 500 })
      }

      return NextResponse.json({ message: '权限更新成功' })
    }

    return NextResponse.json({ error: '无效的操作' }, { status: 400 })

  } catch (error: any) {
    console.error('Admin management error:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}