import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'

loadEnv({ quiet: true })

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error('SUPABASE_URL/VITE_SUPABASE_URL, SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required.')
}

const password = 'Mx#2026!'
const supabaseUrlValue = supabaseUrl
const anonKeyValue = anonKey
const serviceRoleKeyValue = serviceRoleKey

function anonClient() {
  return createClient(supabaseUrlValue, anonKeyValue, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function adminClient() {
  return createClient(supabaseUrlValue, serviceRoleKeyValue, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function signIn(client: SupabaseClient, email: string) {
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.user) throw new Error(`${email}: login failed: ${error?.message || 'missing user'}`)
  return data.user.id
}

async function requireSingle<T>(label: string, promise: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await promise
  if (error || !data) throw new Error(`${label}: ${error?.message || 'missing row'}`)
  return data
}

async function main() {
  const admin = adminClient()
  const vendedor = anonClient()
  const gerente = anonClient()
  const vendedorId = await signIn(vendedor, 'vendedor@mxgestaopreditiva.com.br')
  const gerenteId = await signIn(gerente, 'gerente@mxgestaopreditiva.com.br')

  const storeMembership = await requireSingle<{ store_id: string }>(
    'seller membership',
    admin.from('vinculos_loja').select('store_id').eq('user_id', vendedorId).eq('role', 'vendedor').limit(1).maybeSingle(),
  )

  const training = await requireSingle<{ id: string; title: string }>(
    'development content',
    vendedor.from('treinamentos').select('id,title').eq('active', true).eq('editorial_status', 'active').limit(1).maybeSingle(),
  )

  const suggestionTitle = `Smoke sugestao desenvolvimento ${Date.now()}`
  const { data: suggestion, error: suggestionError } = await vendedor
    .from('sugestoes_conteudo')
    .insert({
      requester_id: vendedorId,
      store_id: storeMembership.store_id,
      theme: 'crm',
      title: suggestionTitle,
      description: 'Smoke de sugestao persistida.',
      priority: 'medium',
    })
    .select('id')
    .single()
  if (suggestionError || !suggestion) throw new Error(`content suggestion failed: ${suggestionError?.message || 'missing row'}`)

  const { data: rating, error: ratingError } = await vendedor
    .from('treinamento_avaliacoes')
    .upsert({
      user_id: vendedorId,
      training_id: training.id,
      rating: 5,
      comment: 'Smoke rating persistido.',
    }, { onConflict: 'training_id,user_id' })
    .select('id')
    .single()
  if (ratingError || !rating) throw new Error(`rating failed: ${ratingError?.message || 'missing row'}`)

  const { data: recommendation, error: recommendationError } = await admin
    .from('recomendacoes_desenvolvimento')
    .insert({
      seller_id: vendedorId,
      store_id: storeMembership.store_id,
      source_type: 'manual',
      theme: 'crm',
      training_id: training.id,
      reason: 'Smoke recommendation visible to seller.',
      priority: 'high',
      created_by: gerenteId,
    })
    .select('id')
    .single()
  if (recommendationError || !recommendation) throw new Error(`recommendation seed failed: ${recommendationError?.message || 'missing row'}`)

  const sellerRecommendation = await requireSingle<{ id: string }>(
    'seller recommendation visibility',
    vendedor.from('recomendacoes_desenvolvimento').select('id').eq('id', recommendation.id).maybeSingle(),
  )

  const track = await requireSingle<{ id: string }>(
    'default onboarding track',
    gerente.from('trilhas_desenvolvimento').select('id').eq('track_type', 'novo_colaborador').is('store_id', null).limit(1).maybeSingle(),
  )

  const { data: assignment, error: assignmentError } = await gerente
    .from('atribuicoes_trilha_desenvolvimento')
    .upsert({
      track_id: track.id,
      seller_id: vendedorId,
      store_id: storeMembership.store_id,
      assigned_by: gerenteId,
      status: 'active',
      current_month: 1,
    }, { onConflict: 'track_id,seller_id' })
    .select('id')
    .single()
  if (assignmentError || !assignment) throw new Error(`track assignment failed: ${assignmentError?.message || 'missing row'}`)

  await gerente.rpc('inicializar_progresso_trilha', { p_assignment_id: assignment.id })

  const firstStep = await requireSingle<{ id: string; status: string }>(
    'available onboarding step',
    vendedor
      .from('progresso_etapa_trilha')
      .select('id,status')
      .eq('assignment_id', assignment.id)
      .eq('seller_id', vendedorId)
      .eq('status', 'available')
      .limit(1)
      .maybeSingle(),
  )

  const { error: completeError } = await vendedor.rpc('concluir_etapa_trilha', {
    p_progress_id: firstStep.id,
    p_feedback: null,
  })
  if (completeError) throw new Error(`complete track step failed: ${completeError.message}`)

  const completedStep = await requireSingle<{ id: string; status: string }>(
    'completed onboarding step',
    vendedor.from('progresso_etapa_trilha').select('id,status').eq('id', firstStep.id).eq('status', 'completed').maybeSingle(),
  )

  console.table([
    { check: 'content readable', result: training.title },
    { check: 'rating persisted', result: rating.id },
    { check: 'suggestion persisted', result: suggestion.id },
    { check: 'recommendation visible', result: sellerRecommendation.id },
    { check: 'track assigned', result: assignment.id },
    { check: 'step completed', result: completedStep.status },
  ])

  await admin.from('progresso_etapa_trilha').delete().eq('assignment_id', assignment.id)
  await admin.from('atribuicoes_trilha_desenvolvimento').delete().eq('id', assignment.id)
  await admin.from('recomendacoes_desenvolvimento').delete().eq('id', recommendation.id)
  await admin.from('treinamento_avaliacoes').delete().eq('id', rating.id)
  await admin.from('sugestoes_conteudo').delete().eq('id', suggestion.id)

  await vendedor.auth.signOut()
  await gerente.auth.signOut()
  console.log('\nDevelopment full smoke passed.')
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
})
