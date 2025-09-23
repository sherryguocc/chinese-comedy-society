import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Post } from '@/types/database'
import HeroSection from '@/components/HeroSection'
import LatestPostsSection from '@/components/LatestPostsSection'
import QuickLinksSection from '@/components/QuickLinksSection'
import DebugInfo from '@/components/DebugInfo'
import { AdminOnly } from '@/components/PermissionGuard'

async function getLatestPosts(): Promise<Post[]> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(*)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('获取文章时出错:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching posts:', error)
    return []
  }
}

export default async function HomePage() {
  const initialPosts = await getLatestPosts()

  return (
    <div className="container mx-auto px-4 py-8">
      <DebugInfo initialPostsCount={initialPosts.length} />
      
      {/* Admin Dashboard Link */}
      <AdminOnly>
        <div className="alert alert-info mb-6">
          <div className="flex justify-between items-center">
            <span>🔧 管理员模式 Admin Mode</span>
            <Link 
              href="/admin/dashboard" 
              className="btn btn-primary btn-sm"
            >
              管理后台 Admin Dashboard
            </Link>
          </div>
        </div>
      </AdminOnly>
      
      <HeroSection />
      <LatestPostsSection initialPosts={initialPosts} />
      <QuickLinksSection />
    </div>
  )
}