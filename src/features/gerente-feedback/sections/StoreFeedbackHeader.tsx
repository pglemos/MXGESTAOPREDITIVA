import { Plus, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Typography } from '@/components/atoms/Typography'
import { cn } from '@/lib/utils'
import type { FeedbackTab } from '../lib/helpers'

type Props = {
  isOwner: boolean
  canCreateFeedback: boolean
  activeTab: FeedbackTab
  onTabChange: (tab: FeedbackTab) => void
  searchTerm: string
  onSearchChange: (term: string) => void
  isRefetching: boolean
  onRefresh: () => void
  onOpenForm: () => void
}

export function StoreFeedbackHeader({
  isOwner,
  canCreateFeedback,
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  isRefetching,
  onRefresh,
  onOpenForm,
}: Props) {
  return (
    <header
      className="flex flex-col xl:flex-row xl:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0"
      role="banner"
    >
      <div className="flex flex-col gap-mx-tiny min-w-0 max-w-full">
        <div className="flex items-center gap-mx-sm">
          <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" />
          <Typography variant="h1">
            {isOwner ? 'Devolutivas da ' : 'Gestão de '}
            <span className="text-mx-green-700">{isOwner ? 'Rede' : 'Devolutivas'}</span>
          </Typography>
        </div>
        <Typography
          variant="caption"
          className="pl-mx-md uppercase tracking-widest font-black text-text-label"
        >
          {isOwner
            ? 'ACOMPANHE QUALIDADE DE GESTÃO E COBRANÇAS SEMANAIS'
            : 'Rotina Semanal Mandatória • Metodologia MX'}
        </Typography>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-mx-sm shrink-0 w-full xl:w-auto max-w-full">
        <nav
          className="flex p-mx-tiny bg-white border border-border-default rounded-mx-full shadow-mx-sm xl:mr-2"
          role="tablist"
        >
          <Button
            variant={activeTab === 'individual' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onTabChange('individual')}
            className="h-mx-9 rounded-mx-full px-6 text-mx-tiny font-black uppercase"
            role="tab"
            aria-selected={activeTab === 'individual'}
          >
            Individual
          </Button>
          <Button
            variant={activeTab === 'weekly' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onTabChange('weekly')}
            className="h-mx-9 rounded-mx-full px-6 text-mx-tiny font-black uppercase"
            role="tab"
            aria-selected={activeTab === 'weekly'}
          >
            Relatórios
          </Button>
        </nav>
        <div className="relative group w-full sm:w-mx-sidebar-expanded">
          <Search
            size={16}
            className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors"
          />
          <label htmlFor="feedback-store-search" className="sr-only">
            Buscar mentoria
          </label>
          <Input
            id="feedback-store-search"
            name="feedback-store-search"
            placeholder="BUSCAR MENTORIA..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="!pl-11 !h-12 !text-mx-tiny uppercase tracking-widest font-black"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          aria-label="Sincronizar devolutivas"
          className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl bg-white"
        >
          <RefreshCw size={20} className={cn(isRefetching && 'animate-spin')} />
        </Button>
        {activeTab === 'individual' && canCreateFeedback && (
          <Button
            onClick={onOpenForm}
            className="h-mx-xl px-8 shadow-mx-lg bg-brand-secondary font-black uppercase text-xs tracking-widest w-full sm:w-auto"
          >
            <Plus size={18} className="mr-2" /> NOVO FEEDBACK
          </Button>
        )}
      </div>
    </header>
  )
}

export default StoreFeedbackHeader
