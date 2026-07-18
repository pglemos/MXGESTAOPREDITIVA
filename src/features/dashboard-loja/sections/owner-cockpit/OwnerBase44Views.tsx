import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  MessageSquareText,
  ShieldAlert,
  Target,
  UserRoundCheck,
} from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import type { OwnerPerformanceAlert } from '../PerformanceAlerts'
import { ownerPath } from './format'
import { SectionTitle } from './primitives'
import { toneClasses, type ActionRow, type DashboardData } from './types'

type ExecutiveItem = {
  id: string
  title: string
  context: string
  department: string
  owner: string
  due: string
  recommendation: string
  status: string
  tone: ActionRow['tone']
  origin: string
}

function buildExecutiveItems(alerts: OwnerPerformanceAlert[], actions: ActionRow[]): ExecutiveItem[] {
  const fromActions = actions.map(action => ({
    id: `action-${action.id}`,
    title: action.problem,
    context: action.action,
    department: action.department,
    owner: action.owner,
    due: action.due,
    recommendation: action.recommendation,
    status: action.status,
    tone: action.tone,
    origin: action.origin,
  }))

  const fromAlerts = alerts.map((alert, index) => ({
    id: `alert-${index}-${alert.title}`,
    title: alert.title,
    context: alert.description,
    department: 'Executivo',
    owner: 'Dono da loja',
    due: alert.variant === 'danger' ? 'Hoje' : 'Próximo ciclo',
    recommendation: alert.recommendation,
    status: alert.variant === 'danger' ? 'Crítico' : alert.variant === 'warning' ? 'Atenção' : 'Monitorar',
    tone: alert.variant === 'danger' ? 'danger' as const : alert.variant === 'warning' ? 'warning' as const : 'info' as const,
    origin: 'Alerta executivo',
  }))

  const priority = { danger: 0, warning: 1, purple: 2, info: 3, brand: 4, success: 5, muted: 6 }
  return [...fromActions, ...fromAlerts]
    .sort((a, b) => priority[a.tone] - priority[b.tone])
    .filter((item, index, list) => list.findIndex(candidate => candidate.title === item.title) === index)
}

