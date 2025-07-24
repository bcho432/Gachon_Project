import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
    publications_research: 'json',
    publications_books: 'json',
    conference_presentations: 'json',
    professional_service: 'json',
    updated_at: 'timestamp'
  }
} 