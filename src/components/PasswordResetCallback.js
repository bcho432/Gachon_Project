import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import toast from 'react-hot-toast'

const PasswordResetCallback = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handlePasswordResetCallback = async () => {
      try {
        // Get the session from the URL
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Password reset callback error:', error)
          toast.error('Password reset link is invalid or expired. Please try again.')
          navigate('/auth/reset-password')
          return
        }

        if (data.session) {
          // User is authenticated, password reset link is valid
          // Redirect to the password reset form where they can set their new password
          toast.success('Password reset link is valid! You can now set your new password.')
          navigate('/auth/reset-password', { 
            state: { 
              fromResetLink: true,
              email: data.session.user.email 
            } 
          })
        } else {
          // No session found, redirect to password reset form
          toast.error('Password reset link is invalid or expired. Please try again.')
          navigate('/auth/reset-password')
        }
      } catch (error) {
        console.error('Password reset callback exception:', error)
        toast.error('An error occurred during password reset. Please try again.')
        navigate('/auth/reset-password')
      } finally {
        setLoading(false)
      }
    }

    handlePasswordResetCallback()
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying password reset link...</p>
        </div>
      </div>
    )
  }

  return null
}

export default PasswordResetCallback 