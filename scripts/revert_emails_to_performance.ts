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
    { from: 'admin@mxgestaopreditiva.com.br', to: 'admin@mxperformance.com.br' },
    { from: 'dono@mxgestaopreditiva.com.br', to: 'dono@mxperformance.com.br' },
    { from: 'gerente@mxgestaopreditiva.com.br', to: 'gerente@mxperformance.com.br' },
    { from: 'vendedor@mxgestaopreditiva.com.br', to: 'vendedor@mxperformance.com.br' }
]

async function renameEmails() {
    console.log('--- RESTORING EMAILS TO mxperformance.com.br ---')
    
    for (const m of MAPPING) {
        console.log(`Renaming ${m.from} to ${m.to}...`)
        
        // 1. Update auth.users
        await sql`UPDATE auth.users SET email = ${m.to} WHERE email = ${m.from}`
        
        // 2. Update profiles or users in public schema (we'll try public.users and public.profiles just in case)
        try {
            await sql`UPDATE public.users SET email = ${m.to} WHERE email = ${m.from}`
        } catch (e: any) {
            if (!e.message.includes('does not exist')) console.error(e)
        }
        try {
            await sql`UPDATE public.profiles SET email = ${m.to} WHERE email = ${m.from}`
        } catch (e: any) {
             if (!e.message.includes('does not exist')) console.error(e)
        }
    }

    console.log('\nRename complete.')
    await sql.end()
}

renameEmails().catch(console.error)
