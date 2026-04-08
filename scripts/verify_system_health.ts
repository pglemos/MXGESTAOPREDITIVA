import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

async function verifyHealth() {
    console.log('--- SYSTEM HEALTH AUDIT ---')
    
    // 1. Stores without meta rules
    const storesWithoutRules = await sql`
        SELECT s.name, s.id 
        FROM stores s 
        LEFT JOIN store_meta_rules smr ON s.id = smr.store_id 
        WHERE smr.store_id IS NULL AND s.active = true
    `
    console.log(`\nStores without Meta Rules: ${storesWithoutRules.length}`)
    storesWithoutRules.forEach(s => console.log(` - ${s.name} (${s.id})`))

    // 2. Stores without delivery rules
    const storesWithoutDelivery = await sql`
        SELECT s.name, s.id 
        FROM stores s 
        LEFT JOIN store_delivery_rules sdr ON s.id = sdr.store_id 
        WHERE sdr.store_id IS NULL AND s.active = true
    `
    console.log(`\nStores without Delivery Rules: ${storesWithoutDelivery.length}`)
    storesWithoutDelivery.forEach(s => console.log(` - ${s.name} (${s.id})`))

    // 3. Venda Loja check
    const vendaLojaUsers = await sql`SELECT email, name FROM users WHERE is_venda_loja = true AND active = true`
    console.log(`\nActive Venda Loja Users: ${vendaLojaUsers.length}`)
    vendaLojaUsers.forEach(u => console.log(` - ${u.name} (${u.email})`))

    // 4. Pending check-ins for yesterday
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const missingCheckins = await sql`
        SELECT u.name, s.name as store
        FROM store_sellers ss
        JOIN users u ON ss.seller_user_id = u.id
        JOIN stores s ON ss.store_id = s.id
        LEFT JOIN daily_checkins dc ON dc.seller_user_id = u.id AND dc.reference_date = ${yesterdayStr}
        WHERE ss.is_active = true AND dc.id IS NULL
    `
    console.log(`\nMissing Check-ins for ${yesterdayStr}: ${missingCheckins.length}`)
    
    console.log('\nAudit complete.')
    await sql.end()
}

verifyHealth().catch(console.error)
