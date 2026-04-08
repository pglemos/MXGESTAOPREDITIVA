import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!)

const USERS = [
    { email: 'admin@mxgestaopreditiva.com.br', role: 'admin', name: 'Admin MX' },
    { email: 'dono@mxgestaopreditiva.com.br', role: 'dono', name: 'Dono MX' },
    { email: 'gerente@mxgestaopreditiva.com.br', role: 'gerente', name: 'Gerente MX' },
    { email: 'vendedor@mxgestaopreditiva.com.br', role: 'vendedor', name: 'Vendedor MX' }
]
const PASSWORD = 'Mx#2026!'

async function repairSystem() {
    console.log('--- REPAIRING AUTH AND USERS ---')
    
    // 1. Get an active store
    const { data: stores } = await supabase.from('stores').select('id, name').eq('active', true).limit(1)
    if (!stores || stores.length === 0) {
        console.error('No active stores found! Creating one...')
        const { data: newStore } = await supabase.from('stores').insert({ name: 'Loja Matriz MX', active: true }).select().single()
        stores?.push(newStore as any)
    }
    const storeId = stores![0].id
    console.log(`Using Store: ${stores![0].name} (${storeId})`)

    for (const uInfo of USERS) {
        console.log(`\nProcessing ${uInfo.email}...`)
        
        // A. Ensure Auth User
        const { data: authUsers } = await supabase.auth.admin.listUsers()
        let authUser = authUsers?.users.find(u => u.email === uInfo.email)
        
        if (!authUser) {
            console.log(`Creating auth user ${uInfo.email}...`)
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: uInfo.email,
                password: PASSWORD,
                email_confirm: true
            })
            if (createError) {
                console.error(`Error creating ${uInfo.email}:`, createError.message)
                continue
            }
            authUser = newUser.user
        } else {
            console.log(`Updating auth user ${uInfo.email}...`)
            await supabase.auth.admin.updateUserById(authUser.id, { password: PASSWORD })
        }

        if (!authUser) continue

        // B. Ensure public.users record
        console.log(`Upserting public.users for ${authUser.id}...`)
        const { error: userError } = await supabase.from('users').upsert({
            id: authUser.id,
            email: uInfo.email,
            name: uInfo.name,
            role: uInfo.role,
            active: true
        })
        if (userError) console.error(`Error upserting user ${uInfo.email}:`, userError.message)

        // C. Ensure Membership
        console.log(`Ensuring membership for ${authUser.id} in store ${storeId}...`)
        const { data: memberships } = await supabase.from('memberships').select('*').eq('user_id', authUser.id).eq('store_id', storeId)
        if (!memberships || memberships.length === 0) {
            const { error: memError } = await supabase.from('memberships').insert({
                user_id: authUser.id,
                store_id: storeId,
                role: uInfo.role === 'admin' ? 'gerente' : uInfo.role // Admin can be gerente in a store
            })
            if (memError) console.error(`Error creating membership for ${uInfo.email}:`, memError.message)
        }
    }

    console.log('\nRepair complete.')
}

repairSystem().catch(console.error)
