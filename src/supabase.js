import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:')
  console.error('REACT_APP_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('REACT_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
  
  // In development, show a helpful error
  if (process.env.NODE_ENV === 'development') {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env file.'
    )
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    // Add email confirmation settings
    flowType: 'pkce',
    // Set the redirect URL for email confirmation
    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
  },
  global: {
    headers: {
      'X-Client-Info': 'cv-manager'
    }
  }
})

// CV table structure
export const cvTable = {
  name: 'cvs',
  fields: {
    id: 'uuid',
    user_id: 'uuid',
    full_name: 'text',
    phone: 'text',
    email: 'text',
    address: 'text',
    education: 'json',
    academic_employment: 'json',
    teaching: 'json',
    courses: 'json',
    publications_research: 'json',
    publications_books: 'json',
    conference_presentations: 'json',
    professional_service: 'json',
    internal_activities: 'json',
    updated_at: 'timestamp'
  }
} 