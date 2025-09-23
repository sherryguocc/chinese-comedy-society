'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SqlRunnerPage() {
  const [sql, setSql] = useState(`-- 最简单的解决方案：临时禁用profiles表的RLS
-- Simplest solution: Temporarily disable RLS for profiles table

-- 删除所有现有策略
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_select_safe" ON profiles;
DROP POLICY IF EXISTS "profiles_update_safe" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 禁用RLS以解决递归问题
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;`)
  
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeSql = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Executing SQL:', sql)
      
      // 注意：这个方法可能不会工作，因为客户端通常无法执行DDL语句
      // 但我们可以尝试
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: sql
      })
      
      if (error) throw error
      
      setResult(data)
      console.log('SQL execution result:', data)
      
    } catch (err: any) {
      console.error('SQL execution error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 测试查询所有档案
  const testProfilesQuery = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Testing profiles query...')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      console.log('Profiles query result:', { data, error })
      
      if (error) throw error
      
      setResult({
        type: 'profiles_query',
        data,
        count: data?.length || 0
      })
      
    } catch (err: any) {
      console.error('Profiles query error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">SQL Runner & Profile Access Test</h1>
      
      {/* SQL输入区域 */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">SQL Query</h2>
          <textarea
            className="textarea textarea-bordered w-full h-64"
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="Enter SQL query..."
          />
          <div className="card-actions justify-end">
            <button 
              onClick={executeSql} 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner loading-sm"></span> : null}
              Execute SQL
            </button>
            <button 
              onClick={testProfilesQuery} 
              className="btn btn-secondary"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner loading-sm"></span> : null}
              Test Profiles Query
            </button>
          </div>
        </div>
      </div>

      {/* 错误显示 */}
      {error && (
        <div className="alert alert-error mb-6">
          <span>Error: {error}</span>
        </div>
      )}

      {/* 结果显示 */}
      {result && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Result</h2>
            <pre className="bg-base-200 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* 说明 */}
      <div className="alert alert-info mt-6">
        <div>
          <h3 className="font-bold">Note:</h3>
          <p>客户端可能无法直接执行DDL语句。如果SQL执行失败，请：</p>
          <ol className="list-decimal list-inside mt-2">
            <li>复制上面的SQL语句</li>
            <li>打开Supabase Dashboard</li>
            <li>进入SQL Editor</li>
            <li>粘贴并执行SQL语句</li>
          </ol>
        </div>
      </div>
    </div>
  )
}