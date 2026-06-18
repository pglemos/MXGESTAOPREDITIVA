import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Award,
  Bell,
  BookOpen,
  Bookmark,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Eye,
  FileQuestion,
  GraduationCap,
  Heart,
  Info,
  Medal,
  MessageCircle,
  Play,
  Plus,
  Route,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Video,
  X,
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
  buildRecommendedDevelopmentCards,
  filterDevelopmentContent,
  inferDevelopmentTheme,
  type DevelopmentRecommendationLike,
  type DevelopmentTheme,
  type RecommendedDevelopmentCard,
} from '@/lib/development-content'
import { cn } from '@/lib/utils'
import { useAulasAoVivo } from '@/hooks/useAulasAoVivo'
import { useCadenciaAnalytics } from '@/features/crm/hooks/useCadenciaAnalytics'
import { useOportunidades } from '@/features/crm/hooks/useOportunidades'
import {
  MATURIDADE_VENDEDOR_LABEL,
  derivarNivelMaturidadeVendedor,
  trackTypeParaMaturidade,
  useVendedorPerfil,
  type NivelMaturidadeVendedor,
} from '@/features/crm/hooks/useVendedorPerfil'

type TrainingTab = 'overview' | 'biblioteca' | 'trilha' | 'aulas' | 'provas'

type DevelopmentTrackAssignment = {
  id: string
  status: string
  track?: {
    name?: string | null
    track_type?: string | null
  } | null
}

type TrackProgressRow = {
  id?: string
  assignment_id?: string
  status?: string
}

const TABS: Array<{ key: TrainingTab; label: string }> = [
  { key: 'overview', label: 'Visão Geral' },
  { key: 'biblioteca', label: 'Biblioteca' },
  { key: 'trilha', label: 'Trilha' },
  { key: 'aulas', label: 'Aulas ao Vivo' },
  { key: 'provas', label: 'Provas' },
]

const REQUIRED_CONTENT_TOTAL = 14
const TRACK_POINTS_AVAILABLE = 300
const SCORE_IMPACT_PERCENT = 15

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

const MODULE_THEMES: Array<{
  theme: DevelopmentTheme
  title: string
  subtitle: string
  requiredTotal: number
  icon: typeof Target
}> = [
  {
    theme: 'fechamento',
    title: 'Negociação e Fechamento',
    subtitle: 'Técnicas para conduzir negociações e aumentar sua taxa de fechamento.',
    requiredTotal: 2,
    icon: Target,
  },
  {
    theme: 'crm',
    title: 'Gestão de Clientes e Carteira',
    subtitle: 'Como gerir sua carteira, aumentar indicações e manter clientes ativos.',
    requiredTotal: 1,
    icon: Route,
  },
  {
    theme: 'rotina_diaria',
    title: 'Alta Performance e Produtividade',
    subtitle: 'Métodos e hábitos para produzir mais e ter consistência todos os dias.',
    requiredTotal: 1,
    icon: TrendingUp,
  },
  {
    theme: 'gestao',
    title: 'Liderança e Influência',
    subtitle: 'Desenvolva sua influência, postura e capacidade de liderar resultados.',
    requiredTotal: 0,
    icon: Star,
  },
]

const PENDING_EXAM = {
  title: 'Técnicas de Fechamento',
  questions: 5,
  minGrade: 70,
  points: 20,
}

const NEXT_LIVE_CLASS = {
  title: 'Técnicas de Fechamento',
  date: '25/06/2026 às 19:30',
  instructor: 'Daniel Santos',
}

function buildModules(trainings: TrainingWithProgress[]) {
  const modules = MODULE_THEMES.map((cfg) => {
    const items = filterDevelopmentContent(trainings, { theme: cfg.theme })
    const done = items.filter((training) => training.watched).length
    const total = Math.max(cfg.requiredTotal, items.length)

    return {
      ...cfg,
      items,
      done,
      total,
      score: total > 0 ? Math.round((done / total) * 100) : 0,
    }
  })

  const firstOpenIndex = modules.findIndex((module) => module.done < module.total)

  return modules.map((module, index) => ({
    ...module,
    open: index === (firstOpenIndex === -1 ? 0 : firstOpenIndex),
  }))
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
  if (value === 'biblioteca' || value === 'trilha' || value === 'aulas' || value === 'provas') return value
  return 'overview'
}

function getTrainingPoints(training: TrainingWithProgress | null, fallback = 30) {
  return (training as { xp_reward?: number | null } | null)?.xp_reward ?? fallback
}

function getTrainingStatus(training: TrainingWithProgress) {
  return training.watched ? 'Concluído' : 'Não iniciado'
}

function getTrainingLevel(index: number) {
  return index % 3 === 0 ? 'Intermediário' : index % 3 === 1 ? 'Avançado' : 'Iniciante'
}

function buildCalendarUrl() {
  const start = new Date('2026-06-25T19:30:00-03:00')
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const fmt = (date: Date) => date.toISOString().replace(/[-:]|\.\d{3}/g, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: NEXT_LIVE_CLASS.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Aula ao vivo MX Performance com ${NEXT_LIVE_CLASS.instructor}.`,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default function VendedorTreinamentos() {
  const { profile } = useAuth()
  const [params, setParams] = useSearchParams()
  const activeTab = activeTabFromSearch(params.get('tab'))
  const { treinamentos, loading, error, markWatched, rateTraining, suggestContent, refetch } = useTrainings()
  const { recommendations } = useDevelopmentRecommendations()
  const { oportunidades } = useOportunidades()
  const { analytics: cadenciaAnalytics } = useCadenciaAnalytics(oportunidades)
  const {
    assignments,
    progress: trackProgress,
    loading: tracksLoading,
    assignMaturityTrack,
    refetch: refetchTracks,
  } = useDevelopmentTracks()
  const { perfil } = useVendedorPerfil()
  const aulasAoVivo = useAulasAoVivo()
  const { indicadores: aulasIndicadores } = aulasAoVivo
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTheme, setSelectedTheme] = useState<DevelopmentTheme | 'todos'>('todos')
  const [suggestionTitle, setSuggestionTitle] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoAssignRequested, setAutoAssignRequested] = useState(false)

  const watched = useMemo(() => treinamentos.filter((training) => training.watched).length, [treinamentos])
  const requiredCompleted = Math.min(watched, REQUIRED_CONTENT_TOTAL)
  const requiredProgress = Math.round((requiredCompleted / REQUIRED_CONTENT_TOTAL) * 100)
  const filteredTrainings = useMemo(
    () => filterDevelopmentContent(treinamentos, { search: searchTerm, theme: selectedTheme }),
    [searchTerm, selectedTheme, treinamentos],
  )

  const recommendedCards = useMemo(() => {
    const recommendationInputs = recommendations.map((recommendation) => ({
      ...recommendation,
      training: recommendation.training_id
        ? treinamentos.find((training) => training.id === recommendation.training_id) || null
        : null,
    })) as DevelopmentRecommendationLike<TrainingWithProgress>[]

    return buildRecommendedDevelopmentCards({
      recommendations: recommendationInputs,
      funnelGap: cadenciaAnalytics.gargalos[0] || null,
      availableContent: treinamentos,
      limit: 3,
    })
  }, [cadenciaAnalytics.gargalos, recommendations, treinamentos])

  const trackAssignments = assignments as DevelopmentTrackAssignment[]
  const nivelMaturidade = derivarNivelMaturidadeVendedor(perfil)
  const maturityTrackType = trackTypeParaMaturidade(perfil)
  const activeMaturityAssignment = trackAssignments.find(
    (assignment) => assignment.status === 'active' && assignment.track?.track_type === maturityTrackType,
  )
  const anyActiveMaturityAssignment = trackAssignments.find(
    (assignment) => assignment.status === 'active' && assignment.track?.track_type?.startsWith('maturidade_'),
  )
  const activeAssignment = activeMaturityAssignment || trackAssignments.find((assignment) => assignment.status === 'active')
  const trackName = activeAssignment?.track?.name || null
  const maturityTrackName = activeMaturityAssignment?.track?.name || null
  const modules = useMemo(() => buildModules(treinamentos), [treinamentos])
  const activeTrackProgress = activeAssignment
    ? (trackProgress as TrackProgressRow[]).filter((item) => item.assignment_id === activeAssignment.id)
    : []
  const mandatoryTraining =
    modules.find((module) => module.theme === 'fechamento')?.items[0] ||
    filterDevelopmentContent(treinamentos, { theme: 'fechamento' })[0] ||
    treinamentos[0] ||
    null
  const scoreSnapshot = {
    earned: Math.min(requiredCompleted * 30 + aulasIndicadores.presencasValidadas * 20, TRACK_POINTS_AVAILABLE),
    available: TRACK_POINTS_AVAILABLE,
    pending: Math.max(TRACK_POINTS_AVAILABLE - (requiredCompleted * 30 + aulasIndicadores.presencasValidadas * 20), 0),
  }

  useEffect(() => {
    if (!profile?.id || tracksLoading || autoAssignRequested || anyActiveMaturityAssignment) return

    setAutoAssignRequested(true)
    void assignMaturityTrack({ sellerId: profile.id }).then((result: { error?: string | null }) => {
      if (result?.error) {
        toast.error(result.error)
        return
      }

      void refetchTracks()
    })
  }, [anyActiveMaturityAssignment, assignMaturityTrack, autoAssignRequested, profile?.id, refetchTracks, tracksLoading])

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

        <TrainingTabs activeTab={activeTab} onTab={setTab} />

        {activeTab !== 'biblioteca' && activeTab !== 'aulas' && activeTab !== 'provas' && (
          <section className="grid grid-cols-1 gap-mx-sm md:grid-cols-3 xl:grid-cols-6" aria-label="Resumo de treinamentos">
            <SummaryCard
              icon={<ShieldCheck size={22} />}
              label="Trilha obrigatória"
              value={maturityTrackName || MATURIDADE_VENDEDOR_LABEL[nivelMaturidade]}
              hint="Sugerida pelo Meu Perfil"
              tone="brand"
            />
            <SummaryCard
              icon={<ProgressRing value={requiredProgress} />}
              label="Progresso"
              value={`${requiredProgress}%`}
              hint={`${requiredCompleted} de ${REQUIRED_CONTENT_TOTAL} conteúdos`}
              tone="info"
            />
            <SummaryCard
              icon={<CheckCircle size={22} />}
              label="Conteúdos concluídos"
              value={String(requiredCompleted)}
              hint="no total"
              tone="info"
            />
            <SummaryCard
              icon={<CalendarDays size={22} />}
              label="Presenças em aulas"
              value={String(aulasIndicadores.presencasValidadas)}
              hint="validadas por prova"
              tone="success"
            />
            <SummaryCard
              icon={<Award size={22} />}
              label="Média nas provas"
              value={aulasIndicadores.mediaProvas === null ? '—' : `${aulasIndicadores.mediaProvas}%`}
              hint={aulasIndicadores.mediaProvas === null ? 'nenhuma prova feita' : 'aproveitamento geral'}
              tone="brand"
            />
            <SummaryCard
              icon={<TrendingUp size={22} />}
              label="Impacto no Score"
              value={`${SCORE_IMPACT_PERCENT}%`}
              hint="peso dos Treinamentos no Score"
              tone="warning"
            />
          </section>
        )}

        {error && (
          <div className="rounded-mx-lg border border-status-error/20 bg-status-error-surface p-mx-sm">
            <Typography variant="p" className="text-status-error">{error}</Typography>
          </div>
        )}

        {activeTab === 'overview' && (
          <OverviewTab
            recommendations={recommendedCards}
            modules={modules}
            trackName={trackName}
            nivelMaturidade={nivelMaturidade}
            maturityTrackName={maturityTrackName}
            requiredCompleted={requiredCompleted}
            requiredProgress={requiredProgress}
            mandatoryTraining={mandatoryTraining}
            scoreSnapshot={scoreSnapshot}
            onStart={(training) => window.open(training.video_url, '_blank')}
            onOpenTrack={() => setTab('trilha')}
            onOpenAulas={() => setTab('aulas')}
            onOpenExams={() => setTab('provas')}
          />
        )}

        {activeTab === 'biblioteca' && (
          <BibliotecaTab
            trainings={filteredTrainings.length ? filteredTrainings : treinamentos}
            recommendations={recommendedCards}
            modules={modules}
            trackName={trackName}
            nivelMaturidade={nivelMaturidade}
            maturityTrackName={maturityTrackName}
            requiredCompleted={requiredCompleted}
            requiredProgress={requiredProgress}
            scoreSnapshot={scoreSnapshot}
            searchTerm={searchTerm}
            selectedTheme={selectedTheme}
            suggestionTitle={suggestionTitle}
            onSearch={setSearchTerm}
            onTheme={setSelectedTheme}
            onSuggestTitle={setSuggestionTitle}
            onSuggest={handleSuggestContent}
            onFavorite={() => toast.info('Favoritos: em breve!')}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onOpenTrack={() => setTab('trilha')}
            onOpenExams={() => setTab('provas')}
          />
        )}

        {activeTab === 'trilha' && (
          <TrilhaTab
            modules={modules}
            trackName={trackName}
            nivelMaturidade={nivelMaturidade}
            maturityTrackName={maturityTrackName}
            requiredCompleted={requiredCompleted}
            requiredProgress={requiredProgress}
            scoreSnapshot={scoreSnapshot}
            presencasValidadas={aulasIndicadores.presencasValidadas}
            activeTrackProgress={activeTrackProgress}
            onOpenLibrary={() => setTab('biblioteca')}
            onOpenExams={() => setTab('provas')}
            onWatch={(training) => window.open(training.video_url, '_blank')}
            onComplete={async (training) => {
              await markWatched(training.id)
              toast.success('Conteúdo concluído.')
            }}
            onRate={(training, rating) => rateTraining({ trainingId: training.id, rating })}
          />
        )}

        {activeTab === 'aulas' && (
          <AulasTab
            aulasData={aulasAoVivo}
            onOpenLibrary={() => setTab('biblioteca')}
            onOpenTrack={() => setTab('trilha')}
            onOpenExams={() => setTab('provas')}
          />
        )}

        {activeTab === 'provas' && (
          <ProvasTab
            trainings={treinamentos}
            scoreSnapshot={scoreSnapshot}
            onOpenAulas={() => setTab('aulas')}
            onOpenTrack={() => setTab('trilha')}
          />
        )}
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
          <Typography variant="p" tone="muted" className="text-sm">
            Aprenda, aplique e evolua. Seu conhecimento move suas vendas.
          </Typography>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-mx-md text-sm font-semibold text-text-primary">
        <span className="inline-flex items-center gap-mx-xs rounded-mx-md border border-border-default bg-white px-mx-sm py-mx-xs">
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
            <Typography variant="p" className="font-semibold leading-none text-text-primary">{profileName}</Typography>
            <Typography variant="tiny" tone="muted" className="tracking-normal">Vendedor</Typography>
          </div>
        </div>
      </div>
    </header>
  )
}

function TrainingTabs({ activeTab, onTab }: { activeTab: TrainingTab; onTab: (tab: TrainingTab) => void }) {
  return (
    <nav className="flex overflow-x-auto border-b border-border-default" aria-label="Abas de treinamentos" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.key}
          onClick={() => onTab(tab.key)}
          className={cn(
            'relative whitespace-nowrap px-mx-lg py-mx-sm text-sm font-semibold text-text-secondary transition-colors',
            activeTab === tab.key && 'text-mx-green-700',
          )}
        >
          {tab.label}
          {activeTab === tab.key && <span className="absolute inset-x-mx-sm bottom-0 h-0.5 rounded-full bg-mx-green-700" />}
        </button>
      ))}
    </nav>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  hint,
  tone = 'brand',
}: {
  icon: ReactNode
  label: string
  value: string
  hint: string
  tone?: 'brand' | 'info' | 'success' | 'warning'
}) {
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
          <Typography variant="h2" className="mt-1 truncate text-2xl">{value}</Typography>
          <Typography variant="tiny" tone="muted" className="tracking-normal">{hint}</Typography>
        </div>
      </div>
    </Card>
  )
}

function ProgressRing({ value }: { value: number }) {
  return (
    <span
      className="grid h-mx-9 w-mx-9 place-items-center rounded-full"
      style={{ background: `conic-gradient(var(--color-status-info) ${value * 3.6}deg, var(--color-border-strong) 0deg)` }}
    >
      <span className="h-mx-6 w-mx-6 rounded-full bg-white" />
    </span>
  )
}

type TrilhaModule = ReturnType<typeof buildModules>[number]
type ScoreSnapshot = { earned: number; available: number; pending: number }

function OverviewTab({
  recommendations,
  modules,
  trackName,
  nivelMaturidade,
  maturityTrackName,
  requiredCompleted,
  requiredProgress,
  mandatoryTraining,
  scoreSnapshot,
  onStart,
  onOpenTrack,
  onOpenAulas,
  onOpenExams,
}: {
  recommendations: RecommendedDevelopmentCard<TrainingWithProgress>[]
  modules: TrilhaModule[]
  trackName: string | null
  nivelMaturidade: NivelMaturidadeVendedor
  maturityTrackName: string | null
  requiredCompleted: number
  requiredProgress: number
  mandatoryTraining: TrainingWithProgress | null
  scoreSnapshot: ScoreSnapshot
  onStart: (training: TrainingWithProgress) => void
  onOpenTrack: () => void
  onOpenAulas: () => void
  onOpenExams: () => void
}) {
  return (
    <div className="grid grid-cols-1 gap-mx-xl xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="space-y-mx-lg">
        <MandatoryActions
          mandatoryTraining={mandatoryTraining}
          onStart={onStart}
          onOpenAulas={onOpenAulas}
          onOpenExams={onOpenExams}
        />

        <RecommendedSection recommendations={recommendations} onStart={onStart} />

        <ProofBanner scoreSnapshot={scoreSnapshot} onOpenExams={onOpenExams} />
      </section>

      <RequiredTrackAside
        modules={modules}
        trackName={trackName}
        nivelMaturidade={nivelMaturidade}
        maturityTrackName={maturityTrackName}
        requiredCompleted={requiredCompleted}
        requiredProgress={requiredProgress}
        onOpenTrack={onOpenTrack}
      />
    </div>
  )
}

function MandatoryActions({
  mandatoryTraining,
  onStart,
  onOpenAulas,
  onOpenExams,
}: {
  mandatoryTraining: TrainingWithProgress | null
  onStart: (training: TrainingWithProgress) => void
  onOpenAulas: () => void
  onOpenExams: () => void
}) {
  return (
    <section className="space-y-mx-md" aria-label="Próximas ações obrigatórias">
      <div>
        <Typography variant="h2" className="text-2xl tracking-normal">Ações obrigatórias</Typography>
        <Typography variant="p" tone="muted">
          Complete a próxima aula, responda a prova pendente e valide presença na aula ao vivo.
        </Typography>
      </div>

      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-3">
        <MandatoryTrainingCard training={mandatoryTraining} onStart={onStart} />
        <PendingExamCard onOpenExams={onOpenExams} />
        <NextLiveClassCard onOpenAulas={onOpenAulas} />
      </div>
    </section>
  )
}

function MandatoryTrainingCard({
  training,
  onStart,
}: {
  training: TrainingWithProgress | null
  onStart: (training: TrainingWithProgress) => void
}) {
  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-md shadow-none">
      <div className="mb-mx-sm flex items-center gap-mx-xs text-mx-green-700">
        <BookOpen size={18} />
        <Typography variant="caption" className="tracking-normal text-mx-green-700">Próxima aula obrigatória</Typography>
      </div>
      <div className="grid gap-mx-md sm:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-1 2xl:grid-cols-[180px_minmax(0,1fr)]">
        <div
          className="relative h-36 rounded-mx-md bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(to bottom, rgba(10,10,11,.04), rgba(10,10,11,.55)), url(${CARD_IMAGES[0]})` }}
        >
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-mx-14 w-mx-14 place-items-center rounded-full bg-mx-black/70 text-white ring-2 ring-white/40">
              <Play size={22} fill="currentColor" />
            </span>
          </span>
        </div>
        <div className="min-w-0">
          <Typography variant="h3" className="line-clamp-2">
            {training?.title || 'Negociação e Fechamento'}
          </Typography>
          <Typography variant="p" tone="muted" className="mt-mx-xs">Módulo 1 de 2</Typography>
          <div className="mt-mx-sm space-y-1 text-sm font-semibold text-text-secondary">
            <span className="flex items-center gap-1"><Clock size={15} /> Duração: {training?.duration_minutes || 18} min</span>
            <span className="flex items-center gap-1"><Star size={15} /> Pontuação: +{getTrainingPoints(training)} pts</span>
          </div>
          <Button
            className="mt-mx-md w-full"
            onClick={() => (training ? onStart(training) : toast.info('A próxima aula obrigatória será liberada pela trilha.'))}
          >
            Continuar agora
          </Button>
        </div>
      </div>
    </Card>
  )
}

