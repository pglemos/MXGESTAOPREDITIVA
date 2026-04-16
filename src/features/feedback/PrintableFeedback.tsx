import React from 'react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'

interface PrintableFeedbackProps {
  feedback: {
    seller_name?: string
    week_reference: string
    leads_week: number
    agd_week: number
    visit_week: number
    vnd_week: number
    meta_compromisso: number
    tx_lead_agd: number
    tx_agd_visita: number
    tx_visita_vnd: number
    attention_points?: string
    action?: string
    diagnostic_json?: {
      seller_snapshot?: Record<string, number>
      team_snapshot?: Record<string, number>
    }
  } | null
}

const TH_BASE = "border border-border-strong p-2 text-center font-black uppercase text-mx-micro"
const TD_BASE = "border border-border-strong p-2 text-center text-mx-micro"
const TD_LEFT = "border border-border-strong p-2 text-left text-mx-micro"

export const PrintableFeedback: React.FC<PrintableFeedbackProps> = ({ feedback }) => {
  if (!feedback) return null

  const f = feedback
  const diag = f.diagnostic_json || {}
  const team = diag.team_snapshot || {}

  return (
    <div className="print:p-0 p-mx-lg bg-white text-black font-sans leading-tight">
      <table className="w-full border-collapse mb-mx-lg text-mx-micro">
        <thead>
          <tr>
            <th colSpan={5} className={cn(TH_BASE, "bg-brand-secondary text-white")}>
              RESUMO DO VENDEDOR: {f.seller_name || 'VENDEDOR'}
            </th>
          </tr>
          <tr>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>Leads Recebidos</th>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>Agendamentos Feitos</th>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>Visitas Realizadas</th>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>Vendas Fechadas</th>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>Sua Meta Semanal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={TD_BASE}>{f.leads_week || 0}</td>
            <td className={TD_BASE}>{f.agd_week || 0}</td>
            <td className={TD_BASE}>{f.visit_week || 0}</td>
            <td className={TD_BASE}>{f.vnd_week || 0}</td>
            <td className={TD_BASE}>{f.meta_compromisso || 0}</td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse mb-mx-lg text-mx-micro">
        <thead>
          <tr>
            <th colSpan={4} className={cn(TH_BASE, "bg-status-warning text-text-primary text-left")}>
              ANÁLISE DE APROVEITAMENTO (REAL vs IDEAL)
            </th>
          </tr>
          <tr>
            <th className={cn(TH_BASE, "text-left bg-surface-alt text-text-secondary")}>Etapa do Processo</th>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>Seu Resultado</th>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>O Ideal Seria</th>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>Status</th>
          </tr>
        </thead>
        <tbody>
          {[
            { label: 'De Leads para Agendamentos', val: f.tx_lead_agd, ideal: 20 },
            { label: 'De Agendamentos para Visitas', val: f.tx_agd_visita, ideal: 60 },
            { label: 'De Visitas para Vendas', val: f.tx_visita_vnd, ideal: 33 },
          ].map((row) => (
            <tr key={row.label}>
              <td className={TD_LEFT}>{row.label}</td>
              <td className={TD_BASE}>{row.val || 0}%</td>
              <td className={TD_BASE}>{row.ideal}%</td>
              <td className={cn(TD_BASE, (row.val || 0) >= row.ideal ? 'text-status-success font-black' : 'text-status-error font-black')}>
                {(row.val || 0) >= row.ideal ? 'Bom' : 'Abaixo'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="w-full border-collapse mb-mx-lg text-mx-micro">
        <thead>
          <tr>
            <th colSpan={4} className={cn(TH_BASE, "bg-status-info-surface text-brand-secondary text-left")}>
              SEU DESEMPENHO COMPARADO À MÉDIA DA EQUIPE
            </th>
          </tr>
          <tr>
            <th className={cn(TH_BASE, "text-left bg-surface-alt text-text-secondary")}>Critério</th>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>Sua Produção</th>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>Média da Equipe</th>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>Conclusão</th>
          </tr>
        </thead>
        <tbody>
          {[
            { label: 'Volume de Vendas', val: f.vnd_week, avg: team.vnd_total },
            { label: 'Volume de Agendamentos', val: f.agd_week, avg: team.agd_total },
            { label: 'Volume de Visitas', val: f.visit_week, avg: team.visitas },
          ].map((row) => (
            <tr key={row.label}>
              <td className={TD_LEFT}>{row.label}</td>
              <td className={TD_BASE}>{row.val || 0}</td>
              <td className={TD_BASE}>{row.avg || '0'}</td>
              <td className={TD_BASE}>
                {(row.val || 0) >= (row.avg || 0) ? 'MAIOR que a média (+)' : 'MENOR que a média (-)'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-mx-lg flex flex-col gap-mx-sm">
        <div className="flex gap-mx-xs">
          <Typography variant="tiny" className="font-black uppercase min-w-mx-label-lg">Diagnóstico da Semana:</Typography>
          <Typography variant="tiny" className="text-status-error whitespace-pre-wrap">{f.attention_points}</Typography>
        </div>
        <div className="flex gap-mx-xs">
          <Typography variant="tiny" className="font-black uppercase min-w-mx-label-lg">Orientação de Ação:</Typography>
          <Typography variant="tiny" className="whitespace-pre-wrap">{f.action}</Typography>
        </div>
      </div>

      <div className="mt-mx-xl pt-mx-md border-t border-border-strong">
        <Typography variant="tiny" className="text-text-tertiary mb-mx-xs block">Entenda a conta (Boas Práticas do Setor)</Typography>
        <Typography variant="tiny" tone="muted" className="italic">
          Consideramos como ideal: 20% do volume total de leads vira agendamento | Para cada 5 agendamentos, 3 viram visitas (60%) | Para cada 3 visitas, 1 vira venda (33%).
        </Typography>
      </div>
    </div>
  )
}

