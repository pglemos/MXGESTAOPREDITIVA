import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Calendar, CheckCircle2, Database, Mail, RefreshCw, Save, Settings2, ShieldCheck, SlidersHorizontal, UserPlus, Users, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useStores } from '@/hooks/useTeam'
import { normalizeSourceMode, useOperationalSettings } from '@/hooks/useOperationalSettings'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
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
            <main className="flex flex-col items-center justify-center min-h-[60vh] p-10 text-center bg-white">
                <ShieldCheck size={48} className="text-gray-200 mb-6" aria-hidden="true" />
                <h1 className="text-2xl font-black text-pure-black tracking-tight mb-2 uppercase">Acesso Restrito</h1>
                <p className="text-gray-500 text-sm font-bold max-w-sm mx-auto">Configuração operacional estrutural é exclusiva do admin da MX PERFORMANCE.</p>
            </main>
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
        <main className="w-full h-full flex flex-col gap-8 p-4 sm:p-6 md:p-10 overflow-y-auto no-scrollbar bg-white text-pure-black">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-gray-100 pb-8 shrink-0">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-indigo-600 mb-2 block font-black tracking-[0.3em] uppercase">EPIC-01A • GOVERNANÇA</span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter uppercase leading-none">Configuração Operacional</h1>
                    <p className="text-gray-500 text-xs font-black uppercase tracking-[0.4em] mt-4">Fonte, destinatários, benchmarks, metas e vigência por loja.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/configuracoes" aria-label="Voltar para configurações" className="h-12 px-6 rounded-full border border-gray-200 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none">
                        <ArrowLeft size={16} aria-hidden="true" /> Painel
                    </Link>
                    <button onClick={handleSave} disabled={!store || saving || !canManage} className="h-12 px-8 rounded-full bg-slate-950 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-30 shadow-xl hover:bg-black transition-all focus-visible:ring-4 focus-visible:ring-slate-500/20 outline-none">
                        {saving ? <RefreshCw size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />} Salvar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <aside className="xl:col-span-3 space-y-5">
                    <section className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5" aria-labelledby="store-select-title">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-inner" aria-hidden="true"><Database size={20} /></div>
                            <div>
                                <h2 id="store-select-title" className="text-base font-black uppercase tracking-tight text-slate-950 leading-none">Unidade Alvo</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Seleção de Loja</p>
                            </div>
                        </div>
                        <div className="relative">
                            <label htmlFor="store-select" className="sr-only">Selecione a loja alvo</label>
                            <select id="store-select" value={selectedStoreId} onChange={event => setSelectedStoreId(event.target.value)} disabled={storesLoading} className="w-full h-14 px-6 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-300 focus:bg-white transition-all appearance-none cursor-pointer">
                                <option value="">Selecione a loja...</option>
                                {stores.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                        </div>
                    </section>

                    {store && (
                        <section className="bg-gray-50 border border-gray-100 rounded-3xl p-6 space-y-4 shadow-inner" aria-live="polite">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Resumo Operacional</p>
                            <h3 className="text-xl font-black uppercase tracking-tight leading-none text-slate-950">{store.name}</h3>
                            <div className="flex flex-wrap gap-2">
                                <Badge className="bg-white border-gray-200 text-slate-700 text-[10px] font-black uppercase tracking-widest py-1 shadow-sm">{sourceMode}</Badge>
                                <Badge className={cn("text-[10px] font-black uppercase tracking-widest py-1 border-none shadow-sm", storeActive ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white')}>
                                    {storeActive ? 'ATIVA' : 'INATIVA'}
                                </Badge>
                            </div>
                        </section>
                    )}
                </aside>

                <div className="xl:col-span-9 space-y-8" aria-live="polite">
                    {!selectedStoreId ? (
                        <div className="min-h-[480px] rounded-[3rem] border-2 border-dashed border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center text-center p-10 group hover:bg-gray-50 transition-all">
                            <Settings2 size={52} className="text-gray-300 mb-6 group-hover:text-indigo-600 group-hover:rotate-12 transition-all duration-500" aria-hidden="true" />
                            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Configuração de Unidade</h2>
                            <p className="text-gray-500 text-sm font-bold mt-3 max-w-md">A gestão operacional é segregada por loja para garantir a integridade dos dados e auditorias.</p>
                        </div>
                    ) : loading ? (
                        <div className="min-h-[480px] flex flex-col items-center justify-center" role="status">
                            <RefreshCw className="animate-spin text-indigo-600 mb-4" size={40} aria-hidden="true" />
                            <p className="text-xs font-black uppercase tracking-widest text-gray-500 animate-pulse">Sincronizando Banco de Dados...</p>
                        </div>
                    ) : (
                        <>
                            <section className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-8" aria-labelledby="section-source-title">
                                <Header icon={<Settings2 size={22} />} title="Fonte e Status" subtitle="Transição Legado / Nativo" id="section-source-title" />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Field label="E-mail do Gestor" id="manager-email">
                                        <input id="manager-email" value={managerEmail} onChange={event => setManagerEmail(event.target.value)} className="w-full h-12 px-5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-300 focus:bg-white transition-all shadow-inner" placeholder="gestor@loja.com" />
                                    </Field>
                                    <Field label="Modo de Captura" id="source-mode">
                                        <select id="source-mode" value={sourceMode} onChange={event => setSourceMode(event.target.value as StoreSourceMode)} className="w-full h-12 px-5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-300 focus:bg-white transition-all appearance-none cursor-pointer shadow-inner">
                                            <option value="native_app">Nativo (App)</option>
                                            <option value="legacy_forms">Legado (Forms)</option>
                                            <option value="hybrid">Híbrido</option>
                                        </select>
                                    </Field>
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Estado da Unidade</span>
                                        <label htmlFor="store-active-check" className="h-12 px-5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between cursor-pointer group hover:bg-white transition-all shadow-inner">
                                            <span className="text-xs font-black uppercase tracking-widest group-hover:text-indigo-600">{storeActive ? 'Ativa na Rede' : 'Inativa / Pausada'}</span>
                                            <input id="store-active-check" type="checkbox" checked={storeActive} onChange={event => setStoreActive(event.target.checked)} className="w-5 h-5 accent-indigo-600 rounded cursor-pointer" />
                                        </label>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-8" aria-labelledby="section-delivery-title">
                                <Header icon={<Mail size={22} />} title="Destinatários Oficiais" subtitle="Matinal, Semanal e Estratégico" id="section-delivery-title" />
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <Field label="Matinal (Relatório D-1)" id="matinal-rec">
                                        <textarea id="matinal-rec" value={matinalRecipients} onChange={event => setMatinalRecipients(event.target.value)} className="w-full min-h-32 px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:outline-none focus:border-indigo-300 focus:bg-white transition-all shadow-inner resize-y" placeholder="um e-mail por linha" />
                                    </Field>
                                    <Field label="Semanal (Feedback)" id="weekly-rec">
                                        <textarea id="weekly-rec" value={weeklyRecipients} onChange={event => setWeeklyRecipients(event.target.value)} className="w-full min-h-32 px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:outline-none focus:border-indigo-300 focus:bg-white transition-all shadow-inner resize-y" placeholder="um e-mail por linha" />
                                    </Field>
                                    <Field label="Mensal (Consolidação)" id="monthly-rec">
                                        <textarea id="monthly-rec" value={monthlyRecipients} onChange={event => setMonthlyRecipients(event.target.value)} className="w-full min-h-32 px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:outline-none focus:border-indigo-300 focus:bg-white transition-all shadow-inner resize-y" placeholder="um e-mail por linha" />
                                    </Field>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
                                    <Field label="Referência WhatsApp" id="wa-ref">
                                        <input id="wa-ref" value={whatsappRef} onChange={event => setWhatsappRef(event.target.value)} className="mx-input h-12 shadow-inner" placeholder="Link do Grupo ou Telefone" />
                                    </Field>
                                    <Field label="Timezone do Relatório" id="tz-ref">
                                        <input id="tz-ref" value={timezone} onChange={event => setTimezone(event.target.value)} className="mx-input h-12 shadow-inner" />
                                    </Field>
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Disparos Automáticos</span>
                                        <label htmlFor="delivery-active-check" className="h-12 px-5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between cursor-pointer group hover:bg-white transition-all shadow-inner">
                                            <span className="text-xs font-black uppercase tracking-widest group-hover:text-indigo-600">{deliveryActive ? 'Motor Ativo' : 'Motor Pausado'}</span>
                                            <input id="delivery-active-check" type="checkbox" checked={deliveryActive} onChange={event => setDeliveryActive(event.target.checked)} className="w-5 h-5 accent-indigo-600 rounded cursor-pointer" />
                                        </label>
                                    </div>
                                </div>
                            </section>

                            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-8">
                                    <Header icon={<SlidersHorizontal size={22} />} title="Benchmark" subtitle="Metodologia MX Oficial" id="section-bench-title" />
                                    <div className="grid grid-cols-3 gap-4" role="list">
                                        <NumberField label="Lead -> Agd" value={leadToAgend} onChange={setLeadToAgend} id="bench-la" />
                                        <NumberField label="Agd -> Visita" value={agendToVisit} onChange={setAgendToVisit} id="bench-av" />
                                        <NumberField label="Visita -> Venda" value={visitToSale} onChange={setVisitToSale} id="bench-vv" />
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-8">
                                    <Header icon={<CheckCircle2 size={22} />} title="Meta Unidade" subtitle="Sell-out Nominal Mensal" id="section-meta-title" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <NumberField label="Meta (Unidades)" value={monthlyGoal} onChange={setMonthlyGoal} id="meta-unit" />
                                        <Field label="Distribuição Individual" id="goal-mode">
                                            <select id="goal-mode" value={individualGoalMode} onChange={event => setIndividualGoalMode(event.target.value as any)} className="w-full h-12 px-5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none appearance-none cursor-pointer shadow-inner">
                                                <option value="even">Divisão Igual</option>
                                                <option value="custom">Manual / Livre</option>
                                                <option value="proportional">Proporcional</option>
                                            </select>
                                        </Field>
                                    </div>
                                    <div className="space-y-3 pt-2">
                                        <label htmlFor="include-store-check" className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 cursor-pointer hover:bg-white transition-all shadow-sm">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">VENDA LOJA conta no total consolidado</span>
                                            <input id="include-store-check" type="checkbox" checked={includeVendaLojaStore} onChange={event => setIncludeVendaLojaStore(event.target.checked)} className="w-5 h-5 accent-indigo-600 rounded cursor-pointer" />
                                        </label>
                                        <label htmlFor="include-indiv-check" className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 cursor-pointer hover:bg-white transition-all shadow-sm">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">VENDA LOJA entra na meta individual</span>
                                            <input id="include-indiv-check" type="checkbox" checked={includeVendaLojaIndividual} onChange={event => setIncludeVendaLojaIndividual(event.target.checked)} className="w-5 h-5 accent-indigo-600 rounded cursor-pointer" />
                                        </label>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-8" aria-labelledby="section-tenure-title">
                                <Header icon={<Users size={22} />} title="Equipe & Vigência" subtitle="Camada Operacional Store_Sellers" id="section-tenure-title" />
                                <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px_180px_auto] gap-4 items-end bg-gray-50/50 p-6 rounded-3xl border border-gray-100 shadow-inner">
                                    <Field label="Vendedor Disponível" id="seller-tenure-select">
                                        <select id="seller-tenure-select" value={sellerUserId} onChange={event => setSellerUserId(event.target.value)} className="w-full h-12 px-5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-300 appearance-none cursor-pointer">
                                            <option value="">Selecione...</option>
                                            {availableSellers.map(user => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Início da Vigência" id="seller-start">
                                        <input id="seller-start" type="date" value={sellerStartedAt} onChange={event => setSellerStartedAt(event.target.value)} className="mx-input h-12 text-xs" />
                                    </Field>
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Carência</span>
                                        <label htmlFor="grace-check" className="h-12 px-5 rounded-xl bg-white border border-gray-200 flex items-center justify-between cursor-pointer shadow-sm">
                                            <span className="text-[10px] font-black uppercase text-slate-500">Mês Fechado</span>
                                            <input id="grace-check" type="checkbox" checked={sellerClosingGrace} onChange={event => setSellerClosingGrace(event.target.checked)} className="w-5 h-5 accent-indigo-600 rounded cursor-pointer" />
                                        </label>
                                    </div>
                                    <button type="button" onClick={handleAddSeller} disabled={!sellerUserId} className="h-12 px-8 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 justify-center disabled:opacity-30 shadow-lg hover:bg-indigo-700 transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none">
                                        <UserPlus size={16} aria-hidden="true" /> Vincular
                                    </button>
                                </div>

                                <div className="rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm bg-white" role="list" aria-label="Histórico de vigências da loja">
                                    {sellerTenures.length === 0 ? (
                                        <div className="p-20 text-center flex flex-col items-center">
                                            <Users size={48} className="text-gray-200 mb-4" aria-hidden="true" />
                                            <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Nenhuma vigência registrada na unidade</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50">
                                            {sellerTenures.map(tenure => (
                                                <div key={tenure.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50/50 transition-all group" role="listitem">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-slate-900 font-black text-lg shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all" aria-hidden="true">{tenure.user?.name?.charAt(0)}</div>
                                                        <div>
                                                            <p className="text-sm font-black uppercase tracking-tight text-slate-950 leading-none mb-1">{tenure.user?.name || 'Vendedor'}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tenure.user?.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <BadgeText icon={<Calendar size={12} />} text={`Início ${formatDate(tenure.started_at)}`} />
                                                        {tenure.ended_at && <BadgeText icon={<XCircle size={12} />} text={`Fim ${formatDate(tenure.ended_at)}`} />}
                                                        {tenure.closing_month_grace && <Badge variant="outline" className="text-[8px] font-black uppercase border-indigo-100 text-indigo-600">Carência Ativa</Badge>}
                                                        <Badge className={cn("text-[9px] font-black uppercase px-3 h-6 border-none shadow-sm", tenure.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500')}>
                                                            {tenure.is_active ? 'ATIVA' : 'ENCERRADA'}
                                                        </Badge>
                                                        {tenure.is_active && (
                                                            <button type="button" onClick={() => handleEndSeller(tenure.id)} className="h-8 px-4 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm focus-visible:ring-4 focus-visible:ring-rose-500/10 outline-none">
                                                                Encerrar Hoje
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
                </div>
            </div>
        </main>
    )
}

function Header({ icon, title, subtitle, id }: { icon: React.ReactNode; title: string; subtitle: string; id?: string }) {
    return (
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-inner" aria-hidden="true">{icon}</div>
            <div>
                <h2 id={id} className="text-xl font-black uppercase tracking-tight text-slate-950 leading-none">{title}</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{subtitle}</p>
            </div>
        </div>
    )
}

function Field({ label, children, id }: { label: string; children: React.ReactNode; id: string }) {
    return (
        <div className="space-y-2 block">
            <label htmlFor={id} className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">{label}</label>
            {children}
        </div>
    )
}

function NumberField({ label, value, onChange, id }: { label: string; value: number; onChange: (value: number) => void; id: string }) {
    return (
        <Field label={label} id={id}>
            <input
                id={id}
                type="text"
                inputMode="numeric"
                value={value}
                onChange={event => onChange(Number(event.target.value.replace(/\D/g, '')) || 0)}
                className="w-full h-12 px-5 bg-gray-50 border border-gray-100 rounded-xl text-lg font-black font-mono-numbers focus:outline-none focus:border-indigo-300 focus:bg-white transition-all shadow-inner text-slate-900"
            />
        </Field>
    )
}

function BadgeText({ icon, text }: { icon?: React.ReactNode; text: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-[10px] font-black uppercase text-gray-500 shadow-sm">
            {icon} {text}
        </span>
    )
}

function formatDate(iso: string) {
    if (!iso) return '--'
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
}