function PendingExamCard({ onOpenExams }: { onOpenExams: () => void }) {
  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-md shadow-none">
      <div className="mb-mx-sm flex items-center gap-mx-xs text-status-warning">
        <FileQuestion size={18} />
        <Typography variant="caption" className="tracking-normal text-status-warning">Prova pendente</Typography>
      </div>
      <div className="grid gap-mx-md sm:grid-cols-[150px_minmax(0,1fr)] xl:grid-cols-1 2xl:grid-cols-[150px_minmax(0,1fr)]">
        <div
          className="h-36 rounded-mx-md bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,.04), rgba(10,10,11,.2)), url(${CARD_IMAGES[3]})` }}
        />
        <div>
          <Typography variant="h3">{PENDING_EXAM.title}</Typography>
          <div className="mt-mx-sm space-y-1 text-sm font-semibold text-text-secondary">
            <span className="block">{PENDING_EXAM.questions} questões</span>
            <span className="block">Nota mínima: {PENDING_EXAM.minGrade}%</span>
            <span className="block">Pontuação: +{PENDING_EXAM.points} pts</span>
          </div>
          <Button variant="outline" className="mt-mx-md w-full" onClick={onOpenExams}>
            Responder prova
          </Button>
        </div>
      </div>
    </Card>
  )
}

function NextLiveClassCard({ onOpenAulas }: { onOpenAulas: () => void }) {
  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-md shadow-none">
      <div className="mb-mx-sm flex items-center gap-mx-xs text-mx-green-700">
        <Video size={18} />
        <Typography variant="caption" className="tracking-normal text-mx-green-700">Próxima aula ao vivo</Typography>
      </div>
      <div className="grid gap-mx-md sm:grid-cols-[150px_minmax(0,1fr)] xl:grid-cols-1 2xl:grid-cols-[150px_minmax(0,1fr)]">
        <div
          className="relative h-36 rounded-mx-md bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(to bottom, rgba(10,10,11,.05), rgba(10,10,11,.55)), url(${CARD_IMAGES[5]})` }}
        >
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-mx-12 w-mx-12 place-items-center rounded-full bg-mx-black/70 text-white ring-2 ring-white/40">
              <Play size={20} fill="currentColor" />
            </span>
          </span>
        </div>
        <div>
          <Typography variant="h3">{NEXT_LIVE_CLASS.title}</Typography>
          <div className="mt-mx-sm space-y-1 text-sm font-semibold text-text-secondary">
            <span className="flex items-center gap-1"><CalendarDays size={15} /> {NEXT_LIVE_CLASS.date}</span>
            <span className="block">Instrutor: {NEXT_LIVE_CLASS.instructor}</span>
          </div>
          <div className="mt-mx-md grid gap-mx-xs">
            <Button onClick={onOpenAulas}>Confirmar presença</Button>
            <Button variant="outline" onClick={() => window.open(buildCalendarUrl(), '_blank')}>
              <CalendarDays size={16} /> Adicionar à agenda
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function RecommendedSection({
  recommendations,
  onStart,
}: {
  recommendations: RecommendedDevelopmentCard<TrainingWithProgress>[]
  onStart: (training: TrainingWithProgress) => void
}) {
  return (
    <section className="space-y-mx-md" aria-label="Recomendado para você">
      <div>
        <Typography variant="h2" className="text-2xl uppercase tracking-normal">Recomendado para você</Typography>
        <Typography variant="p" tone="muted">
          Baseado no seu desempenho no funil, feedbacks, PDI e conteúdos prioritários da sua trilha.
        </Typography>
      </div>

      <div className="grid grid-cols-1 gap-mx-md md:grid-cols-2 2xl:grid-cols-3">
        {recommendations.map((recommendation, index) => (
          <TrainingFeatureCard
            key={recommendation.id}
            recommendation={recommendation}
            index={index}
            onStart={() => onStart(recommendation.training)}
          />
        ))}

        {recommendations.length === 0 && (
          <Card className="rounded-mx-lg border border-dashed border-border-default bg-white p-mx-lg shadow-none md:col-span-2 2xl:col-span-3">
            <Typography variant="h3">Sem recomendações no momento</Typography>
            <Typography variant="p" tone="muted" className="mt-mx-xs">
              Quando houver sinal de Feedback, PDI, Funil ou Curadoria, o motivo aparecerá aqui antes da biblioteca livre.
            </Typography>
          </Card>
        )}
      </div>
    </section>
  )
}

function RequiredTrackAside({
  modules,
  trackName,
  nivelMaturidade,
  maturityTrackName,
  requiredCompleted,
  requiredProgress,
  onOpenTrack,
}: {
  modules: TrilhaModule[]
  trackName: string | null
  nivelMaturidade: NivelMaturidadeVendedor
  maturityTrackName: string | null
  requiredCompleted: number
  requiredProgress: number
  onOpenTrack: () => void
}) {
  const requiredTrackLabel = maturityTrackName || MATURIDADE_VENDEDOR_LABEL[nivelMaturidade]

  return (
    <aside className="space-y-mx-md xl:sticky xl:top-mx-lg xl:self-start" aria-label="Trilha obrigatória">
      <Card className="rounded-mx-lg border border-mx-green-700/15 bg-mx-green-50/40 p-mx-lg shadow-none">
        <div className="flex items-center gap-mx-xs text-mx-green-700">
          <ShieldCheck size={22} />
          <Typography variant="h3" className="uppercase text-mx-green-700">Trilha obrigatória</Typography>
        </div>

        <Typography variant="h2" className="mt-mx-lg text-2xl">{requiredTrackLabel}</Typography>
        <div className="mt-mx-sm space-y-1">
          <Typography variant="p" className="text-text-primary">Ciclo: Jun/2026 a Dez/2026</Typography>
          <Typography variant="p" className="text-text-primary">Prazo final: 31/12/2026</Typography>
        </div>

        {trackName && trackName !== maturityTrackName && (
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block tracking-normal">Outra trilha ativa: {trackName}</Typography>
        )}

        <div className="mt-mx-lg">
          <div className="mb-mx-xs flex justify-between text-sm font-semibold text-text-primary">
            <span>Progresso: {requiredCompleted} de {REQUIRED_CONTENT_TOTAL} conteúdos</span>
            <span>{requiredProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-border-default">
            <div className="h-2 rounded-full bg-mx-green-700" style={{ width: `${requiredProgress}%` }} />
          </div>
        </div>

        <div className="mt-mx-lg flex justify-between border-b border-border-default pb-mx-sm">
          <Typography variant="p" className="font-semibold text-text-primary">Pontos disponíveis</Typography>
          <Typography variant="p" className="font-semibold text-mx-green-700">{TRACK_POINTS_AVAILABLE} pts</Typography>
        </div>

        <div className="mt-mx-sm divide-y divide-border-default">
          {modules.map((module, index) => (
            <div key={module.title} className="flex items-center justify-between gap-mx-sm py-mx-sm text-sm font-semibold text-text-primary">
              <span className="flex min-w-0 items-center gap-mx-xs">
                <span className="grid h-mx-8 w-mx-8 shrink-0 place-items-center rounded-full bg-mx-green-700/10 text-mx-green-700">{index + 1}</span>
                <span className="truncate">{module.title}</span>
              </span>
              <span className="shrink-0">{module.done}/{module.total}</span>
            </div>
          ))}
        </div>

        <Button className="mt-mx-lg w-full" onClick={onOpenTrack}>Ver minha trilha</Button>
      </Card>
    </aside>
  )
}

function ProofBanner({ scoreSnapshot, onOpenExams }: { scoreSnapshot: ScoreSnapshot; onOpenExams: () => void }) {
  return (
    <Card className="rounded-mx-lg border border-status-info/20 bg-status-info-surface p-mx-lg shadow-none">
      <div className="flex flex-col gap-mx-md xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-mx-md">
          <span className="flex h-mx-14 w-mx-14 shrink-0 items-center justify-center rounded-full bg-status-info/10 text-status-info">
            <Star size={26} />
          </span>
          <div>
            <Typography variant="h3">A prova é sua confirmação de presença!</Typography>
            <Typography variant="p" tone="muted">
              Após cada aula ao vivo ou conteúdo obrigatório, responda uma prova para validar presença, consolidar aprendizado e ganhar pontos no Score.
            </Typography>
            <div className="mt-mx-sm flex flex-wrap gap-mx-xs">
              <Badge variant="outline">{PENDING_EXAM.questions} questões</Badge>
              <Badge variant="outline">nota mínima {PENDING_EXAM.minGrade}%</Badge>
              <Badge variant="outline">pontua no Score MX</Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-mx-sm sm:grid-cols-[1fr_auto] xl:min-w-[420px]">
          <div className="grid grid-cols-3 gap-mx-xs rounded-mx-md border border-border-default bg-white p-mx-sm text-center">
            <MiniScore value={`${scoreSnapshot.earned} pts`} label="ganhos" />
            <MiniScore value={`${scoreSnapshot.available} pts`} label="disponíveis" />
            <MiniScore value={`${scoreSnapshot.pending} pts`} label="pendentes" />
          </div>
          <Button variant="outline" onClick={onOpenExams}><Play size={16} /> Saiba como funciona</Button>
        </div>
      </div>
    </Card>
  )
}

function MiniScore({ value, label }: { value: string; label: string }) {
  return (
    <span>
      <Typography variant="p" className="font-semibold text-text-primary">{value}</Typography>
      <Typography variant="tiny" tone="muted" className="tracking-normal">{label}</Typography>
    </span>
  )
}

function BibliotecaTab(props: {
  trainings: TrainingWithProgress[]
  recommendations: RecommendedDevelopmentCard<TrainingWithProgress>[]
  modules: TrilhaModule[]
  trackName: string | null
  nivelMaturidade: NivelMaturidadeVendedor
  maturityTrackName: string | null
  requiredCompleted: number
  requiredProgress: number
  scoreSnapshot: ScoreSnapshot
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
  onOpenTrack: () => void
  onOpenExams: () => void
}) {
  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false)
  const libraryMetrics = buildLibraryMetrics(props.trainings)

  return (
    <>
      <div className="grid grid-cols-1 gap-mx-xl xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-mx-md">
          <LibraryFreeBanner />

          <section className="grid grid-cols-1 gap-mx-sm sm:grid-cols-2 xl:grid-cols-6" aria-label="Indicadores da Biblioteca">
            <LibraryMetricCard icon={<BookOpen size={20} />} label="Conteúdos disponíveis" value={String(libraryMetrics.available)} hint="na biblioteca" tone="brand" />
            <LibraryMetricCard icon={<CheckCircle size={20} />} label="Assistidos" value={String(libraryMetrics.watched)} hint={`${libraryMetrics.watchedPercent}% do total`} tone="info" />
            <LibraryMetricCard icon={<Clock size={20} />} label="Em andamento" value={String(libraryMetrics.inProgress)} hint="continue de onde parou" tone="info" />
            <LibraryMetricCard icon={<Heart size={20} />} label="Favoritos" value={String(libraryMetrics.favorites)} hint="salvos por você" tone="danger" />
            <LibraryMetricCard icon={<Eye size={20} />} label="Vistos recentemente" value={String(libraryMetrics.recent)} hint="últimos 7 dias" tone="success" />
            <LibraryMetricCard icon={<TrendingUp size={20} />} label="Impacto no Score" value={`+${SCORE_IMPACT_PERCENT}%`} hint="com biblioteca" tone="warning" />
          </section>

          <div className="flex flex-col gap-mx-sm xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Typography variant="h2" className="text-3xl tracking-normal">Biblioteca</Typography>
              <Typography variant="p" tone="muted">Encontre conteúdos rápidos e práticos para aplicar no seu dia a dia.</Typography>
            </div>
            <div className="flex flex-wrap gap-mx-xs">
              <Button variant="outline" onClick={props.onFavorite}><Bookmark size={16} /> Meus favoritos</Button>
              <Button onClick={() => setSuggestionModalOpen(true)}><Plus size={16} /> Sugerir conteúdo</Button>
              <Button variant="ghost" size="icon" aria-label="Atualizar biblioteca" loading={props.isRefreshing} onClick={props.onRefresh}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-mx-sm lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
            <div className="relative">
              <Search size={17} className="absolute right-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" />
              <Input value={props.searchTerm} onChange={(event) => props.onSearch(event.target.value)} placeholder="Buscar por tema, palavra-chave..." className="h-mx-12 rounded-mx-md" />
            </div>
            {['Tema', 'Nível', 'Tipo', 'Duração'].map((label) => (
              <label key={label} className="rounded-mx-md border border-border-default bg-white px-mx-sm py-mx-xs">
                <span className="block text-xs font-semibold text-text-secondary">{label}</span>
                <select className="mt-1 w-full bg-transparent text-sm font-semibold text-text-primary outline-none">
                  <option>{label === 'Tema' ? 'Todos os temas' : label === 'Nível' ? 'Todos os níveis' : label === 'Tipo' ? 'Todos os tipos' : 'Qualquer duração'}</option>
                </select>
              </label>
            ))}
          </div>

          <LibraryCategoryChips selectedTheme={props.selectedTheme} onTheme={props.onTheme} />

          <div className="flex items-center justify-between">
            <Typography variant="h3">Conteúdos disponíveis ({props.trainings.length})</Typography>
            <select className="rounded-mx-md border border-border-default bg-white px-mx-sm py-mx-xs text-sm font-semibold">
              <option>Mais relevantes</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-mx-md md:grid-cols-2 2xl:grid-cols-4">
            {props.trainings.slice(0, 8).map((training, index) => (
              <LibraryCard key={training.id} training={training} index={index} />
            ))}
          </div>

          <LibraryProofBanner scoreSnapshot={props.scoreSnapshot} onOpenExams={props.onOpenExams} />
          <ApplyTodayBlock />
        </section>

        <LibrarySidebar
          modules={props.modules}
          recommendations={props.recommendations}
          trackName={props.trackName}
          nivelMaturidade={props.nivelMaturidade}
          maturityTrackName={props.maturityTrackName}
          requiredCompleted={props.requiredCompleted}
          requiredProgress={props.requiredProgress}
          suggestionTitle={props.suggestionTitle}
          onSuggestTitle={props.onSuggestTitle}
          onOpenTrack={props.onOpenTrack}
          onOpenSuggestion={() => setSuggestionModalOpen(true)}
        />
      </div>

      {suggestionModalOpen && (
        <SuggestionContentModal
          suggestionTitle={props.suggestionTitle}
          onSuggestTitle={props.onSuggestTitle}
          onClose={() => setSuggestionModalOpen(false)}
          onSubmit={async () => {
            await props.onSuggest()
            if (props.suggestionTitle.trim()) setSuggestionModalOpen(false)
          }}
        />
      )}
    </>
  )
}

function buildLibraryMetrics(trainings: TrainingWithProgress[]) {
  const available = trainings.length || 126
  const watched = trainings.filter((training) => training.watched).length || 48

  return {
    available,
    watched,
    watchedPercent: Math.min(Math.round((watched / available) * 100), 100),
    inProgress: Math.min(Math.max(available - watched, 0), 8),
    favorites: 12,
    recent: Math.min(6, available),
  }
}

function LibraryFreeBanner() {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div className="flex items-center justify-between rounded-mx-md border border-mx-green-700/20 bg-mx-green-50 px-mx-md py-mx-sm text-mx-green-900">
      <div className="flex items-center gap-mx-sm">
        <Info size={18} className="text-mx-green-700" />
        <Typography variant="p" className="text-mx-green-900">
          <strong>Biblioteca livre</strong> — conteúdos rápidos para consulta e reforço. O que é obrigatório fica na aba Trilha.
        </Typography>
      </div>
      <button type="button" aria-label="Fechar aviso da biblioteca" className="rounded-mx-sm p-1 text-mx-green-700 hover:bg-white" onClick={() => setVisible(false)}>
        <X size={16} />
      </button>
    </div>
  )
}

function LibraryMetricCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: ReactNode
  label: string
  value: string
  hint: string
  tone: 'brand' | 'info' | 'success' | 'warning' | 'danger'
}) {
  const toneClass = {
    brand: 'bg-mx-green-700/10 text-mx-green-700',
    info: 'bg-status-info-surface text-status-info',
    success: 'bg-status-success-surface text-status-success',
    warning: 'bg-status-warning-surface text-status-warning',
    danger: 'bg-status-error-surface text-status-error',
  }[tone]

  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-md shadow-none">
      <div className="flex items-center gap-mx-sm">
        <span className={cn('grid h-mx-10 w-mx-10 shrink-0 place-items-center rounded-full', toneClass)}>{icon}</span>
        <div className="min-w-0">
          <Typography variant="caption" className="tracking-normal text-text-primary">{label}</Typography>
          <Typography variant="h2" className="mt-1 text-2xl">{value}</Typography>
          <Typography variant="tiny" tone="muted" className="tracking-normal">{hint}</Typography>
        </div>
      </div>
    </Card>
  )
}

const LIBRARY_CATEGORIES: Array<{ label: string; theme: DevelopmentTheme | 'todos' }> = [
  { label: 'Todos', theme: 'todos' },
  { label: 'Prospecção', theme: 'prospeccao' },
  { label: 'WhatsApp', theme: 'agendamento' },
  { label: 'Atendimento', theme: 'atendimento' },
  { label: 'Apresentação do carro', theme: 'apresentacao' },
  { label: 'Financiamento', theme: 'financiamento' },
  { label: 'Troca / Avaliação', theme: 'carro_de_troca' },
  { label: 'Fechamento', theme: 'fechamento' },
  { label: 'Negociação', theme: 'funil' },
  { label: 'Rotina', theme: 'rotina_diaria' },
]

function LibraryCategoryChips({
  selectedTheme,
  onTheme,
}: {
  selectedTheme: DevelopmentTheme | 'todos'
  onTheme: (value: DevelopmentTheme | 'todos') => void
}) {
  return (
    <div className="flex flex-wrap gap-mx-xs" aria-label="Categorias da Biblioteca">
      {LIBRARY_CATEGORIES.map((category) => (
        <ThemePill key={`${category.theme}-${category.label}`} active={selectedTheme === category.theme} onClick={() => onTheme(category.theme)}>
          {category.label}
        </ThemePill>
      ))}
    </div>
  )
}

function LibraryProofBanner({ scoreSnapshot, onOpenExams }: { scoreSnapshot: ScoreSnapshot; onOpenExams: () => void }) {
  return (
    <Card className="rounded-mx-lg border border-status-info/20 bg-status-info-surface p-mx-lg shadow-none">
      <div className="flex flex-col gap-mx-md lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-mx-md">
          <span className="grid h-mx-14 w-mx-14 shrink-0 place-items-center rounded-full bg-status-info/10 text-status-info">
            <Medal size={26} />
          </span>
          <div>
            <Typography variant="h3">A prova é sua confirmação de presença!</Typography>
            <Typography variant="p" tone="muted">
              Conclua a prova ao final do conteúdo obrigatório e valide seu aprendizado. Ela pode pontuar no seu Score MX.
            </Typography>
          </div>
        </div>
        <div className="flex flex-wrap gap-mx-xs">
          <Badge variant="outline">{PENDING_EXAM.questions} questões</Badge>
          <Badge variant="outline">nota mínima {PENDING_EXAM.minGrade}%</Badge>
          <Badge variant="outline">pontua no Score MX</Badge>
          <Badge variant="outline">{scoreSnapshot.pending} pts pendentes</Badge>
          <Button variant="info" size="sm" onClick={onOpenExams}>Saiba como funciona <ChevronRight size={16} /></Button>
        </div>
      </div>
    </Card>
  )
}

function ApplyTodayBlock() {
  const items = [
    { icon: <MessageCircle size={20} />, title: 'Script para cliente sem resposta', text: 'Mensagem pronta para reativar', action: 'Ver script' },
    { icon: <ClipboardCheck size={20} />, title: 'Checklist para confirmar visita', text: 'Garanta presença e prepare-se', action: 'Ver checklist' },
    { icon: <MessageCircle size={20} />, title: 'Modelo de WhatsApp para reativação', text: 'Reative clientes de forma rápida', action: 'Ver modelo' },
  ]

  return (
    <Card className="rounded-mx-lg border border-mx-green-700/15 bg-mx-green-50/40 p-mx-lg shadow-none">
      <div className="grid grid-cols-1 gap-mx-md lg:grid-cols-[220px_repeat(3,1fr)]">
        <div>
          <Typography variant="h3" className="text-mx-green-900">Para aplicar hoje</Typography>
          <Typography variant="p" tone="muted">Materiais práticos para usar agora no seu dia a dia.</Typography>
        </div>
        {items.map((item) => (
          <button
            key={item.title}
            type="button"
            className="flex items-center gap-mx-sm border-t border-mx-green-700/10 pt-mx-sm text-left lg:border-l lg:border-t-0 lg:pl-mx-md lg:pt-0"
            onClick={() => toast.info(`${item.action}: ${item.title}`)}
          >
            <span className="grid h-mx-10 w-mx-10 shrink-0 place-items-center rounded-full bg-white text-mx-green-700">{item.icon}</span>
            <span>
              <Typography variant="p" className="font-semibold text-text-primary">{item.title}</Typography>
              <Typography variant="tiny" tone="muted" className="block tracking-normal">{item.text}</Typography>
              <Typography variant="tiny" tone="brand" className="tracking-normal">{item.action} <ChevronRight size={12} className="inline" /></Typography>
            </span>
          </button>
        ))}
      </div>
    </Card>
  )
}

function LibrarySidebar({
  modules,
  recommendations,
  trackName,
  nivelMaturidade,
  maturityTrackName,
  requiredCompleted,
  requiredProgress,
  suggestionTitle,
  onSuggestTitle,
  onOpenTrack,
  onOpenSuggestion,
}: {
  modules: TrilhaModule[]
  recommendations: RecommendedDevelopmentCard<TrainingWithProgress>[]
  trackName: string | null
  nivelMaturidade: NivelMaturidadeVendedor
  maturityTrackName: string | null
  requiredCompleted: number
  requiredProgress: number
  suggestionTitle: string
  onSuggestTitle: (value: string) => void
  onOpenTrack: () => void
  onOpenSuggestion: () => void
}) {
  return (
    <aside className="space-y-mx-md xl:sticky xl:top-mx-lg xl:self-start">
      <LibraryTrackCard
        modules={modules}
        trackName={trackName}
        nivelMaturidade={nivelMaturidade}
        maturityTrackName={maturityTrackName}
        requiredCompleted={requiredCompleted}
        requiredProgress={requiredProgress}
        onOpenTrack={onOpenTrack}
      />
      <LibrarySuggestionsCard recommendations={recommendations} />
      <LibrarySuggestCard suggestionTitle={suggestionTitle} onSuggestTitle={onSuggestTitle} onOpenSuggestion={onOpenSuggestion} />
      <RecentlyViewedCard />
    </aside>
  )
}

function LibraryTrackCard({
  modules,
  trackName,
  nivelMaturidade,
  maturityTrackName,
  requiredCompleted,
  requiredProgress,
  onOpenTrack,
}: {
  modules: TrilhaModule[]
  trackName: string | null
  nivelMaturidade: NivelMaturidadeVendedor
  maturityTrackName: string | null
  requiredCompleted: number
  requiredProgress: number
  onOpenTrack: () => void
}) {
  const requiredTrackLabel = maturityTrackName || (trackName && trackName.includes('N') ? trackName : 'N1 — Iniciante')
  const visibleModules = modules.slice(0, 3)

  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
      <div className="flex items-start gap-mx-sm">
        <span className="grid h-mx-10 w-mx-10 shrink-0 place-items-center rounded-full bg-accent-purple-soft text-accent-purple">
          <ShieldCheck size={20} />
        </span>
        <div>
          <Typography variant="h3">Trilha obrigatória</Typography>
          <Typography variant="h2" className="mt-mx-xs text-xl">{requiredTrackLabel}</Typography>
          <Typography variant="tiny" tone="muted" className="tracking-normal">
            {maturityTrackName ? 'Atribuída pelo seu nível comercial' : `Sugerida pelo Meu Perfil · ${MATURIDADE_VENDEDOR_LABEL[nivelMaturidade]}`}
          </Typography>
        </div>
      </div>

      <div className="mt-mx-md">
        <div className="mb-1 h-2 rounded-full bg-border-default">
          <div className="h-2 rounded-full bg-mx-green-700" style={{ width: `${requiredProgress}%` }} />
        </div>
        <div className="flex justify-between text-xs font-semibold text-text-secondary">
          <span>{requiredProgress}% concluído</span>
          <span>{requiredCompleted} de {REQUIRED_CONTENT_TOTAL} conteúdos</span>
        </div>
      </div>

      <div className="mt-mx-md space-y-mx-xs">
        {visibleModules.map((module) => (
          <div key={module.title} className="flex justify-between gap-mx-xs text-xs font-semibold text-text-secondary">
            <span className="truncate">{module.title}</span>
            <span>{module.done}/{module.total}</span>
          </div>
        ))}
      </div>

      <Button variant="outline" className="mt-mx-md w-full justify-between" onClick={onOpenTrack}>
        Ver minha trilha <ChevronRight size={16} />
      </Button>
    </Card>
  )
}

function LibrarySuggestionsCard({ recommendations }: { recommendations: RecommendedDevelopmentCard<TrainingWithProgress>[] }) {
  const fallbackSuggestions = [
    { origin: 'Funil de Vendas', text: 'Sua conversão de visita para venda está abaixo da média.' },
    { origin: 'Carteira de Clientes', text: 'Muitos clientes sem resposta há mais de 7 dias.' },
    { origin: 'PDI', text: 'Seu PDI indica oportunidade em negociação.' },
  ]
  const suggestions = recommendations.length
    ? recommendations.slice(0, 3).map((item) => ({ origin: item.sourceLabel, text: item.reason }))
    : fallbackSuggestions

  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
      <div className="flex items-center gap-mx-xs">
        <Star size={18} className="text-accent-purple" />
        <Typography variant="h3" className="uppercase">Sugestões para você</Typography>
      </div>

      <div className="mt-mx-sm divide-y divide-border-default">
        {suggestions.map((suggestion) => (
          <button
            key={`${suggestion.origin}-${suggestion.text}`}
            type="button"
            className="flex w-full items-center justify-between gap-mx-sm py-mx-sm text-left"
            onClick={() => toast.info(`Conteúdo sugerido por ${suggestion.origin}: ${suggestion.text}`)}
          >
            <span>
              <Badge variant="outline" className="mb-1">{suggestion.origin}</Badge>
              <Typography variant="p" className="font-semibold text-text-primary">{suggestion.text}</Typography>
              <Typography variant="tiny" tone="info" className="tracking-normal">Ver conteúdo sugerido</Typography>
            </span>
            <ChevronRight size={16} className="shrink-0" />
          </button>
        ))}
      </div>
    </Card>
  )
}

function LibrarySuggestCard({
  suggestionTitle,
  onSuggestTitle,
  onOpenSuggestion,
}: {
  suggestionTitle: string
  onSuggestTitle: (value: string) => void
  onOpenSuggestion: () => void
}) {
  return (
    <Card className="rounded-mx-lg border border-mx-green-700/15 bg-mx-green-50/40 p-mx-lg shadow-none">
      <Typography variant="h3" className="uppercase">Sugerir conteúdo</Typography>
      <Typography variant="p" tone="muted" className="mt-mx-xs">Não encontrou o que precisa? Sugira um tema para a biblioteca.</Typography>
      <Input value={suggestionTitle} onChange={(event) => onSuggestTitle(event.target.value)} placeholder="Qual tema você sugere?" className="mt-mx-sm" />
      <Button className="mt-mx-sm w-full justify-between" onClick={onOpenSuggestion}>
        Sugerir agora <Send size={16} />
      </Button>
    </Card>
  )
}

