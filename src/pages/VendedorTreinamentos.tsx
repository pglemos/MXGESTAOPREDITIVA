import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Award,
  Bell,
  Bookmark,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Clock,
  ExternalLink,
  GraduationCap,
  Medal,
  Play,
  Route,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from 'lucide-react'
import { Avatar } from '@/components/atoms/Avatar'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { useAuth } from '@/hooks/useAuth'
import {
  useDevelopmentRecommendations,
  useDevelopmentTracks,
  useTrainings,
} from '@/hooks/useData'
import type { TrainingWithProgress } from '@/hooks/useTrainings'
import {
  DEVELOPMENT_THEMES,
  filterDevelopmentContent,
  inferDevelopmentTheme,
  type DevelopmentTheme,
} from '@/lib/development-content'
import { cn } from '@/lib/utils'
import { AulasAoVivoSection } from '@/features/universidade/sections/AulasAoVivoSection'
import { useAulasAoVivo } from '@/hooks/useAulasAoVivo'

type TrainingTab = 'overview' | 'biblioteca' | 'trilha' | 'aulas'

const TABS: Array<{ key: TrainingTab; label: string }> = [
  { key: 'overview', label: 'Visão Geral' },
  { key: 'biblioteca', label: 'Biblioteca' },
  { key: 'trilha', label: 'Trilha' },
  { key: 'aulas', label: 'Aulas ao Vivo' },
]

const CARD_IMAGES = [
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1556745753-b2904692b3cd?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1560264280-88b68371db39?auto=format&fit=crop&w=900&q=80',
]

const THEME_LABELS: Partial<Record<DevelopmentTheme, string>> = {
  atendimento: 'Atendimento',
  prospeccao: 'Prospecção',
  agendamento: 'WhatsApp',
  funil: 'Negociação',
  financiamento: 'Financiamento',
  carro_de_troca: 'Troca / Avaliação',
  fechamento: 'Fechamento',
  crm: 'Pós-venda',
  gestao: 'Gestão de Carteira',
  rotina_diaria: 'Rotina',
  institucional: 'Institucional',
}

const MODULE_THEMES: Array<{ theme: DevelopmentTheme; title: string; subtitle: string; icon: typeof Target }> = [
  { theme: 'fechamento', title: 'Negociação e Fechamento', subtitle: 'Técnicas para conduzir negociações e aumentar sua taxa de fechamento.', icon: Target },
  { theme: 'crm', title: 'Gestão de Clientes e Carteira', subtitle: 'Como gerir sua carteira, aumentar indicações e manter clientes ativos.', icon: Route },
  { theme: 'rotina_diaria', title: 'Alta Performance e Produtividade', subtitle: 'Métodos e hábitos para produzir mais e ter consistência todos os dias.', icon: TrendingUp },
  { theme: 'gestao', title: 'Liderança e Influência', subtitle: 'Desenvolva sua influência, postura e capacidade de liderar resultados.', icon: Star },
]

/** Módulos da trilha derivados dos treinamentos reais, agrupados por tema. */
function buildModules(trainings: TrainingWithProgress[]) {
  const modules = MODULE_THEMES.map(cfg => {
    const items = filterDevelopmentContent(trainings, { theme: cfg.theme })
    const done = items.filter(t => t.watched).length
    const total = items.length
    return { ...cfg, items, done, total, score: total > 0 ? Math.round((done / total) * 100) : 0 }
  })
  const firstOpenIndex = modules.findIndex(m => m.total > 0 && m.done < m.total)
  return modules.map((m, index) => ({ ...m, open: index === (firstOpenIndex === -1 ? 0 : firstOpenIndex) }))
}

function todayLabel() {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    weekday: 'long',
  }).format(new Date())
}

function activeTabFromSearch(value: string | null): TrainingTab {
  if (value === 'biblioteca' || value === 'trilha' || value === 'aulas') return value
  return 'overview'
}

