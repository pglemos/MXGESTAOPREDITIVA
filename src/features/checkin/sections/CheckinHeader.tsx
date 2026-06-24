import { useState, useMemo } from 'react'
import { CalendarDays, History, Info, X } from 'lucide-react'

import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { CHECKIN_DEADLINE_LABEL } from '@/hooks/useCheckins'
import type { DailyCheckin } from '@/types/database'
import { addDaysDateOnly } from '../lib/crm-derived-totals'

interface CheckinHeaderProps {
  dateStr: string
  metricScope: 'daily' | 'adjustment'
  setMetricScope: (scope: 'daily' | 'adjustment') => void
  customReferenceDate: string
  setCustomReferenceDate: (value: string) => void
  isLate: boolean
  historicalCheckin: DailyCheckin | null
  canEditExisting: boolean
  deadlineMessage: string
  handleExit: () => void
  // Added Props
  checkins?: DailyCheckin[]
  userId?: string
}

export function CheckinHeader({
  dateStr,
  metricScope,
  isLate,
  historicalCheckin,
  canEditExisting,
  deadlineMessage,
  setCustomReferenceDate,
  checkins = [],
  userId = 'vendedor',
}: CheckinHeaderProps) {
  const [infoOpen, setInfoOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const statusText =
    metricScope === 'adjustment'
      ? 'NO PRAZO. EDIÇÃO BLOQUEIA EM 09:45.'
      : canEditExisting
        ? deadlineMessage
        : historicalCheckin
          ? 'REGISTRO FINALIZADO'
          : isLate
            ? 'FORA DO PRAZO'
            : 'NO PRAZO. EDIÇÃO BLOQUEIA EM 09:45.'

  // Generate last 7 days of history (starting from yesterday backwards)
  const historyRows = useMemo(() => {
    const list = []
    const spString = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
    const todaySP = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(spString))

    for (let i = 1; i <= 7; i++) {
      const date = addDaysDateOnly(todaySP, -i)
      const checkin = checkins.find(c => c.reference_date === date)

      if (checkin) {
        // Read sales count (merge localStorage & DB)
        let salesCount = 0
        const localClients = localStorage.getItem(`mx-checkin-clientes:${userId}:${date}`)
        if (localClients) {
          try {
            salesCount = JSON.parse(localClients).filter((c: any) => c.vendaRealizada === 'Sim').length
          } catch {
            salesCount = (checkin.vnd_porta_prev_day || 0) + (checkin.vnd_cart_prev_day || 0) + (checkin.vnd_net_prev_day || 0)
          }
        } else {
          salesCount = (checkin.vnd_porta_prev_day || 0) + (checkin.vnd_cart_prev_day || 0) + (checkin.vnd_net_prev_day || 0)
        }

        // Read discipline score
        const score = localStorage.getItem(`mx-checkin-score:${userId}:${date}`) || '70'

        // Formatted time
        const formattedTime = new Date(checkin.submitted_at).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })

        list.push({
          date,
          finalized: true,
          status: 'Finalizado',
          score: score.includes('%') ? score : `${score}%`,
          time: formattedTime,
          sales: salesCount,
        })
      } else {
        list.push({
          date,
          finalized: false,
          status: 'Pendente de Fechamento',
          score: '—',
          time: '—',
          sales: 0,
        })
      }
    }
    return list
  }, [checkins, userId])

  return (
    <header className="shrink-0 border-b border-border-default pb-mx-sm">
      <div className="flex min-w-0 flex-col gap-mx-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-mx-xs">
          <Typography variant="h1" className="min-w-0 break-words !text-xl !font-extrabold !leading-none uppercase tracking-normal text-text-primary">
            Fechamento Diário
          </Typography>
          <div className="inline-flex max-w-full items-center gap-mx-xs rounded-mx-full border border-border-default bg-white px-mx-sm py-1 text-[11px] font-semibold text-text-secondary shadow-mx-xs">
            <CalendarDays size={13} className="shrink-0 text-brand-primary" />
            <span className="truncate">{dateStr}</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-mx-xs lg:justify-end">
          <div className="grid h-8 place-items-center whitespace-nowrap rounded-mx-full border border-brand-primary/15 bg-brand-primary px-mx-sm text-[11px] font-semibold uppercase text-white shadow-mx-xs">
            {metricScope === 'adjustment' ? 'Correções até 09:45' : `Até ${CHECKIN_DEADLINE_LABEL}`}
          </div>
          <div className="relative">
            <button
              type="button"
              className="flex h-8 min-w-0 items-center gap-mx-xs rounded-mx-full border border-brand-primary/20 bg-status-success-surface px-mx-sm text-[11px] font-semibold uppercase text-brand-primary"
              aria-expanded={infoOpen}
              aria-controls="checkin-status-info"
              onClick={() => setInfoOpen(current => !current)}
            >
              {statusText}
              <Info size={13} />
            </button>
            {infoOpen && (
              <div
                id="checkin-status-info"
                role="status"
                className="absolute right-0 top-10 z-20 w-64 rounded-mx-lg border border-border-default bg-white p-mx-sm text-xs font-medium normal-case leading-relaxed text-text-secondary shadow-mx-lg"
              >
                Status do prazo de edição. Finalize até o horário limite ou solicite liberação ao gerente quando o prazo estiver bloqueado.
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="flex h-8 items-center gap-mx-xs whitespace-nowrap rounded-mx-full border border-border-default bg-white px-mx-sm text-[11px] font-semibold text-text-secondary shadow-mx-xs transition-colors hover:text-brand-primary"
          >
            <History size={13} />
            Histórico
          </button>
        </div>
      </div>

      {/* Histórico de Fechamentos Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-mx-black/40 backdrop-blur-xs p-mx-md" role="dialog" aria-modal="true" aria-label="Histórico de Fechamentos">
          <div className="w-full max-w-2xl rounded-2xl border border-border-default bg-white shadow-mx-2xl overflow-hidden flex flex-col max-h-[80vh] transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <header className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-base font-black text-brand-primary uppercase tracking-normal">
                  Histórico de Fechamentos
                </h2>
                <p className="text-xs font-semibold text-text-tertiary mt-0.5">
                  Visualize ou regularize seus fechamentos operacionais dos últimos 7 dias.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="p-1 rounded-full text-text-tertiary hover:bg-slate-200 transition-colors"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </header>

            {/* Content Table */}
            <div className="p-6 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-default text-[10px] font-black uppercase text-text-tertiary bg-slate-50">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Vendas</th>
                    <th className="py-2.5 px-3">Disciplina</th>
                    <th className="py-2.5 px-3">Finalização</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map(row => (
                    <tr key={row.date} className="border-b border-border-subtle hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3 font-extrabold text-text-primary">
                        {row.date.split('-').reverse().join('/')}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.finalized
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-text-secondary">
                        {row.sales}
                      </td>
                      <td className="py-3 px-3 font-bold text-text-secondary">
                        {row.score}
                      </td>
                      <td className="py-3 px-3 font-medium text-text-tertiary">
                        {row.time}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!row.finalized ? (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomReferenceDate(row.date)
                              setHistoryOpen(false)
                            }}
                            className="inline-flex h-7 items-center justify-center rounded-lg bg-brand-primary px-3 text-[10px] font-bold text-white hover:bg-brand-primary/90 transition-colors shadow-sm"
                          >
                            Regularizar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomReferenceDate(row.date)
                              setHistoryOpen(false)
                            }}
                            className="inline-flex h-7 items-center justify-center rounded-lg border border-border-default bg-white px-3 text-[10px] font-bold text-text-secondary hover:bg-slate-50 transition-colors shadow-xs"
                          >
                            Visualizar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <footer className="px-6 py-3 border-t border-border-default flex justify-end bg-slate-50">
              <Button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="h-8 px-4 text-xs font-bold bg-brand-primary text-white hover:bg-brand-primary/90 rounded-lg shadow-xs"
              >
                Fechar
              </Button>
            </footer>
          </div>
        </div>
      )}
    </header>
  )
}
