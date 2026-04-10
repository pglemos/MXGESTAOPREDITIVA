import React from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface WeeklyStoreReportProps {
    report: any
}

export const WeeklyStoreReport: React.FC<WeeklyStoreReportProps> = ({ report }) => {
    if (!report) return null

    const r = report
    const ranking = r.ranking_json || []
    const teamAvg = r.team_avg_json || {}
    const weekStart = r.week_start ? parseISO(r.week_start) : new Date()
    const weekEnd = r.week_end ? parseISO(r.week_end) : new Date()

    return (
        <div className="weekly-store-report p-8 bg-white text-black font-sans leading-tight">
            <style>{`
                @media print {
                    .weekly-store-report { padding: 0 !important; }
                    body { background: white !important; }
                }
                .legacy-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
                .legacy-table th, .legacy-table td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: center; }
                .header-blue { background-color: #335c67; color: white; font-weight: bold; text-transform: uppercase; }
                .header-gray { background-color: #f3f4f6; color: #374151; font-weight: bold; }
                .header-yellow { background-color: #facc15; color: #1f2937; font-weight: bold; text-align: left !important; }
                .row-highlight { background-color: #f9fafb; font-weight: bold; }
                .status-bom { color: #059669; font-weight: bold; }
                .status-abaixo { color: #dc2626; font-weight: bold; }
                .ranking-gold { background-color: #fef3c7; font-weight: bold; }
            `}</style>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-black uppercase text-slate-800">Relatório Semanal de Alta Performance</h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {r.store_name} | {format(weekStart, 'dd/MM/yyyy')} a {format(weekEnd, 'dd/MM/yyyy')}
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded text-slate-600">MX CRITERION: 20 / 60 / 33</span>
                </div>
            </div>

            <table className="legacy-table">
                <thead>
                    <tr className="header-blue">
                        <th colSpan={9}>RESULTADO DA EQUIPE: POR VENDEDOR</th>
                    </tr>
                    <tr className="header-gray">
                        <th style={{ textAlign: 'left' }}>NOME</th>
                        <th>LEADS</th>
                        <th>AGD</th>
                        <th>VISITA</th>
                        <th>VENDA</th>
                        <th>META INDIV.</th>
                        <th>% ATING.</th>
                        <th>SCORE MX</th>
                        <th>RANK</th>
                    </tr>
                </thead>
                <tbody>
                    {ranking.map((s: any, idx: number) => (
                        <tr key={idx} className={idx < 3 ? 'ranking-gold' : ''}>
                            <td style={{ textAlign: 'left' }}>{s.name}</td>
                            <td>{s.leads}</td>
                            <td>{s.agd}</td>
                            <td>{s.visita}</td>
                            <td>{s.venda}</td>
                            <td>{s.meta || '-'}</td>
                            <td className={s.atingimento >= 100 ? 'status-bom' : s.atingimento < 50 ? 'status-abaixo' : ''}>
                                {s.atingimento}%
                            </td>
                            <td className="font-bold">{s.mx_score || 0}</td>
                            <td>#{idx + 1}</td>
                        </tr>
                    ))}
                    <tr className="row-highlight">
                        <td style={{ textAlign: 'left' }}>MÉDIA DA UNIDADE</td>
                        <td>{teamAvg.leads || 0}</td>
                        <td>{teamAvg.agd || 0}</td>
                        <td>{teamAvg.visitas || 0}</td>
                        <td>{teamAvg.venda || 0}</td>
                        <td>{r.weekly_goal || 0}</td>
                        <td>{teamAvg.atingimento || 0}%</td>
                        <td>-</td>
                        <td>-</td>
                    </tr>
                </tbody>
            </table>

            <div className="grid grid-cols-2 gap-6 mb-6">
                <table className="legacy-table">
                    <thead>
                        <tr className="header-yellow">
                            <th colSpan={4}>CONVERSÃO MÉDIA (FUNIL)</th>
                        </tr>
                        <tr className="header-gray">
                            <th style={{ textAlign: 'left' }}>Etapa</th>
                            <th>Real</th>
                            <th>Ideal</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ textAlign: 'left' }}>Lead {'->'} Agd</td>
                            <td>{teamAvg.tx_lead_agd || 0}%</td>
                            <td>20%</td>
                            <td className={teamAvg.tx_lead_agd >= 20 ? 'status-bom' : 'status-abaixo'}>
                                {teamAvg.tx_lead_agd >= 20 ? 'OK' : 'ALTA PERDA'}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ textAlign: 'left' }}>Agd {'->'} Visita</td>
                            <td>{teamAvg.tx_agd_visita || 0}%</td>
                            <td>60%</td>
                            <td className={teamAvg.tx_agd_visita >= 60 ? 'status-bom' : 'status-abaixo'}>
                                {teamAvg.tx_agd_visita >= 60 ? 'OK' : 'ALTA PERDA'}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ textAlign: 'left' }}>Visita {'->'} Venda</td>
                            <td>{teamAvg.tx_visita_vnd || 0}%</td>
                            <td>33%</td>
                            <td className={teamAvg.tx_visita_vnd >= 33 ? 'status-bom' : 'status-abaixo'}>
                                {teamAvg.tx_visita_vnd >= 33 ? 'OK' : 'ALTA PERDA'}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div className="border border-gray-200 rounded p-4 bg-gray-50">
                    <h3 className="text-[10px] font-black uppercase text-slate-800 mb-2">DIAGNÓSTICO E PLANO DE AÇÃO</h3>
                    <p className="text-[11px] text-gray-700 italic leading-snug">
                       {ranking[0]?.diagnostic || "Concluir auditoria individual para gerar o plano de ação consolidado."}
                    </p>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-end">
                 <div>
                    <p className="font-bold text-[9px] uppercase text-gray-400">MX GESTÃO PREDITIVA</p>
                    <p className="text-[8px] text-gray-400">Gerado automaticamente via Supabase Cloud Automation</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-bold text-gray-500 uppercase">Auditado por:</p>
                    <div className="w-32 h-px bg-gray-300 mt-4"></div>
                    <p className="text-[8px] text-gray-400 mt-1">Gestor da Unidade</p>
                 </div>
            </div>
        </div>
    )
}
