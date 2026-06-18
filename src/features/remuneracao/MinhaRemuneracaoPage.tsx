import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  BadgeDollarSign,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Info,
  Target,
  Wallet,
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { EmptyState } from '@/components/atoms/EmptyState'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { PageHeading } from '@/components/molecules/PageHeading'
import { cn } from '@/lib/utils'
import { useVendedorHomePage } from '@/features/vendedor-home/hooks/useVendedorHomePage'
import type {
  RemuneracaoBonusPatamarDetalhe,
  RemuneracaoEstimadaResultado,
  RemuneracaoPlano,
  RemuneracaoResumoVendedor,
} from './hooks/useRemuneracao'

type ViewMode = 'projetado' | 'realizado'

export default function MinhaRemuneracaoPage() {
  const home = useVendedorHomePage()
  const [mode, setMode] = useState<ViewMode>('projetado')

  if (home.isLoading || !home.metrics) {
    return <MinhaRemuneracaoLoading />
  }

  if (home.remunerationError) {
    return (
      <PageShell>
        <EmptyState
          icon={<AlertTriangle size={28} />}
          title="Não foi possível carregar sua remuneração"
          description="Tente novamente em alguns minutos. Se o problema continuar, procure seu gerente, dono ou Admin MX."
          action={<Button asChild><Link to="/home">Voltar para Meu Dia</Link></Button>}
        />
      </PageShell>
    )
  }

  const resumo = home.remuneracaoResumo
  const calculo = mode === 'projetado' ? resumo.projetado : resumo.realizado

  if (!calculo.disponivel) {
    return (
      <PageShell>
        <EmptyState
          icon={<Wallet size={28} />}
          title="Remuneração pendente"
          description="O plano de remuneração do cargo Vendedor ainda não foi cadastrado para sua loja. Procure seu gerente, dono ou Admin MX."
          action={<Button asChild><Link to="/home">Voltar para Meu Dia</Link></Button>}
        />
      </PageShell>
    )
  }

  return (
    <main className="h-full w-full overflow-y-auto bg-surface-alt p-mx-lg no-scrollbar">
      <div className="flex w-full flex-col gap-mx-lg pb-28">
        <PageHeading
          title="Minha Remuneração"
          subtitle="Acompanhe como seu plano, suas vendas e sua meta formam a remuneração estimada do mês."
          breadcrumb={
            <nav aria-label="Breadcrumb" className="flex items-center gap-mx-xs text-xs font-bold uppercase tracking-widest text-text-tertiary">
              <Link to="/home" className="text-brand-primary hover:underline">Meu Dia</Link>
              <span aria-hidden="true">/</span>
              <span>Minha Remuneração</span>
            </nav>
          }
          actions={
            <Button asChild variant="outline">
              <Link to="/home">
                <ArrowLeft size={16} className="mr-2" />
                Voltar para Meu Dia
              </Link>
            </Button>
          }
        />

        <section className="flex flex-col gap-mx-md border-b border-border-default pb-mx-lg md:flex-row md:items-end md:justify-between">
          <div>
            <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-widest">
              Visão do cálculo
            </Typography>
            <Typography variant="h2" className="mt-mx-xs">
              {mode === 'projetado' ? 'Projeção no fechamento do mês' : 'Acumulado realizado até hoje'}
            </Typography>
          </div>
          <div className="inline-flex w-full rounded-mx-xl border border-border-default bg-white p-mx-tiny shadow-mx-sm md:w-auto" role="group" aria-label="Selecionar visão da remuneração">
            <ModeButton active={mode === 'projetado'} onClick={() => setMode('projetado')}>
              Projeção
            </ModeButton>
            <ModeButton active={mode === 'realizado'} onClick={() => setMode('realizado')}>
              Realizado
            </ModeButton>
          </div>
        </section>

        <SummarySection resumo={resumo} calculo={calculo} mode={mode} />
        <PendingAlerts calculo={calculo} />
        <PlanBreakdown calculo={calculo} plano={home.remuneracaoPlano} />
        <CommissionBreakdown calculo={calculo} />
        <BonusBreakdown calculo={calculo} />
        <FormulaBreakdown calculo={calculo} />

        <section className="flex items-start gap-mx-sm rounded-mx-xl border border-status-info/20 bg-status-info-surface p-mx-md text-status-info">
          <Info size={18} className="mt-mx-tiny shrink-0" aria-hidden="true" />
          <Typography variant="p" className="text-sm font-bold text-status-info">
            Este valor é uma estimativa baseada no plano e nas regras cadastradas. Não substitui folha de pagamento, descontos, impostos ou holerite.
          </Typography>
        </section>
      </div>
    </main>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="h-full w-full overflow-y-auto bg-surface-alt p-mx-lg no-scrollbar">
      <div className="mx-auto flex min-h-full w-full max-w-4xl items-center justify-center py-mx-xl">
        {children}
      </div>
    </main>
  )
}

