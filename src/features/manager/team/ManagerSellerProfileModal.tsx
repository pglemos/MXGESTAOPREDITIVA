import { useState, type ComponentType, type ReactNode } from 'react'
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  MessageSquarePlus,
  ShieldCheck,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react'
import type { RankingEntry } from '@/types/database'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ManagerTeamCard } from './manager-team-kanban'

const ProfileDialogContent = DialogContent as unknown as ComponentType<{
  children?: ReactNode
  className?: string
  role?: string
  'aria-label'?: string
  overlayClassName?: string
  showClose?: boolean
}>
const ProfileDialogTitle = DialogTitle as unknown as ComponentType<{ children?: ReactNode; className?: string }>

type ProfileTab = 'overview' | 'performance' | 'routine' | 'feedbacks' | 'training'

type ManagerSellerProfileModalProps = {
  open: boolean
  seller: RankingEntry | null
  card: ManagerTeamCard | null
  storeName: string
  onClose: () => void
  onOpenFeedback: () => void
  onOpenRoutine: () => void
  onOpenTraining: () => void
}

const tabs: Array<{ key: ProfileTab; label: string; mobile: string }> = [
  { key: 'overview', label: 'Visão Geral', mobile: 'Geral' },
  { key: 'performance', label: 'Performance', mobile: 'Resultado' },
  { key: 'routine', label: 'Rotina', mobile: 'Rotina' },
  { key: 'feedbacks', label: 'Feedbacks', mobile: 'Feedback' },
  { key: 'training', label: 'Treinamentos', mobile: 'Trilha' },
]

