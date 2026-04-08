import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const connectionString = process.env.POSTGRES_URL
if (!connectionString) {
    console.error('Error: POSTGRES_URL not found')
    process.exit(1)
}

const sql = postgres(connectionString, { ssl: 'require' })

async function repairViaSQL() {
    console.log('--- REPAIRING VIA SQL ---')
    
    // 1. Get an active store ID
    const stores = await sql`SELECT id FROM stores WHERE active = true LIMIT 1`
    if (stores.length === 0) {
        console.error('No active stores!')
        return
    }
    const storeId = stores[0].id
    console.log(`Using Store ID: ${storeId}`)

    // 2. Define users (keeping old emails as they are in Auth)
    const usersToFix = [
        { email: 'admin@mxgestaopreditiva.com.br', role: 'admin', name: 'Admin MX PERFORMANCE' },
        { email: 'dono@mxgestaopreditiva.com.br', role: 'dono', name: 'Dono MX PERFORMANCE' },
        { email: 'gerente@mxgestaopreditiva.com.br', role: 'gerente', name: 'Gerente MX PERFORMANCE' },
        { email: 'vendedor@mxgestaopreditiva.com.br', role: 'vendedor', name: 'Vendedor MX PERFORMANCE' }
    ]

    for (const u of usersToFix) {
        console.log(`Fixing ${u.email}...`)
        
        // Find user in auth.users (if accessible)
        // Since I'm using POSTGRES_URL, I might have access to auth schema
        const authUser = await sql`SELECT id FROM auth.users WHERE email = ${u.email} LIMIT 1`
        
        if (authUser.length > 0) {
            const userId = authUser[0].id
            console.log(`Found Auth ID: ${userId}`)
            
            // Upsert public.users
            await sql`
                INSERT INTO public.users (id, email, name, role, active, updated_at)
                VALUES (${userId}, ${u.email}, ${u.name}, ${u.role}, true, now())
                ON CONFLICT (id) DO UPDATE SET
                    email = EXCLUDED.email,
                    name = EXCLUDED.name,
                    role = EXCLUDED.role,
                    active = true,
                    updated_at = now()
            `
            
            // Ensure membership
            const memberships = await sql`SELECT id FROM public.memberships WHERE user_id = ${userId} AND store_id = ${storeId}`
            if (memberships.length === 0) {
                await sql`
                    INSERT INTO public.memberships (user_id, store_id, role)
                    VALUES (${userId}, ${storeId}, ${u.role === 'admin' ? 'gerente' : u.role})
                `
                console.log('Membership created.')
            }
        } else {
            console.warn(`User ${u.email} not found in auth.users. Please create them via UI first or use admin API.`)
        }
    }

    console.log('\nSQL Repair complete.')
    await sql.end()
}

repairViaSQL().catch(console.error)