function MinhaRemuneracaoLoading() {
  return (
    <main className="h-full w-full overflow-y-auto bg-surface-alt p-mx-md no-scrollbar md:p-mx-lg" aria-busy="true">
      <div className="grid w-full gap-mx-lg">
        <div className="h-mx-20 animate-pulse rounded-mx-xl bg-white" />
        <div className="grid gap-mx-md md:grid-cols-3">
          <div className="h-mx-40 animate-pulse rounded-mx-xl bg-white" />
          <div className="h-mx-40 animate-pulse rounded-mx-xl bg-white" />
          <div className="h-mx-40 animate-pulse rounded-mx-xl bg-white" />
        </div>
        <div className="h-mx-80 animate-pulse rounded-mx-xl bg-white" />
      </div>
    </main>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-mx-10 flex-1 rounded-mx-lg px-mx-md py-mx-xs text-xs font-bold uppercase tracking-widest transition-colors md:flex-none',
        active ? 'bg-brand-primary text-white' : 'text-text-secondary hover:bg-surface-alt',
      )}
    >
      {children}
    </button>
  )
}

function SummarySection({
  resumo,
  calculo,
  mode,
}: {
  resumo: RemuneracaoResumoVendedor
  calculo: RemuneracaoEstimadaResultado
  mode: ViewMode
}) {
  return (
    <section className="grid gap-mx-md md:grid-cols-2 xl:grid-cols-4" aria-label="Resumo da remuneração">
      <SummaryCard
        icon={<Wallet size={22} />}
        label="Remuneração realizada"
        value={formatCurrency(resumo.realizado.total)}
        detail={`${resumo.realizado.vendasConsideradas} venda(s) até hoje`}
        tone={mode === 'realizado' ? 'brand' : 'info'}
      />
      <SummaryCard
        icon={<Wallet size={22} />}
        label="Remuneração projetada"
        value={formatCurrency(resumo.projetado.total)}
        detail={`${resumo.projetado.vendasConsideradas} venda(s) no fechamento`}
        tone={mode === 'projetado' ? 'brand' : 'info'}
      />
      <SummaryCard
        icon={<CircleDollarSign size={22} />}
        label="Comissão"
        value={formatCurrency(calculo.comissao)}
        detail={commissionSummary(calculo)}
        tone={calculo.regraComissaoAplicada ? 'success' : 'warning'}
      />
      <SummaryCard
        icon={<Target size={22} />}
        label="Atingimento da meta"
        value={`${calculo.atingimentoPercentual}%`}
        detail={calculo.meta > 0 ? `${calculo.vendasConsideradas} de ${calculo.meta} vendas` : 'meta pendente'}
        tone={calculo.meta > 0 ? 'info' : 'warning'}
      />
    </section>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
  tone: 'brand' | 'success' | 'warning' | 'info'
}) {
  const toneClasses = {
    brand: 'border-mx-indigo-100 bg-mx-indigo-50 text-brand-primary',
    success: 'border-status-success/20 bg-status-success-surface text-status-success',
    warning: 'border-status-warning/20 bg-status-warning-surface text-status-warning',
    info: 'border-status-info/20 bg-status-info-surface text-status-info',
  }[tone]

  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-md">
      <span className={cn('flex h-mx-11 w-mx-11 items-center justify-center rounded-mx-xl border', toneClasses)} aria-hidden="true">
        {icon}
      </span>
      <Typography variant="tiny" tone="muted" className="mt-mx-md block font-bold uppercase tracking-widest">
        {label}
      </Typography>
      <Typography variant="h1" className="mt-mx-xs text-3xl font-mono-numbers">
        {value}
      </Typography>
      <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">
        {detail}
      </Typography>
    </Card>
  )
}

