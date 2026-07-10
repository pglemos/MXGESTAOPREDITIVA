import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.generated'

const CATEGORY_BY_TYPE: Record<string, string> = {
  prospeccao: 'Prospecção', atendimento: 'Atendimento', agendamento: 'WhatsApp', apresentacao: 'Atendimento',
  financiamento: 'Financiamento', carro_de_troca: 'Negociação', fechamento: 'Fechamento', funil: 'Mentalidade',
  rotina_diaria: 'Mentalidade', crm: 'Carteira', institucional: 'Mentalidade',
}

export function categoriaDoTreinamento(type: string | null | undefined): string {
  return CATEGORY_BY_TYPE[(type || '').toLowerCase()] || 'Atendimento'
}

export type VendedorTreinamento = {
  id: string; title: string; description: string | null; type: string; category: string; level: string
  duration_minutes: number; video_url: string; material_url: string | null; is_live: boolean; live_date: string | null
  completed: boolean; progress_percent: number; completed_at: string | null
}

type TrainingRow = { id: string; title: string; description: string | null; type: string; curation_notes: string | null; target_audience: string; duration_minutes: number | null; video_url: string | null; material_url: string | null; published_at: string | null }
type ProgressRow = { id: string; training_id: string; status: string; progress_percent: number; completed_at: string | null }

export async function listarConteudoTreinamentos(client: SupabaseClient<Database>) {
  const result = await client.from('treinamentos').select('id, title, description, type, video_url, target_audience, active, store_id, source_kind, editorial_status, review_after, duration_minutes, xp_reward, curator_id, curation_notes, published_at, created_at, updated_at').eq('active', true).order('created_at', { ascending: false })
  if (result.error) throw result.error
  return result.data || []
}

export async function listarProgressoTreinamentos(client: SupabaseClient<Database>, userId: string) {
  const result = await client.from('progresso_treinamentos').select('training_id,status,completed_at,watched_at').eq('user_id', userId)
  if (result.error) throw result.error
  return result.data || []
}

export function mapVendedorTreinamentos(trainings: TrainingRow[], progress: ProgressRow[]): VendedorTreinamento[] {
  const progressByTraining = new Map(progress.map(item => [item.training_id, item]))
  return trainings.map(training => {
    const item = progressByTraining.get(training.id)
    const completed = item?.status === 'completed' || item?.status === 'watched' || item?.status === 'concluido' || Boolean(item?.completed_at)
    return {
      id: training.id, title: training.title, description: training.description, type: training.type,
      category: categoriaDoTreinamento(training.type), level: training.curation_notes?.startsWith('N') ? training.curation_notes : (training.target_audience || 'N1 Iniciante'),
      duration_minutes: training.duration_minutes || 10, video_url: training.video_url || '', material_url: training.material_url,
      is_live: training.type === 'live', live_date: training.published_at, completed, progress_percent: item?.progress_percent ?? 0, completed_at: item?.completed_at ?? null,
    }
  })
}

export async function listarTreinamentosVendedor(client: SupabaseClient<Database>, userId: string) {
  const [trainingsResult, progressResult] = await Promise.all([
    client.from('treinamentos').select('id, title, description, type, curation_notes, target_audience, duration_minutes, video_url, material_url, published_at').eq('active', true),
    client.from('progresso_treinamentos').select('id, training_id, status, progress_percent, completed_at').eq('user_id', userId),
  ])
  if (trainingsResult.error) throw trainingsResult.error
  if (progressResult.error) throw progressResult.error
  return mapVendedorTreinamentos((trainingsResult.data || []) as TrainingRow[], (progressResult.data || []) as ProgressRow[])
}

export async function concluirTreinamento(client: SupabaseClient<Database>, userId: string, trainingId: string) {
  const now = new Date().toISOString()
  const { error } = await client.from('progresso_treinamentos').upsert({ training_id: trainingId, user_id: userId, status: 'concluido', progress_percent: 100, watched_at: now, completed_at: now, source_context: 'universidade_mx' }, { onConflict: 'training_id,user_id' })
  if (error) throw error
  return now
}

export type TarefaTreinamento = { id: string; training_id: string; descricao: string; ordem: number; concluida: boolean; respostaId: string | null }

