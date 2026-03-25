import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
})

async function fixAdminAccess(email: string) {
    console.log(`Checking admin access for ${email}...`)

    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw new Error(`Auth listUsers failed: ${listError.message}`)

    const authUser = (usersData.users as any[]).find(u => (u.email || '').toLowerCase() === email.toLowerCase())
    if (!authUser) throw new Error(`Auth user not found for ${email}`)

    const userId = authUser.id
    console.log(`Auth user found: ${userId}`)

    const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('id, name')
        .eq('id', userId)
        .maybeSingle()
    if (existingUserError) throw new Error(`users read failed: ${existingUserError.message}`)

    const metadataName = (authUser.user_metadata as any)?.name
    const fallbackName = existingUser?.name || metadataName || 'Administrador'

    const { error: usersUpsertError } = await supabase.from('users').upsert({
        id: userId,
        name: fallbackName,
        email,
        role: 'consultor',
        active: true
    }, { onConflict: 'id' })
    if (usersUpsertError) throw new Error(`users upsert failed: ${usersUpsertError.message}`)

    const { data: existingMemberships, error: membershipReadError } = await supabase
        .from('memberships')
        .select('id, user_id, store_id, role')
        .eq('user_id', userId)
    if (membershipReadError) throw new Error(`memberships query failed: ${membershipReadError.message}`)

    if ((existingMemberships || []).length > 0) {
        console.log(`Membership already exists (${existingMemberships!.length}). No insert needed.`)
        return
    }

    const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('active', true)
        .order('name')
        .limit(1)
    if (storesError) throw new Error(`stores query failed: ${storesError.message}`)

    const defaultStore = stores?.[0]
    if (!defaultStore) throw new Error('No active store found to assign membership')

    const { error: insertMembershipError } = await supabase
        .from('memberships')
        .insert({
            user_id: userId,
            store_id: defaultStore.id,
            role: 'gerente'
        })
    if (insertMembershipError) throw new Error(`membership insert failed: ${insertMembershipError.message}`)

    console.log(`Membership created in store "${defaultStore.name}" (${defaultStore.id}) as gerente.`)
}

fixAdminAccess('admin@autogestao.com.br')
    .then(() => {
        console.log('Admin access fix completed successfully.')
        process.exit(0)
    })
    .catch((error) => {
        console.error('Admin access fix failed:', error.message)
        process.exit(1)
    })
