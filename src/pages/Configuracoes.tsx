import { useEffect, useMemo } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Eye, LogOut, Settings, ShieldCheck } from 'lucide-react'
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

export default function Configuracoes() {
    const { role, profile, signOut } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const visibleTabs = useMemo(() => getVisibleTabs(role), [role])

    const requestedTab = searchParams.get('aba')
    const activeTab = useMemo(() => {
        if (isConfigTabKey(requestedTab) && visibleTabs.some(tab => tab.key === requestedTab)) return requestedTab
        return visibleTabs[0]?.key
    }, [requestedTab, visibleTabs])

    useEffect(() => {
        if (!activeTab) return
        if (requestedTab !== activeTab) {
            setSearchParams({ aba: activeTab }, { replace: true })
        }
    }, [activeTab, requestedTab, setSearchParams])

    if (!visibleTabs.length || !activeTab) {
        return <Navigate to="/home" replace />
    }

    const activeDefinition = visibleTabs.find(tab => tab.key === activeTab) || visibleTabs[0]
    const ActiveComponent = activeDefinition.component
    const isReadOnly = Boolean(role && activeDefinition.readOnlyRoles?.includes(role))
    const ActiveIcon = activeDefinition.icon

    const handleSelectTab = (tab: ConfigTabKey) => {
        setSearchParams({ aba: tab })
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
                                <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest">
                                    Governança, identidade e operação da rede MX
                                </Typography>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-mx-sm pl-0 md:pl-mx-16">
                            <Badge variant="brand" className="font-black uppercase">
                                {role ? ROLE_LABELS[role] : 'Perfil'}
                            </Badge>
                            <Badge variant="outline" className="font-black uppercase">
                                {profile?.email || 'Sessão ativa'}
                            </Badge>
                            {isReadOnly && (
                                <Badge variant="outline" className="font-black uppercase">
                                    <Eye size={12} className="mr-1" />
                                    Aba somente leitura
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-mx-sm">
                        <Button
                            variant="outline"
                            onClick={() => signOut()}
                            className="h-mx-xl rounded-mx-xl border-status-error/20 bg-white px-5 text-status-error hover:bg-status-error-surface"
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
                                    <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest">
                                        {activeDefinition.description}
                                    </Typography>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-mx-sm">
                                <Badge variant={isReadOnly ? 'outline' : 'success'} className="font-black uppercase">
                                    {isReadOnly ? 'Somente leitura' : 'Edição habilitada'}
                                </Badge>
                                <Badge variant="outline" className="font-black uppercase">
                                    <ShieldCheck size={12} className="mr-1" />
                                    Role gated
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    <ActiveComponent isReadOnly={isReadOnly} />
                </section>
            </div>
        </main>
    )
}
