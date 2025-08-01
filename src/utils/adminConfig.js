import { supabase } from '../supabase'

// Admin Configuration
// Fallback admin user IDs (for initial setup)
export const FALLBACK_ADMIN_USER_IDS = [
  'f9f4b401-748d-4a7e-9ba6-127277616ee9', // chobryan04@gmail.com
  'c27fb9a2-36a5-4e7c-b27f-59be30773e58', // Add your current user ID here
  // 'another-user-uuid-here', // Add more admins here
  // 'dad-user-uuid-here',     // Your dad's ID when ready
]

// Helper function to check if user is admin (database-backed)
export const checkIsAdmin = async (userId) => {
  try {
    // First check the database
    const { data: adminData, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    if (error) {
      // If table doesn't exist or other error, fallback to static array
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return FALLBACK_ADMIN_USER_IDS.includes(userId)
      }
      console.error('Error checking admin status:', error)
      return FALLBACK_ADMIN_USER_IDS.includes(userId)
    }

    return !!adminData
  } catch (error) {
    console.error('Error checking admin status:', error)
    return FALLBACK_ADMIN_USER_IDS.includes(userId)
  }
}

// Function to get all admin users from database
export const getAllAdmins = async () => {
  try {
    const { data: admins, error } = await supabase
      .from('admin_users')
      .select('user_id, email, admin_level, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admins:', error)
      // Return fallback admins if table doesn't exist
      if (error.code === '42P01') {
        return FALLBACK_ADMIN_USER_IDS.map(id => ({
          user_id: id,
          email: 'Unknown',
          admin_level: 'admin',
          created_at: new Date().toISOString()
        }))
      }
      return []
    }

    return admins || []
  } catch (error) {
    console.error('Error fetching admins:', error)
    return []
  }
}

// Function to add new admin (database-backed)
export const addAdmin = async (userId) => {
  try {
    // First get the user's email
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('email')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user email:', userError)
      throw new Error('User not found')
    }

    // Insert into admin_users table
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        user_id: userId,
        email: userData.email,
        admin_level: 'admin'
      })
      .select()

    if (error) {
      console.error('Error adding admin:', error)
      throw error
    }

    return data[0]
  } catch (error) {
    console.error('Error adding admin:', error)
    throw error
  }
}

// Function to remove admin (database-backed)
export const removeAdmin = async (userId) => {
  try {
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing admin:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Error removing admin:', error)
    throw error
  }
} 