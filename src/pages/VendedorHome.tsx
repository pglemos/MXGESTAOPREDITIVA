import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  CalendarDays,
  Target,
  Trophy,
  BookOpen,
  TrendingUp,
  Users,
  ClipboardCheck,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useVendedorHomePage } from '@/features/vendedor-home/hooks/useVendedorHomePage'
import { useAgendamentos } from '@/features/crm/hooks/useAgendamentos'
import { useOportunidades } from '@/features/crm/hooks/useOportunidades'
import { useRanking } from '@/hooks/useRanking'

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function isToday(iso: string) {
  const d = new Date(iso)
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

export default function VendedorHomePage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const home = useVendedorHomePage()
  const { agendamentos, metrics: agendaMetrics } = useAgendamentos()
  const { oportunidades } = useOportunidades()
  const { ranking } = useRanking()

  const firstName = profile?.name?.trim().split(/\s+/)[0] || 'Vendedor'
  const todayLabel = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo',
  }).format(new Date())

  const meta = home.metrics?.meta ?? 0
  const vendas = home.metrics?.vendasMes ?? 0
  const faltam = Math.max(meta - vendas, 0)
  const atingimento = home.metrics?.atingimento ?? 0
  const atingimentoPct = Math.min(100, Math.round(atingimento))

  const agendaHoje = useMemo(() => agendamentos.filter(a => isToday(a.data_hora)), [agendamentos])

  const oportunidadesAtivas = useMemo(
    () => oportunidades.filter(o => o.etapa !== 'ganho' && o.etapa !== 'perdido'),
    [oportunidades],
  )

  const posicaoRanking = useMemo(() => {
    if (!profile?.id || !ranking?.length) return null
    const idx = ranking.findIndex(r => r.user_id === profile.id)
    return idx >= 0 ? idx + 1 : null
  }, [ranking, profile?.id])

  const disciplina = home.discipline?.percentage ?? 0

  const ritualItems = [
    { label: 'Fechamento Diário enviado', done: Boolean(home.todayCheckin) },
    { label: `${agendaMetrics.agendamentosHoje} agendamento${agendaMetrics.agendamentosHoje !== 1 ? 's' : ''} para hoje`, done: agendaMetrics.agendamentosHoje > 0 },
    { label: `${oportunidadesAtivas.length} oportunidade${oportunidadesAtivas.length !== 1 ? 's' : ''} ativas na carteira`, done: oportunidadesAtivas.length > 0 },
  ]

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar" style={{ background: 'var(--color-seller-screen-bg, #f8fafc)' }}>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 pb-24 flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {saudacao()}, {firstName}! 👋
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">{todayLabel}</p>
          </div>
          <span
            onClick={() => navigate('/fechamento-diario')}
            className={`inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              home.todayCheckin
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
            }`}
          >
            <ClipboardCheck size={15} />
            {home.todayCheckin ? 'Fechamento enviado ✓' : 'Enviar Fechamento Diário'}
          </span>
        </div>

        {/* Cartões de métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            label="Meta do mês"
            value={`${vendas} / ${meta}`}
            sub={`faltam ${faltam}`}
            icon={<Target size={18} className="text-indigo-500" />}
            color="indigo"
          />
          <MetricCard
            label="Atingimento"
            value={`${atingimentoPct}%`}
            sub={atingimentoPct >= 100 ? '🎯 Meta batida!' : 'do objetivo'}
            icon={<TrendingUp size={18} className="text-emerald-500" />}
            color="emerald"
          />
          <MetricCard
            label="Agenda hoje"
            value={String(agendaMetrics.agendamentosHoje)}
            sub="compromissos"
            icon={<CalendarDays size={18} className="text-blue-500" />}
            color="blue"
            onClick={() => navigate('/central-execucao')}
          />
          <MetricCard
            label="Ranking"
            value={posicaoRanking ? `#${posicaoRanking}` : '—'}
            sub="na loja"
            icon={<Trophy size={18} className="text-amber-500" />}
            color="amber"
            onClick={() => navigate('/classificacao')}
          />
        </div>

        {/* Rotina do Dia */}
        <section>
          <SectionHeader
            title="Rotina do Dia"
            icon={<CalendarDays size={16} />}
            action={{ label: 'Ver tudo', onClick: () => navigate('/central-execucao') }}
          />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {agendaHoje.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                Nenhum compromisso agendado para hoje.
                <button onClick={() => navigate('/central-execucao')} className="block mt-2 mx-auto text-indigo-500 font-medium hover:underline">
                  Criar atividade
                </button>
              </div>
            ) : (
              agendaHoje.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.cliente?.nome || 'Cliente'}</p>
                      <p className="text-xs text-gray-400">{item.tipo} · {new Date(item.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
                </div>
              ))
            )}
            {agendaHoje.length > 5 && (
              <button onClick={() => navigate('/central-execucao')} className="w-full py-3 text-sm text-indigo-500 font-medium hover:bg-gray-50 transition-colors rounded-b-2xl">
                Ver mais {agendaHoje.length - 5} compromissos
              </button>
            )}
          </div>
        </section>

        {/* Ritual do dia */}
        <section>
          <SectionHeader title="Checklist do Dia" icon={<CheckCircle2 size={16} />} />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {ritualItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                {item.done
                  ? <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                  : <Circle size={18} className="text-gray-300 flex-shrink-0" />
                }
                <p className={`text-sm ${item.done ? 'text-gray-700' : 'text-gray-400'}`}>{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Atalhos */}
        <section>
          <SectionHeader title="Acesso rápido" icon={<ChevronRight size={16} />} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ShortcutCard label="Mentor Comercial" icon={<Users size={20} className="text-indigo-500" />} onClick={() => navigate('/carteira-clientes')} />
            <ShortcutCard label="Minha Meta" icon={<Target size={20} className="text-emerald-500" />} onClick={() => navigate('/meu-funil')} />
            <ShortcutCard label="Desenvolvimento" icon={<BookOpen size={20} className="text-amber-500" />} onClick={() => navigate('/desenvolvimento')} />
          </div>
        </section>

        {/* Disciplina */}
        <section>
          <SectionHeader title="Disciplina semanal" icon={<TrendingUp size={16} />} />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Consistência nos fechamentos</span>
              <span className="text-lg font-bold text-gray-800">{Math.round(disciplina)}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.round(disciplina))}%`,
                  background: disciplina >= 80 ? '#10b981' : disciplina >= 50 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {disciplina >= 80 ? '🔥 Excelente ritmo! Continue assim.' : disciplina >= 50 ? '📈 Bom progresso. Mantenha a frequência.' : '⚠️ Atenção à disciplina diária.'}
            </p>
          </div>
        </section>

      </div>
    </div>
  )
}

/* Componentes internos */

function MetricCard({
  label, value, sub, icon, color, onClick,
}: {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  color: 'indigo' | 'emerald' | 'blue' | 'amber'
  onClick?: () => void
}) {
  const bg: Record<string, string> = {
    indigo: 'bg-indigo-50',
    emerald: 'bg-emerald-50',
    blue: 'bg-blue-50',
    amber: 'bg-amber-50',
  }
  return (
    <div
      onClick={onClick}
      className={`${bg[color]} rounded-2xl p-4 flex flex-col gap-2 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        {icon}
      </div>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}

function SectionHeader({
  title, icon, action,
}: {
  title: string
  icon: React.ReactNode
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
        {icon}
        {title}
      </div>
      {action && (
        <button onClick={action.onClick} className="text-xs text-indigo-500 font-medium hover:underline flex items-center gap-0.5">
          {action.label} <ChevronRight size={12} />
        </button>
      )}
    </div>
  )
}

function ShortcutCard({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors w-full"
    >
      {icon}
      <span className="text-xs font-medium text-gray-600">{label}</span>
    </button>
  )
}
