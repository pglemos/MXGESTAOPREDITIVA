import { useEffect, useMemo, useState } from 'react'
import { Calendar, CheckCircle2, Minus, Star, Target, TrendingDown, TrendingUp, Users, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { EmptyState } from '@/components/atoms/EmptyState'
import { Button } from '@/components/atoms/Button'
import { useAuth } from '@/hooks/useAuth'
import { useMyPDISessions, usePDI_MX } from '@/hooks/usePDI_MX'
import type { PDIAvaliacao360, PDICargo, PDIFormTemplate, PDIMeta360, PDISessionSummary } from '@/hooks/usePDI_MX'
import { useVendedorPerfil } from '@/features/crm/hooks/useVendedorPerfil'
import { buildPDIEvolution } from '@/lib/pdi-evolution'
import type { PDIEvolutionItem, PDIEvolutionResult, PDIEvolutionStatus } from '@/lib/pdi-evolution'
import { buildPDISelfAssessmentPayload } from '@/lib/pdi-self-assessment'
import { PDIEvolutionChart } from '@/features/pdi/PDIEvolutionChart'

const PRAZO_META: Array<{ prazo: string; tone: 'green' | 'orange' | 'purple'; label: string; value: string; subtitle: string; fallback: keyof Pick<PDISessionSummary, 'meta_6m' | 'meta_12m' | 'meta_24m'> }> = [
  { prazo: '6_meses', tone: 'green', label: 'Curto prazo', value: '6 meses', subtitle: 'Onde quero chegar nos próximos 6 meses.', fallback: 'meta_6m' },
  { prazo: '12_meses', tone: 'orange', label: 'Médio prazo', value: '12 meses', subtitle: 'Onde quero chegar nos próximos 12 meses.', fallback: 'meta_12m' },
  { prazo: '24_meses', tone: 'purple', label: 'Longo prazo', value: '24 meses', subtitle: 'Onde quero chegar nos próximos 24 meses.', fallback: 'meta_24m' },
]

const notaBR = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function defaultReviewDate() {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const statusInfo = (status?: string) => {
  const s = (status || '').toLowerCase()
  if (s.includes('conclu')) return { label: 'Concluída', cls: 'bg-status-success-surface text-status-success', progress: 100 }
  if (s.includes('cancel')) return { label: 'Cancelada', cls: 'bg-status-error-surface text-status-error', progress: null }
  return { label: status || 'Em andamento', cls: 'bg-status-info-surface text-status-info', progress: null }
}

export default function VendedorPDI() {
  const { profile, storeId } = useAuth()
  const { pdis, loading } = useMyPDISessions()
  const { vinculoTipo } = useVendedorPerfil()
  const { cargos, template, fetchCargos, fetchTemplate, saveSessionBundle } = usePDI_MX()
  const isAutonomo = vinculoTipo === 'autonomo'
  const [autoCargoId, setAutoCargoId] = useState('')
  const [autoReviewDate, setAutoReviewDate] = useState(defaultReviewDate())
  const [autoAvaliacoes, setAutoAvaliacoes] = useState<Record<string, number>>({})
  const [savingAutoAssessment, setSavingAutoAssessment] = useState(false)

  const activePDI = useMemo(() => {
    if (!pdis || pdis.length === 0) return null
    return [...pdis].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  }, [pdis])

  const tecnicas = useMemo(() => filtrarAvaliacoes(activePDI, 'tecnica'), [activePDI])
  const comportamentais = useMemo(() => filtrarAvaliacoes(activePDI, 'comportamental'), [activePDI])
  const evolucaoPDI = useMemo(() => buildPDIEvolution(pdis), [pdis])
  const hojeLabel = `${new Date().toLocaleDateString('pt-BR')} (${new Date().toLocaleDateString('pt-BR', { weekday: 'long' })})`

  useEffect(() => {
    if (!isAutonomo) return
    void fetchCargos()
  }, [fetchCargos, isAutonomo])

  useEffect(() => {
    if (!isAutonomo || autoCargoId || cargos.length === 0) return
    setAutoCargoId(cargos[0].id)
  }, [autoCargoId, cargos, isAutonomo])

  useEffect(() => {
    if (!isAutonomo || !autoCargoId) return
    void fetchTemplate(autoCargoId)
  }, [autoCargoId, fetchTemplate, isAutonomo])

  useEffect(() => {
    if (!isAutonomo || !template?.competencias?.length) return
    const initialNota = template.escala[0]?.nota || 6
    setAutoAvaliacoes(prev => {
      const next = { ...prev }
      template.competencias.forEach(competencia => {
        if (typeof next[competencia.id] !== 'number') next[competencia.id] = initialNota
      })
      return next
    })
  }, [isAutonomo, template])

  const handleSelfAssessmentSubmit = async () => {
    if (!profile?.id) {
      toast.error('Sessão inválida.')
      return
    }
    if (!template?.competencias?.length) {
      toast.error('Competências do PDI não carregadas.')
      return
    }

    setSavingAutoAssessment(true)
    try {
      const payload = buildPDISelfAssessmentPayload({
        sellerId: profile.id,
        cargoId: autoCargoId,
        lojaId: storeId || null,
        proximaRevisaoData: autoReviewDate,
        competencias: template.competencias.map(competencia => ({ id: competencia.id, alvo: competencia.alvo })),
        avaliacoes: autoAvaliacoes,
      })
      await saveSessionBundle(payload)
      toast.success('Autoavaliação registrada no PDI.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar autoavaliação.')
    } finally {
      setSavingAutoAssessment(false)
    }
  }

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
          <div className="hidden items-center gap-mx-sm text-sm font-bold text-text-primary md:flex">
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

        {isAutonomo && (
          <section>
            <SectionHeading step="A" title="Autoavaliação" subtitle="Registro das suas competências como vendedor autônomo." />
            <SelfAssessmentPanel
              cargos={cargos}
              template={template}
              cargoId={autoCargoId}
              reviewDate={autoReviewDate}
              avaliacoes={autoAvaliacoes}
              saving={savingAutoAssessment}
              onCargoChange={setAutoCargoId}
              onReviewDateChange={setAutoReviewDate}
              onNotaChange={(competenciaId, nota) => setAutoAvaliacoes(prev => ({ ...prev, [competenciaId]: nota }))}
              onSubmit={handleSelfAssessmentSubmit}
            />
          </section>
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
                <div className="hidden items-center gap-mx-md text-sm font-bold md:flex">
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
              <SectionHeading step="3" title="Evolução das notas" subtitle="Comparativo das suas competências nas sessões de PDI." />
              <PDIProgressPanel evolution={evolucaoPDI} />
              <PDIEvolutionChart evolution={evolucaoPDI} />
            </section>

            <section>
              <SectionHeading step="4" title="Plano de Ação" subtitle="Ações práticas para desenvolver suas competências e alcançar suas conquistas." />
              <Card className="mt-mx-sm overflow-hidden rounded-mx-lg border border-border-subtle bg-white p-0 shadow-mx-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="bg-surface-alt text-xs uppercase text-text-secondary">
                      <tr>
                        {['Ação', 'Competência', 'Impacto', 'Prazo', 'Status', 'Progresso'].map(label => <th key={label} className="px-mx-md py-mx-sm font-bold">{label}</th>)}
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
                            <td className="px-mx-md py-mx-sm font-bold text-text-primary">{acao.descricao_acao}</td>
                            <td className="px-mx-md py-mx-sm font-bold text-text-secondary">{acao.competencia}</td>
                            <td className="px-mx-md py-mx-sm text-text-secondary">{acao.impacto || '—'}</td>
                            <td className="px-mx-md py-mx-sm font-bold">{acao.data_conclusao ? new Date(`${acao.data_conclusao.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '—'}</td>
                            <td className="px-mx-md py-mx-sm"><span className={`rounded-mx-sm px-2 py-1 text-xs font-bold ${info.cls}`}>{info.label}</span></td>
                            <td className="px-mx-md py-mx-sm">
                              {info.progress !== null ? (
                                <div className="flex items-center gap-mx-xs">
                                  <span className="w-10 text-xs font-bold">{info.progress}%</span>
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

function SelfAssessmentPanel({
  cargos,
  template,
  cargoId,
  reviewDate,
  avaliacoes,
  saving,
  onCargoChange,
  onReviewDateChange,
  onNotaChange,
  onSubmit,
}: {
  cargos: PDICargo[]
  template: PDIFormTemplate | null
  cargoId: string
  reviewDate: string
  avaliacoes: Record<string, number>
  saving: boolean
  onCargoChange: (value: string) => void
  onReviewDateChange: (value: string) => void
  onNotaChange: (competenciaId: string, nota: number) => void
  onSubmit: () => void
}) {
  const minNota = template?.escala?.[0]?.nota || 6
  const maxNota = template?.escala?.[template.escala.length - 1]?.nota || 10

  return (
    <Card className="mt-mx-sm rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="grid gap-mx-md lg:grid-cols-[260px_1fr]">
        <div className="grid content-start gap-mx-sm">
          <label className="grid gap-1 text-xs font-bold uppercase text-text-secondary">
            Cargo
            <select
              value={cargoId}
              onChange={event => onCargoChange(event.target.value)}
              className="h-mx-xl rounded-mx-md border border-border-subtle bg-surface-alt px-mx-sm text-sm font-bold text-text-primary outline-none focus:border-brand-primary"
              aria-label="Cargo da autoavaliação"
            >
              <option value="">Selecione o cargo</option>
              {cargos.map(cargo => (
                <option key={cargo.id} value={cargo.id}>{cargo.nome}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs font-bold uppercase text-text-secondary">
            Próxima revisão
            <input
              type="date"
              value={reviewDate}
              onChange={event => onReviewDateChange(event.target.value)}
              className="h-mx-xl rounded-mx-md border border-border-subtle bg-surface-alt px-mx-sm text-sm font-bold text-text-primary outline-none focus:border-brand-primary"
              aria-label="Data da próxima revisão"
            />
          </label>

          <Button type="button" onClick={onSubmit} disabled={saving || !cargoId || !template?.competencias?.length} className="mt-mx-xs h-mx-xl rounded-mx-md font-bold uppercase">
            {saving ? 'Salvando...' : 'Salvar autoavaliação'}
          </Button>
        </div>

        <div className="grid gap-mx-sm md:grid-cols-2">
          {!template?.competencias?.length && (
            <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Selecione um cargo para carregar as competências.</Typography>
          )}

          {template?.competencias?.map(competencia => {
            const nota = avaliacoes[competencia.id] ?? minNota
            return (
              <div key={competencia.id} className="rounded-mx-md border border-border-subtle bg-surface-alt/40 px-mx-md py-mx-sm">
                <div className="flex items-start justify-between gap-mx-sm">
                  <div>
                    <Typography variant="h3" className="text-sm uppercase tracking-normal">{competencia.nome}</Typography>
                    <Typography variant="caption" tone="muted" className="normal-case tracking-normal">{competencia.indicador}</Typography>
                  </div>
                  <span className="min-w-10 rounded-mx-sm bg-white px-2 py-1 text-center text-sm font-bold text-brand-primary">{nota}</span>
                </div>
                <input
                  type="range"
                  min={minNota}
                  max={maxNota}
                  value={nota}
                  onChange={event => onNotaChange(competencia.id, Number(event.target.value))}
                  aria-label={`Nota de ${competencia.nome}`}
                  className="mt-mx-sm w-full accent-brand-primary"
                />
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

function PDIProgressPanel({ evolution }: { evolution: PDIEvolutionResult }) {
  const counts = contarStatus(evolution.items)

  if (!evolution.comparavel) {
    return (
      <Card className="mt-mx-sm rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
        <div className="flex flex-col gap-mx-sm md:flex-row md:items-center md:justify-between">
          <div>
            <Typography variant="h3" className="text-base uppercase tracking-normal">Evolução disponível quando houver duas sessões avaliadas</Typography>
            <Typography variant="caption" tone="muted" className="mt-1 block normal-case tracking-normal">
              Sessões avaliadas agora: {evolution.totalSessoes}
            </Typography>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-mx-sm bg-surface-alt px-3 py-2 text-xs font-bold uppercase text-text-secondary">
            <Minus size={14} /> Sem comparação
          </span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="mt-mx-sm rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="grid gap-mx-md lg:grid-cols-[260px_1fr]">
        <div className="grid gap-mx-sm sm:grid-cols-3 lg:grid-cols-1">
          <EvolutionStat label="Evoluindo" value={counts.evoluindo} status="evoluindo" />
          <EvolutionStat label="Estagnadas" value={counts.estagnado} status="estagnado" />
          <EvolutionStat label="Em queda" value={counts.queda} status="queda" />
        </div>

        <div className="grid gap-mx-sm">
          {evolution.items.slice(0, 6).map(item => (
            <EvolutionRow key={item.competenciaId} item={item} />
          ))}
        </div>
      </div>
    </Card>
  )
}

function EvolutionStat({ label, value, status }: { label: string; value: number; status: PDIEvolutionStatus }) {
  const info = evolutionStatusInfo(status)
  const Icon = info.Icon

  return (
    <div className={`rounded-mx-md border px-mx-md py-mx-sm ${info.surface}`}>
      <div className="flex items-center justify-between gap-mx-sm">
        <span className="text-xs font-bold uppercase text-text-secondary">{label}</span>
        <Icon size={16} className={info.text} />
      </div>
      <div className={`mt-1 text-2xl font-bold ${info.text}`}>{value}</div>
    </div>
  )
}

function EvolutionRow({ item }: { item: PDIEvolutionItem }) {
  const info = evolutionStatusInfo(item.status)
  const Icon = info.Icon
  const firstPoint = item.pontos[0]
  const lastPoint = item.pontos[item.pontos.length - 1]

  return (
    <div className="rounded-mx-md border border-border-subtle bg-surface-alt/40 px-mx-md py-mx-sm">
      <div className="flex flex-col gap-mx-xs md:flex-row md:items-start md:justify-between">
        <div>
          <Typography variant="h3" className="text-sm uppercase tracking-normal">{item.competencia}</Typography>
          <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
            {firstPoint?.dateLabel} → {lastPoint?.dateLabel}
          </Typography>
        </div>
        <span className={`inline-flex w-fit items-center gap-2 rounded-mx-sm px-2 py-1 text-xs font-bold uppercase ${info.badge}`}>
          <Icon size={14} /> {info.label}
        </span>
      </div>

      <div className="mt-mx-sm grid gap-mx-xs md:grid-cols-[58px_1fr_58px_1fr_64px] md:items-center">
        <span className="text-sm font-bold text-text-secondary">{notaBR(item.notaAnterior)}</span>
        <Progress value={(item.notaAnterior / item.alvoAtual) * 100} />
        <span className={`text-sm font-bold ${info.text}`}>{formatDelta(item.delta)}</span>
        <Progress value={item.percentualAtual} />
        <span className="text-right text-sm font-bold text-text-primary">{notaBR(item.notaAtual)}</span>
      </div>
    </div>
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
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">{step}</span>
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
              <span className="text-right text-sm font-bold text-status-success">{notaBR(av.nota)}</span>
              <Progress value={(av.nota / Math.max(av.alvo || 10, 1)) * 100} />
              <span className="text-right text-sm font-bold text-brand-primary">{av.alvo || 10}</span>
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

function contarStatus(items: PDIEvolutionItem[]) {
  return items.reduce(
    (acc, item) => {
      acc[item.status] += 1
      return acc
    },
    { evoluindo: 0, estagnado: 0, queda: 0 } satisfies Record<PDIEvolutionStatus, number>,
  )
}

function evolutionStatusInfo(status: PDIEvolutionStatus) {
  if (status === 'evoluindo') {
    return {
      label: 'Evoluindo',
      Icon: TrendingUp,
      surface: 'border-status-success-surface bg-status-success-surface',
      badge: 'bg-status-success-surface text-status-success',
      text: 'text-status-success',
    }
  }

  if (status === 'queda') {
    return {
      label: 'Em queda',
      Icon: TrendingDown,
      surface: 'border-status-error-surface bg-status-error-surface',
      badge: 'bg-status-error-surface text-status-error',
      text: 'text-status-error',
    }
  }

  return {
    label: 'Estagnado',
    Icon: Minus,
    surface: 'border-status-warning-surface bg-status-warning-surface',
    badge: 'bg-status-warning-surface text-status-warning',
    text: 'text-status-warning',
  }
}

function formatDelta(delta: number) {
  if (delta > 0) return `+${notaBR(delta)}`
  return notaBR(delta)
}
