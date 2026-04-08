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

const MAPPING = [
    { from: 'admin@mxperformance.com.br', to: 'admin@mxgestaopreditiva.com.br' },
    { from: 'dono@mxperformance.com.br', to: 'dono@mxgestaopreditiva.com.br' },
    { from: 'gerente@mxperformance.com.br', to: 'gerente@mxgestaopreditiva.com.br' },
    { from: 'vendedor@mxperformance.com.br', to: 'vendedor@mxgestaopreditiva.com.br' }
]

async function renameEmails() {
    console.log('--- RESTORING EMAILS TO USER SPECIFIED DOMAIN ---')
    
    for (const m of MAPPING) {
        console.log(`Renaming ${m.from} to ${m.to}...`)
        
        // 1. Update auth.users
        await sql`UPDATE auth.users SET email = ${m.to} WHERE email = ${m.from}`
        
        // 2. Update public.users
        await sql`UPDATE public.users SET email = ${m.to} WHERE email = ${m.from}`
    }

    console.log('\nRename complete.')
    await sql.end()
}

renameEmails().catch(console.error)
