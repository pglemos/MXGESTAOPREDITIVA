import { ChevronRight, CheckCircle2, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Typography } from '@/components/atoms/Typography'
import type { AgendamentoComCliente } from '@/features/crm/hooks/useAgendamentos'
import { CRM_AGENDAMENTO_STATUS_LABEL } from '@/lib/schemas/crm.schema'
import { DashboardCard, PanelTitle } from './DashboardPrimitives'

const TIPO_LABEL: Record<string, string> = {
  visita: 'Visita',
  retorno: 'Retorno',
  test_drive: 'Test drive',
  entrega: 'Entrega',
  negociacao: 'Negociação',
}

export function ExecutionCenter({ items }: { items: AgendamentoComCliente[] }) {
  const routine = [
    'Organizar carteira do dia',
    'Fazer prospecção ativa',
    'Atualizar status dos clientes',
    'Contatar novos leads',
    'Pedir 2 indicações',
  ]

  return (
    <DashboardCard className="min-h-[310px]">
      <PanelTitle title="Central de Execução de Hoje" subtitle="Carteira, prospecção, status e próximos passos." />
      <div className="mt-mx-md space-y-mx-xs">
        {items.length === 0 ? (
          <div className="rounded-mx-md bg-surface-alt p-mx-md">
            <Typography variant="p" className="font-semibold text-text-primary">
              Rotina sugerida para movimentar sua meta hoje
            </Typography>
            <div className="mt-mx-sm grid gap-mx-xs sm:grid-cols-2">
              {routine.map((item) => (
                <span key={item} className="flex items-center gap-mx-xs text-sm text-text-secondary">
                  <CheckCircle2 size={15} className="text-status-success" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : (
          items.slice(0, 5).map((item) => <ExecutionItem key={item.id} item={item} />)
        )}
      </div>
      <div className="mt-mx-md flex flex-wrap gap-mx-sm">
        <Link to="/central-execucao" className="inline-flex h-10 flex-1 items-center justify-center gap-mx-xs rounded-mx-md bg-brand-primary px-mx-md text-sm font-semibold text-white">
          <Plus size={16} />
          Registrar ação
        </Link>
        <Link to="/central-execucao" className="inline-flex h-10 flex-1 items-center justify-center gap-mx-xs rounded-mx-md border border-brand-primary/30 bg-brand-primary/5 px-mx-md text-sm font-semibold text-brand-primary">
          Ver Central de Execução
          <ChevronRight size={16} />
        </Link>
      </div>
    </DashboardCard>
  )
}

function ExecutionItem({ item }: { item: AgendamentoComCliente }) {
  const time = new Date(item.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const tipo = TIPO_LABEL[item.tipo] || 'Ação'
  const status = CRM_AGENDAMENTO_STATUS_LABEL[item.status]
  const veiculo = item.oportunidade?.veiculo_interesse

  return (
    <div className="grid grid-cols-[58px_1fr_auto] items-center gap-mx-sm rounded-mx-md border border-border-subtle bg-white px-mx-sm py-mx-xs">
      <span className="rounded-mx-sm bg-brand-primary/10 px-2 py-1 text-center text-xs font-semibold text-brand-primary">
        {time}
      </span>
      <div className="min-w-0">
        <Typography variant="p" className="truncate text-sm font-semibold text-text-primary">
          {tipo}
        </Typography>
        <Typography variant="tiny" tone="muted" className="block truncate normal-case tracking-normal">
          {item.cliente?.nome || 'Cliente não informado'}
          {veiculo ? ` · ${veiculo}` : ''}
        </Typography>
      </div>
      <span className="rounded-mx-sm bg-surface-alt px-2 py-1 text-xs font-semibold text-text-secondary">
        {status}
      </span>
    </div>
  )
}
