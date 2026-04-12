import { useState, useEffect, useCallback } from 'react'
import { 
    Settings2, Shield, Zap, RefreshCw, 
    ChevronDown, ShieldAlert, ShieldCheck,
    Mail, Info, Lock, History
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card } from '@/components/molecules/Card'
import { useAuth } from '@/hooks/useAuth'
import { useStores } from '@/hooks/useTeam'
import { useStoreDeliveryRules } from '@/hooks/useData'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'

export default function OperationalSettings() {
    const { role } = useAuth()
    const { stores, loading: storesLoading } = useStores()
    const [searchParams, setSearchParams] = useSearchParams()
    const urlStoreId = searchParams.get('id')
    const [selectedStoreId, setSelectedStoreId] = useState(urlStoreId || '')

    useEffect(() => {
        if (urlStoreId && urlStoreId !== selectedStoreId) {
            setSelectedStoreId(urlStoreId)
        }
    }, [urlStoreId])

    const handleStoreChange = (newId: string) => {
        setSelectedStoreId(newId)
        if (newId) setSearchParams({ id: newId })
        else setSearchParams({})
    }

    const [settings, setSettings] = useState({ 
        audit_mode: false, 
        strict_checkin: true, 
        morning_report_time: '10:30',
        allow_manual_retro: false 
    })

    const { deliveryRules, loading: rulesLoading, updateDeliveryRules } = useStoreDeliveryRules(selectedStoreId)
    const [emailLists, setEmailLists] = useState({ matinal: '', weekly: '', monthly: '' })
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

    const handleSave = async () => {
        if (!selectedStoreId) return
        setSaving(true)
        const { error } = await updateDeliveryRules({
            matinal_recipients: emailLists.matinal.split(',').map(e => e.trim()).filter(e => e.includes('@')),
            weekly_recipients: emailLists.weekly.split(',').map(e => e.trim()).filter(e => e.includes('@')),
            monthly_recipients: emailLists.monthly.split(',').map(e => e.trim()).filter(e => e.includes('@'))
        })
        if (error) toast.error(error)
        else toast.success('Protocolos firmados!')
        setSaving(false)
    }

    if (role !== 'admin' && role !== 'dono') return (
        <main className="h-full w-full flex flex-col items-center justify-center text-center p-10 bg-surface-alt">
            <Lock size={48} className="text-text-tertiary mb-6 opacity-20" />
            <Typography variant="h2" className="text-xl uppercase font-black">Comando Restrito</Typography>
            <Typography variant="caption" tone="muted" className="max-w-xs mt-2 uppercase font-black text-[8px] tracking-widest opacity-40">Apenas o alto comando administrativo pode alterar parâmetros.</Typography>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-4 p-4 overflow-y-auto no-scrollbar bg-surface-alt" id="main-content">
            
            <header className="flex flex-col gap-4 border-b border-border-default pb-6 shrink-0">
                <div className="flex items-center justify-between">
                    <Typography variant="h1" className="text-2xl uppercase font-black">Parâmetros <span className="text-brand-primary">MX</span></Typography>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => setIsRefetching(true)} className="w-10 h-10 rounded-xl bg-white"><RefreshCw size={18} className={cn(isRefetching && "animate-spin")} /></Button>
                        <Button onClick={handleSave} disabled={saving || !selectedStoreId} className="h-10 px-6 rounded-full bg-brand-secondary text-[10px] font-black uppercase shadow-lg">
                            {saving ? <RefreshCw className="animate-spin mr-1" /> : <ShieldCheck size={16} className="mr-1" />} FIRMAR
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-mx-lg pb-32">
                <aside className="lg:col-span-4 flex flex-col gap-4">
                    <Card className="p-6 border-none shadow-sm bg-white space-y-6">
                        <header className="flex items-center gap-2 border-b border-border-default pb-4">
                            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0"><Settings2 size={20} /></div>
                            <Typography variant="h3" className="text-base font-black uppercase">Unidade</Typography>
                        </header>
                        <div className="relative group">
                            <select
                                value={selectedStoreId} onChange={(e) => handleStoreChange(e.target.value)}
                                className="w-full h-12 px-4 bg-surface-alt border border-border-default rounded-xl text-xs font-bold appearance-none cursor-pointer outline-none focus:border-brand-primary"
                            >
                                <option value="">Selecione...</option>
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                        </div>
                    </Card>

                    <Card className="p-6 bg-brand-secondary text-white border-none shadow-sm flex items-center gap-4">
                        <Shield size={32} className="opacity-20 shrink-0" />
                        <Typography variant="p" tone="white" className="text-[10px] font-black italic uppercase leading-tight opacity-60">"O modo estrito garante integridade forense."</Typography>
                    </Card>
                </aside>

                <section className="lg:col-span-8 space-y-4">
                    <Card className="p-6 border-none shadow-sm bg-white space-y-6">
                        <header className="border-b border-border-default pb-4"><Typography variant="h2" className="text-lg font-black uppercase">Políticas</Typography></header>
                        <div className="space-y-4">
                            {[
                                { label: 'Auditoria Forense', field: 'audit_mode' },
                                { label: 'Check-in Estrito', field: 'strict_checkin' },
                                { label: 'Lançamento Manual', field: 'allow_manual_retro' }
                            ].map((s) => (
                                <div key={s.field} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-alt transition-all border border-transparent hover:border-border-default">
                                    <Typography variant="h3" className="text-xs uppercase font-black">{s.label}</Typography>
                                    <Button 
                                        variant={settings[s.field as keyof typeof settings] ? 'secondary' : 'outline'}
                                        onClick={() => setSettings(p => ({ ...p, [s.field]: !p[s.field as keyof typeof settings] }))}
                                        className="h-8 px-4 rounded-full font-black text-[8px] bg-white"
                                    >
                                        {settings[s.field as keyof typeof settings] ? 'ON' : 'OFF'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {selectedStoreId && (
                        <Card className="p-6 border-none shadow-sm bg-white space-y-6">
                            <header className="border-b border-border-default pb-4 flex justify-between items-center">
                                <Typography variant="h2" className="text-lg font-black uppercase">E-mails Oficiais</Typography>
                                <Mail size={18} className="opacity-20" />
                            </header>
                            <div className="space-y-6">
                                {[
                                    { label: 'Relatório Matinal', key: 'matinal' },
                                    { label: 'Ciclo Semanal', key: 'weekly' },
                                    { label: 'Direção MX', key: 'monthly' },
                                ].map((list) => (
                                    <div key={list.key} className="space-y-2">
                                        <div className="flex justify-between px-1">
                                            <Typography variant="caption" className="font-black uppercase text-[8px]">{list.label}</Typography>
                                            <Badge variant="outline" className="text-[8px] font-black">{emailLists[list.key as keyof typeof emailLists].split(',').filter(Boolean).length}</Badge>
                                        </div>
                                        <textarea 
                                            value={emailLists[list.key as keyof typeof emailLists]}
                                            onChange={e => setEmailLists(prev => ({ ...prev, [list.key]: e.target.value }))}
                                            placeholder="exemplo@mx.com, diretoria@mx.com"
                                            className="w-full h-24 p-4 bg-surface-alt border border-border-default rounded-2xl text-[10px] font-bold focus:border-brand-primary outline-none resize-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </section>
            </div>
        </main>
    )
}
