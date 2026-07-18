import { Calendar, Globe, Webhook, ExternalLink, ShieldCheck, Database, Zap } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { GoogleCalendarStatus } from '@/features/agenda/components/GoogleCalendarStatus'
import { Link } from 'react-router-dom'

export function IntegracoesTab() {
    return (
        <div className="space-y-8">
            {/* Google Calendar pessoal + central */}
            <Card className="p-8 md:p-12 border-none shadow-sm bg-white">
                <header className="flex items-center gap-4 pb-6 border-b border-gray-100 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-emerald-600 flex items-center justify-center border border-indigo-100">
                        <Calendar size={26} />
                    </div>
                    <div>
                        <Typography variant="h3" className="uppercase tracking-tight">Google Calendar</Typography>
                        <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black">Sincronização pessoal e Agenda Central MX</Typography>
                    </div>
                </header>
                <GoogleCalendarStatus />
            </Card>

            {/* Atalhos para áreas admin */}
            <div className="grid md:grid-cols-2 gap-6">
                <IntegrationCard
                    icon={<Calendar size={22} />}
                    title="Agenda Admin MX"
                    desc="Coordenação central de visitas e eventos da rede"
                    badge="Operacional"
                    route="/agenda"
                />
                <IntegrationCard
                    icon={<Database size={22} />}
                    title="Reprocessamento de Dados"
                    desc="Reimportação manual de dados brutos por loja"
                    badge="Manual"
                    route="/configuracoes/reprocessamento"
                />
                <IntegrationCard
                    icon={<Zap size={22} />}
                    title="Auditoria de Funil"
                    desc="Diagnóstico heurístico da rede com benchmarks MX"
                    badge="MX"
                    route="/auditoria"
                />
                <IntegrationCard
                    icon={<ShieldCheck size={22} />}
                    title="OAuth & Tokens"
                    desc="Limpeza automática de estados OAuth (cron)"
                    badge="Auto"
                    disabled
                />
            </div>

            {/* Webhooks placeholder */}
            <Card className="p-8 border-none shadow-sm bg-white">
                <header className="flex items-center justify-between pb-6 border-b border-gray-100 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-500 flex items-center justify-center border border-gray-100">
                            <Webhook size={26} />
                        </div>
                        <div>
                            <Typography variant="h3" className="uppercase tracking-tight">Webhooks</Typography>
                            <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black">Integrações externas</Typography>
                        </div>
                    </div>
                    <Badge variant="outline" className="font-black uppercase">Em breve</Badge>
                </header>
                <Typography variant="caption" tone="muted" className="font-bold leading-relaxed">
                    Conecte sistemas externos via webhooks (Slack, Notion, ERPs, CRMs).
                    Endpoints de saída para eventos: novo lead, fechamento de venda, alerta de gap.
                </Typography>
            </Card>

            {/* Edge Functions */}
            <Card className="p-8 border-none shadow-sm bg-white">
                <header className="flex items-center gap-4 pb-6 border-b border-gray-100 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center border border-emerald-600/20">
                        <Globe size={26} />
                    </div>
                    <div>
                        <Typography variant="h3" className="uppercase tracking-tight">Edge Functions Registradas</Typography>
                        <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black">Inventário local; saúde real via logs e Supabase</Typography>
                    </div>
                </header>
                <div className="grid md:grid-cols-2 gap-4">
                    {[
                        'register-user',
                        'relatorio-matinal',
                        'relatorio-mensal',
                        'feedback-semanal',
                        'send-individual-feedback',
                        'send-visit-report',
                        'google-calendar-sync',
                        'google-calendar-events',
                        'google-calendar-merged',
                        'google-oauth-handler',
                    ].map(fn => (
                        <div key={fn} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <Typography variant="tiny" className="font-mono tabular-nums font-bold">{fn}</Typography>
                            <Badge variant="outline" className="text-[9px] font-black uppercase">Registrada</Badge>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}

function IntegrationCard({ icon, title, desc, badge, route, disabled }: {
    icon: React.ReactNode
    title: string
    desc: string
    badge: string
    route?: string
    disabled?: boolean
}) {
    return (
        <Card className="p-6 border-none shadow-sm bg-white hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-emerald-600 flex items-center justify-center shrink-0">{icon}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <Typography variant="caption" className="font-black uppercase tracking-tight">{title}</Typography>
                        <Badge variant="outline" className="text-[9px] font-black uppercase shrink-0">{badge}</Badge>
                    </div>
                    <Typography variant="tiny" tone="muted" className="font-bold leading-relaxed mt-1 mb-4">{desc}</Typography>
                    {route && !disabled && (
                        <Button asChild variant="outline" size="sm" className="h-9 px-3 rounded-2xl font-black uppercase text-[9px] tracking-widest">
                            <Link to={route}>Acessar <ExternalLink size={11} className="ml-1" /></Link>
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    )
}
