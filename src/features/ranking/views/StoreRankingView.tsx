import { Info, Trophy } from 'lucide-react'
import { SellerPageHeader } from '@/components/seller/SellerPageHeader'
import { RankingErrorBoundary } from '@/features/ranking/components/RankingErrorBoundary'
import { PodioRanking } from '@/features/ranking/components/base44/PodioRanking'
import { SuaPosicao } from '@/features/ranking/components/base44/SuaPosicao'
import { CorridaPeriodo } from '@/features/ranking/components/base44/CorridaPeriodo'
import { BonificacaoPeriodo } from '@/features/ranking/components/base44/BonificacaoPeriodo'
import { TabelaRanking } from '@/features/ranking/components/base44/TabelaRanking'
import { RANKING_PERIODOS, useStoreRankingPageData } from '@/features/ranking/hooks/useStoreRankingPageData'

/**
 * Ranking por Loja — reproduz 1:1 a estrutura do protótipo Base44
 * (src/base44-reference/pages/Ranking.jsx): topbar com trófeu + avatar,
 * abas de período, Pódio + Sua posição, Corrida + Bonificação, Tabela.
 */
export function StoreRankingView() {
  const data = useStoreRankingPageData()

  if (data.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-green-500 rounded-full animate-spin" />
      </div>
    )
  }

  const me = data.profile

  return (
    <RankingErrorBoundary sectionName="Ranking da Loja">
      <div className="min-h-screen bg-slate-50 p-4 font-body sm:p-6">
        <SellerPageHeader
          icon={Trophy}
          title="Ranking"
          subtitle="Acompanhe sua posição, a corrida do período e as bonificações da loja."
          actions={(
            <>
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1 flex-wrap">
              {RANKING_PERIODOS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => data.setPeriodo(p)}
                  className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
                    data.periodo === p
                      ? 'bg-white text-green-700 shadow-sm border border-green-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="ranking-unidade" className="text-[11px] font-semibold text-slate-500">
                Unidade
              </label>
              <select
                id="ranking-unidade"
                value={data.unidade}
                onChange={e => data.setUnidade(e.target.value)}
                className="text-[12px] border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <option value="todas">Todas as unidades</option>
                {data.unidades.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            {me && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-[13px] font-bold text-white">
                  {(me.name || 'U').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-[12px] font-semibold leading-tight text-slate-800">{me.name}</p>
                  <p className="text-[10px] text-slate-400">Vendedor</p>
                </div>
              </div>
            )}
            </>
          )}
        />

        <div className="space-y-5 pt-4">

          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2">
            <Info className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-[12px] text-green-800">
              <strong>Critério configurado pela loja:</strong> Volume de vendas.{' '}
              <span className="text-green-600">A meta individual é calculada pelas regras da unidade.</span>
            </p>
          </div>

          {data.error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700">
              {data.error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <PodioRanking top3={data.top3} />
            {data.euVendedor && (
              <SuaPosicao
                posicao={data.posicao}
                total={data.totalVendedores}
                atingimento={data.atingimento}
                faltamValor={data.faltamValor}
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <CorridaPeriodo vendedores={data.vendedores.slice(0, 8)} meta={data.metaPeriodo} meuId={data.meuId} />
            <BonificacaoPeriodo />
          </div>

          <TabelaRanking vendedores={data.vendedores} meta={data.metaPeriodo} meuId={data.meuId} />
        </div>
      </div>
    </RankingErrorBoundary>
  )
}

export default StoreRankingView
