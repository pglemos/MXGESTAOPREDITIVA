#!/usr/bin/env node

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const OFFICIAL_STORE_SLUGS = [
  'acertt',
  'ag-automoveis',
  'almeida',
  'andre-car',
  'auto-up',
  'bedim-automoveis',
  'brothers-car',
  'carrum',
  'dakar',
  'delta-veiculos',
  'direta',
  'dna-multimarcas',
  'espindola',
  'gandini',
  'ged-veiculos',
  'goto-motors',
  'ideal-automotive',
  'ideal-motors',
  'imperio',
  'investcar-mg',
  'investcar-rj',
  'lial',
  'lm-veiculos',
  'mcar-automoveis',
  'otavio-lage',
  'paay',
  'piscar-veiculos',
  'promac-jpa',
  'rk2',
  'salim',
  'seminovos-bhz',
  'sempre-mais',
  'trend-auto',
  'vitrine',
  'wcar',
]

const applyChanges = process.argv.includes('--apply')
const endedAt = new Date().toISOString().slice(0, 10)

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function chunk(items, size = 100) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

async function fetchAll(supabase, table, select) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    rows.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  return rows
}

async function updateByIds(supabase, table, ids, payload) {
  for (const idsChunk of chunk(ids)) {
    const { error } = await supabase.from(table).update(payload).in('id', idsChunk)
    if (error) throw new Error(`${table}: ${error.message}`)
  }
}

function countByStore(rows, storeMap, storeIdKey) {
  return rows.reduce((acc, row) => {
    const name = storeMap.get(row[storeIdKey])?.name || row[storeIdKey]
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {})
}

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/^"|"$/g, '')

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing VITE_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const [stores, preRegistrations, sellerTenures, memberships, users] = await Promise.all([
    fetchAll(supabase, 'lojas', 'id,name,active'),
    fetchAll(supabase, 'pre_cadastros_loja', 'id,store_id,auth_user_id,role,status'),
    fetchAll(supabase, 'vendedores_loja', 'id,store_id,seller_user_id,is_active'),
    fetchAll(supabase, 'vinculos_loja', 'id,store_id,user_id,role,is_active'),
    fetchAll(supabase, 'usuarios', 'id,role,active'),
  ])

  const officialSlugSet = new Set(OFFICIAL_STORE_SLUGS)
  const targetStores = stores.filter((store) => store.active && officialSlugSet.has(slugify(store.name)))
  const targetStoreIds = new Set(targetStores.map((store) => store.id))
  const storeMap = new Map(stores.map((store) => [store.id, store]))
  const missingSlugs = OFFICIAL_STORE_SLUGS.filter((slug) => !targetStores.some((store) => slugify(store.name) === slug))

  const syncedKeys = new Set(
    preRegistrations
      .filter((pre) => pre.status === 'synced' && pre.auth_user_id && targetStoreIds.has(pre.store_id))
      .map((pre) => `${pre.store_id}:${pre.auth_user_id}`),
  )
  const syncedSellerKeys = new Set(
    preRegistrations
      .filter((pre) => pre.status === 'synced' && pre.role === 'vendedor' && pre.auth_user_id && targetStoreIds.has(pre.store_id))
      .map((pre) => `${pre.store_id}:${pre.auth_user_id}`),
  )

  const staleSellerTenures = sellerTenures.filter((tenure) => {
    if (!tenure.is_active || !targetStoreIds.has(tenure.store_id)) return false
    return !syncedSellerKeys.has(`${tenure.store_id}:${tenure.seller_user_id}`)
  })

  const staleMemberships = memberships.filter((membership) => {
    if (!membership.is_active || !targetStoreIds.has(membership.store_id)) return false
    if (!['dono', 'gerente', 'vendedor'].includes(membership.role)) return false
    return !syncedKeys.has(`${membership.store_id}:${membership.user_id}`)
  })

  const statusCounts = preRegistrations
    .filter((pre) => targetStoreIds.has(pre.store_id))
    .reduce((acc, pre) => {
      acc[pre.status] = (acc[pre.status] || 0) + 1
      return acc
    }, {})

  const staleUserIds = new Set([
    ...staleSellerTenures.map((tenure) => tenure.seller_user_id),
    ...staleMemberships.map((membership) => membership.user_id),
  ])

  const staleMembershipIds = new Set(staleMemberships.map((membership) => membership.id))
  const simulatedActiveMembershipUserIds = new Set(
    memberships
      .filter((membership) => membership.is_active && !staleMembershipIds.has(membership.id))
      .map((membership) => membership.user_id),
  )
  const storeRoleUserIdsToDeactivate = users
    .filter((user) => {
      if (!staleUserIds.has(user.id) || user.active === false) return false
      if (!['dono', 'gerente', 'vendedor'].includes(user.role)) return false
      return !simulatedActiveMembershipUserIds.has(user.id)
    })
    .map((user) => user.id)

  const report = {
    mode: applyChanges ? 'apply' : 'dry-run',
    targetStores: targetStores.length,
    missingSlugs,
    statusCounts,
    staleSellerTenures: staleSellerTenures.length,
    staleMemberships: staleMemberships.length,
    usersToDeactivate: storeRoleUserIdsToDeactivate.length,
    staleSellerTenuresByStore: countByStore(staleSellerTenures, storeMap, 'store_id'),
    staleMembershipsByStore: countByStore(staleMemberships, storeMap, 'store_id'),
  }

  console.log(JSON.stringify(report, null, 2))

  if (!applyChanges) {
    console.log('Dry-run only. Re-run with --apply to write changes.')
    return
  }

  await updateByIds(
    supabase,
    'vendedores_loja',
    staleSellerTenures.map((tenure) => tenure.id),
    { is_active: false, ended_at: endedAt },
  )
  await updateByIds(
    supabase,
    'vinculos_loja',
    staleMemberships.map((membership) => membership.id),
    { is_active: false, ended_at: endedAt },
  )
  await updateByIds(
    supabase,
    'usuarios',
    storeRoleUserIdsToDeactivate,
    { active: false },
  )

  console.log('Reconciliation applied.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
