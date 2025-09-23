'use client'

import Link from 'next/link'
import { AdminOnly } from '@/components/PermissionGuard'

export default function HeroSection() {
  return (
    <div className="hero min-h-96 bg-gradient-to-r from-orange-500 to-black rounded-lg mb-12">
      <div className="hero-content text-center text-white">
        <div className="max-w-md">
          <h1 className="mb-5 text-5xl font-bold">
            华人喜剧协会
          </h1>
          <h2 className="mb-5 text-3xl font-bold">
            Chinese Comedy Society
          </h2>
          <p className="mb-5">
            欢迎来到我们的华人喜剧协会！分享笑声，传播快乐。
            <br />
            Welcome to our bilingual comedy community! Share laughter, spread joy.
          </p>
          <div className="flex gap-4 justify-center mt-6">
            <Link href="/posts" className="btn primary-orange">
              探索文章 Explore Posts
            </Link>
            <AdminOnly>
              <Link href="/admin/dashboard" className="btn bg-black hover:bg-gray-800 text-white">
                管理后台 Admin
              </Link>
            </AdminOnly>
          </div>
        </div>
      </div>
    </div>
  )
}
