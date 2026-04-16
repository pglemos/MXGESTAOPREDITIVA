import React from 'react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'

interface RankingRow {
  name: string
  leads: number
  agd: number
  visita: number
  venda: number
  meta?: number
  atingimento: number
  mx_score?: number
  diagnostic?: string
}

interface WeeklyStoreReportProps {
  report: {
    store_name: string
    week_start: string
    week_end: string
    weekly_goal?: number
    ranking_json: RankingRow[]
    team_avg_json: Record<string, number>
  } | null
}

const TH_BASE = "border border-border-strong p-2 text-center font-black uppercase text-mx-micro"
const TD_BASE = "border border-border-strong p-2 text-center text-mx-micro"
const TD_LEFT = "border border-border-strong p-2 text-left text-mx-micro"

export const WeeklyStoreReport: React.FC<WeeklyStoreReportProps> = ({ report }) => {
  if (!report) return null

  const r = report
  const ranking = r.ranking_json || []
  const teamAvg = r.team_avg_json || {}
  const weekStart = r.week_start ? parseISO(r.week_start) : new Date()
  const weekEnd = r.week_end ? parseISO(r.week_end) : new Date()

  return (
    <div className="print:p-0 p-mx-lg bg-white text-black font-sans leading-tight">
      <div className="flex justify-between items-center mb-mx-lg">
        <div>
          <Typography variant="h2" className="text-text-primary">Relatório Semanal de Alta Performance</Typography>
          <Typography variant="caption" className="text-text-tertiary">
            {r.store_name} | {format(weekStart, 'dd/MM/yyyy')} a {format(weekEnd, 'dd/MM/yyyy')}
          </Typography>
        </div>
        <div className="text-right">
          <span className="text-mx-tiny font-black bg-surface-alt px-3 py-1 rounded text-text-secondary">MX CRITERION: 20 / 60 / 33</span>
        </div>
      </div>

      <table className="w-full border-collapse mb-mx-lg text-mx-micro">
        <thead>
          <tr>
            <th colSpan={9} className={cn(TH_BASE, "bg-brand-secondary text-white")}>RESULTADO DA EQUIPE: POR VENDEDOR</th>
          </tr>
          <tr>
            <th className={cn(TH_BASE, "text-left bg-surface-alt text-text-secondary")}>NOME</th>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>LEADS</th>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>AGD</th>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>VISITA</th>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>VENDA</th>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>META INDIV.</th>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>% ATING.</th>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>SCORE MX</th>
            <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>RANK</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((s, idx) => (
            <tr key={idx} className={idx < 3 ? 'bg-status-warning-surface' : ''}>
              <td className={TD_LEFT}>{s.name}</td>
              <td className={TD_BASE}>{s.leads}</td>
              <td className={TD_BASE}>{s.agd}</td>
              <td className={TD_BASE}>{s.visita}</td>
              <td className={TD_BASE}>{s.venda}</td>
              <td className={TD_BASE}>{s.meta || '-'}</td>
              <td className={cn(TD_BASE, s.atingimento >= 100 ? 'text-status-success font-black' : s.atingimento < 50 ? 'text-status-error font-black' : '')}>
                {s.atingimento}%
              </td>
              <td className={cn(TD_BASE, "font-black")}>{s.mx_score || 0}</td>
              <td className={TD_BASE}>#{idx + 1}</td>
            </tr>
          ))}
          <tr className="bg-surface-alt">
            <td className={cn(TD_LEFT, "font-black")}>MÉDIA DA UNIDADE</td>
            <td className={TD_BASE}>{teamAvg.leads || 0}</td>
            <td className={TD_BASE}>{teamAvg.agd || 0}</td>
            <td className={TD_BASE}>{teamAvg.visitas || 0}</td>
            <td className={TD_BASE}>{teamAvg.venda || 0}</td>
            <td className={TD_BASE}>{r.weekly_goal || 0}</td>
            <td className={TD_BASE}>{teamAvg.atingimento || 0}%</td>
            <td className={TD_BASE}>-</td>
            <td className={TD_BASE}>-</td>
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-mx-md mb-mx-lg">
        <table className="w-full border-collapse text-mx-micro">
          <thead>
            <tr>
              <th colSpan={4} className={cn(TH_BASE, "bg-status-warning text-text-primary text-left")}>CONVERSÃO MÉDIA (FUNIL)</th>
            </tr>
            <tr>
              <th className={cn(TH_BASE, "text-left bg-surface-alt text-text-secondary")}>Etapa</th>
              <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>Real</th>
              <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>Ideal</th>
              <th className={cn(TH_BASE, "bg-surface-alt text-text-secondary")}>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Lead → Agd', val: teamAvg.tx_lead_agd, ideal: 20 },
              { label: 'Agd → Visita', val: teamAvg.tx_agd_visita, ideal: 60 },
              { label: 'Visita → Venda', val: teamAvg.tx_visita_vnd, ideal: 33 },
            ].map((row) => (
              <tr key={row.label}>
                <td className={TD_LEFT}>{row.label}</td>
                <td className={TD_BASE}>{row.val || 0}%</td>
                <td className={TD_BASE}>{row.ideal}%</td>
                <td className={cn(TD_BASE, (row.val || 0) >= row.ideal ? 'text-status-success font-black' : 'text-status-error font-black')}>
                  {(row.val || 0) >= row.ideal ? 'OK' : 'ALTA PERDA'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border border-border-strong rounded p-mx-sm bg-surface-alt">
          <Typography variant="tiny" className="text-text-primary mb-mx-xs block">DIAGNÓSTICO E PLANO DE AÇÃO</Typography>
          <Typography variant="tiny" tone="muted" className="italic">
            {ranking[0]?.diagnostic || "Concluir auditoria individual para gerar o plano de ação consolidado."}
          </Typography>
        </div>
      </div>

      <div className="mt-mx-lg pt-mx-md border-t border-border-strong flex justify-between items-end">
        <div>
          <Typography variant="tiny" className="text-text-tertiary">MX GESTÃO PREDITIVA</Typography>
          <Typography variant="tiny" tone="muted">Gerado automaticamente via Supabase Cloud Automation</Typography>
        </div>
        <div className="text-right">
          <Typography variant="tiny" className="text-text-tertiary">Auditado por:</Typography>
          <div className="w-mx-4xl h-px bg-border-strong mt-mx-sm" />
          <Typography variant="tiny" tone="muted">Gestor da Unidade</Typography>
        </div>
      </div>
    </div>
  )
}

