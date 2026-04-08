import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

const LOGINS = [
    'admin@mxperformance.com.br',
    'dono@mxperformance.com.br',
    'gerente@mxperformance.com.br',
    'vendedor@mxperformance.com.br'
]
const PASSWORD = 'Mx#2026!'

async function verifyLogins() {
    console.log('--- Verifying Logins ---')
    for (const email of LOGINS) {
        console.log(`Testing ${email}...`)
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: PASSWORD })
        if (error) {
            console.error(` ❌ Failed: ${error.message}`)
        } else {
            console.log(` ✅ Success! User: ${data.user?.id}`)
            await supabase.auth.signOut()
        }
    }
}

verifyLogins().catch(console.error)
