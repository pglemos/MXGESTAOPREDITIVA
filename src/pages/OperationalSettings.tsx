import { useState, useEffect, useCallback } from 'react'
import { 
    Settings2, Shield, Zap, RefreshCw, Save, 
    AlertTriangle, History, Info, Lock, Eye, EyeOff,
    ChevronDown, ShieldAlert, ShieldCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { useAuth } from '@/hooks/useAuth'
import { useStores } from '@/hooks/useTeam'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function OperationalSettings() {
    const { role } = useAuth()
    const { stores, loading: storesLoading } = useStores()
    const [selectedStoreId, setSelectedStoreId] = useState('')
    const [settings, setSettings] = useState({ 
        audit_mode: false, 
        strict_checkin: true, 
        morning_report_time: '10:30',
        allow_manual_retro: false 
    })
    const [saving, setSaving] = useState(false)
    const [isRefetching, setIsRefetching] = useState(false)

    const fetchSettings = useCallback(async () => {
        if (!selectedStoreId) return
        setIsRefetching(true)
        await new Promise(r => setTimeout(r, 500))
        setIsRefetching(false)
    }, [selectedStoreId])

    useEffect(() => { fetchSettings() }, [fetchSettings])

    const handleSave = async () => {
        setSaving(true)
        await new Promise(r => setTimeout(r, 800))
        setSaving(false)
        toast.success('Parâmetros operacionais firmados!')
    }

    if (role !== 'admin' && role !== 'dono') return (
        <main className="h-full w-full flex flex-col items-center justify-center text-center p-mx-xl bg-surface-alt">
            <Lock size={64} className="text-text-tertiary mb-8 opacity-20" aria-hidden="true" />
            <Typography variant="h2">Privilégios Insuficientes</Typography>
            <Typography variant="p" tone="muted" className="max-w-xs mt-4 uppercase tracking-widest leading-relaxed">Apenas o alto comando administrativo pode alterar parâmetros de governança da malha.</Typography>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / Config Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Parâmetros <span className="text-brand-primary">MX</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">CONFIGURAÇÕES DE HARDENING & GOVERNANÇA</Typography>
                </div>

                <div className="flex items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={fetchSettings} disabled={isRefetching} className="w-12 h-12 rounded-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !selectedStoreId} className="h-12 px-10 rounded-full shadow-mx-lg bg-brand-secondary">
                        {saving ? <RefreshCw className="animate-spin mr-2" /> : <ShieldCheck size={18} className="mr-2" />} FIRMAR PROTOCOLOS
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg pb-32">
                <aside className="lg:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-10 space-y-10 border-none shadow-mx-lg bg-white">
                        <header className="flex items-center gap-4 border-b border-border-default pb-8">
                            <div className="w-14 h-14 rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center text-brand-primary shadow-inner"><Settings2 size={28} /></div>
                            <Typography variant="h3">Unidade Alvo</Typography>
                        </header>
                        
                        <div className="space-y-4">
                            <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Selecionar Loja</Typography>
                            <div className="relative group">
                                <select
                                    value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)}
                                    className="w-full h-14 px-6 bg-surface-alt border border-border-default rounded-mx-xl text-sm font-bold text-text-primary outline-none focus:border-brand-primary transition-all appearance-none cursor-pointer shadow-inner"
                                >
                                    <option value="">Selecione a unidade...</option>
                                    {stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none group-hover:text-brand-primary transition-colors" />
                            </div>
                        </div>

                        {selectedStoreId && (
                            <Card className="p-6 bg-mx-indigo-50 border border-mx-indigo-100 shadow-inner flex items-center gap-4">
                                <div className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />
                                <Typography variant="caption" tone="brand" className="font-black uppercase">Unidade Indexada para Configuração</Typography>
                            </Card>
                        )}
                    </Card>

                    <Card className="p-10 bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700"><Shield size={160} /></div>
                        <Typography variant="h3" tone="white" className="mb-6">Nível de Hardening</Typography>
                        <Typography variant="p" tone="white" className="text-sm font-bold leading-relaxed italic opacity-60 uppercase tracking-tight">
                            "O modo estrito impede registros retroativos fora da janela de tolerância de 24h, garantindo a integridade forense dos dados."
                        </Typography>
                    </Card>
                </aside>

                <section className="lg:col-span-8">
                    <Card className="p-10 md:p-14 border-none shadow-mx-xl bg-white space-y-12">
                        <header className="border-b border-border-default pb-8">
                            <Typography variant="h2">Políticas Operacionais</Typography>
                            <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1">REGRAS DE NEGÓCIO MANDATÁRIAS</Typography>
                        </header>

                        <div className="space-y-10">
                            {[
                                { label: 'Modo de Auditoria Forense', desc: 'Habilitar logs profundos de cada transação operacional', field: 'audit_mode' },
                                { label: 'Check-in Estrito', desc: 'Bloquear acesso ao cockpit sem o registro matinal obrigatório', field: 'strict_checkin' },
                                { label: 'Lançamento Manual', desc: 'Autorizar gerência a retroagir dados em caso de falha sistêmica', field: 'allow_manual_retro' }
                            ].map((s) => (
                                <div key={s.field} className="flex items-center justify-between group p-6 rounded-mx-2xl hover:bg-surface-alt transition-all">
                                    <div className="space-y-1">
                                        <Typography variant="h3" className="text-base group-hover:text-brand-primary transition-colors">{s.label}</Typography>
                                        <Typography variant="p" tone="muted" className="text-xs">{s.desc}</Typography>
                                    </div>
                                    <Button 
                                        variant={settings[s.field as keyof typeof settings] ? 'secondary' : 'outline'}
                                        onClick={() => setSettings(p => ({ ...p, [s.field]: !p[s.field as keyof typeof settings] }))}
                                        className="w-24 h-12 rounded-full font-black text-[10px] shadow-sm"
                                    >
                                        {settings[s.field as keyof typeof settings] ? 'ATIVADO' : 'OFF'}
                                    </Button>
                                </div>
                            ))}

                            <div className="flex items-center justify-between group p-6 rounded-mx-2xl hover:bg-surface-alt transition-all">
                                <div className="space-y-1">
                                    <Typography variant="h3" className="text-base group-hover:text-brand-primary transition-colors">Horário Limite Matinal</Typography>
                                    <Typography variant="p" tone="muted" className="text-xs">Deadline para disparo de relatórios automáticos de rede</Typography>
                                </div>
                                <div className="relative">
                                    <History size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                                    <input 
                                        type="time" value={settings.morning_report_time} 
                                        onChange={e => setSettings(p => ({ ...p, morning_report_time: e.target.value }))}
                                        className="h-12 pl-10 pr-6 bg-white border border-border-default rounded-mx-xl font-mono-numbers font-black text-sm text-text-primary focus:border-brand-primary outline-none shadow-sm transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <footer className="pt-12 border-t border-border-default flex items-start gap-4">
                            <ShieldAlert size={20} className="text-status-warning shrink-0 mt-0.5" />
                            <Typography variant="p" tone="muted" className="text-[10px] leading-relaxed uppercase font-bold opacity-60">Qualquer alteração nestes parâmetros será registrada no log de auditoria global com timestamp imutável e ID do administrador responsável.</Typography>
                        </footer>
                    </Card>
                </section>
            </div>
        </main>
    )
}
