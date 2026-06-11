import { useMemo } from 'react'
import { Calendar, CheckCircle2, Star, Target, Users, Wrench } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { EmptyState } from '@/components/atoms/EmptyState'
import { useMyPDISessions } from '@/hooks/usePDI_MX'
import type { PDIAvaliacao360, PDIMeta360, PDISessionSummary } from '@/hooks/usePDI_MX'

const PRAZO_META: Array<{ prazo: string; tone: 'green' | 'orange' | 'purple'; label: string; value: string; subtitle: string; fallback: keyof Pick<PDISessionSummary, 'meta_6m' | 'meta_12m' | 'meta_24m'> }> = [
  { prazo: '6_meses', tone: 'green', label: 'Curto prazo', value: '6 meses', subtitle: 'Onde quero chegar nos próximos 6 meses.', fallback: 'meta_6m' },
  { prazo: '12_meses', tone: 'orange', label: 'Médio prazo', value: '12 meses', subtitle: 'Onde quero chegar nos próximos 12 meses.', fallback: 'meta_12m' },
  { prazo: '24_meses', tone: 'purple', label: 'Longo prazo', value: '24 meses', subtitle: 'Onde quero chegar nos próximos 24 meses.', fallback: 'meta_24m' },
]

const notaBR = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

const statusInfo = (status?: string) => {
  const s = (status || '').toLowerCase()
  if (s.includes('conclu')) return { label: 'Concluída', cls: 'bg-status-success-surface text-status-success', progress: 100 }
  if (s.includes('cancel')) return { label: 'Cancelada', cls: 'bg-status-error-surface text-status-error', progress: null }
  return { label: status || 'Em andamento', cls: 'bg-status-info-surface text-status-info', progress: null }
}

