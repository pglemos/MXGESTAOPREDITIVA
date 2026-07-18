import { useState } from 'react'
import { Package, GraduationCap, TrendingUp, ExternalLink, FolderTree, ListChecks } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { cn } from '@/lib/utils'
import { AgendaOptionsCatalog } from '@/features/configuracoes/components/AgendaOptionsCatalog'
import type { TabContext } from '@/features/configuracoes/types'

const SUBTABS = [
    { key: 'agenda', label: 'Assuntos Agenda', icon: ListChecks, route: null, desc: 'Assuntos, motivos e alvos usados nas reuniões da agenda' },
    { key: 'produtos', label: 'Produtos Digitais', icon: Package, route: '/produtos', desc: 'Catálogo de produtos digitais da rede MX' },
    { key: 'treinamentos', label: 'Treinamentos', icon: GraduationCap, route: '/treinamentos', desc: 'Trilha de treinamentos por audiência' },
    { key: 'pdi', label: 'Níveis PDI por Cargo', icon: TrendingUp, route: '/devolutivas', desc: 'Definições de PDI por hierarquia (vendedor/gerente/dono)' },
] as const

export function CatalogosTab({ isReadOnly }: TabContext) {
    const [active, setActive] = useState<typeof SUBTABS[number]['key']>('agenda')
    const current = SUBTABS.find(s => s.key === active)!
    const Icon = current.icon

    if (active === 'agenda') {
        return (
            <div className="space-y-8">
                <Card className="p-2 border-none shadow-sm bg-white">
                    <div className="flex flex-wrap gap-1">
                        {SUBTABS.map(tab => {
                            const TabIcon = tab.icon
                            const isActive = tab.key === active
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActive(tab.key)}
                                    className={cn(
                                        "flex-1 min-w-[140px] flex items-center justify-center gap-4 h-12 px-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all",
                                        isActive
                                            ? "bg-emerald-600 text-white shadow-sm"
                                            : "bg-transparent text-gray-500 hover:bg-gray-50"
                                    )}
                                >
                                    <TabIcon size={14} /> {tab.label}
                                </button>
                            )
                        })}
                    </div>
                </Card>
                <AgendaOptionsCatalog isReadOnly={isReadOnly} />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Sub-nav */}
            <Card className="p-2 border-none shadow-sm bg-white">
                <div className="flex flex-wrap gap-1">
                    {SUBTABS.map(tab => {
                        const TabIcon = tab.icon
                        const isActive = tab.key === active
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActive(tab.key)}
                                className={cn(
                                    "flex-1 min-w-[140px] flex items-center justify-center gap-4 h-12 px-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all",
                                    isActive
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "bg-transparent text-gray-500 hover:bg-gray-50"
                                )}
                            >
                                <TabIcon size={14} /> {tab.label}
                            </button>
                        )
                    })}
                </div>
            </Card>

            {/* Conteúdo do sub-tab */}
            <Card className="p-8 md:p-12 border-none shadow-sm bg-white">
                <header className="flex items-start gap-6 pb-6 border-b border-gray-100 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-emerald-600 flex items-center justify-center border border-indigo-100">
                        <Icon size={26} />
                    </div>
                    <div className="flex-1">
                        <Typography variant="h3" className="uppercase tracking-tight">{current.label}</Typography>
                        <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black">{current.desc}</Typography>
                    </div>
                    <Badge variant="success" className="font-black uppercase">Catálogo Ativo</Badge>
                </header>

                <Typography variant="caption" tone="muted" className="font-bold leading-relaxed">
                    O catálogo é gerenciado em página dedicada com interface completa de CRUD, drag-and-drop e versionamento.
                </Typography>

                <div className="mt-6">
                    <Button asChild className="h-12 px-8 rounded-full font-black uppercase tracking-widest">
                        <a href={current.route || '#'}>
                            Abrir gestão completa <ExternalLink size={14} className="ml-2" />
                        </a>
                    </Button>
                </div>
            </Card>

            {/* Atalhos secundários */}
            <Card className="p-6 border-none shadow-sm bg-gray-50">
                <div className="flex items-start gap-4">
                    <FolderTree size={18} className="text-emerald-600 shrink-0 mt-1" />
                    <Typography variant="tiny" tone="muted" className="font-bold leading-relaxed">
                        Os catálogos alimentam treinamentos, devolutivas e produtos digitais consumidos por toda a rede.
                        Alterações são propagadas em tempo real via realtime sync.
                    </Typography>
                </div>
            </Card>
        </div>
    )
}
