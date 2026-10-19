import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuth } from '@/lib/server-auth'

// 返回当前登录用户的角色和档案。不做服务端缓存：
// 用户量很小，每次查数据库最可靠，角色变更立即生效。
export async function GET(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request)
    if (!auth) {
      return NextResponse.json({ error: '未授权 Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      userRole: auth.role,
      profileData: auth.profile,
      adminData: auth.role === 'super_admin' ? { id: auth.user.id } : null,
    })
  } catch (error: unknown) {
    console.error('[API] GET /user-role error:', error)
    return NextResponse.json({ error: '服务器错误 Server error' }, { status: 500 })
  }
}
