import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import * as fs from 'fs'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const connectionString = process.env.POSTGRES_URL
if (!connectionString) {
    console.error('Error: POSTGRES_URL not found')
    process.exit(1)
}

const sql = postgres(connectionString, { ssl: 'require' })

async function runFix() {
    const filePath = resolve(process.cwd(), 'supabase/migrations/20260407170000_fix_auth_rls.sql')
    console.log(`Applying fix migration: ${filePath}...`)

    try {
        const content = fs.readFileSync(filePath, 'utf8')
        await sql.unsafe(content)
        console.log('Successfully applied fix migration.')
    } catch (error: any) {
        console.error('Error applying fix:', error.message)
    } finally {
        await sql.end()
    }
}

runFix().catch(console.error)
