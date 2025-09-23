'use client'

import { useAuth } from '@/contexts/AuthContext'

interface DebugInfoProps {
  initialPostsCount: number
}

export default function DebugInfo({ initialPostsCount }: DebugInfoProps) {
  const { user, profile, loading: authLoading } = useAuth()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="alert alert-info mb-4 text-xs">
      <div>
        <div>User: {user?.email || 'Not logged in'}</div>
        <div>User ID: {user?.id || 'None'}</div>
        <div>Profile: {profile ? 'EXISTS' : 'NULL'}</div>
        <div>Role: {profile?.role || 'No profile'} (type: {typeof profile?.role})</div>
        <div>Auth Loading: {authLoading.toString()}</div>
        <div>Initial Posts Count: {initialPostsCount}</div>
        {profile && (
          <div>Full Profile: {JSON.stringify(profile, null, 2)}</div>
        )}
      </div>
    </div>
  )
}
