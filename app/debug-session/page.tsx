'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'

export default function SessionTestPage() {
  const { user, profile, loading } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [visibilityState, setVisibilityState] = useState('visible')
  const [lastVisibilityChange, setLastVisibilityChange] = useState<Date | null>(null)

  useEffect(() => {
    const updateVisibilityState = () => {
      setVisibilityState(document.visibilityState)
      setLastVisibilityChange(new Date())
    }

    document.addEventListener('visibilitychange', updateVisibilityState)
    
    return () => {
      document.removeEventListener('visibilitychange', updateVisibilityState)
    }
  }, [])

  const checkSession = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session }, error } = await supabase.auth.getSession()
      setSessionInfo({
        hasSession: !!session,
        sessionData: session ? {
          expiresAt: session.expires_at,
          refreshToken: session.refresh_token ? 'present' : 'missing',
          accessToken: session.access_token ? 'present' : 'missing'
        } : null,
        error: error?.message
      })
    } catch (error: any) {
      setSessionInfo({
        hasSession: false,
        error: error.message
      })
    }
  }

  useEffect(() => {
    checkSession()
    const interval = setInterval(checkSession, 5000) // 每5秒检查一次
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">会话管理测试 Session Management Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 认证状态 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">认证状态 Auth State</h2>
            <div className="space-y-2">
              <div>
                <strong>Loading:</strong> 
                <span className={`badge ${loading ? 'badge-warning' : 'badge-success'} ml-2`}>
                  {loading ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <strong>User:</strong> 
                <span className={`badge ${user ? 'badge-success' : 'badge-error'} ml-2`}>
                  {user ? 'Logged In' : 'Not Logged In'}
                </span>
              </div>
              {user && (
                <div className="text-sm">
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>User ID:</strong> {user.id}</div>
                </div>
              )}
              {profile && (
                <div className="text-sm">
                  <div><strong>Profile:</strong> {profile.full_name || profile.username || 'No name'}</div>
                  <div><strong>Role:</strong> {profile.role}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 会话信息 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">会话信息 Session Info</h2>
            <button onClick={checkSession} className="btn btn-sm btn-primary mb-4">
              刷新检查 Refresh Check
            </button>
            {sessionInfo && (
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Has Session:</strong>
                  <span className={`badge ${sessionInfo.hasSession ? 'badge-success' : 'badge-error'} ml-2`}>
                    {sessionInfo.hasSession ? 'Yes' : 'No'}
                  </span>
                </div>
                {sessionInfo.sessionData && (
                  <>
                    <div><strong>Expires At:</strong> {new Date(sessionInfo.sessionData.expiresAt * 1000).toLocaleString()}</div>
                    <div><strong>Access Token:</strong> {sessionInfo.sessionData.accessToken}</div>
                    <div><strong>Refresh Token:</strong> {sessionInfo.sessionData.refreshToken}</div>
                  </>
                )}
                {sessionInfo.error && (
                  <div className="text-error"><strong>Error:</strong> {sessionInfo.error}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 页面可见性状态 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">页面状态 Page State</h2>
            <div className="space-y-2">
              <div>
                <strong>Visibility State:</strong>
                <span className={`badge ${visibilityState === 'visible' ? 'badge-success' : 'badge-warning'} ml-2`}>
                  {visibilityState}
                </span>
              </div>
              {lastVisibilityChange && (
                <div className="text-sm">
                  <strong>Last Change:</strong> {lastVisibilityChange.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 本地存储状态 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">本地存储 LocalStorage</h2>
            <div className="space-y-2 text-xs">
              <div>
                <strong>User Data:</strong>
                <span className={`badge ${typeof window !== 'undefined' && localStorage.getItem('chinese-comedy-society-user') ? 'badge-success' : 'badge-error'} ml-2`}>
                  {typeof window !== 'undefined' && localStorage.getItem('chinese-comedy-society-user') ? 'Present' : 'Missing'}
                </span>
              </div>
              <div>
                <strong>Profile Data:</strong>
                <span className={`badge ${typeof window !== 'undefined' && localStorage.getItem('chinese-comedy-society-profile') ? 'badge-success' : 'badge-error'} ml-2`}>
                  {typeof window !== 'undefined' && localStorage.getItem('chinese-comedy-society-profile') ? 'Present' : 'Missing'}
                </span>
              </div>
              <div>
                <strong>Auth Data:</strong>
                <span className={`badge ${typeof window !== 'undefined' && localStorage.getItem('chinese-comedy-society-auth') ? 'badge-success' : 'badge-error'} ml-2`}>
                  {typeof window !== 'undefined' && localStorage.getItem('chinese-comedy-society-auth') ? 'Present' : 'Missing'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-base-200 rounded-lg">
        <h3 className="font-bold mb-2">测试说明 Test Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>登录后，切换到其他应用程序（如另一个浏览器窗口或其他程序）</li>
          <li>等待几分钟后切换回来</li>
          <li>观察认证状态是否保持</li>
          <li>检查控制台是否有相关日志</li>
        </ol>
      </div>
    </div>
  )
}