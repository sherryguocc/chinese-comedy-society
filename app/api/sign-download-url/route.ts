import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json()

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      )
    }

    // Generate signed URL for download (expires in 1 hour)
    const { data, error } = await supabaseAdmin.storage
      .from('files') // Bucket name
      .createSignedUrl(filePath, 3600) // 1 hour expiry

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