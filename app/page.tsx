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
              <Link href="/library" className="btn btn-primary">
                下载资料 Access Library
              </Link>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}