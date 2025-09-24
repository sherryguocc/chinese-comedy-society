'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'

export default function DatabaseTestPage() {
  const { user, profile } = useAuth()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentTest, setCurrentTest] = useState('')
  const [mounted, setMounted] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  // 防止 hydration 错误
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Database Connection Test</h1>
        <div className="mb-6 space-y-4">
          <div className="alert alert-info">
            <div>
              <h3 className="font-bold">Current Status:</h3>
              <p>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const runTests = async () => {
    setLoading(true)
    setCurrentTest('Starting tests...')
    setResults([]) // 清空之前的结果
    const testResults: any[] = []

    try {
      console.log('Starting database tests...')

      // Test 1: Check auth status
      setCurrentTest('Testing authentication status...')
      testResults.push({
        test: 'Auth Status',
        result: user ? `Authenticated as ${user.email}` : 'Not authenticated',
        success: !!user,
        details: { userId: user?.id, userRole: profile?.role, email: user?.email }
      })
      setResults([...testResults]) // 实时更新结果

      // 添加延迟以确保状态更新
      await new Promise(resolve => setTimeout(resolve, 100))

      // Test 2: Test profiles table
      try {
        setCurrentTest('Testing profiles table access...')
        console.log('Testing profiles table...')
        
        const profilesPromise = supabase
          .from('profiles')
          .select('id, role, email')
          .limit(3)

        const profilesTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profiles query timeout')), 5000)
        )

        const { data, error } = await Promise.race([profilesPromise, profilesTimeout]) as any
        
        testResults.push({
          test: 'Profiles Table Access',
          result: error ? `Error: ${error.message}` : `Success - Found ${data?.length || 0} profiles`,
          success: !error,
          details: { count: data?.length || 0, error: error?.code, sampleData: data?.slice(0, 2) }
        })
        setResults([...testResults])
      } catch (err: any) {
        console.error('Profiles test error:', err)
        testResults.push({
          test: 'Profiles Table Access',
          result: `Exception: ${err.message}`,
          success: false,
          details: { exception: err.message }
        })
        setResults([...testResults])
      }

      await new Promise(resolve => setTimeout(resolve, 100))

      // Test 3: Test posts table read
      try {
        setCurrentTest('Testing posts table read access...')
        console.log('Testing posts table read...')
        
        const postsPromise = supabase
          .from('posts')
          .select('id, title, author_id')
          .limit(3)

        const postsTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Posts read query timeout')), 5000)
        )

        const { data, error } = await Promise.race([postsPromise, postsTimeout]) as any
        
        testResults.push({
          test: 'Posts Table Read',
          result: error ? `Error: ${error.message}` : `Success - Found ${data?.length || 0} posts`,
          success: !error,
          details: { count: data?.length || 0, error: error?.code, sampleData: data?.slice(0, 2) }
        })
        setResults([...testResults])
      } catch (err: any) {
        console.error('Posts read test error:', err)
        testResults.push({
          test: 'Posts Table Read',
          result: `Exception: ${err.message}`,
          success: false,
          details: { exception: err.message }
        })
        setResults([...testResults])
      }

      await new Promise(resolve => setTimeout(resolve, 100))

      // Test 4: Test posts table write (if user is authenticated)
      if (user && profile) {
        try {
          setCurrentTest('Testing posts table write access...')
          console.log('Testing posts table write...')
          
          // First, let's test if we can check auth.uid() via RPC
          try {
            setCurrentTest('Checking auth.uid() function...')
            const { data: authUidData, error: authUidError } = await supabase
              .rpc('get_current_user_id')
              
            console.log('auth.uid() RPC result:', { authUidData, authUidError })
          } catch (rpcErr) {
            console.log('auth.uid() RPC not available, continuing...')
          }
          
          // Test if we can query our own profile via RLS
          setCurrentTest('Testing profile access via RLS...')
          const { data: rlsProfileData, error: rlsProfileError } = await supabase
            .from('profiles')
            .select('id, role, email')
            .eq('id', user.id)
            .single()
            
          console.log('RLS profile query result:', { rlsProfileData, rlsProfileError })
          
          setCurrentTest('Testing posts table write access...')
          const testData = {
            title: `Test Post ${Date.now()}`,
            content: 'This is a test post that will be deleted immediately',
            author_id: profile.id
          }

          const insertPromise = supabase
            .from('posts')
            // @ts-ignore - Supabase type inference issue
            .insert(testData)
            .select()

          const insertTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Posts insert query timeout')), 10000)
          )

          const { data, error } = await Promise.race([insertPromise, insertTimeout]) as any
          
          let cleanupSuccess = false
          if (!error && data?.[0]) {
            // Clean up - delete the test post
            try {
              setCurrentTest('Cleaning up test data...')
              const { error: deleteError } = await supabase
                .from('posts')
                .delete()
                .eq('id', data[0].id)
              cleanupSuccess = !deleteError
            } catch (deleteErr) {
              console.error('Cleanup error:', deleteErr)
            }
          }

          testResults.push({
            test: 'Posts Table Write & Delete',
            result: error ? `Insert Error: ${error.message}` : 'Success - Insert and delete completed',
            success: !error,
            details: { 
              insertedId: data?.[0]?.id, 
              error: error?.code, 
              cleanupSuccess,
              profileAccessViaRLS: rlsProfileError ? `Error: ${rlsProfileError.message}` : 'Success',
              authContext: {
                userIdFromAuth: user.id,
                profileIdFromContext: profile.id,
                userRole: profile.role
              }
            }
          })
          setResults([...testResults])
        } catch (err: any) {
          console.error('Posts write test error:', err)
          testResults.push({
            test: 'Posts Table Write & Delete',
            result: `Exception: ${err.message}`,
            success: false,
            details: { exception: err.message }
          })
          setResults([...testResults])
        }
      } else {
        testResults.push({
          test: 'Posts Table Write & Delete',
          result: 'Skipped - Not authenticated or no profile',
          success: false,
          details: { reason: 'Authentication required' }
        })
        setResults([...testResults])
      }

    } catch (globalError: any) {
      console.error('Global test error:', globalError)
      testResults.push({
        test: 'Global Test Error',
        result: `Failed: ${globalError.message}`,
        success: false,
        details: globalError
      })
      setResults([...testResults])
    } finally {
      setCurrentTest('')
      setLoading(false)
      console.log('All tests completed')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Database Connection Test</h1>
      
      <div className="mb-6 space-y-4">
        <div className="alert alert-info">
          <div>
            <h3 className="font-bold">Current Status:</h3>
            <p>User: {user ? user.email : 'Not logged in'}</p>
            <p>Profile Role: {profile?.role || 'None'}</p>
            <p>User ID: {user?.id || 'None'}</p>
          </div>
        </div>
        
        <button 
          onClick={runTests}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Running Tests...
            </>
          ) : (
            'Run Database Tests'
          )}
        </button>
      </div>

      {loading && (
        <div className="alert alert-info mb-6">
          <span className="loading loading-spinner loading-sm"></span>
          <span>Tests in progress... Results will appear below as they complete.</span>
          {currentTest && (
            <div className="text-sm opacity-75 mt-1">
              Current: {currentTest}
            </div>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Test Results ({results.length} tests):</h2>
          {results.map((result, index) => (
            <div 
              key={index}
              className={`alert ${result.success ? 'alert-success' : 'alert-error'}`}
            >
              <div className="w-full">
                <h3 className="font-bold">{result.test}</h3>
                <p>{result.result}</p>
                {result.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm opacity-70">
                      View Details
                    </summary>
                    <pre className="text-xs mt-2 opacity-70 bg-base-200 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}