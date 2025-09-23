'use client'

import { useAuth } from '@/contexts/AuthContext'
import { MemberOnly, AdminOnly } from '@/components/PermissionGuard'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

export default function PermissionTestPage() {
  const { user, profile, loading } = useAuth()
  const [testResults, setTestResults] = useState<any>(null)

  const testDatabaseAccess = async () => {
    try {
      console.log('开始测试数据库访问...')
      
      // 测试文件查询权限
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('id, title, created_at')
        .limit(5)

      const results = {
        user: {
          id: user?.id,
          email: user?.email,
        },
        profile: {
          id: profile?.id,
          role: profile?.role,
          email: profile?.email,
        },
        loading,
        filesQuery: {
          success: !filesError,
          error: filesError?.message,
          errorCode: filesError?.code,
          dataCount: filesData?.length || 0,
          data: filesData?.slice(0, 3) // 只显示前3条
        }
      }

      setTestResults(results)
      console.log('测试结果:', results)

    } catch (error) {
      console.error('测试失败:', error)
      setTestResults({
        error: (error as Error).message
      })
    }
  }

  useEffect(() => {
    if (profile) {
      testDatabaseAccess()
    }
  }, [profile])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">权限测试页面</h1>

      {/* 基本信息 */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">用户信息</h3>
              <p>ID: {user?.id || 'None'}</p>
              <p>Email: {user?.email || 'None'}</p>
              <p>Loading: {loading.toString()}</p>
            </div>
            <div>
              <h3 className="font-semibold">Profile 信息</h3>
              <p>ID: {profile?.id || 'None'}</p>
              <p>Role: {profile?.role || 'None'}</p>
              <p>Email: {profile?.email || 'None'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 权限测试 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Member Only 测试 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">MemberOnly 测试</h2>
            <MemberOnly fallback={
              <div className="alert alert-warning">
                <span>❌ 不是会员，无法查看此内容</span>
              </div>
            }>
              <div className="alert alert-success">
                <span>✅ 会员权限验证通过！</span>
              </div>
            </MemberOnly>
          </div>
        </div>

        {/* Admin Only 测试 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">AdminOnly 测试</h2>
            <AdminOnly fallback={
              <div className="alert alert-warning">
                <span>❌ 不是管理员，无法查看此内容</span>
              </div>
            }>
              <div className="alert alert-success">
                <span>✅ 管理员权限验证通过！</span>
              </div>
            </AdminOnly>
          </div>
        </div>
      </div>

      {/* 数据库访问测试 */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">数据库访问测试</h2>
            <button 
              onClick={testDatabaseAccess}
              className="btn btn-primary btn-sm"
            >
              重新测试
            </button>
          </div>
          
          {testResults ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Files 表查询结果</h3>
                <div className={`alert ${testResults.filesQuery?.success ? 'alert-success' : 'alert-error'}`}>
                  <div>
                    <p><strong>状态:</strong> {testResults.filesQuery?.success ? '成功' : '失败'}</p>
                    <p><strong>数据条数:</strong> {testResults.filesQuery?.dataCount}</p>
                    {testResults.filesQuery?.error && (
                      <p><strong>错误:</strong> {testResults.filesQuery.error}</p>
                    )}
                    {testResults.filesQuery?.errorCode && (
                      <p><strong>错误代码:</strong> {testResults.filesQuery.errorCode}</p>
                    )}
                  </div>
                </div>
              </div>

              {testResults.filesQuery?.data && testResults.filesQuery.data.length > 0 && (
                <div>
                  <h3 className="font-semibold">示例数据</h3>
                  <div className="bg-gray-100 p-3 rounded">
                    <pre className="text-sm">
                      {JSON.stringify(testResults.filesQuery.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <span className="loading loading-spinner loading-lg"></span>
              <p>正在测试数据库访问...</p>
            </div>
          )}
        </div>
      </div>

      {/* 页面链接测试 */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">页面访问测试</h2>
          <div className="flex flex-wrap gap-2">
            <a href="/library" className="btn btn-outline btn-sm">
              访问 Library 页面
            </a>
            <a href="/files" className="btn btn-outline btn-sm">
              访问 Files 页面
            </a>
            <MemberOnly>
              <span className="badge badge-success">会员可见</span>
            </MemberOnly>
            <AdminOnly>
              <a href="/admin/files" className="btn btn-primary btn-sm">
                访问 Admin Files 页面
              </a>
              <span className="badge badge-primary">管理员可见</span>
            </AdminOnly>
          </div>
        </div>
      </div>
    </div>
  )
}