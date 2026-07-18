import { Activity, Building2, Users } from 'lucide-react'
import {
  MxMetricCard,
} from '@/components/module/MxModuleVisualPrimitives'

interface CorporateMetricsSectionProps {
  isOwner: boolean
  metrics: {
    totalSellers: number
    totalStores: number
    activeStores: number
    avgDiscipline: number
  }
}

export function CorporateMetricsSection({
  isOwner,
  metrics,
}: CorporateMetricsSectionProps) {
  return (
    <section
      aria-label="Indicadores consolidados da rede"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      <MxMetricCard
        title={isOwner ? 'Minha rede' : 'Rede corporativa'}
        value={metrics.activeStores}
        detail={`${metrics.totalStores} unidades cadastradas`}
        icon={Building2}
        tone="brand"
      />
      <MxMetricCard
        title="Força de vendas"
        value={metrics.totalSellers}
        detail="Vendedores ativos na rede"
        icon={Users}
        tone="success"
      />
      <MxMetricCard
        title="Disciplina média"
        value={`${metrics.avgDiscipline}%`}
        detail={isOwner ? 'Execução média das lojas' : 'Aderência média aos registros diários'}
        icon={Activity}
        tone={metrics.avgDiscipline < 80 ? 'warning' : 'success'}
      />
    </section>
  )
}
