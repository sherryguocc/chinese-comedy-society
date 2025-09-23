import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">华人喜剧协会</h1>
            <h2 className="text-3xl font-bold mt-2">Chinese Comedy Society</h2>
            <p className="py-6">
              欢迎来到华人喜剧协会！一个专为喜剧爱好者打造的双语社区。
              <br />
              Welcome to Chinese Comedy Society! A bilingual community for comedy enthusiasts.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/events" className="btn btn-primary">
                查看活动 View Events
              </Link>
              <Link href="/posts" className="btn btn-outline">
                阅读文章 Read Posts
              </Link>
              <Link href="/test-db" className="btn btn-secondary">
                数据库测试 DB Test
              </Link>
            </div>
            
            <div className="mt-8 p-4 bg-green-100 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ 首页现在是服务器组件，不依赖认证状态
                <br />
                ✅ Homepage is now a Server Component, no auth dependency
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}