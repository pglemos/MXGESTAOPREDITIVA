import fs from 'fs'

const content = fs.readFileSync('import_data.csv', 'utf8')
const lines = content.split(/\r?\n/)
const startIdx = lines.findIndex(l => l.includes('Carimbo de data/hora'))
const dataLines = lines.slice(startIdx + 1).filter(l => l.trim().length > 0)

const stats = {
  section1: { leads: 0, sales: 0 },
  section2: { leads: 0, sales: 0 }
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

  // Section 1: Indices 8-13
  const l1 = parseInt(values[8]) || 0
  const s1 = (parseInt(values[9]) || 0) + (parseInt(values[11]) || 0) + (parseInt(values[13]) || 0)
  stats.section1.leads += l1
  stats.section1.sales += s1

  // Section 2: Indices 23-28
  const l2 = parseInt(values[23]) || 0
  const s2 = (parseInt(values[24]) || 0) + (parseInt(values[26]) || 0) + (parseInt(values[28]) || 0)
  stats.section2.leads += l2
  stats.section2.sales += s2
  
  if (l2 > 0 || s2 > 0) {
      // console.log(`Data in Section 2: Row=${line.substring(0, 50)}... Leads=${l2}, Sales=${s2}`)
  }
}

console.log('--- GLOBAL CSV ANALYTICS ---')
console.log('Section 1 (Legacy/Primary):', stats.section1)
console.log('Section 2 (New/Alternative):', stats.section2)
