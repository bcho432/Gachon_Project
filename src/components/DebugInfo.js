import React from 'react'
import { useAuth } from '../contexts/AuthContext'

const DebugInfo = () => {
  const { user } = useAuth()

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 rounded p-2 text-xs">
      <div className="font-bold">Debug Info:</div>
      <div>User: {user?.email || 'None'}</div>
      <div>Supabase URL: {process.env.REACT_APP_SUPABASE_URL ? 'Set' : 'Missing'}</div>
      <div>Supabase Key: {process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</div>
      <div>Node Env: {process.env.NODE_ENV}</div>
    </div>
  )
}

export default DebugInfo 