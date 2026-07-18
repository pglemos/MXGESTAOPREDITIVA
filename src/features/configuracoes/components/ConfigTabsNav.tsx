import { useMemo, useState } from 'react'
import { Eye, Search } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { cn } from '@/lib/utils'
import { SECTION_LABELS } from '@/features/configuracoes/tabRegistry'
import type { ConfigTabDefinition, ConfigTabKey } from '@/features/configuracoes/types'
import type { UserRole } from '@/types/database'

interface ConfigTabsNavProps {
    tabs: ConfigTabDefinition[]
    activeTab: ConfigTabKey
    role: UserRole | null
    onSelect: (tab: ConfigTabKey) => void
}

export function ConfigTabsNav({ tabs, activeTab, role, onSelect }: ConfigTabsNavProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const filteredTabs = useMemo(() => {
        const term = searchTerm.trim().toLowerCase()
        if (!term) return tabs
        return tabs.filter(tab => `${SECTION_LABELS[tab.section]} ${tab.label} ${tab.description}`.toLowerCase().includes(term))
    }, [searchTerm, tabs])
    const sections = filteredTabs.reduce<Record<ConfigTabDefinition['section'], ConfigTabDefinition[]>>((acc, tab) => {
        acc[tab.section] = acc[tab.section] || []
        acc[tab.section].push(tab)
        return acc
    }, { pessoal: [], gestao: [], mx: [], sistema: [] })

    return (
        <nav className="space-y-6" aria-label="Abas de configurações">
            <label className="relative block">
                <span className="sr-only">Buscar configuração</span>
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar configuração"
                    className="h-11 w-full rounded-2xl border border-gray-100 bg-white pl-12 pr-4 text-sm font-bold text-gray-800 outline-none transition-all placeholder:text-gray-500 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10"
                />
            </label>
            {(Object.keys(sections) as ConfigTabDefinition['section'][]).map(section => {
                const sectionTabs = sections[section]
                if (!sectionTabs.length) return null

                return (
                    <section key={section} className="space-y-2">
                        <Typography variant="tiny" className="px-4 font-black uppercase tracking-widest text-gray-600">
                            {SECTION_LABELS[section]}
                        </Typography>
                        <div className="space-y-2">
                            {sectionTabs.map(tab => {
                                const Icon = tab.icon
                                const selected = tab.key === activeTab
                                const readOnly = Boolean(role && tab.readOnlyRoles?.includes(role))

                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => onSelect(tab.key)}
                                        className={cn(
                                            'w-full min-h-14 rounded-2xl border px-4 py-4 text-left transition-all',
                                            'flex items-center gap-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/15',
                                            selected
                                                ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                                                : readOnly
                                                  ? 'border-gray-100 border-dashed bg-gray-50 hover:border-emerald-600/30'
                                                  : 'border-gray-100 bg-white hover:border-emerald-600/30 hover:bg-gray-50'
                                        )}
                                        aria-current={selected ? 'page' : undefined}
                                    >
                                        <span className={cn(
                                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border',
                                            selected
                                                ? 'border-white/15 bg-white/10 text-white'
                                                : 'border-gray-100 bg-gray-50 text-emerald-600'
                                        )}>
                                            <Icon size={18} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className={cn('block truncate text-xs font-black uppercase tracking-widest', selected ? 'text-white' : 'text-gray-800')}>
                                                {tab.label}
                                            </span>
                                            <span className={cn('mt-1 block truncate text-[9px] font-bold uppercase tracking-wide', selected ? 'text-white' : 'text-gray-600')}>
                                                {tab.description}
                                            </span>
                                        </span>
                                        {readOnly && (
                                            <Badge variant={selected ? 'outline' : 'outline'} className={cn('shrink-0 text-[9px] font-black uppercase', selected && 'border-white/30 text-white')}>
                                                <Eye size={11} className="mr-1" />
                                                Consulta
                                            </Badge>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </section>
                )
            })}
            {filteredTabs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-100 bg-white p-6 text-center">
                    <Typography variant="p" tone="muted">Nenhuma configuração encontrada para a busca.</Typography>
                </div>
            )}
        </nav>
    )
}
