import { DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Typography } from '@/components/atoms/Typography'
import type { RemuneracaoEstimadaResultado } from '@/features/remuneracao/lib/comparativo'
import { BRL } from './format'

export function EstimatedSalaryCard({ estimativa }: { estimativa: RemuneracaoEstimadaResultado }) {
  return (
    <Link
      to="/minha-remuneracao"
      aria-label="Salário estimado"
      className="block rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm transition-shadow hover:shadow-mx-md"
    >
      <div className="flex items-center gap-mx-sm">
        <DollarSign size={22} className="text-status-success" />
        <Typography variant="h3" className="text-sm uppercase tracking-normal">
          Salário estimado
        </Typography>
      </div>
      <Typography variant="h1" className="mt-mx-md text-4xl">
        {estimativa.disponivel ? BRL(estimativa.total) : '—'}
      </Typography>
      <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
        {estimativa.disponivel ? 'estimativa projetada do mês' : 'plano não cadastrado'}
      </Typography>
    </Link>
  )
}