export default function VendedorTreinamentos() {
  const { profile } = useAuth()
  const [params, setParams] = useSearchParams()
  const activeTab = activeTabFromSearch(params.get('tab'))
  const { treinamentos, loading, error, markWatched, rateTraining, suggestContent, refetch } = useTrainings()
  const { recommendations } = useDevelopmentRecommendations()
  const { assignments, progress: trackProgress } = useDevelopmentTracks()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTheme, setSelectedTheme] = useState<DevelopmentTheme | 'todos'>('todos')
  const [suggestionTitle, setSuggestionTitle] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const watched = useMemo(() => treinamentos.filter(t => t.watched).length, [treinamentos])
  const total = treinamentos.length
  const progress = total > 0 ? Math.round((watched / total) * 100) : 0
  const filteredTrainings = useMemo(
    () => filterDevelopmentContent(treinamentos, { search: searchTerm, theme: selectedTheme }),
    [searchTerm, selectedTheme, treinamentos],
  )
  const recommendedCards = useMemo(
    () => [
      ...(recommendations.map(rec => rec.training).filter(Boolean) as TrainingWithProgress[]),
      ...treinamentos,
    ].slice(0, 3),
    [recommendations, treinamentos],
  )
  const libraryCards = filteredTrainings.length ? filteredTrainings : treinamentos
  const activeAssignment = assignments.find((assignment: { status?: string }) => assignment.status === 'active')
  const trackName = (activeAssignment as { track?: { name?: string } } | undefined)?.track?.name || null
  const modules = useMemo(() => buildModules(treinamentos), [treinamentos])
  const { indicadores: aulasIndicadores } = useAulasAoVivo()
  const activeTrackProgress = activeAssignment
    ? trackProgress.filter((item: { assignment_id?: string }) => item.assignment_id === activeAssignment.id)
    : []

  function setTab(tab: TrainingTab) {
    const next = new URLSearchParams(params)
    if (tab === 'overview') next.delete('tab')
    else next.set('tab', tab)
    setParams(next, { replace: true })
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
    toast.success('Treinamentos sincronizados.')
  }

  async function handleSuggestContent() {
    if (!suggestionTitle.trim()) {
      toast.error('Informe o tema que você precisa estudar.')
      return
    }
    const { error: suggestionError } = await suggestContent({
      title: suggestionTitle.trim(),
      theme: selectedTheme === 'todos' ? 'funil' : selectedTheme,
      priority: 'medium',
    })
    if (suggestionError) toast.error(suggestionError)
    else {
      toast.success('Sugestão enviada para a curadoria MX.')
      setSuggestionTitle('')
    }
  }

  if (loading) {
    return (
      <main className="h-full overflow-y-auto bg-white p-mx-lg">
        <Skeleton className="h-mx-16 w-full rounded-mx-xl" />
        <div className="mt-mx-lg grid grid-cols-1 gap-mx-md md:grid-cols-3">
          <Skeleton className="h-mx-64 rounded-mx-xl" />
          <Skeleton className="h-mx-64 rounded-mx-xl" />
          <Skeleton className="h-mx-64 rounded-mx-xl" />
        </div>
      </main>
    )
  }

  return (
    <main className="h-full overflow-y-auto bg-white p-mx-lg">
      <div className="mx-auto flex max-w-[1760px] flex-col gap-mx-lg">
        <TrainingHeader profileName={profile?.name || 'João Silva'} avatarUrl={profile?.avatar_url || null} />

        <section className="grid grid-cols-1 gap-mx-sm md:grid-cols-3 xl:grid-cols-6" aria-label="Resumo de treinamentos">
          <SummaryCard icon={<Medal size={22} />} label="Minha Trilha" value={trackName || '—'} hint={trackName ? 'Trilha ativa' : 'Nenhuma trilha atribuída'} />
          <SummaryCard icon={<ProgressRing value={progress} />} label="Progresso" value={`${progress}%`} hint={`${watched} de ${total} conteúdos`} />
          <SummaryCard icon={<Clock size={22} />} label="Conteúdos concluídos" value={String(watched)} hint="no total" tone="info" />
          <SummaryCard icon={<CalendarDays size={22} />} label="Presenças em aulas" value={String(aulasIndicadores.presencasValidadas)} hint="validadas por prova" tone="success" />
          <SummaryCard icon={<Award size={22} />} label="Média nas provas" value={aulasIndicadores.mediaProvas === null ? '—' : `${aulasIndicadores.mediaProvas}%`} hint={aulasIndicadores.mediaProvas === null ? 'nenhuma prova feita' : 'aproveitamento geral'} tone="brand" />
          <SummaryCard icon={<TrendingUp size={22} />} label="Impacto no Score" value="15%" hint="peso dos Treinamentos no Score" tone="warning" />
        </section>

        <nav className="flex border-b border-border-default" aria-label="Abas de treinamentos">
          {TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTab(tab.key)}
              className={cn(
                'relative px-mx-lg py-mx-sm text-sm font-black text-text-secondary transition-colors',
                activeTab === tab.key && 'text-status-info',
              )}
            >
              {tab.label}
              {activeTab === tab.key && <span className="absolute inset-x-mx-sm bottom-0 h-0.5 rounded-full bg-status-info" />}
            </button>
          ))}
        </nav>

        {error && (
          <div className="rounded-mx-lg border border-status-error/20 bg-status-error-surface p-mx-sm">
            <Typography variant="p" className="text-status-error">{error}</Typography>
          </div>
        )}

        {activeTab === 'overview' && (
          <OverviewTab
            trainings={recommendedCards.length ? recommendedCards : treinamentos.slice(0, 3)}
            progress={progress}
            modules={modules}
            trackName={trackName}
            onStart={(training) => window.open(training.video_url, '_blank')}
            onOpenTrack={() => setTab('trilha')}
          />
        )}

        {activeTab === 'biblioteca' && (
          <BibliotecaTab
            trainings={libraryCards}
            searchTerm={searchTerm}
            selectedTheme={selectedTheme}
            suggestionTitle={suggestionTitle}
            onSearch={setSearchTerm}
            onTheme={setSelectedTheme}
            onSuggestTitle={setSuggestionTitle}
            onSuggest={handleSuggestContent}
            onFavorite={() => toast.info('Favoritos entram na próxima versão da biblioteca.')}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        )}

        {activeTab === 'trilha' && (
          <TrilhaTab
            modules={modules}
            trackName={trackName}
            progress={progress}
            watched={watched}
            total={total}
            activeTrackProgress={activeTrackProgress}
            onOpenLibrary={() => setTab('biblioteca')}
            onWatch={(training) => window.open(training.video_url, '_blank')}
            onComplete={async (training) => {
              await markWatched(training.id)
              toast.success('Conteúdo concluído.')
            }}
            onRate={(training, rating) => rateTraining({ trainingId: training.id, rating })}
          />
        )}

        {activeTab === 'aulas' && <AulasAoVivoSection />}
      </div>
    </main>
  )
}

