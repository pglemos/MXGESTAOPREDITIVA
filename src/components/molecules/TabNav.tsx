import { cn } from '@/lib/utils'

export interface TabNavItem<T extends string = string> {
  key: T
  label: string
}

interface TabNavProps<T extends string = string> {
  tabs: TabNavItem<T>[]
  activeTab: T
  onTabChange: (tab: T) => void
  className?: string
}

export function TabNav<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  className,
}: TabNavProps<T>) {
  return (
    <nav
      className={cn(
        'flex gap-mx-xs border-b border-border-subtle mb-mx-md overflow-x-auto no-scrollbar',
        className
      )}
      role="tablist"
    >
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          role="tab"
          aria-selected={activeTab === key}
          onClick={() => onTabChange(key)}
          className={cn(
            'px-mx-md py-mx-sm text-xs font-black uppercase tracking-mx-widest transition-all border-b-2 whitespace-nowrap',
            activeTab === key
              ? 'border-brand-primary text-brand-primary bg-brand-primary/5'
              : 'border-transparent text-text-tertiary hover:text-text-primary hover:bg-surface-alt'
          )}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
