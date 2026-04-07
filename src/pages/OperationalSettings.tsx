import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Calendar, CheckCircle2, Database, Mail, RefreshCw, Save, Settings2, ShieldCheck, SlidersHorizontal, UserPlus, Users, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useStores } from '@/hooks/useTeam'
import { normalizeSourceMode, useOperationalSettings } from '@/hooks/useOperationalSettings'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { StoreSettingsPayload } from '@/hooks/useOperationalSettings'
import type { StoreSourceMode } from '@/types/database'

function parseRecipients(value: string) {
    return value
        .split(/[\n,;]/)
        .map(item => item.trim())
        .filter(Boolean)
}

function formatRecipients(value: string[] | null | undefined) {
    return (value || []).join('\n')
}

const todayISO = () => new Date().toISOString().split('T')[0]

export default function OperationalSettings() {
    const { role } = useAuth()
    const { stores, loading: storesLoading } = useStores()
    const [selectedStoreId, setSelectedStoreId] = useState('')
    const {
        store,
        deliveryRules,
        benchmark,
        metaRules,
        sellerTenures,
        sellerUsers,
        loading,
        canManage,
        saveSettings,
        addSellerTenure,
        endSellerTenure,
    } = useOperationalSettings(selectedStoreId || null)

    const [managerEmail, setManagerEmail] = useState('')
    const [sourceMode, setSourceMode] = useState<StoreSourceMode>('native_app')
    const [storeActive, setStoreActive] = useState(true)
    const [matinalRecipients, setMatinalRecipients] = useState('')
    const [weeklyRecipients, setWeeklyRecipients] = useState('')
    const [monthlyRecipients, setMonthlyRecipients] = useState('')
    const [whatsappRef, setWhatsappRef] = useState('')
    const [timezone, setTimezone] = useState('America/Sao_Paulo')
    const [deliveryActive, setDeliveryActive] = useState(true)
    const [leadToAgend, setLeadToAgend] = useState(20)
    const [agendToVisit, setAgendToVisit] = useState(60)
    const [visitToSale, setVisitToSale] = useState(33)
    const [monthlyGoal, setMonthlyGoal] = useState(0)
    const [individualGoalMode, setIndividualGoalMode] = useState<'even' | 'custom' | 'proportional'>('even')
    const [includeVendaLojaStore, setIncludeVendaLojaStore] = useState(true)
    const [includeVendaLojaIndividual, setIncludeVendaLojaIndividual] = useState(false)
    const [sellerUserId, setSellerUserId] = useState('')
    const [sellerStartedAt, setSellerStartedAt] = useState(todayISO())
    const [sellerClosingGrace, setSellerClosingGrace] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!store) return
        setManagerEmail(store.manager_email || '')
        setSourceMode(normalizeSourceMode(store.source_mode))
        setStoreActive(store.active)
    }, [store])

    useEffect(() => {
        if (!deliveryRules) {
            setMatinalRecipients('')
            setWeeklyRecipients('')
            setMonthlyRecipients('')
            setWhatsappRef('')
            setTimezone('America/Sao_Paulo')
            setDeliveryActive(true)
            return
        }
        setMatinalRecipients(formatRecipients(deliveryRules.matinal_recipients))
        setWeeklyRecipients(formatRecipients(deliveryRules.weekly_recipients))
        setMonthlyRecipients(formatRecipients(deliveryRules.monthly_recipients))
        setWhatsappRef(deliveryRules.whatsapp_group_ref || '')
        setTimezone(deliveryRules.timezone || 'America/Sao_Paulo')
        setDeliveryActive(deliveryRules.active)
    }, [deliveryRules])

    useEffect(() => {
        setLeadToAgend(Number(benchmark?.lead_to_agend ?? 20))
        setAgendToVisit(Number(benchmark?.agend_to_visit ?? 60))
        setVisitToSale(Number(benchmark?.visit_to_sale ?? 33))
    }, [benchmark])

    useEffect(() => {
        setMonthlyGoal(Number(metaRules?.monthly_goal ?? 0))
        setIndividualGoalMode(metaRules?.individual_goal_mode || 'even')
        setIncludeVendaLojaStore(metaRules?.include_venda_loja_in_store_total ?? true)
        setIncludeVendaLojaIndividual(metaRules?.include_venda_loja_in_individual_goal ?? false)
    }, [metaRules])

    const activeSellerIds = useMemo(() => new Set(sellerTenures.filter(s => s.is_active).map(s => s.seller_user_id)), [sellerTenures])
    const availableSellers = useMemo(() => sellerUsers.filter(user => !activeSellerIds.has(user.id)), [sellerUsers, activeSellerIds])

    if (role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-10 text-center">
                <ShieldCheck size={48} className="text-gray-200 mb-6" />
                <h3 className="text-2xl font-black text-pure-black tracking-tight mb-2">Acesso Restrito</h3>
                <p className="text-gray-400 text-sm font-bold max-w-sm mx-auto">Configuração operacional estrutural é exclusiva do admin da MX Gestão Preditiva.</p>
            </div>
        )
    }

    const handleSave = async () => {
        if (!store) return
        setSaving(true)

        const payload: StoreSettingsPayload = {
            store: {
                id: store.id,
                manager_email: managerEmail.trim() || null,
                source_mode: sourceMode,
                active: storeActive,
            },
            delivery: {
                store_id: store.id,
                matinal_recipients: parseRecipients(matinalRecipients),
                weekly_recipients: parseRecipients(weeklyRecipients),
                monthly_recipients: parseRecipients(monthlyRecipients),
                whatsapp_group_ref: whatsappRef.trim() || null,
                timezone: timezone.trim() || 'America/Sao_Paulo',
                active: deliveryActive,
            },
            benchmark: {
                store_id: store.id,
                lead_to_agend: leadToAgend,
                agend_to_visit: agendToVisit,
                visit_to_sale: visitToSale,
            },
            meta: {
                store_id: store.id,
                monthly_goal: monthlyGoal,
                individual_goal_mode: individualGoalMode,
                include_venda_loja_in_store_total: includeVendaLojaStore,
                include_venda_loja_in_individual_goal: includeVendaLojaIndividual,
                bench_lead_agd: leadToAgend,
                bench_agd_visita: agendToVisit,
                bench_visita_vnd: visitToSale,
            },
        }

        const { error } = await saveSettings(payload)
        setSaving(false)
        if (error) {
            toast.error(`Falha ao salvar: ${error}`)
            return
        }
        toast.success('Configuração operacional salva.')
    }

    const handleAddSeller = async () => {
        if (!sellerUserId) {
            toast.error('Selecione um vendedor existente.')
            return
        }
        const { error } = await addSellerTenure(sellerUserId, sellerStartedAt, sellerClosingGrace)
        if (error) {
            toast.error(`Falha ao vincular vendedor: ${error}`)
            return
        }
        setSellerUserId('')
        setSellerStartedAt(todayISO())
        setSellerClosingGrace(false)
        toast.success('Vigência do vendedor vinculada.')
    }

    const handleEndSeller = async (tenureId: string) => {
        const { error } = await endSellerTenure(tenureId, todayISO())
        if (error) {
            toast.error(`Falha ao encerrar vigência: ${error}`)
            return
        }
        toast.success('Vigência encerrada.')
    }

    return (
        <div className="w-full h-full flex flex-col gap-8 p-4 sm:p-6 md:p-10 overflow-y-auto no-scrollbar bg-white text-pure-black">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-border-default pb-8 shrink-0">
                <div>
                    <span className="mx-text-caption text-brand-primary mb-2 block font-black tracking-[0.3em]">EPIC-01A</span>
                    <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase leading-none">Configuração Operacional</h1>
                    <p className="mx-text-caption !text-[10px] opacity-60 uppercase mt-4">Fonte, destinatários, benchmarks, metas e vigência por loja.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/configuracoes" className="h-12 px-6 rounded-full border border-border-default text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-mx-slate-50 transition-all">
                        <ArrowLeft size={16} /> Configurações
                    </Link>
                    <button onClick={handleSave} disabled={!store || saving || !canManage} className="h-12 px-8 rounded-full bg-brand-secondary text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-30 shadow-mx-md">
                        {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} Salvar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <aside className="xl:col-span-3 space-y-5">
                    <section className="mx-card p-6 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-mx-lg bg-brand-primary-surface text-brand-primary flex items-center justify-center"><Database size={20} /></div>
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tight">Loja</h2>
                                <p className="mx-text-caption !text-[9px]">Unidade alvo</p>
                            </div>
                        </div>
                        <select value={selectedStoreId} onChange={event => setSelectedStoreId(event.target.value)} disabled={storesLoading} className="mx-input h-14 appearance-none">
                            <option value="">Selecione a loja...</option>
                            {stores.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                    </section>

                    {store && (
                        <section className="mx-card p-6 space-y-4 bg-mx-slate-50/60">
                            <p className="mx-text-caption !text-[9px]">Resumo</p>
                            <h3 className="text-2xl font-black uppercase tracking-tight leading-none">{store.name}</h3>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 rounded-full bg-white border border-border-default text-[9px] font-black uppercase">{sourceMode}</span>
                                <span className={cn("px-3 py-1 rounded-full border text-[9px] font-black uppercase", storeActive ? 'bg-status-success-surface text-status-success border-transparent' : 'bg-status-error-surface text-status-error border-transparent')}>
                                    {storeActive ? 'ativa' : 'inativa'}
                                </span>
                            </div>
                        </section>
                    )}
                </aside>

                <main className="xl:col-span-9 space-y-8">
                    {!selectedStoreId ? (
                        <div className="min-h-[480px] rounded-[3rem] border-2 border-dashed border-border-default flex flex-col items-center justify-center text-center p-10">
                            <Settings2 size={52} className="text-mx-slate-200 mb-6" />
                            <h2 className="text-3xl font-black uppercase tracking-tight text-text-primary">Selecione uma loja</h2>
                            <p className="mx-text-caption mt-3 max-w-md">A configuração operacional é sempre por loja para evitar mistura entre unidades.</p>
                        </div>
                    ) : loading ? (
                        <div className="min-h-[480px] flex flex-col items-center justify-center">
                            <RefreshCw className="animate-spin text-brand-primary mb-4" size={36} />
                            <p className="mx-text-caption">Carregando configuração operacional...</p>
                        </div>
                    ) : (
                        <>
                            <section className="mx-card p-8 space-y-6">
                                <Header icon={<Settings2 size={22} />} title="Fonte e status" subtitle="Cutover legado/nativo/híbrido" />
                                <div className="grid md:grid-cols-3 gap-5">
                                    <Field label="E-mail gestor">
                                        <input value={managerEmail} onChange={event => setManagerEmail(event.target.value)} className="mx-input h-12" placeholder="gestor@loja.com" />
                                    </Field>
                                    <Field label="Source mode">
                                        <select value={sourceMode} onChange={event => setSourceMode(event.target.value as StoreSourceMode)} className="mx-input h-12 appearance-none">
                                            <option value="native_app">native_app</option>
                                            <option value="legacy_forms">legacy_forms</option>
                                            <option value="hybrid">hybrid</option>
                                        </select>
                                    </Field>
                                    <Field label="Status da loja">
                                        <label className="h-12 px-4 rounded-mx-lg bg-mx-slate-50 border border-border-default flex items-center justify-between cursor-pointer">
                                            <span className="text-[10px] font-black uppercase tracking-widest">{storeActive ? 'Ativa' : 'Inativa'}</span>
                                            <input type="checkbox" checked={storeActive} onChange={event => setStoreActive(event.target.checked)} />
                                        </label>
                                    </Field>
                                </div>
                            </section>

                            <section className="mx-card p-8 space-y-6">
                                <Header icon={<Mail size={22} />} title="Destinatários e WhatsApp" subtitle="Entrega do matinal, semanal e mensal" />
                                <div className="grid lg:grid-cols-3 gap-5">
                                    <Field label="Matinal">
                                        <textarea value={matinalRecipients} onChange={event => setMatinalRecipients(event.target.value)} className="mx-input min-h-32 resize-y py-4" placeholder="um e-mail por linha" />
                                    </Field>
                                    <Field label="Semanal">
                                        <textarea value={weeklyRecipients} onChange={event => setWeeklyRecipients(event.target.value)} className="mx-input min-h-32 resize-y py-4" placeholder="um e-mail por linha" />
                                    </Field>
                                    <Field label="Mensal">
                                        <textarea value={monthlyRecipients} onChange={event => setMonthlyRecipients(event.target.value)} className="mx-input min-h-32 resize-y py-4" placeholder="um e-mail por linha" />
                                    </Field>
                                </div>
                                <div className="grid md:grid-cols-3 gap-5">
                                    <Field label="Referência WhatsApp">
                                        <input value={whatsappRef} onChange={event => setWhatsappRef(event.target.value)} className="mx-input h-12" placeholder="link ou nome do grupo" />
                                    </Field>
                                    <Field label="Timezone">
                                        <input value={timezone} onChange={event => setTimezone(event.target.value)} className="mx-input h-12" />
                                    </Field>
                                    <Field label="Entrega ativa">
                                        <label className="h-12 px-4 rounded-mx-lg bg-mx-slate-50 border border-border-default flex items-center justify-between cursor-pointer">
                                            <span className="text-[10px] font-black uppercase tracking-widest">{deliveryActive ? 'Ativa' : 'Pausada'}</span>
                                            <input type="checkbox" checked={deliveryActive} onChange={event => setDeliveryActive(event.target.checked)} />
                                        </label>
                                    </Field>
                                </div>
                            </section>

                            <section className="grid lg:grid-cols-2 gap-8">
                                <div className="mx-card p-8 space-y-6">
                                    <Header icon={<SlidersHorizontal size={22} />} title="Benchmark" subtitle="Override por loja" />
                                    <div className="grid sm:grid-cols-3 gap-4">
                                        <NumberField label="Lead -> Agd" value={leadToAgend} onChange={setLeadToAgend} />
                                        <NumberField label="Agd -> Visita" value={agendToVisit} onChange={setAgendToVisit} />
                                        <NumberField label="Visita -> Venda" value={visitToSale} onChange={setVisitToSale} />
                                    </div>
                                </div>

                                <div className="mx-card p-8 space-y-6">
                                    <Header icon={<CheckCircle2 size={22} />} title="Meta e VENDA LOJA" subtitle="Fonte única da meta mensal" />
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <NumberField label="Meta mensal" value={monthlyGoal} onChange={setMonthlyGoal} />
                                        <Field label="Modo individual">
                                            <select value={individualGoalMode} onChange={event => setIndividualGoalMode(event.target.value as typeof individualGoalMode)} className="mx-input h-12 appearance-none">
                                                <option value="even">even</option>
                                                <option value="custom">custom</option>
                                                <option value="proportional">proportional</option>
                                            </select>
                                        </Field>
                                    </div>
                                    <label className="flex items-center justify-between gap-4 rounded-mx-lg border border-border-default bg-mx-slate-50 p-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest">VENDA LOJA conta no total da loja</span>
                                        <input type="checkbox" checked={includeVendaLojaStore} onChange={event => setIncludeVendaLojaStore(event.target.checked)} />
                                    </label>
                                    <label className="flex items-center justify-between gap-4 rounded-mx-lg border border-border-default bg-mx-slate-50 p-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest">VENDA LOJA entra na meta individual</span>
                                        <input type="checkbox" checked={includeVendaLojaIndividual} onChange={event => setIncludeVendaLojaIndividual(event.target.checked)} />
                                    </label>
                                </div>
                            </section>

                            <section className="mx-card p-8 space-y-6">
                                <Header icon={<Users size={22} />} title="Vigência da equipe" subtitle="Camada operacional store_sellers" />
                                <div className="grid lg:grid-cols-[1fr_180px_180px_auto] gap-4 items-end">
                                    <Field label="Vendedor existente">
                                        <select value={sellerUserId} onChange={event => setSellerUserId(event.target.value)} className="mx-input h-12 appearance-none">
                                            <option value="">Selecione...</option>
                                            {availableSellers.map(user => <option key={user.id} value={user.id}>{user.name} - {user.email}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Início">
                                        <input type="date" value={sellerStartedAt} onChange={event => setSellerStartedAt(event.target.value)} className="mx-input h-12" />
                                    </Field>
                                    <Field label="Fechamento mês">
                                        <label className="h-12 px-4 rounded-mx-lg bg-mx-slate-50 border border-border-default flex items-center justify-between cursor-pointer">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Carência</span>
                                            <input type="checkbox" checked={sellerClosingGrace} onChange={event => setSellerClosingGrace(event.target.checked)} />
                                        </label>
                                    </Field>
                                    <button type="button" onClick={handleAddSeller} disabled={!sellerUserId} className="h-12 px-6 rounded-full bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 justify-center disabled:opacity-30">
                                        <UserPlus size={16} /> Vincular
                                    </button>
                                </div>

                                <div className="rounded-[2rem] border border-border-default overflow-hidden">
                                    {sellerTenures.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <Users size={36} className="mx-auto text-mx-slate-200 mb-3" />
                                            <p className="mx-text-caption">Nenhuma vigência registrada para esta loja.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border-default">
                                            {sellerTenures.map(tenure => (
                                                <div key={tenure.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div>
                                                        <p className="text-sm font-black uppercase tracking-tight">{tenure.user?.name || 'Vendedor'}</p>
                                                        <p className="text-[10px] font-bold text-text-tertiary">{tenure.user?.email || tenure.seller_user_id}</p>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <BadgeText icon={<Calendar size={12} />} text={`Inicio ${tenure.started_at}`} />
                                                        {tenure.ended_at && <BadgeText icon={<XCircle size={12} />} text={`Fim ${tenure.ended_at}`} />}
                                                        {tenure.closing_month_grace && <BadgeText text="Carência fechamento" />}
                                                        <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase", tenure.is_active ? 'bg-status-success-surface text-status-success' : 'bg-mx-slate-100 text-text-tertiary')}>{tenure.is_active ? 'ativa' : 'encerrada'}</span>
                                                        {tenure.is_active && (
                                                            <button type="button" onClick={() => handleEndSeller(tenure.id)} className="h-8 px-4 rounded-full bg-status-error-surface text-status-error text-[9px] font-black uppercase tracking-widest">
                                                                Encerrar hoje
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}

function Header({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
    return (
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-mx-xl bg-brand-primary-surface text-brand-primary flex items-center justify-center">{icon}</div>
            <div>
                <h2 className="text-xl font-black uppercase tracking-tight">{title}</h2>
                <p className="mx-text-caption !text-[9px]">{subtitle}</p>
            </div>
        </div>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="space-y-2 block">
            <span className="mx-text-caption !text-[9px] ml-2">{label}</span>
            {children}
        </label>
    )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
    return (
        <Field label={label}>
            <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={event => onChange(Number(event.target.value.replace(/\D/g, '')) || 0)}
                className="mx-input h-12 font-mono-numbers font-black"
            />
        </Field>
    )
}

function BadgeText({ icon, text }: { icon?: React.ReactNode; text: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mx-slate-50 border border-border-default text-[9px] font-black uppercase text-text-tertiary">
            {icon} {text}
        </span>
    )
}