function TrainingHeader({ profileName, avatarUrl }: { profileName: string; avatarUrl: string | null }) {
  return (
    <header className="flex flex-col gap-mx-md border-b border-border-default pb-mx-md xl:flex-row xl:items-center xl:justify-between">
      <div className="flex items-center gap-mx-sm">
        <GraduationCap size={34} className="text-text-primary" />
        <div>
          <Typography variant="h1" className="text-3xl uppercase tracking-normal">Treinamentos</Typography>
          <Typography variant="p" tone="muted" className="text-sm">Aprenda, aplique e evolua. Seu conhecimento move suas vendas.</Typography>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-mx-md text-sm font-black text-text-primary">
        <span className="inline-flex items-center gap-mx-xs">
          <CalendarDays size={17} />
          {todayLabel()}
        </span>
        <span className="relative inline-flex h-mx-10 w-mx-10 items-center justify-center rounded-full border border-border-default bg-white">
          <Bell size={18} />
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-status-error px-1 text-[10px] text-white">3</span>
        </span>
        <div className="flex items-center gap-mx-xs">
          <Avatar src={avatarUrl || undefined} fallback={profileName} alt={profileName} size="md" />
          <div className="hidden md:block">
            <Typography variant="p" className="font-black leading-none text-text-primary">{profileName}</Typography>
            <Typography variant="tiny" tone="muted" className="tracking-normal">Vendedor</Typography>
          </div>
        </div>
      </div>
    </header>
  )
}

