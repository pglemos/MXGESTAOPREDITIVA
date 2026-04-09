import fs from 'fs'

const content = fs.readFileSync('import_data.csv', 'utf8')
const rows = content.split('\n').slice(1) // Skip header

const sellerStats = {}
const storeStats = {}

for (const row of rows) {
  const parts = row.split(',')
  if (parts.length < 5) continue
  
  const store = parts[1].trim().toUpperCase()
  // The seller name can be in different columns depending on the store
  const seller = (parts[2] || parts[3] || parts[4] || parts[5] || parts[6] || parts[15] || parts[16]).trim().toUpperCase()
  
  if (!seller) continue
  
  const key = `${store} | ${seller}`
  sellerStats[key] = (sellerStats[key] || 0) + 1
  storeStats[store] = (storeStats[store] || 0) + 1
}

console.log('--- SELLER STATS IN CSV ---')
Object.entries(sellerStats).sort((a,b) => b[1] - a[1]).slice(0, 50).forEach(([k, v]) => console.log(`${k}: ${v} records`))

console.log('\n--- STORE STATS IN CSV ---')
Object.entries(storeStats).sort((a,b) => b[1] - a[1]).forEach(([k, v]) => console.log(`${k}: ${v} records`))
