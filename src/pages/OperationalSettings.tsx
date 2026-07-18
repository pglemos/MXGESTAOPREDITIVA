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
import { PageHeading } from '@/components/molecules/PageHeading'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { useStores } from '@/hooks/useTeam'
import { useStoreDeliveryRules } from '@/hooks/useData'
import { useStoreMetaRules } from '@/hooks/useGoals'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'

export default function OperationalSettings() {
    const { role } = useAuth()
    const { lojas, loading: storesLoading } = useStores()
    
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

    if (!isPerfilInternoMx(role) && role !== 'dono') return (
        <main className="h-full w-full flex flex-col items-center justify-center text-center p-12 bg-gray-50">
            <Lock size={64} className="text-gray-500 mb-8 opacity-20" aria-hidden="true" />
            <Typography variant="h2" className="uppercase tracking-tighter">Privilégios Insuficientes</Typography>
            <Typography variant="caption" tone="muted" className="max-w-xs mt-4 uppercase tracking-widest leading-relaxed font-black">Apenas o alto comando administrativo pode alterar parâmetros de governança da malha.</Typography>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-8 p-8 overflow-y-auto no-scrollbar bg-gray-50">
            
            <PageHeading
                title={<span>Parâmetros <span className="text-emerald-600">MX</span></span>}
                subtitle="CONFIGURAÇÕES DE HARDENING & GOVERNANÇA"
                actions={
                    <div className="flex items-center gap-4 shrink-0">
                        <Button variant="outline" size="icon" onClick={fetchSettings} disabled={isRefetching} className="w-12 h-12 rounded-2xl shadow-sm bg-white border border-gray-100 hover:bg-gray-50 text-gray-600" aria-label="Recarregar configurações">
                            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                        </Button>
                        <Button onClick={handleSave} disabled={saving || !selectedStoreId} className="h-12 px-10 rounded-2xl shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest">
                            {saving ? <RefreshCw className="animate-spin mr-2" aria-hidden="true" /> : <ShieldCheck size={18} className="mr-2" aria-hidden="true" />} FIRMAR PROTOCOLOS
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">
                <aside className="lg:col-span-4 flex flex-col gap-8">
                    <Card className="rounded-2xl border border-gray-100 p-6 space-y-6 bg-white shadow-sm">
                        <header className="flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-emerald-600 shadow-inner" aria-hidden="true"><Settings2 size={28} /></div>
                            <Typography variant="h3" className="uppercase tracking-tight font-black">Unidade Alvo</Typography>
                        </header>
                        
                        <div className="space-y-4">
                            <label htmlFor="store-select" className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Selecionar Loja</label>
                            <div className="relative group">
                                <select
                                    id="store-select"
                                    value={selectedStoreId} onChange={(e) => handleStoreChange(e.target.value)}
                                    className="w-full h-14 px-6 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none cursor-pointer shadow-inner uppercase"
                                >
                                    <option value="">Selecione a unidade...</option>
                                    {lojas.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-emerald-600 transition-colors" aria-hidden="true" />
                            </div>
                        </div>

                        {selectedStoreId && (
                            <div className="p-6 bg-indigo-50 border border-indigo-100 shadow-inner flex items-center gap-4 rounded-2xl" role="status">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" aria-hidden="true" />
                                <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest">Unidade Indexada para Configuração</Typography>
                            </div>
                        )}
                    </Card>

                    <Card className="rounded-2xl bg-emerald-600 text-white border-none p-6 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700" aria-hidden="true"><Shield size={160} /></div>
                        <Typography variant="h3" tone="white" className="mb-6 uppercase tracking-tight font-black">Nível de Hardening</Typography>
                        <Typography variant="p" tone="white" className="text-xs font-bold leading-relaxed italic opacity-60 uppercase tracking-tight">
                            "O modo estrito impede registros retroativos fora da janela de tolerância de 24h, garantindo a integridade forense dos dados."
                        </Typography>
                    </Card>
                </aside>

                <section className="lg:col-span-8">
                    <Card className="rounded-2xl border border-gray-100 p-6 bg-white space-y-6 shadow-sm">
                        <header className="border-b border-gray-100 pb-4 flex items-center justify-between gap-4">
                            <div>
                                <Typography variant="h2" className="uppercase tracking-tighter">Políticas Operacionais</Typography>
                                <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1 font-black">REGRAS DE NEGÓCIO MANDATÁRIAS</Typography>
                            </div>
                            <Badge variant="outline" className="text-[9px] font-black uppercase shrink-0">Persistência em breve</Badge>
                        </header>

                        {/* Estes 3 toggles + horário ainda não têm coluna correspondente no banco (regras_entrega_loja) —
                            desabilitados até a persistência real ser implementada, para não fingir que a escolha foi salva. */}
                        <div className="space-y-10" role="group" aria-label="Lista de políticas operacionais">
                            {[
                                { label: 'Diagnóstico detalhado', desc: 'Habilitar registro ampliado de eventos operacionais para suporte técnico', field: 'audit_mode' },
                                { label: 'Fechamento Diário Estrito', desc: 'Bloquear acesso ao cockpit sem o Fechamento Diário obrigatório', field: 'strict_checkin' },
                                { label: 'Fechamento Retroativo', desc: 'Autorizar gerência a retroagir dados em caso de falha sistêmica', field: 'allow_manual_retro' }
                            ].map((s) => (
                                <div key={s.field} className="flex items-center justify-between group p-6 rounded-2xl hover:bg-gray-50 transition-all">
                                    <div className="space-y-1">
                                        <Typography variant="h3" className="text-base group-hover:text-emerald-600 transition-colors uppercase tracking-tight font-black">{s.label}</Typography>
                                        <Typography variant="caption" tone="muted" className="text-[10px] font-black uppercase opacity-60">{s.desc}</Typography>
                                    </div>
                                    <Button
                                        variant={settings[s.field as keyof typeof settings] ? 'secondary' : 'outline'}
                                        onClick={() => setSettings(p => ({ ...p, [s.field]: !p[s.field as keyof typeof settings] }))}
                                        disabled
                                        className="w-24 h-12 rounded-2xl font-black text-[10px] shadow-sm bg-white border border-gray-100"
                                        aria-pressed={!!settings[s.field as keyof typeof settings]}
                                    >
                                        {settings[s.field as keyof typeof settings] ? 'ATIVADO' : 'OFF'}
                                    </Button>
                                </div>
                            ))}

                                <div className="flex items-center justify-between group p-6 rounded-2xl hover:bg-gray-50 transition-all">
                                    <div className="space-y-1">
                                        <Typography variant="h3" className="text-base group-hover:text-emerald-600 transition-colors uppercase tracking-tight font-black">Justiça Matemática (v1.1)</Typography>
                                        <Typography variant="caption" tone="muted" className="text-[10px] font-black uppercase opacity-60">Base de cálculo da projeção e ritmo diário</Typography>
                                    </div>
                                    <div className="flex p-1 bg-white border border-gray-100 rounded-2xl shadow-sm" role="radiogroup">
                                        <Button 
                                            variant={metaRules?.projection_mode === 'calendar' ? 'brand' : 'ghost'} size="sm"
                                            onClick={() => updateMetaRules({ projection_mode: 'calendar' })}
                                            className="h-9 px-6 rounded-2xl text-[10px] uppercase font-black"
                                        >
                                            CALENDÁRIO
                                        </Button>
                                        <Button 
                                            variant={metaRules?.projection_mode === 'business' ? 'brand' : 'ghost'} size="sm"
                                            onClick={() => updateMetaRules({ projection_mode: 'business' })}
                                            className="h-9 px-6 rounded-2xl text-[10px] uppercase font-black"
                                        >
                                            DIAS ÚTEIS
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between group p-6 rounded-2xl hover:bg-gray-50 transition-all">
                                    <div className="space-y-1">
                                        <Typography variant="h3" className="text-base group-hover:text-emerald-600 transition-colors uppercase tracking-tight font-black">Horário Limite Matinal</Typography>
                                    <Typography variant="caption" tone="muted" className="text-[10px] font-black uppercase opacity-60">Deadline para disparo de relatórios automáticos de rede</Typography>
                                </div>
                                <div className="relative">
                                    <History size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                                    <label htmlFor="morning-time" className="sr-only">Escolher horário limite</label>
                                    <input aria-label="Escolher horário limite"
                                        id="morning-time"
                                        type="time" value={settings.morning_report_time}
                                        onChange={e => setSettings(p => ({ ...p, morning_report_time: e.target.value }))}
                                        disabled
                                        className="h-12 pl-10 pr-6 bg-white border border-gray-100 rounded-2xl font-mono tabular-nums font-black text-sm text-gray-800 focus:border-emerald-600 outline-none shadow-inner transition-all disabled:opacity-50"
                                    />
                                </div>
                            </div>
                        </div>

                        <footer className="pt-12 border-t border-gray-100 flex items-start gap-4">
                            <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                            <Typography variant="tiny" tone="muted" className="leading-relaxed uppercase font-black">Qualquer alteração nestes parâmetros será registrada no log de auditoria global com timestamp imutável e ID do administrador responsável.</Typography>
                        </footer>
                    </Card>

                    {/* Email Recipients Section */}
                    {selectedStoreId && (
                        <Card className="mt-8 p-6 border border-gray-100 shadow-sm bg-white space-y-6 rounded-2xl">
                            <header className="border-b border-gray-100 pb-4 flex items-center justify-between">
                                <div>
                                    <Typography variant="h2" className="uppercase tracking-tighter">Destinatários Oficiais</Typography>
                                    <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1 font-black">DISTRIBUIÇÃO AUTOMÁTICA DE RELATÓRIOS</Typography>
                                </div>
                                <Mail size={24} className="text-emerald-600 opacity-20" aria-hidden="true" />
                            </header>

                            <div className="space-y-10">
                                {[
                                    { label: 'Relatório Matinal', key: 'matinal', desc: 'Destinatários do matinal diário (D-0)' },
                                    { label: 'Ciclo Semanal', key: 'weekly', desc: 'Destinatários das mentorias e fechamentos de semana' },
                                    { label: 'Estratégico / Direção', key: 'monthly', desc: 'Diretoria e Sócios - Visão de fechamento e BI' },
                                ].map((list) => (
                                    <div key={list.key} className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <div className="space-y-1">
                                                <Typography variant="caption" className="font-black uppercase tracking-widest">{list.label}</Typography>
                                                <Typography variant="tiny" tone="muted" className="uppercase font-black">{list.desc}</Typography>
                                            </div>
                                            <Badge variant="outline" className="text-[9px] font-black border-gray-100 uppercase">{emailLists[list.key as keyof typeof emailLists].split(',').filter(Boolean).length} E-mails</Badge>
                                        </div>
                                        <label htmlFor={`emails-${list.key}`} className="sr-only">{list.label} - Lista de emails</label>
                                        <textarea 
                                            id={`emails-${list.key}`}
                                            value={emailLists[list.key as keyof typeof emailLists]}
                                            onChange={e => setEmailLists(prev => ({ ...prev, [list.key]: e.target.value }))}
                                            placeholder="email1@empresa.com, email2@empresa.com..."
                                            className="w-full h-24 p-6 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none resize-none shadow-inner"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="bg-indigo-50 p-6 rounded-2xl border border-gray-100 flex items-center gap-4">
                                <Info size={18} className="text-emerald-600 shrink-0" aria-hidden="true" />
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
