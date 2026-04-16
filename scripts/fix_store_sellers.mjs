import { execSync } from 'child_process'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const DRY_RUN = process.argv.includes('--dry-run')

if (!supabaseUrl || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

if (DRY_RUN) console.log('🔍 DRY-RUN: nenhuma alteracao sera feita\n')

const correctMapping = [
  { name: "ADRIANA T", store: "RK2 MOTORS" },
  { name: "ALEX", store: "ESPINDOLA AUTOMOVEIS" },
  { name: "AMANDA SANTIAGO", store: "RK2 MOTORS" },
  { name: "ANDREIA", store: "RK2 MOTORS" },
  { name: "ANTÔNIO PEREIRA", store: "DNA VEICULOS" },
  { name: "BRENDA SENA", store: "SEMINOVOS BHZ" },
  { name: "BRENO AUGUSTO", store: "PISCAR VEICULOS" },
  { name: "BRUNO ALVES", store: "RK2 MOTORS" },
  { name: "BRUNO HENRIQUE", store: "DNA VEICULOS" },
  { name: "BRUNO", store: "LIAL VEICULOS" },
  { name: "CAROLINNE RODRIGUES", store: "SEMINOVOS BHZ" },
  { name: "CHARLES", store: "ACERTTCAR" },
  { name: "CLEITON", store: "ACERTTCAR" },
  { name: "CRISTIAN", store: "RK2 MOTORS" },
  { name: "CRISTINA DO CARMO", store: "DNA VEICULOS" },
  { name: "DANIEL ALAN", store: "SEMINOVOS BHZ" },
  { name: "DANILO CARMO", store: "SEMINOVOS BHZ" },
  { name: "DAVID", store: "ESPINDOLA AUTOMOVEIS" },
  { name: "DIELE", store: "LIAL VEICULOS" },
  { name: "DOUGLAS DO SANTOS", store: "DNA VEICULOS" },
  { name: "EMERSON", store: "RK2 MOTORS" },
  { name: "EVERTON LUIZ", store: "GANDINI AUTOMOVEIS" },
  { name: "FERNANDO", store: "RK2 MOTORS" },
  { name: "FLAVIO", store: "RK2 MOTORS" },
  { name: "FREDERICO", store: "PAAY MOTORS" },
  { name: "GABRIEL FELIX RODRIGUES SOUZA", store: "PISCAR VEICULOS" },
  { name: "GEISON", store: "RK2 MOTORS" },
  { name: "GUILHERME CRISTIAN DA SILVA", store: "PISCAR VEICULOS" },
  { name: "GUILHERME DUARTE CARDOSO SAMPAIO", store: "PISCAR VEICULOS" },
  { name: "GUILHERME", store: "RK2 MOTORS" },
  { name: "GUSTAVO ALVARENGA", store: "DNA VEICULOS" },
  { name: "HUDSON", store: "PAAY MOTORS" },
  { name: "IGOR B", store: "RK2 MOTORS" },
  { name: "IGOR DANIEL POLICARPO", store: "PISCAR VEICULOS" },
  { name: "INGRIDY VITORIA", store: "SEMINOVOS BHZ" },
  { name: "JAMES", store: "PAAY MOTORS" },
  { name: "JOAO PEDRO", store: "BROTHERS CAR" },
  { name: "JOAO RICARDO VENTURA DE ANDRADE", store: "PISCAR VEICULOS" },
  { name: "JOAO VICTOR DE SOUZA", store: "PISCAR VEICULOS" },
  { name: "JOAO VICTOR", store: "BROTHERS CAR" },
  { name: "JOAO", store: "LIAL VEICULOS" },
  { name: "JOÃO PINHEIRO", store: "DNA VEICULOS" },
  { name: "JUAN", store: "RK2 MOTORS" },
  { name: "JULIANA TALITA SILVA MORATO", store: "PISCAR VEICULOS" },
  { name: "KEISY", store: "SEMINOVOS BHZ" },
  { name: "KELTON", store: "DNA VEICULOS" },
  { name: "LEANDRO DO SANTOS", store: "SEMINOVOS BHZ" },
  { name: "LEANDRO", store: "ESPINDOLA AUTOMOVEIS" },
  { name: "LEONARDO", store: "RK2 MOTORS" },
  { name: "LUCAS ARAÚJO", store: "RK2 MOTORS" },
  { name: "LUCAS ARTHUR SILVESTRE SOUZA", store: "PISCAR VEICULOS" },
  { name: "LUCAS CAMPELLO", store: "SEMINOVOS BHZ" },
  { name: "LUCAS HENRIQUE", store: "RK2 MOTORS" },
  { name: "LUCAS ROSSI", store: "BROTHERS CAR" },
  { name: "LUCAS", store: "RK2 MOTORS" },
  { name: "LUIZ HENRIQUE", store: "GANDINI AUTOMOVEIS" },
  { name: "MARCOS PAULO SOUSA DA SILVA", store: "PISCAR VEICULOS" },
  { name: "MONICA", store: "DNA VEICULOS" },
  { name: "NATHALIA RODRIGUES", store: "SEMINOVOS BHZ" },
  { name: "NATHAN ALVES", store: "GANDINI AUTOMOVEIS" },
  { name: "OTAVIO GOMES DE LIMA", store: "PISCAR VEICULOS" },
  { name: "PAULO CESAR", store: "RK2 MOTORS" },
  { name: "RAFAEL JOSÉ", store: "RK2 MOTORS" },
  { name: "RYAN FELIPE", store: "GANDINI AUTOMOVEIS" },
  { name: "SALMON ROCHA ALMEIDA", store: "PISCAR VEICULOS" },
  { name: "SIDNEI NASCIMENTO", store: "BROTHERS CAR" },
  { name: "SIMONE", store: "ACERTTCAR" },
  { name: "TIAGO", store: "PAAY MOTORS" },
  { name: "VENDA LOJA CRISTIANO MACHADO", store: "SEMINOVOS BHZ" },
  { name: "VENDA LOJA", store: "ESPINDOLA AUTOMOVEIS" },
  { name: "VENDAS LOJA", store: "PAAY MOTORS" },
  { name: "VERONICA", store: "SEMINOVOS BHZ" },
  { name: "VINICIUS", store: "RK2 MOTORS" },
  { name: "VITOR GABRIEL DE OLIVEIRA", store: "PISCAR VEICULOS" },
  { name: "WANDER", store: "DNA VEICULOS" },
  { name: "WANDREY LIMA", store: "DNA VEICULOS" },
  { name: "WASHINGTON SANTANA DE SOUZA", store: "PISCAR VEICULOS" },
  { name: "WELLINGTON", store: "ACERTTCAR" },
  { name: "WENDER LUCIO", store: "DNA VEICULOS" },
  { name: "WESLEY BARBOSA DOS SANTOS LIMA", store: "PISCAR VEICULOS" }
]

function runCurl(method, path, body = null) {
  const url = `${supabaseUrl}${path}`
  let cmd = `curl -s -X ${method} "${url}" -H "apikey: ${serviceKey}" -H "Authorization: Bearer ${serviceKey}"`
  if (body) cmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(body)}'`
  const out = execSync(cmd, { timeout: 15000 }).toString()
  try { return JSON.parse(out) } catch (e) { return out }
}

