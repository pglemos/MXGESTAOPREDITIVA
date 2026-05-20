import { useNavigate } from 'react-router-dom'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { GlossaryHint } from '@/components/molecules/GlossaryHint'
import { isPerfilInternoMx } from '@/hooks/useAuth'
import type { UserRole } from '@/types/database'

type Seller = { name: string; checkin_today?: boolean }

type LatestDRE = { net_profit: number } | null

type KpisSectionProps = {
  role: UserRole | null
  isOwner: boolean
  metrics: {
    goalValue: number
    attainment: number
    totalSales: number
    totalLeads: number
    totalVis: number
    checkedInCount: number
  }
  sellers: Seller[] | null | undefined
  pendingDisciplineSellers: Seller[]
  latestDRE: LatestDRE
}

/**
 * 5 cards de KPI da loja (meta, vendido, leads, visitas, disciplina) + DRE
 * para perfis internos/dono. Extraído de DashboardLoja.tsx (Story 2.5).
 */
export function KpisSection({ role, isOwner, metrics, sellers, pendingDisciplineSellers, latestDRE }: KpisSectionProps) {
  const navigate = useNavigate()
  const sellersTotal = (sellers || []).length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-mx-md md:gap-mx-lg shrink-0">
      <Card className="p-mx-lg border-none bg-brand-secondary text-white shadow-mx-xl">
        <Typography variant="tiny" tone="white" className="opacity-50 mb-2 block font-black uppercase tracking-widest text-mx-tiny">Meta de Vendas</Typography>
        <Typography variant="h1" tone="white" className="text-4xl sm:text-5xl tabular-nums leading-none mb-2 tracking-tighter font-mono-numbers">{metrics.goalValue}</Typography>
        <Badge variant="outline" className="bg-white text-brand-secondary border-white font-black h-mx-md uppercase text-mx-tiny shadow-mx-sm">{metrics.attainment}% ATINGIDO</Badge>
      </Card>

      <Card className="p-mx-lg border-none shadow-mx-lg bg-white">
        <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny">Vendido Período</Typography>
        <Typography variant="h1" className="text-4xl sm:text-5xl tabular-nums leading-none mb-2 tracking-tighter font-mono-numbers">{metrics.totalSales}</Typography>
        <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest text-mx-tiny">REFERÊNCIA REAL-TIME</Typography>
      </Card>

      <Card className="p-mx-lg border-none shadow-mx-lg bg-white">
        <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny">Leads Gerados</Typography>
        <div className="flex items-baseline gap-mx-xs mb-2">
          <Typography variant="h1" className="text-4xl sm:text-5xl tabular-nums leading-none tracking-tighter font-mono-numbers">{metrics.totalLeads}</Typography>
          <Typography variant="h3" tone="muted" className="text-xl font-black uppercase opacity-20">LEADS</Typography>
        </div>
        <Typography variant="tiny" tone="info" className="font-black uppercase tracking-widest text-mx-tiny">ENTRADA DO FUNIL</Typography>
      </Card>

      <Card className="p-mx-lg border-none shadow-mx-lg bg-white">
        <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny">Visitas Realizadas</Typography>
        <div className="flex items-baseline gap-mx-xs mb-2">
          <Typography variant="h1" className="text-4xl sm:text-5xl tabular-nums leading-none tracking-tighter font-mono-numbers">{metrics.totalVis}</Typography>
          <Typography variant="h3" tone="muted" className="text-xl font-black uppercase opacity-20">VIS</Typography>
        </div>
        <Typography variant="tiny" tone="warning" className="font-black uppercase tracking-widest text-mx-tiny">MEIO DO FUNIL</Typography>
      </Card>

      <Card className="p-mx-lg border-none shadow-mx-lg bg-white">
        <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny">
          <GlossaryHint term="Saúde Disciplinar" definition="Percentual da equipe que realizou o lançamento diário obrigatório." />
        </Typography>
        <Typography
          variant="h1"
          tone={metrics.checkedInCount < sellersTotal ? 'error' : 'success'}
          className="text-4xl sm:text-5xl tabular-nums leading-none mb-2 tracking-tighter font-mono-numbers"
        >
          {metrics.checkedInCount}
          <span className="text-text-tertiary text-2xl font-black">/{sellersTotal}</span>
        </Typography>
        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-mx-tiny">REGISTROS SINCRONIZADOS</Typography>
        {pendingDisciplineSellers.length > 0 && (
          <div className="mt-mx-sm rounded-mx-xl border border-status-warning/20 bg-status-warning-surface p-mx-sm">
            <Typography variant="tiny" className="block font-black uppercase tracking-widest text-status-warning">Pendentes</Typography>
            <Typography variant="p" className="mt-mx-tiny text-sm text-status-warning line-clamp-2">
              {pendingDisciplineSellers.slice(0, 3).map(seller => seller.name).join(', ')}
              {pendingDisciplineSellers.length > 3 ? ` +${pendingDisciplineSellers.length - 3}` : ''}
            </Typography>
            {role === 'gerente' && (
              <Button type="button" variant="outline" size="sm" onClick={() => navigate('/rotina')} className="mt-mx-sm h-mx-9 rounded-mx-lg bg-white text-status-warning">
                Resolver na rotina
              </Button>
            )}
          </div>
        )}
      </Card>

      {(isPerfilInternoMx(role) || role === 'dono') && latestDRE && (
        <Card className="p-mx-lg bg-white shadow-mx-lg border-none animate-in slide-in-from-right duration-500 delay-300">
          <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny text-brand-primary">Lucratividade Preditiva (DRE)</Typography>
          <div className="flex items-baseline gap-mx-xs mb-mx-xs">
            <Typography variant="tiny" tone="muted" className="font-black text-mx-nano">R$</Typography>
            <Typography variant="h1" tone={latestDRE.net_profit >= 0 ? 'success' : 'error'} className="text-4xl sm:text-5xl tabular-nums leading-none tracking-tighter font-mono-numbers">
              {Math.round(latestDRE.net_profit).toLocaleString('pt-BR')}
            </Typography>
          </div>
          <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-mx-tiny">RESULTADO LÍQUIDO MÊS</Typography>
        </Card>
      )}
      {(isPerfilInternoMx(role) || role === 'dono') && !latestDRE && (
        <Card className="p-mx-lg bg-white shadow-mx-lg border-none">
          <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny text-brand-primary">Lucratividade Preditiva (DRE)</Typography>
          <Typography variant="h3" className="mb-mx-xs uppercase">DRE pendente</Typography>
          <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-mx-tiny">
            {isOwner ? 'SOLICITE CADASTRO AO ADMIN MX' : 'RESULTADO INDISPONÍVEL'}
          </Typography>
        </Card>
      )}
    </div>
  )
}

export default KpisSection
