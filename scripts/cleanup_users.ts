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

const EMAILS_TO_KEEP = [
    'admin@mxperformance.com.br',
    'dono@mxperformance.com.br',
    'gerente@mxperformance.com.br',
    'vendedor@mxperformance.com.br',
    'admin@autogestao.com.br'
]

async function cleanupUsers() {
    console.log('--- CLEANING UP REDUNDANT USERS ---')
    
    // We only want to keep the official MX Performance emails
    // But we need to be careful not to break dependencies if they exist
    
    const users = await sql`SELECT id, email FROM public.users`
    
    for (const u of users) {
        if (!EMAILS_TO_KEEP.includes(u.email)) {
            console.log(`Deactivating redundant user: ${u.email}...`)
            await sql`UPDATE public.users SET active = false WHERE id = ${u.id}`
        } else {
            console.log(`Keeping active: ${u.email}`)
            await sql`UPDATE public.users SET active = true WHERE id = ${u.id}`
        }
    }

    console.log('\nCleanup complete.')
    await sql.end()
}

cleanupUsers().catch(console.error)
