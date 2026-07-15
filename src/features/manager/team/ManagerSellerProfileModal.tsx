import { useState } from 'react'
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
import type { ManagerTeamCard } from './manager-team-kanban'

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

  if (!open || !seller || !card) return null

  const result = card.result
  const consistency = card.consistency
  const status = statusCopy(card.overallStatus)
  const sellerTarget = seller.meta > 0 ? seller.meta : null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 p-4">
      <section role="dialog" aria-modal="true" aria-label={`Perfil de ${seller.user_name}`} className="z-[120] flex max-h-[92vh] w-[90vw] max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-emerald-100 text-lg font-bold text-emerald-700">
              {initials(seller.user_name)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-gray-800">{seller.user_name}</h2>
              <p className="truncate text-sm text-gray-500">{storeName} · Vendedor</p>
              <p className="mt-1 text-xs text-gray-500"><span className={`mr-1 rounded-lg px-2 py-0.5 font-medium ${status.badge}`}>{status.label}</span> · {card.reason}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={onOpenFeedback} className="flex h-9 items-center gap-1 rounded-xl border border-emerald-200 px-3 text-xs font-medium text-emerald-700 hover:bg-emerald-50"><MessageSquarePlus size={14}/>Registrar feedback</button>
            <button type="button" onClick={onOpenRoutine} className="flex h-9 items-center gap-1 rounded-xl bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700"><CalendarClock size={14}/>Ver rotina de hoje</button>
            <button type="button" aria-label="Fechar perfil do vendedor" className="ml-1 text-gray-400 hover:text-gray-600" onClick={onClose}><X size={20}/></button>
          </div>
        </header>

        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-gray-100 px-6 pt-3" aria-label="Abas do perfil do vendedor" role="tablist">
            {tabs.map((item) => (
              <button key={item.key} type="button" role="tab" aria-label={item.label} aria-selected={tab === item.key} onClick={() => setTab(item.key)} className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium ${tab === item.key ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <span className="sm:hidden">{item.mobile}</span><span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
        </nav>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
            {tab === 'overview' && <OverviewTab seller={seller} card={card} result={result} consistency={consistency} sellerTarget={sellerTarget} status={status} />}
            {tab === 'performance' && <PerformanceTab seller={seller} />}
            {tab === 'routine' && <RoutineTab card={card} onOpenRoutine={onOpenRoutine} />}
            {tab === 'feedbacks' && <ActionTab icon={MessageSquarePlus} title="Feedbacks do vendedor" detail="Consulte devolutivas e registre novos compromissos na central gerencial." action="Abrir Feedbacks" onClick={onOpenFeedback} />}
            {tab === 'training' && <ActionTab icon={BookOpen} title="Treinamentos do vendedor" detail="Acompanhe progresso, trilhas e planos de reforço da equipe." action="Abrir Universidade MX" onClick={onOpenTraining} />}
        </div>
      </section>
    </div>
  )
}

function OverviewTab({ seller, card, result, consistency, sellerTarget, status }: { seller: RankingEntry; card: ManagerTeamCard; result: number | null; consistency: number | null; sellerTarget: number | null; status: ReturnType<typeof statusCopy> }) {
  return <>
    <div className="grid gap-4 sm:grid-cols-2">
      <HeroMetric icon={TrendingUp} label="Resultado" value={formatPercent(result)} detail={`${seller.vnd_total} / ${sellerTarget === null ? '—' : formatNumber(sellerTarget)} vendas`} tone={status.tone} />
      <HeroMetric icon={ShieldCheck} label="Consistência" value={formatPercent(consistency)} detail={consistency === null ? 'Dados insuficientes' : consistency >= 75 ? 'Consistência Boa' : 'Consistência Baixa'} tone={consistency === null ? 'muted' : consistency < 50 ? 'critical' : consistency < 75 ? 'attention' : 'success'} />
    </div>

    <details className="group overflow-hidden rounded-xl border border-gray-200">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 [&::-webkit-details-marker]:hidden"><span className="flex items-center gap-2"><Activity size={15} className="text-emerald-600" /> Composição da Consistência</span><ChevronDown size={16} className="text-gray-400 transition-transform group-open:rotate-180" /></summary>
      <div className="grid gap-3 border-t border-gray-100 bg-gray-50 p-4 sm:grid-cols-2"><MiniMetric label="Rotina" value={card.routine} /><MiniMetric label="Disciplina" value={card.discipline} /></div>
    </details>

    <section className="rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-700">Composição do Status</h3>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div className="space-y-4 md:border-r md:border-gray-100 md:pr-5"><StatusLine label="Resultado Comercial" value={formatPercent(result)} helper={result === null ? 'Faixa indisponível' : result < 50 ? 'Faixa: Muito abaixo' : result < 80 ? 'Faixa: Abaixo' : result < 100 ? 'Faixa: Próximo da meta' : 'Faixa: Meta atingida'} /><StatusLine label="Consistência Comercial" value={formatPercent(consistency)} helper={consistency === null ? 'Faixa indisponível' : consistency < 50 ? 'Faixa: Consistência Baixa' : consistency < 75 ? 'Faixa: Atenção' : 'Faixa: Consistência Boa'} /></div>
        <div className="space-y-2 text-sm"><StatusLine label="Status Geral" value={status.label} /><StatusLine label="Status por Resultado" value={statusFromResult(result)} /><StatusLine label="Status por Consistência" value={statusFromConsistency(consistency)} /><p className="pt-1 text-xs text-gray-600"><span className="text-gray-400">Motivo: </span>{card.reason}</p><StatusLine label="Índice Gerencial" value={card.managementIndex === null ? '—' : `${Math.round(card.managementIndex)} pontos`} helper="Índice de apoio à priorização — não determina o status." /></div>
      </div>
      {consistency === null && <p className="mt-4 text-xs font-medium text-amber-600">Consistência parcial — aguardando fechamentos oficiais.</p>}
    </section>

    <section className="rounded-xl bg-gray-50 p-4"><h3 className="text-sm font-bold text-gray-700">Diagnóstico atual</h3><p className="mt-2 text-sm text-gray-600">{card.reason}</p><p className="mt-3 flex items-center gap-2 text-xs text-emerald-700"><CheckCircle2 size={14} /> Ponto positivo: <strong>Sem alertas críticos no período</strong></p></section>

    <section className="rounded-xl border border-gray-200 p-4"><h3 className="text-sm font-bold text-gray-700">Informações gerenciais</h3><div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3"><Info label="Data da última venda" value="—" /><Info label="Dias sem vender" value="—" /><Info label="Último feedback" value="—" /><Info label="Próximo feedback agendado" value="—" /><Info label="PDI ativo" value="Nenhum PDI ativo" /><Info label="Próximo compromisso do PDI" value="—" /><Info label="Treinamentos pendentes" value="—" /><Info label="Último acesso à Universidade MX" value="—" /></div></section>
  </>
}

function PerformanceTab({ seller }: { seller: RankingEntry }) {
  return <div className="space-y-5"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Leads" value={seller.leads} /><Metric label="Agendamentos" value={seller.agd_total} /><Metric label="Visitas" value={seller.visitas} /><Metric label="Vendas" value={seller.vnd_total} /></div><section className="rounded-xl border border-gray-200 p-4"><h3 className="text-sm font-bold text-gray-700">Vendas por canal</h3><div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-3 text-sm"><span className="text-gray-600">Atendimento anterior / Sem canal confirmado</span><strong className="text-gray-800">{seller.vnd_total}</strong></div></section></div>
}

function RoutineTab({ card, onOpenRoutine }: { card: ManagerTeamCard; onOpenRoutine: () => void }) {
  return <section className="rounded-xl bg-gray-50 p-5"><div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm"><CheckCircle2 /></span><div><h3 className="text-base font-bold text-gray-800">Rotina do período</h3><p className="mt-1 text-sm text-gray-600">{card.routine === null ? 'Ainda não há ações oficiais suficientes para calcular a execução da rotina.' : `Execução verificada: ${Math.round(card.routine)}%.`}</p></div></div><button type="button" className="mt-5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={onOpenRoutine}>Abrir Rotina da Equipe</button></section>
}

function ActionTab({ icon: Icon, title, detail, action, onClick }: { icon: typeof MessageSquarePlus; title: string; detail: string; action: string; onClick: () => void }) {
  return <section className="rounded-xl bg-gray-50 p-5"><div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm"><Icon /></span><div><h3 className="text-base font-bold text-gray-800">{title}</h3><p className="mt-1 text-sm text-gray-600">{detail}</p></div></div><button type="button" className="mt-5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700" onClick={onClick}>{action}</button></section>
}

function HeroMetric({ icon: Icon, label, value, detail, tone }: { icon: typeof TrendingUp; label: string; value: string; detail: string; tone: 'critical' | 'attention' | 'success' | 'muted' }) {
  const theme = { critical: 'border-red-100 bg-red-50 text-red-600', attention: 'border-amber-100 bg-amber-50 text-amber-600', success: 'border-emerald-100 bg-emerald-50 text-emerald-600', muted: 'border-gray-100 bg-gray-50 text-gray-500' }[tone]
  return <div className={`rounded-xl border p-4 ${theme}`}><div className="flex items-center gap-2 text-sm font-bold"><Icon size={15} />{label}</div><p className="mt-3 text-2xl font-black">{value}</p><p className="mt-1 text-xs text-gray-500">{detail}</p></div>
}

function MiniMetric({ label, value }: { label: string; value: number | null }) { return <div className="rounded-lg border border-gray-200 bg-white p-3"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-lg font-bold text-gray-800">{formatPercent(value)}</p></div> }
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p><p className="mt-2 text-2xl font-black text-gray-800">{value}</p></div> }
function StatusLine({ label, value, helper }: { label: string; value: string; helper?: string }) { return <div className="flex items-start justify-between gap-4"><span className="text-gray-500">{label}:</span><span className="text-right font-semibold text-gray-700">{value}{helper && <small className="mt-0.5 block text-[11px] font-normal text-gray-400">{helper}</small>}</span></div> }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-sm font-semibold text-gray-700">{value}</p></div> }
function formatPercent(value: number | null) { return value === null ? '—' : `${Math.round(value)}%` }
function formatNumber(value: number) { return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) }
function initials(name: string) { const parts = name.trim().split(/\s+/); return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : parts[0]?.[0]?.toUpperCase() || '?' }
function statusCopy(status: ManagerTeamCard['overallStatus']) { return status === 'on_track' ? { label: 'Em dia', badge: 'bg-emerald-100 text-emerald-700', tone: 'success' as const } : status === 'attention' ? { label: 'Atenção', badge: 'bg-amber-100 text-amber-700', tone: 'attention' as const } : status === 'not_applicable' ? { label: 'Não aplicável', badge: 'bg-gray-100 text-gray-600', tone: 'muted' as const } : { label: 'Crítico', badge: 'bg-red-100 text-red-600', tone: 'critical' as const } }
function statusFromResult(value: number | null) { return value === null ? '—' : value >= 100 ? 'Em dia' : value >= 80 ? 'Atenção' : 'Crítico' }
function statusFromConsistency(value: number | null) { return value === null ? '—' : value >= 75 ? 'Em dia' : value >= 50 ? 'Atenção' : 'Crítico' }

export default ManagerSellerProfileModal
