'use client'

import Link from 'next/link'
import { AdminOnly, MemberOnly } from '@/components/PermissionGuard'

export default function QuickLinksSection() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="card bg-gradient-to-br from-orange-500 to-orange-700 text-white">
        <div className="card-body text-center">
          <h3 className="card-title justify-center">资料库 Library</h3>
          <p>
            <MemberOnly fallback="会员专享资源 Member exclusive resources">
              访问独家PDF资源 Access exclusive PDF resources
            </MemberOnly>
          </p>
          <MemberOnly 
            fallback={
              <Link href="/auth/register" className="btn bg-black hover:bg-gray-800 text-white">
                成为会员 Become Member
              </Link>
            }
          >
            <Link href="/library" className="btn bg-black hover:bg-gray-800 text-white">
              进入 Enter
            </Link>
          </MemberOnly>
        </div>
      </div>

      <div className="card bg-gradient-to-br from-black to-gray-800 text-white">
        <div className="card-body text-center">
          <h3 className="card-title justify-center">活动 Events</h3>
          <p>查看即将举行的活动 View upcoming events</p>
          <div className="flex gap-2 justify-center">
            <Link href="/events" className="btn primary-orange">
              查看 View
            </Link>
            <AdminOnly>
              <Link href="/admin/events/create" className="btn bg-orange-600 hover:bg-orange-700 text-white">
                创建活动 Create
              </Link>
            </AdminOnly>
          </div>
        </div>
      </div>

      <div className="card bg-gradient-to-br from-orange-600 to-orange-800 text-white">
        <div className="card-body text-center">
          <h3 className="card-title justify-center">加入我们 Join Us</h3>
          <p>成为会员解锁更多功能 Become a member to unlock more features</p>
          <Link href="/auth/register" className="btn bg-black hover:bg-gray-800 text-white">
            注册 Register
          </Link>
        </div>
      </div>
    </section>
  )
}
