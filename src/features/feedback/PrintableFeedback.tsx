import React from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PrintableFeedbackProps {
    feedback: any
}

export const PrintableFeedback: React.FC<PrintableFeedbackProps> = ({ feedback }) => {
    if (!feedback) return null

    const f = feedback
    const diag = f.diagnostic_json || {}
    const seller = diag.seller_snapshot || {}
    const team = diag.team_snapshot || {}
    const weekStart = f.week_reference ? parseISO(f.week_reference) : new Date()

    return (
        <div className="printable-feedback p-mx-lg bg-white text-black font-sans leading-tight">
            <style>{`
                @media print {
                    .printable-feedback { padding: 0 !important; }
                    body { background: white !important; }
                }
                .legacy-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
                .legacy-table th, .legacy-table td { border: 1px solid var(--color-border-strong); padding: 6px 10px; text-align: center; }
                .header-blue { background-color: var(--color-brand-secondary); color: white; font-weight: bold; text-transform: uppercase; }
                .header-gray { background-color: var(--color-surface-alt); color: var(--color-text-secondary); font-weight: bold; }
                .header-yellow { background-color: #facc15; color: var(--color-text-primary); font-weight: bold; text-align: left !important; }
                .header-lightblue { background-color: #dbeafe; color: #1e3a8a; font-weight: bold; text-align: left !important; }
                .status-bom { color: var(--color-status-success); font-weight: bold; }
                .status-abaixo { color: var(--color-status-error); font-weight: bold; }
                .status-igual { color: var(--color-text-secondary); font-weight: bold; }
                .diagnostico { color: var(--color-status-error); font-weight: bold; }
            `}</style>

            <table className="legacy-table">
                <thead>
                    <tr className="header-blue">
                        <th colSpan={5}>RESUMO DO VENDEDOR: {f.seller_name || 'VENDEDOR'}</th>
                    </tr>
                    <tr className="header-gray text-mx-micro">
                        <th>Leads Recebidos</th>
                        <th>Agendamentos Feitos</th>
                        <th>Visitas Realizadas</th>
                        <th>Vendas Fechadas</th>
                        <th>Sua Meta Semanal</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{f.leads_week || 0}</td>
                        <td>{f.agd_week || 0}</td>
                        <td>{f.visit_week || 0}</td>
                        <td>{f.vnd_week || 0}</td>
                        <td>{f.meta_compromisso || 0}</td>
                    </tr>
                </tbody>
            </table>

            <table className="legacy-table">
                <thead>
                    <tr className="header-yellow">
                        <th colSpan={4}>ANÁLISE DE APROVEITAMENTO (REAL vs IDEAL)</th>
                    </tr>
                    <tr className="header-gray">
                        <th style={{ textAlign: 'left' }}>Etapa do Processo</th>
                        <th>Seu Resultado</th>
                        <th>O Ideal Seria</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ textAlign: 'left' }}>De Leads para Agendamentos</td>
                        <td>{f.tx_lead_agd || 0}%</td>
                        <td>20%</td>
                        <td className={f.tx_lead_agd >= 20 ? 'status-bom' : 'status-abaixo'}>
                            {f.tx_lead_agd >= 20 ? 'Bom' : 'Abaixo'}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ textAlign: 'left' }}>De Agendamentos para Visitas</td>
                        <td>{f.tx_agd_visita || 0}%</td>
                        <td>60%</td>
                        <td className={f.tx_agd_visita >= 60 ? 'status-bom' : 'status-abaixo'}>
                            {f.tx_agd_visita >= 60 ? 'Bom' : 'Abaixo'}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ textAlign: 'left' }}>De Visitas para Vendas</td>
                        <td>{f.tx_visita_vnd || 0}%</td>
                        <td>33%</td>
                        <td className={f.tx_visita_vnd >= 33 ? 'status-bom' : 'status-abaixo'}>
                            {f.tx_visita_vnd >= 33 ? 'Bom' : 'Abaixo'}
                        </td>
                    </tr>
                </tbody>
            </table>

            <table className="legacy-table">
                <thead>
                    <tr className="header-lightblue">
                        <th colSpan={4}>SEU DESEMPENHO COMPARADO À MÉDIA DA EQUIPE</th>
                    </tr>
                    <tr className="header-gray">
                        <th style={{ textAlign: 'left' }}>Critério</th>
                        <th>Sua Produção</th>
                        <th>Média da Equipe</th>
                        <th>Conclusão</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ textAlign: 'left' }}>Volume de Vendas</td>
                        <td>{f.vnd_week || 0}</td>
                        <td>{team.vnd_total || '0'}</td>
                        <td>{f.vnd_week >= (team.vnd_total || 0) ? 'MAIOR que a média (+)' : 'MENOR que a média (-)'}</td>
                    </tr>
                    <tr>
                        <td style={{ textAlign: 'left' }}>Volume de Agendamentos</td>
                        <td>{f.agd_week || 0}</td>
                        <td>{team.agd_total || '0'}</td>
                        <td>{f.agd_week >= (team.agd_total || 0) ? 'MAIOR que a média (+)' : 'MENOR que a média (-)'}</td>
                    </tr>
                    <tr>
                        <td style={{ textAlign: 'left' }}>Volume de Visitas</td>
                        <td>{f.visit_week || 0}</td>
                        <td>{team.visitas || '0'}</td>
                        <td>{f.visit_week >= (team.visitas || 0) ? 'MAIOR que a média (+)' : 'MENOR que a média (-)'}</td>
                    </tr>
                </tbody>
            </table>

            <div className="mt-6 flex flex-col gap-mx-sm">
                <div className="flex gap-mx-xs">
                    <span className="font-bold uppercase min-w-mx-label-lg text-mx-tiny">Diagnóstico da Semana:</span>
                    <span className="diagnostico text-mx-tiny whitespace-pre-wrap">{f.attention_points}</span>
                </div>
                <div className="flex gap-mx-xs">
                    <span className="font-bold uppercase min-w-mx-label-lg text-mx-tiny">Orientação de Ação:</span>
                    <span className="text-mx-tiny whitespace-pre-wrap">{f.action}</span>
                </div>
            </div>

            <div className="mt-10 pt-4 border-t border-border-strong">
                 <p className="font-bold text-mx-tiny uppercase text-text-tertiary mb-2">Entenda a conta (Boas Práticas do Setor)</p>
                 <p className="text-mx-micro text-text-tertiary italic">
                    Consideramos como ideal: 20% do volume total de leads vira agendamento | Para cada 5 agendamentos, 3 viram visitas (60%) | Para cada 3 visitas, 1 vira venda (33%).
                 </p>
            </div>
        </div>
    )
}
