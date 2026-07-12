import { useSearchParams } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Clock3, MessageSquare, TrendingUp } from 'lucide-react'
import { TabNavPill } from '@/components/molecules/TabNavPill'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { useFeedbacks } from '@/hooks/useFeedbacks'
import { usePDIs } from '@/hooks/usePDI'
import GerenteFeedback from '@/pages/GerenteFeedback'
import GerentePDI from '@/pages/GerentePDI'

type DevelopmentTab = 'feedbacks' | 'pdis' | 'agenda'

export default function ManagerDevelopment() {
  const [params, setParams] = useSearchParams()
  const requestedTab = params.get('tab')
  const tab: DevelopmentTab = requestedTab === 'pdi' || requestedTab === 'pdis' ? 'pdis' : requestedTab === 'agenda' ? 'agenda' : 'feedbacks'
  const { devolutivas } = useFeedbacks()
  const { pdis } = usePDIs()
  const currentMonth = new Date().toISOString().slice(0, 7)
  const feedbacksThisMonth = devolutivas.filter(item => item.created_at.startsWith(currentMonth)).length
  const feedbacksPending = devolutivas.filter(item => !item.acknowledged).length
  const activePdis = pdis.filter(item => item.status !== 'concluido').length
  const overduePdis = pdis.filter(item => item.status !== 'concluido' && item.due_date && item.due_date < new Date().toISOString().slice(0, 10)).length

  const selectTab = (next: DevelopmentTab) => {
    const updated = new URLSearchParams(params)
    updated.set('tab', next)
    setParams(updated, { replace: true })
  }

  return (
    <main className="min-h-full bg-surface-alt" id="main-content">
      <div className="px-mx-lg pt-mx-lg">
        <section className="mb-mx-md grid grid-cols-2 gap-mx-sm lg:grid-cols-4" aria-label="Resumo de desenvolvimento">
          <Summary label="Feedbacks no mês" value={feedbacksThisMonth} icon={MessageSquare}/>
          <Summary label="Feedbacks pendentes" value={feedbacksPending} icon={Clock3}/>
          <Summary label="PDIs ativos" value={activePdis} icon={TrendingUp}/>
          <Summary label="PDIs vencidos" value={overduePdis} icon={CalendarDays}/>
        </section>
        <TabNavPill<DevelopmentTab>
          aria-label="Feedbacks e PDIs"
          tabs={[
            { key: 'feedbacks', label: 'Feedbacks', icon: MessageSquare },
            { key: 'pdis', label: 'PDIs', icon: TrendingUp },
            { key: 'agenda', label: 'Agenda de Reuniões', mobileLabel: 'Agenda', icon: CalendarDays },
          ]}
          activeTab={tab}
          onTabChange={selectTab}
        />
      </div>
      {tab === 'pdis' ? <GerentePDI /> : tab === 'agenda' ? <DevelopmentAgenda pdis={pdis} feedbacks={devolutivas} /> : <GerenteFeedback />}
    </main>
  )
}

function Summary({ label, value, icon: Icon }: { label: string; value: number; icon: typeof MessageSquare }) { return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-2"><div><Typography variant="h2">{value}</Typography><Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-wide">{label}</Typography></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-brand-primary"><Icon size={19}/></span></div></div> }

function DevelopmentAgenda({ pdis, feedbacks }: { pdis: ReturnType<typeof usePDIs>['pdis']; feedbacks: ReturnType<typeof useFeedbacks>['devolutivas'] }) {
  const scheduled = pdis.filter(item => item.due_date).sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
  return <section className="p-mx-lg"><div className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><Typography variant="h2">Agenda de Acompanhamentos</Typography><Typography variant="p" tone="muted" className="mt-1">Prazos de PDI e devolutivas recentes que exigem acompanhamento do gerente.</Typography></div><div className="divide-y divide-slate-100">{scheduled.map(item => <div key={item.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><Typography variant="h3">{item.seller_name || 'Vendedor da equipe'}</Typography><Typography variant="caption" tone="muted">Revisão do PDI · prazo {formatDate(item.due_date)}</Typography></div><Badge variant={item.status === 'concluido' ? 'success' : item.due_date && item.due_date < new Date().toISOString().slice(0, 10) ? 'danger' : 'warning'}>{item.status.replaceAll('_', ' ')}</Badge></div>)}{feedbacks.slice(0, 5).map(item => <div key={item.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><Typography variant="h3">{item.seller_name || 'Vendedor da equipe'}</Typography><Typography variant="caption" tone="muted">Devolutiva da semana {formatDate(item.week_reference)}</Typography></div><Badge variant={item.acknowledged ? 'success' : 'warning'}>{item.acknowledged ? 'Ciência registrada' : 'Aguardando ciência'}</Badge></div>)}{!scheduled.length && !feedbacks.length && <div className="p-10 text-center"><CheckCircle2 className="mx-auto text-text-tertiary"/><Typography variant="p" tone="muted" className="mt-2">Nenhum acompanhamento agendado.</Typography></div>}</div></div></section>
}

function formatDate(value: string | null | undefined) { if (!value) return 'sem data'; const [year, month, day] = value.slice(0, 10).split('-'); return `${day}/${month}/${year}` }
