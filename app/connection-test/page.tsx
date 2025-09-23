'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ConnectionTestPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  const testConnection = async () => {
    setLoading(true)
    setResult('')
    
    try {
      // 测试环境变量
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      console.log('Supabase URL:', supabaseUrl)
      console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')
      
      // 创建客户端
      const supabase = createClientComponentClient()
      
      // 简单的ping测试
      console.log('Testing basic connection...')
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        setResult(`Auth session error: ${error.message}`)
      } else {
        setResult(`Connection successful! Session: ${data.session ? 'Active' : 'None'}`)
        
        // 测试简单查询
        try {
          console.log('Testing simple query...')
          const { data: testData, error: queryError } = await supabase
            .from('profiles')
            .select('count', { count: 'exact', head: true })
          
          if (queryError) {
            setResult(prev => prev + `\nQuery error: ${queryError.message}`)
          } else {
            setResult(prev => prev + `\nQuery successful! Profile count: ${testData}`)
          }
        } catch (queryErr: any) {
          setResult(prev => prev + `\nQuery exception: ${queryErr.message}`)
        }
      }
      
    } catch (err: any) {
      console.error('Connection test error:', err)
      setResult(`Connection failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Supabase Connection Test</h1>
      
      <div className="mb-6">
        <button 
          onClick={testConnection}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      {result && (
        <div className="alert alert-info">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-base-200 rounded">
        <h3 className="font-bold mb-2">Environment Check:</h3>
        <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</p>
        <p>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</p>
      </div>
    </div>
  )
}