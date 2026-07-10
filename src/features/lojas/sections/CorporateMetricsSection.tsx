import { Typography } from '@/components/atoms/Typography'
import { Card, CardContent } from '@/components/molecules/Card'
import { GlossaryHint } from '@/components/molecules/GlossaryHint'

interface CorporateMetricsSectionProps {
  isOwner: boolean
  metrics: {
    totalSellers: number
    totalStores: number
    activeStores: number
    avgDiscipline: number
  }
}

/**
 * Painel "Rede / Corporativo" com KPIs consolidados.
 *
 * Extraído de `src/pages/Lojas.tsx` (Story 3.5 reconciliada, ADR-0050).
 */
export function CorporateMetricsSection({ isOwner, metrics }: CorporateMetricsSectionProps) {
  return (
    <section className="mb-mx-md">
      <Card className="rounded-mx-lg border border-border-subtle bg-white shadow-mx-sm">
        <CardContent className="p-mx-md sm:p-mx-lg flex flex-wrap gap-mx-md items-center justify-between sm:justify-start">
          <div className="flex flex-col min-w-mx-20">
            <Typography
              variant="tiny"
              className="font-black text-text-label uppercase tracking-mx-widest mb-mx-tiny"
            >
              {isOwner ? 'Minha Rede' : 'Rede / Corporativo'}
            </Typography>
            <Typography variant="h2" className="text-brand-primary">
              {metrics.totalStores}
            </Typography>
            <Typography variant="tiny" tone="muted" className="uppercase font-black text-mx-tiny">
              Unidades ativas
            </Typography>
          </div>
          <div className="w-px h-mx-12 bg-border-subtle hidden sm:block" />
          <div className="flex flex-col min-w-mx-20">
            <Typography
              variant="tiny"
              className="font-black text-text-label uppercase tracking-mx-widest mb-mx-tiny"
            >
              Força de Vendas
            </Typography>
            <Typography variant="h2" className="text-status-success">
              {metrics.totalSellers}
            </Typography>
            <Typography variant="tiny" tone="muted" className="uppercase font-black text-mx-tiny">
              Especialistas Ativos
            </Typography>
          </div>
          <div className="w-px h-mx-12 bg-border-subtle hidden sm:block" />
          <div className="flex flex-col min-w-mx-20">
            <Typography
              variant="tiny"
              className="font-black text-text-label uppercase tracking-mx-wide mb-mx-tiny"
            >
              <GlossaryHint
                term="Aderência"
                definition="Média de disciplina diária das lojas ativas com equipe cadastrada."
              />
            </Typography>
            <Typography variant="h2" tone={metrics.avgDiscipline < 80 ? 'error' : 'success'}>
              {metrics.avgDiscipline}%
            </Typography>
            <Typography variant="tiny" tone="muted" className="uppercase font-black text-mx-tiny">
              {isOwner ? 'Execução média' : 'Disciplina média'}
            </Typography>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
