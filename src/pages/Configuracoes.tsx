import { useEffect, useMemo } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, LogOut, Settings, ShieldCheck, SlidersHorizontal, Building2, FolderTree } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { PageHeading } from '@/components/molecules/PageHeading'
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
        <main className="flex h-full w-full flex-col gap-8 overflow-y-auto bg-gray-50 p-8 no-scrollbar">
            <PageHeading
                title="Configurações"
                subtitle={
                    <div className="flex flex-wrap items-center gap-4">
                        <Badge variant="brand" className="bg-emerald-600 font-black uppercase text-white rounded-2xl">
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
                }
                actions={
                    <div className="flex flex-wrap items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => signOut()}
                            className="h-12 rounded-2xl border-red-600/30 bg-white px-5 text-red-700 hover:bg-red-50"
                        >
                            <LogOut size={16} className="mr-2" />
                            Encerrar Sessão
                        </Button>
                    </div>
                }
            />

            <div className="grid min-h-0 grid-cols-1 gap-8 xl:grid-cols-12">
                <aside className="xl:sticky xl:top-0 xl:col-span-3 xl:self-start">
                    <ConfigTabsNav
                        tabs={visibleTabs}
                        activeTab={activeTab}
                        role={role}
                        onSelect={handleSelectTab}
                    />
                </aside>

                <section className="min-w-0 space-y-8 pb-32 xl:col-span-9">
                    <Card className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-indigo-50 text-emerald-600">
                                    <ActiveIcon size={26} />
                                </div>
                                <div className="min-w-0">
                                    <Typography variant="h2" className="uppercase tracking-tight">
                                        {activeDefinition.label}
                                    </Typography>
                                    <Typography variant="caption" className="font-black uppercase tracking-wide text-gray-600">
                                        {activeDefinition.description}
                                    </Typography>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <Badge variant={isReadOnly ? 'outline' : 'success'} className="bg-emerald-600 font-black uppercase text-white rounded-2xl">
                                    {isReadOnly ? 'Consulta segura' : 'Alterações habilitadas'}
                                </Badge>
                                <Badge variant="outline" className="font-black uppercase">
                                    <ShieldCheck size={12} className="mr-1" />
                                    Acesso pelo perfil
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <Button asChild variant={activeDefinition.key === 'perfil' ? 'secondary' : 'outline'} className="h-auto justify-start rounded-2xl px-6 py-4 text-left">
                                <Link to="/configuracoes?aba=perfil">
                                    <Settings size={16} className="mr-2" />
                                    Minha conta
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-auto justify-start rounded-2xl px-6 py-4 text-left">
                                <Link to="/lojas">
                                    <Building2 size={16} className="mr-2" />
                                    Lojas e equipe
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-auto justify-start rounded-2xl px-6 py-4 text-left">
                                <Link to={role === 'dono' ? '/configuracoes?aba=operacional-loja' : '/configuracoes/operacional'}>
                                    <SlidersHorizontal size={16} className="mr-2" />
                                    Operação por loja
                                </Link>
                            </Button>
                        </div>
                        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4">
                            <FolderTree size={16} className="mt-1 shrink-0 text-emerald-600" aria-hidden="true" />
                            <Typography variant="p" tone="muted" className="text-xs">
                                Catálogos, treinamentos, produtos e PDI têm rotas próprias para uso diário; aqui ficam apenas regras, atalhos e governança.
                            </Typography>
                        </div>
                    </Card>

                    {role === 'dono' && (
                        <Card className="rounded-2xl border border-blue-600/20 bg-blue-50 p-6 shadow-sm">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                <div className="max-w-2xl">
                                    <Typography variant="h3" className="uppercase tracking-tight text-blue-600">
                                        Permissões do Dono
                                    </Typography>
                                    <Typography variant="p" className="mt-2 text-sm text-blue-600">
                                        Seu perfil acompanha rede, lojas, equipe, PDI, produtos, devolutivas, notificações e parâmetros operacionais em modo de consulta. Alterações de cadastro, pré-cadastro, fonte de dados, metas e DRE são executadas pelo Admin MX para manter governança.
                                    </Typography>
                                </div>
                                <div className="grid w-full gap-2 sm:w-auto sm:min-w-64">
                                    <Button asChild variant="outline" className="justify-start rounded-2xl bg-white">
                                        <Link to="/lojas">
                                            <Building2 size={16} className="mr-2" />
                                            Ver minhas lojas
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" className="justify-start rounded-2xl bg-white">
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
