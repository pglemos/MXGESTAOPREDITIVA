import { Link } from 'react-router-dom'
import { Award, GraduationCap, Lock, Play, Sparkles, Target, TrendingUp, Trophy } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { cn } from '@/lib/utils'

type Trilha = {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  modules: number
  completedModules: number
  status: 'em_andamento' | 'concluida' | 'bloqueada' | 'recomendada'
  category: 'onboarding' | 'tecnica' | 'lideranca'
  estimatedHours: number
}

const trilhasMock: Trilha[] = [
  {
    id: 'novo-colaborador',
    title: 'Trilha de Novo Colaborador',
    description: 'Onboarding completo: cultura MX, métricas, processo comercial, ferramentas e expectativas.',
    icon: <GraduationCap size={22} />,
    modules: 5,
    completedModules: 3,
    status: 'em_andamento',
    category: 'onboarding',
    estimatedHours: 6,
  },
  {
    id: 'funil-comercial',
    title: 'Funil Comercial MX',
    description: 'Domine cada etapa do funil: leads, agendamento, visita, negociação e fechamento com método.',
    icon: <Target size={22} />,
    modules: 4,
    completedModules: 4,
    status: 'concluida',
    category: 'tecnica',
    estimatedHours: 5,
  },
  {
    id: 'rotina-diaria',
    title: 'Rotina Diária de Alta Performance',
    description: 'Estruture sua semana com base nos rituais MX: matinal, follow-up, fechamento e revisão.',
    icon: <Sparkles size={22} />,
    modules: 5,
    completedModules: 2,
    status: 'em_andamento',
    category: 'tecnica',
    estimatedHours: 4,
  },
  {
    id: 'tecnicas-fechamento',
    title: 'Técnicas Avançadas de Fechamento',
    description: 'Quebra de objeções, criação de urgência, ancoragem de valor e fechamento consultivo.',
    icon: <Award size={22} />,
    modules: 6,
    completedModules: 0,
    status: 'recomendada',
    category: 'tecnica',
    estimatedHours: 8,
  },
  {
    id: 'lideranca-comercial',
    title: 'Liderança Comercial',
    description: 'Caminho para se tornar líder de equipe: gestão de pessoas, coaching e indicadores.',
    icon: <Trophy size={22} />,
    modules: 7,
    completedModules: 0,
    status: 'bloqueada',
    category: 'lideranca',
    estimatedHours: 12,
  },
  {
    id: 'pos-venda',
    title: 'Pós-Venda e Retenção',
    description: 'Acompanhamento de carteira, NPS, indicações e estratégias para clientes recorrentes.',
    icon: <TrendingUp size={22} />,
    modules: 4,
    completedModules: 0,
    status: 'recomendada',
    category: 'tecnica',
    estimatedHours: 4,
  },
]

const statusConfig: Record<Trilha['status'], { label: string; pill: string; iconBg: string; iconText: string; barColor: string }> = {
  em_andamento: {
    label: 'Em andamento',
    pill: 'bg-status-info-surface text-status-info',
    iconBg: 'bg-status-info-surface',
    iconText: 'text-status-info',
    barColor: 'bg-status-info',
  },
  concluida: {
    label: 'Concluída',
    pill: 'bg-status-success-surface text-status-success',
    iconBg: 'bg-status-success-surface',
    iconText: 'text-status-success',
    barColor: 'bg-status-success',
  },
  bloqueada: {
    label: 'Bloqueada',
    pill: 'bg-surface-alt text-text-tertiary',
    iconBg: 'bg-surface-alt',
    iconText: 'text-text-tertiary',
    barColor: 'bg-border-default',
  },
  recomendada: {
    label: 'Recomendada',
    pill: 'bg-[var(--color-accent-purple-soft)] text-[var(--color-accent-purple)]',
    iconBg: 'bg-[var(--color-accent-purple-soft)]',
    iconText: 'text-[var(--color-accent-purple)]',
    barColor: 'bg-[var(--color-accent-purple)]',
  },
}

const categoryLabels: Record<Trilha['category'], string> = {
  onboarding: 'Onboarding',
  tecnica: 'Técnica',
  lideranca: 'Liderança',
}

