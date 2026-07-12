import { useMemo, useState } from 'react'
import { BarChart3, BookOpen, CheckCircle2, MessageSquare, Search, Target, TrendingUp, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Typography } from '@/components/atoms/Typography'
import { Modal } from '@/components/organisms/Modal'
import { TabNavPill } from '@/components/molecules/TabNavPill'
import type { RankingEntry } from '@/types/database'

type TeamTab = 'overview' | 'performance' | 'routine' | 'feedbacks' | 'training'

type SellerRow = RankingEntry & { checked_in?: boolean }

export function ManagerTeamPerformance({ rows, storeName }: { rows: SellerRow[]; storeName: string }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SellerRow | null>(null)
  const [tab, setTab] = useState<TeamTab>('overview')
  const filtered = useMemo(() => rows.filter(row => row.user_name.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'))), [rows, search])

  const openProfile = (row: SellerRow) => { setSelected(row); setTab('overview') }

  return <section className="space-y-mx-lg pb-24" aria-label="Performance da equipe">
    <div className="flex flex-col gap-mx-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div><Typography variant="h3">Performance da Equipe</Typography><Typography variant="caption" tone="muted">Vendedores ativos de {storeName}</Typography></div>
      <div className="relative w-full sm:w-96"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={17}/><Input aria-label="Buscar vendedor" placeholder="Buscar vendedor..." value={search} onChange={event => setSearch(event.target.value)} className="h-11 pl-10"/></div>
    </div>

    {filtered.length ? <div className="grid grid-cols-1 gap-mx-md md:grid-cols-2 xl:grid-cols-3">
      {filtered.map(row => {
        const attainment = row.meta > 0 ? Math.round((row.vnd_total / row.meta) * 100) : 0
        const status = attainment >= 100 ? 'Excelente' : attainment >= 60 ? 'Atenção' : 'Crítico'
        return <article key={row.user_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-900 font-black text-white">{initials(row.user_name)}</div><div className="min-w-0"><Typography variant="h3" className="truncate">{row.user_name}</Typography><Typography variant="caption" tone="muted">{storeName}</Typography></div></div><Badge variant={status === 'Excelente' ? 'success' : status === 'Atenção' ? 'warning' : 'danger'}>{status}</Badge></div>
          <div className="mt-5 grid grid-cols-3 gap-2"><Metric label="Vendas" value={row.vnd_total}/><Metric label="Meta" value={`${attainment}%`}/><Metric label="Rotina" value={row.checked_in ? '100%' : '0%'}/></div>
          <div className="mt-4"><div className="mb-1 flex justify-between text-xs text-text-tertiary"><span>Meta individual</span><span>{row.vnd_total}/{row.meta || '—'}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-primary" style={{ width: `${Math.min(100, attainment)}%` }}/></div></div>
          <Button variant="outline" className="mt-5 w-full" onClick={() => openProfile(row)}>Ver perfil completo</Button>
        </article>
      })}
    </div> : <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center"><Users className="mx-auto text-text-tertiary"/><Typography variant="p" tone="muted" className="mt-2">Nenhum vendedor corresponde à busca.</Typography></div>}

    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.user_name || 'Perfil do vendedor'} description={storeName} size="lg">
      {selected && <div className="space-y-mx-md"><TabNavPill<TeamTab> tabs={[
        { key: 'overview', label: 'Visão Geral', mobileLabel: 'Geral', icon: Users },
        { key: 'performance', label: 'Performance', mobileLabel: 'Resultado', icon: BarChart3 },
        { key: 'routine', label: 'Rotina', icon: CheckCircle2 },
        { key: 'feedbacks', label: 'Feedbacks', mobileLabel: 'Feedback', icon: MessageSquare },
        { key: 'training', label: 'Treinamentos', mobileLabel: 'Trilha', icon: BookOpen },
      ]} activeTab={tab} onTabChange={setTab} />
        {tab === 'overview' && <div className="grid grid-cols-2 gap-mx-sm sm:grid-cols-3"><MetricCard label="Vendas no mês" value={selected.vnd_total}/><MetricCard label="Meta individual" value={selected.meta || '—'}/><MetricCard label="% da meta" value={selected.meta ? `${Math.round(selected.vnd_total / selected.meta * 100)}%` : '—'}/><MetricCard label="Rotina" value={selected.checked_in ? 'Em dia' : 'Pendente'}/><MetricCard label="Agendamentos" value={selected.agd_total}/><MetricCard label="Status" value={selected.status?.label || 'Em acompanhamento'}/></div>}
        {tab === 'performance' && <div className="grid grid-cols-2 gap-mx-sm sm:grid-cols-4"><MetricCard label="Leads" value={selected.leads}/><MetricCard label="Agendamentos" value={selected.agd_total}/><MetricCard label="Visitas" value={selected.visitas}/><MetricCard label="Vendas" value={selected.vnd_total}/></div>}
        {tab === 'routine' && <div className="rounded-xl bg-slate-50 p-5"><Typography variant="h3">Rotina do dia</Typography><Typography variant="p" tone="muted" className="mt-2">{selected.checked_in ? 'Fechamento diário sincronizado.' : 'Fechamento diário pendente. Use Rotina da Equipe para consultar ações e registrar a cobrança.'}</Typography><Button variant="outline" className="mt-4" onClick={() => navigate('/gerente/rotina-equipe')}>Abrir Rotina da Equipe</Button></div>}
        {tab === 'feedbacks' && <ActionPanel icon={MessageSquare} title="Feedbacks do vendedor" detail="Consulte devolutivas e registre novos compromissos na central gerencial." action="Abrir Feedbacks" onClick={() => navigate('/gerente/feedbacks-pdis?tab=feedbacks')} />}
        {tab === 'training' && <ActionPanel icon={BookOpen} title="Treinamentos do vendedor" detail="Acompanhe progresso, matriz da equipe e planos de reforço." action="Abrir Universidade MX" onClick={() => navigate('/gerente/universidade-mx')} />}
      </div>}
    </Modal>
  </section>
}

function initials(name: string) { return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl bg-slate-50 p-3 text-center"><Typography variant="h3">{value}</Typography><Typography variant="tiny" tone="muted" className="uppercase tracking-wide">{label}</Typography></div> }
function MetricCard({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-slate-200 bg-white p-4"><Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-wide">{label}</Typography><Typography variant="h2" className="mt-2">{value}</Typography></div> }
function ActionPanel({ icon: Icon, title, detail, action, onClick }: { icon: typeof TrendingUp; title: string; detail: string; action: string; onClick: () => void }) { return <div className="rounded-xl bg-slate-50 p-5"><div className="flex gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-brand-primary shadow-sm"><Icon/></span><div><Typography variant="h3">{title}</Typography><Typography variant="p" tone="muted" className="mt-1">{detail}</Typography></div></div><Button className="mt-5" onClick={onClick}>{action}</Button></div> }
