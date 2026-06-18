import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  MoreVertical,
  PlayCircle,
  Plus,
  Star,
  Target,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/atoms/Button'
import { EmptyState } from '@/components/atoms/EmptyState'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { Modal } from '@/components/organisms/Modal'
import { useAuth } from '@/hooks/useAuth'
import { useMyPDISessions, usePDI_MX } from '@/hooks/usePDI_MX'
import type {
    PDIAvaliacao360,
    PDICargo,
    PDICreateActionInput,
    PDIFormTemplate,
    PDIUpdateActionInput,
    PDIMeta360,
    PDIPlanoAcao360,
    PDISessionSummary,
} from '@/hooks/usePDI_MX'
import { useVendedorPerfil } from '@/features/crm/hooks/useVendedorPerfil'
import { buildPDIEvolution } from '@/lib/pdi-evolution'
import type { PDIEvolutionItem, PDIEvolutionResult, PDIEvolutionStatus } from '@/lib/pdi-evolution'
import { buildPDISelfAssessmentPayload } from '@/lib/pdi-self-assessment'

type GoalTone = 'green' | 'orange' | 'purple'

const PRAZO_META: Array<{
  prazo: string
  tone: GoalTone
  label: string
  value: string
  subtitle: string
  fallback: keyof Pick<PDISessionSummary, 'meta_6m' | 'meta_12m' | 'meta_24m'>
}> = [
  {
    prazo: '6_meses',
    tone: 'green',
    label: 'Curto Prazo',
    value: '1 ANO',
    subtitle: 'Onde quero chegar nos próximos 12 meses.',
    fallback: 'meta_6m',
  },
  {
    prazo: '12_meses',
    tone: 'orange',
    label: 'Médio Prazo',
    value: '2 ANOS',
    subtitle: 'Onde quero chegar nos próximos 2 anos.',
    fallback: 'meta_12m',
  },
  {
    prazo: '24_meses',
    tone: 'purple',
    label: 'Longo Prazo',
    value: '3 ANOS',
    subtitle: 'Onde quero chegar nos próximos 3 anos.',
    fallback: 'meta_24m',
  },
]

const CONTEUDOS_RECOMENDADOS = [
  {
    titulo: 'Comunicação Assertiva',
    competencia: 'Comunicação',
    duracao: '25 min',
    nivel: 'Intermediário',
  },
  {
    titulo: 'Organização Pessoal',
    competencia: 'Organização',
    duracao: '18 min',
    nivel: 'Iniciante',
  },
  {
    titulo: 'Liderança de Alta Performance',
    competencia: 'Liderança',
    duracao: '32 min',
    nivel: 'Avançado',
  },
]

type OverlayState =
  | { type: 'goal'; sessionId: string; goal: GoalView }
  | { type: 'new-action'; sessionId: string; competencias: PDIAvaliacao360[]; goals: GoalView[] }
  | { type: 'action-detail'; action: PDIPlanoAcao360; progress: number; status: ReturnType<typeof statusInfo> }
  | null

interface GoalView {
  prazo: string
  tone: GoalTone
  label: string
  value: string
  subtitle: string
  items: string[]
}

interface SummaryView {
  notaGeral: number
  deltaMes: number
  competenciasNoAlvo: number
  competenciasTotal: number
  acoesEmAndamento: number
  planoAtivoPct: number
  acoesConcluidas: number
  planoConcluidoPct: number
}

interface ActionRow {
  action: PDIPlanoAcao360
  status: ReturnType<typeof statusInfo>
  progress: number
}

interface HistoryRow {
  dateLabel: string
  evaluator: string
  competencia: string
  before: number
  after: number
  delta: number
}

