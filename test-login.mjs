import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fbhcmzzgwjdgkctlfvbo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaGNtenpnd2pkZ2tjdGxmdmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTQyNTIsImV4cCI6MjA4NzUzMDI1Mn0.-k8W4LXVKId5EBe1t0PqfJYfOYjl-5IEp0-JdpxN6Po'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@mxperformance.com.br',
    password: 'Jose20161@',
  })
  if (error) {
    console.log('Login Error:', error.message)
  } else {
    console.log('Login Success!', data.user.id)
  }
}

test()
