import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fbhcmzzgwjdgkctlfvbo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaGNtenpnd2pkZ2tjdGxmdmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTQyNTIsImV4cCI6MjA4NzUzMDI1Mn0.-k8W4LXVKId5EBe1t0PqfJYfOYjl-5IEp0-JdpxN6Po'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email: 'admin@autogestao.com.br',
    password: 'Jose20161@',
  })
  if (error) {
    console.log('Login Error FINAL:', error.message)
    return
  }
  const userId = session.user.id

    const res1 = await supabase.from('users').select('*').eq('id', userId).single()
    const res2 = await supabase
            .from('memberships')
            .select('*, store:stores(*)')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle()
            
    console.log('Test COMPLETE -> Profile:', !!res1.data, 'Membership:', !!res2.data)
}

test()