function RecentlyViewedCard() {
  const items = [
    { title: 'WhatsApp que gera resposta e visita', type: 'Aula', duration: '15 min', date: 'Hoje', image: CARD_IMAGES[1], action: 'Continuar' },
    { title: 'Técnicas de fechamento que funcionam', type: 'Script', duration: '17 min', date: 'Ontem', image: CARD_IMAGES[2], action: 'Rever' },
  ]

  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
      <div className="flex items-center justify-between">
        <Typography variant="h3">Vistos recentemente</Typography>
        <button type="button" className="text-xs font-semibold text-mx-green-700" onClick={() => toast.info('Histórico completo: em breve!')}>Ver todos</button>
      </div>
      <div className="mt-mx-sm space-y-mx-sm">
        {items.map((item) => (
          <button
            key={item.title}
            type="button"
            className="grid w-full grid-cols-[64px_minmax(0,1fr)] gap-mx-sm text-left"
            onClick={() => toast.info(`${item.action}: ${item.title}`)}
          >
            <div className="h-mx-16 rounded-mx-md bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
            <span className="min-w-0">
              <Typography variant="p" className="line-clamp-2 font-semibold text-text-primary">{item.title}</Typography>
              <span className="mt-1 flex flex-wrap gap-mx-xs text-xs font-semibold text-text-secondary">
                <span>{item.type}</span>
                <span>{item.duration}</span>
                <span>{item.date}</span>
              </span>
              <Typography variant="tiny" tone="brand" className="tracking-normal">{item.action}</Typography>
            </span>
          </button>
        ))}
      </div>
    </Card>
  )
}

function SuggestionContentModal({
  suggestionTitle,
  onSuggestTitle,
  onClose,
  onSubmit,
}: {
  suggestionTitle: string
  onSuggestTitle: (value: string) => void
  onClose: () => void
  onSubmit: () => Promise<void>
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-mx-black/40 p-mx-lg" role="dialog" aria-modal="true" aria-label="Sugerir conteúdo">
      <Card className="w-full max-w-2xl rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-mx-lg">
        <div className="flex items-start justify-between gap-mx-md">
          <div>
            <Typography variant="h2">Sugerir conteúdo</Typography>
            <Typography variant="p" tone="muted">Descreva a necessidade real para a curadoria priorizar o material certo.</Typography>
          </div>
          <Button variant="ghost" size="icon" aria-label="Fechar sugestão" onClick={onClose}><X size={18} /></Button>
        </div>

        <div className="mt-mx-md grid grid-cols-1 gap-mx-sm md:grid-cols-2">
          <label>
            <Typography variant="caption" className="tracking-normal text-text-primary">Tema</Typography>
            <Input value={suggestionTitle} onChange={(event) => onSuggestTitle(event.target.value)} placeholder="Ex.: WhatsApp para cliente frio" className="mt-1" />
          </label>
          <label>
            <Typography variant="caption" className="tracking-normal text-text-primary">Categoria</Typography>
            <select className="mt-1 h-mx-12 w-full rounded-mx-md border border-border-default bg-white px-mx-sm text-sm font-semibold text-text-primary">
              <option>WhatsApp</option>
              <option>Prospecção</option>
              <option>Fechamento</option>
              <option>Rotina</option>
            </select>
          </label>
          <label className="md:col-span-2">
            <Typography variant="caption" className="tracking-normal text-text-primary">Descrição da necessidade</Typography>
            <textarea className="mt-1 min-h-24 w-full rounded-mx-md border border-border-default px-mx-sm py-mx-xs text-sm outline-none focus:border-mx-green-700" placeholder="Explique qual dificuldade este conteúdo precisa resolver." />
          </label>
          <label>
            <Typography variant="caption" className="tracking-normal text-text-primary">Exemplo de situação real</Typography>
            <Input placeholder="Ex.: cliente sem resposta há 7 dias" className="mt-1" />
          </label>
          <label>
            <Typography variant="caption" className="tracking-normal text-text-primary">Prioridade</Typography>
            <select className="mt-1 h-mx-12 w-full rounded-mx-md border border-border-default bg-white px-mx-sm text-sm font-semibold text-text-primary">
              <option>Média</option>
              <option>Alta</option>
              <option>Baixa</option>
            </select>
          </label>
          <label className="md:col-span-2">
            <Typography variant="caption" className="tracking-normal text-text-primary">Anexo opcional</Typography>
            <Input placeholder="Link ou referência do material" className="mt-1" />
          </label>
        </div>

        <div className="mt-mx-lg flex justify-end gap-mx-xs">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => void onSubmit()}>Enviar sugestão</Button>
        </div>
      </Card>
    </div>
  )
}

function TrilhaTab({
  modules,
  trackName,
  nivelMaturidade,
  maturityTrackName,
  requiredCompleted,
  requiredProgress,
  scoreSnapshot,
  presencasValidadas,
  activeTrackProgress,
  onOpenLibrary,
  onOpenExams,
  onWatch,
  onComplete,
  onRate,
}: {
  modules: TrilhaModule[]
  trackName: string | null
  nivelMaturidade: NivelMaturidadeVendedor
  maturityTrackName: string | null
  requiredCompleted: number
  requiredProgress: number
  scoreSnapshot: ScoreSnapshot
  presencasValidadas: number
  activeTrackProgress: TrackProgressRow[]
  onOpenLibrary: () => void
  onOpenExams: () => void
  onWatch: (training: TrainingWithProgress) => void
  onComplete: (training: TrainingWithProgress) => Promise<void>
  onRate: (training: TrainingWithProgress, rating: number) => Promise<unknown>
}) {
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false)
  const requiredTrackLabel = maturityTrackName || MATURIDADE_VENDEDOR_LABEL[nivelMaturidade]
  const nextTraining = modules.find((module) => module.items.length > 0)?.items[0] ?? null

  return (
    <>
      <div className="grid grid-cols-1 gap-mx-xl xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-mx-md">
          <TrackActionCards
            nextTraining={nextTraining}
            onWatch={onWatch}
            onOpenLibrary={onOpenLibrary}
            onOpenExams={onOpenExams}
          />

          <div>
            <Typography variant="h2" className="text-3xl tracking-normal">Minha Trilha obrigatória: {requiredTrackLabel}</Typography>
            <Typography variant="p" tone="muted" className="mt-mx-xs">
              Acompanhe os conteúdos obrigatórios, provas, pontos e prazo da sua trilha de desenvolvimento comercial.
            </Typography>
          </div>

          <div className="overflow-hidden rounded-mx-lg border border-border-default bg-white">
            {modules.map((module, index) => (
              <TrackModuleCard
                key={module.title}
                module={module}
                moduleIndex={index}
                onWatch={onWatch}
                onComplete={onComplete}
                onRate={onRate}
                onOpenLibrary={onOpenLibrary}
              />
            ))}
          </div>

          <TrackUnlocksBlock requiredTrackLabel={requiredTrackLabel} />
        </section>

        <TrackSidebar
          trackName={trackName}
          nivelMaturidade={nivelMaturidade}
          maturityTrackName={maturityTrackName}
          requiredCompleted={requiredCompleted}
          requiredProgress={requiredProgress}
          scoreSnapshot={scoreSnapshot}
          presencasValidadas={presencasValidadas}
          activeTrackProgress={activeTrackProgress}
          onOpenLevelModal={() => setIsLevelModalOpen(true)}
        />
      </div>

      {isLevelModalOpen && (
        <TrackLevelModal
          requiredTrackLabel={requiredTrackLabel}
          onClose={() => setIsLevelModalOpen(false)}
        />
      )}
    </>
  )
}

function TrackActionCards({
  nextTraining,
  onWatch,
  onOpenLibrary,
  onOpenExams,
}: {
  nextTraining: TrainingWithProgress | null
  onWatch: (training: TrainingWithProgress) => void
  onOpenLibrary: () => void
  onOpenExams: () => void
}) {
  const handleStart = () => {
    if (nextTraining) {
      onWatch(nextTraining)
      return
    }

    onOpenLibrary()
  }

  return (
    <section className="grid grid-cols-1 gap-mx-md lg:grid-cols-3" aria-label="Ações obrigatórias da Trilha">
      <TrackPrimaryActionCard onStart={handleStart} />
      <TrackPendingExamCard onOpenExams={onOpenExams} />
      <TrackDeadlineCard />
    </section>
  )
}

function TrackPrimaryActionCard({ onStart }: { onStart: () => void }) {
  return (
    <Card className="rounded-mx-lg border border-mx-green-700/20 bg-status-success-surface p-mx-lg shadow-none">
      <div className="flex h-full flex-col gap-mx-md">
        <div className="flex items-start gap-mx-md">
          <span className="grid h-mx-14 w-mx-14 shrink-0 place-items-center rounded-full bg-status-success/10 text-status-success">
            <Play size={24} />
          </span>
          <div>
            <Typography variant="caption" className="tracking-normal text-mx-green-700">Próxima ação obrigatória</Typography>
            <Typography variant="h3" className="mt-mx-xs">Fechamento e contorno de objeções</Typography>
            <Typography variant="p" tone="muted" className="mt-1">Módulo 1 — Negociação Fechamento</Typography>
          </div>
        </div>

        <div className="flex flex-wrap gap-mx-sm text-xs font-semibold text-text-secondary">
          <span className="inline-flex items-center gap-1"><Clock size={14} /> Duração: 19 min</span>
          <span className="inline-flex items-center gap-1"><Star size={14} /> Pontuação: +30 pts</span>
        </div>

        <Button className="mt-auto w-full" onClick={onStart}>Começar agora</Button>
      </div>
    </Card>
  )
}

function TrackPendingExamCard({ onOpenExams }: { onOpenExams: () => void }) {
  return (
    <Card className="rounded-mx-lg border border-status-warning/25 bg-white p-mx-lg shadow-none">
      <div className="flex h-full flex-col gap-mx-md">
        <div className="flex items-start gap-mx-md">
          <span className="grid h-mx-14 w-mx-14 shrink-0 place-items-center rounded-full bg-status-warning-surface text-status-warning">
            <ClipboardCheck size={24} />
          </span>
          <div>
            <Typography variant="caption" className="tracking-normal text-status-warning">Prova pendente</Typography>
            <Typography variant="h3" className="mt-mx-xs">{PENDING_EXAM.title}</Typography>
            <Typography variant="p" tone="muted" className="mt-1">{PENDING_EXAM.questions} questões</Typography>
          </div>
        </div>

        <div className="flex flex-wrap gap-mx-sm text-xs font-semibold text-text-secondary">
          <span>Nota mínima: {PENDING_EXAM.minGrade}%</span>
          <span>Pontuação: +{PENDING_EXAM.points} pts</span>
        </div>

        <Button variant="outline" className="mt-auto w-full border-mx-green-700 text-mx-green-700" onClick={onOpenExams}>Responder prova</Button>
      </div>
    </Card>
  )
}

