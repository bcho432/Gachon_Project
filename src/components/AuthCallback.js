import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import toast from 'react-hot-toast'

const AuthCallback = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          toast.error('Email verification failed. Please try again.')
          navigate('/')
          return
        }

        if (data.session) {
          // User is authenticated, email verification successful
          toast.success('Email verified successfully! You can now sign in.')
          navigate('/')
        } else {
          // No session found, might be a different type of callback
          toast.error('Verification link is invalid or expired. Please try signing up again.')
          navigate('/')
        }
      } catch (error) {
        console.error('Auth callback exception:', error)
        toast.error('An error occurred during verification. Please try again.')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your email...</p>
        </div>
      </div>
    )
  }

  return null
}

export default AuthCallback 