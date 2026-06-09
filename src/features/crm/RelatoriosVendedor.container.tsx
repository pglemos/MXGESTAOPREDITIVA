import { Card } from '@/components/molecules/Card'
import { PageHeader } from '@/components/molecules/PageHeader'
import { Typography } from '@/components/atoms/Typography'
import { useClientes } from '@/features/crm/hooks/useClientes'
import { useOportunidades } from '@/features/crm/hooks/useOportunidades'
import { useAtendimentos } from '@/features/crm/hooks/useAtendimentos'
import { useAgendamentos } from '@/features/crm/hooks/useAgendamentos'
import { CRM_ETAPA_LABEL, CRM_CANAL_LABEL } from '@/lib/schemas/crm.schema'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-md">
      <Typography variant="caption" tone="muted" className="uppercase tracking-wide">{label}</Typography>
      <Typography variant="h2" className="mt-mx-xs text-2xl">{value}</Typography>
      {hint && <Typography variant="caption" tone="muted">{hint}</Typography>}
    </Card>
  )
}

function BarRow({ label, value, max, valueLabel }: { label: string; value: number; max: number; valueLabel?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-mx-md">
      <div className="w-40 shrink-0"><Typography variant="p" className="font-medium">{label}</Typography></div>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-alt">
        <div className="h-full rounded-full bg-brand-secondary" style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
      <div className="w-24 shrink-0 text-right"><Typography variant="p" className="font-semibold">{valueLabel ?? value}</Typography></div>
    </div>
  )
}

export function RelatoriosVendedor() {
  const { metrics: clienteMetrics, clientes } = useClientes()
  const { funil } = useOportunidades()
  const { porCanal } = useAtendimentos()
  const { metrics: agenda } = useAgendamentos()

  const maxEtapa = Math.max(1, ...funil.porEtapa.map(e => e.quantidade))
  const maxCanal = Math.max(1, porCanal.showroom, porCanal.carteira, porCanal.internet, porCanal.porta)

  return (
    <main className="w-full h-full overflow-y-auto bg-surface-alt p-mx-md md:p-mx-lg no-scrollbar">
      <div className="flex flex-col gap-mx-lg pb-28">
        <PageHeader title="Relatórios" description="Visão consolidada da sua performance comercial — dados reais." />

        <section className="grid grid-cols-2 gap-mx-md md:grid-cols-3 xl:grid-cols-6" aria-label="KPIs">
          <KpiCard label="Clientes" value={String(clienteMetrics.total)} />
          <KpiCard label="Oportunidades" value={String(funil.totalOportunidades)} />
          <KpiCard label="Taxa Conversão" value={`${funil.taxaConversaoGeral}%`} />
          <KpiCard label="Ticket Médio" value={BRL(funil.ticketMedio)} />
          <KpiCard label="Vendas" value={String(funil.ganhos.quantidade)} hint={BRL(funil.ganhos.valor)} />
          <KpiCard label="Atendimentos hoje" value={String(porCanal.total)} />
        </section>

        <div className="grid grid-cols-1 gap-mx-lg xl:grid-cols-2">
          <Card className="border-none bg-white p-mx-lg shadow-mx-md">
            <Typography variant="h3" className="uppercase tracking-tight">Oportunidades por etapa</Typography>
            <div className="mt-mx-lg flex flex-col gap-mx-md">
              {funil.porEtapa.map(e => (
                <BarRow key={e.etapa} label={CRM_ETAPA_LABEL[e.etapa]} value={e.quantidade} max={maxEtapa} valueLabel={`${e.quantidade} · ${BRL(e.valor)}`} />
              ))}
            </div>
          </Card>

          <Card className="border-none bg-white p-mx-lg shadow-mx-md">
            <Typography variant="h3" className="uppercase tracking-tight">Atendimentos por canal (hoje)</Typography>
            <div className="mt-mx-lg flex flex-col gap-mx-md">
              <BarRow label={CRM_CANAL_LABEL.showroom} value={porCanal.showroom} max={maxCanal} />
              <BarRow label={CRM_CANAL_LABEL.carteira} value={porCanal.carteira} max={maxCanal} />
              <BarRow label={CRM_CANAL_LABEL.internet} value={porCanal.internet} max={maxCanal} />
              <BarRow label={CRM_CANAL_LABEL.porta} value={porCanal.porta} max={maxCanal} />
            </div>
            <div className="mt-mx-lg border-t border-border-subtle pt-mx-md">
              <Typography variant="caption" tone="muted" className="uppercase tracking-wide">Carteira por status</Typography>
              <div className="mt-mx-sm grid grid-cols-2 gap-mx-sm sm:grid-cols-3">
                <StatusPill label="Ativos" value={clienteMetrics.ativos} />
                <StatusPill label="Oportunidades" value={clienteMetrics.oportunidades} />
                <StatusPill label="Pós-venda" value={clienteMetrics.posVenda} />
                <StatusPill label="Aguardando" value={clienteMetrics.aguardando} />
                <StatusPill label="Inativos" value={clienteMetrics.inativos} />
                <StatusPill label="Agend. hoje" value={agenda.agendamentosHoje} />
              </div>
            </div>
          </Card>
        </div>

        {clientes.length === 0 && (
          <Typography variant="caption" tone="muted">Os relatórios se preenchem conforme você cadastra clientes, oportunidades e atendimentos.</Typography>
        )}
      </div>
    </main>
  )
}

function StatusPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-mx-md bg-surface-alt p-mx-sm text-center">
      <Typography variant="h3" className="text-lg">{value}</Typography>
      <Typography variant="caption" tone="muted">{label}</Typography>
    </div>
  )
}

export default RelatoriosVendedor
