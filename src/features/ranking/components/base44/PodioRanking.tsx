import { Trophy } from 'lucide-react'
import { RankingAvatar } from './RankingAvatar'
import type { RankedVendedor } from '../../hooks/useStoreRankingPageData'

const PEDESTAL = [
  { pos: 2, label: '2º', bg: 'linear-gradient(180deg,#cbd5e1,#94a3b8)', height: 56, order: 1 },
  { pos: 1, label: '1º', bg: 'linear-gradient(180deg,#FDE68A,#F59E0B)', height: 80, order: 2 },
  { pos: 3, label: '3º', bg: 'linear-gradient(180deg,#e9c57e,#CD7F32)', height: 40, order: 3 },
] as const

function formatVendas(v: number) {
  return `${v} vendas`
}

export function PodioRanking({ top3 }: { top3: RankedVendedor[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex-1">
      <h2 className="text-[15px] font-bold text-slate-800 mb-4">Pódio do Período</h2>
      <div className="flex items-end justify-center gap-3 sm:gap-6 mt-2 pb-2">
        {PEDESTAL.map(({ pos, label, bg, height, order }) => {
          const v = top3[pos - 1]
          if (!v) {
            return (
              <div key={pos} className="flex flex-col items-center gap-2" style={{ order }}>
                <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                  <span className="text-slate-300 text-lg font-bold">{pos}</span>
                </div>
                <div className="rounded-t-md w-16 sm:w-20" style={{ height, background: bg, opacity: 0.4 }} />
              </div>
            )
          }
          return (
            <div key={pos} className="flex flex-col items-center gap-1.5" style={{ order }}>
              {pos === 1 && (
                <Trophy
                  className="w-6 h-6 mb-0.5"
                  style={{ color: '#F59E0B', filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' }}
                  fill="currentColor"
                />
              )}
              <RankingAvatar
                nome={v.nome}
                foto={v.foto}
                size={pos === 1 ? 68 : 56}
                border={pos === 1 ? '4px solid #F59E0B' : '3px solid #e2e8f0'}
              />
              <div className="text-center mt-1">
                <p className="text-[13px] font-bold text-slate-800 leading-tight">{v.nome?.split(' ')[0]}</p>
                <p className="text-[11px] font-semibold" style={{ color: '#00A896' }}>{formatVendas(v.vendas)}</p>
              </div>
              <div className="relative rounded-t-md flex items-center justify-center w-16 sm:w-20" style={{ height, background: bg }}>
                <span className="text-white font-black text-xl drop-shadow">{label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PodioRanking
