'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const { user, profile, loading } = useAuth()
  const [dbTest, setDbTest] = useState<any>(null)
  const [profileTest, setProfileTest] = useState<any>(null)

  useEffect(() => {
    const testDatabaseConnection = async () => {
      try {
        // Test basic database connection
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, role')
          .limit(1)

        setDbTest({ success: !error, data, error: error?.message })
      } catch (err) {
        setDbTest({ success: false, error: (err as Error).message })
      }
    }

    const testCurrentUserProfile = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        setProfileTest({ 
          success: !error, 
          data, 
          error: error?.message,
          code: (error as any)?.code 
        })
      } catch (err) {
        setProfileTest({ success: false, error: (err as Error).message })
      }
    }

    testDatabaseConnection()
    if (user?.id) {
      testCurrentUserProfile()
    }
  }, [user?.id])

  const createProfile = async () => {
    if (!user?.id || !user?.email) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          role: 'admin',
          full_name: user.user_metadata?.full_name || ''
        })
        .select()

      if (error) {
        console.error('创建档案失败:', error)
        alert(`创建档案失败: ${error.message}`)
      } else {
        console.log('档案创建成功:', data)
        alert('档案创建成功!')
        window.location.reload()
      }
    } catch (err) {
      console.error('创建档案异常:', err)
      alert(`创建档案异常: ${(err as Error).message}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">调试信息页面</h1>
      
      <div className="space-y-6">
        {/* Auth State */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">认证状态</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading.toString()}</p>
              <p><strong>User ID:</strong> {user?.id || 'None'}</p>
              <p><strong>User Email:</strong> {user?.email || 'None'}</p>
              <p><strong>Profile:</strong> {profile ? JSON.stringify(profile, null, 2) : 'null'}</p>
            </div>
          </div>
        </div>

        {/* Database Test */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">数据库连接测试</h2>
            <div className="space-y-2">
              <p><strong>状态:</strong> {dbTest?.success ? '✅ 成功' : '❌ 失败'}</p>
              <p><strong>错误:</strong> {dbTest?.error || 'None'}</p>
              <p><strong>数据:</strong> {dbTest?.data ? JSON.stringify(dbTest.data, null, 2) : 'None'}</p>
            </div>
          </div>
        </div>

        {/* Profile Test */}
        {user?.id && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">当前用户档案测试</h2>
              <div className="space-y-2">
                <p><strong>状态:</strong> {profileTest?.success ? '✅ 成功' : '❌ 失败'}</p>
                <p><strong>错误:</strong> {profileTest?.error || 'None'}</p>
                <p><strong>错误代码:</strong> {profileTest?.code || 'None'}</p>
                <p><strong>数据:</strong> {profileTest?.data ? JSON.stringify(profileTest.data, null, 2) : 'None'}</p>
                
                {!profileTest?.data && user?.id && (
                  <div className="mt-4">
                    <button 
                      className="btn btn-primary" 
                      onClick={createProfile}
                    >
                      手动创建管理员档案
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manual SQL Test */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">建议的解决步骤</h2>
            <div className="space-y-2">
              <ol className="list-decimal list-inside space-y-2">
                <li>检查浏览器控制台中的详细日志</li>
                <li>运行 fix-rls-policies.sql 文件中的 SQL 语句</li>
                <li>如果 profile 不存在，点击"手动创建管理员档案"按钮</li>
                <li>刷新页面查看是否解决问题</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}