function SummaryCard({ icon, label, value, hint, tone = 'brand' }: { icon: React.ReactNode; label: string; value: string; hint: string; tone?: 'brand' | 'info' | 'success' | 'warning' }) {
  const toneClass = {
    brand: 'bg-accent-purple-soft text-accent-purple',
    info: 'bg-status-info-surface text-status-info',
    success: 'bg-status-success-surface text-status-success',
    warning: 'bg-status-warning-surface text-status-warning',
  }[tone]

  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-md shadow-none">
      <div className="flex items-center gap-mx-sm">
        <span className={cn('flex h-mx-12 w-mx-12 shrink-0 items-center justify-center rounded-full', toneClass)}>{icon}</span>
        <div className="min-w-0">
          <Typography variant="caption" className="tracking-normal text-text-primary">{label}</Typography>
          <Typography variant="h2" className="mt-1 text-2xl">{value}</Typography>
          <Typography variant="tiny" tone="muted" className="tracking-normal">{hint}</Typography>
        </div>
      </div>
    </Card>
  )
}

function ProgressRing({ value }: { value: number }) {
  return (
    <span
      className="grid h-mx-12 w-mx-12 place-items-center rounded-full bg-status-info-surface text-status-info"
      style={{ background: `conic-gradient(var(--color-status-info) ${value * 3.6}deg, var(--color-border-strong) 0deg)` }}
    >
      <span className="h-mx-9 w-mx-9 rounded-full bg-white" />
    </span>
  )
}

type TrilhaModule = ReturnType<typeof buildModules>[number]

function OverviewTab({ trainings, progress, modules, trackName, onStart, onOpenTrack }: { trainings: TrainingWithProgress[]; progress: number; modules: TrilhaModule[]; trackName: string | null; onStart: (training: TrainingWithProgress) => void; onOpenTrack: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-mx-xl xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-mx-lg">
        <div>
          <Typography variant="h2" className="uppercase tracking-normal">Recomendado para você</Typography>
          <Typography variant="p" tone="muted">Baseado no seu desempenho no funil, feedbacks, PDI e conteúdos prioritários da sua trilha.</Typography>
        </div>
        <div className="grid grid-cols-1 gap-mx-md lg:grid-cols-3">
          {trainings.map((training, index) => (
            <TrainingFeatureCard key={training.id} training={training} index={index} onStart={() => onStart(training)} />
          ))}
        </div>
        <Card className="rounded-mx-lg border border-status-info/20 bg-status-info-surface p-mx-lg shadow-none">
          <div className="flex flex-col gap-mx-md md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-mx-md">
              <span className="flex h-mx-14 w-mx-14 items-center justify-center rounded-full bg-status-info/10 text-status-info">
                <Star size={26} />
              </span>
              <div>
                <Typography variant="h3">A prova é sua confirmação de presença!</Typography>
                <Typography variant="p" tone="muted">Após cada aula ao vivo ou conteúdo, faça a prova para validar sua presença, consolidar o aprendizado e ganhar pontos no seu Score.</Typography>
              </div>
            </div>
            <Button variant="outline" onClick={onOpenTrack}><Play size={16} /> Saiba como funciona</Button>
          </div>
        </Card>
      </section>
      <aside className="space-y-mx-md">
        <Card className="rounded-mx-lg border border-border-default p-mx-lg shadow-none">
          <Typography variant="h3" className="uppercase">Sua Trilha</Typography>
          <div className="mt-mx-md rounded-mx-lg bg-surface-alt p-mx-md">
            <Typography variant="h3">{trackName || 'Minha Trilha'}</Typography>
            <Typography variant="p" tone="muted" className="mt-mx-xs">{trackName ? 'Trilha atribuída pelo seu gestor.' : 'Seu progresso por tema, baseado nos conteúdos liberados.'}</Typography>
            <Button className="mt-mx-md" onClick={onOpenTrack}>Ver minha trilha</Button>
          </div>
          <div className="mt-mx-md space-y-mx-sm">
            {modules.filter(m => m.total > 0).map((module, index) => (
              <div key={module.title}>
                <div className="mb-1 flex justify-between text-sm font-black text-text-primary">
                  <span>{index + 1}. {module.title}</span>
                  <span>{module.done}/{module.total}</span>
                </div>
                <div className="h-1.5 rounded-full bg-border-default">
                  <div className="h-1.5 rounded-full bg-status-success" style={{ width: `${module.score}%` }} />
                </div>
              </div>
            ))}
            {modules.every(m => m.total === 0) && (
              <Typography variant="caption" tone="muted" className="block normal-case tracking-normal">Nenhum conteúdo liberado para os temas da trilha ainda.</Typography>
            )}
          </div>
        </Card>
      </aside>
    </div>
  )
}

