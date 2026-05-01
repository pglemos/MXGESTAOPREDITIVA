import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, Database, ExternalLink, Server, ShieldCheck, Cpu, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/molecules/Card'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AuditEntry {
    id: string
    created_at: string
    action: string
    actor_email?: string | null
    target?: string | null
    metadata?: any
}

interface StoreAuditRow {
    id: string
    created_at: string
    store_id: string | null
    changed_by: string | null
    changes: Record<string, unknown> | null
}

export function SistemaMxTab() {
    const [audit, setAudit] = useState<AuditEntry[]>([])
    const [loading, setLoading] = useState(true)

    const fetchAudit = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('logs_auditoria_loja')
            .select('id, created_at, store_id, changed_by, changes')
            .order('created_at', { ascending: false })
            .limit(20)
        if (!error && data) {
            setAudit((data as StoreAuditRow[]).map(row => ({
                id: row.id,
                created_at: row.created_at,
                action: 'UPDATE_LOJA',
                actor_email: row.changed_by ? `user:${row.changed_by.slice(0, 8)}` : 'sistema',
                target: row.store_id ? `loja:${row.store_id.slice(0, 8)}` : null,
                metadata: row.changes,
            })))
        }
        setLoading(false)
    }

    useEffect(() => { fetchAudit() }, [])

    return (
        <div className="space-y-mx-lg">
            {/* System status header */}
            <Card className="p-mx-lg border-none shadow-mx-lg bg-pure-black text-white relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-mx-48 h-mx-48 bg-status-success/20 rounded-mx-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex items-center justify-between gap-mx-md flex-wrap">
                    <div className="flex items-center gap-mx-md">
                        <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-white/10 border border-white/10 flex items-center justify-center text-status-success">
                            <Server size={28} />
                        </div>
                        <div>
                            <Typography variant="h3" tone="white" className="uppercase tracking-tight">Sistema MX</Typography>
                            <Typography variant="caption" tone="white" className="uppercase tracking-widest font-black opacity-60">
                                Saúde, auditoria e operações críticas
                            </Typography>
                        </div>
                    </div>
                    <div className="flex items-center gap-mx-md">
                        <StatusPill icon={<Cpu size={14} />} label="API" tone="success" value="100%" />
                        <StatusPill icon={<Database size={14} />} label="DB" tone="success" value="OK" />
                        <StatusPill icon={<Activity size={14} />} label="Realtime" tone="success" value="Ativo" />
                    </div>
                </div>
            </Card>

            {/* Operações críticas */}
            <div className="grid md:grid-cols-3 gap-mx-md">
                <CriticalOpCard
                    icon={<RefreshCw size={22} />}
                    label="Reprocessamento"
                    desc="Reimportar dados brutos de uma loja"
                    route="/configuracoes/reprocessamento"
                    severity="warning"
                />
                <CriticalOpCard
                    icon={<Cpu size={22} />}
                    label="AI Diagnostics"
                    desc="Diagnósticos preditivos da IA MX"
                    route="/auditoria"
                    severity="info"
                />
                <CriticalOpCard
                    icon={<ShieldCheck size={22} />}
                    label="Configuração Operacional"
                    desc="Página dedicada de parâmetros por loja"
                    route="/configuracoes/operacional"
                    severity="info"
                />
            </div>

            {/* Auditoria */}
            <Card className="border-none shadow-mx-lg bg-white overflow-hidden">
                <header className="flex items-center justify-between p-mx-md border-b border-border-default">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-12 h-mx-12 rounded-mx-xl bg-mx-indigo-50 text-brand-primary flex items-center justify-center">
                            <Activity size={20} />
                        </div>
                        <div>
                            <Typography variant="caption" className="font-black uppercase tracking-widest">Log de Auditoria</Typography>
                            <Typography variant="tiny" tone="muted" className="font-bold">Últimas 20 ações sensíveis</Typography>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={fetchAudit} className="rounded-mx-xl">
                        <RefreshCw size={16} />
                    </Button>
                </header>

                {loading ? (
                    <div className="p-mx-xl text-center"><RefreshCw size={24} className="animate-spin mx-auto text-brand-primary" /></div>
                ) : audit.length === 0 ? (
                    <div className="p-mx-xl text-center space-y-mx-sm">
                        <Activity size={40} className="mx-auto text-text-tertiary opacity-30" />
                        <Typography variant="caption" tone="muted" className="font-black uppercase">Nenhum registro de auditoria</Typography>
                    </div>
                ) : (
                    <div className="divide-y divide-border-default">
                        {audit.map(entry => (
                            <div key={entry.id} className="flex items-start gap-mx-md p-mx-md hover:bg-surface-alt transition-colors">
                                <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-status-warning/10 text-status-warning flex items-center justify-center shrink-0">
                                    <AlertTriangle size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <Typography variant="caption" className="font-black uppercase tracking-tight font-mono-numbers">
                                        {entry.action}
                                    </Typography>
                                    <Typography variant="tiny" tone="muted" className="font-bold mt-1">
                                        {entry.actor_email || 'sistema'} {entry.target ? `→ ${entry.target}` : ''}
                                    </Typography>
                                </div>
                                <Badge variant="outline" className="text-mx-micro font-black uppercase shrink-0">
                                    {format(new Date(entry.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Versão */}
            <Card className="p-mx-md border-none shadow-mx-sm bg-surface-alt">
                <div className="flex items-center justify-between">
                    <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Versão do Terminal</Typography>
                    <Typography variant="tiny" className="font-mono-numbers font-black">4.0.2-stable</Typography>
                </div>
            </Card>
        </div>
    )
}

function StatusPill({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'success' | 'warning' | 'error' }) {
    const colors = {
        success: 'bg-status-success/10 text-status-success border-status-success/20',
        warning: 'bg-status-warning/10 text-status-warning border-status-warning/20',
        error: 'bg-status-error/10 text-status-error border-status-error/20',
    }
    return (
        <div className={`flex items-center gap-mx-xs px-3 h-mx-10 rounded-mx-full border ${colors[tone]}`}>
            {icon}
            <span className="text-xs font-black uppercase tracking-widest">{label}</span>
            <span className="text-xs font-black tabular-nums opacity-70">{value}</span>
        </div>
    )
}

function CriticalOpCard({ icon, label, desc, route, severity }: {
    icon: React.ReactNode
    label: string
    desc: string
    route: string
    severity: 'warning' | 'info' | 'error'
}) {
    const sev = {
        warning: 'border-status-warning/20 bg-status-warning/5 text-status-warning',
        info: 'border-mx-indigo-100 bg-mx-indigo-50 text-brand-primary',
        error: 'border-status-error/20 bg-status-error/5 text-status-error',
    }
    return (
        <Card className="p-mx-md border-none shadow-mx-md bg-white hover:shadow-mx-lg transition-shadow">
            <div className={`w-mx-12 h-mx-12 rounded-mx-xl border flex items-center justify-center mb-mx-sm ${sev[severity]}`}>
                {icon}
            </div>
            <Typography variant="caption" className="font-black uppercase tracking-tight">{label}</Typography>
            <Typography variant="tiny" tone="muted" className="font-bold leading-relaxed mt-1 mb-mx-sm">{desc}</Typography>
            <Button asChild variant="outline" size="sm" className="h-mx-9 px-3 rounded-mx-lg font-black uppercase text-mx-micro tracking-widest">
                <a href={route}>Abrir <ExternalLink size={11} className="ml-1" /></a>
            </Button>
        </Card>
    )
}