function normalize(str) {
  return str.toUpperCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

async function run() {
  console.log('=== CORREÇÃO DE store_sellers POR NOME ===\n')

  const stores = runCurl('GET', '/rest/v1/stores?select=id,name')
  const storeMap = new Map()
  stores.forEach(s => storeMap.set(normalize(s.name), s.id))
  console.log('Lojas encontradas:', stores.map(s => s.name).join(', '))

  const allStoreSellers = runCurl('GET', '/rest/v1/store_sellers?select=id,store_id,seller_user_id,is_active,started_at,ended_at&is_active=eq.true')
  const users = runCurl('GET', '/rest/v1/users?select=id,name,email,active')
  const userById = new Map()
  users.forEach(u => userById.set(u.id, u))

  const storeById = new Map()
  stores.forEach(s => storeById.set(s.id, s.name))

  console.log(`\nVendedores ativos na tabela store_sellers: ${allStoreSellers.length}`)
  console.log(`Usuarios encontrados: ${users.length}\n`)

  const userByName = new Map()
  users.forEach(u => {
    const key = normalize(u.name)
    if (!userByName.has(key)) {
      userByName.set(key, u)
    } else {
      console.log(`⚠ Nome duplicado ignorado: ${u.name} (${u.email})`)
    }
  })

  const actions = []
  let alreadyCorrect = 0
  let notFound = 0

  for (const mapping of correctMapping) {
    const normalizedName = normalize(mapping.name)
    const user = userByName.get(normalizedName)

    if (!user) {
      console.log(`⚠ Usuario nao encontrado: ${mapping.name}`)
      notFound++
      continue
    }

    const correctStoreId = storeMap.get(normalize(mapping.store))
    if (!correctStoreId) {
      console.log(`⚠ Loja nao encontrada: ${mapping.store}`)
      notFound++
      continue
    }

    const currentTenures = allStoreSellers.filter(ss => ss.seller_user_id === user.id && ss.is_active)
    const correctTenure = currentTenures.find(ss => ss.store_id === correctStoreId)
    const wrongTenures = currentTenures.filter(ss => ss.store_id !== correctStoreId)

    if (wrongTenures.length === 0 && correctTenure) {
      alreadyCorrect++
      continue
    }

    actions.push({
      user,
      mapping,
      correctStoreId,
      wrongTenures,
      needsCreate: !correctTenure
    })
  }

  console.log(`\nJá corretos: ${alreadyCorrect}`)
  console.log(`Nao encontrados: ${notFound}`)
  console.log(`Acoes necessarias: ${actions.length}\n`)

  if (actions.length === 0) {
    console.log('✅ Todos os vendedores ja estao corretos. Nada a fazer.')
    return
  }

  for (const action of actions) {
    const { user, mapping, correctStoreId, wrongTenures, needsCreate } = action
    console.log(`\n🔧 ${mapping.name} -> ${mapping.store}`)

    for (const wrong of wrongTenures) {
      const wrongStoreName = storeById.get(wrong.store_id) || wrong.store_id
      console.log(`   [store_sellers] Removendo de: ${wrongStoreName}`)
      if (!DRY_RUN) {
        const checkins = runCurl('GET', `/rest/v1/daily_checkins?select=id&seller_user_id=eq.${user.id}&store_id=eq.${wrong.store_id}`)
        if (Array.isArray(checkins) && checkins.length > 0) {
          console.log(`   [daily_checkins] Deletando ${checkins.length} checkins de: ${wrongStoreName}`)
          runCurl('DELETE', `/rest/v1/daily_checkins?seller_user_id=eq.${user.id}&store_id=eq.${wrong.store_id}`)
        }
        runCurl('DELETE', `/rest/v1/store_sellers?id=eq.${wrong.id}`)
      }
    }

    if (!DRY_RUN) {
      const wrongMemberships = runCurl('GET', `/rest/v1/memberships?select=id&user_id=eq.${user.id}&store_id=neq.${correctStoreId}`)
      if (Array.isArray(wrongMemberships) && wrongMemberships.length > 0) {
        console.log(`   [memberships] Removendo ${wrongMemberships.length} membership(s) de loja errada`)
        runCurl('DELETE', `/rest/v1/memberships?user_id=eq.${user.id}&store_id=neq.${correctStoreId}`)
      }
    }

    if (needsCreate) {
      console.log(`   [store_sellers] Criando vinculo: ${mapping.store}`)
      if (!DRY_RUN) {
        runCurl('POST', '/rest/v1/store_sellers', {
          store_id: correctStoreId,
          seller_user_id: user.id,
          is_active: true
        })
      }
    }
  }

  if (DRY_RUN) {
    console.log('\n🔍 DRY-RUN concluido. Nenhuma alteracao foi feita.')
    console.log('Execute sem --dry-run para aplicar as correcoes.')
    return
  }

  console.log(`\n=== RESULTADO ===`)
  console.log(`Corrigidos: ${actions.length}`)
  console.log(`\n✅ Correção finalizada.`)

  console.log('\n--- VERIFICAÇÃO POS-CORRECAO ---')
  for (const storeName of ['DNA VEICULOS', 'ESPINDOLA AUTOMOVEIS']) {
    const storeId = storeMap.get(storeName)
    if (!storeId) continue
    const sellers = runCurl('GET', `/rest/v1/store_sellers?select=seller_user_id&store_id=eq.${storeId}&is_active=eq.true`)
    const sellerNames = sellers.map(ss => {
      const u = userById.get(ss.seller_user_id)
      return u ? u.name : ss.seller_user_id
    })
    console.log(`\n${storeName} (${sellers.length} vendedores): ${sellerNames.join(', ')}`)
  }
}

run()
