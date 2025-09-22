'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          throw error
        }

        if (data.session) {
          setStatus('success')
          setMessage('邮箱验证成功！正在登录... Email verified successfully! Logging you in...')
          
          // 延迟一下让用户看到成功消息
          setTimeout(() => {
            router.push('/')
          }, 2000)
        } else {
          // 尝试从URL获取令牌
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          if (accessToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken!
            })
            
            if (sessionError) throw sessionError
            
            setStatus('success')
            setMessage('邮箱验证成功！正在登录... Email verified successfully! Logging you in...')
            
            setTimeout(() => {
              router.push('/')
            }, 2000)
          } else {
            throw new Error('未找到有效的会话令牌 No valid session token found')
          }
        }
      } catch (error: any) {
        console.error('邮箱验证失败 Email verification failed:', error)
        setStatus('error')
        setMessage(`验证失败：${error.message} Verification failed: ${error.message}`)
        
        // 5秒后重定向到登录页
        setTimeout(() => {
          router.push('/auth/login')
        }, 5000)
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body text-center">
          {status === 'loading' && (
            <>
              <div className="loading loading-spinner loading-lg mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold mb-4">验证中... Verifying...</h1>
              <p>正在处理您的邮箱验证，请稍候。</p>
              <p>Processing your email verification, please wait.</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="text-success text-6xl mb-4">✅</div>
              <h1 className="text-2xl font-bold mb-4 text-success">验证成功！ Success!</h1>
              <p className="text-success">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="text-error text-6xl mb-4">❌</div>
              <h1 className="text-2xl font-bold mb-4 text-error">验证失败 Verification Failed</h1>
              <p className="text-error mb-4">{message}</p>
              <p className="text-sm text-base-content/60">
                将在5秒后重定向到登录页...
                <br />
                Redirecting to login page in 5 seconds...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
