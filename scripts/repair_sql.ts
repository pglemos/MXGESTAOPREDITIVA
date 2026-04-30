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
    const lojas = await sql`SELECT id FROM lojas WHERE active = true LIMIT 1`
    if (lojas.length === 0) {
        console.error('No active lojas!')
        return
    }
    const storeId = lojas[0].id
    console.log(`Using Store ID: ${storeId}`)

    // 2. Define users (keeping old emails as they are in Auth)
    const usersToFix = [
        { email: 'admin@mxgestaopreditiva.com.br', role: 'administrador_mx', name: 'Admin MX PERFORMANCE' },
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

            // Upsert public.usuarios
            await sql`
                INSERT INTO public.usuarios (id, email, name, role, active, updated_at)
                VALUES (${userId}, ${u.email}, ${u.name}, ${u.role}, true, now())
                ON CONFLICT (id) DO UPDATE SET
                    email = EXCLUDED.email,
                    name = EXCLUDED.name,
                    role = EXCLUDED.role,
                    active = true,
                    updated_at = now()
            `

            // Ensure membership
            const vinculos_loja = await sql`SELECT id FROM public.vinculos_loja WHERE user_id = ${userId} AND store_id = ${storeId}`
            if (vinculos_loja.length === 0) {
                await sql`
                    INSERT INTO public.vinculos_loja (user_id, store_id, role)
                    VALUES (${userId}, ${storeId}, ${u.role === 'administrador_mx' ? 'gerente' : u.role})
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
