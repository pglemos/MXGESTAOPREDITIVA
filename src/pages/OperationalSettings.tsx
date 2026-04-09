import { useState, useEffect, useCallback } from 'react'
import { 
    Settings2, Shield, Zap, RefreshCw, Save, 
    AlertTriangle, History, Info, Lock, Eye, EyeOff
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
        // Simulação de fetch de configurações específicas da loja
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
        <main className="h-full w-full flex flex-col items-center justify-center text-center p-10 bg-surface-alt">
            <Lock size={48} className="text-text-tertiary mb-6 opacity-20" aria-hidden="true" />
            <Typography variant="h2">Privilégios Insuficientes</Typography>
            <Typography variant="p" tone="muted" className="max-w-xs mt-2 uppercase">Apenas o alto comando pode alterar parâmetros de governança.</Typography>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-white">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Parâmetros <span className="text-brand-primary">MX</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Configurações de Hardening & Governança</Typography>
                </div>

                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={fetchSettings} disabled={isRefetching} className="rounded-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !selectedStoreId} className="h-12 px-10 rounded-full shadow-mx-xl">
                        {saving ? <RefreshCw className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />} Firmar Protocolos
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg">
                <aside className="lg:col-span-4 space-y-mx-lg">
                    <Card className="p-10 space-y-8 bg-surface-alt border-none shadow-inner">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-border-default flex items-center justify-center text-brand-primary shadow-mx-sm" aria-hidden="true"><Settings2 size={24} /></div>
                            <Typography variant="h3">Unidade Alvo</Typography>
                        </div>
                        <div className="space-y-4">
                            <Typography variant="caption" tone="muted" className="ml-2">Selecionar Loja da Rede</Typography>
                            <select
                                value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)}
                                className="w-full h-14 px-6 bg-white border border-border-default rounded-mx-md text-sm font-bold text-slate-950 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all appearance-none cursor-pointer shadow-mx-sm"
                            >
                                <option value="">Escolher unidade...</option>
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                            </select>
                        </div>
                    </Card>

                    <Card className="p-10 space-y-6 bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12" aria-hidden="true"><Shield size={160} /></div>
                        <Typography variant="h3" tone="white">Nível de Segurança</Typography>
                        <p className="text-sm font-bold leading-relaxed italic opacity-60 uppercase tracking-tight">"O modo estrito impede registros retroativos fora da janela de tolerância de 24h."</p>
                    </Card>
                </aside>

                <section className="lg:col-span-8">
                    <Card className="p-10 md:p-14 space-y-12 h-full">
                        <div className="space-y-10">
                            <div className="flex items-center justify-between group">
                                <div className="space-y-2">
                                    <Typography variant="h3" className="text-base group-hover:text-brand-primary transition-colors">Modo de Auditoria Forense</Typography>
                                    <Typography variant="caption" tone="muted">Habilitar logs profundos de cada transação</Typography>
                                </div>
                                <Button 
                                    variant={settings.audit_mode ? 'secondary' : 'outline'}
                                    onClick={() => setSettings(p => ({ ...p, audit_mode: !p.audit_mode }))}
                                    className="w-20 h-10 rounded-full"
                                >
                                    {settings.audit_mode ? 'ON' : 'OFF'}
                                </Button>
                            </div>

                            <div className="flex items-center justify-between group">
                                <div className="space-y-2">
                                    <Typography variant="h3" className="text-base group-hover:text-brand-primary transition-colors">Check-in Estrito</Typography>
                                    <Typography variant="caption" tone="muted">Bloquear acessos sem registro matinal</Typography>
                                </div>
                                <Button 
                                    variant={settings.strict_checkin ? 'secondary' : 'outline'}
                                    onClick={() => setSettings(p => ({ ...p, strict_checkin: !p.strict_checkin }))}
                                    className="w-20 h-10 rounded-full"
                                >
                                    {settings.strict_checkin ? 'ON' : 'OFF'}
                                </Button>
                            </div>

                            <div className="flex items-center justify-between group">
                                <div className="space-y-2">
                                    <Typography variant="h3" className="text-base group-hover:text-brand-primary transition-colors">Horário Limite Matinal</Typography>
                                    <Typography variant="caption" tone="muted">Deadline para disparo de relatórios automáticos</Typography>
                                </div>
                                <input 
                                    type="time" value={settings.morning_report_time} 
                                    onChange={e => setSettings(p => ({ ...p, morning_report_time: e.target.value }))}
                                    className="h-12 px-6 bg-surface-alt border border-border-default rounded-xl font-mono-numbers font-black text-slate-950 focus:border-brand-primary outline-none transition-all"
                                />
                            </div>

                            <div className="flex items-center justify-between group">
                                <div className="space-y-2">
                                    <Typography variant="h3" className="text-base group-hover:text-brand-primary transition-colors">Permitir Lançamento Manual</Typography>
                                    <Typography variant="caption" tone="muted">Autorizar gerente a retroagir dados da loja</Typography>
                                </div>
                                <Button 
                                    variant={settings.allow_manual_retro ? 'secondary' : 'outline'}
                                    onClick={() => setSettings(p => ({ ...p, allow_manual_retro: !p.allow_manual_retro }))}
                                    className="w-20 h-10 rounded-full"
                                >
                                    {settings.allow_manual_retro ? 'ON' : 'OFF'}
                                </Button>
                            </div>
                        </div>

                        <div className="pt-12 border-t border-border-default flex items-center gap-4 text-text-tertiary">
                            <Info size={18} aria-hidden="true" />
                            <Typography variant="p" tone="muted" className="text-[10px] leading-relaxed uppercase tracking-tight">Qualquer alteração nestes parâmetros será registrada no log de auditoria global com timestamp e IP do autor.</Typography>
                        </div>
                    </Card>
                </section>
            </div>
        </main>
    )
}