function PendingAlerts({ calculo }: { calculo: RemuneracaoEstimadaResultado }) {
  const alerts = [
    !calculo.regraComissaoAplicada ? 'Nenhuma regra ativa de comissão foi cadastrada.' : null,
    calculo.meta <= 0 ? 'A meta mensal ainda não foi cadastrada; bônus de meta não é aplicado.' : null,
    calculo.bonusPatamares.length === 0 ? 'Os patamares de bônus ainda não foram cadastrados.' : null,
  ].filter((message): message is string => Boolean(message))

  if (alerts.length === 0) return null

  return (
    <section className="grid gap-mx-sm" aria-label="Pendências da remuneração">
      {alerts.map(message => (
        <div key={message} className="flex items-start gap-mx-sm rounded-mx-xl border border-status-warning/20 bg-status-warning-surface p-mx-md text-status-warning">
          <AlertTriangle size={18} className="mt-mx-tiny shrink-0" aria-hidden="true" />
          <Typography variant="p" className="text-sm font-bold text-status-warning">{message} Procure seu gerente, dono ou Admin MX.</Typography>
        </div>
      ))}
    </section>
  )
}

function PlanBreakdown({ calculo, plano }: { calculo: RemuneracaoEstimadaResultado; plano: RemuneracaoPlano | null }) {
  return (
    <section className="space-y-mx-md" aria-labelledby="plano-title">
      <SectionTitle
        id="plano-title"
        title="Base do plano"
        description="Valores mensais cadastrados para o cargo Vendedor."
        icon={<BadgeDollarSign size={20} />}
      />
      <div className="grid gap-mx-md md:grid-cols-3">
        <ValueCard label="Salário fixo" value={calculo.salarioFixo} />
        <ValueCard label="Variável do plano" value={calculo.salarioVariavel} />
        <ValueCard label="Benefícios" value={calculo.beneficios} />
      </div>
      <MetadataLine
        vigencia={plano?.vigencia_inicio}
        observacoes={plano?.observacoes}
        fallback="Sem observações cadastradas para o plano."
      />
    </section>
  )
}

function CommissionBreakdown({ calculo }: { calculo: RemuneracaoEstimadaResultado }) {
  const regra = calculo.regraComissaoAplicada
  const componentes = [
    {
      label: 'Fixa por venda',
      detail: `${formatCurrency(calculo.comissaoPorVenda)} x ${calculo.vendasConsideradas} venda(s)`,
      value: calculo.comissaoFixa,
    },
    {
      label: 'Percentual',
      detail: `${formatCurrency(calculo.faturamentoConsiderado)} de faturamento`,
      value: calculo.comissaoPercentual,
    },
    {
      label: 'Categoria',
      detail: 'Valor por tipo de veículo vendido',
      value: calculo.comissaoCategoria,
    },
    {
      label: 'Equipe',
      detail: 'Plus por atingimento da loja',
      value: calculo.comissaoEquipe,
    },
  ].filter(item => item.value > 0)

  return (
    <section className="space-y-mx-md" aria-labelledby="comissao-title">
      <SectionTitle
        id="comissao-title"
        title="Comissão por vendas"
        description="A comissão combina as regras ativas aplicáveis ao modelo cadastrado."
        icon={<CircleDollarSign size={20} />}
      />
      {componentes.length > 0 ? (
        <Card className="border-none bg-white p-mx-lg shadow-mx-md">
          <div className="grid gap-mx-sm md:grid-cols-2 xl:grid-cols-4">
            {componentes.map(item => (
              <CalculationValue key={item.label} label={item.label} value={formatCurrency(item.value)} detail={item.detail} />
            ))}
          </div>
          <div className="mt-mx-md flex items-center justify-between gap-mx-md border-t border-border-default pt-mx-md">
            <Typography variant="h3">Subtotal de comissão</Typography>
            <Typography variant="h2" tone="brand" className="font-mono-numbers">{formatCurrency(calculo.comissao)}</Typography>
          </div>
        </Card>
      ) : (
        <Card className="border border-dashed border-border-default bg-white p-mx-lg shadow-none">
          <Typography variant="p" className="font-bold">Regras pendentes</Typography>
          <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">Nenhuma regra ativa de comissão foi aplicada ao período.</Typography>
        </Card>
      )}
      <MetadataLine
        vigencia={regra?.vigencia_inicio}
        observacoes={regra?.observacoes}
        fallback="Nenhuma regra ativa de comissão."
      />
    </section>
  )
}