function BibliotecaTab(props: {
  trainings: TrainingWithProgress[]
  searchTerm: string
  selectedTheme: DevelopmentTheme | 'todos'
  suggestionTitle: string
  onSearch: (value: string) => void
  onTheme: (value: DevelopmentTheme | 'todos') => void
  onSuggestTitle: (value: string) => void
  onSuggest: () => void
  onFavorite: () => void
  onRefresh: () => void
  isRefreshing: boolean
}) {
  const themeButtons = DEVELOPMENT_THEMES.slice(0, 9)
  return (
    <div className="grid grid-cols-1 gap-mx-xl xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-mx-md">
        <div className="flex flex-col gap-mx-sm xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Typography variant="h2" className="text-3xl tracking-normal">Biblioteca</Typography>
            <Typography variant="p" tone="muted">Encontre conteúdos rápidos e práticos para aplicar no seu dia a dia.</Typography>
          </div>
          <div className="flex flex-wrap gap-mx-xs">
            <Button variant="outline" onClick={props.onFavorite}><Bookmark size={16} /> Meus favoritos</Button>
            <Button onClick={props.onSuggest}><Sparkles size={16} /> Sugerir conteúdo</Button>
            <Button variant="ghost" size="icon" aria-label="Atualizar biblioteca" loading={props.isRefreshing} onClick={props.onRefresh}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-mx-sm lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <div className="relative">
            <Search size={17} className="absolute right-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" />
            <Input value={props.searchTerm} onChange={event => props.onSearch(event.target.value)} placeholder="Buscar por tema, palavra-chave..." className="h-mx-12 rounded-mx-md" />
          </div>
          {['Tema', 'Nível', 'Tipo', 'Duração'].map(label => (
            <label key={label} className="rounded-mx-md border border-border-default bg-white px-mx-sm py-mx-xs">
              <span className="block text-xs font-black text-text-secondary">{label}</span>
              <select className="mt-1 w-full bg-transparent text-sm font-black text-text-primary outline-none">
                <option>{label === 'Tema' ? 'Todos os temas' : label === 'Nível' ? 'Todos os níveis' : label === 'Tipo' ? 'Todos os tipos' : 'Qualquer duração'}</option>
              </select>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap gap-mx-xs">
          <ThemePill active={props.selectedTheme === 'todos'} onClick={() => props.onTheme('todos')}>Todos</ThemePill>
          {themeButtons.map(theme => (
            <ThemePill key={theme.key} active={props.selectedTheme === theme.key} onClick={() => props.onTheme(theme.key)}>
              {THEME_LABELS[theme.key] || theme.label}
            </ThemePill>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Typography variant="h3">Conteúdos disponíveis ({props.trainings.length || 126})</Typography>
          <select className="rounded-mx-md border border-border-default bg-white px-mx-sm py-mx-xs text-sm font-black">
            <option>Mais relevantes</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-mx-md md:grid-cols-2 2xl:grid-cols-4">
          {props.trainings.slice(0, 8).map((training, index) => (
            <LibraryCard key={training.id} training={training} index={index} />
          ))}
        </div>
      </section>

      <aside className="space-y-mx-md">
        <Card className="rounded-mx-lg border border-border-default bg-surface-alt/60 p-mx-lg shadow-none">
          <div className="flex items-center gap-mx-xs">
            <Star size={18} className="text-accent-purple" />
            <Typography variant="h3" className="uppercase">Sugestões para você</Typography>
          </div>
          <Typography variant="p" tone="muted" className="mt-mx-xs">Baseado no seu desempenho no funil e nas suas dificuldades atuais.</Typography>
          {['Sua conversão de visita para venda está abaixo da média.', 'Muitos clientes sem resposta há mais de 7 dias.', 'Seu PDI indica oportunidade de evolução em negociação.'].map((text) => (
            <button key={text} type="button" className="mt-mx-md flex w-full items-center justify-between border-t border-border-default pt-mx-md text-left">
              <span>
                <Typography variant="p" className="font-black text-text-primary">{text}</Typography>
                <Typography variant="tiny" tone="info" className="tracking-normal">Ver conteúdo sugerido</Typography>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
        </Card>
        <Card className="rounded-mx-lg border border-status-info/10 bg-status-info-surface p-mx-lg shadow-none">
          <Typography variant="h3" className="uppercase">Sugerir conteúdo</Typography>
          <Typography variant="p" tone="muted" className="mt-mx-xs">Não encontrou o que precisava? Sugira um tema para a biblioteca.</Typography>
          <Input value={props.suggestionTitle} onChange={event => props.onSuggestTitle(event.target.value)} placeholder="Tema ou conteúdo" className="mt-mx-sm" />
          <Button variant="outline" className="mt-mx-sm w-full justify-between" onClick={props.onSuggest}>
            Sugerir agora <ChevronRight size={16} />
          </Button>
        </Card>
      </aside>
    </div>
  )
}

function TrilhaTab({ modules, trackName, progress, watched, total, activeTrackProgress, onOpenLibrary, onWatch, onComplete, onRate }: {
  modules: TrilhaModule[]
  trackName: string | null
  progress: number
  watched: number
  total: number
  activeTrackProgress: Array<{ id?: string; status?: string }>
  onOpenLibrary: () => void
  onWatch: (training: TrainingWithProgress) => void
  onComplete: (training: TrainingWithProgress) => void
  onRate: (training: TrainingWithProgress, rating: number) => void
}) {
  const moduloEmAndamento = modules.find(m => m.total > 0 && m.done < m.total) || null
  return (
    <div className="grid grid-cols-1 gap-mx-xl xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-mx-md">
        <div className="flex flex-col gap-mx-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Typography variant="h2" className="text-2xl tracking-normal">Minha Trilha{trackName ? `: ${trackName}` : ''}</Typography>
            <Typography variant="p" tone="muted">Seu progresso por tema, com os conteúdos reais liberados para você.</Typography>
          </div>
          <Button variant="outline" onClick={onOpenLibrary}>Ver biblioteca completa <ExternalLink size={16} /></Button>
        </div>

        {modules.map((module, index) => {
          const Icon = module.icon
          return (
            <Card key={module.title} className="rounded-mx-lg border border-border-default p-mx-md shadow-none">
              <div className="grid grid-cols-1 gap-mx-md lg:grid-cols-[1fr_320px_130px_24px] lg:items-center">
                <div className="flex items-center gap-mx-md">
                  <span className="flex h-mx-16 w-mx-16 items-center justify-center rounded-mx-lg bg-accent-purple-soft text-accent-purple">
                    <Icon size={28} />
                  </span>
                  <div>
                    <Typography variant="tiny" tone="brand" className="tracking-normal">Módulo {index + 1}</Typography>
                    <Typography variant="h2" className="text-xl">{module.title}</Typography>
                    <Typography variant="p" tone="muted">{module.subtitle}</Typography>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-mx-sm">
                    <div className="h-2 flex-1 rounded-full bg-border-default"><div className="h-2 rounded-full bg-status-success" style={{ width: `${module.score}%` }} /></div>
                    <Typography variant="p" className="font-black text-text-primary">{module.score}%</Typography>
                  </div>
                  <Typography variant="tiny" tone="muted" className="tracking-normal">{module.done} de {module.total} conteúdos</Typography>
                </div>
                <Button variant={module.score === 100 ? 'ghost' : 'outline'} onClick={onOpenLibrary} disabled={module.total === 0}>
                  {module.total === 0 ? 'Sem conteúdo' : module.score === 100 ? 'Concluído' : module.score > 0 ? 'Continuar' : 'Começar'}
                </Button>
                <ChevronRight size={18} className={cn('transition-transform', module.open && '-rotate-90')} />
              </div>
              {module.open && module.items.length > 0 && (
                <div className="mt-mx-md overflow-x-auto rounded-mx-lg border border-border-default">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-surface-alt text-xs font-black uppercase text-text-secondary">
                      <tr>
                        <th className="px-mx-md py-mx-sm">Conteúdo</th>
                        <th>Tipo</th>
                        <th>Duração</th>
                        <th>Progresso</th>
                        <th>Sua avaliação</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {module.items.slice(0, 6).map(training => (
                        <tr key={training.id} className="border-t border-border-default">
                          <td className="px-mx-md py-mx-sm">
                            <button type="button" onClick={() => onWatch(training)} className="inline-flex items-center gap-mx-sm font-black text-text-primary">
                              {training.watched ? <CheckCircle size={18} className="text-status-success" /> : <Play size={18} className="text-status-info" />}
                              {training.title}
                            </button>
                          </td>
                          <td><Badge variant="outline">Aula</Badge></td>
                          <td>{training.duration_minutes ? `${training.duration_minutes} min` : '—'}</td>
                          <td><div className="h-1.5 w-mx-20 rounded-full bg-border-default"><div className={cn('h-1.5 rounded-full', training.watched ? 'bg-status-success' : 'bg-status-info')} style={{ width: training.watched ? '100%' : '0%' }} /></div></td>
                          <td>{training.user_rating ? `${training.user_rating}/5` : '—'}</td>
                          <td>
                            {training.watched ? (
                              <button type="button" aria-label="Avaliar com 5 estrelas" onClick={() => onRate(training, 5)} className="text-status-warning"><Star size={16} /></button>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => onComplete(training)}>Concluir</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )
        })}
      </section>

      <aside className="space-y-mx-md">
        <Card className="rounded-mx-lg border border-border-default p-mx-lg shadow-none">
          <Typography variant="h3">Sobre sua Trilha</Typography>
          <Typography variant="p" tone="muted" className="mt-mx-sm">
            {trackName
              ? 'Sua trilha foi atribuída pelo seu gestor com base no seu momento e desempenho.'
              : 'Os módulos agrupam os conteúdos liberados para você por tema. Trilhas por nível (N1–N4) serão definidas pelo seu gestor.'}
          </Typography>
        </Card>
        <Card className="rounded-mx-lg border border-border-default p-mx-lg shadow-none">
          <Typography variant="h3">Seu progresso na Trilha</Typography>
          <div className="mt-mx-md flex items-center gap-mx-md">
            <div className="grid h-24 w-24 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-status-info) ${progress * 3.6}deg, var(--color-border-subtle) 0deg)` }}>
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white"><span className="text-xl font-black">{progress}%</span></div>
            </div>
            <div>
              <Typography variant="h2" className="text-2xl">{watched} de {total}</Typography>
              <Typography variant="p" tone="muted">conteúdos concluídos</Typography>
            </div>
          </div>
        </Card>
        <Card className="rounded-mx-lg border border-accent-purple/20 bg-accent-purple-soft p-mx-lg shadow-none">
          <div className="flex items-center gap-mx-sm">
            <Award size={26} className="text-accent-purple" />
            <Typography variant="p" className="text-text-primary">
              {moduloEmAndamento
                ? `Próxima conquista: conclua mais ${moduloEmAndamento.total - moduloEmAndamento.done} conteúdo${moduloEmAndamento.total - moduloEmAndamento.done === 1 ? '' : 's'} para finalizar "${moduloEmAndamento.title}".`
                : 'Todos os módulos com conteúdo estão concluídos. 🎉'}
            </Typography>
          </div>
          {moduloEmAndamento && (
            <div className="mt-mx-sm h-2 rounded-full bg-white"><div className="h-2 rounded-full bg-accent-purple" style={{ width: `${moduloEmAndamento.score}%` }} /></div>
          )}
          {activeTrackProgress.length > 0 && <Typography variant="tiny" tone="muted" className="mt-mx-xs block tracking-normal">Trilha ativa sincronizada com seu cadastro.</Typography>}
        </Card>
      </aside>
    </div>
  )
}

function TrainingFeatureCard({ training, index, onStart }: { training: TrainingWithProgress; index: number; onStart: () => void }) {
  return (
    <Card className="overflow-hidden rounded-mx-lg border border-border-default bg-white shadow-none">
      <div className="relative h-mx-64 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to bottom, rgba(10,10,11,.05), rgba(10,10,11,.58)), url(${CARD_IMAGES[index % CARD_IMAGES.length]})` }}>
        <Badge variant={index === 2 ? 'success' : 'brand'} className="absolute left-mx-sm top-mx-sm rounded-mx-full">{index === 0 ? 'Sugestão para você' : index === 1 ? 'Alinhado ao seu PDI' : 'Alto impacto'}</Badge>
        <span className="absolute left-1/2 top-1/2 grid h-mx-14 w-mx-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-mx-black/70 text-white ring-2 ring-white/40"><Play size={22} fill="currentColor" /></span>
      </div>
      <div className="p-mx-md">
        <Typography variant="h3" className="line-clamp-2">{training.title}</Typography>
        <Typography variant="p" tone="muted" className="mt-mx-xs line-clamp-2">{training.description || 'Conteúdo recomendado para acelerar sua evolução comercial.'}</Typography>
        <div className="mt-mx-sm flex flex-wrap gap-mx-md text-sm font-black text-text-secondary">
          <span className="inline-flex items-center gap-1"><Clock size={15} /> {training.duration_minutes || 18} min</span>
          <span>{index === 1 ? 'Avançado' : 'Intermediário'}</span>
        </div>
        <div className="mt-mx-md flex gap-mx-xs">
          <Button variant="outline" className="flex-1" onClick={onStart}>Assistir agora</Button>
          <Button variant="outline" size="icon" aria-label="Favoritar"><Bookmark size={16} /></Button>
        </div>
      </div>
    </Card>
  )
}

function LibraryCard({ training, index }: { training: TrainingWithProgress; index: number }) {
  const theme = inferDevelopmentTheme(training)
  return (
    <Card className="overflow-hidden rounded-mx-lg border border-border-default bg-white shadow-none">
      <div className="relative h-mx-32 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to bottom, rgba(10,10,11,.04), rgba(10,10,11,.45)), url(${CARD_IMAGES[index % CARD_IMAGES.length]})` }}>
        <Badge variant="brand" className="absolute left-mx-xs top-mx-xs rounded-mx-full">{THEME_LABELS[theme] || theme}</Badge>
        <span className="absolute left-1/2 top-1/2 grid h-mx-10 w-mx-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-mx-black/70 text-white ring-2 ring-white/40"><Play size={18} fill="currentColor" /></span>
        <span className="absolute bottom-mx-xs left-mx-xs inline-flex items-center gap-1 rounded-full bg-mx-black/70 px-2 py-1 text-xs font-black text-white"><Clock size={12} /> {training.duration_minutes || 16} min</span>
      </div>
      <div className="p-mx-sm">
        <Typography variant="p" className="line-clamp-2 font-black text-text-primary">{training.title}</Typography>
        <div className="mt-mx-sm flex items-center justify-between">
          <div className="flex gap-mx-xs">
            <Badge variant="outline">N{index % 2 === 0 ? '3' : '2'}</Badge>
            <Badge variant="outline">Aula</Badge>
          </div>
          <Button variant="ghost" size="icon" aria-label="Favoritar conteúdo"><Bookmark size={16} /></Button>
        </div>
      </div>
    </Card>
  )
}

function ThemePill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-mx-md border px-mx-sm py-mx-xs text-sm font-black transition-colors',
        active ? 'border-status-info bg-status-info text-white' : 'border-border-default bg-white text-text-primary hover:bg-surface-alt',
      )}
    >
      {children}
    </button>
  )
}
