'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function FixVerificationPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const clearCacheAndTest = async () => {
    setLoading(true)
    try {
      // 1. 强制刷新 Supabase 认证状态
      console.log('1. 刷新认证会话...')
      await supabase.auth.refreshSession()
      
      // 2. 等待一下让会话更新
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 3. 重新获取用户信息
      console.log('2. 重新获取用户信息...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        throw new Error(`认证错误: ${authError.message}`)
      }
      
      if (!user) {
        throw new Error('用户未登录')
      }
      
      console.log('3. 用户信息:', { id: user.id, email: user.email })
      
      // 4. 尝试直接查询（不使用 RLS，如果可能的话）
      console.log('4. 测试 profiles 查询...')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      console.log('5. 查询结果:', { data, error })

      setTestResult({
        success: !error,
        data,
        error: error?.message,
        errorCode: (error as any)?.code,
        userId: user.id,
        userEmail: user.email,
        timestamp: new Date().toISOString()
      })

    } catch (err) {
      console.error('测试失败:', err)
      setTestResult({
        success: false,
        error: (err as Error).message,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const testProfileQuery = async () => {
    setLoading(true)
    try {
      // 测试当前用户的 profile 查询
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setTestResult({ success: false, error: '用户未登录' })
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      setTestResult({
        success: !error,
        data,
        error: error?.message,
        userId: user.id,
        userEmail: user.email
      })

    } catch (err) {
      setTestResult({
        success: false,
        error: (err as Error).message
      })
    } finally {
      setLoading(false)
    }
  }

  const createProfileManually = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('用户未登录')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          role: 'admin'
        })
        .select()

      if (error) {
        alert(`创建失败: ${error.message}`)
      } else {
        alert('Profile 创建成功!')
        await testProfileQuery() // 重新测试
      }

    } catch (err) {
      alert(`创建异常: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">RLS 修复验证</h1>
      
      <div className="space-y-6">
        {/* 修复说明 */}
        <div className="alert alert-error">
          <div>
            <h3 className="font-bold">发现的问题：</h3>
            <p>RLS 策略中存在无限递归 (infinite recursion)</p>
            <p>错误代码：42P17</p>
          </div>
        </div>

        {/* 修复步骤 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">彻底修复步骤</h2>
            <div className="space-y-4">
              <div className="alert alert-warning">
                <div>
                  <h4 className="font-bold">策略可能没有完全清除，需要更彻底的修复：</h4>
                </div>
              </div>
              
              <div>
                <p><strong>步骤 1:</strong> 在 Supabase SQL Editor 中执行 <code>complete-fix.sql</code></p>
                <p><strong>步骤 2:</strong> 或者逐步执行以下 SQL：</p>
              </div>
              
              <div className="bg-gray-100 p-3 rounded">
                <h5 className="font-semibold mb-2">1. 查看现有策略：</h5>
                <pre className="text-xs">
{`SELECT policyname FROM pg_policies WHERE tablename = 'profiles';`}
                </pre>
              </div>
              
              <div className="bg-gray-100 p-3 rounded">
                <h5 className="font-semibold mb-2">2. 强制删除所有策略：</h5>
                <pre className="text-xs">
{`DO $$ 
DECLARE policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', policy_record.policyname);
    END LOOP;
END $$;`}
                </pre>
              </div>
              
              <div className="bg-gray-100 p-3 rounded">
                <h5 className="font-semibold mb-2">3. 临时禁用 RLS：</h5>
                <pre className="text-xs">
{`ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;`}
                </pre>
              </div>
              
              <div className="bg-gray-100 p-3 rounded">
                <h5 className="font-semibold mb-2">4. 插入您的管理员记录：</h5>
                <pre className="text-xs">
{`INSERT INTO profiles (id, email, role) 
VALUES ('f48a7c5d-18a1-4ce6-af31-3ec1273d27e7', 'sherryguocc@gmail.com', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';`}
                </pre>
              </div>
              
              <div className="bg-gray-100 p-3 rounded">
                <h5 className="font-semibold mb-2">5. 重新启用 RLS 并创建简单策略：</h5>
                <pre className="text-xs">
{`ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* 测试按钮 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">缓存清理和测试</h2>
            <div className="space-y-3">
              <div className="alert alert-info">
                <div>
                  <p>执行 SQL 后，需要清理缓存并重新测试</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button 
                  className="btn btn-primary"
                  onClick={clearCacheAndTest}
                  disabled={loading}
                >
                  {loading ? '清理缓存并测试中...' : '🔄 清理缓存并测试'}
                </button>
                
                <button 
                  className="btn btn-secondary"
                  onClick={testProfileQuery}
                  disabled={loading}
                >
                  {loading ? '测试中...' : '🧪 简单测试查询'}
                </button>
                
                <button 
                  className="btn btn-accent"
                  onClick={createProfileManually}
                  disabled={loading}
                >
                  {loading ? '创建中...' : '➕ 手动创建 Profile'}
                </button>
                
                <button 
                  className="btn btn-warning"
                  onClick={() => window.location.reload()}
                >
                  🔃 强制刷新页面
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 测试结果 */}
        {testResult && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">测试结果</h2>
              <div className={`alert ${testResult.success ? 'alert-success' : 'alert-error'}`}>
                <div>
                  <p><strong>状态:</strong> {testResult.success ? '✅ 成功' : '❌ 失败'}</p>
                  <p><strong>用户ID:</strong> {testResult.userId || 'None'}</p>
                  <p><strong>用户邮箱:</strong> {testResult.userEmail || 'None'}</p>
                  <p><strong>错误代码:</strong> {testResult.errorCode || 'None'}</p>
                  <p><strong>时间戳:</strong> {testResult.timestamp || 'None'}</p>
                  {testResult.data && (
                    <>
                      <p><strong>Profile角色:</strong> {testResult.data.role}</p>
                      <p><strong>Profile数据:</strong></p>
                      <pre className="text-xs mt-2">
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 最终验证 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">验证完成后</h2>
            <p>如果测试成功，请：</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>刷新页面 (F5)</li>
              <li>返回主页查看角色显示是否正常</li>
              <li>测试管理员功能是否可用</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}