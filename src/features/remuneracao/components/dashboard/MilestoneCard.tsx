import { Trophy } from 'lucide-react'
import { formatBRLWhole } from './formatBRLWhole'

type Props = {
  veiculosFaltam: number
  valorProjetado: number
  percentual: number
  semDados: boolean
}

export function MilestoneCard({ veiculosFaltam, valorProjetado, percentual, semDados }: Props) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background: 'linear-gradient(135deg, var(--color-seller-milestone-bg-start) 0%, var(--color-seller-milestone-bg-mid) 50%, var(--color-seller-milestone-bg-end) 100%)',
        border: '1px solid rgba(245,158,11,0.2)',
        boxShadow: '0 0 30px rgba(245,158,11,0.05)',
      }}
    >
      <div className="absolute top-4 right-4 opacity-70">
        <Trophy className="w-14 h-14" style={{ color: 'var(--color-status-warning)', filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.5))' }} />
      </div>

      <div className="relative z-10">
        {semDados ? (
          <div>
            <p className="text-slate-300 text-sm font-semibold">Sem vendas no período</p>
            <p className="text-slate-500 text-xs mt-1">Registre vendas para ver seu próximo marco financeiro.</p>
          </div>
        ) : (
          <>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Faltam</p>
            <div className="flex items-baseline gap-2">
              <span className="font-black text-white" style={{ fontSize: '4rem', lineHeight: 1 }}>{veiculosFaltam}</span>
              <span className="text-amber-400 text-2xl font-bold">veículo{veiculosFaltam !== 1 ? 's' : ''}</span>
            </div>
            <p className="text-slate-400 text-sm mt-1">para você ganhar</p>
            <p className="font-black mt-1" style={{ fontSize: '2rem', color: 'var(--color-status-warning)', textShadow: '0 0 15px rgba(245,158,11,0.3)' }}>
              {formatBRLWhole(valorProjetado)}
            </p>

            <div className="mt-5">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-slate-400 text-xs">Sua meta de comissão</span>
                <span className="text-slate-300 text-xs font-semibold">{formatBRLWhole(valorProjetado)}</span>
              </div>
              <div className="w-full rounded-full h-2.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${percentual}%`, background: 'linear-gradient(90deg, var(--color-status-warning), var(--color-status-warning))', boxShadow: '0 0 8px rgba(245,158,11,0.5)' }}
                />
              </div>
              <p className="text-right text-amber-400 text-xs font-bold mt-1">{percentual}%</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MilestoneCard