function TrackDeadlineCard() {
  return (
    <Card className="rounded-mx-lg border border-status-info/25 bg-status-info-surface p-mx-lg shadow-none">
      <div className="flex h-full flex-col gap-mx-md">
        <div className="flex items-start gap-mx-md">
          <span className="grid h-mx-14 w-mx-14 shrink-0 place-items-center rounded-full bg-white text-status-info">
            <ShieldCheck size={24} />
          </span>
          <div>
            <Typography variant="caption" className="tracking-normal text-status-info">Prazo da trilha</Typography>
            <Typography variant="h3" className="mt-mx-xs">Ciclo atual: Jun/2026 a Dez/2026</Typography>
          </div>
        </div>

        <div className="space-y-mx-xs text-sm font-semibold text-text-primary">
          <p>Prazo final: 31/12/2026</p>
          <div className="flex flex-wrap gap-mx-sm">
            <Badge variant="success" className="bg-status-success-surface text-status-success">Em dia</Badge>
            <span className="inline-flex items-center gap-1 text-text-secondary"><CalendarDays size={14} /> Faltam 197 dias</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function TrackModuleCard({
  module,
  moduleIndex,
  onWatch,
  onComplete,
  onRate,
  onOpenLibrary,
}: {
  module: TrilhaModule
  moduleIndex: number
  onWatch: (training: TrainingWithProgress) => void
  onComplete: (training: TrainingWithProgress) => Promise<void>
  onRate: (training: TrainingWithProgress, rating: number) => Promise<unknown>
  onOpenLibrary: () => void
}) {
  const [expanded, setExpanded] = useState(module.open)
  const Icon = module.icon
  const status = getModuleStatus(module, expanded)
  const rows = getTrackContentRows(module, moduleIndex)
  const actionLabel = status === 'Concluído' ? 'Revisar' : status === 'Conteúdos em preparação' ? 'Acompanhar' : 'Começar'

  const handlePrimaryAction = () => {
    const firstTraining = module.items[0]
    if (firstTraining) {
      onWatch(firstTraining)
      return
    }

    onOpenLibrary()
  }

  return (
    <article className="border-b border-border-default last:border-b-0" aria-label={`Módulo ${moduleIndex + 1} ${module.title}`}>
      <div className="grid grid-cols-1 gap-mx-md p-mx-md lg:grid-cols-[minmax(0,1fr)_180px_150px_190px] lg:items-center">
        <div className="flex min-w-0 items-start gap-mx-md">
          <span className="grid h-mx-12 w-mx-12 shrink-0 place-items-center rounded-mx-md bg-mx-green-700/10 text-mx-green-700">
            <Icon size={22} />
          </span>
          <div className="min-w-0">
            <Typography variant="caption" className="tracking-normal text-mx-green-700">Módulo {moduleIndex + 1}</Typography>
            <Typography variant="h3" className="mt-0.5 truncate">{module.title}</Typography>
            <Typography variant="p" tone="muted" className="mt-1">{module.subtitle}</Typography>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-mx-sm text-sm font-semibold text-text-primary">
            <span>{module.score}%</span>
            <span className="text-xs text-text-tertiary">{module.done} de {module.total} conteúdos</span>
          </div>
          <div className="mt-mx-xs h-2 rounded-full bg-border-subtle">
            <div className="h-2 rounded-full bg-mx-green-700" style={{ width: `${module.score}%` }} />
          </div>
        </div>

        <TrackStatusBadge status={status} />

        <div className="flex flex-wrap justify-start gap-mx-xs lg:justify-end">
          <Button variant="outline" size="sm" onClick={handlePrimaryAction}>{actionLabel}</Button>
          <Button variant="ghost" size="sm" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>
            {expanded ? 'Recolher' : 'Expandir'}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-mx-md pb-mx-md">
          {rows.length > 0 ? (
            <div className="overflow-x-auto rounded-mx-md border border-border-default">
              <table className="min-w-[980px] w-full text-left text-xs">
                <thead className="bg-surface-alt text-text-tertiary">
                  <tr>
                    <th scope="col" className="px-mx-sm py-mx-xs font-semibold">Conteúdo</th>
                    <th scope="col" className="px-mx-sm py-mx-xs font-semibold">Tipo</th>
                    <th scope="col" className="px-mx-sm py-mx-xs font-semibold">Duração</th>
                    <th scope="col" className="px-mx-sm py-mx-xs font-semibold">Progresso</th>
                    <th scope="col" className="px-mx-sm py-mx-xs font-semibold">Prova</th>
                    <th scope="col" className="px-mx-sm py-mx-xs font-semibold">Nota mínima</th>
                    <th scope="col" className="px-mx-sm py-mx-xs font-semibold">Pontos</th>
                    <th scope="col" className="px-mx-sm py-mx-xs font-semibold">Status</th>
                    <th scope="col" className="px-mx-sm py-mx-xs font-semibold">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default bg-white">
                  {rows.map((row) => (
                    <TrackContentRow
                      key={row.id}
                      row={row}
                      onWatch={onWatch}
                      onComplete={onComplete}
                      onRate={onRate}
                      onOpenLibrary={onOpenLibrary}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-mx-md border border-accent-purple/20 bg-accent-purple-soft p-mx-md">
              <Typography variant="p" className="font-semibold text-accent-purple">Conteúdos em preparação</Typography>
              <Typography variant="p" tone="muted" className="mt-1">A curadoria MX vai liberar este módulo quando os conteúdos estiverem prontos.</Typography>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

type TrackContentRowData = {
  id: string
  title: string
  type: string
  duration: string
  progress: number
  proof: string
  minGrade: string
  points: string
  status: string
  action: string
  training: TrainingWithProgress | null
}

function getModuleStatus(module: TrilhaModule, expanded: boolean) {
  if (module.total === 0) return 'Conteúdos em preparação'
  if (module.done >= module.total) return 'Concluído'
  if (module.score > 0) return 'Em andamento'
  if (expanded) return 'Pendente'
  return 'Não iniciado'
}

function getTrackContentRows(module: TrilhaModule, moduleIndex: number): TrackContentRowData[] {
  if (moduleIndex === 0) {
    const primaryTraining = module.items[0] ?? null

    return [
      {
        id: primaryTraining?.id ?? 'fechamento-contorno-objeccoes',
        title: 'Fechamento e contorno de objeções',
        type: 'Aula',
        duration: '19 min',
        progress: primaryTraining?.watched ? 100 : 0,
        proof: 'Prova obrigatória',
        minGrade: '70%',
        points: `+${getTrainingPoints(primaryTraining, 30)} pts`,
        status: primaryTraining?.watched ? 'Concluído' : 'Pendente',
        action: primaryTraining?.watched ? 'Revisar' : 'Começar',
        training: primaryTraining,
      },
      {
        id: 'sandbox-mx-fechamento',
        title: 'Sandbox MX Fechamento',
        type: 'Aula',
        duration: '15 min',
        progress: 35,
        proof: 'Sem prova',
        minGrade: '—',
        points: '+0 pts',
        status: 'Em andamento',
        action: 'Continuar',
        training: module.items[1] ?? null,
      },
    ]
  }

  return module.items.map((training, index) => ({
    id: training.id,
    title: training.title,
    type: 'Aula',
    duration: `${training.duration_minutes || 18} min`,
    progress: training.watched ? 100 : 0,
    proof: index === 0 ? 'Prova obrigatória' : 'Sem prova',
    minGrade: index === 0 ? '70%' : '—',
    points: index === 0 ? `+${getTrainingPoints(training, 30)} pts` : '+0 pts',
    status: training.watched ? 'Concluído' : 'Pendente',
    action: training.watched ? 'Revisar' : 'Começar',
    training,
  }))
}

function TrackContentRow({
  row,
  onWatch,
  onComplete,
  onRate,
  onOpenLibrary,
}: {
  row: TrackContentRowData
  onWatch: (training: TrainingWithProgress) => void
  onComplete: (training: TrainingWithProgress) => Promise<void>
  onRate: (training: TrainingWithProgress, rating: number) => Promise<unknown>
  onOpenLibrary: () => void
}) {
  const handleAction = () => {
    if (!row.training) {
      onOpenLibrary()
      return
    }

    if (row.status === 'Concluído') {
      void onRate(row.training, 5)
      return
    }

    onWatch(row.training)
  }

  const handleComplete = () => {
    if (row.training && row.status !== 'Concluído') {
      void onComplete(row.training)
    }
  }

  return (
    <tr>
      <td className="px-mx-sm py-mx-xs">
        <span className="inline-flex items-center gap-mx-xs font-semibold text-text-primary">
          <Play size={14} className="text-mx-green-700" />
          {row.title}
        </span>
      </td>
      <td className="px-mx-sm py-mx-xs"><Badge variant="success" className="bg-status-success-surface text-status-success">{row.type}</Badge></td>
      <td className="px-mx-sm py-mx-xs font-semibold text-text-secondary">{row.duration}</td>
      <td className="px-mx-sm py-mx-xs">
        <div className="flex items-center gap-mx-xs">
          <div className="h-1.5 w-20 rounded-full bg-border-subtle">
            <div className="h-1.5 rounded-full bg-mx-green-700" style={{ width: `${row.progress}%` }} />
          </div>
          <span className="font-semibold text-text-secondary">{row.progress}%</span>
        </div>
      </td>
      <td className="px-mx-sm py-mx-xs"><TrackProofBadge label={row.proof} /></td>
      <td className="px-mx-sm py-mx-xs font-semibold text-text-secondary">{row.minGrade}</td>
      <td className="px-mx-sm py-mx-xs font-semibold text-mx-green-700">{row.points}</td>
      <td className="px-mx-sm py-mx-xs"><TrackStatusBadge status={row.status} /></td>
      <td className="px-mx-sm py-mx-xs">
        <div className="flex items-center gap-mx-xs">
          <Button variant="outline" size="xs" onClick={handleAction}>{row.action}</Button>
          {row.training && row.status !== 'Concluído' && (
            <Button variant="ghost" size="xs" onClick={handleComplete}>Concluir</Button>
          )}
        </div>
      </td>
    </tr>
  )
}

function TrackProofBadge({ label }: { label: string }) {
  if (label === 'Prova obrigatória') {
    return <Badge variant="warning" className="bg-status-warning-surface text-status-warning">{label}</Badge>
  }

  return <Badge variant="outline">{label}</Badge>
}

function TrackStatusBadge({ status }: { status: string }) {
  if (status === 'Concluído') return <Badge variant="success">{status}</Badge>
  if (status === 'Em andamento') return <Badge variant="info" className="bg-status-info-surface text-status-info">{status}</Badge>
  if (status === 'Pendente') return <Badge variant="warning" className="bg-status-warning-surface text-status-warning">{status}</Badge>
  if (status === 'Conteúdos em preparação') return <Badge variant="outline" className="border-accent-purple/20 bg-accent-purple-soft text-accent-purple">{status}</Badge>
  return <Badge variant="outline">{status}</Badge>
}

function TrackSidebar({
  trackName,
  nivelMaturidade,
  maturityTrackName,
  requiredCompleted,
  requiredProgress,
  scoreSnapshot,
  presencasValidadas,
  activeTrackProgress,
  onOpenLevelModal,
}: {
  trackName: string | null
  nivelMaturidade: NivelMaturidadeVendedor
  maturityTrackName: string | null
  requiredCompleted: number
  requiredProgress: number
  scoreSnapshot: ScoreSnapshot
  presencasValidadas: number
  activeTrackProgress: TrackProgressRow[]
  onOpenLevelModal: () => void
}) {
  const requiredTrackLabel = maturityTrackName || MATURIDADE_VENDEDOR_LABEL[nivelMaturidade]

  return (
    <aside className="space-y-mx-md xl:sticky xl:top-mx-lg xl:self-start" aria-label="Detalhes da Trilha obrigatória">
      <Card className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
        <div className="flex items-start gap-mx-sm">
          <span className="grid h-mx-11 w-mx-11 shrink-0 place-items-center rounded-full bg-accent-purple-soft text-accent-purple">
            <ShieldCheck size={22} />
          </span>
          <div>
            <Typography variant="h3">Sobre sua Trilha obrigatória</Typography>
            <Typography variant="h4" className="mt-mx-xs">{requiredTrackLabel}</Typography>
          </div>
        </div>

        <Typography variant="p" tone="muted" className="mt-mx-md">
          {maturityTrackName
            ? `Trilha atribuída automaticamente pelo seu nível comercial. Seu nível atual é ${MATURIDADE_VENDEDOR_LABEL[nivelMaturidade]}.`
            : `Seu nível sugerido é ${MATURIDADE_VENDEDOR_LABEL[nivelMaturidade]}, e a trilha N1-N4 será atribuída automaticamente pelo Meu Perfil.`}
        </Typography>

        <dl className="mt-mx-md space-y-mx-xs text-xs font-semibold text-text-secondary">
          <div className="flex justify-between gap-mx-sm"><dt>Tempo de mercado</dt><dd className="text-text-primary">5 anos e 3 meses</dd></div>
          <div className="flex justify-between gap-mx-sm"><dt>Experiência declarada</dt><dd className="text-text-primary">Avançada</dd></div>
          <div className="flex justify-between gap-mx-sm"><dt>Diagnóstico inicial</dt><dd className="text-text-primary">Perfil consultivo</dd></div>
          <div className="flex justify-between gap-mx-sm"><dt>Desempenho</dt><dd className="text-text-primary">Acima da média</dd></div>
        </dl>

        {trackName && trackName !== maturityTrackName && (
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block tracking-normal">Outra trilha ativa: {trackName}</Typography>
        )}

        <button type="button" className="mt-mx-md inline-flex items-center gap-mx-xs text-sm font-semibold text-mx-green-700" onClick={onOpenLevelModal}>
          Entenda como seu nível é definido <ExternalLink size={14} />
        </button>
      </Card>

      <Card className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
        <Typography variant="h3">Seu progresso</Typography>
        <div className="mt-mx-md flex items-center gap-mx-md">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-mx-green-700) ${requiredProgress * 3.6}deg, var(--color-border-subtle) 0deg)` }}>
            <div className="grid h-16 w-16 place-items-center rounded-full bg-white"><span className="text-xl font-semibold">{requiredProgress}%</span></div>
          </div>
          <div className="space-y-mx-xs text-sm font-semibold text-text-secondary">
            <p>{requiredCompleted} de {REQUIRED_CONTENT_TOTAL} conteúdos</p>
            <p>0 provas concluídas</p>
            <p>{presencasValidadas} presenças validadas</p>
          </div>
        </div>
      </Card>

      <Card className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
        <Typography variant="h3">Pontos da Trilha</Typography>
        <div className="mt-mx-md grid grid-cols-3 gap-mx-xs text-center">
          <MiniScore value={`${scoreSnapshot.earned} pts`} label="Ganhos" />
          <MiniScore value={`${scoreSnapshot.available} pts`} label="Disponíveis" />
          <MiniScore value={`${scoreSnapshot.pending} pts`} label="Pendentes" />
        </div>
        <div className="mt-mx-md space-y-1 text-xs font-semibold text-text-secondary">
          <p>+30 pts por conteúdo obrigatório</p>
          <p>+10 pts por prova aprovada</p>
          <p>+20 pts por presença validada</p>
        </div>
        {activeTrackProgress.length > 0 && (
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block tracking-normal">Trilha ativa sincronizada com seu cadastro.</Typography>
        )}
      </Card>

      <Card className="rounded-mx-lg border border-accent-purple/20 bg-white p-mx-lg shadow-none">
        <div className="flex items-start gap-mx-sm">
          <span className="grid h-mx-11 w-mx-11 shrink-0 place-items-center rounded-full bg-accent-purple-soft text-accent-purple">
            <Medal size={22} />
          </span>
          <div>
            <Typography variant="h3">Próxima conquista</Typography>
            <Typography variant="p" tone="muted" className="mt-mx-xs">Conclua mais 2 conteúdos para finalizar "Negociação e Fechamento".</Typography>
            <Typography variant="p" className="mt-mx-xs font-semibold text-mx-green-700">+150 pts no Score</Typography>
          </div>
        </div>
      </Card>

      <Card className="rounded-mx-lg border border-mx-green-700/15 bg-status-success-surface p-mx-lg shadow-none">
        <div className="flex items-start gap-mx-sm">
          <span className="grid h-mx-11 w-mx-11 shrink-0 place-items-center rounded-full bg-status-success/10 text-status-success">
            <Target size={22} />
          </span>
          <div>
            <Typography variant="h3">Vinculado ao PDI / Feedback</Typography>
            <Typography variant="caption" className="mt-mx-xs block tracking-normal text-text-tertiary">Recomendação atual do seu gestor:</Typography>
            <Typography variant="p" className="mt-mx-xs font-semibold text-text-primary">Melhorar follow-up com clientes sem resposta.</Typography>
          </div>
          <ChevronRight size={18} className="ml-auto text-mx-green-700" />
        </div>
      </Card>
    </aside>
  )
}

function TrackLevelModal({ requiredTrackLabel, onClose }: { requiredTrackLabel: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-mx-md" role="presentation">
      <Card className="w-full max-w-xl rounded-mx-lg border border-border-default bg-white p-mx-xl shadow-mx-xl" role="dialog" aria-modal="true" aria-label="Entenda como seu nível é definido">
        <div className="flex items-start justify-between gap-mx-md">
          <div>
            <Typography variant="h2">Entenda como seu nível é definido</Typography>
            <Typography variant="p" tone="muted" className="mt-mx-xs">Seu nível atual exibido na Trilha é {requiredTrackLabel}.</Typography>
          </div>
          <button type="button" aria-label="Fechar modal" className="rounded-mx-md p-mx-xs text-text-secondary hover:bg-surface-alt" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="mt-mx-lg space-y-mx-md">
          <Typography variant="p" className="text-text-primary">
            O Meu Perfil combina tempo de mercado, experiência declarada, diagnóstico inicial, desempenho e avaliações anteriores para sugerir a trilha obrigatória.
          </Typography>
          <div className="grid grid-cols-1 gap-mx-sm sm:grid-cols-2">
            {['Meu Perfil', 'Tempo de mercado', 'Experiência declarada', 'Diagnóstico inicial', 'Desempenho', 'Avaliações anteriores'].map((item) => (
              <div key={item} className="rounded-mx-md border border-border-default bg-surface-alt p-mx-sm text-sm font-semibold text-text-primary">{item}</div>
            ))}
          </div>
          <Typography variant="p" tone="muted">Os níveis possíveis são N1, N2, N3 e N4. A trilha N1-N4 é atribuída automaticamente e pode evoluir conforme progresso, provas e histórico.</Typography>
        </div>

        <div className="mt-mx-lg flex justify-end">
          <Button onClick={onClose}>Entendi</Button>
        </div>
      </Card>
    </div>
  )
}

function TrackUnlocksBlock({ requiredTrackLabel }: { requiredTrackLabel: string }) {
  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
      <Typography variant="h3">Ao concluir esta trilha, você desbloqueia:</Typography>
      <div className="mt-mx-md grid grid-cols-1 gap-mx-md md:grid-cols-3">
        <TrackUnlockCard icon={<Award size={22} />} title={`Certificado ${requiredTrackLabel}`} description="Valide seu nível e conquiste reconhecimento." tone="success" />
        <TrackUnlockCard icon={<Medal size={22} />} title="Conquista de conclusão" description="Destaque no seu perfil e histórico." tone="brand" />
        <TrackUnlockCard icon={<Star size={22} />} title="Pontos no Score MX" description="Impulsione seu desempenho no Score." tone="warning" />
      </div>
    </Card>
  )
}

function TrackUnlockCard({ icon, title, description, tone }: { icon: ReactNode; title: string; description: string; tone: 'success' | 'brand' | 'warning' }) {
  const toneClass = tone === 'success' ? 'bg-status-success-surface text-status-success' : tone === 'brand' ? 'bg-accent-purple-soft text-accent-purple' : 'bg-status-warning-surface text-status-warning'

  return (
    <div className="flex items-start gap-mx-md rounded-mx-md border border-border-default p-mx-md">
      <span className={cn('grid h-mx-11 w-mx-11 shrink-0 place-items-center rounded-full', toneClass)}>{icon}</span>
      <div>
        <Typography variant="h4">{title}</Typography>
        <Typography variant="p" tone="muted" className="mt-1">{description}</Typography>
      </div>
    </div>
  )
}

type AulasAoVivoData = ReturnType<typeof useAulasAoVivo>

type LiveClassItem = {
  id: string
  dayLabel: string
  day: string
  month: string
  title: string
  instructor: string
  time: string
  duration: string
  status: string
  proof: string
  points: string
  description: string
}

type LiveRecordingItem = {
  title: string
  instructor: string
  date: string
  duration: string
  status: string
  grade: string
  proof: string
  points: string
  image: string
}

const FALLBACK_LIVE_CLASSES: LiveClassItem[] = [
  {
    id: 'aula-agendamentos-internet',
    dayLabel: 'QUI',
    day: '29',
    month: 'MAI',
    title: 'Como aumentar agendamentos na internet',
    instructor: 'Marcos Andrade',
    time: '10:00 às 11:30',
    duration: '90 min',
    status: 'Ao vivo',
    proof: 'Prova vinculada',
    points: '+20 pts',
    description: 'Técnicas práticas para transformar leads em agendamentos qualificados.',
  },
  {
    id: 'aula-negociacao-sem-desconto',
    dayLabel: 'QUI',
    day: '12',
    month: 'JUN',
    title: 'Negociação sem desconto',
    instructor: 'Camila Torres',
    time: '09:00 às 10:00',
    duration: '60 min',
    status: 'Inscrição aberta',
    proof: 'Prova vinculada',
    points: '+20 pts',
    description: 'Estratégias para defender valor sem depender de desconto.',
  },
  {
    id: 'aula-financiamento-aprovacoes',
    dayLabel: 'QUI',
    day: '26',
    month: 'JUN',
    title: 'Financiamento: como aumentar aprovações',
    instructor: 'Lucas Martins',
    time: '10:00 às 11:00',
    duration: '60 min',
    status: 'Inscrito',
    proof: 'Prova vinculada',
    points: '+20 pts',
    description: 'Como preparar propostas e reduzir reprovações de crédito.',
  },
]

const FALLBACK_RECORDINGS: LiveRecordingItem[] = [
  {
    title: 'Como lidar com objeções de preço',
    instructor: 'Marcos Andrade',
    date: '15/05/2026',
    duration: '50 min',
    status: 'Assistida',
    grade: '90%',
    proof: 'Prova concluída',
    points: '+20 pts',
    image: CARD_IMAGES[0],
  },
  {
    title: 'Follow-up que traz o cliente de volta',
    instructor: 'Camila Torres',
    date: '08/05/2026',
    duration: '32 min',
    status: 'Assistida',
    grade: '85%',
    proof: 'Presença validada',
    points: '+20 pts',
    image: CARD_IMAGES[1],
  },
  {
    title: 'Como fazer avaliação de usado',
    instructor: 'Lucas Martins',
    date: '01/05/2026',
    duration: '47 min',
    status: 'Prova pendente',
    grade: '80%',
    proof: 'Prova pendente',
    points: '+20 pts',
    image: CARD_IMAGES[2],
  },
]

function AulasTab({
  aulasData,
  onOpenLibrary,
  onOpenTrack,
  onOpenExams,
}: {
  aulasData: AulasAoVivoData
  onOpenLibrary: () => void
  onOpenTrack: () => void
  onOpenExams: () => void
}) {
  const liveClasses = buildLiveClassItems(aulasData)
  const recordings = buildLiveRecordingItems(aulasData)
  const mainClass = liveClasses[0]
  const presencasValidadas = aulasData.indicadores.presencasValidadas || 5
  const mediaProvas = aulasData.indicadores.mediaProvas ?? 87
  const pontos = aulasData.indicadores.pontos || 210
  const hasLiveClass = liveClasses.length > 0

  if (!hasLiveClass) {
    return (
      <AulasEmptyState
        onOpenLibrary={onOpenLibrary}
        onOpenTrack={onOpenTrack}
      />
    )
  }

  return (
    <section className="space-y-mx-lg" aria-label="Aulas ao Vivo">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => document.getElementById('aulas-como-funciona')?.scrollIntoView({ behavior: 'smooth' })}>
          <Info size={16} /> Como funciona
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-mx-sm md:grid-cols-3 xl:grid-cols-6" aria-label="Indicadores de Aulas ao Vivo">
        <AulaMetricCard icon={<CalendarDays size={22} />} label="Próximas aulas" value="2" hint="agendadas" tone="success" />
        <AulaMetricCard icon={<CheckCircle size={22} />} label="Aulas confirmadas" value="1" hint="inscrita" tone="success" />
        <AulaMetricCard icon={<Target size={22} />} label="Presenças validadas" value={String(presencasValidadas)} hint="neste mês" tone="brand" />
        <AulaMetricCard icon={<FileQuestion size={22} />} label="Provas pendentes" value="1" hint="para responder" tone="warning" />
        <AulaMetricCard icon={<Star size={22} />} label="Média nas provas" value={`${mediaProvas}%`} hint="de aproveitamento" tone="brand" />
        <AulaMetricCard icon={<Award size={22} />} label="Pontos acumulados" value={`${pontos} pts`} hint="neste mês" tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-mx-lg xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-mx-lg">
          <div className="grid grid-cols-1 gap-mx-md lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <AulasNextLiveClassCard liveClass={mainClass} />
            <LivePendingProofCard onOpenExams={onOpenExams} />
          </div>

          <HowLiveClassesWork />

          <RecentLiveClassesMetrics
            presencasValidadas={7}
            mediaProvas={mediaProvas}
            pontos={pontos}
          />

          <LiveCertificatesBanner />
        </div>

        <aside className="space-y-mx-md" aria-label="Agenda e gravações de Aulas ao Vivo">
          <LiveAgendaCard liveClasses={liveClasses} />
          <LiveRecordingsCard recordings={recordings} />
          <LiveMonthlyScoreCard pontos={pontos} />
        </aside>
      </div>
    </section>
  )
}

function buildLiveClassItems(aulasData: AulasAoVivoData): LiveClassItem[] {
  if (!aulasData.futuras?.length) return FALLBACK_LIVE_CLASSES

  return aulasData.futuras.slice(0, 3).map((aula) => {
    const start = new Date(aula.inicio)
    const end = new Date(start.getTime() + aula.duracao_minutos * 60000)
    return {
      id: aula.id,
      dayLabel: start.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase(),
      day: String(start.getDate()).padStart(2, '0'),
      month: start.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(),
      title: aula.titulo,
      instructor: aula.instrutor || 'Universidade MX',
      time: `${formatLiveHour(start)} às ${formatLiveHour(end)}`,
      duration: `${aula.duracao_minutos} min`,
      status: aula.status === 'ao_vivo' ? 'Ao vivo' : 'Inscrição aberta',
      proof: 'Prova vinculada',
      points: '+20 pts',
      description: aula.descricao || 'Aula ao vivo com prova para validação de presença.',
    }
  })
}

function buildLiveRecordingItems(aulasData: AulasAoVivoData): LiveRecordingItem[] {
  if (!aulasData.gravacoes?.length) return FALLBACK_RECORDINGS

  return aulasData.gravacoes.slice(0, 3).map((aula, index) => ({
    title: aula.titulo,
    instructor: aula.instrutor || 'Universidade MX',
    date: new Date(aula.inicio).toLocaleDateString('pt-BR'),
    duration: `${aula.duracao_minutos} min`,
    status: index === 0 ? 'Assistida' : index === 1 ? 'Presença validada' : 'Prova pendente',
    grade: index === 0 ? '90%' : index === 1 ? '85%' : '80%',
    proof: index === 2 ? 'Prova pendente' : 'Prova concluída',
    points: '+20 pts',
    image: CARD_IMAGES[index % CARD_IMAGES.length],
  }))
}

function formatLiveHour(date: Date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function AulaMetricCard({ icon, label, value, hint, tone }: { icon: ReactNode; label: string; value: string; hint: string; tone: 'brand' | 'success' | 'warning' }) {
  const toneClass = tone === 'success' ? 'bg-status-success-surface text-status-success' : tone === 'warning' ? 'bg-status-warning-surface text-status-warning' : 'bg-accent-purple-soft text-accent-purple'

  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-md shadow-none">
      <div className="flex items-center gap-mx-sm">
        <span className={cn('grid h-mx-11 w-mx-11 shrink-0 place-items-center rounded-full', toneClass)}>{icon}</span>
        <div>
          <Typography variant="caption" className="tracking-normal text-text-primary">{label}</Typography>
          <Typography variant="h2" className="text-2xl tracking-normal">{value}</Typography>
          <Typography variant="tiny" tone="muted" className="tracking-normal">{hint}</Typography>
        </div>
      </div>
    </Card>
  )
}

function AulasNextLiveClassCard({ liveClass }: { liveClass: LiveClassItem }) {
  return (
    <Card className="overflow-hidden rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
      <Typography variant="h3" className="mb-mx-sm uppercase">Próxima aula ao vivo</Typography>
      <div className="grid overflow-hidden rounded-mx-md bg-mx-green-950 text-white md:grid-cols-[170px_minmax(0,1fr)]">
        <div className="relative grid min-h-52 place-items-end bg-cover bg-center p-mx-md" style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,73,45,.1), rgba(0,73,45,.86)), url(${CARD_IMAGES[4]})` }}>
          <Badge variant="success" className="absolute left-mx-sm top-mx-sm rounded-mx-full">{liveClass.status}</Badge>
          <div className="mr-auto">
            <Typography variant="h4" tone="white" className="uppercase">{liveClass.dayLabel}</Typography>
            <div className="text-5xl font-semibold leading-none">{liveClass.day}</div>
            <Typography variant="h3" tone="white" className="uppercase">{liveClass.month}</Typography>
          </div>
        </div>
        <div className="flex flex-col justify-center p-mx-lg">
          <Typography variant="h2" tone="white" className="text-2xl">{liveClass.title}</Typography>
          <Typography variant="p" tone="white" className="mt-mx-xs opacity-80">{liveClass.description}</Typography>
          <div className="mt-mx-md flex flex-wrap gap-mx-md text-sm font-semibold text-white/85">
            <span>Com {liveClass.instructor}</span>
            <span className="inline-flex items-center gap-1"><Clock size={15} /> {liveClass.time}</span>
            <span className="inline-flex items-center gap-1"><Clock size={15} /> {liveClass.duration}</span>
            <Badge variant="success" className="bg-white/15 text-white">{liveClass.status}</Badge>
          </div>
          <Typography variant="tiny" tone="white" className="mt-mx-md block tracking-normal opacity-90">
            Sua presença será validada pela prova após a aula.
          </Typography>
        </div>
      </div>
      <div className="mt-mx-md flex flex-col gap-mx-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-mx-sm">
          <Award size={24} className="text-mx-green-700" />
          <div>
            <Typography variant="h3">+20 pts</Typography>
            <Typography variant="tiny" tone="muted" className="tracking-normal">ao validar presença</Typography>
          </div>
        </div>
        <div className="flex flex-wrap gap-mx-xs">
          <Button onClick={() => toast.info(`Link de participação: ${liveClass.title}`)}><Video size={16} /> Participar da aula</Button>
          <Button variant="outline" onClick={() => window.open(buildCalendarUrl(), '_blank', 'noopener')}><CalendarDays size={16} /> Adicionar ao calendário</Button>
          <Button variant="ghost" onClick={() => document.getElementById('aulas-como-funciona')?.scrollIntoView({ behavior: 'smooth' })}>Ver detalhes <ChevronRight size={16} /></Button>
        </div>
      </div>
    </Card>
  )
}

function LivePendingProofCard({ onOpenExams }: { onOpenExams: () => void }) {
  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
      <div className="flex items-center gap-mx-xs">
        <FileQuestion size={18} className="text-status-warning" />
        <Typography variant="h3" className="uppercase">Prova pendente</Typography>
      </div>
      <div className="mt-mx-md rounded-mx-md border border-border-default p-mx-md">
        <Typography variant="h3">Técnicas de Fechamento</Typography>
        <div className="mt-mx-md space-y-mx-sm text-sm font-semibold text-text-secondary">
          <p className="inline-flex items-center gap-mx-xs"><ClipboardCheck size={16} /> 5 questões</p>
          <p className="inline-flex items-center gap-mx-xs"><Target size={16} /> Nota mínima: 70%</p>
          <p className="inline-flex items-center gap-mx-xs"><CalendarDays size={16} /> Prazo: hoje até 23:59</p>
        </div>
      </div>
      <div className="mt-mx-md flex items-center justify-between gap-mx-md rounded-mx-md border border-border-default p-mx-md">
        <div>
          <Typography variant="h3">+20 pts</Typography>
          <Typography variant="tiny" tone="muted" className="tracking-normal">ao concluir</Typography>
        </div>
        <Button onClick={onOpenExams}>Responder prova</Button>
      </div>
    </Card>
  )
}

function HowLiveClassesWork() {
  const steps = [
    { icon: <CalendarDays size={22} />, title: '1. Confirme presença', text: 'Confirme sua presença na aula ao vivo.' },
    { icon: <Video size={22} />, title: '2. Participe da aula', text: 'Participe ao vivo e aproveite o conteúdo com o instrutor.' },
    { icon: <FileQuestion size={22} />, title: '3. Faça a prova', text: 'Responda a prova com 5 questões.' },
    { icon: <ShieldCheck size={22} />, title: '4. Valide sua presença', text: 'Acerte 70% ou mais e sua presença será validada.' },
    { icon: <Star size={22} />, title: '5. Ganhe pontos no Score', text: 'Sua presença e desempenho impactam seu Score.' },
  ]

  return (
    <Card id="aulas-como-funciona" className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
      <Typography variant="h3" className="mb-mx-md uppercase">Como funciona</Typography>
      <div className="grid grid-cols-1 gap-mx-md lg:grid-cols-5">
        {steps.map((step, index) => (
          <div key={step.title} className="flex items-start gap-mx-sm">
            <span className="grid h-mx-11 w-mx-11 shrink-0 place-items-center rounded-full bg-status-success-surface text-status-success">{step.icon}</span>
            <div>
              <Typography variant="p" className="font-semibold text-text-primary">{step.title}</Typography>
              <Typography variant="tiny" tone="muted" className="tracking-normal">{step.text}</Typography>
            </div>
            {index < steps.length - 1 && <ChevronRight size={16} className="ml-auto mt-mx-sm hidden text-text-tertiary lg:block" />}
          </div>
        ))}
      </div>
    </Card>
  )
}

function RecentLiveClassesMetrics({ presencasValidadas, mediaProvas, pontos }: { presencasValidadas: number; mediaProvas: number; pontos: number }) {
  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
      <Typography variant="h3" className="uppercase">Suas aulas recentes</Typography>
      <div className="mt-mx-md grid grid-cols-1 gap-mx-md md:grid-cols-4">
        <AulaRecentMetric icon={<CalendarDays size={22} />} label="Presenças validadas" value={String(presencasValidadas)} hint="nos últimos 30 dias" />
        <AulaRecentMetric icon={<CheckCircle size={22} />} label="Média de acertos" value={`${mediaProvas}%`} hint="nas provas" />
        <AulaRecentMetric icon={<Star size={22} />} label="Pontos conquistados" value={String(pontos)} hint="em aulas ao vivo" />
        <AulaRecentMetric icon={<Clock size={22} />} label="Horas de conteúdo" value="7h 30m" hint="nas últimas 4 semanas" />
      </div>
    </Card>
  )
}

function AulaRecentMetric({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="flex items-center gap-mx-md rounded-mx-md border border-border-default p-mx-md">
      <span className="grid h-mx-12 w-mx-12 shrink-0 place-items-center rounded-full bg-status-success-surface text-status-success">{icon}</span>
      <div>
        <Typography variant="caption" className="tracking-normal text-text-primary">{label}</Typography>
        <Typography variant="h2" className="text-2xl">{value}</Typography>
        <Typography variant="tiny" tone="muted" className="tracking-normal">{hint}</Typography>
      </div>
    </div>
  )
}

function LiveCertificatesBanner() {
  return (
    <Card className="rounded-mx-lg border border-mx-green-700/15 bg-status-success-surface p-mx-lg shadow-none">
      <div className="flex flex-col gap-mx-md md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-mx-md">
          <span className="grid h-mx-14 w-mx-14 shrink-0 place-items-center rounded-full bg-white text-mx-green-700">
            <Medal size={28} />
          </span>
          <div>
            <Typography variant="h3">Presença que gera resultado!</Typography>
            <Typography variant="p" tone="muted">Participe, aprenda e aplique. Cada aula é uma oportunidade de evoluir e se destacar.</Typography>
          </div>
        </div>
        <Button variant="outline" onClick={() => toast.info('Certificados de aulas ao vivo sincronizados com presenças validadas.')}><Award size={16} /> Ver meus certificados</Button>
      </div>
    </Card>
  )
}

function LiveAgendaCard({ liveClasses }: { liveClasses: LiveClassItem[] }) {
  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
      <div className="mb-mx-sm flex items-center justify-between gap-mx-sm">
        <Typography variant="h3" className="uppercase">Agenda de aulas</Typography>
        <button type="button" className="text-xs font-semibold text-mx-green-700" onClick={() => window.open(buildCalendarUrl(), '_blank', 'noopener')}>Ver calendário completo <ChevronRight size={13} className="inline" /></button>
      </div>
      <div className="divide-y divide-border-default">
        {liveClasses.map((item) => (
          <button key={item.id} type="button" className="flex w-full items-center gap-mx-md py-mx-sm text-left" onClick={() => toast.info(`Aula selecionada: ${item.title}`)}>
            <div className="flex h-mx-16 w-mx-14 shrink-0 flex-col items-center justify-center rounded-mx-md bg-status-success-surface">
              <span className="text-xs font-semibold uppercase text-mx-green-700">{item.dayLabel}</span>
              <span className="text-2xl font-semibold text-text-primary">{item.day}</span>
              <span className="text-xs font-semibold uppercase text-text-secondary">{item.month}</span>
            </div>
            <div className="min-w-0 flex-1">
              <Typography variant="p" className="font-semibold text-text-primary">{item.title}</Typography>
              <Typography variant="tiny" tone="muted" className="tracking-normal">{item.time} · {item.proof} · {item.points}</Typography>
              <Typography variant="tiny" tone="muted" className="block tracking-normal">Com {item.instructor}</Typography>
              <LiveStatusBadge status={item.status} />
            </div>
            <ChevronRight size={17} />
          </button>
        ))}
      </div>
      <button type="button" className="mt-mx-sm w-full text-center text-sm font-semibold text-mx-green-700" onClick={() => toast.info('Agenda completa carregada na aba Aulas ao Vivo.')}>Ver todas próximas aulas <ChevronRight size={14} className="inline" /></button>
    </Card>
  )
}

function LiveRecordingsCard({ recordings }: { recordings: LiveRecordingItem[] }) {
  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
      <div className="mb-mx-sm flex items-center justify-between gap-mx-sm">
        <Typography variant="h3" className="uppercase">Gravações disponíveis</Typography>
        <button type="button" className="text-xs font-semibold text-mx-green-700" onClick={() => toast.info('Todas as gravações disponíveis já estão listadas nesta aba.')}>Ver todas <ChevronRight size={13} className="inline" /></button>
      </div>
      <div className="space-y-mx-sm">
        {recordings.map((recording) => (
          <div key={recording.title} className="grid grid-cols-[96px_minmax(0,1fr)_54px] items-center gap-mx-sm">
            <div className="relative h-mx-16 overflow-hidden rounded-mx-md bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,.05), rgba(0,0,0,.35)), url(${recording.image})` }}>
              <span className="absolute inset-0 m-auto grid h-mx-9 w-mx-9 place-items-center rounded-full bg-mx-black/70 text-white"><Play size={16} fill="currentColor" /></span>
            </div>
            <div className="min-w-0">
              <Typography variant="p" className="truncate font-semibold text-text-primary">{recording.title}</Typography>
              <Typography variant="tiny" tone="muted" className="tracking-normal">Com {recording.instructor}</Typography>
              <Typography variant="tiny" tone="muted" className="block tracking-normal">{recording.date} · {recording.duration} · {recording.points}</Typography>
              <LiveStatusBadge status={recording.status} />
              <LiveProofBadge proof={recording.proof} />
            </div>
            <div className="text-right">
              <Typography variant="tiny" tone="muted" className="tracking-normal">Nota</Typography>
              <Typography variant="p" className="font-semibold text-text-primary">{recording.grade}</Typography>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function LiveStatusBadge({ status }: { status: string }) {
  if (status === 'Ao vivo' || status === 'Presença validada') return <Badge variant="success" className="mt-1 bg-status-success-surface text-status-success">{status}</Badge>
  if (status === 'Prova pendente') return <Badge variant="warning" className="mt-1 bg-status-warning-surface text-status-warning">{status}</Badge>
  if (status === 'Assistida' || status === 'Inscrito') return <Badge variant="info" className="mt-1 bg-status-info-surface text-status-info">{status}</Badge>
  return <Badge variant="outline" className="mt-1">{status}</Badge>
}

function LiveProofBadge({ proof }: { proof: string }) {
  return <Badge variant={proof === 'Prova pendente' ? 'warning' : 'outline'} className="ml-mx-xs mt-1">{proof}</Badge>
}

function LiveMonthlyScoreCard({ pontos }: { pontos: number }) {
  return (
    <Card className="rounded-mx-lg border border-mx-green-700/15 bg-status-success-surface p-mx-lg shadow-none">
      <div className="flex items-center justify-between gap-mx-md">
        <div className="flex items-center gap-mx-md">
          <span className="grid h-mx-14 w-mx-14 shrink-0 place-items-center rounded-full bg-white text-mx-green-700">
            <Star size={26} />
          </span>
          <div>
            <Typography variant="h3" className="uppercase">Sua pontuação</Typography>
            <Typography variant="p" tone="muted">Participe das aulas, valide sua presença e suba no ranking.</Typography>
          </div>
        </div>
        <div className="text-right">
          <Typography variant="h2" className="text-3xl">{pontos}</Typography>
          <Typography variant="p" className="font-semibold text-text-primary">pts</Typography>
          <Typography variant="tiny" tone="muted" className="tracking-normal">neste mês</Typography>
        </div>
      </div>
    </Card>
  )
}

function AulasEmptyState({ onOpenLibrary, onOpenTrack }: { onOpenLibrary: () => void; onOpenTrack: () => void }) {
  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-xl text-center shadow-none">
      <Typography variant="h2">Nenhuma aula ao vivo agendada no momento.</Typography>
      <Typography variant="p" tone="muted" className="mx-auto mt-mx-xs max-w-2xl">
        Quando sua loja ou MX agendar uma aula, ela aparecerá aqui com link de participação, horário, prova de validação e pontuação no Score.
      </Typography>
      <div className="mt-mx-lg flex flex-wrap justify-center gap-mx-xs">
        <Button variant="outline" onClick={onOpenLibrary}>Ver Biblioteca</Button>
        <Button onClick={onOpenTrack}>Ver Trilha obrigatória</Button>
        <Button variant="ghost" onClick={onOpenLibrary}>Ver gravações</Button>
      </div>
    </Card>
  )
}

type ProofStatus = 'Pendente' | 'Aprovada' | 'Reprovada' | 'Expirada' | 'Em andamento'

type ProofRow = {
  title: string
  origin: 'Aula ao Vivo' | 'Biblioteca' | 'Trilha'
  context: string
  required: boolean
  minGrade: string
  userGrade: string
  status: ProofStatus
  deadline: string
  attempts: string
  action: string
}

type ProofScheduleItem = {
  dayLabel: string
  day: string
  month: string
  title: string
  deadline: string
  origin: ProofRow['origin']
}

const PROOF_ROWS: ProofRow[] = [
  {
    title: 'Técnicas de Fechamento',
    origin: 'Aula ao Vivo',
    context: 'Negociação sem desconto',
    required: true,
    minGrade: '70%',
    userGrade: '—',
    status: 'Pendente',
    deadline: 'Hoje 23:59',
    attempts: '0/1',
    action: 'Iniciar',
  },
  {
    title: 'Negociação sem desconto',
    origin: 'Biblioteca',
    context: 'Conteúdo livre',
    required: false,
    minGrade: '70%',
    userGrade: '90%',
    status: 'Aprovada',
    deadline: 'Concluída',
    attempts: '1/1',
    action: 'Ver resultado',
  },
  {
    title: 'História, valores e cultura da loja',
    origin: 'Trilha',
    context: 'Módulo institucional',
    required: true,
    minGrade: '70%',
    userGrade: '85%',
    status: 'Aprovada',
    deadline: 'Concluída',
    attempts: '1/1',
    action: 'Ver resultado',
  },
  {
    title: 'Pós-venda que gera indicação',
    origin: 'Biblioteca',
    context: 'Relacionamento',
    required: false,
    minGrade: '70%',
    userGrade: '60%',
    status: 'Reprovada',
    deadline: 'Encerrada',
    attempts: '1/1',
    action: 'Ver resultado',
  },
  {
    title: 'Como lidar com objeções de preço',
    origin: 'Aula ao Vivo',
    context: 'Fechamento',
    required: true,
    minGrade: '70%',
    userGrade: '80%',
    status: 'Aprovada',
    deadline: 'Concluída',
    attempts: '1/1',
    action: 'Ver resultado',
  },
]

const PROOF_SCHEDULE: ProofScheduleItem[] = [
  { dayLabel: 'QUI', day: '29', month: 'MAI', title: 'Técnicas de Fechamento', deadline: 'Prazo: hoje até 23:59', origin: 'Aula ao Vivo' },
  { dayLabel: 'QUI', day: '12', month: 'JUN', title: 'História, valores e cultura da loja', deadline: 'Prazo: 10/06 até 23:59', origin: 'Trilha' },
  { dayLabel: 'QUI', day: '26', month: 'JUN', title: 'Pós-venda que gera indicação', deadline: 'Prazo: 24/06 até 23:59', origin: 'Biblioteca' },
]

function ProvasTab({
  trainings,
  scoreSnapshot,
  onOpenAulas,
  onOpenTrack,
}: {
  trainings: TrainingWithProgress[]
  scoreSnapshot: ScoreSnapshot
  onOpenAulas: () => void
  onOpenTrack: () => void
}) {
  const completedProofs = Math.max(PROOF_ROWS.filter((proof) => proof.status === 'Aprovada').length, trainings.filter((training) => training.watched).length)
  const scorePoints = Math.max(scoreSnapshot.earned, 210)

  const handleProofAction = (proof: ProofRow) => {
    if (proof.status === 'Pendente') {
      onOpenAulas()
      toast.info('Acesse a aula para iniciar a prova.')
      return
    }

    if (proof.origin === 'Trilha') {
      onOpenTrack()
      return
    }

    toast.info(`${proof.title} — nota: ${proof.userGrade || 'N/A'}.`)
  }

  return (
    <section className="space-y-mx-lg" aria-label="Provas">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => document.getElementById('provas-como-funciona')?.scrollIntoView({ behavior: 'smooth' })}>
          <Info size={16} /> Como funciona
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-mx-sm md:grid-cols-3 xl:grid-cols-6" aria-label="Indicadores de Provas">
        <ProofMetricCard icon={<FileQuestion size={22} />} label="Provas pendentes" value="2" hint="para realizar" tone="warning" />
        <ProofMetricCard icon={<CheckCircle size={22} />} label="Provas aprovadas" value="8" hint="concluídas" tone="success" />
        <ProofMetricCard icon={<X size={22} />} label="Reprovadas" value="1" hint="neste mês" tone="danger" />
        <ProofMetricCard icon={<Star size={22} />} label="Média nas provas" value="87%" hint="de aproveitamento" tone="brand" />
        <ProofMetricCard icon={<Target size={22} />} label="Presenças validadas" value="5" hint="neste mês" tone="success" />
        <ProofMetricCard icon={<Award size={22} />} label="Pontos no Score" value={`${scorePoints} pts`} hint="neste mês" tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-mx-lg xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-mx-md">
          <div className="grid grid-cols-1 gap-mx-md lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <NextRequiredProofCard onOpenAulas={onOpenAulas} />
            <ProofRulesCard />
          </div>

          <ProofHowItWorks />
          <ProofRecentMetrics completedProofs={Math.max(completedProofs, 9)} scorePoints={scorePoints} />
          <MyProofsTable proofs={PROOF_ROWS} onAction={handleProofAction} />
          <ProofCertificatesBanner />
        </div>

        <aside className="space-y-mx-md" aria-label="Agenda e resultados de Provas">
          <ProofScheduleCard items={PROOF_SCHEDULE} />
          <ProofResultsCard results={PROOF_ROWS.filter((proof) => proof.status === 'Aprovada').slice(0, 3)} />
          <ProofMonthlyScoreCard scorePoints={scorePoints} />
        </aside>
      </div>
    </section>
  )
}

function ProofMetricCard({ icon, label, value, hint, tone }: { icon: ReactNode; label: string; value: string; hint: string; tone: 'brand' | 'success' | 'warning' | 'danger' }) {
  const toneClass = tone === 'success'
    ? 'bg-status-success-surface text-status-success'
    : tone === 'warning'
      ? 'bg-status-warning-surface text-status-warning'
      : tone === 'danger'
        ? 'bg-status-error-surface text-status-error'
        : 'bg-accent-purple-soft text-accent-purple'

  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-md shadow-none">
      <div className="flex items-center gap-mx-sm">
        <span className={cn('grid h-mx-11 w-mx-11 shrink-0 place-items-center rounded-full', toneClass)}>{icon}</span>
        <div>
          <Typography variant="caption" className="tracking-normal text-text-primary">{label}</Typography>
          <Typography variant="h2" className="text-2xl tracking-normal">{value}</Typography>
          <Typography variant="tiny" tone="muted" className="tracking-normal">{hint}</Typography>
        </div>
      </div>
    </Card>
  )
}

function NextRequiredProofCard({ onOpenAulas }: { onOpenAulas: () => void }) {
  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
      <Typography variant="h3" className="mb-mx-md uppercase">Próxima prova obrigatória</Typography>
      <div className="flex flex-col gap-mx-lg lg:flex-row lg:items-center">
        <span className="grid h-28 w-28 shrink-0 place-items-center rounded-full bg-status-success-surface text-mx-green-700">
          <ClipboardCheck size={54} />
        </span>
        <div className="min-w-0 flex-1">
          <Typography variant="h2" className="text-3xl">Técnicas de Fechamento</Typography>
          <Typography variant="p" className="mt-mx-xs font-semibold text-mx-green-700">
            Aula ao Vivo <span className="text-text-tertiary">• Negociação sem desconto</span>
          </Typography>
          <div className="mt-mx-md grid grid-cols-1 gap-mx-sm text-sm font-semibold text-text-secondary sm:grid-cols-2">
            <span className="inline-flex items-center gap-mx-xs"><ClipboardCheck size={16} /> 5 questões</span>
            <span className="inline-flex items-center gap-mx-xs"><CalendarDays size={16} /> Prazo: hoje até 23:59</span>
            <span className="inline-flex items-center gap-mx-xs"><Target size={16} /> Nota mínima: 70%</span>
            <span className="inline-flex items-center gap-mx-xs"><Star size={16} /> Pontuação: +20 pts no Score</span>
            <span className="inline-flex items-center gap-mx-xs"><Clock size={16} /> Tempo estimado: 8 min</span>
          </div>
        </div>
      </div>
      <div className="mt-mx-md rounded-mx-md border border-mx-green-700/20 bg-status-success-surface px-mx-sm py-mx-xs">
        <Typography variant="p" className="font-semibold text-mx-green-700">Ao atingir 70% ou mais, sua presença será validada automaticamente.</Typography>
      </div>
      <div className="mt-mx-md flex flex-wrap gap-mx-sm">
        <Button onClick={() => toast.info('Fluxo de prova será aberto pelo player da aula.')}>Iniciar prova</Button>
        <Button variant="outline" onClick={onOpenAulas}><BookOpen size={16} /> Ver conteúdo</Button>
        <Button variant="ghost" onClick={() => document.getElementById('provas-como-funciona')?.scrollIntoView({ behavior: 'smooth' })}>
          <Info size={16} /> Como funciona
        </Button>
      </div>
    </Card>
  )
}

function ProofRulesCard() {
  const rules = ['5 questões objetivas', 'nota mínima 70%', '1 tentativa por prova', 'libera presença validada', 'gera pontuação no Score MX']

  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
      <Typography variant="h3" className="uppercase">Regras da prova</Typography>
      <div className="mt-mx-md space-y-mx-sm">
        {rules.map((rule) => (
          <div key={rule} className="flex items-center gap-mx-sm text-sm font-semibold text-text-secondary">
            <CheckCircle size={16} className="text-status-success" />
            <span>{rule}</span>
          </div>
        ))}
      </div>
      <div className="mt-mx-lg flex items-center justify-between rounded-mx-md border border-mx-green-700/15 bg-status-success-surface p-mx-md">
        <div className="flex items-center gap-mx-sm">
          <TrendingUp size={24} className="text-mx-green-700" />
          <Typography variant="p" className="font-semibold text-text-primary">Impacto no Score</Typography>
        </div>
        <Typography variant="h2">+20 pts</Typography>
      </div>
    </Card>
  )
}

function ProofHowItWorks() {
  const steps = [
    { icon: <ClipboardCheck size={22} />, title: '1. Acesse a prova', text: 'Localize a prova na sua lista.' },
    { icon: <FileQuestion size={22} />, title: '2. Responda 5 questões', text: 'São questões objetivas e rápidas.' },
    { icon: <CheckCircle size={22} />, title: '3. Atinga 70% ou mais', text: 'Esse é o mínimo para aprovação.' },
    { icon: <Target size={22} />, title: '4. Valide sua presença', text: 'Sua presença é validada automaticamente.' },
    { icon: <Star size={22} />, title: '5. Ganhe pontos no Score', text: 'Cada aprovação impulsiona seu Score.' },
  ]

  return (
    <Card id="provas-como-funciona" className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
      <Typography variant="h3" className="mb-mx-md uppercase">Como funciona</Typography>
      <div className="grid grid-cols-1 gap-mx-md lg:grid-cols-5">
        {steps.map((step, index) => (
          <div key={step.title} className="flex items-start gap-mx-sm">
            <span className="grid h-mx-11 w-mx-11 shrink-0 place-items-center rounded-full bg-status-success-surface text-mx-green-700">{step.icon}</span>
            <div>
              <Typography variant="p" className="font-semibold text-text-primary">{step.title}</Typography>
              <Typography variant="tiny" tone="muted" className="tracking-normal">{step.text}</Typography>
            </div>
            {index < steps.length - 1 && <ChevronRight size={16} className="ml-auto mt-mx-sm hidden text-text-tertiary lg:block" />}
          </div>
        ))}
      </div>
    </Card>
  )
}

function ProofRecentMetrics({ completedProofs, scorePoints }: { completedProofs: number; scorePoints: number }) {
  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
      <Typography variant="h3" className="uppercase">Suas provas recentes</Typography>
      <div className="mt-mx-md grid grid-cols-1 gap-mx-md md:grid-cols-4">
        <ProofRecentMetric icon={<CheckCircle size={22} />} label="Provas concluídas" value={String(completedProofs)} hint="nos últimos 30 dias" />
        <ProofRecentMetric icon={<Target size={22} />} label="Média de acertos" value="87%" hint="nas provas" />
        <ProofRecentMetric icon={<Star size={22} />} label="Pontos conquistados" value={String(scorePoints)} hint="em provas" />
        <ProofRecentMetric icon={<Clock size={22} />} label="Horas estudadas" value="7h 30m" hint="nas últimas 4 semanas" />
      </div>
    </Card>
  )
}

