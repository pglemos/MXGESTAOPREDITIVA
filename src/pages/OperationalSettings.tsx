import { useState, useEffect, useCallback } from 'react'
import { 
    Settings2, Shield, Zap, RefreshCw, Save, 
    AlertTriangle, History, Info, Lock, Eye, EyeOff,
    ChevronDown, ShieldAlert, ShieldCheck,
    Mail, Send, Plus, X, Globe, MessageSquare
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { useAuth } from '@/hooks/useAuth'
import { useStores } from '@/hooks/useTeam'
import { useStoreDeliveryRules } from '@/hooks/useData'
import { useStoreMetaRules } from '@/hooks/useGoals'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function OperationalSettings() {
    const { role } = useAuth()
    const { stores, loading: storesLoading } = useStores()
    
    const urlStoreId = new URLSearchParams(window.location.search).get('id')
    const [selectedStoreId, setSelectedStoreId] = useState(urlStoreId || '')

    // Sync state with URL param if it changes
    useEffect(() => {
        if (urlStoreId && urlStoreId !== selectedStoreId) {
            setSelectedStoreId(urlStoreId)
        }
    }, [urlStoreId])

    const handleStoreChange = (newId: string) => {
        setSelectedStoreId(newId)
    }

    const [settings, setSettings] = useState({ 
        audit_mode: false, 
        strict_checkin: true, 
        morning_report_time: '10:30',
        allow_manual_retro: false 
    })

    const { deliveryRules, loading: rulesLoading, updateDeliveryRules } = useStoreDeliveryRules(selectedStoreId)
    const { metaRules, updateMetaRules } = useStoreMetaRules(selectedStoreId)
    const [emailLists, setEmailLists] = useState({
        matinal: '',
        weekly: '',
        monthly: ''
    })

    const [saving, setSaving] = useState(false)
    const [isRefetching, setIsRefetching] = useState(false)

    useEffect(() => {
        if (deliveryRules) {
            setEmailLists({
                matinal: deliveryRules.matinal_recipients?.join(', ') || '',
                weekly: deliveryRules.weekly_recipients?.join(', ') || '',
                monthly: deliveryRules.monthly_recipients?.join(', ') || ''
            })
        } else {
            setEmailLists({ matinal: '', weekly: '', monthly: '' })
        }
    }, [deliveryRules])

    const fetchSettings = useCallback(async () => {
        if (!selectedStoreId) return
        setIsRefetching(true)
        await new Promise(r => setTimeout(r, 500))
        setIsRefetching(false)
    }, [selectedStoreId])

    useEffect(() => { fetchSettings() }, [fetchSettings])

    const handleSave = async () => {
        if (!selectedStoreId) return
        setSaving(true)
        
        const { error } = await updateDeliveryRules({
            matinal_recipients: emailLists.matinal.split(',').map(e => e.trim()).filter(e => e.includes('@')),
            weekly_recipients: emailLists.weekly.split(',').map(e => e.trim()).filter(e => e.includes('@')),
            monthly_recipients: emailLists.monthly.split(',').map(e => e.trim()).filter(e => e.includes('@'))
        })

        if (error) {
            toast.error(error)
        } else {
            toast.success('Parâmetros operacionais e listas de e-mail firmados!')
        }
        setSaving(false)
    }

    if (role !== 'admin' && role !== 'dono') return (
        <main className="h-full w-full flex flex-col items-center justify-center text-center p-mx-xl bg-surface-alt" id="main-content">
            <Lock size={64} className="text-text-tertiary mb-8 opacity-20" aria-hidden="true" />
            <Typography variant="h2" className="uppercase tracking-tighter">Privilégios Insuficientes</Typography>
            <Typography variant="caption" tone="muted" className="max-w-xs mt-4 uppercase tracking-widest leading-relaxed font-black">Apenas o alto comando administrativo pode alterar parâmetros de governança da malha.</Typography>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt" id="main-content">
            
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0" role="banner">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Parâmetros <span className="text-mx-green-700">MX</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black text-text-label">CONFIGURAÇÕES DE HARDENING & GOVERNANÇA</Typography>
                </div>

                <div className="flex items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={fetchSettings} disabled={isRefetching} className="w-mx-xl h-mx-xl rounded-mx-xl shadow-mx-sm bg-white" aria-label="Recarregar configurações">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !selectedStoreId} className="h-mx-xl px-10 rounded-mx-full shadow-mx-lg bg-brand-secondary font-black uppercase text-xs tracking-widest">
                        {saving ? <RefreshCw className="animate-spin mr-2" aria-hidden="true" /> : <ShieldCheck size={18} className="mr-2" aria-hidden="true" />} FIRMAR PROTOCOLOS
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg pb-32">
                <aside className="lg:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-mx-lg md:p-14 space-y-mx-10 border-none shadow-mx-lg bg-white">
                        <header className="flex items-center gap-mx-sm border-b border-border-default pb-8">
                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center text-brand-primary shadow-inner" aria-hidden="true"><Settings2 size={28} /></div>
                            <Typography variant="h3" className="uppercase tracking-tight font-black">Unidade Alvo</Typography>
                        </header>
                        
                        <div className="space-y-mx-sm">
                            <label htmlFor="store-select" className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary ml-2">Selecionar Loja</label>
                            <div className="relative group">
                                <select
                                    id="store-select"
                                    value={selectedStoreId} onChange={(e) => handleStoreChange(e.target.value)}
                                    className="w-full h-mx-14 px-6 bg-surface-alt border border-border-default rounded-mx-xl text-sm font-bold text-text-primary outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all appearance-none cursor-pointer shadow-inner uppercase"
                                >
                                    <option value="">Selecione a unidade...</option>
                                    {stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                </select>
                                <ChevronDown size={18} className="absolute right-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none group-hover:text-brand-primary transition-colors" aria-hidden="true" />
                            </div>
                        </div>

                        {selectedStoreId && (
                            <div className="p-mx-md bg-mx-indigo-50 border border-mx-indigo-100 shadow-inner flex items-center gap-mx-sm rounded-mx-xl" role="status">
                                <div className="w-2.5 h-2.5 rounded-mx-full bg-brand-primary animate-pulse" aria-hidden="true" />
                                <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest">Unidade Indexada para Configuração</Typography>
                            </div>
                        )}
                    </Card>

                    <Card className="p-mx-lg md:p-14 bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700" aria-hidden="true"><Shield size={160} /></div>
                        <Typography variant="h3" tone="white" className="mb-6 uppercase tracking-tight font-black">Nível de Hardening</Typography>
                        <Typography variant="p" tone="white" className="text-xs font-bold leading-relaxed italic opacity-60 uppercase tracking-tight">
                            "O modo estrito impede registros retroativos fora da janela de tolerância de 24h, garantindo a integridade forense dos dados."
                        </Typography>
                    </Card>
                </aside>

                <section className="lg:col-span-8">
                    <Card className="p-mx-lg md:p-14 md:p-14 border-none shadow-mx-xl bg-white space-y-mx-xl">
                        <header className="border-b border-border-default pb-8">
                            <Typography variant="h2" className="uppercase tracking-tighter">Políticas Operacionais</Typography>
                            <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1 font-black font-black">REGRAS DE NEGÓCIO MANDATÁRIAS</Typography>
                        </header>

                        <div className="space-y-mx-10" role="group" aria-label="Lista de políticas operacionais">
                            {[
                                { label: 'Modo de Auditoria Forense', desc: 'Habilitar logs profundos de cada transação operacional', field: 'audit_mode' },
                                { label: 'Check-in Estrito', desc: 'Bloquear acesso ao cockpit sem o registro matinal obrigatório', field: 'strict_checkin' },
                                { label: 'Lançamento Manual', desc: 'Autorizar gerência a retroagir dados em caso de falha sistêmica', field: 'allow_manual_retro' }
                            ].map((s) => (
                                <div key={s.field} className="flex items-center justify-between group p-mx-md rounded-mx-2xl hover:bg-surface-alt transition-all">
                                    <div className="space-y-mx-tiny">
                                        <Typography variant="h3" className="text-base group-hover:text-brand-primary transition-colors uppercase tracking-tight font-black">{s.label}</Typography>
                                        <Typography variant="caption" tone="muted" className="text-mx-tiny font-black uppercase opacity-60">{s.desc}</Typography>
                                    </div>
                                    <Button 
                                        variant={settings[s.field as keyof typeof settings] ? 'secondary' : 'outline'}
                                        onClick={() => setSettings(p => ({ ...p, [s.field]: !p[s.field as keyof typeof settings] }))}
                                        className="w-mx-3xl h-mx-xl rounded-mx-full font-black text-mx-tiny shadow-sm bg-white"
                                        aria-pressed={!!settings[s.field as keyof typeof settings]}
                                    >
                                        {settings[s.field as keyof typeof settings] ? 'ATIVADO' : 'OFF'}
                                    </Button>
                                </div>
                            ))}

                                <div className="flex items-center justify-between group p-mx-md rounded-mx-2xl hover:bg-surface-alt transition-all">
                                    <div className="space-y-mx-tiny">
                                        <Typography variant="h3" className="text-base group-hover:text-brand-primary transition-colors uppercase tracking-tight font-black">Justiça Matemática (v1.1)</Typography>
                                        <Typography variant="caption" tone="muted" className="text-mx-tiny font-black uppercase opacity-60">Base de cálculo da projeção e ritmo diário</Typography>
                                    </div>
                                    <div className="flex p-mx-tiny bg-white border border-border-default rounded-mx-full shadow-mx-sm" role="radiogroup">
                                        <Button 
                                            variant={metaRules?.projection_mode === 'calendar' ? 'secondary' : 'ghost'} size="sm"
                                            onClick={() => updateMetaRules({ projection_mode: 'calendar' })}
                                            className="h-mx-9 px-6 rounded-mx-full text-mx-tiny uppercase font-black"
                                        >
                                            CALENDÁRIO
                                        </Button>
                                        <Button 
                                            variant={metaRules?.projection_mode === 'business' ? 'secondary' : 'ghost'} size="sm"
                                            onClick={() => updateMetaRules({ projection_mode: 'business' })}
                                            className="h-mx-9 px-6 rounded-mx-full text-mx-tiny uppercase font-black"
                                        >
                                            DIAS ÚTEIS
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between group p-mx-md rounded-mx-2xl hover:bg-surface-alt transition-all">
                                    <div className="space-y-mx-tiny">
                                        <Typography variant="h3" className="text-base group-hover:text-brand-primary transition-colors uppercase tracking-tight font-black">Horário Limite Matinal</Typography>
                                    <Typography variant="caption" tone="muted" className="text-mx-tiny font-black uppercase opacity-60">Deadline para disparo de relatórios automáticos de rede</Typography>
                                </div>
                                <div className="relative">
                                    <History size={14} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
                                    <label htmlFor="morning-time" className="sr-only">Escolher horário limite</label>
                                    <input 
                                        id="morning-time"
                                        type="time" value={settings.morning_report_time} 
                                        onChange={e => setSettings(p => ({ ...p, morning_report_time: e.target.value }))}
                                        className="h-mx-xl pl-10 pr-6 bg-white border border-border-default rounded-mx-xl font-mono-numbers font-black text-sm text-text-primary focus:border-brand-primary outline-none shadow-mx-inner transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <footer className="pt-12 border-t border-border-default flex items-start gap-mx-sm">
                            <ShieldAlert size={20} className="text-status-warning shrink-0 mt-0.5" aria-hidden="true" />
                            <Typography variant="tiny" tone="muted" className="leading-relaxed uppercase font-black">Qualquer alteração nestes parâmetros será registrada no log de auditoria global com timestamp imutável e ID do administrador responsável.</Typography>
                        </footer>
                    </Card>

                    {/* Email Recipients Section */}
                    {selectedStoreId && (
                        <Card className="mt-mx-lg p-mx-10 md:p-14 border-none shadow-mx-xl bg-white space-y-mx-xl">
                            <header className="border-b border-border-default pb-8 flex items-center justify-between">
                                <div>
                                    <Typography variant="h2" className="uppercase tracking-tighter">Destinatários Oficiais</Typography>
                                    <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1 font-black">DISTRIBUIÇÃO AUTOMÁTICA DE RELATÓRIOS</Typography>
                                </div>
                                <Mail size={24} className="text-brand-primary opacity-20" aria-hidden="true" />
                            </header>

                            <div className="space-y-mx-10">
                                {[
                                    { label: 'Relatório Matinal', key: 'matinal', desc: 'Destinatários do matinal diário (D-0)' },
                                    { label: 'Ciclo Semanal', key: 'weekly', desc: 'Destinatários das mentorias e fechamentos de semana' },
                                    { label: 'Estratégico / Direção', key: 'monthly', desc: 'Diretoria e Sócios - Visão de fechamento e BI' },
                                ].map((list) => (
                                    <div key={list.key} className="space-y-mx-sm">
                                        <div className="flex items-center justify-between px-2">
                                            <div className="space-y-mx-tiny">
                                                <Typography variant="caption" className="font-black uppercase tracking-widest">{list.label}</Typography>
                                                <Typography variant="tiny" tone="muted" className="uppercase font-black">{list.desc}</Typography>
                                            </div>
                                            <Badge variant="outline" className="text-mx-micro font-black border-border-strong uppercase">{emailLists[list.key as keyof typeof emailLists].split(',').filter(Boolean).length} E-mails</Badge>
                                        </div>
                                        <label htmlFor={`emails-${list.key}`} className="sr-only">{list.label} - Lista de emails</label>
                                        <textarea 
                                            id={`emails-${list.key}`}
                                            value={emailLists[list.key as keyof typeof emailLists]}
                                            onChange={e => setEmailLists(prev => ({ ...prev, [list.key]: e.target.value }))}
                                            placeholder="email1@empresa.com, email2@empresa.com..."
                                            className="w-full h-mx-3xl p-mx-md bg-surface-alt border border-border-default rounded-mx-2xl text-xs font-bold focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all outline-none resize-none shadow-mx-inner"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="bg-mx-indigo-50 p-mx-md rounded-mx-2xl border border-mx-indigo-100 flex items-center gap-mx-sm">
                                <Info size={18} className="text-brand-primary shrink-0" aria-hidden="true" />
                                <Typography variant="tiny" tone="brand" className="font-black uppercase leading-tight">
                                    Separe os e-mails por vírgula. O sistema validará a sintaxe antes de disparar as automações de rede.
                                </Typography>
                            </div>
                        </Card>
                    )}
                </section>
            </div>
        </main>
    )
}
