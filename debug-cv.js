const { createClient } = require('@supabase/supabase-js')

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugCV() {
  console.log('🔍 Debugging CV for chobryan57@gmail.com...')
  
  try {
    // 1. Check if user exists
    console.log('\n1. Checking if user exists...')
    const { data: user, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      console.error('❌ Error fetching users:', userError)
      return
    }
    
    const targetUser = user.users.find(u => u.email === 'chobryan57@gmail.com')
    
    if (!targetUser) {
      console.log('❌ User chobryan57@gmail.com not found in auth.users')
      return
    }
    
    console.log('✅ User found:', targetUser.id)
    
    // 2. Check if CV exists
    console.log('\n2. Checking if CV exists...')
    const { data: cv, error: cvError } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', targetUser.id)
      .single()
    
    if (cvError) {
      if (cvError.code === 'PGRST116') {
        console.log('❌ No CV found for this user')
      } else {
        console.error('❌ Error fetching CV:', cvError)
      }
      return
    }
    
    console.log('✅ CV found:', cv)
    
    // 3. Check CV history
    console.log('\n3. Checking CV history...')
    const { data: history, error: historyError } = await supabase
      .from('cv_history')
      .select('*')
      .eq('user_id', targetUser.id)
      .order('version_number', { ascending: false })
    
    if (historyError) {
      console.error('❌ Error fetching CV history:', historyError)
    } else {
      console.log(`✅ Found ${history.length} history versions`)
      history.forEach((h, i) => {
        console.log(`   Version ${h.version_number}: ${h.full_name || 'Unnamed'} (${new Date(h.created_at).toLocaleString()})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

debugCV() 