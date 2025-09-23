'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DiagnosticPage() {
  const [testResults, setTestResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    setLoading(true)
    const results: any = {}

    try {
      // 测试环境变量
      results.environment = {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
      }

      // 测试Supabase连接
      try {
        const { data, error } = await supabase.auth.getSession()
        results.supabaseConnection = {
          success: !error,
          error: error?.message,
          hasSession: !!data.session
        }
      } catch (err: any) {
        results.supabaseConnection = {
          success: false,
          error: err.message,
          hasSession: false
        }
      }

      // 测试数据库连接
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1)
        results.databaseConnection = {
          success: !error,
          error: error?.message,
          canQuery: !!data
        }
      } catch (err: any) {
        results.databaseConnection = {
          success: false,
          error: err.message,
          canQuery: false
        }
      }

      // 测试登录功能（使用测试凭据）
      try {
        const testEmail = 'test@example.com'
        const testPassword = 'wrongpassword'
        const { error } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        })
        results.authTest = {
          attempted: true,
          error: error?.message || 'No error (unexpected)',
          expectedError: error?.message?.includes('Invalid login credentials')
        }
      } catch (err: any) {
        results.authTest = {
          attempted: true,
          error: err.message,
          expectedError: false
        }
      }

    } catch (err: any) {
      results.generalError = err.message
    }

    setTestResults(results)
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">系统诊断 System Diagnostics</h1>
      
      <div className="mb-6">
        <button 
          onClick={runDiagnostics}
          disabled={loading}
          className="btn primary-orange"
        >
          {loading ? '诊断中...' : '运行诊断 Run Diagnostics'}
        </button>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">诊断结果 Diagnostic Results</h2>
              <pre className="text-sm bg-base-200 p-4 rounded overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          </div>

          {/* 环境变量检查 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">环境变量 Environment Variables</h3>
              <div className="space-y-2">
                <div className={`badge ${testResults.environment?.hasSupabaseUrl ? 'badge-success' : 'badge-error'}`}>
                  Supabase URL: {testResults.environment?.hasSupabaseUrl ? '✓' : '✗'}
                </div>
                <div className={`badge ${testResults.environment?.hasSupabaseKey ? 'badge-success' : 'badge-error'}`}>
                  Supabase Key: {testResults.environment?.hasSupabaseKey ? '✓' : '✗'}
                </div>
                <div className="text-sm">
                  Node Env: {testResults.environment?.nodeEnv}
                </div>
              </div>
            </div>
          </div>

          {/* Supabase连接检查 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Supabase连接 Supabase Connection</h3>
              <div className={`badge ${testResults.supabaseConnection?.success ? 'badge-success' : 'badge-error'}`}>
                连接状态: {testResults.supabaseConnection?.success ? '成功' : '失败'}
              </div>
              {testResults.supabaseConnection?.error && (
                <div className="text-error text-sm mt-2">
                  错误: {testResults.supabaseConnection.error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}