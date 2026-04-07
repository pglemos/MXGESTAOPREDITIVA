import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env file
dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Error: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function createAdmin() {
    const email = 'admin@mxperformance.com.br'
    const password = 'Jose20161@'
    const name = 'Admin MX PERFORMANCE'

    console.log(`Creating user ${email}...`)

    // 1. Create user in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    })

    if (authError) {
        if (authError.message.includes('already registered')) {
            console.log('User already exists in Auth. Checking team table...')
            // If user exists, we need to find their ID
            const { data: userData } = await supabase.auth.admin.listUsers()
            const existingUser = userData?.users.find((u: any) => u.email === email)
            if (existingUser) {
                await ensureTeamRecord(existingUser.id, name)
            }
        } else {
            console.error('Error creating auth user:', authError.message)
        }
        return
    }

    if (authData.user) {
        console.log('Auth user created successfully with ID:', authData.user.id)
        await ensureTeamRecord(authData.user.id, name)
    }
}

async function ensureTeamRecord(userId: string, name: string) {
    console.log(`Ensuring user record for ${userId}...`)

    // 2. Add to public.users table
    const { data: userData, error: userError } = await supabase
        .from('users')
        .upsert({
            id: userId,
            name: name,
            email: 'admin@mxperformance.com.br',
            role: 'admin'
        })
        .select()

    if (userError) {
        console.error('Error creating user record:', userError.message)
    } else {
        console.log('User record created/updated successfully:', userData)
    }

    // 3. Ensure a membership exists so manager/store-scoped pages can load
    const { data: existingMemberships, error: membershipReadError } = await supabase
        .from('memberships')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
    if (membershipReadError) {
        console.error('Error reading memberships:', membershipReadError.message)
        return
    }

    if (existingMemberships && existingMemberships.length > 0) {
        console.log('Membership already exists.')
        return
    }

    const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('active', true)
        .order('name')
        .limit(1)
    if (storesError) {
        console.error('Error reading stores:', storesError.message)
        return
    }
    if (!stores || stores.length === 0) {
        console.warn('No active store found. Skipping membership creation.')
        return
    }

    const { error: membershipInsertError } = await supabase
        .from('memberships')
        .insert({ user_id: userId, store_id: stores[0].id, role: 'gerente' })
    if (membershipInsertError) {
        console.error('Error creating membership:', membershipInsertError.message)
    } else {
        console.log(`Membership created in store ${stores[0].name} as gerente.`)
    }
}

createAdmin().catch(console.error)
