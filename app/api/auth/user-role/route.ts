import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { Database } from '@/types/database'

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
    console.log('[API] Request URL:', request.url);
    console.log('[API] Request method:', request.method);
    console.log('[API] User-Agent:', request.headers.get('User-Agent'));
    console.log('[API] Referer:', request.headers.get('Referer'));
    console.log('[API] X-Forwarded-For:', request.headers.get('X-Forwarded-For'));
    console.log('[API] Current time:', new Date().toISOString());
    
    // 验证用户是否已登录
    const authHeader = request.headers.get('authorization')
    console.log('[API] Auth header present:', !!authHeader);
    
    if (!authHeader) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // 避免在日志中暴露完整token
    console.log('[API] Token extracted, length:', token.length);

    // 验证JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    console.log('[API] Auth result:', { hasUser: !!user, authError });

    if (authError || !user) {
      console.error('[API] Auth failed:', authError?.message); // 不记录完整错误对象
      return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 })
    }

    const userId = user.id
    console.log('[API] User ID:', userId);

    // 使用 supabaseAdmin 绕过 RLS 策略
    console.log('[API] Querying admins table...');

    // 首先检查是否为管理员
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('id', userId)
      .maybeSingle() as { 
        data: AdminRow | null
        error: any
      }

    console.log('[API] Admin query result:', { 
      hasAdminData: !!adminData, 
      adminErrorCode: adminError?.code, // 只记录错误代码，不记录完整错误
      adminId: adminData?.id,
      isSuperAdmin: adminData?.is_super_admin 
    });

    // 如果是管理员，返回管理员角色
    if (adminData) {
      const role = adminData.is_super_admin ? 'super_admin' : 'admin'
      console.log('[API] Returning admin role:', role);
      return NextResponse.json({
        role,
        profile: null,
        admin: adminData
      })
    }

    console.log('[API] Not admin, checking profiles...');

    // 如果不是管理员，检查 profiles 表
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle() as { 
        data: ProfileRow | null
        error: any
      }

    console.log('[API] Profile query result:', { 
      hasProfileData: !!profileData, 
      profileErrorCode: profileError?.code,
      profileRole: profileData?.role 
    });

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[API] Profile query error code:', profileError.code)
      return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 })
    }

    const result = {
      role: profileData?.role || null,
      profile: profileData,
      admin: null
    };

    console.log('[API] Returning profile result role:', result.role);
    return NextResponse.json(result);

  } catch (error: any) {
    // 只记录错误类型，不记录敏感信息
    console.error('[API] Unexpected error type:', error.name)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}