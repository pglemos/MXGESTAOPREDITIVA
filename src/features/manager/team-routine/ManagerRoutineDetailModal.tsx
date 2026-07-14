import { format, parseISO } from 'date-fns'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Modal } from '@/components/organisms/Modal'
import { Typography } from '@/components/atoms/Typography'
import type { OfficialRoutineScore } from './manager-team-routine'

export type RoutineDetailAction = {
  id: string
  title: string
  description?: string | null
  status: string
  source_type?: string
  due_at: string
  completed_at?: string | null
  justificativa?: string | null
}

type ManagerRoutineDetailModalProps = {
  open: boolean
  sellerName: string
  date: string
  actions: RoutineDetailAction[]
  appointments: number
  execution: number | null
  officialScore?: OfficialRoutineScore
  onClose: () => void
}

export function ManagerRoutineDetailModal({ open, sellerName, date, actions, appointments, execution, officialScore, onClose }: ManagerRoutineDetailModalProps) {
  const completed = actions.filter((action) => action.status === 'concluida' || action.status === 'justificada').length
  const hasRoutine = actions.length > 0

  return (
    <Modal open={open} onClose={onClose} size="xl" referenceStyle title={hasRoutine ? `Rotina do Dia — ${sellerName}` : 'Rotina do vendedor'}>
      {!hasRoutine ? (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-500">Nenhuma rotina registrada para este vendedor nesta data.</p>
          <Button type="button" variant="secondary" className="mt-4" onClick={onClose}>Fechar</Button>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-xs text-gray-500">Unidade e atividades oficiais da Central de Execução para {format(parseISO(date), 'dd/MM/yyyy')}.</p>
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-4">
            <DetailMetric label="Execução" value={execution === null ? '—' : `${execution}%`} />
            <DetailMetric label="Ações" value={`${completed}/${actions.length}`} />
            <DetailMetric label="Agendamentos" value={String(appointments)} />
            <DetailMetric label="Status" value={execution === null ? 'Sem dados' : execution >= 75 ? 'Em dia' : execution >= 50 ? 'Atenção' : 'Crítico'} />
          </div>
          {officialScore && <section aria-label="Componentes da pontuação oficial" className="rounded-xl border border-gray-100 bg-white p-4">
            <Typography variant="h3" className="mb-3">Pontuação oficial — 100 pontos</Typography>
            <div className="grid gap-2 sm:grid-cols-2">
              {officialScore.components.map(component => <div key={component.key} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-start justify-between gap-3"><span className="text-xs font-medium text-gray-700">{COMPONENT_LABELS[component.key]}</span><span className="text-xs font-semibold text-gray-800">{formatComponentValue(component)}</span></div>
                <p className="mt-1 text-[11px] text-gray-500">Peso {component.weight} pontos · {component.applicable ? component.evidence || component.source : component.reason || 'Não aplicável'}</p>
              </div>)}
            </div>
            <p className="mt-3 text-xs text-gray-500">Denominador aplicado: {officialScore.denominator} pontos.</p>
          </section>}
          <div>
            <Typography variant="h3" className="mb-2 flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600" />Atividades da Central de Execução</Typography>
            <ul className="space-y-2">
              {actions.map((action) => (
                <li key={action.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="text-sm font-semibold text-gray-800">{action.title}</p><p className="mt-1 text-xs text-gray-500">{formatActionDate(action.due_at)} · {action.source_type || 'Central de Execução'}</p></div>
                    <Badge variant={action.status === 'concluida' || action.status === 'justificada' ? 'success' : 'warning'}>{formatStatus(action.status)}</Badge>
                  </div>
                  {action.description && <p className="mt-2 text-xs text-gray-600">{action.description}</p>}
                  {action.justificativa && <p className="mt-2 flex items-start gap-1 text-xs text-amber-700"><AlertCircle size={12} className="mt-0.5 shrink-0" />{action.justificativa}</p>}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end"><Button type="button" variant="secondary" onClick={onClose}>Fechar</Button></div>
        </div>
      )}
    </Modal>
  )
}

const COMPONENT_LABELS: Record<keyof import('./manager-team-routine').OfficialRoutineScoreInput, string> = {
  routineAccess: 'Acessou a Rotina do Dia',
  resolvedPendencies: 'Resolveu pendências',
  attackPlan: 'Executou Plano de Ataque',
  prospectingAgenda: 'Executou agenda de prospecção',
  updatedClients: 'Atualizou clientes',
  dailyClosing: 'Realizou Fechamento Diário',
}

function formatComponentValue(component: OfficialRoutineScore['components'][number]) {
  if (!component.applicable || component.value === null) return 'Não aplicável'
  return `${Math.round(component.value)}%`
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return <div><span className="text-xs text-gray-500">{label}</span><span className="mt-0.5 block text-sm font-semibold text-gray-800">{value}</span></div>
}

function formatActionDate(value: string) {
  try { return format(parseISO(value), "dd/MM/yyyy HH:mm") } catch { return value }
}

function formatStatus(value: string) {
  return value.replaceAll('_', ' ')
}
