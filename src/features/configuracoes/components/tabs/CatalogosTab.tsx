import { useState } from 'react'
import { Package, GraduationCap, TrendingUp, ExternalLink, FolderTree } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { cn } from '@/lib/utils'

const SUBTABS = [
    { key: 'produtos', label: 'Produtos Digitais', icon: Package, route: '/produtos', desc: 'Catálogo de produtos digitais da rede MX' },
    { key: 'treinamentos', label: 'Treinamentos', icon: GraduationCap, route: '/treinamentos', desc: 'Trilha de treinamentos por audiência' },
    { key: 'pdi', label: 'Níveis PDI por Cargo', icon: TrendingUp, route: '/devolutivas', desc: 'Definições de PDI por hierarquia (vendedor/gerente/dono)' },
] as const

export function CatalogosTab() {
    const [active, setActive] = useState<typeof SUBTABS[number]['key']>('produtos')
    const current = SUBTABS.find(s => s.key === active)!
    const Icon = current.icon

    return (
        <div className="space-y-mx-lg">
            {/* Sub-nav */}
            <Card className="p-mx-xs border-none shadow-mx-md bg-white">
                <div className="flex flex-wrap gap-mx-tiny">
                    {SUBTABS.map(tab => {
                        const TabIcon = tab.icon
                        const isActive = tab.key === active
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActive(tab.key)}
                                className={cn(
                                    "flex-1 min-w-[140px] flex items-center justify-center gap-mx-sm h-mx-xl px-4 rounded-mx-xl font-black uppercase text-xs tracking-widest transition-all",
                                    isActive
                                        ? "bg-brand-primary text-white shadow-mx-sm"
                                        : "bg-transparent text-text-tertiary hover:bg-surface-alt"
                                )}
                            >
                                <TabIcon size={14} /> {tab.label}
                            </button>
                        )
                    })}
                </div>
            </Card>

            {/* Conteúdo do sub-tab */}
            <Card className="p-mx-lg md:p-mx-xl border-none shadow-mx-lg bg-white">
                <header className="flex items-start gap-mx-md pb-mx-md border-b border-border-default mb-mx-lg">
                    <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-mx-indigo-50 text-brand-primary flex items-center justify-center border border-mx-indigo-100">
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

                <div className="mt-mx-md">
                    <Button asChild className="h-mx-xl px-8 rounded-mx-full font-black uppercase tracking-widest">
                        <a href={current.route}>
                            Abrir gestão completa <ExternalLink size={14} className="ml-2" />
                        </a>
                    </Button>
                </div>
            </Card>

            {/* Atalhos secundários */}
            <Card className="p-mx-md border-none shadow-mx-sm bg-surface-alt">
                <div className="flex items-start gap-mx-sm">
                    <FolderTree size={18} className="text-brand-primary shrink-0 mt-1" />
                    <Typography variant="tiny" tone="muted" className="font-bold leading-relaxed">
                        Os catálogos alimentam treinamentos, devolutivas e produtos digitais consumidos por toda a rede.
                        Alterações são propagadas em tempo real via realtime sync.
                    </Typography>
                </div>
            </Card>
        </div>
    )
}
