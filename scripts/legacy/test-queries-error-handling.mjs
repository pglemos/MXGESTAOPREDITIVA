import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fbhcmzzgwjdgkctlfvbo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaGNtenpnd2pkZ2tjdGxmdmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTQyNTIsImV4cCI6MjA4NzUzMDI1Mn0.-k8W4LXVKId5EBe1t0PqfJYfOYjl-5IEp0-JdpxN6Po'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email: 'admin@mxperformance.com.br',
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
    const res1 = await supabase.from('usuarios').select('*').eq('id', userId).single()
    console.log('Profile exists?', !!res1.data, res1.error ? res1.error.message : '')
  } catch (e) {
    console.error('Profile Error:', e)
  }

  console.log('Fetching membership...')
  try {
    const res2 = await supabase
            .from('vinculos_loja')
            .select('*, store:lojas(*)')
            .eq('user_id', userId)
            .limit(1)
            .single()
    console.log('Membership exists?', !!res2.data, res2.error ? res2.error.message : '')
  } catch (e) {
    console.error('Membership Error:', e)
  }
}

test()
