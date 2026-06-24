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
  setMetricScope,
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
    <header className="shrink-0 pb-2 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-[26px] font-extrabold tracking-tight text-[#111827]">
            FECHAMENTO DIÁRIO
          </h1>

          <div className="inline-flex h-9 items-center gap-2 rounded-full border border-[#e5eaf2] bg-white px-4 text-sm font-semibold text-[#475569] shadow-sm">
            <CalendarDays size={14} className="text-[#2563eb]" />
            <span>{dateStr}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 items-center rounded-xl bg-[#2563eb] px-5 text-sm font-bold text-white shadow-sm">
            {metricScope === 'adjustment' ? 'Correções até 09:45' : `ATÉ ${CHECKIN_DEADLINE_LABEL}`}
          </span>

          <div className="relative">
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] px-5 text-sm font-bold text-[#2563eb] hover:bg-[#eff6ff]/80 transition-colors"
              aria-expanded={infoOpen}
              aria-controls="checkin-status-info"
              onClick={() => setInfoOpen(current => !current)}
            >
              <span className="truncate uppercase">{statusText}</span>
              <Info size={14} className="shrink-0" />
            </button>
            {infoOpen && (
              <div
                id="checkin-status-info"
                role="status"
                className="absolute right-0 top-12 z-20 w-64 rounded-xl border border-[#e5eaf2] bg-white p-4 text-xs font-medium normal-case leading-relaxed text-[#475569] shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
              >
                Status do prazo de edição. Finalize até o horário limite ou solicite liberação ao gerente quando o prazo estiver bloqueado.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e5eaf2] bg-white px-5 text-sm font-bold text-[#334155] shadow-sm hover:bg-[#f8fafc] transition-colors"
          >
            <History size={14} />
            Histórico
          </button>
        </div>
      </div>

      {/* Tabs / Abas Fechamento Diário / Ajuste Técnico */}
      <div className="inline-flex h-12 items-center rounded-xl border border-[#e5eaf2] bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setMetricScope('daily')}
          className={`h-10 rounded-lg px-6 text-sm font-bold transition-all ${
            metricScope === 'daily'
              ? 'text-[#111827] border-b-2 border-[#2563eb]'
              : 'text-[#94a3b8] hover:text-[#475569]'
          }`}
        >
          FECHAMENTO DIÁRIO
        </button>
        <button
          type="button"
          onClick={() => setMetricScope('adjustment')}
          className={`h-10 rounded-lg px-6 text-sm font-bold transition-all ${
            metricScope === 'adjustment'
              ? 'text-[#111827] border-b-2 border-[#2563eb]'
              : 'text-[#94a3b8] hover:text-[#475569]'
          }`}
        >
          AJUSTE TÉCNICO
        </button>
      </div>

      {/* Histórico de Fechamentos Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 backdrop-blur-[3px] p-4" role="dialog" aria-modal="true" aria-label="Histórico de Fechamentos">
          <div className="w-full max-w-2xl rounded-2xl border border-[#e5eaf2] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] overflow-hidden flex flex-col max-h-[80vh] transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <header className="px-6 py-5 border-b border-[#eef2f7] flex items-center justify-between bg-[#f8fafc]">
              <div>
                <h2 className="text-lg font-extrabold text-[#111827] uppercase tracking-tight">
                  Histórico de Fechamentos
                </h2>
                <p className="text-xs font-semibold text-[#64748b] mt-1">
                  Visualize ou regularize seus fechamentos operacionais dos últimos 7 dias.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </header>

            {/* Content Table */}
            <div className="p-6 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5eaf2] text-[10px] font-black uppercase text-[#94a3b8] bg-[#f8fafc]">
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
                    <tr key={row.date} className="border-b border-[#eef2f7] hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3 font-extrabold text-[#111827]">
                        {row.date.split('-').reverse().join('/')}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.finalized
                            ? 'bg-[#ecfdf5] text-[#16a34a] border border-[#bbf7d0]'
                            : 'bg-[#fef2f2] text-[#ef4444] border border-[#fecaca]'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-[#475569]">
                        {row.sales}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#475569]">
                        {row.score}
                      </td>
                      <td className="py-3 px-3 font-medium text-[#94a3b8]">
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
                            className="inline-flex h-7 items-center justify-center rounded-lg bg-[#2563eb] px-3 text-[10px] font-bold text-white hover:bg-[#1d4ed8] transition-colors shadow-sm"
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
                            className="inline-flex h-7 items-center justify-center rounded-lg border border-[#e5eaf2] bg-white px-3 text-[10px] font-bold text-[#475569] hover:bg-slate-50 transition-colors shadow-sm"
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
            <footer className="px-6 py-4 border-t border-[#eef2f7] flex justify-end bg-[#f8fafc]">
              <Button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="h-10 px-5 text-xs font-bold bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl shadow-sm transition-colors"
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
