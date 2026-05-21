import { ChevronRight, History, Megaphone, Search, ShieldCheck, Smartphone, TrendingUp } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'

type Props = {
  searchTerm: string
  setSearchTerm: (v: string) => void
  filterType: string | null
  setFilterType: (v: string | null) => void
}

const FILTERS = [
  { label: 'Cadastros', type: 'approval', icon: ShieldCheck, tone: 'brand' },
  { label: 'Lançamentos', type: 'discipline', icon: Smartphone, tone: 'error' },
  { label: 'Feedbacks', type: 'performance', icon: TrendingUp, tone: 'success' },
  { label: 'PDI', type: 'alert', icon: History, tone: 'warning' },
  { label: 'Geral', type: 'system', icon: Megaphone, tone: 'brand' },
] as const

export function NotificacoesFiltersBar({ searchTerm, setSearchTerm, filterType, setFilterType }: Props) {
  return (
    <Card className="p-mx-lg md:p-10 border-none shadow-mx-lg bg-white space-y-mx-10">
      <header className="border-b border-border-default pb-8">
        <Typography variant="h3" className="uppercase tracking-tight">
          Filtro Disciplinar
        </Typography>
        <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1 font-black">
          SEGMENTAÇÃO DE ALERTAS
        </Typography>
      </header>

      <div className="relative group">
        <Search
          size={16}
          className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors"
        />
        <Input
          placeholder="LOCALIZAR ALERTA..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="!pl-11 !h-12 uppercase tracking-widest text-xs"
        />
      </div>

      <nav
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-mx-xs"
        role="navigation"
        aria-label="Filtros de notificação"
      >
        {FILTERS.map(f => (
          <button
            key={f.label}
            onClick={() => setFilterType(filterType === f.type ? null : f.type)}
            className={cn(
              'w-full p-mx-md rounded-mx-2xl border transition-all text-left flex items-center justify-between group/f',
              filterType === f.type
                ? 'bg-brand-primary border-brand-primary text-white shadow-mx-lg'
                : 'bg-surface-alt border-border-default hover:bg-white hover:border-brand-primary/20 shadow-inner',
            )}
          >
            <div className="flex items-center gap-mx-sm">
              <f.icon size={16} className={cn(filterType === f.type ? 'text-white' : 'text-text-label')} />
              <Typography
                variant="caption"
                className={cn('font-black uppercase tracking-widest', filterType === f.type ? 'text-white' : 'text-text-primary')}
              >
                {f.label}
              </Typography>
            </div>
            <ChevronRight
              size={14}
              className={cn(filterType === f.type ? 'text-white/40' : 'text-text-tertiary opacity-20 group-hover/f:text-brand-primary')}
            />
          </button>
        ))}
      </nav>

      <footer className="pt-8 border-t border-border-default hidden">
        <Button
          variant="outline"
          className="w-full h-mx-14 rounded-mx-full shadow-sm font-black uppercase tracking-widest text-xs bg-white border-border-strong hover:border-brand-primary"
        >
          AJUSTES DE ALERTA
        </Button>
      </footer>
    </Card>
  )
}

export default NotificacoesFiltersBar
