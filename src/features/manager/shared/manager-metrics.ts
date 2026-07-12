import type { CheckinWithTotals } from '@/types/database'

export type ManagerClosingStatus = 'Finalizado' | 'Pendente' | 'Fora do horário' | 'Aguardando aprovação'

export function getClosingStatus(checkin: CheckinWithTotals | undefined, pendingRegularization = false): ManagerClosingStatus {
  if (pendingRegularization) return 'Aguardando aprovação'
  if (!checkin) return 'Pendente'
  if (checkin.submitted_late || checkin.finalizado_apos_prazo || checkin.submission_status === 'late') return 'Fora do horário'
  return 'Finalizado'
}

export function classifyDiscipline(value: number) {
  if (value >= 95) return 'Excelente'
  if (value >= 85) return 'Muito boa'
  if (value >= 70) return 'Boa'
  if (value >= 50) return 'Baixa'
  return 'Muito baixa'
}

export function classifyRoutine(value: number) {
  if (value >= 75) return 'Em dia'
  if (value >= 50) return 'Atenção'
  return 'Crítico'
}

export function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0
}