export function OwnerRoutineView({
  data,
  alerts,
  actions,
}: {
  data: DashboardData
  alerts: OwnerPerformanceAlert[]
  actions: ActionRow[]
}) {
  const navigate = useNavigate()
  const todayActions = actions.filter(action => action.status !== 'Concluída').slice(0, 5)
  const criticalAlerts = alerts.filter(alert => alert.variant === 'danger' || alert.variant === 'warning').slice(0, 4)
  const confirmedAppointments = data.metrics.totalAgd

  return (
    <div className="space-y-mx-md">
      <SectionTitle
        title="Rotina do Dia"
        subtitle="O que precisa da atenção do Dono hoje, sem transformar a diretoria em uma lista infinita de tarefas."
      />

      <div className="grid grid-cols-1 gap-mx-md md:grid-cols-3">
        <Card className="rounded-mx-2xl border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
          <div className="flex items-center gap-mx-sm">
            <span className="flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-xl bg-status-success-surface text-status-success">
              <CalendarClock size={20} />
            </span>
            <div>
              <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-mx-wide">Agenda comercial</Typography>
              <Typography variant="h2" className="text-3xl font-black tabular-nums">{confirmedAppointments}</Typography>
            </div>
          </div>
          <Typography variant="p" tone="muted" className="mt-mx-sm text-sm font-bold">Agendamentos registrados no período de referência.</Typography>
        </Card>

        <Card className="rounded-mx-2xl border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
          <div className="flex items-center gap-mx-sm">
            <span className="flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-xl bg-status-warning-surface text-status-warning">
              <ClipboardCheck size={20} />
            </span>
            <div>
              <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-mx-wide">Ações abertas</Typography>
              <Typography variant="h2" className="text-3xl font-black tabular-nums">{todayActions.length}</Typography>
            </div>
          </div>
          <Typography variant="p" tone="muted" className="mt-mx-sm text-sm font-bold">Prioridades do plano que ainda exigem execução ou validação.</Typography>
        </Card>

        <Card className="rounded-mx-2xl border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
          <div className="flex items-center gap-mx-sm">
            <span className="flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-xl bg-status-error-surface text-status-error">
              <ShieldAlert size={20} />
            </span>
            <div>
              <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-mx-wide">Riscos prioritários</Typography>
              <Typography variant="h2" className="text-3xl font-black tabular-nums">{criticalAlerts.length}</Typography>
            </div>
          </div>
          <Typography variant="p" tone="muted" className="mt-mx-sm text-sm font-bold">Alertas críticos ou em atenção que merecem intervenção executiva.</Typography>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="rounded-mx-2xl border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
          <div className="flex items-center justify-between gap-mx-sm">
            <div>
              <Typography variant="h3" className="text-xl font-black">Próximas ações do Dono</Typography>
              <Typography variant="p" tone="muted" className="mt-1 text-sm font-bold">Acompanhe, delegue ou converta o desvio em execução.</Typography>
            </div>
            <Button type="button" variant="outline" className="rounded-mx-xl bg-white" onClick={() => navigate(ownerPath('plano-acao'))}>
              Ver plano <ArrowRight size={16} />
            </Button>
          </div>
          <div className="mt-mx-md divide-y divide-border-subtle">
            {todayActions.length === 0 ? (
              <div className="rounded-mx-xl bg-status-success-surface p-mx-md text-status-success">
                <CheckCircle2 size={20} />
                <p className="mt-mx-xs text-sm font-black">Nenhuma ação executiva pendente neste recorte.</p>
              </div>
            ) : todayActions.map((action, index) => (
              <button
                type="button"
                key={action.id}
                onClick={() => navigate(ownerPath('plano-acao'))}
                className="flex w-full items-start gap-mx-md py-mx-md text-left transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
              >
                <span className="mt-0.5 flex h-mx-8 w-mx-8 shrink-0 items-center justify-center rounded-mx-lg bg-surface-alt text-xs font-black text-text-secondary">{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-black text-text-primary">{action.action}</span>
                  <span className="mt-1 block text-sm font-bold text-text-tertiary">{action.owner} · {action.due} · {action.department}</span>
                </span>
                <ArrowRight size={17} className="mt-1 shrink-0 text-text-tertiary" />
              </button>
            ))}
          </div>
        </Card>

        <Card className="rounded-mx-2xl border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
          <Typography variant="h3" className="text-xl font-black">Riscos e intervenções</Typography>
          <div className="mt-mx-md space-y-mx-sm">
            {criticalAlerts.length === 0 ? (
              <p className="rounded-mx-xl bg-surface-alt p-mx-md text-sm font-bold text-text-tertiary">Nenhum alerta prioritário no período.</p>
            ) : criticalAlerts.map((alert, index) => (
              <button
                type="button"
                key={`${alert.title}-${index}`}
                onClick={() => navigate(ownerPath('decisoes'))}
                className="w-full rounded-mx-xl border border-border-subtle p-mx-md text-left transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
              >
                <div className="flex items-center gap-mx-sm">
                  <AlertTriangle size={17} className={alert.variant === 'danger' ? 'text-status-error' : 'text-status-warning'} />
                  <span className="font-black text-text-primary">{alert.title}</span>
                </div>
                <p className="mt-mx-xs text-sm font-bold text-text-tertiary">{alert.description}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export function OwnerDecisionCenter({
  alerts,
  actions,
}: {
  alerts: OwnerPerformanceAlert[]
  actions: ActionRow[]
}) {
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(() => new Set())
  const items = useMemo(
    () => buildExecutiveItems(alerts, actions).filter(item => !resolvedIds.has(item.id)).slice(0, 12),
    [actions, alerts, resolvedIds],
  )

  const resolveLocally = (id: string) => {
    setResolvedIds(current => new Set(current).add(id))
  }

  return (
    <div className="space-y-mx-md">
      <SectionTitle
        title="Central de Decisões"
        subtitle="Prioridades que dependem de aprovação, direção ou intervenção do Dono."
      />

      <div className="grid grid-cols-1 gap-mx-md md:grid-cols-3">
        <DecisionMetric label="Precisam de você" value={items.length} icon={<UserRoundCheck size={20} />} tone="purple" />
        <DecisionMetric label="Críticas" value={items.filter(item => item.tone === 'danger').length} icon={<ShieldAlert size={20} />} tone="danger" />
        <DecisionMetric label="Em atenção" value={items.filter(item => item.tone === 'warning').length} icon={<Clock3 size={20} />} tone="warning" />
      </div>

      <div className="space-y-mx-md">
        {items.length === 0 ? (
          <Card className="rounded-mx-2xl border border-border-subtle bg-white p-mx-xl text-center shadow-mx-sm">
            <CheckCircle2 size={32} className="mx-auto text-status-success" />
            <Typography variant="h3" className="mt-mx-sm text-xl font-black">Fila executiva tratada</Typography>
            <Typography variant="p" tone="muted" className="mt-mx-xs font-bold">Não há decisões prioritárias neste recorte.</Typography>
          </Card>
        ) : items.map(item => {
          const classes = toneClasses[item.tone]
          const expanded = expandedId === item.id
          return (
            <Card key={item.id} className={cn('rounded-mx-2xl border bg-white p-mx-lg shadow-mx-sm', classes.border)}>
              <div className="flex flex-col gap-mx-md xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-mx-sm">
                    <span className={cn('rounded-mx-md border px-mx-sm py-mx-xs text-mx-tiny font-black', classes.soft)}>{item.status}</span>
                    <span className="rounded-mx-md bg-surface-alt px-mx-sm py-mx-xs text-mx-tiny font-black text-text-secondary">{item.department}</span>
                    <span className="text-mx-tiny font-black uppercase tracking-mx-wide text-text-tertiary">{item.origin}</span>
                  </div>
                  <Typography variant="h3" className="mt-mx-sm text-xl font-black text-text-primary">{item.title}</Typography>
                  <Typography variant="p" tone="muted" className="mt-mx-xs font-bold leading-relaxed">{item.context}</Typography>
                  <div className="mt-mx-sm flex flex-wrap gap-x-mx-lg gap-y-mx-xs text-sm font-bold text-text-secondary">
                    <span>Prazo: <strong className={classes.text}>{item.due}</strong></span>
                    <span>Responsável: <strong>{item.owner}</strong></span>
                  </div>
                  {expanded && (
                    <div className="mt-mx-md rounded-mx-xl bg-surface-alt p-mx-md">
                      <p className="text-mx-tiny font-black uppercase tracking-mx-wide text-text-tertiary">Direcionamento MX</p>
                      <p className="mt-mx-xs text-sm font-black leading-relaxed text-text-primary">{item.recommendation}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-mx-sm xl:max-w-[390px] xl:justify-end">
                  <Button type="button" variant="outline" className="rounded-mx-xl bg-white" onClick={() => setExpandedId(expanded ? null : item.id)}>
                    {expanded ? 'Fechar análise' : 'Analisar'}
                  </Button>
                  <Button type="button" variant="outline" className="rounded-mx-xl bg-white" onClick={() => navigate(ownerPath('plano-acao'))}>
                    Transformar em ação
                  </Button>
                  <Button type="button" className="rounded-mx-xl" onClick={() => resolveLocally(item.id)}>
                    Registrar decisão
                  </Button>
                  <Button type="button" variant="ghost" className="rounded-mx-xl" onClick={() => navigate(ownerPath('consultor'))}>
                    <MessageSquareText size={16} /> Consultor
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function DecisionMetric({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: ActionRow['tone'] }) {
  const classes = toneClasses[tone]
  return (
    <Card className="rounded-mx-2xl border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="flex items-center gap-mx-sm">
        <span className={cn('flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-xl', classes.soft)}>{icon}</span>
        <div>
          <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-mx-wide">{label}</Typography>
          <Typography variant="h2" className="text-3xl font-black tabular-nums">{value}</Typography>
        </div>
      </div>
    </Card>
  )
}

export function OwnerConsultingView({ data }: { data: DashboardData }) {
  const navigate = useNavigate()
  const goal = data.metrics.goalValue
  const achieved = data.metrics.totalSales
  const attainment = goal > 0 ? Math.round((achieved / goal) * 100) : 0

  return (
    <div className="space-y-mx-md">
      <SectionTitle
        title="Consultoria"
        subtitle="Jornada executiva, preparação dos encontros e decisões que precisam ser levadas ao Consultor MX."
      />

      <Card className="overflow-hidden rounded-mx-2xl border border-border-subtle bg-white shadow-mx-sm">
        <div className="border-b border-border-subtle bg-surface-alt p-mx-lg">
          <div className="flex flex-col gap-mx-md md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-mx-tiny font-black uppercase tracking-mx-widest text-brand-primary">Ciclo estratégico atual</p>
              <Typography variant="h2" className="mt-mx-xs text-2xl font-black">Organização e rentabilidade</Typography>
              <Typography variant="p" tone="muted" className="mt-mx-xs font-bold">Foco em rentabilidade, capital parado e autonomia da gestão.</Typography>
            </div>
            <div className="min-w-[220px] rounded-mx-xl border border-border-subtle bg-white p-mx-md">
              <div className="flex items-center justify-between text-sm font-black">
                <span>Meta comercial</span>
                <span className={attainment >= 100 ? 'text-status-success' : attainment >= 90 ? 'text-status-warning' : 'text-status-error'}>{attainment}%</span>
              </div>
              <div className="mt-mx-sm h-2 overflow-hidden rounded-mx-full bg-surface-alt">
                <div className="h-full rounded-mx-full bg-brand-primary" style={{ width: `${Math.min(attainment, 100)}%` }} />
              </div>
              <p className="mt-mx-xs text-xs font-bold text-text-tertiary">{achieved} de {goal || 0} vendas no período.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-mx-md p-mx-lg lg:grid-cols-3">
          <ConsultingStep
            icon={<Target size={20} />}
            title="Preparação"
            detail="Revisar indicadores, despesas extraordinárias e itens críticos do estoque."
            status="Em andamento"
          />
          <ConsultingStep
            icon={<MessageSquareText size={20} />}
            title="Encontro"
            detail="Levar decisões com contexto, impacto e recomendação, não apenas uma lista de problemas."
            status="Próximo passo"
          />
          <ConsultingStep
            icon={<ClipboardCheck size={20} />}
            title="Execução"
            detail="Converter decisões aprovadas em plano de ação, responsável, prazo e evidência."
            status="Acompanhar"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="rounded-mx-2xl border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
          <Typography variant="h3" className="text-xl font-black">Pauta executiva recomendada</Typography>
          <div className="mt-mx-md space-y-mx-sm">
            {[
              'Projeção de vendas e distância para a meta.',
              'Indicadores estratégicos incompletos ou fora do esperado.',
              'Ações atrasadas, bloqueadas ou aguardando decisão do Dono.',
              'Riscos de caixa, margem e estoque envelhecido.',
            ].map((item, index) => (
              <div key={item} className="flex items-start gap-mx-sm rounded-mx-xl bg-surface-alt p-mx-md">
                <span className="flex h-mx-7 w-mx-7 shrink-0 items-center justify-center rounded-mx-lg bg-brand-primary text-xs font-black text-white">{index + 1}</span>
                <p className="text-sm font-black leading-relaxed text-text-primary">{item}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-mx-2xl border border-brand-primary/20 bg-mx-indigo-50 p-mx-lg shadow-mx-sm">
          <MessageSquareText size={28} className="text-brand-primary" />
          <Typography variant="h3" className="mt-mx-sm text-xl font-black">Falar com Consultor</Typography>
          <Typography variant="p" tone="muted" className="mt-mx-xs text-sm font-bold leading-relaxed">
            Abra o consultor com o contexto da loja e use os indicadores desta tela como base da solicitação.
          </Typography>
          <Button type="button" className="mt-mx-md w-full rounded-mx-xl" onClick={() => navigate(ownerPath('consultor'))}>
            Abrir Consultor MX <ArrowRight size={16} />
          </Button>
        </Card>
      </div>
    </div>
  )
}

function ConsultingStep({ icon, title, detail, status }: { icon: React.ReactNode; title: string; detail: string; status: string }) {
  return (
    <div className="rounded-mx-xl border border-border-subtle p-mx-md">
      <div className="flex items-center gap-mx-sm">
        <span className="flex h-mx-9 w-mx-9 items-center justify-center rounded-mx-lg bg-mx-indigo-50 text-brand-primary">{icon}</span>
        <div>
          <p className="font-black text-text-primary">{title}</p>
          <p className="text-xs font-black uppercase tracking-mx-wide text-brand-primary">{status}</p>
        </div>
      </div>
      <p className="mt-mx-sm text-sm font-bold leading-relaxed text-text-tertiary">{detail}</p>
    </div>
  )
}
