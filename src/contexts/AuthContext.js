import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
      }
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
          data: {
            // You can add additional user metadata here if needed
          }
        }
      })
      
      // Handle specific error cases
      if (error) {
        // Log the full error for debugging
        console.error('Sign up error details:', {
          message: error.message,
          status: error.status,
          code: error.code,
          statusCode: error.statusCode,
          fullError: error
        })
        
        // Handle 500 errors (Supabase internal server error)
        if (error.status === 500 ||
            error.statusCode === 500 ||
            error.code === 500 ||
            (error.message && error.message.toLowerCase().includes('internal server error'))) {
          console.error('Supabase 500 error details:', error)
          return { 
            data: null, 
            error: { 
              message: 'Authentication service is experiencing issues (500 error). This could be due to: 1) Database connection problems, 2) Supabase service issues, or 3) Configuration problems. Please check your Supabase dashboard for service status, or try again in a few minutes. If the problem persists, contact support.' 
            } 
          }
        }
        
        // Check for network errors first (likely Supabase paused)
        if (error.message?.includes('Failed to fetch') ||
            error.message?.includes('NetworkError') ||
            error.message?.includes('ERR_NAME_NOT_RESOLVED') ||
            error.message?.includes('ERR_INTERNET_DISCONNECTED') ||
            error.name === 'TypeError' ||
            (error.message && error.message.toLowerCase().includes('network'))) {
          return { 
            data: null, 
            error: { 
              message: 'Unable to connect to the authentication service. This usually means your Supabase project is paused. Please check your Supabase dashboard and resume the project if it\'s paused.' 
            } 
          }
        }
        
        // Check if it's a rate limit error (429) - check multiple possible formats
        const isRateLimit = 
          error.status === 429 || 
          error.statusCode === 429 ||
          error.code === 429 ||
          error.code === 'over_email_send_rate_limit' ||
          (error.message && (
            error.message.toLowerCase().includes('rate limit') || 
            error.message.toLowerCase().includes('too many requests') || 
            error.message.toLowerCase().includes('rate limit exceeded') ||
            error.message.toLowerCase().includes('429')
          ))
        
        if (isRateLimit) {
          return { 
            data: null, 
            error: { 
              message: 'Email rate limit exceeded. This can happen if too many signup attempts were made recently. Please wait 30-60 minutes and try again, or contact support at gachonhelper018@gmail.com if you need immediate access.' 
            } 
          }
        }
        
        // Check if it's a user already exists error
        if (error.message.includes('User already registered') || 
            error.message.includes('already been registered') ||
            error.message.includes('already exists') ||
            error.message.includes('already registered') ||
            error.message.includes('user already exists') ||
            error.message.includes('email already exists') ||
            error.message.includes('already in use') ||
            error.message.includes('duplicate key') ||
            error.status === 422 ||
            error.status === 400) {
          return { 
            data: null, 
            error: { 
              message: 'An account with this email address already exists. Please try signing in instead.' 
            } 
          }
        }
        
        // Check if it's an email confirmation error
        if (error.message.includes('Email not confirmed') || error.message.includes('Invalid login credentials')) {
          return { 
            data: null, 
            error: { 
              message: 'Account created but email verification failed. Please check your email and try again, or contact support if the issue persists.' 
            } 
          }
        }
        
        return { data, error }
      }
      
      // Success case - account created and email sent
      return { data, error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      
      // Catch network errors in the catch block too
      if (error.message?.includes('Failed to fetch') ||
          error.message?.includes('NetworkError') ||
          error.name === 'TypeError') {
        return { 
          data: null, 
          error: { 
            message: 'Unable to connect to the authentication service. This usually means your Supabase project is paused. Please check your Supabase dashboard and resume the project if it\'s paused.' 
          } 
        }
      }
      
      return { data: null, error }
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      // Handle 500 errors (Supabase internal server error)
      if (error && (
        error.status === 500 ||
        error.statusCode === 500 ||
        error.code === 500 ||
        (error.message && error.message.toLowerCase().includes('internal server error'))
      )) {
        console.error('Supabase 500 error details:', error)
        return { 
          data: null, 
          error: { 
            message: 'Authentication service is experiencing issues (500 error). This could be due to: 1) Database connection problems, 2) Supabase service issues, or 3) Configuration problems. Please check your Supabase dashboard for service status, or try again in a few minutes. If the problem persists, contact support.' 
          } 
        }
      }
      
      // Handle network errors (likely Supabase paused)
      if (error && (
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError') ||
        error.message?.includes('ERR_NAME_NOT_RESOLVED') ||
        error.message?.includes('ERR_INTERNET_DISCONNECTED') ||
        error.name === 'TypeError' ||
        (error.message && error.message.toLowerCase().includes('network'))
      )) {
        return { 
          data: null, 
          error: { 
            message: 'Unable to connect to the authentication service. This usually means your Supabase project is paused. Please check your Supabase dashboard and resume the project if it\'s paused.' 
          } 
        }
      }
      
      return { data, error }
    } catch (error) {
      console.error('Sign in error:', error)
      
      // Catch network errors in the catch block too
      if (error.message?.includes('Failed to fetch') ||
          error.message?.includes('NetworkError') ||
          error.name === 'TypeError') {
        return { 
          data: null, 
          error: { 
            message: 'Unable to connect to the authentication service. This usually means your Supabase project is paused. Please check your Supabase dashboard and resume the project if it\'s paused.' 
          } 
        }
      }
      
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      console.log('Attempting to sign out...')
      
      // First, get the current session to ensure it exists
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Error getting session before sign out:', sessionError)
      }
      
      if (!session) {
        console.log('No active session found, clearing user state')
        setUser(null)
        return { error: null }
      }
      
      console.log('Active session found, proceeding with sign out')
      
      // Perform the sign out
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        // Even if sign out fails, clear the user state
        setUser(null)
      } else {
        console.log('Sign out successful')
        setUser(null)
      }
      
      return { error }
    } catch (error) {
      console.error('Sign out exception:', error)
      // Clear user state even if there's an exception
      setUser(null)
      return { error }
    }
  }

  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/reset-password/callback` : undefined
      })
      
      if (error) {
        // Handle specific error cases
        if (error.message.includes('User not found')) {
          return { 
            data: null, 
            error: { 
              message: 'No account found with this email address. Please check your email or sign up for a new account.' 
            } 
          }
        }
        
        return { data, error }
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('Password reset error:', error)
      return { data: null, error }
    }
  }

  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) {
        return { data, error }
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('Update password error:', error)
      return { data: null, error }
    }
  }

  const value = {
    user,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 