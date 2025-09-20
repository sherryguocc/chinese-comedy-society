'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      setSuccess(true)
      // Note: In production, you might want to redirect to email verification page
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card w-full max-w-sm shadow-2xl bg-base-100">
          <div className="card-body text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-4">
              注册成功！ Registration Successful!
            </h2>
            <p className="text-base-content/70 mb-4">
              请检查您的邮箱并验证账户。3秒后自动跳转到登录页面。
              <br />
              Please check your email and verify your account. Redirecting to login in 3 seconds.
            </p>
            <Link href="/auth/login" className="btn btn-primary">
              立即登录 Login Now
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-sm shadow-2xl bg-base-100">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl mb-6">
            注册 Register
          </h2>
          
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">姓名 Full Name</span>
              </label>
              <input
                type="text"
                placeholder="Your Name"
                className="input input-bordered"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">邮箱 Email</span>
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                className="input input-bordered"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">密码 Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <label className="label">
                <span className="label-text-alt">至少6位字符 At least 6 characters</span>
              </label>
            </div>

            <div className="form-control mt-6">
              <button
                type="submit"
                className={`btn btn-primary ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? '注册中 Registering...' : '注册 Register'}
              </button>
            </div>
          </form>

          <div className="divider">或 OR</div>

          <div className="text-center">
            <p className="text-sm">
              已有账户？ Already have an account?{' '}
              <Link href="/auth/login" className="link link-primary">
                登录 Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}