export default function VendedorPDI() {
  const { pdis, loading } = useMyPDISessions()

  const activePDI = useMemo(() => {
    if (!pdis || pdis.length === 0) return null
    return [...pdis].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  }, [pdis])

  const tecnicas = useMemo(() => filtrarAvaliacoes(activePDI, 'tecnica'), [activePDI])
  const comportamentais = useMemo(() => filtrarAvaliacoes(activePDI, 'comportamental'), [activePDI])
  const hojeLabel = `${new Date().toLocaleDateString('pt-BR')} (${new Date().toLocaleDateString('pt-BR', { weekday: 'long' })})`

  return (
    <main className="h-full w-full overflow-y-auto bg-white p-mx-md md:p-mx-lg no-scrollbar">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-mx-lg pb-20">
        <header className="flex items-center justify-between border-b border-border-subtle pb-mx-md">
          <div className="flex items-center gap-mx-sm">
            <Star size={34} className="text-text-primary" />
            <div>
              <Typography variant="h1" className="text-3xl uppercase leading-tight tracking-normal">PDI</Typography>
              <Typography variant="p" tone="muted" className="text-sm">Seu Plano de Desenvolvimento Individual</Typography>
            </div>
          </div>
          <div className="hidden items-center gap-mx-sm text-sm font-black text-text-primary md:flex">
            <Calendar size={17} /> {hojeLabel}
          </div>
        </header>

        {loading && !activePDI && <Typography tone="muted">Carregando seu PDI...</Typography>}

        {!loading && !activePDI && (
          <EmptyState
            title="Você ainda não tem um PDI registrado"
            description="O PDI é construído junto com seu gestor na sessão de desenvolvimento. Fale com ele para agendar a sua."
          />
        )}

        {activePDI && (
          <>
            <section>
              <SectionHeading step="1" title="Conquistas" subtitle={activePDI.manager_name ? `PDI conduzido por ${activePDI.manager_name}` : undefined} />
              <div className="mt-mx-sm grid gap-mx-md xl:grid-cols-3">
                {PRAZO_META.map(cfg => {
                  const metas = (activePDI.metas || []).filter(m => m.prazo === cfg.prazo)
                  const fallback = activePDI[cfg.fallback]
                  const items = metas.length > 0 ? metas.map(m => m.descricao) : fallback ? [fallback] : []
                  return <GoalCard key={cfg.prazo} tone={cfg.tone} label={cfg.label} value={cfg.value} subtitle={cfg.subtitle} items={items} />
                })}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between">
                <SectionHeading step="2" title="Competências e Desenvolvimento" subtitle="Avaliação feita na sua sessão de PDI. O alvo de cada competência é definido com seu gestor." />
                <div className="hidden items-center gap-mx-md text-sm font-black md:flex">
                  <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-status-success" /> Nota atual</span>
                  <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-brand-primary" /> Alvo</span>
                </div>
              </div>
              <div className="mt-mx-sm grid gap-mx-md xl:grid-cols-2">
                <CompetencyPanel icon={<Wrench size={18} />} title="Competências técnicas" rows={tecnicas} />
                <CompetencyPanel icon={<Users size={18} />} title="Competências comportamentais" rows={comportamentais} />
              </div>
            </section>

            <section>
              <SectionHeading step="3" title="Plano de Ação" subtitle="Ações práticas para desenvolver suas competências e alcançar suas conquistas." />
              <Card className="mt-mx-sm overflow-hidden rounded-mx-lg border border-border-subtle bg-white p-0 shadow-mx-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="bg-surface-alt text-xs uppercase text-text-secondary">
                      <tr>
                        {['Ação', 'Competência', 'Impacto', 'Prazo', 'Status', 'Progresso'].map(label => <th key={label} className="px-mx-md py-mx-sm font-black">{label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {(activePDI.plano_acao || []).length === 0 && (
                        <tr><td colSpan={6} className="px-mx-md py-mx-lg text-center text-text-tertiary">Nenhuma ação registrada no seu plano ainda.</td></tr>
                      )}
                      {(activePDI.plano_acao || []).map((acao, index) => {
                        const info = statusInfo(acao.status)
                        return (
                          <tr key={acao.id || index} className="border-t border-border-subtle">
                            <td className="px-mx-md py-mx-sm font-black text-text-primary">{acao.descricao_acao}</td>
                            <td className="px-mx-md py-mx-sm font-bold text-text-secondary">{acao.competencia}</td>
                            <td className="px-mx-md py-mx-sm text-text-secondary">{acao.impacto || '—'}</td>
                            <td className="px-mx-md py-mx-sm font-bold">{acao.data_conclusao ? new Date(`${acao.data_conclusao.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '—'}</td>
                            <td className="px-mx-md py-mx-sm"><span className={`rounded-mx-sm px-2 py-1 text-xs font-black ${info.cls}`}>{info.label}</span></td>
                            <td className="px-mx-md py-mx-sm">
                              {info.progress !== null ? (
                                <div className="flex items-center gap-mx-xs">
                                  <span className="w-10 text-xs font-black">{info.progress}%</span>
                                  <Progress value={info.progress} />
                                </div>
                              ) : (
                                <span className="text-text-tertiary">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function filtrarAvaliacoes(pdi: PDISessionSummary | null, tipo: 'tecnica' | 'comportamental'): PDIAvaliacao360[] {
  if (!pdi) return []
  const avaliacoes = pdi.avaliacoes || []
  const doTipo = avaliacoes.filter(av => (av.tipo || 'tecnica') === tipo)
  // Sessões antigas podem não ter tipo gravado — nesse caso tudo cai em "técnica".
  return doTipo
}

function SectionHeading({ step, title, subtitle }: { step: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-mx-sm">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-black text-white">{step}</span>
      <div>
        <Typography variant="h2" className="text-xl uppercase leading-tight tracking-normal">{title}</Typography>
        {subtitle && <Typography variant="caption" tone="muted" className="normal-case tracking-normal">{subtitle}</Typography>}
      </div>
    </div>
  )
}

function GoalCard({ tone, label, value, subtitle, items }: { tone: 'green' | 'orange' | 'purple'; label: string; value: string; subtitle: string; items: string[] }) {
  const toneClass = tone === 'green' ? 'bg-status-success-surface text-status-success' : tone === 'orange' ? 'bg-status-warning-surface text-status-warning' : 'bg-brand-primary/10 text-brand-primary'
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="grid gap-mx-md lg:grid-cols-[80px_1fr]">
        <span className={`flex h-16 w-16 items-center justify-center rounded-full ${toneClass}`}><Target size={32} /></span>
        <div className="grid gap-mx-sm md:grid-cols-[160px_1fr]">
          <div>
            <Typography variant="h3" className="text-sm uppercase tracking-normal">{label}</Typography>
            <Typography variant="h2" className={`mt-1 text-2xl uppercase ${tone === 'green' ? 'text-status-success' : tone === 'orange' ? 'text-status-warning' : 'text-brand-primary'}`}>{value}</Typography>
            <Typography variant="caption" tone="muted" className="mt-1 block normal-case tracking-normal">{subtitle}</Typography>
          </div>
          <ul className="space-y-mx-xs">
            {items.length === 0 && (
              <li className="text-sm font-bold text-text-tertiary">Metas deste prazo ainda não registradas.</li>
            )}
            {items.map(item => (
              <li key={item} className="flex items-center gap-mx-xs text-sm font-bold text-text-secondary">
                <CheckCircle2 size={16} className="shrink-0 text-status-success" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}

function CompetencyPanel({ icon, title, rows }: { icon: React.ReactNode; title: string; rows: PDIAvaliacao360[] }) {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="mb-mx-md flex items-center gap-mx-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-mx-md bg-status-success-surface text-status-success">{icon}</span>
        <Typography variant="h3" className="text-sm uppercase tracking-normal">{title}</Typography>
      </div>
      {rows.length === 0 ? (
        <Typography variant="caption" tone="muted" className="block normal-case tracking-normal">Sem avaliações registradas nesta categoria.</Typography>
      ) : (
        <div className="grid gap-x-mx-xl gap-y-mx-sm md:grid-cols-2">
          {rows.map(av => (
            <div key={av.competencia_id || av.competencia} className="grid grid-cols-[1fr_42px_120px_28px] items-center gap-mx-xs">
              <Typography variant="caption" className="font-bold normal-case tracking-normal text-text-secondary">{av.competencia}</Typography>
              <span className="text-right text-sm font-black text-status-success">{notaBR(av.nota)}</span>
              <Progress value={(av.nota / Math.max(av.alvo || 10, 1)) * 100} />
              <span className="text-right text-sm font-black text-brand-primary">{av.alvo || 10}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-surface-alt">
      <div className="h-2 rounded-full bg-status-success" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}
