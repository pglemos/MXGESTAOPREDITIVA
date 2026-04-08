import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

async function testLogin() {
    const email = 'admin@mxgestaopreditiva.com.br'
    const password = 'Mx#2026!'
    
    console.log(`Testing login for ${email}...`)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
        console.error('Login failed:', error.message)
    } else {
        console.log('Login successful! User ID:', data.user?.id)
    }
}

testLogin().catch(console.error)
