import { useStores, useStoresStats } from '@/hooks/useTeam'
import { isAdministradorMx, useAuth } from '@/hooks/useAuth'
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { toast } from 'sonner'
import { ArrowRight, Building2, Compass, Search, Plus, RefreshCw, X, Mail, Copy, Link2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn, getPreRegistrationLink, slugify } from '@/lib/utils'
import { TabNavPill } from '@/components/molecules/TabNavPill'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardContent } from '@/components/molecules/Card'
import { LastUpdated } from '@/components/molecules/LastUpdated'
import { GlossaryHint } from '@/components/molecules/GlossaryHint'
import { Skeleton } from '@/components/atoms/Skeleton'
import { EmptyState } from '@/components/atoms/EmptyState'
import { Link } from 'react-router-dom'
import { DataGrid, Column } from '@/components/organisms/DataGrid'
import type { Store } from '@/types/database'
import { requestToastConfirmation } from '@/lib/ui/confirmAction'
import { DESTRUCTIVE_ACTION_LABELS, OPERATIONAL_ACTION_LABELS } from '@/lib/ui/actionLabels'

export default function Lojas() {
    const { lojas, loading: storesLoading, refetch: refetchStores, createStore, toggleStoreStatus } = useStores()
    const { stats, loading: statsLoading, refetch: refetchStats } = useStoresStats()
    const { role } = useAuth()
    const isOwner = role === 'dono'
    const [searchTerm, setSearchTerm] = useState('')
    const [filterActive, setFilterActive] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)
    const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
    const [copyError, setCopyError] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newStore, setNewStore] = useState({ name: '', manager_email: '' })
    const createModalRef = useRef<HTMLDivElement>(null)
    useFocusTrap(createModalRef, isCreateModalOpen)
    useEffect(() => {
        if (!isCreateModalOpen) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsCreateModalOpen(false) }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [isCreateModalOpen])
    const [creating, setCreating] = useState(false)

    const loading = storesLoading || statsLoading
    const storeStatusCounts = useMemo(() => ({
        active: (lojas || []).filter(store => store.active).length,
        archived: (lojas || []).filter(store => !store.active).length,
    }), [lojas])

    const filteredStores = useMemo(() => {
        return (lojas || [])
            .filter(s => isOwner ? s.active : s.active === filterActive)
            .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [lojas, searchTerm, filterActive, isOwner])

    const ownerActiveStores = useMemo(() => (lojas || []).filter(store => store.active), [lojas])
    const ownerAttentionStores = useMemo(() => {
        return ownerActiveStores
            .map(store => ({
                store,
                stat: stats[store.id] || { sellers: 0, teamMembers: 0, checkedIn: 0, disciplinePct: 0 },
            }))
            .filter(({ stat }) => stat.teamMembers === 0 || stat.sellers === 0 || stat.disciplinePct < 80)
            .sort((a, b) => a.stat.disciplinePct - b.stat.disciplinePct)
    }, [ownerActiveStores, stats])

    // Corporate Consolidated View Calculation
    const corporateMetrics = useMemo(() => {
        if (!lojas || !stats) return { totalSellers: 0, totalStores: 0, activeStores: 0, avgDiscipline: 0 }
        
        let totalSellers = 0
        let totalDiscipline = 0
        let activeStoresCount = 0

        lojas.filter(s => s.active).forEach(s => {
            const sStat = stats[s.id]
            if (sStat) {
                totalSellers += sStat.sellers
                if (sStat.sellers > 0) {
                    totalDiscipline += sStat.disciplinePct
                    activeStoresCount++
                }
            }
        })

        return {
            totalSellers,
            totalStores: lojas.filter(s => s.active).length,
            activeStores: activeStoresCount,
            avgDiscipline: activeStoresCount > 0 ? Math.round(totalDiscipline / activeStoresCount) : 0
        }
    }, [lojas, stats])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            await Promise.all([refetchStores(), refetchStats()])
            setLastUpdatedAt(new Date())
            toast.success('Rede sincronizada!')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Falha ao sincronizar rede.')
        } finally {
            setIsRefetching(false)
        }
    }, [refetchStores, refetchStats])

    const handleCreateStore = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newStore.name) return toast.error('Nome da unidade é obrigatório')
        setCreating(true)
        const { error } = await createStore(newStore.name, newStore.manager_email)
        setCreating(false)
        if (error) {
            toast.error(error)
        } else {
            toast.success('Unidade operacional criada com sucesso!')
            setIsCreateModalOpen(false)
            setNewStore({ name: '', manager_email: '' })
            await handleRefresh()
        }
    }

    const getRegistrationLink = useCallback((storeName: string) => {
        return getPreRegistrationLink(storeName)
    }, [])

    const copyRegistrationLink = useCallback(async (storeName: string) => {
        const link = getRegistrationLink(storeName)
        if (!navigator.clipboard?.writeText) {
            const message = 'Clipboard indisponível neste navegador. Selecione e copie o preview do link na tabela.'
            setCopyError(message)
            toast.error(message)
            return
        }
        try {
            await navigator.clipboard.writeText(link)
            setCopyError(null)
            toast.success('Link de pré-cadastro copiado.')
        } catch {
            const message = 'Não foi possível copiar o link. Selecione e copie o preview do link na tabela.'
            setCopyError(message)
            toast.error(message)
        }
    }, [getRegistrationLink])

    const handleArchiveStore = useCallback((store: Store) => {
        requestToastConfirmation({
            key: `archive-store:${store.id}`,
            title: `${DESTRUCTIVE_ACTION_LABELS.deactivate} ${store.name}?`,
            description: 'A unidade ficará inativa, mas o histórico será preservado.',
            label: DESTRUCTIVE_ACTION_LABELS.deactivate,
            onConfirm: async () => {
                const { error } = await toggleStoreStatus(store.id, false)
                if (error) toast.error(error)
                else toast.success('Unidade desativada.')
            },
        })
    }, [toggleStoreStatus])

    const columns = useMemo<Column<Store>[]>(() => [
        {
            key: 'name',
            header: 'UNIDADE',
            render: (store) => (
                <div className="flex items-center gap-mx-sm relative z-10 min-w-0">
                    <div className="w-mx-8 h-mx-8 sm:w-mx-14 sm:h-mx-14 rounded-mx-lg sm:rounded-mx-xl bg-white border border-border-default flex items-center justify-center text-brand-primary shadow-mx-sm group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-white transition-all transform group-hover:rotate-3 shrink-0" aria-hidden="true">
                        <Building2 size={18} className="sm:size-mx-md" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <Typography variant="h3" className="text-sm sm:text-base uppercase tracking-tight group-hover:text-brand-primary transition-colors font-black leading-tight whitespace-normal break-words">{store.name}</Typography>
                        <Typography variant="tiny" tone="muted" className="text-mx-nano sm:text-mx-tiny font-black uppercase mt-0.5">ID: {store.id.split('-')[0]}</Typography>
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            header: 'STATUS',
            align: 'center',
            desktopOnly: true,
            render: (store) => {
                const sStat = stats[store.id] || { sellers: 0, teamMembers: 0, checkedIn: 0, disciplinePct: 0 }
                return (
                    <Badge variant={store.active ? "success" : "outline"} className="px-3 py-1 rounded-mx-full text-mx-tiny font-black shadow-sm uppercase border-none">
                        {store.active ? (sStat.teamMembers > 0 ? "OPERANDO" : "SEM EQUIPE") : "INATIVA"}
                    </Badge>
                )
            }
        },
        {
            key: 'metrics',
            header: 'OPERACIONAL',
            align: 'center',
            render: (store) => {
                const sStat = stats[store.id] || { sellers: 0, teamMembers: 0, checkedIn: 0, disciplinePct: 0 }
                return (
                    <div className="flex items-center justify-center gap-mx-xs sm:gap-mx-md">
                        <div className="text-center">
                            <Typography variant="tiny" className="font-black text-text-label uppercase text-mx-nano sm:text-mx-tiny">Equipe</Typography>
                            <Typography variant="h3" className="text-xs sm:text-base tabular-nums">{sStat.teamMembers}</Typography>
                        </div>
                        <div className="w-px h-mx-sm sm:h-mx-md bg-border-default mx-1 sm:mx-2" aria-hidden="true" />
                        <div className="text-center">
                            <Typography variant="tiny" className="font-black text-text-label uppercase text-mx-nano sm:text-mx-tiny">Disciplina</Typography>
                            <Typography variant="h3" tone={sStat.disciplinePct < 80 ? 'error' : 'success'} className="text-xs sm:text-base tabular-nums">{sStat.disciplinePct}%</Typography>
                        </div>
                    </div>
                )
            }
        },
        {
            key: 'registration',
            header: 'PRÉ-CADASTRO',
            desktopOnly: true,
            render: (store) => (
                <div className="flex min-w-0 flex-col gap-mx-tiny">
                  <div className="flex items-center gap-mx-xs min-w-0">
                    <Link2 size={14} className={cn('shrink-0', isAdministradorMx(role) ? 'text-brand-primary' : 'text-text-tertiary')} aria-hidden="true" />
                    <Typography variant="tiny" tone="muted" className="font-bold truncate max-w-mx-48">
                        {isAdministradorMx(role) ? 'Disponível por cópia segura' : isOwner ? 'Admin MX opera este link' : 'Restrito ao Admin MX'}
                    </Typography>
                  </div>
                  {isAdministradorMx(role) && (
                    <Typography variant="tiny" className="block max-w-mx-64 truncate rounded-mx-md bg-surface-alt px-mx-xs py-mx-tiny font-mono text-text-secondary" title={getRegistrationLink(store.name)}>
                        {getRegistrationLink(store.name)}
                    </Typography>
                  )}
                </div>
            )
        },
        {
            key: 'actions',
            header: 'AÇÕES',
            align: 'right',
            render: (store) => (
                <div className="flex items-center justify-end gap-mx-tiny sm:gap-mx-xs relative z-10" onClick={(e) => e.stopPropagation()}>
                    {store.active ? (
                        <>
                            <Button asChild variant="secondary" size="sm" className="h-mx-lg sm:h-mx-xl px-3 sm:px-4 rounded-mx-lg shadow-mx-md font-black text-mx-nano sm:text-mx-tiny">
                                <Link to={`/lojas/${slugify(store.name)}?id=${store.id}`}>{isOwner ? 'Abrir unidade' : OPERATIONAL_ACTION_LABELS.openDashboard}</Link>
                            </Button>
                            {!isOwner && (
                                <Button asChild variant="outline" size="sm" className="h-mx-lg sm:h-mx-xl px-3 sm:px-4 rounded-mx-lg shadow-mx-md font-black text-mx-nano sm:text-mx-tiny border-border-strong bg-white">
                                    <Link to={`/lojas/${slugify(store.name)}?id=${store.id}&tab=equipe`}>{OPERATIONAL_ACTION_LABELS.openTeam}</Link>
                                </Button>
                            )}
                            {isAdministradorMx(role) && (
                                <>
                                    <Button variant="outline" size="icon" onClick={() => copyRegistrationLink(store.name)} className="h-mx-lg w-mx-lg sm:h-mx-xl sm:w-mx-xl rounded-mx-lg shadow-mx-md bg-white border-border-strong" aria-label={`Copiar link de pré-cadastro de ${store.name}`}>
                                        <Copy size={16} />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleArchiveStore(store)} className="h-mx-lg w-mx-lg sm:h-mx-xl sm:w-mx-xl rounded-mx-lg text-text-tertiary hover:text-status-error hover:bg-status-error-surface" aria-label={`Desativar ${store.name}`}>
                                        <X size={16} />
                                    </Button>
                                </>
                            )}
                        </>
                    ) : isAdministradorMx(role) ? (
                            <Button variant="secondary" size="sm" onClick={() => toggleStoreStatus(store.id, true)} className="h-mx-lg sm:h-mx-xl px-4 rounded-mx-lg shadow-mx-md font-black text-mx-nano sm:text-mx-tiny bg-status-success hover:opacity-90 text-white">
                            Restaurar
                        </Button>
                    ) : null}
                </div>
            )
        }
    ], [copyRegistrationLink, getRegistrationLink, handleArchiveStore, isOwner, stats, role, toggleStoreStatus])

    if (loading && !isRefetching) return (
        <main
            className="w-full h-full flex flex-col gap-mx-lg p-mx-lg bg-surface-alt animate-in fade-in duration-500"
            aria-busy="true"
            aria-live="polite"
            aria-label="Carregando lojas"
        >
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
                <div className="space-y-mx-xs text-center lg:text-left">
                    <Skeleton className="h-mx-10 w-mx-64 mx-auto lg:mx-0" />
                    <Skeleton className="h-mx-xs w-mx-48 mx-auto lg:mx-0" />
                </div>
                <div className="flex justify-center gap-mx-sm">
                    <Skeleton className="h-mx-14 w-mx-14 rounded-mx-xl" />
                    <Skeleton className="h-mx-14 w-mx-48 rounded-mx-xl" />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg">
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-mx-64 rounded-mx-2xl" />)}
            </div>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt" id="main-content">
            
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                    <Typography variant="h1">
                        {isOwner ? 'Visão Executiva da Rede' : <>Gestão de <span className="text-mx-green-700">Lojas</span></>}
                    </Typography>
                </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">
                        {isOwner ? 'COMPARE LOJAS, PRIORIZE DECISÕES E ACOMPANHE EXECUÇÃO' : 'CONTROLE DE UNIDADES & GOVERNANÇA MX'}
                    </Typography>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-mx-sm shrink-0 w-full lg:w-auto">
                    <LastUpdated value={lastUpdatedAt} className="hidden xl:inline-flex" />
                    <Button variant="outline" onClick={handleRefresh} className="hidden sm:flex rounded-mx-xl shadow-mx-sm h-mx-xl px-mx-md bg-white border-border-strong" aria-label="Atualizar lista de lojas">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                        {OPERATIONAL_ACTION_LABELS.refresh}
                    </Button>
                    <div className="relative group w-full sm:w-mx-sidebar-expanded order-2 sm:order-none">
                        <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
                        <label htmlFor="search-lojas" className="sr-only">Buscar unidade por nome</label>
                        <Input 
                            id="search-lojas"
                            placeholder="LOCALIZAR LOJA..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="!pl-mx-11 !h-mx-12 uppercase tracking-mx-wide text-mx-nano font-black"
                        />
                    </div>
                    {isAdministradorMx(role) && (
                        <div className="flex w-full sm:w-auto gap-mx-sm order-1 sm:order-none">
                            <TabNavPill
                                tabs={[
                                    { key: 'ativas',     label: `Ativas (${storeStatusCounts.active})` },
                                    { key: 'arquivadas', label: `Arquivadas (${storeStatusCounts.archived})` },
                                ]}
                                activeTab={filterActive ? 'ativas' : 'arquivadas'}
                                onTabChange={(k) => setFilterActive(k === 'ativas')}
                                className="flex-1 sm:flex-none mr-0 sm:mr-2"
                            />
                            <Button onClick={() => setIsCreateModalOpen(true)} className="flex-1 sm:flex-none h-mx-xl px-8 shadow-mx-lg bg-brand-secondary uppercase font-black tracking-widest text-xs">
                                <Plus size={18} className="mr-2" aria-hidden="true" /> NOVA LOJA
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            {copyError && (
                <div role="alert" className="rounded-mx-xl border border-status-warning/20 bg-status-warning-surface px-mx-md py-mx-sm text-sm font-bold text-status-warning">
                    {copyError}
                </div>
            )}

            {isOwner && ownerActiveStores.length === 0 && (
                <Card className="border-none bg-white shadow-mx-md">
                    <EmptyState
                        size="lg"
                        icon={<Building2 />}
                        title="Nenhuma loja ativa vinculada"
                        description="Seu perfil de Dono ainda não possui uma unidade ativa para acompanhamento executivo."
                        nextStep="Solicite ao Admin MX vincular ou ativar a primeira loja da rede. Depois disso, esta tela passa a mostrar comparação, decisões e acompanhamento por unidade."
                    />
                </Card>
            )}

            {isOwner && ownerActiveStores.length > 0 && (
                <section className="grid grid-cols-1 gap-mx-md xl:grid-cols-12">
                    <Card className="border border-border-default bg-white p-mx-lg shadow-mx-md xl:col-span-5">
                        <div className="mb-mx-md flex items-start justify-between gap-mx-md">
                            <div>
                                <Typography variant="h3" className="uppercase tracking-tight">O que decidir hoje</Typography>
                                <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">
                                    Prioridades executivas geradas pela disciplina e estrutura das lojas.
                                </Typography>
                            </div>
                            <Compass size={24} className="shrink-0 text-brand-primary" aria-hidden="true" />
                        </div>
                        <div className="space-y-mx-sm">
                            <div className="rounded-mx-xl border border-border-default bg-surface-alt p-mx-md">
                                <Typography variant="tiny" className="font-black uppercase tracking-widest text-text-secondary">Unidades com atenção</Typography>
                                <Typography variant="h2" tone={ownerAttentionStores.length ? 'warning' : 'success'} className="mt-mx-tiny tabular-nums">
                                    {ownerAttentionStores.length}
                                </Typography>
                                <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">
                                    {ownerAttentionStores.length
                                        ? 'Revise loja sem equipe ou com disciplina abaixo de 80% antes da próxima reunião.'
                                        : 'Todas as lojas ativas têm estrutura e disciplina dentro do mínimo esperado.'}
                                </Typography>
                            </div>
                            <div className="rounded-mx-xl border border-status-info/20 bg-status-info-surface p-mx-md">
                                <Typography variant="tiny" className="font-black uppercase tracking-widest text-status-info">Pré-cadastro</Typography>
                                <Typography variant="p" className="mt-mx-xs text-sm text-status-info">
                                    Links de pré-cadastro são operados pelo Admin MX para preservar governança de acesso.
                                </Typography>
                            </div>
                        </div>
                    </Card>

                    <Card className="border border-border-default bg-white p-mx-lg shadow-mx-md xl:col-span-7">
                        <div className="mb-mx-md">
                            <Typography variant="h3" className="uppercase tracking-tight">Comparativo direto entre lojas</Typography>
                            <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">
                                Use esta visão para decidir onde cobrar plano de ação e onde apenas acompanhar execução.
                            </Typography>
                        </div>
                        <div className="grid grid-cols-1 gap-mx-sm md:grid-cols-2">
                            {ownerActiveStores.map(store => {
                                const sStat = stats[store.id] || { sellers: 0, teamMembers: 0, checkedIn: 0, disciplinePct: 0 }
                                const needsAttention = sStat.teamMembers === 0 || sStat.sellers === 0 || sStat.disciplinePct < 80
                                return (
                                    <Link
                                        key={store.id}
                                        to={`/lojas/${slugify(store.name)}?id=${store.id}`}
                                        className="group rounded-mx-xl border border-border-default bg-surface-alt p-mx-md transition-all hover:border-brand-primary hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15"
                                    >
                                        <div className="flex items-start justify-between gap-mx-sm">
                                            <div className="min-w-0">
                                                <Typography variant="p" className="font-black uppercase leading-tight group-hover:text-brand-primary">{store.name}</Typography>
                                                <Typography variant="tiny" tone="muted" className="mt-mx-tiny block font-bold uppercase">
                                                    {sStat.teamMembers} na equipe · {sStat.checkedIn}/{sStat.sellers} vendedores com registro
                                                </Typography>
                                            </div>
                                            <Badge variant={needsAttention ? 'warning' : 'success'} className="shrink-0 rounded-mx-full">
                                                {needsAttention ? 'DECIDIR' : 'ACOMPANHAR'}
                                            </Badge>
                                        </div>
                                        <div className="mt-mx-md flex items-center justify-between">
                                            <div>
                                                <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Disciplina</Typography>
                                                <Typography variant="h2" tone={sStat.disciplinePct < 80 ? 'error' : 'success'} className="tabular-nums">{sStat.disciplinePct}%</Typography>
                                            </div>
                                            <ArrowRight size={18} className="text-text-tertiary transition-transform group-hover:translate-x-1 group-hover:text-brand-primary" aria-hidden="true" />
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </Card>
                </section>
            )}

            {/* Painel Corporativo / Visão Cruzada */}
            <section className="mb-mx-md">
                <Card className="bg-white shadow-mx-md border border-border-default overflow-hidden rounded-mx-2xl">
                    <CardContent className="p-mx-md sm:p-mx-lg flex flex-wrap gap-mx-md items-center justify-between sm:justify-start">
                        <div className="flex flex-col min-w-mx-20">
                            <Typography variant="tiny" className="font-black text-text-label uppercase tracking-mx-widest mb-mx-tiny">{isOwner ? 'Minha Rede' : 'Rede / Corporativo'}</Typography>
                            <Typography variant="h2" className="text-brand-primary">{corporateMetrics.totalStores}</Typography>
                            <Typography variant="tiny" tone="muted" className="uppercase font-black text-mx-tiny">Unidades ativas</Typography>
                        </div>
                        <div className="w-px h-mx-12 bg-border-default hidden sm:block" />
                        <div className="flex flex-col min-w-mx-20">
                            <Typography variant="tiny" className="font-black text-text-label uppercase tracking-mx-widest mb-mx-tiny">Força de Vendas</Typography>
                            <Typography variant="h2" className="text-status-success">{corporateMetrics.totalSellers}</Typography>
                            <Typography variant="tiny" tone="muted" className="uppercase font-black text-mx-tiny">Especialistas Ativos</Typography>
                        </div>
                        <div className="w-px h-mx-12 bg-border-default hidden sm:block" />
                        <div className="flex flex-col min-w-mx-20">
                            <Typography variant="tiny" className="font-black text-text-label uppercase tracking-mx-wide mb-mx-tiny">
                                <GlossaryHint term="Aderência" definition="Média de disciplina diária das lojas ativas com equipe cadastrada." />
                            </Typography>
                            <Typography variant="h2" tone={corporateMetrics.avgDiscipline < 80 ? 'error' : 'success'}>{corporateMetrics.avgDiscipline}%</Typography>
                            <Typography variant="tiny" tone="muted" className="uppercase font-black text-mx-tiny">{isOwner ? 'Execução média' : 'Disciplina média'}</Typography>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                <Card className="border-none shadow-mx-xl bg-white overflow-hidden p-mx-0">
                    <DataGrid 
                        columns={columns}
                        data={filteredStores}
                        emptyMessage={isOwner ? 'Nenhuma loja encontrada na sua visão executiva.' : 'Nenhuma unidade localizada na rede MX.'}
                        emptyDescription={isOwner ? 'Limpe a busca ou solicite ao Admin MX revisar seus vínculos de Dono.' : 'Ajuste a busca, alterne o filtro de status ou cadastre uma nova unidade para iniciar a operação.'}
                    />
                </Card>
            </div>

            <AnimatePresence>
                {isCreateModalOpen && (
                    <div ref={createModalRef} className="fixed inset-0 z-50 flex items-center justify-center p-mx-md bg-mx-black/60 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="create-store-title">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="w-full max-w-lg">
                            <Card className="p-mx-lg md:p-14 border-none shadow-mx-2xl bg-white overflow-hidden relative rounded-mx-3xl">
                                <form onSubmit={handleCreateStore} className="space-y-mx-xl relative z-10">
                                    <header className="flex items-center justify-between border-b border-border-default pb-8">
                                        <div className="flex items-center gap-mx-sm">
                                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-mx-indigo-50 flex items-center justify-center text-brand-primary border border-mx-indigo-100 shadow-inner shrink-0"><Building2 size={28} /></div>
                                            <div>
                                                <Typography id="create-store-title" variant="h3">Criar loja</Typography>
                                                <Typography variant="caption" tone="muted" className="mt-1 block uppercase tracking-mx-wide">Cadastro único da rede MX</Typography>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" size="sm" 
                                            onClick={() => setIsCreateModalOpen(false)} 
                                            className="rounded-mx-full w-mx-xl h-mx-xl bg-surface-alt hover:bg-white shadow-sm transition-all"
                                            aria-label="Fechar modal"
                                        >
                                            <X size={24} />
                                        </Button>
                                    </header>

                                    <div className="space-y-mx-lg">
                                        <div className="space-y-mx-xs">
                                            <Typography as="label" htmlFor="store-name" variant="caption" className="ml-2 font-black uppercase tracking-widest text-text-tertiary">Nome da Unidade</Typography>
                                            <Input 
                                                id="store-name"
                                                name="store-name"
                                                required autoFocus placeholder="EX: MX SÃO PAULO - LESTE" 
                                                value={newStore.name} onChange={e => setNewStore(p => ({ ...p, name: e.target.value.toUpperCase() }))}
                                                className="!h-14 !px-6 font-black uppercase tracking-widest"
                                            />
                                        </div>
                                        <div className="space-y-mx-xs">
                                            <div className="flex justify-between items-center ml-2">
                                                <Typography as="label" htmlFor="manager-email" variant="caption" className="font-black uppercase tracking-widest text-text-tertiary">E-mail do Gestor</Typography>
                                                <Badge variant="outline" className="text-mx-micro font-black uppercase">Opcional</Badge>
                                            </div>
                                            <div className="relative group">
                                                <Mail size={18} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
                                                <Input 
                                                    id="manager-email"
                                                    name="manager-email"
                                                    type="email" placeholder="gestor@unidade.com.br"
                                                    value={newStore.manager_email} onChange={e => setNewStore(p => ({ ...p, manager_email: e.target.value }))}
                                                    className="!h-14 !pl-14 !px-6 font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <footer className="pt-10 flex justify-end border-t border-border-default">
                                        <Button type="submit" disabled={creating} className="w-full sm:w-auto h-mx-2xl px-12 rounded-mx-full shadow-mx-xl bg-brand-secondary font-black uppercase tracking-widest">
                                            {creating ? <RefreshCw className="animate-spin mr-2" aria-hidden="true" /> : <Plus size={20} className="mr-2" aria-hidden="true" />}
                                            Criar loja
                                        </Button>
                                    </footer>
                                </form>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    )
}
