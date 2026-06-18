import { ArrowRight, CalendarClock, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { CHECKIN_DEADLINE_LABEL, CHECKIN_EDIT_LIMIT_LABEL } from '@/hooks/useCheckins'

interface CheckinSidebarProps {
  totalsVnd: number
  tomorrowActions: number
  mandatoryFeedbackActionsCount: number
  pendingReturns?: number
}

export function CheckinSidebar({
  totalsVnd,
  tomorrowActions,
  mandatoryFeedbackActionsCount,
  pendingReturns,
}: CheckinSidebarProps) {
  const returns = pendingReturns ?? Math.max(0, tomorrowActions - totalsVnd)

  return (
    <aside className="space-y-mx-md">
      <Card className="rounded-mx-xl border border-border-default bg-white p-mx-md shadow-mx-sm">
        <header className="flex items-center gap-mx-sm border-b border-border-default pb-mx-sm">
          <div className="grid h-mx-lg w-mx-lg place-items-center rounded-full bg-brand-primary/10 text-brand-primary">
            <CalendarClock size={18} />
          </div>
          <Typography variant="h3" className="text-sm font-semibold">
            Central de Execução
          </Typography>
        </header>
        <div className="mt-mx-sm grid gap-mx-xs">
          <SideMetric label="Ações para amanhã" value={tomorrowActions} tone="success" />
          <SideMetric label="Retornos pendentes" value={returns} tone="warning" />
          <SideMetric
            label="Feedback obrigatório"
            value={mandatoryFeedbackActionsCount}
            tone={mandatoryFeedbackActionsCount > 0 ? 'error' : 'success'}
          />
        </div>
        <Button asChild variant="outline" size="sm" className="mt-mx-sm w-full justify-center">
          <Link to="/central-execucao">
            Ver Central de Execução <ArrowRight size={16} />
          </Link>
        </Button>
      </Card>

      <Card className="rounded-mx-xl border border-border-default bg-white p-mx-md shadow-mx-sm">
        <header className="flex items-center gap-mx-sm border-b border-border-default pb-mx-sm">
          <div className="grid h-mx-lg w-mx-lg place-items-center rounded-full bg-status-success-surface text-status-success">
            <ShieldCheck size={18} />
          </div>
          <Typography variant="h3" className="text-sm font-semibold">
            Contrato MX
          </Typography>
        </header>
        <ul className="mt-mx-sm space-y-mx-sm">
          {[
            `Envie o Fechamento Diário até ${CHECKIN_DEADLINE_LABEL}.`,
            `Correções ficam disponíveis até ${CHECKIN_EDIT_LIMIT_LABEL}.`,
            'A Central de Execução de hoje determina o ritmo de amanhã.',
            'Justificativa obrigatória para itens zerados.',
          ].map(text => (
            <li key={text} className="flex gap-mx-xs">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-status-success" />
              <Typography variant="p" tone="muted" className="text-xs leading-relaxed">
                {text}
              </Typography>
            </li>
          ))}
        </ul>
      </Card>
    </aside>
  )
}

function SideMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'success' | 'warning' | 'error'
}) {
  const toneClass =
    tone === 'success' ? 'text-status-success' : tone === 'warning' ? 'text-status-warning' : 'text-status-error'

  return (
    <div className="flex items-center justify-between rounded-mx-lg border border-border-subtle bg-surface-alt px-mx-sm py-mx-xs">
      <Typography variant="p" tone="muted" className="text-xs">
        {label}
      </Typography>
      <span className={`text-lg font-semibold tabular-nums ${toneClass}`}>{value}</span>
    </div>
  )
}
