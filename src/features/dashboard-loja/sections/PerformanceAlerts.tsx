import { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import type { UserRole } from '@/types/database'

export type OwnerPerformanceAlert = {
  title: string
  description: string
  recommendation: string
  action: string
  variant: 'success' | 'warning' | 'danger' | 'outline'
  impact: 'Alto' | 'Médio' | 'Baixo'
  ctaLabel: string
  ctaTo: string
}

type ChannelTone = 'success' | 'info' | 'brand'

type Checkin = {
  vnd_porta_prev_day?: number | null
  vnd_cart_prev_day?: number | null
  vnd_net_prev_day?: number | null
}

type FunnelData = {
  tx_lead_agd: number
  tx_agd_visita: number
  tx_visita_vnd: number
}

type FunnelBenchmarks = {
  leadAgd: number
  agdVisita: number
  visitaVnd: number
}

type Metrics = {
  totalSales: number
  goalValue: number
  attainment: number
  checkedInCount: number
}

type Seller = { id?: string; name?: string; checkin_today?: boolean }

/**
 * Calcula alertas de performance + mix de canais a partir das métricas da loja.
 * Hook puro para evitar duplicação entre o card de alertas e o owner-card.
 */
export function usePerformanceAlerts({
  role,
  isOwner,
  metrics,
  sellers,
  checkins,
  funilData,
  funnelBenchmarks,
  selectedStoreId,
}: {
  role: UserRole | null
  isOwner: boolean
  metrics: Metrics
  sellers: Seller[] | null | undefined
  checkins: Checkin[] | null | undefined
  funilData: FunnelData
  funnelBenchmarks: FunnelBenchmarks
  selectedStoreId: string | null
}) {
  const location = useLocation()
  const alerts = useMemo<OwnerPerformanceAlert[]>(() => {
    const sellerCount = (sellers || []).length
    const out: OwnerPerformanceAlert[] = []

    if (metrics.goalValue > 0 && metrics.attainment < 80) {
      out.push({
        title: 'Meta abaixo do ritmo',
        description: `${metrics.attainment}% da meta realizada no período selecionado.`,
        recommendation: isOwner
          ? 'Concentrar cobrança em meta, ritmo diário e gargalos que impedem volume.'
          : 'Reorganizar cadência da equipe e priorizar vendedores abaixo do ritmo.',
        action: isOwner
          ? 'Decidir cobrança de plano de recuperação com o gerente.'
          : 'Validar plano de ataque com gerente e vendedores de menor ritmo.',
        variant: metrics.attainment < 60 ? 'danger' : 'warning',
        impact: metrics.attainment < 60 ? 'Alto' : 'Médio',
        ctaLabel: 'Abrir metas',
        ctaTo: role === 'gerente' ? '/gerente/meta-loja' : `${location.pathname}?id=${selectedStoreId || ''}&tab=metas`,
      })
    }

    if (sellerCount > 0 && metrics.checkedInCount < sellerCount) {
      out.push({
        title: 'Rotina diária incompleta',
        description: `${metrics.checkedInCount}/${sellerCount} vendedores com registro sincronizado.`,
        recommendation: isOwner
          ? 'Cobrar disciplina pelo gerente sem assumir a execução operacional.'
          : 'Resolver pendências de lançamento antes da reunião de acompanhamento.',
        action: isOwner
          ? 'Acompanhar a cobrança do gerente; não executar a rotina operacional.'
          : 'Cobrar fechamento da puxada diária antes da próxima reunião de gestão.',
        variant: 'warning',
        impact: 'Médio',
        ctaLabel: role === 'gerente' ? 'Abrir rotina' : 'Ver equipe',
        ctaTo: role === 'gerente' ? '/gerente/rotina-equipe' : `${location.pathname}?id=${selectedStoreId || ''}&tab=equipe`,
      })
    }

    if (funilData.tx_lead_agd < funnelBenchmarks.leadAgd) {
      out.push({
        title: 'Baixa conversão de lead',
        description: `${funilData.tx_lead_agd}% contra benchmark de ${funnelBenchmarks.leadAgd}%.`,
        recommendation: isOwner
          ? 'Revisar origem, qualidade e tratamento dos leads com decisão comercial.'
          : 'Auditar tempo de resposta, abordagem inicial e qualidade dos agendamentos.',
        action: isOwner
          ? 'Priorizar decisão comercial sobre origem e tratamento dos leads.'
          : 'Revisar abordagem inicial, tempo de resposta e qualidade dos agendamentos.',
        variant: 'danger',
        impact: 'Alto',
        ctaLabel: role === 'gerente' ? 'Criar devolutiva' : 'Ver ranking',
        ctaTo: role === 'gerente' ? '/gerente/feedbacks-pdis?tab=feedbacks' : '/classificacao',
      })
    }

    if (funilData.tx_visita_vnd < funnelBenchmarks.visitaVnd) {
      out.push({
        title: 'Visita não vira venda',
        description: `${funilData.tx_visita_vnd}% contra benchmark de ${funnelBenchmarks.visitaVnd}%.`,
        recommendation: isOwner
          ? 'Investigar barreiras de preço, troca, financiamento e fechamento.'
          : 'Escutar propostas perdidas e treinar fechamento com casos reais.',
        action: isOwner
          ? 'Decidir intervenção em preço, troca, financiamento ou fechamento.'
          : 'Checar proposta, avaliação de troca, financiamento e fechamento.',
        variant: 'danger',
        impact: 'Alto',
        ctaLabel: role === 'gerente' ? 'Ver ranking' : 'Ver ranking',
        ctaTo: role === 'gerente' ? '/gerente/ranking' : '/classificacao',
      })
    }

    if ((checkins || []).length === 0) {
      out.push({
        title: 'Sem dados no período',
        description: 'Ainda não há check-ins para sustentar um diagnóstico operacional.',
        recommendation: isOwner
          ? 'Validar se a rotina foi executada antes de analisar performance.'
          : 'Confirmar adesão da equipe ao fechamento diário antes da leitura gerencial.',
        action: isOwner
          ? 'Solicitar ao gerente confirmação da rotina antes de decidir.'
          : 'Validar se a equipe lançou a rotina antes de concluir a leitura.',
        variant: 'outline',
        impact: 'Médio',
        ctaLabel: role === 'gerente' ? 'Abrir rotina' : 'Ver equipe',
        ctaTo: role === 'gerente' ? '/gerente/rotina-equipe' : `${location.pathname}?id=${selectedStoreId || ''}&tab=equipe`,
      })
    } else if (out.length === 0) {
      out.push({
        title: 'Operação dentro do esperado',
        description: 'Meta, disciplina e funil sem alerta crítico no período.',
        recommendation: isOwner
          ? 'Manter cadência e observar oportunidades de escala.'
          : 'Preservar rotina e reconhecer vendedores com melhor evolução.',
        action: isOwner
          ? 'Acompanhar execução e cobrar manutenção da cadência.'
          : 'Manter cadência e observar oportunidades individuais no ranking.',
        variant: 'success',
        impact: 'Baixo',
        ctaLabel: 'Ver ranking',
        ctaTo: role === 'gerente' ? '/gerente/ranking' : '/classificacao',
      })
    }

    const weight = { danger: 0, warning: 1, outline: 2, success: 3 } as const
    return out.sort((a, b) => weight[a.variant] - weight[b.variant]).slice(0, 4)
  }, [checkins, funnelBenchmarks, funilData, isOwner, location.pathname, metrics, role, selectedStoreId, sellers])

  const mixCanais = useMemo(() => {
    const porta = (checkins || []).reduce((acc, c) => acc + (c.vnd_porta_prev_day || 0), 0)
    const carteira = (checkins || []).reduce((acc, c) => acc + (c.vnd_cart_prev_day || 0), 0)
    const digital = (checkins || []).reduce((acc, c) => acc + (c.vnd_net_prev_day || 0), 0)
    const total = metrics.totalSales

    return [
      { label: 'Porta (Showroom)', color: 'bg-brand-primary', pct: total > 0 ? Math.round((porta / total) * 100) : 0, tone: 'success' as ChannelTone },
      { label: 'Carteira (Ativo)', color: 'bg-brand-primary', pct: total > 0 ? Math.round((carteira / total) * 100) : 0, tone: 'info' as ChannelTone },
      { label: 'Digital (Leads)', color: 'bg-brand-primary', pct: total > 0 ? Math.round((digital / total) * 100) : 0, tone: 'brand' as ChannelTone },
    ]
  }, [checkins, metrics.totalSales])

  return { alerts, mixCanais }
}

type PerformanceAlertsProps = {
  role: UserRole | null
  isOwner: boolean
  alerts: OwnerPerformanceAlert[]
}

/**
 * Card de alertas de performance — visão gerente/dono/admin com 4 alertas
 * principais ordenados por severidade. Extraído de DashboardLoja.tsx (Story 2.5).
 */
export function PerformanceAlerts({ role, isOwner, alerts }: PerformanceAlertsProps) {
  const navigate = useNavigate()
  return (
    <Card className="w-full border-none shadow-mx-lg bg-white overflow-hidden">
      <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-mx-md">
          <div>
            <CardTitle className="text-lg md:text-xl uppercase tracking-tighter">
              {role === 'gerente' ? 'Visão Gerencial' : isOwner ? 'Decisões do Dono' : 'Visão do Dono'}
            </CardTitle>
            <CardDescription className="uppercase tracking-widest font-black mt-1 text-mx-tiny">
              {isOwner
                ? 'IMPACTO FINANCEIRO, COMERCIAL E DISCIPLINAR PRIORIZADO'
                : 'ALERTAS DE PERFORMANCE, ROTINA E FUNIL'}
            </CardDescription>
          </div>
          <Badge
            variant={
              alerts.some(alert => alert.variant === 'danger')
                ? 'danger'
                : alerts.some(alert => alert.variant === 'warning')
                ? 'warning'
                : 'success'
            }
            className="rounded-mx-full px-3 py-1 w-fit"
          >
            {alerts.some(alert => alert.variant === 'danger')
              ? 'AÇÃO NECESSÁRIA'
              : alerts.some(alert => alert.variant === 'warning')
              ? 'PONTO DE ATENÇÃO'
              : 'DENTRO DO RITMO'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-mx-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-mx-md">
          {alerts.map((alert) => (
            <div key={alert.title} className="rounded-mx-xl border border-border-default bg-surface-alt p-mx-md">
              <div className="flex items-start justify-between gap-mx-sm mb-mx-sm">
                <Typography variant="p" className="font-black uppercase text-sm leading-tight">{alert.title}</Typography>
                <Badge variant={alert.variant} className="rounded-mx-full px-2 py-0.5 shrink-0">
                  {alert.variant === 'success' ? 'OK' : alert.variant === 'warning' ? 'ATENÇÃO' : alert.variant === 'outline' ? 'VALIDAR' : 'CRÍTICO'}
                </Badge>
              </div>
              {isOwner && (
                <Typography variant="tiny" tone="muted" className="mb-mx-xs block font-black uppercase tracking-widest">
                  Impacto {alert.impact}
                </Typography>
              )}
              <Typography variant="tiny" tone="muted" className="block mb-mx-sm">{alert.description}</Typography>
              <Typography variant="tiny" tone="brand" className="mb-mx-xs block font-black uppercase tracking-tight">{alert.recommendation}</Typography>
              <Typography variant="tiny" className="font-black uppercase tracking-tight">{alert.action}</Typography>
              <Button type="button" variant="outline" size="sm" onClick={() => navigate(alert.ctaTo)} className="mt-mx-sm h-mx-9 rounded-mx-lg bg-white">
                {alert.ctaLabel}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default PerformanceAlerts