export async function listarTarefasTreinamento(client: SupabaseClient<Database>, userId: string, trainingIds: string[]): Promise<TarefaTreinamento[]> {
  if (!trainingIds.length) return []
  const [tasksResult, answersResult] = await Promise.all([
    client.from('treinamento_tarefas').select('id, training_id, descricao, ordem').in('training_id', trainingIds).eq('active', true).order('ordem'),
    client.from('treinamento_tarefa_respostas').select('id, tarefa_id, concluida').eq('seller_user_id', userId),
  ])
  if (tasksResult.error) throw tasksResult.error
  if (answersResult.error) throw answersResult.error
  const answers = new Map((answersResult.data || []).map(answer => [answer.tarefa_id, answer]))
  return (tasksResult.data || []).map(task => ({ ...task, concluida: answers.get(task.id)?.concluida ?? false, respostaId: answers.get(task.id)?.id ?? null }))
}

export async function atualizarTarefaTreinamento(client: SupabaseClient<Database>, userId: string, task: Pick<TarefaTreinamento, 'id' | 'respostaId'>, concluida: boolean) {
  const { error } = await client.from('treinamento_tarefa_respostas').upsert({ id: task.respostaId ?? undefined, tarefa_id: task.id, seller_user_id: userId, concluida, concluida_em: concluida ? new Date().toISOString() : null, updated_at: new Date().toISOString() }, { onConflict: 'tarefa_id,seller_user_id' })
  if (error) throw error
}

// ----------------------------------------------------------------------------
// Quiz oficial (UNIV-6): questões sem gabarito no cliente; correção e registro
// de tentativa acontecem no servidor (RPC submeter_quiz_treinamento).
// ----------------------------------------------------------------------------

export type QuizQuestao = { id: string; ordem: number; pergunta: string; opcoes: string[] }

type QuizQuestaoRow = { id: string; ordem: number; pergunta: string; opcoes: unknown }

export function mapQuizQuestoes(rows: QuizQuestaoRow[]): QuizQuestao[] {
  return rows
    .map(row => ({
      id: row.id,
      ordem: row.ordem,
      pergunta: row.pergunta,
      opcoes: Array.isArray(row.opcoes) ? row.opcoes.filter((opcao): opcao is string => typeof opcao === 'string') : [],
    }))
    .filter(questao => questao.opcoes.length >= 2)
    .sort((a, b) => a.ordem - b.ordem)
}

export async function listarQuizTreinamento(client: SupabaseClient<Database>, trainingId: string): Promise<QuizQuestao[]> {
  const result = await client
    .from('treinamento_quiz_questoes')
    .select('id, ordem, pergunta, opcoes')
    .eq('training_id', trainingId)
    .eq('active', true)
    .order('ordem')
  if (result.error) throw result.error
  return mapQuizQuestoes((result.data || []) as QuizQuestaoRow[])
}

export type ResultadoQuiz = { tentativa_id: string; acertos: number; total_questoes: number; nota: number; aprovado: boolean }

export async function submeterQuizTreinamento(
  client: SupabaseClient<Database>,
  trainingId: string,
  respostas: Record<string, number>,
): Promise<ResultadoQuiz> {
  const { data, error } = await client.rpc('submeter_quiz_treinamento', {
    p_training_id: trainingId,
    p_respostas: respostas,
  })
  if (error) throw error
  return data as unknown as ResultadoQuiz
}

// ----------------------------------------------------------------------------
// Presença em aula ao vivo (UNIV-6)
// ----------------------------------------------------------------------------

export async function listarPresencasTreinamentos(client: SupabaseClient<Database>, userId: string): Promise<string[]> {
  const result = await client
    .from('treinamento_presencas')
    .select('training_id')
    .eq('seller_user_id', userId)
  if (result.error) throw result.error
  return (result.data || []).map(row => row.training_id)
}

export async function confirmarPresencaTreinamento(client: SupabaseClient<Database>, userId: string, trainingId: string) {
  const { error } = await client
    .from('treinamento_presencas')
    .upsert({ training_id: trainingId, seller_user_id: userId }, { onConflict: 'training_id,seller_user_id' })
  if (error) throw error
}
