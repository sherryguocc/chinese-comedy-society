'use client'

import { useAuth } from '@/contexts/AuthContext'
import { hasPermission } from '@/lib/permissions'
import { UserRole } from '@/types/database'

export default function RoleTestPage() {
  const { user, profile, loading } = useAuth()

  const testPermissions = [
    'CREATE_POST',
    'EDIT_POST', 
    'DELETE_POST',
    'CREATE_EVENT',
    'MANAGE_USERS',
    'COMMENT_POST',
    'DOWNLOAD_FILE',
    'VIEW_POST',
    'VIEW_EVENT',
  ] as const

  const testRoles: UserRole[] = ['guest', 'member', 'admin']

  const testRoleWithPermissions = (role: UserRole) => {
    console.log(`\n=== Testing role: ${role} ===`)
    return testPermissions.map(permission => {
      const result = hasPermission(role, permission)
      console.log(`${role} -> ${permission}: ${result}`)
      return { role, permission, result }
    })
  }

  const currentUserPermissions = profile?.role ? testPermissions.map(permission => {
    const result = hasPermission(profile.role, permission)
    return { permission, result }
  }) : []

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">角色权限测试页面</h1>
      
      {/* 当前用户状态 */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">当前用户状态</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading.toString()}</p>
            <p><strong>User ID:</strong> {user?.id || 'None'}</p>
            <p><strong>User Email:</strong> {user?.email || 'None'}</p>
            <p><strong>Profile Exists:</strong> {profile ? 'YES' : 'NO'}</p>
            <p><strong>Profile Role:</strong> {profile?.role || 'None'} (type: {typeof profile?.role})</p>
            {profile && (
              <div>
                <p><strong>Full Profile:</strong></p>
                <pre className="bg-gray-100 p-2 rounded text-xs">
                  {JSON.stringify(profile, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 当前用户权限测试 */}
      {profile?.role && (
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title">当前用户权限测试 (Role: {profile.role})</h2>
            <div className="grid grid-cols-2 gap-2">
              {currentUserPermissions.map(({ permission, result }) => (
                <div 
                  key={permission} 
                  className={`p-2 rounded ${result ? 'bg-green-100' : 'bg-red-100'}`}
                >
                  <span className={result ? 'text-green-800' : 'text-red-800'}>
                    {permission}: {result ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 权限矩阵测试 */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">权限矩阵测试</h2>
          <button 
            className="btn btn-primary mb-4"
            onClick={() => {
              console.log('\n=== 开始权限矩阵测试 ===')
              testRoles.forEach(testRoleWithPermissions)
              console.log('=== 权限矩阵测试完成 ===\n')
            }}
          >
            在控制台中运行权限测试
          </button>
          
          <div className="overflow-x-auto">
            <table className="table table-xs">
              <thead>
                <tr>
                  <th>权限 / 角色</th>
                  {testRoles.map(role => (
                    <th key={role} className="text-center">{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {testPermissions.map(permission => (
                  <tr key={permission}>
                    <td className="font-mono text-xs">{permission}</td>
                    {testRoles.map(role => {
                      const result = hasPermission(role, permission)
                      return (
                        <td key={role} className="text-center">
                          <span className={result ? 'text-green-600' : 'text-red-600'}>
                            {result ? '✅' : '❌'}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 手动角色测试 */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">手动角色测试</h2>
          <div className="space-y-4">
            {testRoles.map(role => (
              <div key={role}>
                <h3 className="font-semibold">测试角色: {role}</h3>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    console.log(`\n=== 手动测试角色: ${role} ===`)
                    const results = testRoleWithPermissions(role)
                    alert(`${role} 角色测试完成，查看控制台获取详细结果`)
                  }}
                >
                  测试 {role} 权限
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}