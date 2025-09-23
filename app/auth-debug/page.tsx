'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function AuthDebugPage() {
  const { user, profile, loading } = useAuth()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Auth Context Debug</h1>
      
      <div className="space-y-4">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Loading State</h2>
            <p>Loading: <span className={`badge ${loading ? 'badge-warning' : 'badge-success'}`}>
              {loading ? 'true' : 'false'}
            </span></p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">User State</h2>
            <p>Has User: <span className={`badge ${user ? 'badge-success' : 'badge-error'}`}>
              {user ? 'true' : 'false'}
            </span></p>
            {user && (
              <div className="mt-2">
                <p>ID: {user.id}</p>
                <p>Email: {user.email}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Profile State</h2>
            <p>Has Profile: <span className={`badge ${profile ? 'badge-success' : 'badge-error'}`}>
              {profile ? 'true' : 'false'}
            </span></p>
            {profile && (
              <div className="mt-2">
                <p>ID: {profile.id}</p>
                <p>Email: {profile.email}</p>
                <p>Role: <span className={`badge ${
                  profile.role === 'admin' ? 'badge-error' :
                  profile.role === 'member' ? 'badge-warning' : 'badge-neutral'
                }`}>{profile.role}</span></p>
                <p>Full Name: {profile.full_name}</p>
                <p>Username: {profile.username}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Raw Data</h2>
            <pre className="text-xs bg-base-200 p-4 rounded">
              {JSON.stringify({ 
                loading, 
                hasUser: !!user,
                hasProfile: !!profile,
                userEmail: user?.email,
                profileRole: profile?.role,
                profileData: profile
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}