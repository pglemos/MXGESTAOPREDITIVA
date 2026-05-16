import { useSellersByStore, useStores } from '@/hooks/useTeam'
import { isAdministradorMx, isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { calculateReferenceDate, useCheckinsByDateRange } from '@/hooks/useCheckins'
import { useStoreGoal } from '@/hooks/useGoals'
import { useOperationalSettings, type StoreSettingsPayload } from '@/hooks/useOperationalSettings'
import { useStoreSales } from '@/hooks/useStoreSales'
import { useDRE } from '@/hooks/useDRE'
import { useState, useMemo, useCallback, useEffect, useRef, type FormEvent } from 'react'
import {
    RefreshCw, Search, Globe, ChevronDown, History, ArrowRight,
    Settings2, Plus, Archive, Save, ShieldCheck, Mail, Target, Building2, Users
} from 'lucide-react'
import { cn, slugify } from '@/lib/utils'
import { TabNavPill } from '@/components/molecules/TabNavPill'
import { LastUpdated } from '@/components/molecules/LastUpdated'
import { GlossaryHint } from '@/components/molecules/GlossaryHint'
import { format, parseISO, startOfMonth } from 'date-fns'
import { somarVendas, calcularFunil, gerarDiagnosticoMX } from '@/lib/calculations'
import { motion } from 'motion/react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Avatar } from '@/components/atoms/Avatar'
import { EmptyState } from '@/components/atoms/EmptyState'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Modal } from '@/components/organisms/Modal'
import { StoreEditModal } from '@/features/admin/components/StoreEditModal'
import { useParams, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { DataGrid, Column } from '@/components/organisms/DataGrid'
import { supabase } from '@/lib/supabase'
import type { ProjectionMode, RankingEntry, StoreSourceMode } from '@/types/database'
import { StoreGoalsPanel } from '@/features/lojas/components/StoreGoalsPanel'
import { StoreTeamPanel } from '@/features/lojas/components/StoreTeamPanel'
import { requestToastConfirmation } from '@/lib/ui/confirmAction'
import { buildStoreSalesRules } from '@/lib/storeSalesRules'

type DashboardTab = 'performance' | 'metas' | 'equipe'
type ChannelTone = 'success' | 'info' | 'brand'
type StoreRankingEntry = RankingEntry & { id: string }
type OwnerPerformanceAlert = {
    title: string
    description: string
    action: string
    variant: 'success' | 'warning' | 'danger' | 'outline'
    impact: 'Alto' | 'Médio' | 'Baixo'
    ctaLabel: string
    ctaTo: string
}

const joinRecipients = (value?: string[] | null) => value?.join(', ') || ''
const splitRecipients = (value: string) => value.split(',').map(email => email.trim()).filter(Boolean)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SOURCE_MODE_DESCRIPTIONS: Record<StoreSourceMode, string> = {
    native_app: 'Lançamentos entram pelo app MX e alimentam painel, ranking e relatórios automaticamente.',
    legacy_forms: 'Dados vêm de formulário legado; use quando a loja ainda não opera pelo app.',
    hybrid: 'Aceita app MX e legado no mesmo período; exige conferência para evitar duplicidade.',
}
const toNumber = (value: string, fallback = 0) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

function RecipientPreview({ value }: { value: string }) {
    const recipients = splitRecipients(value)
    if (!recipients.length) {
        return (
            <Typography variant="tiny" tone="muted" className="block normal-case tracking-normal">
                Nenhum destinatário configurado.
            </Typography>
        )
    }

    return (
        <div className="flex flex-wrap gap-mx-xs">
            {recipients.map(recipient => {
                const valid = EMAIL_PATTERN.test(recipient)
                return (
                    <span
                        key={recipient}
                        className={cn(
                            'rounded-mx-full border px-mx-xs py-mx-tiny text-mx-micro font-black',
                            valid ? 'border-status-success/20 bg-status-success-surface text-status-success' : 'border-status-error/20 bg-status-error-surface text-status-error'
                        )}
                    >
                        {recipient}
                    </span>
                )
            })}
        </div>
    )
}
const toBoundedNumber = (value: string, fallback: number, min: number, max: number) => {
    const parsed = toNumber(value, fallback)
    return Math.min(max, Math.max(min, parsed))
}

export default function DashboardLoja() {
    const { role, storeId: authStoreId, setActiveStoreId, vinculos_loja } = useAuth()
    const { storeSlug } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { lojas, loading: storesLoading, createStore, updateStore, deleteStore, refetch: refetchStores } = useStores()
    const isAdminMx = isAdministradorMx(role)
    const isOwner = role === 'dono'

    const [resolvedStoreId, setResolvedStoreId] = useState<string | null>(null)
    const [resolving, setResolving] = useState(!!storeSlug)
    const [storeResolutionIssue, setStoreResolutionIssue] = useState<string | null>(null)
    const [storeEditOpen, setStoreEditOpen] = useState(false)
    const [createStoreOpen, setCreateStoreOpen] = useState(false)
    const [showAdminSettings, setShowAdminSettings] = useState(false)
    const [savingStore, setSavingStore] = useState(false)
    const [creatingStore, setCreatingStore] = useState(false)
    const [deletingStore, setDeletingStore] = useState(false)
    const [savingSettings, setSavingSettings] = useState(false)
    const [newStore, setNewStore] = useState({ name: '', manager_email: '' })
    const [settingsForm, setSettingsForm] = useState({
        source_mode: 'native_app' as StoreSourceMode,
        active: true,
        manager_email: '',
        monthly_goal: '0',
        individual_goal_mode: 'even' as StoreSettingsPayload['meta']['individual_goal_mode'],
        include_venda_loja_in_store_total: true,
        include_venda_loja_in_individual_goal: false,
        bench_lead_agd: '20',
        bench_agd_visita: '60',
        bench_visita_vnd: '33',
        matinal_recipients: '',
        weekly_recipients: '',
        monthly_recipients: '',
        whatsapp_group_ref: '',
        timezone: 'America/Sao_Paulo',
        delivery_active: true,
        projection_mode: 'calendar' as ProjectionMode,
    })

    const activeStores = useMemo(() => (lojas || []).filter(store => store.active), [lojas])
    const selectableStores = useMemo(() => {
        if (isPerfilInternoMx(role)) return activeStores
        return activeStores.filter(store => vinculos_loja.some(m => m.store_id === store.id))
    }, [activeStores, role, vinculos_loja])

    const queryStoreId = useMemo(() => {
        return new URLSearchParams(location.search).get('id')
    }, [location.search])

    useEffect(() => {
        const resolve = () => {
            if (!storeSlug) {
                setResolvedStoreId(null)
                setStoreResolutionIssue(null)
                setResolving(false)
                return
            }

            if (storesLoading && selectableStores.length === 0) {
                setResolving(true)
                return
            }

            setResolving(true)
            const foundByQuery = queryStoreId ? selectableStores.find(store => store.id === queryStoreId) : null
            const found = foundByQuery || selectableStores.find(store => slugify(store.name) === storeSlug)

            if (found) {
                setResolvedStoreId(found.id)
                setStoreResolutionIssue(null)
                setResolving(false)
                return
            }

            setResolvedStoreId(null)
            if (!storesLoading) {
                setStoreResolutionIssue('A unidade solicitada não foi encontrada ou não está vinculada ao seu perfil.')
            }
            setResolving(false)
        }

        resolve()
    }, [queryStoreId, storeSlug, selectableStores, storesLoading])

    const urlStoreId = queryStoreId || (storeSlug ? resolvedStoreId : null)
    const shouldUseStoreList = !storeSlug && !queryStoreId && (isPerfilInternoMx(role) || role === 'dono')
    const requestedStoreId = useMemo(() => {
        return urlStoreId || (!storeSlug && !shouldUseStoreList ? authStoreId || (isPerfilInternoMx(role) ? activeStores[0]?.id : null) : null) || null
    }, [activeStores, authStoreId, role, shouldUseStoreList, storeSlug, urlStoreId])

    const requestedStoreForbidden = useMemo(() => {
        if (!(role === 'gerente' || role === 'dono') || !requestedStoreId) return false
        return !vinculos_loja.some(m => m.store_id === requestedStoreId)
    }, [requestedStoreId, role, vinculos_loja])

    const selectedStoreId = useMemo(() => {
        if (requestedStoreForbidden) return null
        return requestedStoreId
    }, [requestedStoreForbidden, requestedStoreId])

    useEffect(() => {
        if (requestedStoreForbidden && !isOwner) toast.error('Você não possui vínculo ativo com esta unidade.')
    }, [isOwner, requestedStoreForbidden])

    const activeTab = useMemo<DashboardTab>(() => {
        const tab = new URLSearchParams(location.search).get('tab')
        return tab === 'metas' || tab === 'equipe' ? tab : 'performance'
    }, [location.search])

    const handleTabChange = useCallback((tab: DashboardTab) => {
        const params = new URLSearchParams(location.search)
        if (selectedStoreId) params.set('id', selectedStoreId)
        if (tab === 'performance') params.delete('tab')
        else params.set('tab', tab)
        navigate({
            pathname: location.pathname,
            search: params.toString() ? `?${params.toString()}` : '',
        })
    }, [location.pathname, location.search, navigate, selectedStoreId])

    const LOJA_TABS = useMemo(() => [
        { key: 'performance' as const, label: 'Performance', icon: Globe },
        { key: 'metas'       as const, label: 'Metas',       icon: Target },
        { key: 'equipe'      as const, label: 'Equipe',      icon: Users },
    ], [])

    const PERIODO_TABS = useMemo(() => [
        { key: 'month' as const, label: 'Mês' },
        { key: 'day'   as const, label: 'D-1' },
    ], [])

    const { sellers } = useSellersByStore(selectedStoreId)
    const { goal: storeGoal, refetch: refetchStoreGoal } = useStoreGoal(selectedStoreId)
    const {
        store: operationalStore,
        deliveryRules,
        benchmark,
        metaRules: operationalMetaRules,
        loading: operationalLoading,
        fetchSettings,
        saveSettings,
    } = useOperationalSettings(selectedStoreId)

    const [viewMode, setViewMode] = useState<'day' | 'month'>('day')
    const [referenceDate] = useState(() => calculateReferenceDate())
    const [startDate, setStartDate] = useState(() => format(startOfMonth(parseISO(referenceDate)), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(() => referenceDate)
    const [sellerSearch, setSellerSearch] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)
    const [syncWarning, setSyncWarning] = useState<string | null>(null)
    const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
    const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const { checkins, loading, refetch } = useCheckinsByDateRange(
        selectedStoreId, 
        viewMode === 'day' ? referenceDate : startDate, 
        viewMode === 'day' ? referenceDate : endDate
    )

    // Realtime Sync: Escutar alterações na tabela de checkins para esta loja
    useEffect(() => {
        if (!selectedStoreId) return

        const channel = supabase
            .channel(`dashboard-sync-${selectedStoreId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'lancamentos_diarios',
                    filter: `store_id=eq.${selectedStoreId}`
                },
                () => {
                    if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current)
                    refetchTimerRef.current = setTimeout(() => {
                        void refetch()
                            .then(() => {
                                setSyncWarning(null)
                                setLastSyncAt(new Date())
                            })
                            .catch(() => setSyncWarning('Falha ao sincronizar automaticamente. Use Atualizar.'))
                    }, 500)
                }
            )
            .subscribe(status => {
                if (status === 'CHANNEL_ERROR') {
                    setSyncWarning('Realtime indisponível. Use Atualizar para confirmar os dados.')
                    toast.error('Realtime do dashboard indisponível. Use atualizar para sincronizar.')
                }
            })

        return () => {
            if (refetchTimerRef.current) {
                clearTimeout(refetchTimerRef.current)
                refetchTimerRef.current = null
            }
            supabase.removeChannel(channel)
        }
    }, [selectedStoreId, refetch])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            await refetch()
            setSyncWarning(null)
            setLastSyncAt(new Date())
            toast.success('Performance sincronizada!')
        } catch {
            setSyncWarning('Falha na atualização manual. Tente novamente antes de tomar decisão operacional.')
            toast.error('Não foi possível atualizar a performance.')
        } finally {
            setIsRefetching(false)
        }
    }, [refetch])

    const effectiveMonthlyGoal = operationalMetaRules?.monthly_goal ?? storeGoal?.target ?? 0
    const funnelBenchmarks = useMemo(() => ({
        leadAgd: benchmark?.lead_to_agend ?? operationalMetaRules?.bench_lead_agd ?? 20,
        agdVisita: benchmark?.agend_to_visit ?? operationalMetaRules?.bench_agd_visita ?? 60,
        visitaVnd: benchmark?.visit_to_sale ?? operationalMetaRules?.bench_visita_vnd ?? 33,
    }), [benchmark, operationalMetaRules])

    const storeSalesParams = useMemo(() => {
        const checkinsBySeller = (checkins || []).reduce((acc, c) => {
            if (!acc[c.seller_user_id]) acc[c.seller_user_id] = []
            acc[c.seller_user_id].push(c)
            return acc
        }, {} as Record<string, typeof checkins>)

        return {
            checkins,
            ranking: (sellers || []).map(s => {
                const sellerCheckins = checkinsBySeller[s.id] || []
                return {
                    id: s.id,
                    user_id: s.id,
                    user_name: s.name,
                    avatar_url: s.avatar_url,
                    is_venda_loja: s.is_venda_loja || false,
                    vnd_total: somarVendas(sellerCheckins),
                    leads: sellerCheckins.reduce((acc, c) => acc + (c.leads_prev_day || 0), 0),
                    agd_total: sellerCheckins.reduce((acc, c) => acc + (c.agd_cart_today || 0) + (c.agd_net_today || 0), 0),
                    visitas: sellerCheckins.reduce((acc, c) => acc + (c.visit_prev_day || 0), 0),
                    meta: effectiveMonthlyGoal,
                    atingimento: 0,
                    projecao: 0,
                    ritmo: 0,
                    efficiency: 0,
                    status: { label: '', color: '' },
                    gap: 0,
                    position: 0,
                    checked_in: s.checkin_today,
                }
            }),
            rules: buildStoreSalesRules({ storeId: selectedStoreId, monthlyGoal: effectiveMonthlyGoal, metaRules: operationalMetaRules }),
        }
    }, [checkins, effectiveMonthlyGoal, operationalMetaRules, selectedStoreId, sellers])

    const storeSales = useStoreSales(storeSalesParams)
    const { financials, computeDRE: computeDREFn } = useDRE(undefined, selectedStoreId || undefined)

    const latestDRE = useMemo(() => {
        if (!financials || financials.length === 0) return null
        return computeDREFn(financials[0])
    }, [financials, computeDREFn])

    const selectedStore = useMemo(() => {
        return activeStores.find(store => store.id === selectedStoreId)
            || vinculos_loja.find(m => m.store_id === selectedStoreId)?.store
            || null
    }, [activeStores, selectedStoreId, vinculos_loja])

    const metrics = useMemo(() => {
        const checkedInCount = (sellers || []).filter(s => s.checkin_today).length
        return {
            totalSales: storeSales.storeTotalVendas,
            totalLeads: storeSales.storeTotalLeads,
            totalAgd: storeSales.storeTotalAgd,
            totalVis: storeSales.storeTotalVis,
            attainment: storeSales.storeAttainment,
            goalValue: effectiveMonthlyGoal || storeSales.storeGoal,
            checkedInCount,
            ranking: storeSales.processedRanking,
            storeName: selectedStore?.name || 'Unidade MX'
        }
    }, [storeSales, sellers, selectedStore, effectiveMonthlyGoal])

    const funilData = useMemo(() => calcularFunil(checkins), [checkins])
    const diagnostics = useMemo(() => gerarDiagnosticoMX(funilData), [funilData])

    const ownerPerformanceAlerts = useMemo<OwnerPerformanceAlert[]>(() => {
        const sellerCount = (sellers || []).length
        const alerts: OwnerPerformanceAlert[] = []

        if (metrics.goalValue > 0 && metrics.attainment < 80) {
            alerts.push({
                title: 'Meta abaixo do ritmo',
                description: `${metrics.attainment}% da meta realizada no período selecionado.`,
                action: isOwner ? 'Decidir cobrança de plano de recuperação com o gerente.' : 'Validar plano de ataque com gerente e vendedores de menor ritmo.',
                variant: metrics.attainment < 60 ? 'danger' : 'warning',
                impact: metrics.attainment < 60 ? 'Alto' : 'Médio',
                ctaLabel: 'Abrir metas',
                ctaTo: `${location.pathname}?id=${selectedStoreId || ''}&tab=metas`,
            })
        }

        if (sellerCount > 0 && metrics.checkedInCount < sellerCount) {
            alerts.push({
                title: 'Rotina diária incompleta',
                description: `${metrics.checkedInCount}/${sellerCount} vendedores com registro sincronizado.`,
                action: isOwner ? 'Acompanhar a cobrança do gerente; não executar a rotina operacional.' : 'Cobrar fechamento da puxada diária antes da próxima reunião de gestão.',
                variant: 'warning',
                impact: 'Médio',
                ctaLabel: role === 'gerente' ? 'Abrir rotina' : 'Ver equipe',
                ctaTo: role === 'gerente' ? '/rotina' : `${location.pathname}?id=${selectedStoreId || ''}&tab=equipe`,
            })
        }

        if (funilData.tx_lead_agd < funnelBenchmarks.leadAgd) {
            alerts.push({
                title: 'Baixa conversão de lead',
                description: `${funilData.tx_lead_agd}% contra benchmark de ${funnelBenchmarks.leadAgd}%.`,
                action: isOwner ? 'Priorizar decisão comercial sobre origem e tratamento dos leads.' : 'Revisar abordagem inicial, tempo de resposta e qualidade dos agendamentos.',
                variant: 'danger',
                impact: 'Alto',
                ctaLabel: role === 'gerente' ? 'Criar devolutiva' : 'Ver ranking',
                ctaTo: role === 'gerente' ? '/devolutivas' : '/classificacao',
            })
        }

        if (funilData.tx_visita_vnd < funnelBenchmarks.visitaVnd) {
            alerts.push({
                title: 'Visita não vira venda',
                description: `${funilData.tx_visita_vnd}% contra benchmark de ${funnelBenchmarks.visitaVnd}%.`,
                action: isOwner ? 'Decidir intervenção em preço, troca, financiamento ou fechamento.' : 'Checar proposta, avaliação de troca, financiamento e fechamento.',
                variant: 'danger',
                impact: 'Alto',
                ctaLabel: role === 'gerente' ? 'Ver ranking' : 'Ver ranking',
                ctaTo: '/classificacao',
            })
        }

        if ((checkins || []).length === 0) {
            alerts.push({
                title: 'Sem dados no período',
                description: 'Ainda não há check-ins para sustentar um diagnóstico operacional.',
                action: isOwner ? 'Solicitar ao gerente confirmação da rotina antes de decidir.' : 'Validar se a equipe lançou a rotina antes de concluir a leitura.',
                variant: 'outline',
                impact: 'Médio',
                ctaLabel: role === 'gerente' ? 'Abrir rotina' : 'Ver equipe',
                ctaTo: role === 'gerente' ? '/rotina' : `${location.pathname}?id=${selectedStoreId || ''}&tab=equipe`,
            })
        } else if (alerts.length === 0) {
            alerts.push({
                title: 'Operação dentro do esperado',
                description: 'Meta, disciplina e funil sem alerta crítico no período.',
                action: isOwner ? 'Acompanhar execução e cobrar manutenção da cadência.' : 'Manter cadência e observar oportunidades individuais no ranking.',
                variant: 'success',
                impact: 'Baixo',
                ctaLabel: 'Ver ranking',
                ctaTo: '/classificacao',
            })
        }

        const weight = { danger: 0, warning: 1, outline: 2, success: 3 } as const
        return alerts.sort((a, b) => weight[a.variant] - weight[b.variant]).slice(0, 4)
    }, [checkins, funnelBenchmarks, funilData, isOwner, location.pathname, metrics, role, selectedStoreId, sellers])

    const mixCanais = useMemo(() => {
        const porta = (checkins || []).reduce((acc, c) => acc + (c.vnd_porta_prev_day || 0), 0)
        const carteira = (checkins || []).reduce((acc, c) => acc + (c.vnd_cart_prev_day || 0), 0)
        const digital = (checkins || []).reduce((acc, c) => acc + (c.vnd_net_prev_day || 0), 0)
        const total = metrics.totalSales
        
        return [
            { label: 'Porta (Showroom)', color: 'bg-emerald-500', pct: total > 0 ? Math.round((porta / total) * 100) : 0, tone: 'success' as ChannelTone },
            { label: 'Carteira (Ativo)', color: 'bg-blue-500', pct: total > 0 ? Math.round((carteira / total) * 100) : 0, tone: 'info' as ChannelTone },
            { label: 'Digital (Leads)', color: 'bg-indigo-500', pct: total > 0 ? Math.round((digital / total) * 100) : 0, tone: 'brand' as ChannelTone },
        ]
    }, [checkins, metrics.totalSales])

    const columns = useMemo<Column<StoreRankingEntry>[]>(() => [
        {
            key: 'position',
            header: 'POS',
            width: 'w-16',
            render: (_, i) => <span className="font-black text-sm text-text-label tabular-nums">{(i + 1).toString().padStart(2, '0')}</span>
        },
        {
            key: 'user_name',
            header: 'ESPECIALISTA',
            render: (r) => (
                <div className="flex items-center gap-mx-sm">
                    <Avatar
                        src={r.avatar_url || undefined}
                        alt={`Avatar de ${r.user_name}`}
                        fallback={r.user_name}
                        size="md"
                        className={cn(
                            "w-mx-8 h-mx-8 sm:w-mx-10 sm:h-mx-10 rounded-mx-lg shadow-mx-inner transition-all",
                            r.is_venda_loja ? "bg-brand-primary text-white border-brand-primary" : "bg-surface-alt text-text-primary border-border-default group-hover:border-brand-primary",
                        )}
                    />
                    <div className="min-w-0">
                        <Typography variant="h3" className="text-sm sm:text-base uppercase tracking-tight group-hover:text-brand-primary transition-colors font-black leading-tight whitespace-normal break-words">{r.user_name}</Typography>
                        {r.is_venda_loja && <span className="text-mx-nano font-black bg-brand-primary text-white px-1 py-0.5 rounded uppercase tracking-widest">Venda Loja</span>}
                    </div>
                </div>
            )
        },
        { key: 'leads', header: 'LEADS', align: 'center', desktopOnly: true, render: (r) => <span className="opacity-60 tabular-nums">{r.leads}</span> },
        { key: 'agd_total', header: 'AGEND.', align: 'center', desktopOnly: true, render: (r) => <span className="opacity-60 tabular-nums text-status-info">{r.agd_total}</span> },
        { key: 'visitas', header: 'VISITAS', align: 'center', desktopOnly: true, render: (r) => <span className="opacity-60 tabular-nums">{r.visitas}</span> },
        {
            key: 'vnd_total',
            header: 'VENDAS',
            align: 'center',
            render: (r) => <span className="font-black text-xl sm:text-2xl text-brand-primary font-mono-numbers">{r.vnd_total}</span>
        },
        {
            key: 'status',
            header: 'STATUS',
            align: 'right',
            render: (r) => (
                <Badge variant={r.vnd_total > 0 ? 'success' : 'outline'} className="px-3 py-1 rounded-mx-lg font-black text-mx-tiny tracking-widest shadow-sm uppercase border-none">
                    {r.vnd_total > 0 ? 'CONVERSÃO' : 'EM AGUARDO'}
                </Badge>
            )
        }
    ], [])

    const filteredRanking = useMemo(() => {
        return metrics.ranking
            .map((ranking): StoreRankingEntry => ({ ...ranking, id: ranking.user_id }))
            .filter(r => r.user_name.toLowerCase().includes(sellerSearch.toLowerCase()))
    }, [metrics.ranking, sellerSearch])

    const pendingDisciplineSellers = useMemo(() => {
        return (sellers || []).filter(seller => !seller.checkin_today)
    }, [sellers])

    const periodContext = useMemo(() => {
        if (viewMode === 'day') {
            return {
                title: 'Leitura D-1',
                description: `Dados do dia de referência ${format(parseISO(referenceDate), 'dd/MM/yyyy')}. Intervalo manual fica desativado nesta leitura.`,
            }
        }

        return {
            title: 'Intervalo manual',
            description: `Dados consolidados de ${format(parseISO(startDate), 'dd/MM/yyyy')} até ${format(parseISO(endDate), 'dd/MM/yyyy')}.`,
        }
    }, [endDate, referenceDate, startDate, viewMode])

    const funnelInterpretation = useCallback((value: number, benchmark: number) => {
        if (value >= benchmark) return 'Dentro ou acima do benchmark; mantenha a cadência e monitore volume.'
        const gap = Math.max(benchmark - value, 0)
        return `Abaixo do benchmark em ${gap} p.p.; priorize ação nesta etapa antes da próxima reunião.`
    }, [])

    const lastSyncLabel = useMemo(() => {
        if (!lastSyncAt) return 'Ainda não atualizado nesta sessão'
        return `Atualizado às ${lastSyncAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    }, [lastSyncAt])

    useEffect(() => {
        if (!isAdminMx || !selectedStoreId) return

        setSettingsForm({
            source_mode: operationalStore?.source_mode || selectedStore?.source_mode || 'native_app',
            active: operationalStore?.active ?? selectedStore?.active ?? true,
            manager_email: operationalStore?.manager_email || selectedStore?.manager_email || '',
            monthly_goal: String(operationalMetaRules?.monthly_goal ?? 0),
            individual_goal_mode: operationalMetaRules?.individual_goal_mode || 'even',
            include_venda_loja_in_store_total: operationalMetaRules?.include_venda_loja_in_store_total ?? true,
            include_venda_loja_in_individual_goal: operationalMetaRules?.include_venda_loja_in_individual_goal ?? false,
            bench_lead_agd: String(benchmark?.lead_to_agend ?? operationalMetaRules?.bench_lead_agd ?? 20),
            bench_agd_visita: String(benchmark?.agend_to_visit ?? operationalMetaRules?.bench_agd_visita ?? 60),
            bench_visita_vnd: String(benchmark?.visit_to_sale ?? operationalMetaRules?.bench_visita_vnd ?? 33),
            matinal_recipients: joinRecipients(deliveryRules?.matinal_recipients),
            weekly_recipients: joinRecipients(deliveryRules?.weekly_recipients),
            monthly_recipients: joinRecipients(deliveryRules?.monthly_recipients),
            whatsapp_group_ref: deliveryRules?.whatsapp_group_ref || '',
            timezone: deliveryRules?.timezone || 'America/Sao_Paulo',
            delivery_active: deliveryRules?.active ?? true,
            projection_mode: operationalMetaRules?.projection_mode || storeGoal?.projection_mode || 'calendar',
        })
    }, [benchmark, deliveryRules, isAdminMx, operationalMetaRules, operationalStore, selectedStore, selectedStoreId, storeGoal])

    const handleStoreUpdate = async (id: string, updates: Parameters<typeof updateStore>[1]) => {
        setSavingStore(true)
        try {
            const { error } = await updateStore(id, updates)
            if (error) {
                toast.error(error)
                return
            }

            setStoreEditOpen(false)
            await fetchSettings()
            const nextName = updates.name || selectedStore?.name
            if (nextName && slugify(nextName) !== storeSlug) {
                navigate(`/lojas/${slugify(nextName)}?id=${id}`, { replace: true })
            }
        } finally {
            setSavingStore(false)
        }
    }

    const handleCreateStore = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!newStore.name.trim()) {
            toast.error('Informe o nome da loja.')
            return
        }

        setCreatingStore(true)
        try {
            const { error } = await createStore(newStore.name, newStore.manager_email || undefined)
            if (error) {
                toast.error(error)
                return
            }

            const createdName = newStore.name
            setNewStore({ name: '', manager_email: '' })
            setCreateStoreOpen(false)
            await refetchStores()
            toast.success('Loja criada com sucesso.')
            navigate(`/lojas/${slugify(createdName)}`)
        } finally {
            setCreatingStore(false)
        }
    }

    const executeDeleteStore = async () => {
        if (!selectedStoreId || !selectedStore) return

        setDeletingStore(true)
        try {
            const { error } = await deleteStore(selectedStoreId)
            if (error) {
                toast.error(error)
                return
            }
            toast.success('Loja arquivada.')
            navigate(isPerfilInternoMx(role) || role === 'dono' ? '/lojas' : '/classificacao', { replace: true })
        } finally {
            setDeletingStore(false)
        }
    }

    const handleDeleteStore = () => {
        if (!selectedStoreId || !selectedStore) return
        requestToastConfirmation({
            key: `delete-store-dashboard:${selectedStoreId}`,
            title: `Arquivar ${selectedStore.name}?`,
            description: 'A unidade ficará inativa, vínculos operacionais ativos serão encerrados e o histórico será preservado.',
            label: 'Arquivar',
            onConfirm: executeDeleteStore,
        })
    }

    const handleSettingsSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!selectedStoreId) return

        const monthlyGoal = toBoundedNumber(settingsForm.monthly_goal, 0, 0, 999999)
        const benchLeadAgd = toBoundedNumber(settingsForm.bench_lead_agd, 20, 0, 100)
        const benchAgdVisita = toBoundedNumber(settingsForm.bench_agd_visita, 60, 0, 100)
        const benchVisitaVnd = toBoundedNumber(settingsForm.bench_visita_vnd, 33, 0, 100)
        if (
            String(monthlyGoal) !== String(toNumber(settingsForm.monthly_goal, 0)) ||
            String(benchLeadAgd) !== String(toNumber(settingsForm.bench_lead_agd, 20)) ||
            String(benchAgdVisita) !== String(toNumber(settingsForm.bench_agd_visita, 60)) ||
            String(benchVisitaVnd) !== String(toNumber(settingsForm.bench_visita_vnd, 33))
        ) {
            toast.error('Revise metas e benchmarks. Use valores entre 0 e 100 para conversões.')
            return
        }

        const matinalRecipients = splitRecipients(settingsForm.matinal_recipients)
        const payload: StoreSettingsPayload = {
            store: {
                id: selectedStoreId,
                manager_email: settingsForm.manager_email.trim() || null,
                source_mode: settingsForm.source_mode,
                active: settingsForm.active,
            },
            delivery: {
                store_id: selectedStoreId,
                matinal_recipients: matinalRecipients,
                weekly_recipients: splitRecipients(settingsForm.weekly_recipients),
                monthly_recipients: splitRecipients(settingsForm.monthly_recipients),
                whatsapp_group_ref: settingsForm.whatsapp_group_ref.trim() || null,
                timezone: settingsForm.timezone.trim() || 'America/Sao_Paulo',
                active: settingsForm.delivery_active,
            },
            benchmark: {
                store_id: selectedStoreId,
                lead_to_agend: benchLeadAgd,
                agend_to_visit: benchAgdVisita,
                visit_to_sale: benchVisitaVnd,
            },
            meta: {
                store_id: selectedStoreId,
                monthly_goal: monthlyGoal,
                individual_goal_mode: settingsForm.individual_goal_mode,
                include_venda_loja_in_store_total: settingsForm.include_venda_loja_in_store_total,
                include_venda_loja_in_individual_goal: settingsForm.include_venda_loja_in_individual_goal,
                bench_lead_agd: benchLeadAgd,
                bench_agd_visita: benchAgdVisita,
                bench_visita_vnd: benchVisitaVnd,
                projection_mode: settingsForm.projection_mode,
            },
        }

        setSavingSettings(true)
        try {
            const { error } = await saveSettings(payload)
            if (error) {
                toast.error(error)
                return
            }

            await Promise.all([refetchStores(), refetchStoreGoal()])
            toast.success('Dados operacionais da loja atualizados.')
            if (!payload.store.active) navigate(isPerfilInternoMx(role) || role === 'dono' ? '/lojas' : '/classificacao', { replace: true })
        } finally {
            setSavingSettings(false)
        }
    }

    if (!resolving && !storesLoading && requestedStoreForbidden && !isOwner) {
        return <Navigate to="/classificacao" replace />
    }

    if (!resolving && !storesLoading && isOwner && (requestedStoreForbidden || storeResolutionIssue || !selectedStoreId)) {
        return (
            <main className="w-full h-full bg-surface-alt p-mx-lg">
                <Card className="mx-auto max-w-2xl border-none bg-white shadow-mx-xl">
                    <EmptyState
                        size="lg"
                        icon={<Building2 />}
                        title={requestedStoreForbidden ? 'Loja fora do seu vínculo' : 'Unidade não localizada'}
                        description={requestedStoreForbidden ? 'Seu perfil de Dono não possui vínculo ativo com esta unidade.' : storeResolutionIssue || 'Não encontramos uma unidade ativa para abrir este painel.'}
                        nextStep="Volte para a visão executiva da rede e escolha uma loja ativa. Se a loja foi renomeada ou criada recentemente, solicite ao Admin MX revisar seu vínculo."
                        action={
                            <Button onClick={() => navigate('/lojas', { replace: true })} className="rounded-mx-full bg-brand-secondary px-mx-xl">
                                Voltar para minhas lojas
                            </Button>
                        }
                    />
                </Card>
            </main>
        )
    }

    if (!resolving && !storesLoading && !selectedStoreId && (isPerfilInternoMx(role) || role === 'dono')) {
        return <Navigate to="/lojas" replace />
    }

    if (resolving || (storesLoading && isPerfilInternoMx(role) && !selectedStoreId)) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt" role="status">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse font-black uppercase tracking-widest">Identificando Unidade...</Typography>
        </div>
    )

    if (activeTab === 'performance' && loading && !isRefetching) return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-md md:p-mx-lg bg-surface-alt animate-in fade-in duration-500">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
                <div className="space-y-mx-xs">
                    <Skeleton className="h-mx-10 w-full max-w-mx-64" />
                    <Skeleton className="h-mx-xs w-full max-w-mx-48" />
                </div>
                <div className="flex gap-mx-sm">
                    <Skeleton className="h-mx-14 w-mx-14 rounded-mx-xl" />
                    <Skeleton className="h-mx-14 w-mx-48 rounded-mx-xl" />
                </div>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-mx-xl rounded-mx-2xl" />)}
            </div>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-md md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt" id="main-content">
            
            <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-mx-md md:gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-xs text-center xl:text-left min-w-0">
                    <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest opacity-60 text-mx-tiny">Status de Unidade</Typography>                    <div className="flex items-center justify-center lg:justify-start gap-mx-sm">
                        <div className="hidden sm:block w-mx-xs h-mx-10 bg-brand-secondary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        {isPerfilInternoMx(role) ? (
                            <div className="relative group max-w-full">
                                <select 
                                    value={selectedStoreId || ''} 
                                    onChange={e => {
                                        const newStoreId = e.target.value
	                                        const newStore = selectableStores.find(store => store.id === newStoreId)
	                                        if (newStore) {
                                                if (!isPerfilInternoMx(role)) setActiveStoreId(newStoreId)
	                                            navigate(`/lojas/${slugify(newStore.name)}?id=${newStoreId}${activeTab === 'performance' ? '' : `&tab=${activeTab}`}`)
	                                        }
	                                    }}
                                    className="appearance-none bg-transparent text-2xl sm:text-4xl xl:text-5xl font-black text-text-primary tracking-tighter uppercase outline-none pr-10 cursor-pointer hover:text-brand-primary transition-colors truncate max-w-mx-2xl"
                                >
                                    {selectableStores.map(store => (
                                        <option key={store.id} value={store.id} className="text-lg bg-white">{store.name.toUpperCase()}</option>
                                    ))}
                                </select>
                                <ChevronDown size={24} className="absolute right-mx-0 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                            </div>
                        ) : (
                            <Typography variant="h1" className="max-w-full text-3xl sm:text-5xl font-black uppercase tracking-tighter break-words">{metrics.storeName}</Typography>
                        )}
                    </div>
                </div>

	                <div className="flex flex-wrap items-center justify-center xl:justify-end gap-mx-sm shrink-0 w-full xl:w-auto max-w-full">
                        {isOwner && selectableStores.length > 1 && (
                            <label className="flex w-full flex-col gap-mx-tiny rounded-mx-xl border border-border-default bg-white px-mx-md py-mx-xs shadow-mx-sm sm:w-mx-sidebar-expanded">
                                <span className="text-mx-micro font-black uppercase tracking-widest text-text-secondary">Trocar unidade</span>
                                <select
                                    value={selectedStoreId || ''}
                                    onChange={event => {
                                        const newStoreId = event.target.value
                                        const newStore = selectableStores.find(store => store.id === newStoreId)
                                        if (!newStore) return
                                        setActiveStoreId(newStoreId)
                                        navigate(`/lojas/${slugify(newStore.name)}?id=${newStoreId}${activeTab === 'performance' ? '' : `&tab=${activeTab}`}`)
                                    }}
                                    className="min-w-0 bg-transparent text-sm font-black uppercase text-text-primary outline-none"
                                >
                                    {selectableStores.map(store => (
                                        <option key={store.id} value={store.id}>{store.name}</option>
                                    ))}
                                </select>
                            </label>
                        )}
	                    <TabNavPill tabs={LOJA_TABS} activeTab={activeTab} onTabChange={handleTabChange} className="max-w-full overflow-x-auto" buttonClassName="h-mx-8 sm:h-mx-10 px-4 sm:px-6 shrink-0" aria-label="Abas da loja" />

	                    {activeTab === 'performance' && (
		                    <Button variant="outline" onClick={handleRefresh} aria-label={`Atualizar performance. ${lastSyncLabel}`} title={lastSyncLabel} className="h-mx-10 sm:h-mx-14 rounded-mx-xl shadow-mx-sm bg-white px-mx-md">
		                        <RefreshCw size={18} className={cn(isRefetching && "animate-spin")} />
                                Atualizar
		                    </Button>
	                    )}
	                </div>
		            </header>

                    <div className="flex flex-col gap-mx-sm sm:flex-row sm:items-center sm:justify-between">
                        <LastUpdated value={lastSyncAt} />
                        {syncWarning && (
                            <div role="alert" className="rounded-mx-xl border border-status-warning/20 bg-status-warning-surface px-mx-md py-mx-sm text-mx-tiny font-black uppercase tracking-tight text-status-warning">
                                {syncWarning}
                            </div>
                        )}
                    </div>

                    {activeTab === 'performance' && (
                        <Card className="border border-border-default bg-white p-mx-md shadow-mx-sm">
                            <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[auto_1fr_auto] xl:items-center">
                                <div className="min-w-0">
                                    <Typography variant="h3" className="uppercase tracking-tight">{periodContext.title}</Typography>
                                    <Typography variant="p" tone="muted" className="mt-mx-tiny text-sm">{periodContext.description}</Typography>
                                </div>
                                <div className="flex flex-col gap-mx-sm sm:flex-row sm:items-center">
                                    <TabNavPill tabs={PERIODO_TABS} activeTab={viewMode} onTabChange={(m) => setViewMode(m as 'day' | 'month')} buttonClassName="h-mx-11 px-5" aria-label="Período do dashboard" />
                                    <div className={cn(
                                        "grid grid-cols-1 gap-mx-sm rounded-mx-xl border border-border-default bg-surface-alt p-mx-sm sm:grid-cols-2",
                                        viewMode === 'day' && "opacity-50"
                                    )}>
                                        <label className="space-y-mx-tiny">
                                            <span className="block text-mx-micro font-black uppercase tracking-widest text-text-secondary">Início</span>
                                            <input type="date" aria-label="Data inicial do período" disabled={viewMode === 'day'} value={startDate} onChange={e => {setStartDate(e.target.value); setViewMode('month')}} className="h-mx-12 w-full min-w-mx-40 rounded-mx-lg border border-border-default bg-white px-mx-sm text-sm font-black text-text-primary outline-none focus:border-brand-primary" />
                                        </label>
                                        <label className="space-y-mx-tiny">
                                            <span className="block text-mx-micro font-black uppercase tracking-widest text-text-secondary">Fim</span>
                                            <input type="date" aria-label="Data final do período" disabled={viewMode === 'day'} value={endDate} onChange={e => {setEndDate(e.target.value); setViewMode('month')}} className="h-mx-12 w-full min-w-mx-40 rounded-mx-lg border border-border-default bg-white px-mx-sm text-sm font-black text-text-primary outline-none focus:border-brand-primary" />
                                        </label>
                                    </div>
                                </div>
                                <Button type="button" variant="outline" onClick={() => handleTabChange('metas')} className="h-mx-11 rounded-mx-xl bg-white">
                                    <Target size={16} className="mr-2" />
                                    Metas que alimentam a leitura
                                </Button>
                            </div>
                        </Card>
                    )}

	            {activeTab === 'metas' ? (
	                <StoreGoalsPanel storeId={selectedStoreId} storeName={metrics.storeName} />
	            ) : activeTab === 'equipe' ? (
	                <StoreTeamPanel storeId={selectedStoreId} storeName={metrics.storeName} />
	            ) : (
	            <>
	            {isAdminMx && selectedStore && (
	                <Card className="w-full border border-border-default shadow-mx-sm bg-white overflow-hidden">
                    <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-lg">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-mx-md">
                            <div className="flex items-center gap-mx-sm min-w-0">
                                <div className="w-mx-12 h-mx-12 rounded-mx-xl bg-brand-primary text-white flex items-center justify-center shadow-mx-inner shrink-0">
                                    <Settings2 size={22} />
                                </div>
                                <div className="min-w-0">
                                    <CardTitle className="text-lg md:text-xl tracking-tight">Administração da Loja</CardTitle>
                                    <CardDescription className="uppercase tracking-mx-wide font-black mt-1 text-mx-tiny">
                                        {operationalLoading ? 'CARREGANDO DADOS...' : `${selectedStore.name.toUpperCase()} · Cadastro e parâmetros separados da leitura de performance`}
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-mx-sm">
                                <Button type="button" variant="outline" onClick={() => setStoreEditOpen(true)} className="h-mx-10 rounded-mx-xl">
                                    <Building2 size={16} className="mr-2" /> Editar cadastro
                                </Button>
                                <Button type="button" variant="outline" onClick={() => navigate('/lojas')} className="h-mx-10 rounded-mx-xl">
                                    <Building2 size={16} className="mr-2" /> Gerenciar lojas
                                </Button>
                                <Button type="button" variant={showAdminSettings ? 'secondary' : 'outline'} onClick={() => setShowAdminSettings(current => !current)} className="h-mx-10 rounded-mx-xl">
                                    <Settings2 size={16} className="mr-2" /> {showAdminSettings ? 'Ocultar parâmetros' : 'Configurar parâmetros'}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    {showAdminSettings && (
                    <CardContent className="p-mx-lg">
                        <div className="mb-mx-lg rounded-mx-xl border border-border-default bg-surface-alt px-mx-md py-mx-sm">
                            <Typography variant="p" tone="muted" className="text-sm">
                                Estes parâmetros alteram metas, fonte de dados, benchmarks e entregas de relatório. A leitura de performance abaixo continua baseada nos lançamentos do período selecionado.
                            </Typography>
                        </div>
                        <form onSubmit={handleSettingsSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg">
                            <section className="xl:col-span-4 space-y-mx-md">
                                <div className="flex items-center gap-mx-xs">
                                    <Target size={16} className="text-brand-primary" />
                                    <Typography variant="caption" className="font-black uppercase tracking-widest">Meta e Regras</Typography>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-mx-md">
                                    <label className="space-y-mx-xs">
                                        <span className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">Meta Mensal</span>
                                        <Input type="number" min="0" value={settingsForm.monthly_goal} onChange={e => setSettingsForm(prev => ({ ...prev, monthly_goal: e.target.value }))} className="font-mono-numbers font-black" />
                                    </label>
                                    <label className="space-y-mx-xs">
                                        <span className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">Modo de Projeção</span>
                                        <select value={settingsForm.projection_mode} onChange={e => setSettingsForm(prev => ({ ...prev, projection_mode: e.target.value as ProjectionMode }))} className="w-full h-mx-14 sm:h-12 rounded-mx-md border border-border-default bg-white px-5 text-sm font-black uppercase shadow-inner outline-none focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5">
                                            <option value="calendar">Calendário</option>
                                            <option value="business">Dias úteis</option>
                                        </select>
                                    </label>
                                    <label className="space-y-mx-xs">
                                        <span className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">Meta Individual</span>
                                        <select value={settingsForm.individual_goal_mode} onChange={e => setSettingsForm(prev => ({ ...prev, individual_goal_mode: e.target.value as StoreSettingsPayload['meta']['individual_goal_mode'] }))} className="w-full h-mx-14 sm:h-12 rounded-mx-md border border-border-default bg-white px-5 text-sm font-black uppercase shadow-inner outline-none focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5">
                                            <option value="even">Igual</option>
                                            <option value="custom">Customizada</option>
                                            <option value="proportional">Proporcional</option>
                                        </select>
                                    </label>
                                    <label className="space-y-mx-xs">
                                        <span className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">Fonte</span>
                                        <select value={settingsForm.source_mode} onChange={e => setSettingsForm(prev => ({ ...prev, source_mode: e.target.value as StoreSourceMode }))} className="w-full h-mx-14 sm:h-12 rounded-mx-md border border-border-default bg-white px-5 text-sm font-black uppercase shadow-inner outline-none focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5">
                                            <option value="native_app">App nativo</option>
                                            <option value="legacy_forms">Forms legado</option>
                                            <option value="hybrid">Híbrido</option>
                                        </select>
                                        <Typography variant="tiny" tone="muted" className="block normal-case tracking-normal">
                                            {SOURCE_MODE_DESCRIPTIONS[settingsForm.source_mode]}
                                        </Typography>
                                    </label>
                                </div>
                                <div className="grid grid-cols-1 gap-mx-sm">
                                    <label className="flex items-center gap-mx-sm rounded-mx-xl border border-border-default bg-surface-alt p-mx-sm cursor-pointer">
                                        <input type="checkbox" checked={settingsForm.active} onChange={e => setSettingsForm(prev => ({ ...prev, active: e.target.checked }))} className="h-mx-sm w-mx-sm accent-brand-primary" />
                                        <span className="text-mx-tiny font-black uppercase tracking-widest">Loja ativa</span>
                                    </label>
                                    <label className="flex items-center gap-mx-sm rounded-mx-xl border border-border-default bg-surface-alt p-mx-sm cursor-pointer">
                                        <input type="checkbox" checked={settingsForm.include_venda_loja_in_store_total} onChange={e => setSettingsForm(prev => ({ ...prev, include_venda_loja_in_store_total: e.target.checked }))} className="h-mx-sm w-mx-sm accent-brand-primary" />
                                        <span className="text-mx-tiny font-black uppercase tracking-widest">Venda loja no total</span>
                                    </label>
                                    <label className="flex items-center gap-mx-sm rounded-mx-xl border border-border-default bg-surface-alt p-mx-sm cursor-pointer">
                                        <input type="checkbox" checked={settingsForm.include_venda_loja_in_individual_goal} onChange={e => setSettingsForm(prev => ({ ...prev, include_venda_loja_in_individual_goal: e.target.checked }))} className="h-mx-sm w-mx-sm accent-brand-primary" />
                                        <span className="text-mx-tiny font-black uppercase tracking-widest">Venda loja na meta individual</span>
                                    </label>
                                </div>
                            </section>

                            <section className="xl:col-span-4 space-y-mx-md">
                                <div className="flex items-center gap-mx-xs">
                                    <ShieldCheck size={16} className="text-brand-primary" />
                                    <Typography variant="caption" className="font-black uppercase tracking-widest">Benchmarks</Typography>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-mx-md">
                                    <label className="space-y-mx-xs">
                                        <span className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">Lead / Agendamento (%)</span>
                                        <Input type="number" min="0" step="0.01" value={settingsForm.bench_lead_agd} onChange={e => setSettingsForm(prev => ({ ...prev, bench_lead_agd: e.target.value }))} className="font-mono-numbers font-black" />
                                        <Typography variant="tiny" tone="muted" className="block normal-case tracking-normal">Impacta a régua visual Lead → Agendamento.</Typography>
                                    </label>
                                    <label className="space-y-mx-xs">
                                        <span className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">Agendamento / Visita (%)</span>
                                        <Input type="number" min="0" step="0.01" value={settingsForm.bench_agd_visita} onChange={e => setSettingsForm(prev => ({ ...prev, bench_agd_visita: e.target.value }))} className="font-mono-numbers font-black" />
                                        <Typography variant="tiny" tone="muted" className="block normal-case tracking-normal">Impacta a régua visual Agendamento → Visita.</Typography>
                                    </label>
                                    <label className="space-y-mx-xs">
                                        <span className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">Visita / Venda (%)</span>
                                        <Input type="number" min="0" step="0.01" value={settingsForm.bench_visita_vnd} onChange={e => setSettingsForm(prev => ({ ...prev, bench_visita_vnd: e.target.value }))} className="font-mono-numbers font-black" />
                                        <Typography variant="tiny" tone="muted" className="block normal-case tracking-normal">Impacta a régua visual Visita → Venda.</Typography>
                                    </label>
                                </div>
                            </section>

                            <section className="xl:col-span-4 space-y-mx-md">
                                <div className="flex items-center gap-mx-xs">
                                    <Mail size={16} className="text-brand-primary" />
                                    <Typography variant="caption" className="font-black uppercase tracking-widest">Relatórios</Typography>
                                </div>
                                <div className="grid grid-cols-1 gap-mx-md">
                                    <label className="space-y-mx-xs">
                                        <span className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">E-mail do gestor</span>
                                        <Input type="email" value={settingsForm.manager_email} onChange={e => setSettingsForm(prev => ({ ...prev, manager_email: e.target.value }))} placeholder="gestor@loja.com.br" />
                                    </label>
                                    <label className="space-y-mx-xs">
                                        <span className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">Matinal</span>
                                        <Input value={settingsForm.matinal_recipients} onChange={e => setSettingsForm(prev => ({ ...prev, matinal_recipients: e.target.value }))} placeholder="email1@loja.com.br, email2@loja.com.br" />
                                        <RecipientPreview value={settingsForm.matinal_recipients} />
                                    </label>
                                    <label className="space-y-mx-xs">
                                        <span className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">Semanal</span>
                                        <Input value={settingsForm.weekly_recipients} onChange={e => setSettingsForm(prev => ({ ...prev, weekly_recipients: e.target.value }))} placeholder="email1@loja.com.br, email2@loja.com.br" />
                                        <RecipientPreview value={settingsForm.weekly_recipients} />
                                    </label>
                                    <label className="space-y-mx-xs">
                                        <span className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">Mensal</span>
                                        <Input value={settingsForm.monthly_recipients} onChange={e => setSettingsForm(prev => ({ ...prev, monthly_recipients: e.target.value }))} placeholder="email1@loja.com.br, email2@loja.com.br" />
                                        <RecipientPreview value={settingsForm.monthly_recipients} />
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-md">
                                        <label className="space-y-mx-xs">
                                            <span className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">WhatsApp</span>
                                            <Input value={settingsForm.whatsapp_group_ref} onChange={e => setSettingsForm(prev => ({ ...prev, whatsapp_group_ref: e.target.value }))} placeholder="grupo ou link" />
                                        </label>
                                        <label className="space-y-mx-xs">
                                            <span className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">Timezone</span>
                                            <Input value={settingsForm.timezone} onChange={e => setSettingsForm(prev => ({ ...prev, timezone: e.target.value }))} />
                                        </label>
                                    </div>
                                    <label className="flex items-center gap-mx-sm rounded-mx-xl border border-border-default bg-surface-alt p-mx-sm cursor-pointer">
                                        <input type="checkbox" checked={settingsForm.delivery_active} onChange={e => setSettingsForm(prev => ({ ...prev, delivery_active: e.target.checked }))} className="h-mx-sm w-mx-sm accent-brand-primary" />
                                        <span className="text-mx-tiny font-black uppercase tracking-widest">Envios ativos</span>
                                    </label>
                                </div>
                            </section>

                            <footer className="xl:col-span-12 flex flex-col gap-mx-md pt-mx-md border-t border-border-default">
                                <div className="rounded-mx-xl border border-status-error/20 bg-status-error-surface p-mx-md">
                                    <div className="flex flex-col gap-mx-sm sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <Typography variant="caption" className="font-black uppercase tracking-mx-wide text-status-error">Zona de risco</Typography>
                                            <Typography variant="p" className="mt-mx-tiny text-sm text-status-error">Arquivar preserva histórico, mas remove a loja da operação ativa.</Typography>
                                        </div>
                                        <Button type="button" variant="danger" onClick={handleDeleteStore} disabled={deletingStore} className="h-mx-10 rounded-mx-xl">
                                            {deletingStore ? <RefreshCw size={16} className="mr-2 animate-spin" /> : <Archive size={16} className="mr-2" />}
                                            Arquivar loja
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-mx-sm">
                                <Button type="button" variant="ghost" onClick={fetchSettings} disabled={operationalLoading || savingSettings} className="h-mx-10 rounded-mx-xl">
                                    <RefreshCw size={16} className={cn('mr-2', operationalLoading && 'animate-spin')} /> Recarregar
                                </Button>
                                <Button type="submit" disabled={savingSettings || operationalLoading} className="h-mx-10 rounded-mx-xl bg-brand-secondary">
                                    {savingSettings ? <RefreshCw size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                                    Salvar dados
                                </Button>
                                </div>
                            </footer>
                        </form>
                    </CardContent>
                    )}
                </Card>
            )}

            {isOwner && (
                <section className="grid grid-cols-1 gap-mx-md xl:grid-cols-3">
                    <Card className="border border-status-warning/20 bg-status-warning-surface p-mx-lg shadow-mx-sm">
                        <Typography variant="tiny" className="font-black uppercase tracking-widest text-status-warning">O que eu decido hoje</Typography>
                        <Typography variant="h3" className="mt-mx-xs uppercase text-status-warning">
                            {ownerPerformanceAlerts[0]?.title || 'Sem decisão crítica'}
                        </Typography>
                        <Typography variant="p" className="mt-mx-xs text-sm text-status-warning">
                            {ownerPerformanceAlerts[0]?.action || 'Acompanhe a execução e mantenha a cadência de gestão.'}
                        </Typography>
                    </Card>
                    <Card className="border border-border-default bg-white p-mx-lg shadow-mx-sm">
                        <Typography variant="tiny" className="font-black uppercase tracking-widest text-text-secondary">O que eu acompanho</Typography>
                        <Typography variant="h3" className="mt-mx-xs uppercase">Execução do gerente</Typography>
                        <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">
                            Disciplina diária, funil comercial e atingimento de meta ficam separados das ações operacionais.
                        </Typography>
                    </Card>
                    <Card className="border border-border-default bg-white p-mx-lg shadow-mx-sm">
                        <Typography variant="tiny" className="font-black uppercase tracking-widest text-text-secondary">Financeiro</Typography>
                        <Typography variant="h3" className="mt-mx-xs uppercase">{latestDRE ? 'DRE disponível' : 'DRE pendente'}</Typography>
                        <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">
                            {latestDRE ? 'Use o resultado líquido como contexto da decisão comercial.' : 'Solicite ao Admin MX o cadastro do DRE para conectar performance e margem.'}
                        </Typography>
                    </Card>
                </section>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-mx-md md:gap-mx-lg shrink-0">
                <Card className="p-mx-lg border-none bg-brand-secondary text-white shadow-mx-xl relative overflow-hidden group">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-white/5 rounded-mx-full blur-3xl -mr-16 -mt-16" />
                    <Typography variant="tiny" tone="white" className="opacity-50 mb-2 block font-black uppercase tracking-widest text-mx-tiny">Meta de Vendas</Typography>
                    <Typography variant="h1" tone="white" className="text-4xl sm:text-5xl tabular-nums leading-none mb-2 tracking-tighter font-mono-numbers">{metrics.goalValue}</Typography>
                    <Badge variant="outline" className="bg-white text-brand-secondary border-white font-black h-mx-md uppercase text-mx-tiny shadow-mx-sm">{metrics.attainment}% ATINGIDO</Badge>
                </Card>

                <Card className="p-mx-lg border-none shadow-mx-lg bg-white relative overflow-hidden">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" />
                    <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny">Vendido Período</Typography>
                    <Typography variant="h1" className="text-4xl sm:text-5xl tabular-nums leading-none mb-2 tracking-tighter font-mono-numbers">{metrics.totalSales}</Typography>
                    <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest text-mx-tiny">REFERÊNCIA REAL-TIME</Typography>
                </Card>

                <Card className="p-mx-lg border-none shadow-mx-lg bg-white relative overflow-hidden">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-status-info-surface rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" />
                    <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny">Leads Gerados</Typography>
                    <div className="flex items-baseline gap-mx-xs mb-2">
                        <Typography variant="h1" className="text-4xl sm:text-5xl tabular-nums leading-none tracking-tighter font-mono-numbers">{metrics.totalLeads}</Typography>
                        <Typography variant="h3" tone="muted" className="text-xl font-black uppercase opacity-20">LEADS</Typography>
                    </div>
                    <Typography variant="tiny" tone="info" className="font-black uppercase tracking-widest text-mx-tiny">ENTRADA DO FUNIL</Typography>
                </Card>

                <Card className="p-mx-lg border-none shadow-mx-lg bg-white relative overflow-hidden">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-status-warning-surface rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" />
                    <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny">Visitas Realizadas</Typography>
                    <div className="flex items-baseline gap-mx-xs mb-2">
                        <Typography variant="h1" className="text-4xl sm:text-5xl tabular-nums leading-none tracking-tighter font-mono-numbers">{metrics.totalVis}</Typography>
                        <Typography variant="h3" tone="muted" className="text-xl font-black uppercase opacity-20">VIS</Typography>
                    </div>
                    <Typography variant="tiny" tone="warning" className="font-black uppercase tracking-widest text-mx-tiny">MEIO DO FUNIL</Typography>
                </Card>

                <Card className="p-mx-lg border-none shadow-mx-lg bg-white relative overflow-hidden">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-status-success-surface rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" />
                    <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny">
                        <GlossaryHint term="Saúde Disciplinar" definition="Percentual da equipe que realizou o lançamento diário obrigatório." />
                    </Typography>
                    <Typography variant="h1" tone={metrics.checkedInCount < (sellers || []).length ? 'error' : 'success'} className="text-4xl sm:text-5xl tabular-nums leading-none mb-2 tracking-tighter font-mono-numbers">
                        {metrics.checkedInCount}<span className="text-text-tertiary text-2xl font-black">/{(sellers || []).length}</span>
                    </Typography>
                    <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-mx-tiny">REGISTROS SINCRONIZADOS</Typography>
                    {pendingDisciplineSellers.length > 0 && (
                        <div className="mt-mx-sm rounded-mx-xl border border-status-warning/20 bg-status-warning-surface p-mx-sm">
                            <Typography variant="tiny" className="block font-black uppercase tracking-widest text-status-warning">Pendentes</Typography>
                            <Typography variant="p" className="mt-mx-tiny text-sm text-status-warning line-clamp-2">
                                {pendingDisciplineSellers.slice(0, 3).map(seller => seller.name).join(', ')}
                                {pendingDisciplineSellers.length > 3 ? ` +${pendingDisciplineSellers.length - 3}` : ''}
                            </Typography>
                            {role === 'gerente' && (
                                <Button type="button" variant="outline" size="sm" onClick={() => navigate('/rotina')} className="mt-mx-sm h-mx-9 rounded-mx-lg bg-white text-status-warning">
                                    Resolver na rotina
                                </Button>
                            )}
                        </div>
                    )}
                </Card>

                {/* DRE Summary for Owner/Admin */}
                {(isPerfilInternoMx(role) || role === 'dono') && latestDRE && (
                   <Card className="p-mx-lg bg-white shadow-mx-lg border-none animate-in slide-in-from-right duration-500 delay-300">
                       <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny text-brand-primary">Lucratividade Preditiva (DRE)</Typography>
                        <div className="flex items-baseline gap-mx-xs mb-mx-xs">
                            <Typography variant="tiny" tone="muted" className="font-black text-mx-nano">R$</Typography>
                            <Typography variant="h1" tone={latestDRE.net_profit >= 0 ? 'success' : 'error'} className="text-4xl sm:text-5xl tabular-nums leading-none tracking-tighter font-mono-numbers">
                                {Math.round(latestDRE.net_profit).toLocaleString('pt-BR')}
                            </Typography>
                        </div>
                       <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-mx-tiny">RESULTADO LÍQUIDO MÊS</Typography>
                   </Card>
                )}
                {(isPerfilInternoMx(role) || role === 'dono') && !latestDRE && (
                   <Card className="p-mx-lg bg-white shadow-mx-lg border-none">
                       <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny text-brand-primary">Lucratividade Preditiva (DRE)</Typography>
                       <Typography variant="h3" className="mb-mx-xs uppercase">DRE pendente</Typography>
                       <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-mx-tiny">
                           {isOwner ? 'SOLICITE CADASTRO AO ADMIN MX' : 'RESULTADO INDISPONÍVEL'}
                       </Typography>
                   </Card>
                )}
                </div>

            {(isPerfilInternoMx(role) || role === 'dono' || role === 'gerente') && (
                <Card className="w-full border-none shadow-mx-lg bg-white overflow-hidden">
                    <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-lg">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-mx-md">
                            <div>
                                <CardTitle className="text-lg md:text-xl uppercase tracking-tighter">{role === 'gerente' ? 'Visão Gerencial' : isOwner ? 'Decisões do Dono' : 'Visão do Dono'}</CardTitle>
                                <CardDescription className="uppercase tracking-widest font-black mt-1 text-mx-tiny">
                                    {isOwner ? 'IMPACTO FINANCEIRO, COMERCIAL E DISCIPLINAR PRIORIZADO' : 'ALERTAS DE PERFORMANCE, ROTINA E FUNIL'}
                                </CardDescription>
                            </div>
                            <Badge variant={ownerPerformanceAlerts.some(alert => alert.variant === 'danger') ? 'danger' : ownerPerformanceAlerts.some(alert => alert.variant === 'warning') ? 'warning' : 'success'} className="rounded-mx-full px-3 py-1 w-fit">
                                {ownerPerformanceAlerts.some(alert => alert.variant === 'danger') ? 'AÇÃO NECESSÁRIA' : ownerPerformanceAlerts.some(alert => alert.variant === 'warning') ? 'PONTO DE ATENÇÃO' : 'DENTRO DO RITMO'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-mx-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-mx-md">
                            {ownerPerformanceAlerts.map((alert) => (
                                <div key={alert.title} className="rounded-mx-xl border border-border-default bg-surface-alt p-mx-md">
                                    <div className="flex items-start justify-between gap-mx-sm mb-mx-sm">
                                        <Typography variant="p" className="font-black uppercase text-sm leading-tight">{alert.title}</Typography>
                                        <Badge variant={alert.variant} className="rounded-mx-full px-2 py-0.5 shrink-0">
                                            {alert.variant === 'success' ? 'OK' : alert.variant === 'warning' ? 'ATENÇÃO' : alert.variant === 'outline' ? 'VALIDAR' : 'CRÍTICO'}
                                        </Badge>
                                    </div>
                                    {isOwner && (
                                        <Typography variant="tiny" tone="muted" className="mb-mx-xs block font-black uppercase tracking-widest">
                                            Impacto {alert.impact}
                                        </Typography>
                                    )}
                                    <Typography variant="tiny" tone="muted" className="block mb-mx-sm">{alert.description}</Typography>
                                    <Typography variant="tiny" className="font-black uppercase tracking-tight">{alert.action}</Typography>
                                    <Button type="button" variant="outline" size="sm" onClick={() => navigate(alert.ctaTo)} className="mt-mx-sm h-mx-9 rounded-mx-lg bg-white">
                                        {alert.ctaLabel}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="w-full border-none shadow-mx-lg bg-white overflow-hidden">
                <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg md:text-xl uppercase tracking-tighter">Fluxo de Escoamento</CardTitle>
                            <CardDescription className="uppercase tracking-widest font-black mt-1 text-mx-tiny">TAXAS DE CONVERSÃO & BENCHMARKS MX</CardDescription>
                        </div>
                        <div className="hidden sm:flex items-baseline gap-mx-xs">
                            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Eficiência Global</Typography>
                            <Typography variant="h2" tone={funilData.tx_visita_vnd >= funnelBenchmarks.visitaVnd ? 'success' : 'error'} className="tabular-nums">{funilData.tx_visita_vnd}%</Typography>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-mx-lg md:p-mx-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg md:gap-mx-14">
                        {[
                            { from: 'Leads', to: 'Agendamentos', val: funilData.tx_lead_agd, bench: funnelBenchmarks.leadAgd },
                            { from: 'Agendamentos', to: 'Visitas', val: funilData.tx_agd_visita, bench: funnelBenchmarks.agdVisita },
                            { from: 'Visitas', to: 'Vendas', val: funilData.tx_visita_vnd, bench: funnelBenchmarks.visitaVnd },
                        ].map((step, idx) => (
                            <div key={idx} className="space-y-mx-md">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-mx-xs">
                                        <div className="w-mx-8 h-mx-8 rounded-mx-lg bg-surface-alt flex items-center justify-center font-black text-text-tertiary text-xs border border-border-default shadow-sm">0{idx+1}</div>
                                        <Typography variant="tiny" className="font-black uppercase tracking-tight">{step.from} <ArrowRight size={10} className="inline opacity-30" /> {step.to}</Typography>
                                    </div>
                                    <div className="flex items-baseline gap-mx-xs">
                                        <Typography variant="h2" tone={step.val >= step.bench ? 'success' : 'error'} className="text-2xl tabular-nums">{step.val}%</Typography>
                                        <Typography variant="tiny" tone="muted" className="font-black text-mx-micro">BENCH {step.bench}%</Typography>
                                    </div>
                                </div>
                                <div className="h-mx-xs w-full bg-surface-alt rounded-mx-full overflow-hidden border border-border-default shadow-inner p-px">
                                    <motion.div 
                                        initial={{ width: 0 }} animate={{ width: `${Math.min(step.val, 100)}%` }} transition={{ duration: 1.2, delay: idx * 0.15, ease: "circOut" }}
                                        className={cn("h-full rounded-mx-full shadow-sm transition-all duration-1000", 
                                            step.val >= step.bench ? 'bg-status-success shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-status-error shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                                        )} 
                                    />
                                </div>
                                <Typography variant="p" tone="muted" className="text-sm">
                                    {funnelInterpretation(step.val, step.bench)}
                                </Typography>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg pb-32">
                <section className="xl:col-span-8 flex flex-col">
                    <Card className="border-none shadow-mx-lg bg-white overflow-hidden flex-1">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-mx-md p-mx-lg bg-surface-alt/30 border-b border-border-default">
                            <div>
                                <CardTitle className="text-xl md:text-2xl">{viewMode === 'day' ? 'Grade Diária' : 'Ranking da Unidade'}</CardTitle>
                                <CardDescription className="font-black uppercase tracking-mx-wide mt-1 text-mx-tiny">Performance individual para ação gerencial</CardDescription>
                            </div>
                            <div className="relative group w-full sm:w-mx-sidebar-expanded">
                                <Search size={14} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" />
                                <label htmlFor="dashboard-seller-search" className="sr-only">Buscar especialista</label>
                                <Input id="dashboard-seller-search" name="dashboard-seller-search" placeholder="BUSCAR..." value={sellerSearch} onChange={e => setSellerSearch(e.target.value)} className="!pl-10 !h-10 text-mx-tiny font-black uppercase" />
                            </div>
                        </CardHeader>
                        <div className="border-b border-border-default bg-white px-mx-lg py-mx-sm">
                            <div className="flex flex-col gap-mx-sm lg:flex-row lg:items-center lg:justify-between">
                                <Typography variant="p" tone="muted" className="text-sm">
                                    Use a busca para localizar vendedor e abrir ações de devolutiva, PDI ou rotina sem depender de estética competitiva.
                                </Typography>
                                {sellerSearch.trim() && filteredRanking.length > 0 && (
                                    <div className="flex flex-wrap gap-mx-xs">
                                        <Button type="button" variant="outline" size="sm" onClick={() => navigate('/devolutivas')} className="h-mx-9 rounded-mx-lg bg-white">Devolutiva</Button>
                                        <Button type="button" variant="outline" size="sm" onClick={() => navigate('/pdi')} className="h-mx-9 rounded-mx-lg bg-white">PDI</Button>
                                        <Button type="button" variant="outline" size="sm" onClick={() => navigate('/rotina')} className="h-mx-9 rounded-mx-lg bg-white">Rotina</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <DataGrid columns={columns} data={filteredRanking} emptyMessage="Nenhum especialista localizado." emptyDescription="Limpe a busca ou confirme se a equipe ativa realizou lançamentos no período selecionado." />
                    </Card>
                </section>

                <aside className="xl:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-mx-lg border-none shadow-mx-lg bg-white relative overflow-hidden group">
                        <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" />
                        <header className="flex items-center gap-mx-sm mb-8 relative z-10">
                            <div className="w-mx-12 h-mx-12 rounded-mx-xl bg-surface-alt flex items-center justify-center text-brand-primary shadow-mx-inner border border-border-default shrink-0"><Globe size={24} /></div>
                            <Typography variant="h3" className="text-lg uppercase tracking-tight font-black">Mix de Canais</Typography>
                        </header>
                        <div className="space-y-mx-lg relative z-10">
                            {mixCanais.map(ch => (
                                <div key={ch.label} className="space-y-mx-xs">
                                    <div className="flex justify-between items-end">
                                        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-mx-tiny">{ch.label}</Typography>
                                        <Typography variant="mono" tone={ch.tone} className="text-sm font-black">{ch.pct}%</Typography>
                                    </div>
                                    <div className="h-mx-xs w-full bg-surface-alt rounded-mx-full overflow-hidden border border-border-default p-0.5"><motion.div initial={{ width: 0 }} animate={{ width: `${ch.pct}%` }} transition={{ duration: 1.5 }} className={cn("h-full rounded-full", ch.color)} /></div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-mx-lg bg-brand-primary rounded-mx-3xl text-white shadow-mx-xl relative overflow-hidden group border-none">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                        <div className="relative z-10 text-center py-4">
                            <History className="mx-auto mb-6 opacity-30 transform group-hover:scale-110 transition-transform" size={40} />
                            <Typography variant="h2" tone="white" className="text-lg mb-4 uppercase tracking-tight font-black">Diagnóstico Unidade</Typography>
                            <Typography variant="caption" tone="white" className="text-mx-tiny font-black italic opacity-80 leading-relaxed uppercase tracking-widest max-w-xs mx-auto block italic">"{diagnostics.diagnostico} {diagnostics.sugestao}"</Typography>
                        </div>
                    </Card>
	                </aside>
	            </div>
	            </>
	            )}

	            <StoreEditModal
                open={storeEditOpen}
                store={selectedStore}
                saving={savingStore}
                onClose={() => setStoreEditOpen(false)}
                onSubmit={handleStoreUpdate}
            />

            <Modal
                open={createStoreOpen}
                onClose={() => setCreateStoreOpen(false)}
                title="Nova Loja"
                description="Cadastro administrativo MX"
                size="lg"
                footer={
                    <>
                        <Button type="button" variant="ghost" onClick={() => setCreateStoreOpen(false)} disabled={creatingStore}>CANCELAR</Button>
                        <Button type="submit" form="store-create-form" disabled={creatingStore} className="bg-brand-secondary">
                            {creatingStore ? <RefreshCw size={16} className="mr-2 animate-spin" /> : <Plus size={16} className="mr-2" />}
                            CADASTRAR
                        </Button>
                    </>
                }
            >
                <form id="store-create-form" onSubmit={handleCreateStore} className="space-y-mx-lg">
                    <label className="space-y-mx-xs block">
                        <Typography as="span" variant="caption" className="font-black uppercase tracking-widest text-text-tertiary">
                            Nome da Loja
                        </Typography>
                        <Input
                            id="dashboard-new-store-name"
                            name="store_name"
                            required
                            autoFocus
                            value={newStore.name}
                            onChange={event => setNewStore(prev => ({ ...prev, name: event.target.value.toUpperCase() }))}
                            className="!h-14 font-black uppercase tracking-widest"
                        />
                    </label>
                    <label className="space-y-mx-xs block">
                        <Typography as="span" variant="caption" className="font-black uppercase tracking-widest text-text-tertiary">
                            E-mail do Gestor
                        </Typography>
                        <Input
                            id="dashboard-new-store-manager-email"
                            name="manager_email"
                            type="email"
                            value={newStore.manager_email}
                            onChange={event => setNewStore(prev => ({ ...prev, manager_email: event.target.value }))}
                            placeholder="gestor@loja.com.br"
                            className="!h-14 font-bold"
                        />
                    </label>
                </form>
            </Modal>
        </main>
    )
}
