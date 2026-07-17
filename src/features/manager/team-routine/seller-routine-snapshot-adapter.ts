import { eachDayOfInterval, format, parseISO } from 'date-fns'
import type { OfficialRoutineScore, OfficialRoutineScoreInput } from './manager-team-routine'

export type SellerRoutineSnapshotRow = {
  seller_user_id: string
  reference_date: string
  version: number
  eligible: boolean
  reliable_work_base: boolean
  access_numerator: number | null
  pending_resolved: number | null
  pending_expected: number | null
  attack_executed: number | null
  attack_expected: number | null
  prospecting_executed: number | null
  prospecting_expected: number | null
  updates_completed: number | null
  updates_expected: number | null
  access_points: number | string | null
  pending_points: number | string | null
  attack_points: number | string | null
  prospecting_points: number | string | null
  update_points: number | string | null
  closing_points: number | string | null
  execution_score: number | string | null
  routine_status: string
  score_denominator: number | string | null
  source_payload: unknown
}

const componentMeta: Array<{
  key: keyof OfficialRoutineScoreInput
  points: keyof Pick<SellerRoutineSnapshotRow, 'access_points' | 'pending_points' | 'attack_points' | 'prospecting_points' | 'update_points' | 'closing_points'>
  weight: number
  source: string
  evidence: (row: SellerRoutineSnapshotRow) => string
}> = [
  { key: 'routineAccess', points: 'access_points', weight: 10, source: 'central_execucao_aberturas', evidence: row => row.access_numerator ? 'Abertura oficial registrada.' : 'Nenhuma abertura oficial registrada.' },
  { key: 'resolvedPendencies', points: 'pending_points', weight: 10, source: 'cadencia_estado_cliente', evidence: row => `${row.pending_resolved ?? 0}/${row.pending_expected ?? 0} pendências resolvidas.` },
  { key: 'attackPlan', points: 'attack_points', weight: 20, source: 'execution_actions', evidence: row => `${row.attack_executed ?? 0}/${row.attack_expected ?? 0} ações do Plano de Ataque executadas.` },
  { key: 'prospectingAgenda', points: 'prospecting_points', weight: 20, source: 'prospecting_schedule/eventos_comerciais', evidence: row => `${row.prospecting_executed ?? 0}/${row.prospecting_expected ?? 0} ações de prospecção executadas.` },
  { key: 'updatedClients', points: 'update_points', weight: 20, source: 'execution_actions', evidence: row => `${row.updates_completed ?? 0}/${row.updates_expected ?? 0} atualizações concluídas.` },
  { key: 'dailyClosing', points: 'closing_points', weight: 20, source: 'lancamentos_diarios', evidence: row => toNumber(row.closing_points) === 20 ? 'Fechamento oficial contabilizado.' : 'Fechamento não contabilizado.' },
]

export function buildOfficialScoreFromSnapshot(row: SellerRoutineSnapshotRow): OfficialRoutineScore {
  const components = componentMeta.map(meta => {
    const points = toNullableNumber(row[meta.points])
    const applicable = row.eligible && points !== null
    return {
      key: meta.key,
      weight: meta.weight,
      value: applicable ? Math.round((points / meta.weight) * 10000) / 100 : null,
      source: meta.source,
      evidence: applicable ? meta.evidence(row) : null,
      reason: applicable ? null : row.routine_status === 'nao_aplicavel' ? 'Dia não aplicável.' : 'Bloco excluído por diagnóstico técnico.',
      applicable,
    }
  })

  return {
    score: toNullableNumber(row.execution_score),
    denominator: toNumber(row.score_denominator),
    components,
  }
}

export function latestSnapshotsBySellerAndDate(rows: SellerRoutineSnapshotRow[]) {
  const latest = new Map<string, SellerRoutineSnapshotRow>()
  for (const row of rows) {
    const key = `${row.reference_date}:${row.seller_user_id}`
    const current = latest.get(key)
    if (!current || row.version > current.version) latest.set(key, row)
  }
  return latest
}

export function buildSnapshotTrend(rows: SellerRoutineSnapshotRow[], start: string, end: string) {
  const latest = latestSnapshotsBySellerAndDate(rows)
  return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) }).map(day => {
    const date = format(day, 'yyyy-MM-dd')
    const values = Array.from(latest.values())
      .filter(row => row.reference_date === date && row.eligible)
      .map(row => toNullableNumber(row.execution_score))
      .filter((value): value is number => value !== null)
    return {
      date,
      label: format(day, 'dd/MM'),
      value: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null,
    }
  })
}

function toNullableNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toNumber(value: number | string | null | undefined): number {
  return toNullableNumber(value) ?? 0
}
