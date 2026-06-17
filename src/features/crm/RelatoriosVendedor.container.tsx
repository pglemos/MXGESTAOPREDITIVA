import { Card } from '@/components/molecules/Card'
import { PageHeader } from '@/components/molecules/PageHeader'
import { Typography } from '@/components/atoms/Typography'
import { useClientes } from '@/features/crm/hooks/useClientes'
import { useOportunidades } from '@/features/crm/hooks/useOportunidades'
import { useAtendimentos } from '@/features/crm/hooks/useAtendimentos'
import { useAgendamentos } from '@/features/crm/hooks/useAgendamentos'
import { useCadenciaAnalytics } from '@/features/crm/hooks/useCadenciaAnalytics'
import { CRM_ETAPA_LABEL, CRM_CANAL_LABEL } from '@/lib/schemas/crm.schema'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const CADENCIA_ETAPA_LABEL: Record<string, string> = {
  lead: 'Lead',
  contato: 'Contato',
  agendamento: 'Agendamento',
  visita: 'Visita',
  negociacao: 'Negociação',
  venda: 'Venda',
  atendimento: 'Atendimento',
}
const TIPO_VEICULO_LABEL: Record<string, string> = {
  carro: 'Carro',
  moto: 'Moto',
  caminhao: 'Caminhão',
  nao_informado: 'Não informado',
}

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
  const { funil, oportunidades } = useOportunidades()
  const { porCanal } = useAtendimentos()
  const { metrics: agenda } = useAgendamentos()
  const { analytics: cadenciaAnalytics, loading: cadenciaAnalyticsLoading, error: cadenciaAnalyticsError } = useCadenciaAnalytics(oportunidades)

  const maxEtapa = Math.max(1, ...funil.porEtapa.map(e => e.quantidade))
  const maxCanal = Math.max(1, porCanal.showroom, porCanal.carteira, porCanal.internet, porCanal.porta)
  const maxGargalo = Math.max(1, ...cadenciaAnalytics.gargalos.map(item => item.total))
  const maxDemanda = Math.max(1, ...cadenciaAnalytics.demandaVeiculos.map(item => item.quantidade))

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

        <Card className="border-none bg-white p-mx-lg shadow-mx-md">
          <div className="flex flex-col gap-mx-xs sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Typography variant="h3" className="uppercase tracking-tight">Analytics de cadência</Typography>
              <Typography variant="caption" tone="muted">
                Gargalos por etapa, demanda real e conversão por fluxo versionado.
              </Typography>
            </div>
            <div className="rounded-mx-md bg-surface-alt px-mx-md py-mx-sm text-right">
              <Typography variant="caption" tone="muted" className="uppercase tracking-wide">Clientes em cadência</Typography>
              <Typography variant="h2" className="mt-mx-xs text-2xl">{cadenciaAnalytics.totalEstados}</Typography>
            </div>
          </div>
          {cadenciaAnalyticsError && (
            <Typography variant="caption" tone="error" className="mt-mx-md block">
              Não foi possível carregar analytics de cadência: {cadenciaAnalyticsError}
            </Typography>
          )}
          {cadenciaAnalyticsLoading ? (
            <Typography variant="caption" tone="muted" className="mt-mx-lg block">Carregando analytics de cadência...</Typography>
          ) : cadenciaAnalytics.totalEstados === 0 ? (
            <Typography variant="caption" tone="muted" className="mt-mx-lg block">
              Os gargalos de cadência aparecem quando clientes entram no fluxo versionado.
            </Typography>
          ) : (
            <div className="mt-mx-lg grid grid-cols-1 gap-mx-lg xl:grid-cols-3">
              <div>
                <Typography variant="caption" tone="muted" className="uppercase tracking-wide">Gargalos por etapa</Typography>
                <div className="mt-mx-md flex flex-col gap-mx-sm">
                  {cadenciaAnalytics.gargalos.slice(0, 5).map(item => (
                    <BarRow
                      key={item.etapa}
                      label={CADENCIA_ETAPA_LABEL[item.etapa] || item.etapa}
                      value={item.total}
                      max={maxGargalo}
                      valueLabel={`${item.pendentes} pend. · ${item.semSucesso} sem sucesso · ${item.reagendamentosSemSucesso} reag.`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Typography variant="caption" tone="muted" className="uppercase tracking-wide">Demanda por veículo</Typography>
                <div className="mt-mx-md flex flex-col gap-mx-sm">
                  {cadenciaAnalytics.demandaVeiculos.slice(0, 5).map(item => (
                    <BarRow
                      key={item.tipo_veiculo}
                      label={TIPO_VEICULO_LABEL[item.tipo_veiculo] || item.tipo_veiculo}
                      value={item.quantidade}
                      max={maxDemanda}
                      valueLabel={`${item.quantidade} · ${BRL(item.valorTotal)}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Typography variant="caption" tone="muted" className="uppercase tracking-wide">Conversão por fluxo</Typography>
                <div className="mt-mx-md flex flex-col gap-mx-sm">
                  {cadenciaAnalytics.conversaoPorFluxo.slice(0, 5).map(item => (
                    <BarRow
                      key={`${item.fluxo_id}:${item.fluxo_version}`}
                      label={`Fluxo ${item.fluxo_id.slice(0, 8)} v${item.fluxo_version}`}
                      value={item.taxaConversao}
                      max={100}
                      valueLabel={`${item.taxaConversao}% · ${item.ganhos}/${item.totalClientes}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

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
