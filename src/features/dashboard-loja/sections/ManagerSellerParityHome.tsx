import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, Gauge, Target, TrendingUp, Trophy, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { useDashboardLojaData } from '../hooks/useDashboardLojaData'
import type { OwnerPerformanceAlert } from './PerformanceAlerts'

type DashboardData = ReturnType<typeof useDashboardLojaData>

const enter = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }

export function ManagerSellerParityHome({ data, alerts }: { data: DashboardData; alerts: OwnerPerformanceAlert[] }) {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const sellers = data.sellers || []
  const goal = data.metrics.goalValue || 0
  const sales = data.metrics.totalSales || 0
  const gap = Math.max(goal - sales, 0)
  const attainment = goal > 0 ? Math.min(100, Math.round((sales / goal) * 100)) : 0
  const discipline = sellers.length > 0 ? Math.round((data.metrics.checkedInCount / sellers.length) * 100) : 0
  const pending = Math.max(sellers.length - data.metrics.checkedInCount, 0)
  const ranking = data.metrics.ranking.slice(0, 3)
  const transition = reducedMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 180, damping: 24 }

  return (
    <div className="h-full w-full min-w-0 bg-seller-screen-bg px-mx-sm py-mx-md text-white sm:px-mx-md lg:px-mx-lg">
      <div className="mx-auto flex w-full max-w-[1500px] min-w-0 flex-col gap-5 pb-24">
        <header className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-white lg:text-3xl">Bom dia, Gerente! 🚀</h1>
            <p className="mt-0.5 text-sm text-slate-400">Conduza o ritmo da loja. Desenvolva a equipe. Proteja o resultado.</p>
          </div>
          <button type="button" className="flex min-h-11 items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 shadow-sm transition-colors hover:bg-white/10">
            <CalendarDays className="h-4 w-4 text-slate-400" /> Este mês <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </header>

        <motion.section initial="hidden" animate="visible" variants={enter} transition={transition} className="relative min-h-[240px] overflow-hidden rounded-2xl border border-seller-green/25 bg-gradient-to-br from-seller-commission-bg-start via-seller-commission-bg-mid to-seller-commission-bg-end p-6 shadow-[0_0_40px_rgb(34_197_94/0.08)] lg:p-8" aria-labelledby="manager-goal-title">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-seller-green/10 blur-3xl" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="flex-1">
              <p id="manager-goal-title" className="text-xs font-bold uppercase tracking-widest text-emerald-400">Meta da Loja</p>
              <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
                <strong className="text-5xl font-black leading-none text-seller-money [text-shadow:0_0_30px_rgb(57_255_90/0.35)] sm:text-6xl lg:text-7xl">{attainment}%</strong>
                <span className="pb-1 text-lg font-semibold text-slate-300">da meta alcançada</span>
              </div>
              <p className="mt-4 max-w-3xl text-sm text-slate-400">{sales} de {goal} veículos realizados. {gap > 0 ? `Faltam ${gap} para a meta do período.` : 'Meta atingida. Proteja margem, cadência e qualidade.'}</p>
              <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-white/10"><motion.div initial={{ width: 0 }} animate={{ width: `${attainment}%` }} transition={transition} className="h-full rounded-full bg-seller-green shadow-[0_0_12px_rgb(34_197_94/0.55)]" /></div>
            </div>
            <div className="hidden h-44 w-44 shrink-0 items-center justify-center lg:flex"><div className="grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-seller-green-strong to-seller-green shadow-[0_0_30px_rgb(34_197_94/0.4)]"><Target className="h-14 w-14 text-white" strokeWidth={1.5} /></div></div>
          </div>
        </motion.section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <DarkMetricCard eyebrow="Ritmo da operação" title={`${data.metrics.totalAgd} agendamentos hoje`} description={data.metrics.totalAgd > 0 ? 'A equipe tem movimento comercial registrado para executar.' : 'A agenda precisa de ação imediata da liderança.'} value={`${pending}`} valueLabel="fechamentos pendentes" tone="warning" icon={Gauge} onClick={() => navigate('/gerente/fechamento-diario')} />
          <DarkMetricCard eyebrow="Disciplina da equipe" title={`${discipline}% de adesão`} description={`${data.metrics.checkedInCount} de ${sellers.length} vendedores com fechamento sincronizado.`} value={`${alerts.length}`} valueLabel="alertas para conduzir" tone="blue" icon={Users} onClick={() => navigate('/gerente/rotina-equipe')} />
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <DarkListCard title="Prioridades do gerente hoje" icon={AlertTriangle}>
            {alerts.length
              ? alerts.slice(0, 4).map((alert, index) => <DarkListRow key={alert.title} index={index + 1} label={alert.title} action={alert.ctaLabel} onClick={() => navigate(alert.ctaTo)} />)
              : [
                  { label: 'Revisar o ritmo da meta', action: 'Abrir meta', to: '/gerente/meta-loja' },
                  { label: 'Confirmar a agenda comercial', action: 'Abrir fechamento', to: '/gerente/fechamento-diario' },
                  { label: 'Reconhecer quem está em dia', action: 'Ver equipe', to: '/gerente/minha-equipe' },
                ].map((item, index) => <DarkListRow key={item.label} index={index + 1} label={item.label} action={item.action} onClick={() => navigate(item.to)} />)}
          </DarkListCard>
          <DarkListCard title="Performance da equipe" icon={TrendingUp}>
            {ranking.length ? ranking.map((row, index) => <DarkRankingRow key={row.user_id} position={index + 1} name={row.user_name} value={row.vnd_total} />) : <p className="rounded-xl border border-white/8 bg-white/5 p-4 text-sm text-slate-400">O ranking será exibido após os primeiros lançamentos oficiais.</p>}
          </DarkListCard>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <DarkActionCard title="Rotina da Equipe" detail="Acompanhe execução, follow-ups, atualizações e agendamentos." icon={CheckCircle2} action="Abrir rotina" onClick={() => navigate('/gerente/rotina-equipe')} />
          <DarkActionCard title="Mentor Gerencial" detail="Transforme sinais da operação em conversas e compromissos claros." icon={Trophy} action="Abrir mentor" onClick={() => navigate('/gerente/mentor')} />
        </section>
      </div>
    </div>
  )
}

