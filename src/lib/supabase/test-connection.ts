import { createClient } from './client'

export async function testDatabaseConnection() {
  const supabase = createClient()

  try {
    // Test 1: Check if we can connect
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🔐 Auth status:', user ? `Logged in as ${user.email}` : 'Not logged in')

    // Test 2: Check if user_profiles table exists
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)

    if (profilesError) {
      console.log('❌ user_profiles table:', profilesError.message)
    } else {
      console.log('✅ user_profiles table: exists')
    }

    // Test 3: Check if clients table exists
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('count')
      .limit(1)

    if (clientsError) {
      console.log('❌ clients table:', clientsError.message)
    } else {
      console.log('✅ clients table: exists')
    }

    // Test 4: Check if deals table exists
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('count')
      .limit(1)

    if (dealsError) {
      console.log('❌ deals table:', dealsError.message)
    } else {
      console.log('✅ deals table: exists')
    }

    // Test 5: Check if activities table exists
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('count')
      .limit(1)

    if (activitiesError) {
      console.log('❌ activities table:', activitiesError.message)
    } else {
      console.log('✅ activities table: exists')
    }

    return {
      connected: true,
      user: user?.email || null,
      tables: {
        user_profiles: !profilesError,
        clients: !clientsError,
        deals: !dealsError,
        activities: !activitiesError
      }
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
