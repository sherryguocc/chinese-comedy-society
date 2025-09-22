'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { signIn, user } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 如果用户已登录，重定向到首页
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  // 检查表单是否有效
  const isFormValid = () => {
    return formData.email.trim() !== '' && formData.password.trim() !== ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isFormValid()) {
      setError('请填写邮箱和密码 Please fill in email and password')
      return
    }

    setIsSubmitting(true)
    try {
      await signIn(formData.email, formData.password)
      router.push('/')
    } catch (error: any) {
      console.error('登录失败 Login failed:', error)
      setError(error.message || '登录失败 Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title justify-center text-2xl mb-6">
            登录 Login
          </h1>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">邮箱 Email *</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="input input-bordered"
                placeholder="请输入邮箱 Enter your email"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">密码 Password *</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="input input-bordered"
                placeholder="请输入密码 Enter password"
                required
              />
            </div>

            <div className="form-control mt-6">
              <button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className="btn primary-orange w-full"
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    登录中...
                  </>
                ) : (
                  '登录 Login'
                )}
              </button>
            </div>
          </form>

          <div className="divider">或 OR</div>

          <div className="text-center">
            <p className="text-sm">
              还没有账户？ Don't have an account?{' '}
              <Link href="/auth/register" className="link link-primary">
                注册 Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}