function DarkMetricCard({ eyebrow, title, description, value, valueLabel, tone, icon: Icon, onClick }: { eyebrow: string; title: string; description: string; value: string; valueLabel: string; tone: 'warning' | 'blue'; icon: typeof Gauge; onClick: () => void }) {
  const warning = tone === 'warning'
  return <button type="button" onClick={onClick} className={`group relative min-h-[220px] overflow-hidden rounded-2xl border p-6 text-left shadow-[0_0_30px_rgb(0_0_0/0.16)] transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seller-green ${warning ? 'border-status-warning/20 bg-gradient-to-br from-seller-milestone-bg-start via-seller-milestone-bg-mid to-seller-milestone-bg-end' : 'border-seller-blue/20 bg-gradient-to-br from-seller-blue-bg-start via-seller-blue-bg-mid to-seller-blue-bg-end'}`}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">{eyebrow}</p><h2 className="mt-3 text-2xl font-bold text-white">{title}</h2><p className="mt-2 max-w-xl text-sm text-slate-400">{description}</p></div><span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${warning ? 'bg-status-warning text-white' : 'bg-seller-blue-strong text-white'}`}><Icon className="h-7 w-7" /></span></div><div className="mt-7 flex items-end gap-3"><strong className={`text-5xl font-black leading-none ${warning ? 'text-status-warning' : 'text-seller-blue-soft'}`}>{value}</strong><span className="pb-1 text-sm font-semibold text-slate-300">{valueLabel}</span></div></button>
}

function DarkListCard({ title, icon: Icon, children }: { title: string; icon: typeof AlertTriangle; children: ReactNode }) {
  return <section className="rounded-2xl border border-white/8 bg-seller-card-bg p-6 shadow-[0_0_30px_rgb(0_0_0/0.16)]"><div className="mb-5 flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</h2><Icon className="h-5 w-5 text-seller-green" /></div><div className="space-y-3">{children}</div></section>
}

function DarkListRow({ index, label, action, onClick }: { index: number; label: string; action: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seller-green"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-seller-green/15 text-xs font-black text-seller-green">0{index}</span><span className="min-w-0 flex-1 text-sm font-medium text-slate-300">{label}</span><span className="shrink-0 text-xs font-bold text-seller-green">{action} →</span></button> }
function DarkRankingRow({ position, name, value }: { position: number; name: string; value: number }) { return <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-4 py-3"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-status-warning/15 text-xs font-black text-status-warning">{position}º</span><span className="text-sm font-medium text-slate-300">{name}</span></div><strong className="text-seller-green">{value} vendas</strong></div> }
function DarkActionCard({ title, detail, icon: Icon, action, onClick }: { title: string; detail: string; icon: typeof Trophy; action: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="flex min-h-[150px] items-center justify-between gap-5 rounded-2xl border border-white/8 bg-seller-card-bg p-6 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seller-green"><div><h2 className="text-xl font-bold text-white">{title}</h2><p className="mt-2 text-sm text-slate-400">{detail}</p><span className="mt-4 inline-block text-sm font-bold text-seller-green">{action} →</span></div><span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-seller-green/15 text-seller-green"><Icon className="h-7 w-7" /></span></button> }

export default ManagerSellerParityHome