export function ManagerSellerProfileModal({
  open,
  seller,
  card,
  storeName,
  onClose,
  onOpenFeedback,
  onOpenRoutine,
  onOpenTraining,
}: ManagerSellerProfileModalProps) {
  const [tab, setTab] = useState<ProfileTab>('overview')

  if (!seller || !card) return null

  const result = card.result
  const consistency = card.consistency
  const status = statusCopy(card.overallStatus)
  const sellerTarget = seller.meta > 0 ? seller.meta : null

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) onClose() }}>
      <ProfileDialogContent
        role="dialog"
        aria-label={`Perfil de ${seller.user_name}`}
        overlayClassName="z-[110] bg-black/30 backdrop-blur-[1px]"
        showClose={false}
        className="z-[120] max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-[1280px] gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl sm:max-h-[calc(100dvh-4rem)] sm:w-[calc(100vw-2rem)]"
      >
        <ProfileDialogTitle className="sr-only">Perfil de {seller.user_name}</ProfileDialogTitle>
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700">
              {initials(seller.user_name)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-800">{seller.user_name}</h2>
              <p className="truncate text-sm text-slate-500">{storeName} · Vendedor</p>
              <p className="mt-1 text-xs text-slate-500"><span className={`mr-1 rounded-md px-2 py-1 font-semibold ${status.badge}`}>{status.label}</span> · {card.reason}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onOpenFeedback} className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <MessageSquarePlus size={15} /> Registrar feedback
            </Button>
            <Button size="sm" onClick={onOpenRoutine} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
              <CalendarClock size={15} /> Ver rotina de hoje
            </Button>
            <DialogClose asChild>
              <button type="button" aria-label="Fechar perfil do vendedor" className="ml-1 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={onClose}>
                <X size={20} />
              </button>
            </DialogClose>
          </div>
        </header>

        <div className="min-h-0 overflow-y-auto">
          <nav className="flex shrink-0 gap-7 overflow-x-auto border-b border-slate-100 px-6" aria-label="Abas do perfil do vendedor" role="tablist">
            {tabs.map((item) => (
              <button key={item.key} type="button" role="tab" aria-label={item.label} aria-selected={tab === item.key} onClick={() => setTab(item.key)} className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-semibold ${tab === item.key ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <span className="sm:hidden">{item.mobile}</span><span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="space-y-5 p-5 sm:p-6">
            {tab === 'overview' && <OverviewTab seller={seller} card={card} result={result} consistency={consistency} sellerTarget={sellerTarget} status={status} />}
            {tab === 'performance' && <PerformanceTab seller={seller} />}
            {tab === 'routine' && <RoutineTab card={card} onOpenRoutine={onOpenRoutine} />}
            {tab === 'feedbacks' && <ActionTab icon={MessageSquarePlus} title="Feedbacks do vendedor" detail="Consulte devolutivas e registre novos compromissos na central gerencial." action="Abrir Feedbacks" onClick={onOpenFeedback} />}
            {tab === 'training' && <ActionTab icon={BookOpen} title="Treinamentos do vendedor" detail="Acompanhe progresso, trilhas e planos de reforço da equipe." action="Abrir Universidade MX" onClick={onOpenTraining} />}
          </div>
        </div>
      </ProfileDialogContent>
    </Dialog>
  )
}

function OverviewTab({ seller, card, result, consistency, sellerTarget, status }: { seller: RankingEntry; card: ManagerTeamCard; result: number | null; consistency: number | null; sellerTarget: number | null; status: ReturnType<typeof statusCopy> }) {
  return <>
    <div className="grid gap-4 sm:grid-cols-2">
      <HeroMetric icon={TrendingUp} label="Resultado" value={formatPercent(result)} detail={`${seller.vnd_total} / ${sellerTarget === null ? '—' : formatNumber(sellerTarget)} vendas`} tone={status.tone} />
      <HeroMetric icon={ShieldCheck} label="Consistência" value={formatPercent(consistency)} detail={consistency === null ? 'Dados insuficientes' : consistency >= 75 ? 'Consistência Boa' : 'Consistência Baixa'} tone={consistency === null ? 'muted' : consistency < 50 ? 'critical' : consistency < 75 ? 'attention' : 'success'} />
    </div>

    <details className="group overflow-hidden rounded-xl border border-slate-200">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 [&::-webkit-details-marker]:hidden"><span className="flex items-center gap-2"><Activity size={15} className="text-emerald-600" /> Composição da Consistência</span><ChevronDown size={16} className="text-slate-400 transition-transform group-open:rotate-180" /></summary>
      <div className="grid gap-3 border-t border-slate-100 bg-slate-50 p-4 sm:grid-cols-2"><MiniMetric label="Rotina" value={card.routine} /><MiniMetric label="Disciplina" value={card.discipline} /></div>
    </details>

    <section className="rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-bold text-slate-700">Composição do Status</h3>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div className="space-y-4 md:border-r md:border-slate-100 md:pr-5"><StatusLine label="Resultado Comercial" value={formatPercent(result)} helper={result === null ? 'Faixa indisponível' : result < 50 ? 'Faixa: Muito abaixo' : result < 80 ? 'Faixa: Abaixo' : result < 100 ? 'Faixa: Próximo da meta' : 'Faixa: Meta atingida'} /><StatusLine label="Consistência Comercial" value={formatPercent(consistency)} helper={consistency === null ? 'Faixa indisponível' : consistency < 50 ? 'Faixa: Consistência Baixa' : consistency < 75 ? 'Faixa: Atenção' : 'Faixa: Consistência Boa'} /></div>
        <div className="space-y-2 text-sm"><StatusLine label="Status Geral" value={status.label} /><StatusLine label="Status por Resultado" value={statusFromResult(result)} /><StatusLine label="Status por Consistência" value={statusFromConsistency(consistency)} /><StatusLine label="Índice Gerencial" value={card.managementIndex === null ? '—' : `${Math.round(card.managementIndex)} pontos`} helper="Índice de apoio à priorização — não determina o status." /></div>
      </div>
      {consistency === null && <p className="mt-4 text-xs font-medium text-amber-600">Consistência parcial — aguardando fechamentos oficiais.</p>}
    </section>

    <section className="rounded-xl bg-slate-50 p-4"><h3 className="text-sm font-bold text-slate-700">Diagnóstico atual</h3><p className="mt-2 text-sm text-slate-600">{card.reason}</p><p className="mt-3 flex items-center gap-2 text-xs text-emerald-700"><CheckCircle2 size={14} /> Ponto positivo: <strong>Sem alertas críticos no período</strong></p></section>

    <section className="rounded-xl border border-slate-200 p-4"><h3 className="text-sm font-bold text-slate-700">Informações gerenciais</h3><div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3"><Info label="Data da última venda" value="—" /><Info label="Dias sem vender" value="—" /><Info label="Último feedback" value="—" /><Info label="Próximo feedback agendado" value="—" /><Info label="PDI ativo" value="Nenhum PDI ativo" /><Info label="Treinamentos pendentes" value="—" /></div></section>
  </>
}

function PerformanceTab({ seller }: { seller: RankingEntry }) {
  return <div className="space-y-5"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Leads" value={seller.leads} /><Metric label="Agendamentos" value={seller.agd_total} /><Metric label="Visitas" value={seller.visitas} /><Metric label="Vendas" value={seller.vnd_total} /></div><section className="rounded-xl border border-slate-200 p-4"><h3 className="text-sm font-bold text-slate-700">Vendas por canal</h3><div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-3 text-sm"><span className="text-slate-600">Atendimento anterior / Sem canal confirmado</span><strong className="text-slate-800">{seller.vnd_total}</strong></div></section></div>
}

function RoutineTab({ card, onOpenRoutine }: { card: ManagerTeamCard; onOpenRoutine: () => void }) {
  return <section className="rounded-xl bg-slate-50 p-5"><div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm"><CheckCircle2 /></span><div><h3 className="text-base font-bold text-slate-800">Rotina do período</h3><p className="mt-1 text-sm text-slate-600">{card.routine === null ? 'Ainda não há ações oficiais suficientes para calcular a execução da rotina.' : `Execução verificada: ${Math.round(card.routine)}%.`}</p></div></div><Button variant="outline" className="mt-5" onClick={onOpenRoutine}>Abrir Rotina da Equipe</Button></section>
}

function ActionTab({ icon: Icon, title, detail, action, onClick }: { icon: typeof MessageSquarePlus; title: string; detail: string; action: string; onClick: () => void }) {
  return <section className="rounded-xl bg-slate-50 p-5"><div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm"><Icon /></span><div><h3 className="text-base font-bold text-slate-800">{title}</h3><p className="mt-1 text-sm text-slate-600">{detail}</p></div></div><Button className="mt-5 bg-emerald-600 hover:bg-emerald-700" onClick={onClick}>{action}</Button></section>
}

function HeroMetric({ icon: Icon, label, value, detail, tone }: { icon: typeof TrendingUp; label: string; value: string; detail: string; tone: 'critical' | 'attention' | 'success' | 'muted' }) {
  const theme = { critical: 'border-red-100 bg-red-50 text-red-600', attention: 'border-amber-100 bg-amber-50 text-amber-600', success: 'border-emerald-100 bg-emerald-50 text-emerald-600', muted: 'border-slate-100 bg-slate-50 text-slate-500' }[tone]
  return <div className={`rounded-xl border p-4 ${theme}`}><div className="flex items-center gap-2 text-sm font-bold"><Icon size={15} />{label}</div><p className="mt-3 text-2xl font-black">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>
}

function MiniMetric({ label, value }: { label: string; value: number | null }) { return <div className="rounded-lg border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-bold text-slate-800">{formatPercent(value)}</p></div> }
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-800">{value}</p></div> }
function StatusLine({ label, value, helper }: { label: string; value: string; helper?: string }) { return <div className="flex items-start justify-between gap-4"><span className="text-slate-500">{label}:</span><span className="text-right font-semibold text-slate-700">{value}{helper && <small className="mt-0.5 block text-[11px] font-normal text-slate-400">{helper}</small>}</span></div> }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-700">{value}</p></div> }
function formatPercent(value: number | null) { return value === null ? '—' : `${Math.round(value)}%` }
function formatNumber(value: number) { return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) }
function initials(name: string) { const parts = name.trim().split(/\s+/); return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : parts[0]?.[0]?.toUpperCase() || '?' }
function statusCopy(status: ManagerTeamCard['overallStatus']) { return status === 'on_track' ? { label: 'Em dia', badge: 'bg-emerald-100 text-emerald-700', tone: 'success' as const } : status === 'attention' ? { label: 'Atenção', badge: 'bg-amber-100 text-amber-700', tone: 'attention' as const } : status === 'not_applicable' ? { label: 'Não aplicável', badge: 'bg-slate-100 text-slate-600', tone: 'muted' as const } : { label: 'Crítico', badge: 'bg-red-100 text-red-600', tone: 'critical' as const } }
function statusFromResult(value: number | null) { return value === null ? '—' : value >= 100 ? 'Em dia' : value >= 80 ? 'Atenção' : 'Crítico' }
function statusFromConsistency(value: number | null) { return value === null ? '—' : value >= 75 ? 'Em dia' : value >= 50 ? 'Atenção' : 'Crítico' }

export default ManagerSellerProfileModal
