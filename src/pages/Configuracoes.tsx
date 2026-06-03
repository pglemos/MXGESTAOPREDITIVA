import { useEffect, useMemo } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, LogOut, Settings, ShieldCheck, SlidersHorizontal, Building2, FolderTree } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { ConfigTabsNav } from '@/features/configuracoes/components/ConfigTabsNav'
import { TAB_REGISTRY, getVisibleTabs } from '@/features/configuracoes/tabRegistry'
import type { ConfigTabKey } from '@/features/configuracoes/types'

const ROLE_LABELS: Record<string, string> = {
    administrador_geral: 'Admin Master MX',
    administrador_mx: 'Admin MX',
    consultor_mx: 'Consultor MX',
    dono: 'Dono',
    gerente: 'Gerente',
    vendedor: 'Vendedor',
}

function isConfigTabKey(value: string | null): value is ConfigTabKey {
    return Boolean(value && TAB_REGISTRY.some(tab => tab.key === value))
}

interface ConfiguracoesProps {
    initialTab?: ConfigTabKey
}

export default function Configuracoes({ initialTab }: ConfiguracoesProps) {
    const { role, profile, signOut } = useAuth()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const visibleTabs = useMemo(() => getVisibleTabs(role), [role])

    const requestedTab = initialTab || searchParams.get('aba')
    const activeTab = useMemo(() => {
        if (isConfigTabKey(requestedTab) && visibleTabs.some(tab => tab.key === requestedTab)) return requestedTab
        return visibleTabs[0]?.key
    }, [requestedTab, visibleTabs])

    useEffect(() => {
        if (!activeTab) return
        if (!initialTab && requestedTab === 'remuneracao') {
            navigate('/configuracoes/remuneracao', { replace: true })
            return
        }
        if (initialTab) return
        if (requestedTab !== activeTab) {
            setSearchParams({ aba: activeTab }, { replace: true })
        }
    }, [activeTab, initialTab, navigate, requestedTab, setSearchParams])

    if (!visibleTabs.length || !activeTab) {
        return <Navigate to="/home" replace />
    }

    const activeDefinition = visibleTabs.find(tab => tab.key === activeTab) || visibleTabs[0]
    const ActiveComponent = activeDefinition.component
    const isReadOnly = Boolean(role && activeDefinition.readOnlyRoles?.includes(role))
    const ActiveIcon = activeDefinition.icon

    const handleSelectTab = (tab: ConfigTabKey) => {
        if (tab === 'remuneracao') {
            navigate('/configuracoes/remuneracao')
            return
        }
        navigate(`/configuracoes?aba=${tab}`)
    }

    return (
        <main className="flex h-full w-full flex-col gap-mx-lg overflow-y-auto bg-surface-alt p-mx-lg no-scrollbar">
            <header className="shrink-0 border-b border-border-default pb-mx-lg">
                <div className="flex flex-col gap-mx-lg xl:flex-row xl:items-end xl:justify-between">
                    <div className="space-y-mx-sm">
                        <div className="flex items-center gap-mx-sm">
                            <span className="flex h-mx-12 w-mx-12 items-center justify-center rounded-mx-xl bg-brand-primary text-white shadow-mx-md">
                                <Settings size={24} />
                            </span>
                            <div>
                                <Typography variant="h1">Configurações</Typography>
                                    <Typography variant="caption" className="font-black uppercase tracking-mx-wide text-text-secondary">
                                    Minha conta, rede, lojas e saúde do sistema em áreas separadas
                                </Typography>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-mx-sm pl-0 md:pl-mx-16">
                            <Badge variant="brand" className="bg-brand-secondary font-black uppercase text-white">
                                {role ? ROLE_LABELS[role] : 'Perfil'}
                            </Badge>
                            <Badge variant="outline" className="font-black uppercase">
                                {profile?.email || 'Sessão ativa'}
                            </Badge>
                            {isReadOnly && (
                                <Badge variant="outline" className="font-black uppercase">
                                    <Eye size={12} className="mr-1" />
                                    Consulta sem edição
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-mx-sm">
                        <Button
                            variant="outline"
                            onClick={() => signOut()}
                            className="h-mx-xl rounded-mx-xl border-status-error/30 bg-white px-5 text-status-error-strong hover:bg-status-error-surface"
                        >
                            <LogOut size={16} className="mr-2" />
                            Encerrar Sessão
                        </Button>
                    </div>
                </div>
            </header>

            <div className="grid min-h-0 grid-cols-1 gap-mx-lg xl:grid-cols-12">
                <aside className="xl:sticky xl:top-0 xl:col-span-3 xl:self-start">
                    <ConfigTabsNav
                        tabs={visibleTabs}
                        activeTab={activeTab}
                        role={role}
                        onSelect={handleSelectTab}
                    />
                </aside>

                <section className="min-w-0 space-y-mx-lg pb-32 xl:col-span-9">
                    <Card className="border-none bg-white p-mx-lg shadow-mx-md">
                        <div className="flex flex-col gap-mx-md lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-mx-sm">
                                <div className="flex h-mx-14 w-mx-14 shrink-0 items-center justify-center rounded-mx-xl border border-mx-indigo-100 bg-mx-indigo-50 text-brand-primary">
                                    <ActiveIcon size={26} />
                                </div>
                                <div className="min-w-0">
                                    <Typography variant="h2" className="uppercase tracking-tight">
                                        {activeDefinition.label}
                                    </Typography>
                                    <Typography variant="caption" className="font-black uppercase tracking-mx-wide text-text-secondary">
                                        {activeDefinition.description}
                                    </Typography>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-mx-sm">
                                <Badge variant={isReadOnly ? 'outline' : 'success'} className="bg-brand-secondary font-black uppercase text-white">
                                    {isReadOnly ? 'Consulta segura' : 'Alterações habilitadas'}
                                </Badge>
                                <Badge variant="outline" className="font-black uppercase">
                                    <ShieldCheck size={12} className="mr-1" />
                                    Acesso pelo perfil
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    <Card className="border border-border-default bg-white p-mx-md shadow-mx-sm">
                        <div className="grid grid-cols-1 gap-mx-sm md:grid-cols-3">
                            <Button asChild variant={activeDefinition.key === 'perfil' ? 'secondary' : 'outline'} className="h-auto justify-start rounded-mx-xl px-mx-md py-mx-sm text-left">
                                <Link to="/configuracoes?aba=perfil">
                                    <Settings size={16} className="mr-2" />
                                    Minha conta
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-auto justify-start rounded-mx-xl px-mx-md py-mx-sm text-left">
                                <Link to="/lojas">
                                    <Building2 size={16} className="mr-2" />
                                    Lojas e equipe
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-auto justify-start rounded-mx-xl px-mx-md py-mx-sm text-left">
                                <Link to={role === 'dono' ? '/configuracoes?aba=operacional-loja' : '/configuracoes/operacional'}>
                                    <SlidersHorizontal size={16} className="mr-2" />
                                    Operação por loja
                                </Link>
                            </Button>
                        </div>
                        <div className="mt-mx-sm flex items-start gap-mx-xs rounded-mx-xl bg-surface-alt px-mx-md py-mx-sm">
                            <FolderTree size={16} className="mt-mx-tiny shrink-0 text-brand-primary" aria-hidden="true" />
                            <Typography variant="p" tone="muted" className="text-xs">
                                Catálogos, treinamentos, produtos e PDI têm rotas próprias para uso diário; aqui ficam apenas regras, atalhos e governança.
                            </Typography>
                        </div>
                    </Card>

                    {role === 'dono' && (
                        <Card className="border border-status-info/20 bg-status-info-surface p-mx-lg shadow-mx-sm">
                            <div className="flex flex-col gap-mx-md lg:flex-row lg:items-start lg:justify-between">
                                <div className="max-w-2xl">
                                    <Typography variant="h3" className="uppercase tracking-tight text-status-info">
                                        Permissões do Dono
                                    </Typography>
                                    <Typography variant="p" className="mt-mx-xs text-sm text-status-info">
                                        Seu perfil acompanha rede, lojas, equipe, PDI, produtos, devolutivas, notificações e parâmetros operacionais em modo de consulta. Alterações de cadastro, pré-cadastro, fonte de dados, metas e DRE são executadas pelo Admin MX para manter governança.
                                    </Typography>
                                </div>
                                <div className="grid w-full gap-mx-xs sm:w-auto sm:min-w-mx-64">
                                    <Button asChild variant="outline" className="justify-start rounded-mx-xl bg-white">
                                        <Link to="/lojas">
                                            <Building2 size={16} className="mr-2" />
                                            Ver minhas lojas
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" className="justify-start rounded-mx-xl bg-white">
                                        <Link to="/notificacoes">
                                            <ShieldCheck size={16} className="mr-2" />
                                            Solicitar ajuste
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    <ActiveComponent isReadOnly={isReadOnly} />
                </section>
            </div>
        </main>
    )
}
