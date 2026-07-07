import { ChevronRight, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Typography } from '@/components/atoms/Typography'
import type { RemuneracaoEstimadaResultado } from '@/features/remuneracao/lib/comparativo'
import { DashboardCard, CardTitle, InlineStat } from './DashboardPrimitives'
import { BRL } from './format'

export function CommissionCard({ estimativa }: { estimativa?: RemuneracaoEstimadaResultado | null }) {
  const available = Boolean(estimativa?.disponivel)
  const value = available ? BRL(estimativa?.total ?? 0) : '—'
  const meta = estimativa?.meta ?? 0
  const vendasConsideradas = estimativa?.vendasConsideradas ?? 0
  const percent = estimativa?.atingimentoPercentual ?? 0

  return (
    <DashboardCard>
      <CardTitle icon={<DollarSign size={20} />} title="Comissão estimada" />
      <Typography variant="h1" className="mt-mx-md text-3xl">
        {value}
      </Typography>
      <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
        {available ? 'valor estimado' : 'plano de remuneração não cadastrado'}
      </Typography>
      <div className="mt-mx-md space-y-mx-xs text-sm">
        <InlineStat label="Meta individual" value={meta > 0 ? `${meta} vendas` : '—'} />
        <InlineStat label="Vendas consideradas" value={String(vendasConsideradas)} />
        <InlineStat label="Atingimento" value={meta > 0 ? `${percent}%` : '—'} success={available && percent >= 100} />
      </div>
      <div className="mt-mx-md rounded-mx-md bg-surface-alt p-mx-sm">
        <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
          {available
            ? 'Estimativa calculada com base nas regras cadastradas para a loja.'
            : 'Cadastre o plano para exibir comissão real nesta área.'}
        </Typography>
      </div>
      <Link to="/minha-remuneracao" className="mt-mx-md inline-flex items-center gap-mx-xs text-xs font-semibold text-brand-primary">
        Ver regra de comissão
        <ChevronRight size={14} />
      </Link>
    </DashboardCard>
  )
}
