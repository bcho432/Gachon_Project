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
        // Check if it's a user already exists error
        if (error.message.includes('User already registered')) {
          return { 
            data: null, 
            error: { 
              message: 'An account with this email already exists. Please try signing in instead.' 
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
      return { data: null, error }
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { data, error }
    } catch (error) {
      console.error('Sign in error:', error)
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