// Find user UUID by email
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SERVICE_ROLE_KEY' // Need service role key for admin access

const supabase = createClient(supabaseUrl, supabaseKey)

async function findUserUUID(email) {
  try {
    // Method 1: Using admin API (requires service role key)
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('Error:', error)
      return
    }
    
    const user = users.find(u => u.email === email)
    
    if (user) {
      console.log('✅ User found:')
      console.log('UUID:', user.id)
      console.log('Email:', user.email)
      console.log('Created:', user.created_at)
    } else {
      console.log('❌ User not found')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the function
findUserUUID('ryk233@gmail.com') 