'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function DatabaseTestPage() {
  const { user, profile } = useAuth()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const testResults: any[] = []

    // Test 1: Check auth status
    testResults.push({
      test: 'Auth Status',
      result: user ? 'Authenticated' : 'Not authenticated',
      success: !!user,
      details: { userId: user?.id, userRole: profile?.role }
    })

    // Test 2: Test profiles table
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .limit(1)
      
      testResults.push({
        test: 'Profiles Table Access',
        result: error ? `Error: ${error.message}` : 'Success',
        success: !error,
        details: { count: data?.length || 0, error: error?.code }
      })
    } catch (err: any) {
      testResults.push({
        test: 'Profiles Table Access',
        result: `Exception: ${err.message}`,
        success: false,
        details: err
      })
    }

    // Test 3: Test posts table read
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title')
        .limit(1)
      
      testResults.push({
        test: 'Posts Table Read',
        result: error ? `Error: ${error.message}` : 'Success',
        success: !error,
        details: { count: data?.length || 0, error: error?.code }
      })
    } catch (err: any) {
      testResults.push({
        test: 'Posts Table Read',
        result: `Exception: ${err.message}`,
        success: false,
        details: err
      })
    }

    // Test 4: Test posts table write (if user is authenticated)
    if (user && profile) {
      try {
        const testData = {
          title: 'Test Post - Will be deleted',
          content: 'This is a test post',
          author_id: profile.id
        }

        const { data, error } = await supabase
          .from('posts')
          .insert(testData)
          .select()
        
        if (!error && data?.[0]) {
          // Clean up - delete the test post
          await supabase
            .from('posts')
            .delete()
            .eq('id', data[0].id)
        }

        testResults.push({
          test: 'Posts Table Write',
          result: error ? `Error: ${error.message}` : 'Success',
          success: !error,
          details: { insertedId: data?.[0]?.id, error: error?.code }
        })
      } catch (err: any) {
        testResults.push({
          test: 'Posts Table Write',
          result: `Exception: ${err.message}`,
          success: false,
          details: err
        })
      }
    }

    // Test 5: Check RLS policies
    try {
      const { data, error } = await supabase
        .rpc('has_table_privilege', { 
          table_name: 'posts', 
          privilege: 'INSERT' 
        })
      
      testResults.push({
        test: 'RLS INSERT Permission',
        result: error ? `Error: ${error.message}` : `Has permission: ${data}`,
        success: !error,
        details: { hasPermission: data, error: error?.code }
      })
    } catch (err: any) {
      testResults.push({
        test: 'RLS INSERT Permission',
        result: `Exception: ${err.message}`,
        success: false,
        details: err
      })
    }

    setResults(testResults)
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Database Connection Test</h1>
      
      <div className="mb-6">
        <button 
          onClick={runTests}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Running Tests...' : 'Run Database Tests'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <div 
              key={index}
              className={`alert ${result.success ? 'alert-success' : 'alert-error'}`}
            >
              <div>
                <h3 className="font-bold">{result.test}</h3>
                <p>{result.result}</p>
                {result.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm opacity-70">
                      View Details
                    </summary>
                    <pre className="text-xs mt-2 opacity-70">
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