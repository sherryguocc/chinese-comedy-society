'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 检查表单是否有效
  const isFormValid = () => {
    return (
      formData.email.trim() !== '' &&
      formData.password.length >= 6 &&
      formData.confirmPassword === formData.password
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isFormValid()) {
      if (formData.password !== formData.confirmPassword) {
        setError('密码不匹配 Passwords do not match')
      } else if (formData.password.length < 6) {
        setError('密码至少需要6位 Password must be at least 6 characters')
      } else {
        setError('请填写所有必填字段 Please fill in all required fields')
      }
      return
    }

    setIsSubmitting(true)
    try {
      await signUp(formData.email, formData.password, formData.fullName)
      alert('注册成功！请检查您的邮箱并点击验证链接完成注册。验证后您将自动登录。\n\nRegistration successful! Please check your email and click the verification link to complete registration. You will be automatically logged in after verification.')
      router.push('/auth/login')
    } catch (error: any) {
      console.error('注册失败 Registration failed:', error)
      setError(error.message || '注册失败 Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title justify-center text-2xl mb-6">
            注册账户 Register Account
          </h1>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">姓名 Full Name</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="input input-bordered"
                placeholder="请输入您的姓名 Enter your full name"
              />
            </div>

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
                <span className="label-text">密码 Password * (至少6位)</span>
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
                minLength={6}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">确认密码 Confirm Password *</span>
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="input input-bordered"
                placeholder="请再次输入密码 Confirm password"
                required
                minLength={6}
              />
            </div>

            {/* 表单验证提示 */}
            <div className="text-xs text-base-content/60">
              {formData.password && formData.password.length < 6 && (
                <p className="text-error">❌ 密码至少需要6位字符</p>
              )}
              {formData.password && formData.password.length >= 6 && (
                <p className="text-success">✅ 密码长度符合要求</p>
              )}
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-error">❌ 两次输入的密码不一致</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 6 && (
                <p className="text-success">✅ 密码确认正确</p>
              )}
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
                    注册中...
                  </>
                ) : (
                  '注册 Register'
                )}
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