import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fbhcmzzgwjdgkctlfvbo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaGNtenpnd2pkZ2tjdGxmdmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTQyNTIsImV4cCI6MjA4NzUzMDI1Mn0.-k8W4LXVKId5EBe1t0PqfJYfOYjl-5IEp0-JdpxN6Po'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email: 'admin@mxgestaopreditiva.com.br',
    password: 'Jose20161@',
  })
  if (error) {
    console.log('Login Error:', error.message)
    return
  }
  const userId = session.user.id
  console.log('User ID:', userId)

  console.log('Fetching profile...')
  try {
    const res1 = await supabase.from('users').select('*').eq('id', userId).single()
    console.log('Profile:', res1)
  } catch (e) {
    console.error('Profile Error:', e)
  }

  console.log('Fetching membership...')
  try {
    const res2 = await supabase
            .from('memberships')
            .select('*, store:stores(*)')
            .eq('user_id', userId)
            .limit(1)
            .single()
    console.log('Membership:', res2)
  } catch (e) {
    console.error('Membership Error:', e)
  }
}

test()
