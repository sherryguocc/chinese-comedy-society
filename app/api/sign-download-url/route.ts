import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireRole } from '@/lib/server-auth'

// 生成会员文件的临时下载链接（仅会员及以上）
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'member')
    if (auth instanceof NextResponse) return auth

    const { filePath } = await request.json()

    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 只允许下载 files 表中登记过的文件，防止任意路径访问
    const { data: fileRecord } = await supabaseAdmin
      .from('files')
      .select('id')
      .eq('path', filePath)
      .maybeSingle()

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // 链接 10 分钟后过期
    const { data, error } = await supabaseAdmin.storage
      .from('files')
      .createSignedUrl(filePath, 600)

    if (error) {
      console.error('Error creating signed URL:', error)
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
