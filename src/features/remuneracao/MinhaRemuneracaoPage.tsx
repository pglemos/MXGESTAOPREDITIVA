import { useState } from 'react'
import { AlertTriangle, Calendar, ChevronDown, RefreshCw, TrendingUp } from 'lucide-react'
import { SellerPageHeader } from '@/components/seller/SellerPageHeader'
import { useMinhaRemuneracaoDashboard } from './hooks/useMinhaRemuneracaoDashboard'
import { CommissionHeroCard } from './components/dashboard/CommissionHeroCard'
import { MilestoneCard } from './components/dashboard/MilestoneCard'
import { HotOpportunitiesCard } from './components/dashboard/HotOpportunitiesCard'
import { PerformanceCard } from './components/dashboard/PerformanceCard'
import { PotentialCommissionCard } from './components/dashboard/PotentialCommissionCard'
import { LastSixMonthsCard } from './components/dashboard/LastSixMonthsCard'
import { RecordRoutineCard } from './components/dashboard/RecordRoutineCard'
import { CalculationDetailsDrawer } from './components/dashboard/CalculationDetailsDrawer'

function saudacaoPorHora(): string {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

/**
 * Dashboard financeiro do vendedor — reproduz 1:1 o protótipo Base44
 * (src/base44-reference/pages/VendedorDashboard.jsx): hero de comissão escuro
 * com brilho verde, marco/milestone, oportunidades quentes, desempenho,
 * potencial e histórico de 6 meses. Dados via `useMinhaRemuneracaoDashboard`
 * (motor de cálculo real do MX, não o engine do Base44).
 */
export default function MinhaRemuneracaoPage() {
  const data = useMinhaRemuneracaoDashboard()
  const [showCalcDrawer, setShowCalcDrawer] = useState(false)

  if (data.isLoading) {
    return (
      <div className="-m-6 lg:-m-8 min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--color-seller-screen-bg)' }}>
        <div className="w-10 h-10 border-4 border-emerald-900 border-t-emerald-400 rounded-full animate-spin" />
        <p className="text-slate-400 font-medium">Calculando sua comissão do mês...</p>
      </div>
    )
  }

  if (data.error) {
    return (
      <div className="-m-6 lg:-m-8 min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--color-seller-screen-bg)' }}>
        <p className="text-slate-400 font-medium">{data.error}</p>
        <button type="button" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold">
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </button>
      </div>
    )
  }

  const userName = data.profile?.name?.split(' ')[0] || 'Vendedor'

  return (
    <div className="pb-10 -m-6 lg:-m-8 min-h-screen" style={{ background: 'var(--color-seller-screen-bg)' }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-5">
<SellerPageHeader className="border-white/10 bg-[#071723] shadow-none [&_h1]:text-white [&_p]:text-slate-400 [&>div>svg]:text-emerald-400" icon={TrendingUp} title="Início" subtitle={`${saudacaoPorHora()}, ${userName}. Foque no que importa. Venda mais e ganhe mais.`} actions={(<div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white"><Calendar className="w-4 h-4 text-emerald-400" />Este mês<ChevronDown className="w-4 h-4 text-slate-400" /></div>)} />

        {!data.disponivel && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-amber-300 text-sm">O plano de remuneração do cargo Vendedor ainda não foi cadastrado para sua loja.</p>
          </div>
        )}

        <CommissionHeroCard
          comissaoEstimada={data.comissaoEstimada}
          qtdVendas={data.qtdVendas}
          onVerCalculo={() => setShowCalcDrawer(true)}
          semPolitica={!data.disponivel}
          detalhesVisiveis={data.detalhesVisiveis}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <MilestoneCard {...data.milestone} />
          <HotOpportunitiesCard qtdOportunidades={data.oportunidadesQuentesCount} comissaoPotencial={data.comissaoPotencialOportunidades} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <PerformanceCard melhorMes={data.melhorMes} comissaoAtual={data.comissaoEstimada} />
          <PotentialCommissionCard
            comissaoProjetada={data.comissaoEstimada + data.comissaoPotencialOportunidades}
            ganhoPotencial={data.comissaoPotencialOportunidades}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <LastSixMonthsCard historico={data.historico6Meses} />
          <RecordRoutineCard melhorMes={data.melhorMes} />
        </div>

        <div className="text-center pt-4 pb-2">
          <p className="text-slate-500 text-sm">
            <span className="text-emerald-500">⚡</span> Disciplina hoje, liberdade amanhã. Você no controle dos seus resultados.
          </p>
        </div>
      </div>

      {data.detalhesVisiveis && (
        <CalculationDetailsDrawer open={showCalcDrawer} onClose={() => setShowCalcDrawer(false)} calculo={data.calculo} />
      )}
    </div>
  )
}