function ProofRecentMetric({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="flex items-center gap-mx-md rounded-mx-md border border-border-default p-mx-md">
      <span className="grid h-mx-12 w-mx-12 shrink-0 place-items-center rounded-full bg-status-success-surface text-mx-green-700">{icon}</span>
      <div>
        <Typography variant="caption" className="tracking-normal text-text-primary">{label}</Typography>
        <Typography variant="h2" className="text-2xl">{value}</Typography>
        <Typography variant="tiny" tone="muted" className="tracking-normal">{hint}</Typography>
      </div>
    </div>
  )
}

function MyProofsTable({ proofs, onAction }: { proofs: ProofRow[]; onAction: (proof: ProofRow) => void }) {
  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
      <Typography variant="h3" className="uppercase">Minhas provas</Typography>
      <div className="mt-mx-sm overflow-x-auto rounded-mx-md border border-border-default">
        <table className="min-w-[1060px] w-full text-left text-xs">
          <thead className="bg-surface-alt text-text-tertiary">
            <tr>
              {['Prova', 'Origem', 'Obrigatória', 'Nota mínima', 'Sua nota', 'Status', 'Prazo', 'Tentativas', 'Ação'].map((header) => (
                <th scope="col" key={header} className="px-mx-sm py-mx-xs font-semibold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-white">
            {proofs.map((proof) => (
              <tr key={proof.title}>
                <td className="px-mx-sm py-mx-xs font-semibold text-text-primary">{proof.title}</td>
                <td className="px-mx-sm py-mx-xs">
                  <Typography variant="tiny" className="block font-semibold tracking-normal text-text-primary">{proof.origin}</Typography>
                  <Typography variant="tiny" tone="muted" className="tracking-normal">{proof.context}</Typography>
                </td>
                <td className="px-mx-sm py-mx-xs"><Badge variant={proof.required ? 'warning' : 'outline'}>{proof.required ? 'Sim' : 'Não'}</Badge></td>
                <td className="px-mx-sm py-mx-xs font-semibold text-text-secondary">{proof.minGrade}</td>
                <td className="px-mx-sm py-mx-xs font-semibold text-text-secondary">{proof.userGrade}</td>
                <td className="px-mx-sm py-mx-xs"><ProofStatusBadge status={proof.status} /></td>
                <td className="px-mx-sm py-mx-xs font-semibold text-text-secondary">{proof.deadline}</td>
                <td className="px-mx-sm py-mx-xs font-semibold text-text-secondary">{proof.attempts}</td>
                <td className="px-mx-sm py-mx-xs">
                  <Button variant={proof.status === 'Pendente' ? 'primary' : 'outline'} size="xs" onClick={() => onAction(proof)}>
                    {proof.status === 'Pendente' ? <Play size={14} /> : <Eye size={14} />} {proof.action}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function ProofStatusBadge({ status }: { status: ProofStatus }) {
  if (status === 'Aprovada') return <Badge variant="success" className="bg-status-success-surface text-status-success">{status}</Badge>
  if (status === 'Reprovada') return <Badge variant="danger" className="bg-status-error-surface text-status-error">{status}</Badge>
  if (status === 'Pendente') return <Badge variant="warning" className="bg-status-warning-surface text-status-warning">{status}</Badge>
  if (status === 'Em andamento') return <Badge variant="info" className="bg-status-info-surface text-status-info">{status}</Badge>
  return <Badge variant="outline">{status}</Badge>
}

function ProofScheduleCard({ items }: { items: ProofScheduleItem[] }) {
  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
      <div className="mb-mx-sm flex items-center justify-between gap-mx-sm">
        <Typography variant="h3" className="uppercase">Agenda de provas</Typography>
        <button type="button" className="text-xs font-semibold text-mx-green-700" onClick={() => window.open(buildCalendarUrl(), '_blank', 'noopener')}>Ver calendário completo <ChevronRight size={13} className="inline" /></button>
      </div>
      <div className="divide-y divide-border-default">
        {items.map((item) => (
          <button key={item.title} type="button" className="flex w-full items-center gap-mx-md py-mx-sm text-left" onClick={() => toast.info(`Prova agendada: ${item.title}`)}>
            <div className="flex h-mx-16 w-mx-14 shrink-0 flex-col items-center justify-center rounded-mx-md bg-status-success-surface">
              <span className="text-xs font-semibold uppercase text-mx-green-700">{item.dayLabel}</span>
              <span className="text-2xl font-semibold text-text-primary">{item.day}</span>
              <span className="text-xs font-semibold uppercase text-text-secondary">{item.month}</span>
            </div>
            <div className="min-w-0 flex-1">
              <Typography variant="p" className="font-semibold text-text-primary">{item.title}</Typography>
              <Typography variant="tiny" tone="muted" className="tracking-normal">{item.deadline}</Typography>
              <Badge variant="outline" className="mt-1">{item.origin}</Badge>
            </div>
            <ChevronRight size={17} />
          </button>
        ))}
      </div>
      <button type="button" className="mt-mx-sm w-full text-center text-sm font-semibold text-mx-green-700" onClick={() => toast.info('Todas as provas agendadas já estão listadas nesta agenda.')}>Ver todas provas agendadas <ChevronRight size={14} className="inline" /></button>
    </Card>
  )
}

function ProofResultsCard({ results }: { results: ProofRow[] }) {
  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
      <div className="mb-mx-sm flex items-center justify-between gap-mx-sm">
        <Typography variant="h3" className="uppercase">Últimos resultados</Typography>
        <button type="button" className="text-xs font-semibold text-mx-green-700" onClick={() => toast.info('Histórico completo de provas sincronizado com resultados validados.')}>Ver todas <ChevronRight size={13} className="inline" /></button>
      </div>
      <div className="divide-y divide-border-default">
        {results.map((result, index) => (
          <button key={result.title} type="button" className="grid w-full grid-cols-[minmax(0,1fr)_56px_90px_18px] items-center gap-mx-sm py-mx-sm text-left" onClick={() => toast.info(`${result.title} — nota: ${result.userGrade}`)}>
            <div className="min-w-0">
              <Typography variant="p" className="truncate font-semibold text-text-primary">{result.title}</Typography>
              <Typography variant="tiny" tone="muted" className="tracking-normal">{result.origin} • Concluída em {index === 0 ? '13/06/2026' : index === 1 ? '10/06/2026' : '05/06/2026'}</Typography>
            </div>
            <Typography variant="p" className="font-semibold text-text-primary">{result.userGrade}</Typography>
            <ProofStatusBadge status={result.status} />
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
    </Card>
  )
}

function ProofCertificatesBanner() {
  return (
    <Card className="rounded-mx-lg border border-mx-green-700/15 bg-status-success-surface p-mx-lg shadow-none">
      <div className="flex flex-col gap-mx-md md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-mx-md">
          <span className="grid h-mx-14 w-mx-14 shrink-0 place-items-center rounded-full bg-white text-mx-green-700">
            <Medal size={28} />
          </span>
          <div>
            <Typography variant="h3">Aprendizado validado gera resultado!</Typography>
            <Typography variant="p" tone="muted">Conclua as provas obrigatórias, valide presença e aumente seu Score MX.</Typography>
          </div>
        </div>
        <Button variant="outline" onClick={() => toast.info('Certificados sincronizados com provas aprovadas e presenças validadas.')}><Award size={16} /> Ver meus certificados</Button>
      </div>
    </Card>
  )
}

function ProofMonthlyScoreCard({ scorePoints }: { scorePoints: number }) {
  return (
    <Card className="rounded-mx-lg border border-mx-green-700/15 bg-status-success-surface p-mx-lg shadow-none">
      <div className="flex items-center justify-between gap-mx-md">
        <div className="flex items-center gap-mx-md">
          <span className="grid h-mx-14 w-mx-14 shrink-0 place-items-center rounded-full bg-white text-mx-green-700">
            <Star size={26} />
          </span>
          <div>
            <Typography variant="h3" className="uppercase">Sua pontuação</Typography>
            <Typography variant="p" tone="muted">Participe das provas, valide sua presença e suba no ranking.</Typography>
          </div>
        </div>
        <div className="text-right">
          <Typography variant="h2" className="text-3xl">{scorePoints}</Typography>
          <Typography variant="p" className="font-semibold text-text-primary">pts</Typography>
          <Typography variant="tiny" tone="muted" className="tracking-normal">neste mês</Typography>
        </div>
      </div>
    </Card>
  )
}

function TrainingFeatureCard({
  recommendation,
  index,
  onStart,
}: {
  recommendation: RecommendedDevelopmentCard<TrainingWithProgress>
  index: number
  onStart: () => void
}) {
  const training = recommendation.training
  const status = training.watched ? 'Concluído' : recommendation.recommendation?.status === 'in_progress' ? 'Em andamento' : 'Não iniciado'

  return (
    <Card className="overflow-hidden rounded-mx-lg border border-border-default bg-white shadow-none">
      <div className="relative h-mx-64 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to bottom, rgba(10,10,11,.05), rgba(10,10,11,.58)), url(${CARD_IMAGES[index % CARD_IMAGES.length]})` }}>
        <Badge variant={recommendation.priority === 'high' ? 'warning' : 'brand'} className="absolute left-mx-sm top-mx-sm rounded-mx-full">{recommendation.sourceLabel}</Badge>
        <span className="absolute left-1/2 top-1/2 grid h-mx-14 w-mx-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-mx-black/70 text-white ring-2 ring-white/40"><Play size={22} fill="currentColor" /></span>
      </div>
      <div className="p-mx-md">
        <Typography variant="tiny" tone="brand" className="mb-mx-xs block tracking-normal">{THEME_LABELS[recommendation.theme] || recommendation.theme}</Typography>
        <Typography variant="h3" className="line-clamp-2">{training.title}</Typography>
        <Typography variant="p" tone="muted" className="mt-mx-xs line-clamp-2">{recommendation.reason}</Typography>
        <div className="mt-mx-sm flex flex-wrap gap-mx-md text-sm font-semibold text-text-secondary">
          <span className="inline-flex items-center gap-1"><Clock size={15} /> {training.duration_minutes || 18} min</span>
          <span>{getTrainingLevel(index)}</span>
          <span>{status}</span>
          <span className="text-mx-green-700">+{getTrainingPoints(training, index === 2 ? 20 : 30)} pts</span>
        </div>
        <div className="mt-mx-md flex gap-mx-xs">
          <Button variant="outline" className="flex-1" onClick={onStart}>Assistir agora</Button>
          <Button variant="outline" size="icon" aria-label="Favoritar" onClick={() => toast.success(`${training.title} salvo nos favoritos.`)}><Bookmark size={16} /></Button>
        </div>
      </div>
    </Card>
  )
}

function getLibraryCardMeta(training: TrainingWithProgress, index: number) {
  const theme = inferDevelopmentTheme(training)
  const typeCycle = ['Aula', 'Checklist', 'Script', 'Playbook', 'Modelo de mensagem', 'Gravação', 'Prova']
  const isMandatory = theme === 'fechamento' && index % 2 === 0
  const isRecommended = index % 3 === 1
  const status = training.watched
    ? 'Concluído'
    : isMandatory
      ? 'Faz parte da trilha'
      : index % 4 === 2
        ? 'Em andamento'
        : index % 5 === 3
          ? 'Salvo'
          : 'Não iniciado'
  const classification = isMandatory ? 'Obrigatório' : isRecommended ? 'Recomendado' : 'Livre'
  const pointsScore = isMandatory || isRecommended
  const cta = training.watched
    ? 'Rever conteúdo'
    : status === 'Em andamento'
      ? 'Continuar'
      : index % 5 === 1
        ? 'Aplicar na carteira'
        : typeCycle[index % typeCycle.length] === 'Prova'
          ? 'Responder prova'
          : 'Assistir agora'

  return {
    theme,
    type: typeCycle[index % typeCycle.length],
    level: getTrainingLevel(index),
    status,
    classification,
    pointsScore,
    cta,
  }
}

function LibraryCard({ training, index }: { training: TrainingWithProgress; index: number }) {
  const meta = getLibraryCardMeta(training, index)

  return (
    <Card className="overflow-hidden rounded-mx-lg border border-border-default bg-white shadow-none">
      <div className="relative h-mx-32 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to bottom, rgba(10,10,11,.04), rgba(10,10,11,.45)), url(${CARD_IMAGES[index % CARD_IMAGES.length]})` }}>
        <Badge variant="brand" className="absolute left-mx-xs top-mx-xs rounded-mx-full">{THEME_LABELS[meta.theme] || meta.theme}</Badge>
        <span className="absolute left-1/2 top-1/2 grid h-mx-10 w-mx-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-mx-black/70 text-white ring-2 ring-white/40"><Play size={18} fill="currentColor" /></span>
        <span className="absolute bottom-mx-xs left-mx-xs inline-flex items-center gap-1 rounded-full bg-mx-black/70 px-2 py-1 text-xs font-semibold text-white"><Clock size={12} /> {training.duration_minutes || 16} min</span>
      </div>
      <div className="p-mx-sm">
        <Typography variant="p" className="line-clamp-2 font-semibold text-text-primary">{training.title}</Typography>
        <Typography variant="tiny" tone="muted" className="mt-mx-xs block tracking-normal">{training.description || 'Conteúdo livre para reforço.'}</Typography>
        <div className="mt-mx-sm flex flex-wrap gap-mx-xs">
          <Badge variant="outline">{meta.level}</Badge>
          <Badge variant="outline">{meta.type}</Badge>
          <Badge variant={meta.status === 'Concluído' ? 'success' : meta.status === 'Em andamento' ? 'info' : 'outline'}>{meta.status}</Badge>
          <Badge variant={meta.classification === 'Obrigatório' ? 'warning' : meta.classification === 'Recomendado' ? 'info' : 'success'}>{meta.classification}</Badge>
          <Badge variant={meta.pointsScore ? 'success' : 'outline'}>{meta.pointsScore ? 'Pontua no Score' : 'Não pontua'}</Badge>
        </div>
        <div className="mt-mx-sm flex items-center justify-between gap-mx-xs">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 justify-start"
            onClick={() => {
              if (meta.cta === 'Aplicar na carteira') window.location.assign('/carteira-clientes?filtro=sem-resposta')
              else toast.info(`${meta.cta}: ${training.title}`)
            }}
          >
            <Play size={14} /> {meta.cta}
          </Button>
          <div className="flex gap-mx-xs">
            <Button variant="ghost" size="icon" aria-label="Favoritar conteúdo" onClick={() => toast.success(`${training.title} salvo nos favoritos.`)}><Bookmark size={16} /></Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function ThemePill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-mx-md border px-mx-sm py-mx-xs text-sm font-semibold transition-colors',
        active ? 'border-mx-green-700 bg-mx-green-700 text-white' : 'border-border-default bg-white text-text-primary hover:bg-surface-alt',
      )}
    >
      {children}
    </button>
  )
}
