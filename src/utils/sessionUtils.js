import { supabase } from '../supabase'

// Utility to check session status
export const checkSessionStatus = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.log('Session check:', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      error: error?.message
    })
    
    return { session, error }
  } catch (error) {
    console.error('Session check error:', error)
    return { session: null, error }
  }
}

// Utility to clear session manually
export const clearSession = () => {
  try {
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('sb-opqaevuxooubkgrlwwjh-auth-token')
    }
    
    console.log('Session cleared from localStorage')
  } catch (error) {
    console.error('Error clearing session:', error)
  }
}

// Utility to force sign out
export const forceSignOut = async () => {
  try {
    console.log('Force sign out initiated')
    
    // Clear session from storage
    clearSession()
    
    // Try to sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Force sign out error:', error)
    } else {
      console.log('Force sign out successful')
    }
    
    return { error }
  } catch (error) {
    console.error('Force sign out exception:', error)
    return { error }
  }
} 