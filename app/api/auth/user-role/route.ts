import { NextRequest, NextResponse } from 'next/server'
import { supabase, getSupabaseAdmin } from '@/lib/supabase'
import { Database } from '@/types/database'
import { withTimeout } from '@/lib/utils'
import { getCachedRole, setCachedRole } from '@/lib/cache' 

// ✅ 从 Database 泛型中取出 admin 表的 Row 类型
type AdminRow = Database['public']['Tables']['admins']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']


export async function GET(request: NextRequest) {
  try {
    // 额外安全检查：确保在服务端环境
    if (typeof window !== 'undefined') {
      return NextResponse.json({ error: '此API只能在服务端调用' }, { status: 403 })
    }

    // 检查 service role key 是否正确配置
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[API] Service role key not configured');
      return NextResponse.json({ error: '服务配置错误' }, { status: 500 })
    }

    console.log('[API] ===== USER ROLE REQUEST RECEIVED =====');
    
    // 验证用户是否已登录
    const authHeader = request.headers.get('authorization')
    console.log('[API] Auth header present:', !!authHeader);
    
    if (!authHeader) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('[API] Token extracted, length:', token.length);

    // 验证JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('[API] Auth failed:', authError?.message);
      return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 })
    }

    const userId = user.id
    console.log('[API] User ID:', userId);

    // 🔒 获取 admin 客户端实例
    const supabaseAdmin = getSupabaseAdmin()

    // 首先检查是否为 super admin（只检查 admins 表中是否存在该 ID）
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('id', userId)
      .maybeSingle() as { 
        data: AdminRow | null
        error: Error | null
      }

    console.log('[API] Admin query result:', { 
      hasAdminData: !!adminData, 
      adminErrorCode: adminError?.message
    });

    // 如果在 admins 表中找到，说明是 super_admin
    if (adminData) {
      console.log('[API] Returning super_admin role');
      return NextResponse.json({
        userRole: 'super_admin',
        profileData: null,
        adminData: { id: userId }
      })
    }

    console.log('[API] Not super admin, checking profiles...');

    // 如果不是 super admin，检查 profiles 表
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle() as { 
        data: ProfileRow | null
        error: Error | null
      }

    console.log('[API] Profile query result:', { 
      hasProfileData: !!profileData, 
      profileErrorCode: profileError?.message,
      profileRole: profileData?.role 
    });

    if (profileError && profileError.message !== 'No rows found') {
      console.error('[API] Profile query error:', profileError.message)
      return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 })
    }

    const result = {
      userRole: profileData?.role || 'guest',
      profileData: profileData,
      adminData: null
    };

    console.log('[API] Returning profile result role:', result.userRole);
    return NextResponse.json(result);

  } catch (error: unknown) {
    const err = error as Error
    console.error('[API] Unexpected error:', err.message)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// POST 方法用于前端直接查询用户角色
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // ✅ 缓存检查（可选）
    const cached = getCachedRole(userId)
    if (cached) {
      console.log(`[USER-ROLE] ✅ Using cached role for ${userId}`)
      return NextResponse.json(cached)
    }

    const supabaseAdmin = getSupabaseAdmin()

    // ✅ 用 RPC 获取用户角色（使用 timeout 包裹）
    const { data, error } = await withTimeout(
      supabaseAdmin.rpc<UserRoleRPCResult>('get_user_role', { uid: userId }),
      6000
    )

    if (error || !data || data.length === 0) {
      console.warn(`[USER-ROLE] ❌ Failed to get user role for ${userId}`, error)
      return NextResponse.json({
        userRole: 'guest',
        profileData: null,
        adminData: null
      })
    }

    const result = {
      userRole: data[0].is_admin ? 'super_admin' : data[0].role || 'guest',
      profileData: data[0].profile,
      adminData: data[0].is_admin ? { id: userId } : null,
    }

    // ✅ 缓存角色（可选）
    setCachedRole(userId, result)

    return NextResponse.json(result)
  } catch (err) {
    console.error(`[USER-ROLE] 🚨 Unexpected error:`, err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}