function BonusBreakdown({ calculo }: { calculo: RemuneracaoEstimadaResultado }) {
  return (
    <section className="space-y-mx-md" aria-labelledby="bonus-title">
      <SectionTitle
        id="bonus-title"
        title="Bônus por meta"
        description="Somente o maior patamar atingido é aplicado ao cálculo."
        icon={<Target size={20} />}
      />
      {calculo.bonusPatamares.length > 0 ? (
        <div className="grid gap-mx-sm">
          {calculo.bonusPatamares.map(patamar => (
            <BonusTier key={patamar.regra.id} patamar={patamar} />
          ))}
        </div>
      ) : (
        <Card className="border border-dashed border-border-default bg-white p-mx-lg shadow-none">
          <Typography variant="p" className="font-bold">Patamares pendentes</Typography>
          <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">Nenhuma regra de bônus foi cadastrada.</Typography>
        </Card>
      )}
      <div className="flex items-center justify-between gap-mx-md border-t border-border-default pt-mx-md">
        <Typography variant="h3">Bônus aplicado</Typography>
        <Typography variant="h2" tone="brand" className="font-mono-numbers">{formatCurrency(calculo.bonus)}</Typography>
      </div>
    </section>
  )
}

function BonusTier({ patamar }: { patamar: RemuneracaoBonusPatamarDetalhe }) {
  return (
    <Card className={cn('border bg-white p-mx-md shadow-mx-sm', patamar.aplicado ? 'border-status-success/40' : 'border-border-default')}>
      <div className="flex flex-col gap-mx-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-mx-sm">
          {patamar.atingido
            ? <CheckCircle2 size={20} className="shrink-0 text-status-success" aria-hidden="true" />
            : <CalendarClock size={20} className="shrink-0 text-text-tertiary" aria-hidden="true" />}
          <div>
            <Typography variant="p" className="font-bold">{patamar.percentualMetaMin}% da meta</Typography>
            <Typography variant="tiny" tone="muted" className="block font-bold normal-case tracking-normal">
              Vigência: {formatDate(patamar.regra.vigencia_inicio)}
              {patamar.regra.observacoes ? ` · ${patamar.regra.observacoes}` : ''}
            </Typography>
          </div>
        </div>
        <div className="flex items-center gap-mx-sm">
          <Typography variant="h3" className="font-mono-numbers">{formatCurrency(patamar.valor)}</Typography>
          <Badge variant={patamar.aplicado ? 'success' : patamar.atingido ? 'outline' : 'outline'}>
            {patamar.aplicado ? 'Aplicado' : patamar.atingido ? 'Atingido' : 'Não atingido'}
          </Badge>
        </div>
      </div>
    </Card>
  )
}

