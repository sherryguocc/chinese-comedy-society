'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database'

export default function DatabaseDebugPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [authUsers, setAuthUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 获取profiles表数据
      console.log('Fetching profiles...')
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Profiles result:', { profilesData, profilesError })

      if (profilesError) {
        throw new Error(`Profiles error: ${profilesError.message}`)
      }

      setProfiles(profilesData || [])

      // 尝试获取auth.users数据（如果有权限）
      console.log('Attempting to fetch auth users...')
      try {
        const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
        console.log('Auth users result:', { usersData, usersError })
        
        if (!usersError && usersData) {
          setAuthUsers(usersData.users || [])
        }
      } catch (authError) {
        console.log('Auth users fetch failed (expected):', authError)
      }

    } catch (error: any) {
      console.error('Database debug error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">数据库调试 Database Debug</h1>
      
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <button onClick={fetchAllData} className="btn btn-primary mb-6">
        刷新数据 Refresh Data
      </button>

      {/* Profiles表数据 */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">Profiles表数据 ({profiles.length} 条记录)</h2>
          
          {profiles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Full Name</th>
                    <th>Username</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => (
                    <tr key={profile.id}>
                      <td className="font-mono text-xs">{profile.id}</td>
                      <td>{profile.email}</td>
                      <td>
                        <span className={`badge ${
                          profile.role === 'admin' ? 'badge-error' :
                          profile.role === 'member' ? 'badge-warning' : 'badge-neutral'
                        }`}>
                          {profile.role}
                        </span>
                      </td>
                      <td>{profile.full_name || '未设置'}</td>
                      <td>{profile.username || '未设置'}</td>
                      <td className="text-xs">{new Date(profile.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>没有找到任何profiles记录</p>
          )}
        </div>
      </div>

      {/* Auth Users数据 */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">Auth Users数据 ({authUsers.length} 条记录)</h2>
          
          {authUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Email Confirmed</th>
                    <th>Created At</th>
                    <th>Last Sign In</th>
                  </tr>
                </thead>
                <tbody>
                  {authUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="font-mono text-xs">{user.id}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${user.email_confirmed_at ? 'badge-success' : 'badge-warning'}`}>
                          {user.email_confirmed_at ? '已确认' : '未确认'}
                        </span>
                      </td>
                      <td className="text-xs">{new Date(user.created_at).toLocaleString()}</td>
                      <td className="text-xs">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '从未'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>无法获取auth users数据（权限限制）</p>
          )}
        </div>
      </div>

      {/* Raw Data Debug */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">原始数据 Raw Data</h2>
          <div className="tabs tabs-boxed">
            <input type="radio" name="debug_tabs" className="tab" aria-label="Profiles" defaultChecked />
            <div className="tab-content bg-base-100 border-base-300 rounded-box p-6">
              <pre className="text-xs bg-base-200 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(profiles, null, 2)}
              </pre>
            </div>

            <input type="radio" name="debug_tabs" className="tab" aria-label="Auth Users" />
            <div className="tab-content bg-base-100 border-base-300 rounded-box p-6">
              <pre className="text-xs bg-base-200 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(authUsers, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}