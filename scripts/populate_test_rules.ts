import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

async function populateRules() {
    console.log('--- POPULATING TEST RULES ---')
    
    const stores = await sql`SELECT id, name FROM stores WHERE active = true`
    
    for (const s of stores) {
        console.log(`Setting rules for ${s.name}...`)
        
        // Find owner or manager for this store
        const users = await sql`
            SELECT u.email 
            FROM memberships m 
            JOIN users u ON m.user_id = u.id 
            WHERE m.store_id = ${s.id} 
              AND m.role IN ('dono', 'gerente')
        `
        const recipients = users.map(u => u.email)
        
        if (recipients.length > 0) {
            await sql`
                INSERT INTO store_delivery_rules (store_id, matinal_recipients, weekly_recipients, monthly_recipients, timezone, active)
                VALUES (${s.id}, ${recipients}, ${recipients}, ${recipients}, 'America/Sao_Paulo', true)
                ON CONFLICT (store_id) DO UPDATE SET
                    matinal_recipients = EXCLUDED.matinal_recipients,
                    weekly_recipients = EXCLUDED.weekly_recipients,
                    monthly_recipients = EXCLUDED.monthly_recipients,
                    active = true
            `
            console.log(` - Set ${recipients.length} recipients.`)
        } else {
            console.warn(` - No owner/manager found for ${s.name}.`)
        }
    }

    console.log('\nPopulate complete.')
    await sql.end()
}

populateRules().catch(console.error)