function FormulaBreakdown({ calculo }: { calculo: RemuneracaoEstimadaResultado }) {
  return (
    <section className="space-y-mx-md" aria-labelledby="formula-title">
      <SectionTitle
        id="formula-title"
        title="Fórmula final"
        description="Percurso completo usado para chegar ao valor selecionado."
        icon={<Wallet size={20} />}
      />
      <Card className="border-none bg-white p-mx-lg shadow-mx-md">
        <div className="divide-y divide-border-subtle">
          {calculo.formulaItens.map(item => (
            <div key={item.chave} className="flex flex-col gap-mx-xs py-mx-sm first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-mx-md">
              <div>
                <Typography variant="p" className="font-bold">{item.label}</Typography>
                <Typography variant="tiny" tone="muted" className="block font-bold normal-case tracking-normal">{item.descricao}</Typography>
              </div>
              <Typography variant="h3" className="shrink-0 font-mono-numbers">{formatCurrency(item.valor)}</Typography>
            </div>
          ))}
        </div>
        <div className="mt-mx-lg flex items-center justify-between gap-mx-md border-t-2 border-brand-primary pt-mx-md">
          <Typography variant="h2">Total estimado</Typography>
          <Typography variant="h1" tone="brand" className="text-3xl font-mono-numbers">{formatCurrency(calculo.total)}</Typography>
        </div>
      </Card>
    </section>
  )
}

function SectionTitle({
  id,
  title,
  description,
  icon,
}: {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-mx-sm">
      <span className="flex h-mx-10 w-mx-10 shrink-0 items-center justify-center rounded-mx-xl border border-mx-indigo-100 bg-mx-indigo-50 text-brand-primary" aria-hidden="true">
        {icon}
      </span>
      <div>
        <Typography id={id} variant="h2">{title}</Typography>
        <Typography variant="p" tone="muted" className="mt-mx-tiny text-sm">{description}</Typography>
      </div>
    </div>
  )
}

function ValueCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="border-none bg-white p-mx-md shadow-mx-sm">
      <Typography variant="tiny" tone="muted" className="block font-bold uppercase tracking-widest">{label}</Typography>
      <Typography variant="h2" className="mt-mx-xs font-mono-numbers">{formatCurrency(value)}</Typography>
    </Card>
  )
}

function CalculationValue({
  label,
  value,
  detail,
  highlight = false,
}: {
  label: string
  value: string
  detail?: string
  highlight?: boolean
}) {
  return (
    <div className={cn('rounded-mx-xl p-mx-md text-center', highlight ? 'bg-mx-indigo-50' : 'bg-surface-alt')}>
      <Typography variant="tiny" tone="muted" className="block font-bold uppercase tracking-widest">{label}</Typography>
      <Typography variant="h2" tone={highlight ? 'brand' : 'default'} className="mt-mx-xs font-mono-numbers">{value}</Typography>
      {detail && <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-bold normal-case tracking-normal">{detail}</Typography>}
    </div>
  )
}

function MetadataLine({
  vigencia,
  observacoes,
  fallback,
}: {
  vigencia?: string | null
  observacoes?: string | null
  fallback: string
}) {
  return (
    <div className="flex flex-col gap-mx-xs rounded-mx-xl border border-border-default bg-white px-mx-md py-mx-sm sm:flex-row sm:items-center sm:justify-between">
      <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-widest">
        Vigência: {vigencia ? formatDate(vigencia) : 'Pendente'}
      </Typography>
      <Typography variant="p" tone="muted" className="text-sm">{observacoes || fallback}</Typography>
    </div>
  )
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

function commissionSummary(calculo: RemuneracaoEstimadaResultado): string {
  if (!calculo.regraComissaoAplicada) return 'regra pendente'
  if (calculo.comissaoPercentual > 0) return `${formatCurrency(calculo.faturamentoConsiderado)} de faturamento`
  if (calculo.comissaoCategoria > 0) return 'por categoria de veículo'
  if (calculo.comissaoEquipe > 0) return 'plus da meta da loja'
  return `${formatCurrency(calculo.comissaoPorVenda)} por venda`
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
}
