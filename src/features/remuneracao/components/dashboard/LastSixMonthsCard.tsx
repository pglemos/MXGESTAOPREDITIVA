import { Trophy } from 'lucide-react'
import { formatBRLWhole } from './formatBRLWhole'

type Mes = { label: string; mes: string; comissao: number; isAtual: boolean }

export function LastSixMonthsCard({ historico }: { historico: Mes[] }) {
  if (!historico || historico.length === 0) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'var(--color-seller-card-bg)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Últimos 6 Meses</p>
        <p className="text-slate-500 text-sm">Sem histórico disponível ainda.</p>
      </div>
    )
  }

  const melhorComissao = Math.max(...historico.map(h => h.comissao))
  const maxVal = melhorComissao || 1

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--color-seller-card-bg)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mb-5">Últimos 6 Meses</p>
      <div className="space-y-3">
        {historico.map((mes, i) => {
          const isMelhor = mes.comissao === melhorComissao && melhorComissao > 0
          const barWidth = maxVal > 0 ? Math.max(4, Math.round((mes.comissao / maxVal) * 100)) : 4
          const label = mes.label.charAt(0).toUpperCase() + mes.label.slice(1)
          return (
            <div key={mes.mes || i} className="flex items-center gap-3">
              <span className="text-slate-400 text-sm w-24 flex-shrink-0">{label}</span>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 rounded-full h-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-2.5 rounded-full transition-all duration-700"
                    style={{
                      width: `${barWidth}%`,
                      background: mes.isAtual
                        ? 'linear-gradient(90deg, var(--color-seller-blue-strong), var(--color-seller-blue))'
                        : isMelhor
                          ? 'linear-gradient(90deg, var(--color-seller-green-strong), var(--color-seller-green))'
                          : 'linear-gradient(90deg, var(--color-seller-green-dark), var(--color-seller-green-strong))',
                      boxShadow: isMelhor ? '0 0 6px rgba(34,197,94,0.4)' : 'none',
                    }}
                  />
                </div>
                {isMelhor && <Trophy className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
              </div>
              <span className="text-sm font-bold tabular-nums w-24 text-right flex-shrink-0" style={{ color: mes.isAtual ? 'var(--color-seller-blue-soft)' : isMelhor ? 'var(--color-seller-green)' : 'var(--color-chart-axis-tick-muted)' }}>
                {formatBRLWhole(mes.comissao)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default LastSixMonthsCard