const notaBR = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function defaultReviewDate() {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  return toDateInputValue(date)
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function VendedorPDI() {
const { profile, storeId } = useAuth()
const { pdis, loading, refetch } = useMyPDISessions()
const { vinculoTipo } = useVendedorPerfil()
const {
cargos,
template,
fetchCargos,
fetchTemplate,
saveSessionBundle,
createSellerPDIAction,
updateSellerPDIAction,
updateSellerPDIActionStatus,
updateSellerPDIGoals,
linkSellerPDIActionContent,
sendSellerPDIActionToCentral,
} = usePDI_MX()
  const isAutonomo = vinculoTipo === 'autonomo'

  const [autoCargoId, setAutoCargoId] = useState('')
  const [autoReviewDate, setAutoReviewDate] = useState(defaultReviewDate())
  const [autoAvaliacoes, setAutoAvaliacoes] = useState<Record<string, number>>({})
  const [savingAutoAssessment, setSavingAutoAssessment] = useState(false)
  const [overlay, setOverlay] = useState<OverlayState>(null)

  const sortedPDIs = useMemo(() => sortSessions(pdis), [pdis])
  const activePDI = sortedPDIs[0] || null
  const previousPDI = sortedPDIs[1] || null
  const tecnicas = useMemo(() => filtrarAvaliacoes(activePDI, 'tecnica'), [activePDI])
  const comportamentais = useMemo(() => filtrarAvaliacoes(activePDI, 'comportamental'), [activePDI])
  const evolucaoPDI = useMemo(() => buildPDIEvolution(pdis), [pdis])
  const summary = useMemo(() => buildSummary(activePDI, previousPDI), [activePDI, previousPDI])
  const goals = useMemo(() => buildGoals(activePDI), [activePDI])
  const actionRows = useMemo(() => buildActionRows(activePDI), [activePDI])
  const gargalos = useMemo(() => buildGargalos(activePDI), [activePDI])
  const historyRows = useMemo(() => buildHistoryRows(sortedPDIs), [sortedPDIs])

  const hojeLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const reviewDateLabel = formatDate(activePDI?.proxima_revisao_data || activePDI?.due_date || defaultReviewDate())
  const recommendedFocus = gargalos[0]?.competencia || 'Liderança'

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

  async function handleSelfAssessmentSubmit() {
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

async function handleSaveGoals(input: { sessionId: string; prazo: string; metas: string[] }) {
  const metas = input.metas
    .map(descricao => descricao.trim())
    .filter(Boolean)
    .map(descricao => ({ descricao, tipo: 'profissional' }))

  const { error } = await updateSellerPDIGoals({
    sessaoId: input.sessionId,
    prazo: input.prazo,
    metas,
  })

  if (error) {
    toast.error(error)
    return
  }
  await refetch()
  setOverlay(null)
  toast.success('Conquistas salvas no PDI.')
}

async function handleCreateAction(input: PDICreateActionInput) {
  if (!input.descricaoAcao.trim()) {
    toast.error('Informe o título da ação.')
    return
  }

  const { error } = await createSellerPDIAction(input)
  if (error) {
    toast.error(error)
    return
  }
  await refetch()
  setOverlay(null)
  toast.success('Ação salva no PDI.')
}

async function handleUpdateAction(input: PDIUpdateActionInput) {
  if (!input.actionId || !input.descricaoAcao.trim()) {
    toast.error('Informe os dados da ação.')
    return
  }

  const { error } = await updateSellerPDIAction(input)
  if (error) {
    toast.error(error)
    return
  }
  await refetch()
  setOverlay(null)
  toast.success('Ação atualizada no PDI.')
}

async function handleActionStatus(action: PDIPlanoAcao360, status: 'concluida' | 'justificada', justificativa?: string) {
  if (!action.id) {
    toast.error('Ação sem identificador para atualização.')
    return
  }

  if (status === 'justificada' && !justificativa?.trim()) {
    toast.error('Informe a justificativa do atraso.')
    return
  }

  const { error } = await updateSellerPDIActionStatus({
    actionId: action.id,
    status,
    justificativa,
  })
  if (error) {
    toast.error(error)
    return
  }
  await refetch()
  setOverlay(null)
  toast.success(status === 'concluida' ? 'Ação marcada como concluída.' : 'Atraso justificado no PDI.')
}

async function handleLinkContent(action: PDIPlanoAcao360) {
  if (!action.id) {
    toast.error('Ação sem identificador para vincular conteúdo.')
    return
  }
  const { error } = await linkSellerPDIActionContent(action.id)
  if (error) {
    toast.error(error)
    return
  }
  toast.success('Conteúdo recomendado vinculado à ação.')
}

async function handleSendToCentral(action: PDIPlanoAcao360) {
  if (!action.id) {
    toast.error('Ação sem identificador para enviar à Central.')
    return
  }
  const { error } = await sendSellerPDIActionToCentral(action.id)
  if (error) {
    toast.error(error)
    return
  }
  await refetch()
  toast.success('Ação enviada para a Central de Execução.')
}

return (
    <main className="h-full w-full overflow-y-auto bg-white p-mx-md md:p-mx-lg no-scrollbar">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-mx-lg pb-20">
        <header className="flex flex-col gap-mx-md border-b border-border-subtle pb-mx-md lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-mx-sm">
            <Star size={34} className="text-brand-primary" />
            <div>
              <Typography variant="h1" className="text-3xl uppercase leading-tight tracking-normal">PDI</Typography>
              <Typography variant="p" tone="muted" className="text-sm">Seu Plano de Desenvolvimento Individual</Typography>
            </div>
          </div>

          {/* Data contextual apenas; notificações e perfil já vivem no top bar global (evita duplicação). */}
          <span className="inline-flex h-10 items-center gap-mx-xs rounded-mx-md border border-border-subtle bg-white px-mx-sm text-sm font-bold text-text-primary">
            <Calendar size={17} /> {capitalize(hojeLabel)}
          </span>
        </header>

        {loading && !activePDI && <Typography tone="muted">Carregando seu PDI...</Typography>}

        {!loading && !activePDI && (
          <EmptyState
            title="Você ainda não tem um PDI registrado"
            description="O PDI é construído junto com seu gestor na sessão de desenvolvimento. Fale com ele para agendar a sua."
          />
        )}

        {isAutonomo && !activePDI && (
          <section>
            <SectionHeading title="Autoavaliação" subtitle="Registro das suas competências como vendedor autônomo." />
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
            <SummaryGrid summary={summary} reviewDateLabel={reviewDateLabel} updatedAt={activePDI.data_realizacao || activePDI.created_at} />

            <section>
              <SectionHeading title="Conquistas" subtitle={activePDI.manager_name ? `PDI conduzido por ${activePDI.manager_name}` : undefined} />
              <div className="mt-mx-sm grid gap-mx-md xl:grid-cols-3">
{goals.map(goal => (
<GoalCard key={goal.prazo} goal={goal} onEdit={() => setOverlay({ type: 'goal', sessionId: activePDI.id, goal })} />
))}
              </div>
            </section>

            <section>
              <div className="flex flex-col gap-mx-sm md:flex-row md:items-center md:justify-between">
                <SectionHeading title="Competências e Desenvolvimento" subtitle="Avaliação feita na sessão de PDI, com alvo e origem da nota visíveis." />
                <div className="flex flex-wrap items-center gap-mx-md text-sm font-bold">
                  <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-status-success" /> Nota atual</span>
                  <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-brand-primary" /> Alvo</span>
                  <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-surface-alt ring-1 ring-border-subtle" /> Origem da nota</span>
                </div>
              </div>
              <div className="mt-mx-sm grid gap-mx-md xl:grid-cols-2">
                <CompetencyPanel icon={<Wrench size={18} />} title="Competências Técnicas" rows={tecnicas} />
                <CompetencyPanel icon={<Users size={18} />} title="Competências Comportamentais" rows={comportamentais} />
              </div>
            </section>

            <section>
              <div className="flex flex-col gap-mx-sm md:flex-row md:items-center md:justify-between">
                <SectionHeading title="Plano de Ação" subtitle="Ações práticas para desenvolver competências e alcançar conquistas." />
<Button type="button" size="sm" onClick={() => setOverlay({ type: 'new-action', sessionId: activePDI.id, competencias: activePDI.avaliacoes, goals })}>
                  <Plus size={16} /> Nova ação
                </Button>
              </div>
              <ActionPlanTable rows={actionRows} onDetail={(row) => setOverlay({ type: 'action-detail', action: row.action, progress: row.progress, status: row.status })} />
            </section>

            <section>
              <SectionHeading title="Painel lateral" subtitle="Evolução, gargalos, recomendação e próxima avaliação." />
              <div className="mt-mx-sm grid gap-mx-md xl:grid-cols-[1.35fr_1fr_1fr_1fr]">
                <EvolutionCard evolution={evolucaoPDI} delta={summary.deltaMes} />
                <BottleneckCard gargalos={gargalos} />
                <RecommendationCard focus={recommendedFocus} />
                <NextEvaluationCard dateLabel={reviewDateLabel} managerName={activePDI.manager_name} />
              </div>
            </section>

            <section>
              <SectionHeading title="Histórico de avaliações" subtitle="Quem avaliou, o que mudou e qual foi a evolução." />
              <HistoryTable rows={historyRows} />
            </section>

            <section>
              <SectionHeading title="Conteúdos recomendados para evoluir" subtitle="Conteúdos vinculados aos gargalos e às próximas ações do PDI." />
              <RecommendedContentCards />
            </section>

            <Card className="rounded-mx-lg border border-border-subtle bg-surface-alt/50 p-mx-md shadow-none">
              <div className="flex items-start gap-mx-sm text-sm font-semibold text-text-secondary">
                <AlertTriangle size={17} className="mt-0.5 shrink-0 text-status-warning" />
                <span>O PDI orienta desenvolvimento, treinamentos e ações. Ele só impacta o Score se houver regra de ajuste definida e auditável.</span>
              </div>
            </Card>
          </>
        )}
      </div>

      <PDIOverlayModal
        overlay={overlay}
        onClose={() => setOverlay(null)}
        onSaveGoals={handleSaveGoals}
        onCreateAction={handleCreateAction}
        onUpdateAction={handleUpdateAction}
        onCompleteAction={(action) => handleActionStatus(action, 'concluida')}
        onJustifyAction={(action, justificativa) => handleActionStatus(action, 'justificada', justificativa)}
        onLinkContent={handleLinkContent}
        onSendToCentral={handleSendToCentral}
      />
    </main>
  )
}

function SummaryGrid({ summary, reviewDateLabel, updatedAt }: { summary: SummaryView; reviewDateLabel: string; updatedAt: string }) {
  return (
    <section aria-label="Resumo geral do PDI" className="grid gap-mx-md md:grid-cols-2 xl:grid-cols-6">
      <SummaryCard
        title="Nota geral do PDI"
        icon={<Star size={20} />}
        value={notaBR(summary.notaGeral)}
        subtitle="/ 10"
        detail="Bom desempenho"
        footer={`Última atualização: ${formatDate(updatedAt)}`}
        tone="green"
      />
      <SummaryCard
        title="Evolução no mês"
        icon={<TrendingUp size={20} />}
        value={formatSigned(summary.deltaMes)}
        subtitle="vs. mês anterior"
        detail={`${notaBR(summary.notaGeral - summary.deltaMes)} → ${notaBR(summary.notaGeral)}`}
        tone="green"
      />
      <SummaryCard
        title="Competências no alvo"
        icon={<Target size={20} />}
        value={`${summary.competenciasNoAlvo} de ${summary.competenciasTotal}`}
        subtitle={`${percent(summary.competenciasNoAlvo, summary.competenciasTotal)}% no alvo`}
        progress={percent(summary.competenciasNoAlvo, summary.competenciasTotal)}
        tone="green"
      />
      <SummaryCard
        title="Ações em andamento"
        icon={<Clock3 size={20} />}
        value={`${summary.acoesEmAndamento}`}
        subtitle="ações"
        detail={`${summary.planoAtivoPct}% do plano ativo`}
        progress={summary.planoAtivoPct}
        tone="blue"
      />
      <SummaryCard
        title="Ações concluídas"
        icon={<CheckCircle2 size={20} />}
        value={`${summary.acoesConcluidas}`}
        subtitle="ações"
        detail={`${summary.planoConcluidoPct}% do plano concluído`}
        progress={summary.planoConcluidoPct}
        tone="green"
      />
      <SummaryCard
        title="Próxima revisão"
        icon={<Calendar size={20} />}
        value={reviewDateLabel}
        subtitle="Com seu gestor direto"
        detail="Em 35 dias"
        tone="purple"
      />
    </section>
  )
}

function SummaryCard({
  title,
  icon,
  value,
  subtitle,
  detail,
  footer,
  progress,
  tone,
}: {
  title: string
  icon: ReactNode
  value: string
  subtitle?: string
  detail?: string
  footer?: string
  progress?: number
  tone: 'green' | 'blue' | 'purple'
}) {
  const toneClass = tone === 'green'
    ? 'bg-status-success-surface text-status-success'
    : tone === 'blue'
      ? 'bg-status-info-surface text-status-info'
      : 'bg-brand-primary/10 text-brand-primary'

  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm">
      <div className="flex items-start justify-between gap-mx-sm">
        <Typography variant="h3" className="text-sm tracking-normal">{title}</Typography>
        <span className={`flex h-9 w-9 items-center justify-center rounded-mx-md ${toneClass}`}>{icon}</span>
      </div>
      <div className="mt-mx-sm flex items-end gap-1">
        <span className="text-2xl font-black text-text-primary">{value}</span>
        {subtitle && <span className="pb-1 text-xs font-bold text-text-tertiary">{subtitle}</span>}
      </div>
      {detail && <Typography variant="caption" className="mt-2 block normal-case tracking-normal text-text-secondary">{detail}</Typography>}
      {typeof progress === 'number' && <Progress value={progress} className="mt-mx-sm" />}
      {footer && <Typography variant="tiny" tone="muted" className="mt-mx-sm block">{footer}</Typography>}
    </Card>
  )
}

function GoalCard({ goal, onEdit }: { goal: GoalView; onEdit: () => void }) {
  const toneClass = goal.tone === 'green'
    ? 'bg-status-success-surface text-status-success'
    : goal.tone === 'orange'
      ? 'bg-status-warning-surface text-status-warning'
      : 'bg-brand-primary/10 text-brand-primary'

  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="grid gap-mx-md lg:grid-cols-[72px_1fr]">
        <span className={`flex h-16 w-16 items-center justify-center rounded-full ${toneClass}`}><Target size={30} /></span>
        <div>
          <div className="grid gap-mx-sm md:grid-cols-[145px_1fr]">
            <div>
              <Typography variant="h3" className="text-sm tracking-normal">{goal.label}</Typography>
              <Typography variant="h2" className={`mt-1 text-2xl ${toneClass.split(' ').at(-1)}`}>{goal.value}</Typography>
              <Typography variant="caption" tone="muted" className="mt-1 block normal-case tracking-normal">{goal.subtitle}</Typography>
            </div>
            <ul className="space-y-mx-xs">
              {goal.items.length === 0 && <li className="text-sm font-bold text-text-tertiary">Metas deste prazo ainda não registradas.</li>}
              {goal.items.map(item => (
                <li key={item} className="flex items-center gap-mx-xs text-sm font-bold text-text-secondary">
                  <CheckCircle2 size={16} className="shrink-0 text-status-success" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <button type="button" onClick={onEdit} className="mt-mx-md inline-flex items-center gap-mx-xs text-xs font-black text-brand-primary">
            <Edit3 size={14} /> Editar conquistas
          </button>
        </div>
      </div>
    </Card>
  )
}

function CompetencyPanel({ icon, title, rows }: { icon: ReactNode; title: string; rows: PDIAvaliacao360[] }) {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="mb-mx-md flex items-center gap-mx-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-mx-md bg-status-success-surface text-status-success">{icon}</span>
        <Typography variant="h3" className="text-sm tracking-normal">{title}</Typography>
      </div>

      {rows.length === 0 ? (
        <Typography variant="caption" tone="muted" className="block normal-case tracking-normal">Sem avaliações registradas nesta categoria.</Typography>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-xs uppercase text-text-secondary">
              <tr>
                {['Competência', 'Nota atual', 'Alvo', 'Origem da nota'].map(label => (
                  <th scope="col" key={label} className="pb-mx-sm font-black">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(av => (
                <tr key={av.competencia_id || av.competencia} className="border-t border-border-subtle">
                  <td className="py-mx-sm pr-mx-md font-bold text-text-secondary">{av.competencia}</td>
                  <td className="py-mx-sm pr-mx-md">
                    <div className="grid grid-cols-[42px_1fr] items-center gap-mx-sm">
                      <span className={av.nota < 7 ? 'font-black text-status-warning' : 'font-black text-status-success'}>{notaBR(av.nota)}</span>
                      <Progress value={(av.nota / Math.max(av.alvo || 10, 1)) * 100} />
                    </div>
                  </td>
                  <td className="py-mx-sm pr-mx-md font-black text-brand-primary">{av.alvo || 10}</td>
                  <td className="py-mx-sm font-semibold text-text-secondary">{originLabel(av.origem_nota)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function ActionPlanTable({ rows, onDetail }: { rows: ActionRow[]; onDetail: (row: ActionRow) => void }) {
  return (
    <Card className="mt-mx-sm overflow-hidden rounded-mx-lg border border-border-subtle bg-white p-0 shadow-mx-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="bg-surface-alt text-xs uppercase text-text-secondary">
            <tr>
              {['Ação', 'Competência', 'Conquista vinculada', 'Origem', 'Prazo', 'Status', 'Progresso', 'Ações'].map(label => (
                <th scope="col" key={label} className="px-mx-md py-mx-sm font-black">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-mx-md py-mx-lg text-center text-text-tertiary">Nenhuma ação registrada no seu plano ainda.</td>
              </tr>
            )}
            {rows.map(row => (
              <tr key={row.action.id || row.action.descricao_acao} className="border-t border-border-subtle">
                <td className="px-mx-md py-mx-sm font-bold text-text-primary">{row.action.descricao_acao}</td>
                <td className="px-mx-md py-mx-sm font-bold text-text-secondary">{row.action.competencia}</td>
                <td className="px-mx-md py-mx-sm text-text-secondary">{row.action.impacto || 'Curto Prazo (1 ano)'}</td>
                <td className="px-mx-md py-mx-sm text-text-secondary">{actionOrigin(row.action)}</td>
                <td className="px-mx-md py-mx-sm font-bold">{formatDate(row.action.data_conclusao)}</td>
                <td className="px-mx-md py-mx-sm">
                  <span className={`rounded-mx-sm px-2 py-1 text-xs font-bold ${row.status.cls}`}>{row.status.label}</span>
                </td>
                <td className="px-mx-md py-mx-sm">
                  <div className="flex items-center gap-mx-xs">
                    <span className="w-10 text-xs font-bold">{row.progress}%</span>
                    <Progress value={row.progress} />
                  </div>
                </td>
                <td className="px-mx-md py-mx-sm">
                  <div className="flex items-center gap-mx-xs">
                    <Button type="button" variant="secondary" size="xs" onClick={() => onDetail(row)}>
                      <Eye size={14} /> Ver detalhe
                    </Button>
                    <button type="button" aria-label={`Mais ações para ${row.action.descricao_acao}`} className="flex h-8 w-8 items-center justify-center rounded-mx-sm text-text-tertiary hover:bg-surface-alt">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function EvolutionCard({ evolution, delta }: { evolution: PDIEvolutionResult; delta: number }) {
  const counts = contarStatus(evolution.items)

  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="flex items-start justify-between gap-mx-md">
        <div>
          <Typography variant="h3" className="text-sm tracking-normal">Evolução do PDI</Typography>
          <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Evolução das notas nos últimos 90 dias</Typography>
        </div>
        <select aria-label="Período de evolução do PDI" className="h-9 rounded-mx-md border border-border-subtle bg-white px-2 text-xs font-bold">
          <option>Últimos 90 dias</option>
          <option>Últimos 30 dias</option>
        </select>
      </div>

      <MiniEvolutionChart delta={delta} />

      {!evolution.comparavel ? (
        <div className="mt-mx-sm rounded-mx-md bg-surface-alt px-mx-md py-mx-sm text-sm font-bold text-text-secondary">
          Evolução disponível quando houver duas sessões avaliadas
        </div>
      ) : (
        <div className="mt-mx-sm grid gap-mx-xs">
          {evolution.items.slice(0, 4).map(item => (
            <EvolutionRow key={item.competenciaId} item={item} />
          ))}
        </div>
      )}

      <div className="mt-mx-md flex flex-wrap items-center gap-mx-sm text-xs font-bold">
        <span className="rounded-mx-sm bg-status-success-surface px-2 py-1 text-status-success">{formatSigned(delta)} no mês</span>
        <span className="text-text-secondary">Sua evolução segue em ritmo positivo.</span>
        <span className="text-text-tertiary">Evoluindo: {counts.evoluindo} · Estagnadas: {counts.estagnado} · Em queda: {counts.queda}</span>
      </div>
    </Card>
  )
}

function BottleneckCard({ gargalos }: { gargalos: PDIAvaliacao360[] }) {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <Typography variant="h3" className="text-sm tracking-normal">Gargalos do desenvolvimento</Typography>
      <div className="mt-mx-md grid gap-mx-sm">
        {gargalos.slice(0, 3).map(gargalo => (
          <div key={gargalo.competencia_id || gargalo.competencia} className="grid grid-cols-[1fr_58px] items-center gap-mx-sm">
            <span className="font-bold text-text-secondary">{gargalo.competencia}</span>
            <span className={gargalo.nota < 7 ? 'font-black text-status-warning' : 'font-black text-text-primary'}>{notaBR(gargalo.nota)} /10</span>
            <Progress value={gargalo.nota * 10} className="col-span-2" tone={gargalo.nota < 7 ? 'warning' : 'green'} />
          </div>
        ))}
      </div>
      <button type="button" className="mt-mx-md inline-flex items-center gap-mx-xs text-xs font-black text-brand-primary">
        Ver todas as competências <ChevronRight size={14} />
      </button>
    </Card>
  )
}

function RecommendationCard({ focus }: { focus: string }) {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-status-success-surface/40 p-mx-lg shadow-mx-sm">
      <div className="flex items-start gap-mx-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-mx-md bg-white text-status-success"><BookOpen size={18} /></span>
        <div>
          <Typography variant="h3" className="text-sm tracking-normal">Próxima recomendação</Typography>
          <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Treinamento sugerido</Typography>
        </div>
      </div>
      <div className="mt-mx-md rounded-mx-md bg-white/80 p-mx-md">
        <Typography variant="h3" className="text-base tracking-normal">Liderança Situacional na Prática</Typography>
        <Typography variant="p" className="mt-1 text-sm">Fortaleça sua competência de {focus.toLowerCase()} e impacte ainda mais sua equipe.</Typography>
        <Button type="button" variant="secondary" size="sm" className="mt-mx-md">
          <PlayCircle size={16} /> Iniciar agora
        </Button>
      </div>
    </Card>
  )
}

function NextEvaluationCard({ dateLabel, managerName }: { dateLabel: string; managerName?: string }) {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="flex items-start gap-mx-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-mx-md bg-brand-primary/10 text-brand-primary"><Calendar size={18} /></span>
        <Typography variant="h3" className="text-sm tracking-normal">Próxima avaliação</Typography>
      </div>
      <dl className="mt-mx-md grid gap-mx-sm text-sm">
        <div className="flex items-center justify-between gap-mx-sm">
          <dt className="font-semibold text-text-secondary">Data estimada</dt>
          <dd className="font-black text-text-primary">{dateLabel}</dd>
        </div>
        <div className="flex items-center justify-between gap-mx-sm">
          <dt className="font-semibold text-text-secondary">Responsável</dt>
          <dd className="font-black text-text-primary">{managerName || 'Seu Gestor Direto'}</dd>
        </div>
      </dl>
      <button type="button" className="mt-mx-md inline-flex items-center gap-mx-xs text-xs font-black text-brand-primary">
        Ver detalhes da avaliação <ChevronRight size={14} />
      </button>
    </Card>
  )
}

function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  return (
    <Card className="mt-mx-sm overflow-hidden rounded-mx-lg border border-border-subtle bg-white p-0 shadow-mx-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-surface-alt text-xs uppercase text-text-secondary">
            <tr>
              {['Data', 'Avaliador', 'Competência', 'Antes → Depois', 'Evolução'].map(label => (
                <th scope="col" key={label} className="px-mx-md py-mx-sm font-black">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-mx-md py-mx-lg text-center text-text-tertiary">Histórico será exibido após a próxima avaliação.</td></tr>
            )}
            {rows.map(row => (
              <tr key={`${row.dateLabel}-${row.competencia}`} className="border-t border-border-subtle">
                <td className="px-mx-md py-mx-sm font-bold">{row.dateLabel}</td>
                <td className="px-mx-md py-mx-sm text-text-secondary">{row.evaluator}</td>
                <td className="px-mx-md py-mx-sm font-bold text-text-secondary">{row.competencia}</td>
                <td className="px-mx-md py-mx-sm text-text-secondary">{notaBR(row.before)} → {notaBR(row.after)}</td>
                <td className={row.delta >= 0 ? 'px-mx-md py-mx-sm font-black text-status-success' : 'px-mx-md py-mx-sm font-black text-status-error'}>{formatSigned(row.delta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="mx-mx-md my-mx-sm inline-flex items-center gap-mx-xs text-xs font-black text-brand-primary">
        Ver histórico completo <ChevronRight size={14} />
      </button>
    </Card>
  )
}

function RecommendedContentCards() {
  return (
    <div className="mt-mx-sm grid gap-mx-md lg:grid-cols-3">
      {CONTEUDOS_RECOMENDADOS.map(content => (
        <Card key={content.titulo} className="rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm">
          <div className="grid grid-cols-[88px_1fr] gap-mx-sm">
            <div className="flex aspect-video items-center justify-center rounded-mx-md bg-surface-alt text-brand-primary">
              <BookOpen size={28} />
            </div>
            <div>
              <Typography variant="h3" className="text-sm tracking-normal">{content.titulo}</Typography>
              <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Competência: {content.competencia}</Typography>
              <div className="mt-2 flex flex-wrap gap-mx-sm text-xs font-bold text-text-tertiary">
                <span>{content.duracao}</span>
                <span>{content.nivel}</span>
              </div>
            </div>
          </div>
          <Button type="button" variant="secondary" size="sm" className="mt-mx-sm w-full">
            <PlayCircle size={16} /> Assistir
          </Button>
        </Card>
      ))}
    </div>
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
              {cargos.map(cargo => <option key={cargo.id} value={cargo.id}>{cargo.nome}</option>)}
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
                    <Typography variant="h3" className="text-sm tracking-normal">{competencia.nome}</Typography>
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

type PDIOverlayModalProps = {
  overlay: OverlayState
  onClose: () => void
  onSaveGoals: (input: { sessionId: string; prazo: string; metas: string[] }) => Promise<void>
  onCreateAction: (input: PDICreateActionInput) => Promise<void>
  onUpdateAction: (input: PDIUpdateActionInput) => Promise<void>
  onCompleteAction: (action: PDIPlanoAcao360) => Promise<void>
  onJustifyAction: (action: PDIPlanoAcao360, justificativa: string) => Promise<void>
  onLinkContent: (action: PDIPlanoAcao360) => Promise<void>
  onSendToCentral: (action: PDIPlanoAcao360) => Promise<void>
}

function PDIOverlayModal({
  overlay,
  onClose,
  onSaveGoals,
  onCreateAction,
  onUpdateAction,
  onCompleteAction,
  onJustifyAction,
  onLinkContent,
  onSendToCentral,
}: PDIOverlayModalProps) {
  const [justificativa, setJustificativa] = useState('')
  const [newActionDraft, setNewActionDraft] = useState({
    competenciaId: '',
    descricaoAcao: '',
    dataConclusao: defaultReviewDate(),
    impacto: 'PDI',
    custo: 'Vendedor',
    status: 'pendente' as PDICreateActionInput['status'],
  })

  useEffect(() => {
    setJustificativa('')
  }, [overlay?.type, overlay?.type === 'action-detail' ? overlay.action.id : null])

  useEffect(() => {
    if (overlay?.type !== 'new-action') return
    setNewActionDraft({
      competenciaId: overlay.competencias[0]?.competencia_id || '',
      descricaoAcao: '',
      dataConclusao: defaultReviewDate(),
      impacto: 'PDI',
      custo: 'Vendedor',
      status: 'pendente',
    })
  }, [overlay])

  if (!overlay) return null

  if (overlay.type === 'goal') {
    const goalOverlay = overlay
    const formId = `pdi-goal-${goalOverlay.goal.prazo}`
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const formData = new FormData(event.currentTarget)
      const objetivo = String(formData.get('objetivo') || '')
      const metasRaw = String(formData.get('metas') || '')
      const metas = Array.from(new Set([objetivo, ...metasRaw.split('\n')].map(item => item.trim()).filter(Boolean)))
      await onSaveGoals({ sessionId: goalOverlay.sessionId, prazo: goalOverlay.goal.prazo, metas })
    }

    return (
      <Modal
        open
        onClose={onClose}
        title="Editar conquistas"
        description={`${goalOverlay.goal.label} · ${goalOverlay.goal.value}`}
        size="lg"
      >
        <form id={formId} onSubmit={handleSubmit} className="grid gap-mx-md">
          <label className="grid gap-1 text-xs font-bold uppercase text-text-secondary">
            Objetivo principal
            <input name="objetivo" className="h-mx-xl rounded-mx-md border border-border-subtle px-mx-sm text-sm font-bold" defaultValue={goalOverlay.goal.items[0] || ''} />
          </label>
          <label className="grid gap-1 text-xs font-bold uppercase text-text-secondary">
            Metas
            <textarea name="metas" className="min-h-28 rounded-mx-md border border-border-subtle p-mx-sm text-sm font-semibold" defaultValue={goalOverlay.goal.items.join('\n')} />
          </label>
          <label className="grid gap-1 text-xs font-bold uppercase text-text-secondary">
            Prazo
            <input className="h-mx-xl rounded-mx-md border border-border-subtle px-mx-sm text-sm font-bold" value={goalOverlay.goal.value} readOnly />
          </label>
          <label className="grid gap-1 text-xs font-bold uppercase text-text-secondary">
            Observações
            <textarea className="min-h-24 rounded-mx-md border border-border-subtle p-mx-sm text-sm font-semibold" placeholder="Registre contexto da alteração e alinhamento com gestor." />
          </label>
          <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Ao salvar, o histórico da alteração será registrado no PDI.</Typography>
          <FormFooter formId={formId} onClose={onClose} primaryLabel="Salvar alterações" />
        </form>
      </Modal>
    )
  }

  if (overlay.type === 'new-action') {
    const newActionOverlay = overlay
    const formId = 'pdi-new-action'
    const defaultCompetencia = newActionOverlay.competencias[0]?.competencia_id || ''
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      await onCreateAction({
        sessaoId: newActionOverlay.sessionId,
        competenciaId: newActionDraft.competenciaId || defaultCompetencia,
        descricaoAcao: newActionDraft.descricaoAcao,
        dataConclusao: newActionDraft.dataConclusao,
        impacto: newActionDraft.impacto,
        custo: newActionDraft.custo,
        status: newActionDraft.status,
      })
    }

    return (
      <Modal
        open
        onClose={onClose}
        title="Nova ação"
        description="Vincule a ação a uma competência e a uma conquista do PDI."
        size="xl"
      >
        <form id={formId} onSubmit={handleSubmit} className="grid gap-mx-md md:grid-cols-2">
          <Field label="Título da ação"><input name="descricao_acao" value={newActionDraft.descricaoAcao} onChange={event => setNewActionDraft(prev => ({ ...prev, descricaoAcao: event.target.value }))} className="h-mx-xl rounded-mx-md border border-border-subtle px-mx-sm text-sm font-bold" placeholder="Ex.: Realizar 10 contatos ativos por dia" /></Field>
          <Field label="Competência vinculada">
            <select name="competencia_id" className="h-mx-xl rounded-mx-md border border-border-subtle px-mx-sm text-sm font-bold" value={newActionDraft.competenciaId || defaultCompetencia} onChange={event => setNewActionDraft(prev => ({ ...prev, competenciaId: event.target.value }))}>
              {newActionOverlay.competencias.map(comp => <option key={comp.competencia_id} value={comp.competencia_id}>{comp.competencia}</option>)}
            </select>
          </Field>
          <Field label="Conquista vinculada">
            <select name="impacto" className="h-mx-xl rounded-mx-md border border-border-subtle px-mx-sm text-sm font-bold" value={newActionDraft.impacto} onChange={event => setNewActionDraft(prev => ({ ...prev, impacto: event.target.value }))}>
              <option value="PDI">PDI</option>
              {newActionOverlay.goals.flatMap(goal => goal.items.map(item => <option key={`${goal.prazo}-${item}`} value={`${goal.label} (${goal.value})`}>{goal.label} · {item}</option>))}
            </select>
          </Field>
          <Field label="Origem"><input className="h-mx-xl rounded-mx-md border border-border-subtle px-mx-sm text-sm font-bold" value="Vendedor" readOnly /></Field>
          <Field label="Prazo"><input name="data_conclusao" type="date" className="h-mx-xl rounded-mx-md border border-border-subtle px-mx-sm text-sm font-bold" value={newActionDraft.dataConclusao} onChange={event => setNewActionDraft(prev => ({ ...prev, dataConclusao: event.target.value }))} /></Field>
          <Field label="Responsável"><input name="custo" className="h-mx-xl rounded-mx-md border border-border-subtle px-mx-sm text-sm font-bold" value={newActionDraft.custo} onChange={event => setNewActionDraft(prev => ({ ...prev, custo: event.target.value }))} /></Field>
          <Field label="Status inicial"><select name="status" className="h-mx-xl rounded-mx-md border border-border-subtle px-mx-sm text-sm font-bold" value={newActionDraft.status} onChange={event => setNewActionDraft(prev => ({ ...prev, status: event.target.value as PDICreateActionInput['status'] }))}><option value="pendente">Pendente</option><option value="em_andamento">Em andamento</option></select></Field>
          <Field label="Critério de conclusão"><input className="h-mx-xl rounded-mx-md border border-border-subtle px-mx-sm text-sm font-bold" placeholder="Como saberemos que a ação foi concluída?" /></Field>
          <Field label="Descrição"><textarea className="min-h-28 rounded-mx-md border border-border-subtle p-mx-sm text-sm font-semibold md:col-span-2" placeholder="Detalhe a ação e se ela deve ser vinculada à Central de Execução." /></Field>
          <div className="flex flex-col-reverse gap-mx-sm md:col-span-2 sm:flex-row sm:justify-end">
            <FormFooter formId={formId} onClose={onClose} primaryLabel="Salvar ação" />
          </div>
        </form>
      </Modal>
    )
  }

  const actionOverlay = overlay
  const formId = 'pdi-action-edit'
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!actionOverlay.action.id) return
    const formData = new FormData(event.currentTarget)
    await onUpdateAction({
      actionId: actionOverlay.action.id,
      descricaoAcao: String(formData.get('descricao_acao') || ''),
      dataConclusao: String(formData.get('data_conclusao') || actionOverlay.action.data_conclusao),
      impacto: String(formData.get('impacto') || actionOverlay.action.impacto || 'PDI'),
      custo: String(formData.get('custo') || actionOverlay.action.custo || 'Vendedor'),
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Detalhe da ação"
      description={actionOverlay.action.descricao_acao}
      size="xl"
      footer={(
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="button" variant="secondary" onClick={() => onCompleteAction(actionOverlay.action)}>Marcar como concluída</Button>
          <Button type="submit" form={formId}>Editar ação</Button>
        </>
      )}
    >
      <div className="grid gap-mx-md lg:grid-cols-[1fr_280px]">
        <form id={formId} onSubmit={handleSubmit} className="grid gap-mx-sm text-sm">
          <Field label="Ação">
            <input name="descricao_acao" className="h-mx-xl rounded-mx-md border border-border-subtle px-mx-sm text-sm font-bold" defaultValue={actionOverlay.action.descricao_acao} />
          </Field>
          <Detail label="Competência vinculada" value={actionOverlay.action.competencia} />
          <Field label="Conquista vinculada">
            <input name="impacto" className="h-mx-xl rounded-mx-md border border-border-subtle px-mx-sm text-sm font-bold" defaultValue={actionOverlay.action.impacto || 'PDI'} />
          </Field>
          <Detail label="Origem" value={actionOrigin(actionOverlay.action)} />
          <Field label="Prazo">
            <input name="data_conclusao" type="date" className="h-mx-xl rounded-mx-md border border-border-subtle px-mx-sm text-sm font-bold" defaultValue={actionOverlay.action.data_conclusao} />
          </Field>
          <Field label="Responsável">
            <input name="custo" className="h-mx-xl rounded-mx-md border border-border-subtle px-mx-sm text-sm font-bold" defaultValue={actionOverlay.action.custo || 'Vendedor'} />
          </Field>
          <Detail label="Status" value={actionOverlay.status.label} />
          {actionOverlay.action.justificativa && <Detail label="Justificativa" value={actionOverlay.action.justificativa} />}
          <Detail label="Critérios de conclusão" value="Evidência validada pelo gestor e progresso registrado no plano." />
          <Detail label="Conteúdos vinculados" value="Recomendações geradas a partir da ação do PDI." />
          <Detail label="Feedback vinculado" value="Disponível se houver feedback estruturado na competência." />
        </form>
        <div className="rounded-mx-md border border-border-subtle bg-surface-alt p-mx-md">
          <Typography variant="h3" className="text-sm tracking-normal">Progresso</Typography>
          <div className="mt-mx-sm text-3xl font-black text-text-primary">{actionOverlay.progress}%</div>
          <Progress value={actionOverlay.progress} className="mt-mx-sm" />
          <label className="mt-mx-md grid gap-1 text-xs font-bold uppercase text-text-secondary">
            Justificativa
            <textarea
              value={justificativa}
              onChange={event => setJustificativa(event.target.value)}
              className="min-h-24 rounded-mx-md border border-border-subtle bg-white p-mx-sm text-sm font-semibold normal-case"
              placeholder="Motivo do atraso ou impedimento."
            />
          </label>
          <div className="mt-mx-md grid gap-mx-sm">
            <Button type="button" variant="secondary" size="sm" onClick={() => onJustifyAction(actionOverlay.action, justificativa)}>Justificar atraso</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => onLinkContent(actionOverlay.action)}>Vincular conteúdo</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => onSendToCentral(actionOverlay.action)}>Enviar para Central de Execução</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function FormFooter({ formId, onClose, primaryLabel }: { formId: string; onClose: () => void; primaryLabel: string }) {
  function submitForm() {
    const form = document.getElementById(formId) as HTMLFormElement | null
    if (!form) return
    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit()
      return
    }
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
      <Button type="button" onClick={submitForm}>{primaryLabel}</Button>
    </>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-xs font-bold uppercase text-text-secondary">
      {label}
      {children}
    </label>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-mx-md border border-border-subtle bg-white px-mx-md py-mx-sm">
      <dt className="text-xs font-black uppercase text-text-tertiary">{label}</dt>
      <dd className="mt-1 font-bold text-text-primary">{value}</dd>
    </div>
  )
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <Typography variant="h2" className="text-xl leading-tight tracking-normal">{title}</Typography>
      {subtitle && <Typography variant="caption" tone="muted" className="normal-case tracking-normal">{subtitle}</Typography>}
    </div>
  )
}

function EvolutionRow({ item }: { item: PDIEvolutionItem }) {
  const info = evolutionStatusInfo(item.status)
  const Icon = info.Icon
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-mx-sm rounded-mx-md border border-border-subtle bg-white px-mx-sm py-2">
      <span className="font-bold text-text-secondary">{item.competencia}</span>
      <span className={`inline-flex items-center gap-1 rounded-mx-sm px-2 py-1 text-xs font-bold ${info.badge}`}>
        <Icon size={13} /> {info.label}
      </span>
    </div>
  )
}

function MiniEvolutionChart({ delta }: { delta: number }) {
  const positive = delta >= 0
  const points = positive ? '4,56 34,48 64,50 94,38 124,32 154,34 184,22 214,22 244,16 274,12 304,8' : '4,18 34,20 64,24 94,28 124,30 154,34 184,38 214,42 244,45 274,48 304,52'
  return (
    <div className="mt-mx-md h-32 rounded-mx-md bg-surface-alt/50 p-mx-sm">
      <svg viewBox="0 0 308 64" className="h-full w-full" role="img" aria-label="Gráfico de linha da evolução do PDI">
        <line x1="0" y1="56" x2="308" y2="56" stroke="currentColor" className="text-border-subtle" strokeWidth="1" />
        <line x1="0" y1="32" x2="308" y2="32" stroke="currentColor" className="text-border-subtle" strokeWidth="1" />
        <polyline fill="none" stroke="currentColor" strokeWidth="3" points={points} className={positive ? 'text-status-success' : 'text-status-error'} />
        <circle cx="304" cy={positive ? 8 : 52} r="4" fill="currentColor" className={positive ? 'text-status-success' : 'text-status-error'} />
      </svg>
    </div>
  )
}

function Progress({ value, className = '', tone = 'green' }: { value: number; className?: string; tone?: 'green' | 'warning' | 'blue' }) {
  const fill = tone === 'warning' ? 'bg-status-warning' : tone === 'blue' ? 'bg-status-info' : 'bg-status-success'
  return (
    <div className={`h-2 w-full rounded-full bg-surface-alt ${className}`}>
      <div className={`h-2 rounded-full ${fill}`} style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  )
}

function buildGoals(pdi: PDISessionSummary | null): GoalView[] {
  return PRAZO_META.map(cfg => {
    const metas = (pdi?.metas || []).filter(m => m.prazo === cfg.prazo)
    const fallback = pdi?.[cfg.fallback]
    const items = metas.length > 0 ? metas.map(m => m.descricao) : fallback ? [fallback] : []
    return { ...cfg, items }
  })
}

function buildActionRows(pdi: PDISessionSummary | null): ActionRow[] {
  return (pdi?.plano_acao || []).map((action, index) => {
    const status = statusInfo(action.status, action.data_conclusao)
    return { action, status, progress: actionProgress(status.label, index) }
  })
}

function buildSummary(current: PDISessionSummary | null, previous: PDISessionSummary | null): SummaryView {
  const notaGeral = average(current?.avaliacoes.map(av => av.nota) || [])
  const previousScore = previous ? averageMatching(current?.avaliacoes || [], previous.avaliacoes) : notaGeral
  const actionRows = buildActionRows(current)
  const totalActions = Math.max(actionRows.length, 1)
  const acoesEmAndamento = actionRows.filter(row => row.status.label === 'Em andamento').length
  const acoesConcluidas = actionRows.filter(row => row.status.label === 'Concluída').length
  const competenciasTotal = Math.max(12, current?.avaliacoes.length || 0)
  const competenciasNoAlvo = (current?.avaliacoes || []).filter(av => av.nota >= 6).length

  return {
    notaGeral,
    deltaMes: roundOne(notaGeral - previousScore),
    competenciasNoAlvo,
    competenciasTotal,
    acoesEmAndamento,
    planoAtivoPct: Math.round((acoesEmAndamento / totalActions) * 100),
    acoesConcluidas,
    planoConcluidoPct: Math.round((acoesConcluidas / totalActions) * 100),
  }
}

function buildGargalos(pdi: PDISessionSummary | null): PDIAvaliacao360[] {
  const source = pdi?.top_5_gaps?.length ? pdi.top_5_gaps : pdi?.avaliacoes || []
  return [...source].sort((a, b) => a.nota - b.nota).slice(0, 3)
}

function buildHistoryRows(sessions: PDISessionSummary[]): HistoryRow[] {
  const [current, previous] = sessions
  if (!current) return []
  const previousByCompetencia = new Map((previous?.avaliacoes || []).map(av => [av.competencia_id, av]))
  return current.avaliacoes.slice(0, 4).map(av => {
    const before = previousByCompetencia.get(av.competencia_id)?.nota ?? av.nota
    return {
      dateLabel: formatDate(current.data_realizacao || current.created_at),
      evaluator: current.manager_name || 'Seu Gestor',
      competencia: av.competencia,
      before,
      after: av.nota,
      delta: roundOne(av.nota - before),
    }
  })
}

function sortSessions(sessions: PDISessionSummary[]) {
  return [...sessions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

function filtrarAvaliacoes(pdi: PDISessionSummary | null, tipo: 'tecnica' | 'comportamental'): PDIAvaliacao360[] {
  if (!pdi) return []
  return (pdi.avaliacoes || []).filter(av => (av.tipo || 'tecnica') === tipo)
}

function statusInfo(status?: string, dueDate?: string) {
  const normalized = (status || '').toLowerCase()
  if (normalized.includes('conclu')) return { label: 'Concluída', cls: 'bg-status-success-surface text-status-success' }
  if (normalized.includes('cancel')) return { label: 'Cancelada', cls: 'bg-status-error-surface text-status-error' }
  if (normalized.includes('just')) return { label: 'Justificada', cls: 'bg-status-warning-surface text-status-warning' }
  if (normalized.includes('pend')) return { label: 'Pendente', cls: 'bg-surface-alt text-text-secondary' }
  if (normalized.includes('atras') || isOverdue(dueDate)) return { label: 'Atrasada', cls: 'bg-status-error-surface text-status-error' }
  return { label: 'Em andamento', cls: 'bg-status-info-surface text-status-info' }
}

function actionProgress(status: string, index: number) {
  if (status === 'Concluída') return 100
  if (status === 'Atrasada') return 20
  if (status === 'Pendente') return 0
  if (status === 'Justificada') return 50
  return [60, 40, 75, 30][index % 4]
}

function actionOrigin(action: PDIPlanoAcao360) {
  return action.custo || 'Gestor'
}

function originLabel(origin?: string) {
  if (origin === 'autoavaliacao') return 'Autoavaliação + gestor'
  if (origin === 'gestor') return 'Gestor + indicadores'
  return origin || 'Gestor + indicadores'
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
    return { label: 'Evoluindo', Icon: TrendingUp, badge: 'bg-status-success-surface text-status-success' }
  }
  if (status === 'queda') {
    return { label: 'Em queda', Icon: AlertTriangle, badge: 'bg-status-error-surface text-status-error' }
  }
  return { label: 'Estagnado', Icon: Clock3, badge: 'bg-status-warning-surface text-status-warning' }
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return roundOne(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function averageMatching(current: PDIAvaliacao360[], previous: PDIAvaliacao360[]) {
  const previousByCompetencia = new Map(previous.map(av => [av.competencia_id, av.nota]))
  const matches = current.map(av => previousByCompetencia.get(av.competencia_id)).filter((value): value is number => typeof value === 'number')
  return matches.length ? average(matches) : average(previous.map(av => av.nota))
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10
}

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

function formatSigned(value: number) {
  return value > 0 ? `+${notaBR(value)}` : notaBR(value)
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR')
}

function isOverdue(value?: string) {
  if (!value) return false
  const due = new Date(`${value.slice(0, 10)}T23:59:59`)
  return due.getTime() < Date.now()
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