export default function TrilhasVendedor() {
  const total = trilhasMock.length
  const concluidas = trilhasMock.filter(t => t.status === 'concluida').length
  const emAndamento = trilhasMock.filter(t => t.status === 'em_andamento').length
  const totalHours = trilhasMock.reduce((acc, t) => acc + t.estimatedHours, 0)

  return (
    <div className="flex flex-col gap-mx-lg p-mx-lg pb-28">
      <header className="flex flex-col gap-mx-md border-b border-border-subtle pb-mx-lg lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Typography variant="h1" className="text-3xl md:text-4xl">Minhas Trilhas</Typography>
          <Typography variant="p" tone="muted" className="mt-mx-xs">Caminhos de desenvolvimento alinhados ao seu papel e ambição.</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-black uppercase tracking-widest">{total} trilhas · {totalHours}h estimadas</Typography>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-mx-md sm:grid-cols-3">
        <Card className="rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none">
          <div className="flex items-center gap-mx-sm">
            <span className="flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-full bg-status-success text-white shadow-mx-sm" aria-hidden="true">
              <Trophy size={18} />
            </span>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Concluídas</Typography>
          </div>
          <Typography variant="h2" className="mt-mx-md text-3xl font-black tabular-nums">{concluidas}</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-bold normal-case">de {total} trilhas</Typography>
        </Card>

        <Card className="rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none">
          <div className="flex items-center gap-mx-sm">
            <span className="flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-full bg-status-info text-white shadow-mx-sm" aria-hidden="true">
              <Play size={18} />
            </span>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Em andamento</Typography>
          </div>
          <Typography variant="h2" className="mt-mx-md text-3xl font-black tabular-nums">{emAndamento}</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-bold normal-case">continue de onde parou</Typography>
        </Card>

        <Card className="rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none">
          <div className="flex items-center gap-mx-sm">
            <span className="flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-full text-white shadow-mx-sm" style={{ background: 'linear-gradient(135deg, var(--color-accent-purple) 0%, var(--color-accent-purple-strong) 100%)' }} aria-hidden="true">
              <Sparkles size={18} />
            </span>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Recomendadas</Typography>
          </div>
          <Typography variant="h2" className="mt-mx-md text-3xl font-black tabular-nums">{trilhasMock.filter(t => t.status === 'recomendada').length}</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-bold normal-case">pelo Consultor MX IA</Typography>
        </Card>
      </section>

      {/* Trilhas grid */}
      <section className="grid grid-cols-1 gap-mx-md md:grid-cols-2 xl:grid-cols-3">
        {trilhasMock.map((trilha) => {
          const status = statusConfig[trilha.status]
          const progress = trilha.modules > 0 ? Math.round((trilha.completedModules / trilha.modules) * 100) : 0
          const isLocked = trilha.status === 'bloqueada'
          const ctaLabel = trilha.status === 'concluida' ? 'Revisar' : trilha.status === 'em_andamento' ? 'Continuar' : isLocked ? 'Bloqueada' : 'Iniciar'
          return (
            <Card key={trilha.id} className={cn('rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none flex flex-col', isLocked && 'opacity-70')}>
              <div className="flex items-start justify-between gap-mx-sm">
                <span className={cn('flex h-mx-12 w-mx-12 items-center justify-center rounded-mx-xl', status.iconBg, status.iconText)} aria-hidden="true">
                  {trilha.icon}
                </span>
                <span className={cn('inline-flex items-center rounded-mx-full px-mx-sm py-mx-tiny text-mx-tiny font-black uppercase tracking-tight', status.pill)}>
                  {status.label}
                </span>
              </div>

              <div className="mt-mx-md flex-1">
                <Typography variant="tiny" tone="muted" className="block font-black uppercase tracking-widest">{categoryLabels[trilha.category]}</Typography>
                <Typography variant="h3" className="mt-mx-tiny text-lg font-black leading-tight">{trilha.title}</Typography>
                <Typography variant="p" tone="muted" className="mt-mx-xs text-sm leading-snug">{trilha.description}</Typography>
              </div>

              <div className="mt-mx-md space-y-mx-xs">
                <div className="flex items-center justify-between text-mx-tiny font-black uppercase tracking-widest">
                  <span className="text-text-tertiary">{trilha.completedModules}/{trilha.modules} módulos · {trilha.estimatedHours}h</span>
                  <span className="text-text-secondary tabular-nums">{progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-mx-full bg-surface-alt">
                  <div className={cn('h-full rounded-mx-full transition-all', status.barColor)} style={{ width: `${progress}%` }} />
                </div>
              </div>

              {isLocked ? (
                <button
                  type="button"
                  disabled
                  className="mt-mx-md flex h-mx-11 w-full items-center justify-center gap-mx-xs rounded-mx-xl bg-surface-alt text-sm font-black text-text-tertiary cursor-not-allowed"
                >
                  <Lock size={14} /> {ctaLabel}
                </button>
              ) : (
                <Link
                  to="/treinamentos"
                  className="mt-mx-md flex h-mx-11 w-full items-center justify-center gap-mx-xs rounded-mx-xl bg-status-info text-white text-sm font-black hover:bg-status-info/90 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-status-info/30"
                >
                  <Play size={14} /> {ctaLabel}
                </Link>
              )}
            </Card>
          )
        })}
      </section>
    </div>
  )
}
