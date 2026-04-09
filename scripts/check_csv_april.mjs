import fs from 'fs'

const content = fs.readFileSync('import_data.csv', 'utf8')
const lines = content.split(/\r?\n/)
const startIdx = lines.findIndex(l => l.includes('Carimbo de data/hora'))
const dataLines = lines.slice(startIdx + 1).filter(l => l.trim().length > 0)

const storeStats = {}

function parseDate(dateStr) {
  if (!dateStr) return null
  const parts = dateStr.split(' ')[0].split('/')
  if (parts.length === 3) {
    let [d, m, y] = parts
    if (y.startsWith('002')) y = '202' + y.slice(3)
    if (y.length === 2) y = '20' + y
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return null
}

for (const line of dataLines) {
  const values = []
  let curVal = ''
  let inQuotes = false
  for (let char of line) {
    if (char === '"') inQuotes = !inQuotes
    else if (char === ',' && !inQuotes) {
      values.push(curVal.trim())
      curVal = ''
    } else {
      curVal += char
    }
  }
  values.push(curVal.trim())

  const storeName = values[1].toUpperCase().trim()
  const refDateRaw = values[7]
  const refDate = parseDate(refDateRaw)
  
  if (!refDate || !refDate.startsWith('2026-04')) continue

  if (!storeStats[storeName]) {
    storeStats[storeName] = { leads: 0, sales: 0, agd: 0, vis: 0, records: 0 }
  }

  const leads = parseInt(values[8]) || 0
  const sales = (parseInt(values[9]) || 0) + (parseInt(values[11]) || 0) + (parseInt(values[13]) || 0)
  const agd = (parseInt(values[10]) || 0) + (parseInt(values[12]) || 0)
  const vis = (parseInt(values[14]) || 0)

  storeStats[storeName].leads += leads
  storeStats[storeName].sales += sales
  storeStats[storeName].agd += agd
  storeStats[storeName].vis += vis
  storeStats[storeName].records++
}

console.log('--- CSV STATS FOR APRIL 2026 ---')
console.log(JSON.stringify(storeStats, null, 2))
