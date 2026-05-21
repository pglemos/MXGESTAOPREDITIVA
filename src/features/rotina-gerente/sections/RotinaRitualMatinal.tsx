import { CheckCircle2, Mail, RefreshCw, Zap } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import type { RoutineNotice } from '../data/types'

type Props = {
  reuniaoDone: boolean
  setReuniaoDone: (v: boolean) => void
  agendaValidated: boolean
  setAgendaDone: (v: boolean) => void
  totalAgendamentosHoje: number
  canTriggerMatinal: boolean
  executing: boolean
  matinalAudit: RoutineNotice | null
  onTriggerMatinal: () => void
}

/**
 * Card "Ritual Matinal" — checklist mandatário (Reunião, Agenda) + disparo do Matinal.
 */
export function RotinaRitualMatinal({
  reuniaoDone,
  setReuniaoDone,
  agendaValidated,
  setAgendaDone,
  totalAgendamentosHoje,
  canTriggerMatinal,
  executing,
  matinalAudit,
  onTriggerMatinal,
}: Props) {
  const steps = [
    {
      done: reuniaoDone,
      set: setReuniaoDone,
      label: 'Reunião Individual (D-0)',
      desc: 'Alinhamento tático e motivação do corpo de vendas',
      idx: '01',
    },
    {
      done: agendaValidated,
      set: setAgendaDone,
      label: 'Validação de Agenda',
      desc: `${totalAgendamentosHoje} compromissos firmados para hoje`,
      idx: '02',
    },
  ]

  return (
    <Card className="p-mx-10 md:p-14 space-y-mx-xl border-none shadow-mx-xl bg-white relative overflow-hidden">
      <div
        className="absolute top-mx-0 right-mx-0 w-mx-sidebar-expanded h-mx-64 bg-brand-primary/5 rounded-mx-full blur-mx-xl -mr-32 -mt-32"
        aria-hidden="true"
      />
      <header className="flex items-center justify-between border-b border-border-default pb-8 relative z-10">
        <div className="flex items-center gap-mx-md">
          <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-xl transform -rotate-2">
            <Zap size={32} />
          </div>
          <div>
            <Typography variant="h2" className="uppercase tracking-tighter leading-none">
              Ritual Matinal
            </Typography>
            <Typography
              variant="caption"
              tone="muted"
              className="uppercase tracking-widest mt-1 font-black"
            >
              SEQUÊNCIA MANDATÁRIA • LIMITE 10:30
            </Typography>
          </div>
        </div>
        <Badge
          variant="danger"
          className="animate-pulse shadow-mx-md px-6 py-2 rounded-mx-full font-black uppercase text-tiny"
        >
          Prioridade 01
        </Badge>
      </header>

      <div className="space-y-mx-md relative z-10">
        {steps.map((step) => (
          <Card
            key={step.idx}
            onClick={() => step.set(!step.done)}
            className={cn(
              'p-mx-lg cursor-pointer group transition-all border-2',
              step.done
                ? 'bg-status-success-surface/30 border-status-success/20'
                : 'bg-surface-alt border-transparent hover:bg-white hover:border-brand-primary/20 hover:shadow-mx-lg',
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-mx-md">
              <div className="flex items-start sm:items-center gap-mx-md min-w-0">
                <div
                  className={cn(
                    'w-mx-xl h-mx-xl rounded-mx-xl flex items-center justify-center border shadow-mx-inner transition-all',
                    step.done
                      ? 'bg-white text-status-success border-status-success/30'
                      : 'bg-white text-text-tertiary border-border-default group-hover:scale-110',
                  )}
                >
                  {step.done ? (
                    <CheckCircle2 size={24} strokeWidth={2} />
                  ) : (
                    <Typography variant="h3" className="text-base leading-none">
                      {step.idx}
                    </Typography>
                  )}
                </div>
                <div className="min-w-0">
                  <Typography
                    variant="h3"
                    className={cn(
                      'text-base uppercase tracking-tight',
                      step.done && 'text-status-success',
                    )}
                  >
                    {step.label}
                  </Typography>
                  <Typography
                    variant="tiny"
                    tone="muted"
                    className="italic mt-1 opacity-60 font-black"
                  >
                    &quot;{step.desc}&quot;
                  </Typography>
                </div>
              </div>
              {!step.done && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto rounded-mx-full px-6 h-mx-10 font-black text-tiny uppercase tracking-widest bg-white shadow-sm"
                >
                  Concluir
                </Button>
              )}
            </div>
          </Card>
        ))}

        <Card
          className={cn(
            'p-mx-10 border-none transition-all flex flex-col md:flex-row md:items-center justify-between gap-mx-lg',
            canTriggerMatinal
              ? 'bg-mx-black text-white shadow-mx-elite'
              : 'bg-surface-alt opacity-40',
          )}
        >
          <div className="flex items-center gap-mx-md">
            <div
              className={cn(
                'w-mx-14 h-mx-14 rounded-mx-xl flex items-center justify-center border transition-all',
                canTriggerMatinal
                  ? 'bg-white/10 text-white border-white/10 shadow-mx-inner'
                  : 'bg-white text-text-tertiary',
              )}
            >
              <Mail size={28} strokeWidth={2} />
            </div>
            <div>
              <Typography
                variant="h3"
                tone={canTriggerMatinal ? 'white' : 'default'}
                className="text-lg uppercase tracking-tight leading-none"
              >
                Disparar Matinal
              </Typography>
              <Typography
                variant="caption"
                tone={canTriggerMatinal ? 'white' : 'muted'}
                className="uppercase tracking-widest mt-1 font-black"
              >
                DIREÇÃO &amp; GOVERNANÇA REDE
              </Typography>
            </div>
          </div>
          <Button
            disabled={!canTriggerMatinal || executing}
            onClick={onTriggerMatinal}
            className={cn(
              'h-mx-14 px-10 rounded-mx-full font-black uppercase tracking-widest text-tiny',
              canTriggerMatinal
                ? 'bg-brand-primary shadow-mx-xl'
                : 'bg-white border-border-default',
            )}
          >
            {executing ? (
              <RefreshCw className="animate-spin mr-2" />
            ) : (
              <Zap size={18} className="mr-2" />
            )}{' '}
            DISPARAR AGORA
          </Button>
          {matinalAudit && (
            <div
              className={cn(
                'w-full rounded-mx-xl border px-mx-md py-mx-sm text-sm font-bold md:basis-full',
                matinalAudit.tone === 'success'
                  ? 'border-status-success/20 bg-status-success-surface text-status-success'
                  : 'border-status-error/20 bg-status-error-surface text-status-error',
              )}
            >
              <div className="flex flex-col gap-mx-tiny sm:flex-row sm:items-center sm:justify-between">
                <span>{matinalAudit.message}</span>
                <span className="text-mx-tiny font-black uppercase opacity-70">
                  {matinalAudit.at.toLocaleString('pt-BR')}
                </span>
              </div>
              {matinalAudit.detail && (
                <p className="mt-mx-tiny text-xs opacity-80">{matinalAudit.detail}</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </Card>
  )
}

export default RotinaRitualMatinal
