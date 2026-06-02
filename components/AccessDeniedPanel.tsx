'use client'

import Link from 'next/link'

interface AccessDeniedPanelProps {
  title?: string
  messageZh: string
  messageEn?: string
  homeLabel?: string
  showLoginButton?: boolean
  loginLabel?: string
}

export default function AccessDeniedPanel({
  title = '权限不足 / Access Denied',
  messageZh,
  messageEn,
  homeLabel = '返回首页 / Back to Home',
  showLoginButton = false,
  loginLabel = '登录 / Login',
}: AccessDeniedPanelProps) {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-2xl font-bold text-red-500">{title}</h1>
      <p className="mt-4">{messageZh}</p>
      {messageEn && <p>{messageEn}</p>}

      <div className="mt-6 space-x-4">
        <Link href="/" className="btn btn-primary">
          {homeLabel}
        </Link>
        {showLoginButton && (
          <Link href="/auth/login" className="btn btn-outline">
            {loginLabel}
          </Link>
        )}
      </div>
    </div>
  )
}
