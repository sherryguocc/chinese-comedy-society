'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function QuickFixPage() {
  const { user, profile, loading } = useAuth()
  const [directQuery, setDirectQuery] = useState<any>(null)

  useEffect(() => {
    if (user?.id) {
      // 直接查询数据库
      const fetchDirectly = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          setDirectQuery({ success: !error, data, error: error?.message })
        } catch (err) {
          setDirectQuery({ success: false, error: (err as Error).message })
        }
      }

      fetchDirectly()
    }
  }, [user?.id])

  const refreshAuth = async () => {
    try {
      // 强制刷新认证状态
      await supabase.auth.refreshSession()
      window.location.reload()
    } catch (err) {
      console.error('刷新失败:', err)
    }
  }

  const forceRefreshProfile = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        alert(`查询失败: ${error.message}`)
        return
      }

      if (data) {
        alert(`直接查询成功！角色: ${data.role}`)
        console.log('直接查询结果:', data)
      }
    } catch (err) {
      alert(`查询异常: ${(err as Error).message}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">快速修复调试</h1>
      
      <div className="space-y-6">
        {/* 问题诊断 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">问题诊断</h2>
            <div className="alert alert-warning">
              <div>
                <h3 className="font-bold">常见问题及解决方案：</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>Profile 为 null:</strong> AuthContext 获取失败</li>
                  <li><strong>Role 显示但判断失败:</strong> 数据类型或权限逻辑问题</li>
                  <li><strong>数据库连接问题:</strong> RLS策略或环境变量问题</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 当前状态 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">当前状态对比</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AuthContext 数据 */}
              <div>
                <h3 className="font-semibold mb-2">AuthContext 数据</h3>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <p><strong>Loading:</strong> {loading.toString()}</p>
                  <p><strong>User ID:</strong> {user?.id || 'None'}</p>
                  <p><strong>Profile:</strong> {profile ? 'EXISTS' : 'NULL'}</p>
                  <p><strong>Role:</strong> {profile?.role || 'None'}</p>
                  <p><strong>Role Type:</strong> {typeof profile?.role}</p>
                </div>
              </div>

              {/* 直接查询数据 */}
              <div>
                <h3 className="font-semibold mb-2">直接数据库查询</h3>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  {directQuery ? (
                    <>
                      <p><strong>Success:</strong> {directQuery.success.toString()}</p>
                      <p><strong>Role:</strong> {directQuery.data?.role || 'None'}</p>
                      <p><strong>Role Type:</strong> {typeof directQuery.data?.role}</p>
                      <p><strong>Error:</strong> {directQuery.error || 'None'}</p>
                    </>
                  ) : (
                    <p>等待查询...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">快速修复操作</h2>
            <div className="flex flex-wrap gap-2">
              <button 
                className="btn btn-primary"
                onClick={refreshAuth}
              >
                🔄 刷新认证状态
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={forceRefreshProfile}
                disabled={!user?.id}
              >
                🔍 强制查询Profile
              </button>
              
              <button 
                className="btn btn-accent"
                onClick={() => window.location.href = '/debug'}
              >
                🛠️ 访问详细调试页面
              </button>
              
              <button 
                className="btn btn-info"
                onClick={() => window.location.href = '/role-test'}
              >
                🧪 访问角色测试页面
              </button>
            </div>
          </div>
        </div>

        {/* 完整数据显示 */}
        {(profile || directQuery?.data) && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">完整数据对比</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile && (
                  <div>
                    <h3 className="font-semibold mb-2">AuthContext Profile</h3>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                      {JSON.stringify(profile, null, 2)}
                    </pre>
                  </div>
                )}
                
                {directQuery?.data && (
                  <div>
                    <h3 className="font-semibold mb-2">直接查询结果</h3>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                      {JSON.stringify(directQuery.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}