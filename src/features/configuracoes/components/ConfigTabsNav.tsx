import { Eye } from 'lucide-react'
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
    const sections = tabs.reduce<Record<ConfigTabDefinition['section'], ConfigTabDefinition[]>>((acc, tab) => {
        acc[tab.section] = acc[tab.section] || []
        acc[tab.section].push(tab)
        return acc
    }, { pessoal: [], gestao: [], mx: [], sistema: [] })

    return (
        <nav className="space-y-mx-md" aria-label="Abas de configurações">
            {(Object.keys(sections) as ConfigTabDefinition['section'][]).map(section => {
                const sectionTabs = sections[section]
                if (!sectionTabs.length) return null

                return (
                    <section key={section} className="space-y-mx-xs">
                        <Typography variant="tiny" tone="muted" className="px-mx-sm font-black uppercase tracking-widest">
                            {SECTION_LABELS[section]}
                        </Typography>
                        <div className="space-y-mx-xs">
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
                                            'w-full min-h-mx-14 rounded-mx-xl border px-mx-sm py-mx-sm text-left transition-all',
                                            'flex items-center gap-mx-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15',
                                            selected
                                                ? 'border-brand-primary/30 bg-brand-primary text-white shadow-mx-md'
                                                : 'border-border-default bg-white hover:border-brand-primary/30 hover:bg-surface-alt'
                                        )}
                                        aria-current={selected ? 'page' : undefined}
                                    >
                                        <span className={cn(
                                            'flex h-mx-10 w-mx-10 shrink-0 items-center justify-center rounded-mx-lg border',
                                            selected
                                                ? 'border-white/15 bg-white/10 text-white'
                                                : 'border-border-subtle bg-surface-alt text-brand-primary'
                                        )}>
                                            <Icon size={18} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className={cn('block truncate text-xs font-black uppercase tracking-widest', selected ? 'text-white' : 'text-text-primary')}>
                                                {tab.label}
                                            </span>
                                            <span className={cn('mt-1 block truncate text-[10px] font-bold uppercase tracking-widest', selected ? 'text-white/65' : 'text-text-tertiary')}>
                                                {tab.description}
                                            </span>
                                        </span>
                                        {readOnly && (
                                            <Badge variant={selected ? 'outline' : 'outline'} className={cn('shrink-0 text-mx-micro font-black uppercase', selected && 'border-white/30 text-white')}>
                                                <Eye size={11} className="mr-1" />
                                                Leitura
                                            </Badge>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </section>
                )
            })}
        </nav>
    )
}
