'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function TestDBPage() {
  const { profile } = useAuth()
  const [result, setResult] = useState<string>('')

  const testConnection = async () => {
    setResult('Testing connection...')
    try {
      const { data, error } = await supabase.from('profiles').select('count').single()
      setResult(`Connection OK: ${JSON.stringify(data)}`)
    } catch (error: any) {
      setResult(`Connection Error: ${error.message}`)
    }
  }

  const testEventsTable = async () => {
    setResult('Testing events table structure...')
    try {
      // 首先测试简单查询
      const { data: selectData, error: selectError } = await supabase.from('events').select('*').limit(1)
      
      if (selectError) {
        setResult(`Events table SELECT Error: ${selectError.message}`)
        return
      }

      // 测试表结构
      const { data: structureData, error: structureError } = await supabase
        .rpc('get_table_structure', { table_name: 'events' })
        .single()

      setResult(`Events table structure: ${JSON.stringify({
        selectWorks: !selectError,
        dataCount: selectData?.length || 0,
        sampleData: selectData?.[0] || 'No data',
        structureError: structureError?.message || 'No structure error'
      }, null, 2)}`)
    } catch (error: any) {
      setResult(`Events table Error: ${error.message}`)
    }
  }

  const testEventInsert = async () => {
    if (!profile?.id) {
      setResult('No profile ID')
      return
    }

    setResult('Testing event insert with detailed logging...')
    
    try {
      // 首先检查用户的角色
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single()

      if (profileError) {
        setResult(`Profile check failed: ${profileError.message}`)
        return
      }

      setResult(`Profile check OK: ${JSON.stringify(profileData)}\n\nAttempting insert...`)

      const testData = {
        title: 'Test Event',
        description: 'Test Description',
        start_time: new Date().toISOString(),
        event_type: 'meetup',
        organiser: '测试',
        create_by: profile.id
      }

      console.log('Test insert data:', testData)

      // 添加超时控制
      const insertPromise = supabase
        .from('events')
        .insert(testData)
        .select()

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Insert timeout after 3 seconds')), 3000)
      })

      const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any

      if (error) throw error
      setResult(`Insert Success: ${JSON.stringify(data, null, 2)}`)
    } catch (error: any) {
      setResult(`Insert Error: ${error.message}\nDetails: ${error.details || 'No details'}\nHint: ${error.hint || 'No hint'}`)
    }
  }

  const testRLSPolicies = async () => {
    setResult('Testing RLS policies...')
    try {
      // 检查当前用户的认证状态
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        setResult(`Auth Error: ${authError.message}`)
        return
      }

      // 尝试直接查询没有RLS的表（如果有的话）
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      setResult(`RLS Test Results:
Auth User ID: ${user?.id}
Profile Query: ${profilesError ? `Error: ${profilesError.message}` : 'Success'}
Profile Role: ${profilesData?.role || 'Not found'}
Profile Data: ${JSON.stringify(profilesData, null, 2)}`)

    } catch (error: any) {
      setResult(`RLS Test Error: ${error.message}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Database Test Page</h1>
      
      <div className="space-y-4">
        <button onClick={testConnection} className="btn btn-primary">
          Test Connection
        </button>
        
        <button onClick={testEventsTable} className="btn btn-secondary">
          Test Events Table
        </button>

        <button onClick={testRLSPolicies} className="btn btn-warning">
          Test RLS Policies
        </button>
        
        <button onClick={testEventInsert} className="btn btn-accent">
          Test Event Insert
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-bold">Result:</h3>
        <pre className="mt-2 text-sm">{result}</pre>
      </div>

      <div className="mt-6 p-4 bg-blue-100 rounded">
        <h3 className="font-bold">Profile Info:</h3>
        <pre className="mt-2 text-sm">{JSON.stringify(profile, null, 2)}</pre>
      </div>
    </div>
  )
}