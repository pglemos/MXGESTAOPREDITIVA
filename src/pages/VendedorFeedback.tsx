import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  MessageSquare,
  Phone,
  Send,
  Target,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { PageHeading } from '@/components/molecules/PageHeading'
import { Modal } from '@/components/organisms/Modal'
import { useFeedbacks } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { useCadenciaAnalytics } from '@/features/crm/hooks/useCadenciaAnalytics'
import { useVendedorPerfil } from '@/features/crm/hooks/useVendedorPerfil'
import { buildAutonomousFeedbackFromCadencia } from '@/features/gerente-feedback/lib/autonomous-feedback'
import type { Feedback as Devolutiva } from '@/types/database'

type DevolutivaComNomes = Devolutiva & {
  manager?: { name: string } | null
  manager_name?: string
}

type FeedbackKind = 'Positivo' | 'Desenvolvimento' | 'Obrigatório' | 'PDI' | 'Automático' | 'Manual do gestor'
type FeedbackStatus = 'Lido e compreendido' | 'Ação concluída' | 'Justificado' | 'Pendente' | 'Ação pendente' | 'Vencido' | 'Vinculado ao PDI'
type FeedbackActionStatus = 'pendente' | 'em_andamento' | 'concluida' | 'justificada'

type FeedbackActionView = {
  id: string
  title: string
  origin: string
  competence: string
  meta: string
  progressCurrent: number
  progressTarget: number
  progressLabel: string
  deadline: string
  status: FeedbackActionStatus
  statusLabel: string
  obligatory: boolean
  closingImpact: boolean
  centralLink: string
  completionCriteria: string
  pdiLink?: string
}

type FeedbackView = {
  id: string
  source: 'real' | 'demo'
  createdAt: string
  kind: FeedbackKind
  competence: string
  reason: string
  indicator: string
  leaderComment: string
  responsibleName: string
  responsibleRole: string
  action: FeedbackActionView | null
  acknowledged: boolean
  acknowledgedAt: string | null
  sellerComment: string | null
  status: FeedbackStatus
}

type ModalState =
  | { type: 'comment'; feedback: FeedbackView }
  | { type: 'justify'; action: FeedbackActionView; feedback?: FeedbackView }
  | { type: 'action'; action: FeedbackActionView; feedback?: FeedbackView }
  | null

type FeedbackDiagnostic = {
  origem?: string
  etapa_gargalo?: string
  rule_id?: string
}

const MES_CURTO = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']

const KPI_CARDS = [
  { icon: <MessageSquare size={22} />, label: 'Feedback recebido', value: '18', detail: 'nos últimos 90 dias', tone: 'blue' as const, action: 'Ver todos' },
  { icon: <ThumbsUp size={22} />, label: 'Positivos', value: '12', detail: '67% do total', tone: 'green' as const, action: 'Ver detalhes' },
  { icon: <TrendingUp size={22} />, label: 'Desenvolvimento', value: '6', detail: '33% do total', tone: 'orange' as const, action: 'Ver detalhes' },
  { icon: <AlertCircle size={22} />, label: 'Pendentes', value: '3', detail: 'aguardando confirmação', tone: 'red' as const, action: 'Ver pendentes' },
  { icon: <ClipboardCheck size={22} />, label: 'Ações obrigatórias', value: '2', detail: 'vinculadas à rotina', tone: 'purple' as const, action: 'Ver ações' },
  { icon: <CheckCircle2 size={22} />, label: 'Engajamento com feedback', value: '95%', detail: 'feedback confirmado', tone: 'green' as const, action: 'Entenda o cálculo' },
]

const DEMO_ACTIONS: FeedbackActionView[] = [
  {
    id: 'demo-action-retornos',
    title: 'Agendar 3 retornos hoje',
    origin: 'Feedback de desenvolvimento',
    competence: 'Prospecção',
    meta: '3 retornos',
    progressCurrent: 1,
    progressTarget: 3,
    progressLabel: '1/3 concluído',
    deadline: 'Hoje até o Fechamento Diário',
    status: 'pendente',
    statusLabel: 'Pendente',
    obligatory: true,
    closingImpact: true,
    centralLink: '/central-execucao?origem=feedback&acao=retornos',
    completionCriteria: 'Registrar 3 retornos com clientes na Central de Execução antes de fechar o dia.',
  },
  {
    id: 'demo-action-status',
    title: 'Atualizar status de 5 clientes sem próxima ação',
    origin: 'Feedback de desenvolvimento',
    competence: 'Prospecção',
    meta: '5 clientes',
    progressCurrent: 3,
    progressTarget: 5,
    progressLabel: '3/5 concluído',
    deadline: 'Amanhã até o Fechamento Diário',
    status: 'em_andamento',
    statusLabel: 'Em andamento',
    obligatory: true,
    closingImpact: true,
    centralLink: '/central-execucao?origem=feedback&acao=status-clientes',
    completionCriteria: 'Atualizar 5 clientes sem próxima ação no CRM ou justificar o que impediu a conclusão.',
  },
]

const DEMO_FEEDBACKS: FeedbackView[] = [
  {
    id: 'demo-feedback-prospeccao',
    source: 'demo',
    createdAt: '2025-05-15T09:00:00.000Z',
    kind: 'Desenvolvimento',
    competence: 'Prospecção',
    reason: 'Baixa prospecção ativa',
    indicator: '2 contatos realizados de 5 esperados',
    leaderComment: 'Você possui bom relacionamento com os clientes, porém está realizando poucas prospecções ativas. Sua meta é realizar 5 contatos por dia e registrar no CRM.',
    responsibleName: 'Pedro Almeida',
    responsibleRole: 'Gerente Comercial',
    action: DEMO_ACTIONS[0],
    acknowledged: false,
    acknowledgedAt: null,
    sellerComment: null,
    status: 'Ação pendente',
  },
  {
    id: 'demo-feedback-agendamento',
    source: 'demo',
    createdAt: '2025-05-10T09:00:00.000Z',
    kind: 'Desenvolvimento',
    competence: 'Agendamento de visitas',
    reason: 'Baixa taxa de agendamento',
    indicator: '3 agendamentos de 10 esperados',
    leaderComment: 'Sua taxa de agendamento está abaixo da média da equipe. Foque em qualificar melhor os leads e sugerir horários alternativos para aumentar as chances de visita.',
    responsibleName: 'Pedro Almeida',
    responsibleRole: 'Gerente Comercial',
    action: DEMO_ACTIONS[1],
    acknowledged: false,
    acknowledgedAt: null,
    sellerComment: null,
    status: 'Ação pendente',
  },
  {
    id: 'demo-feedback-positivo',
    source: 'demo',
    createdAt: '2025-05-07T09:00:00.000Z',
    kind: 'Positivo',
    competence: 'Atendimento ao cliente',
    reason: 'Excelente atendimento e relacionamento',
    indicator: 'NPS cliente: 10 | Feedback positivo',
    leaderComment: 'Parabéns pelo excelente atendimento! Você demonstra empatia, escuta ativa e consegue gerar conexão com o cliente de forma natural.',
    responsibleName: 'Pedro Almeida',
    responsibleRole: 'Gerente Comercial',
    action: null,
    acknowledged: false,
    acknowledgedAt: null,
    sellerComment: null,
    status: 'Pendente',
  },
  {
    id: 'demo-history-relacionamento',
    source: 'demo',
    createdAt: '2026-06-03T16:45:00.000Z',
    kind: 'Positivo',
    competence: 'Relacionamento interpessoal',
    reason: 'Parceria e troca de informações',
    indicator: 'Reconhecimento do líder',
    leaderComment: 'Você manteve uma comunicação clara e ajudou a equipe com informações úteis.',
    responsibleName: 'Pedro Almeida',
    responsibleRole: 'Gerente Comercial',
    action: null,
    acknowledged: true,
    acknowledgedAt: '2026-06-03T16:45:00.000Z',
    sellerComment: 'Obrigado! Fico feliz com o reconhecimento.',
    status: 'Lido e compreendido',
  },
  {
    id: 'demo-history-fechamento',
    source: 'demo',
    createdAt: '2026-05-28T11:32:00.000Z',
    kind: 'Obrigatório',
    competence: 'Fechamento de venda',
    reason: 'Foco em fechamento',
    indicator: 'Propostas abertas sem avanço',
    leaderComment: 'Priorize os fechamentos da semana e registre a evolução no CRM.',
    responsibleName: 'Pedro Almeida',
    responsibleRole: 'Gerente Comercial',
    action: {
      ...DEMO_ACTIONS[1],
      id: 'demo-action-proposta',
      title: 'Realizar proposta para 2 clientes',
      meta: '2 propostas',
      progressCurrent: 2,
      progressTarget: 2,
      progressLabel: '2/2 concluído',
      status: 'concluida',
      statusLabel: 'Ação concluída',
      completionCriteria: 'Enviar e registrar 2 propostas no CRM.',
    },
    acknowledged: true,
    acknowledgedAt: '2026-05-28T11:32:00.000Z',
    sellerComment: 'Entendi. Vou priorizar os fechamentos dessa semana.',
    status: 'Ação concluída',
  },
  {
    id: 'demo-history-midias',
    source: 'demo',
    createdAt: '2026-05-12T10:15:00.000Z',
    kind: 'Desenvolvimento',
    competence: 'Mídias sociais',
    reason: 'Frequência de publicações',
    indicator: 'Baixa cadência de postagem',
    leaderComment: 'Mantenha uma rotina de publicações para gerar lembrança e conversa com a carteira.',
    responsibleName: 'Pedro Almeida',
    responsibleRole: 'Gerente Comercial',
    action: null,
    acknowledged: true,
    acknowledgedAt: null,
    sellerComment: 'Justifiquei a baixa frequência no período.',
    status: 'Justificado',
  },
]

function diagnosticOf(feedback: Devolutiva): FeedbackDiagnostic {
  if (!feedback.diagnostic_json || typeof feedback.diagnostic_json !== 'object' || Array.isArray(feedback.diagnostic_json)) return {}
  return feedback.diagnostic_json as FeedbackDiagnostic
}

function isFeedbackSistema(feedback: Devolutiva): boolean {
  const diagnostic = diagnosticOf(feedback)
  return feedback.manager_id === null || diagnostic.origem === 'sistema'
}

function responsavelNome(feedback: DevolutivaComNomes): string {
  if (isFeedbackSistema(feedback)) return 'Sistema MX'
  return feedback.manager?.name || feedback.manager_name || 'Seu gestor'
}

function responsavelPapel(feedback: DevolutivaComNomes): string {
  return isFeedbackSistema(feedback) ? 'Feedback automático' : 'Gerente Comercial'
}

function textoPrincipal(feedback: Devolutiva): string {
  return feedback.action || feedback.attention_points || feedback.positives || 'Sem comentário registrado.'
}

function mapFeedbackToView(feedback: DevolutivaComNomes): FeedbackView {
  const diagnostic = diagnosticOf(feedback)
  const hasAction = Boolean(feedback.action?.trim())
  const kind: FeedbackKind = isFeedbackSistema(feedback)
    ? 'Automático'
    : hasAction
      ? 'Obrigatório'
      : feedback.attention_points?.trim()
        ? 'Desenvolvimento'
        : 'Positivo'
  const competence = diagnostic.etapa_gargalo || (feedback.attention_points?.trim() ? 'Desenvolvimento comercial' : 'Atendimento ao cliente')
  const action = hasAction
    ? buildActionFromFeedback(feedback, competence)
    : null
  const acknowledgedAt = feedback.acknowledged_at || null

  return {
    id: feedback.id,
    source: 'real',
    createdAt: feedback.created_at,
    kind,
    competence,
    reason: feedback.caso_motivo || feedback.notes || (isFeedbackSistema(feedback) ? `Sistema MX identificou gargalo em ${competence}.` : 'Feedback registrado pelo líder.'),
    indicator: buildIndicator(feedback),
    leaderComment: textoPrincipal(feedback),
    responsibleName: responsavelNome(feedback),
    responsibleRole: responsavelPapel(feedback),
    action,
    acknowledged: feedback.acknowledged,
    acknowledgedAt,
    sellerComment: feedback.seller_comment || null,
    status: feedback.acknowledged
      ? (action ? 'Ação pendente' : 'Lido e compreendido')
      : (action ? 'Ação pendente' : 'Pendente'),
  }
}

function buildActionFromFeedback(feedback: Devolutiva, competence: string): FeedbackActionView {
  const target = Math.max(feedback.meta_compromisso || feedback.commitment_suggested || 3, 1)
  const current = Math.max(Math.min(Math.round((feedback.agd_week || 0) / Math.max(target, 1)), target - 1), 1)

  return {
    id: `action-${feedback.id}`,
    title: feedback.action || 'Executar ação do feedback',
    origin: isFeedbackSistema(feedback) ? 'Feedback automático' : 'Feedback de desenvolvimento',
    competence,
    meta: `${target} registros`,
    progressCurrent: current,
    progressTarget: target,
    progressLabel: `${current}/${target} concluído`,
    deadline: 'Hoje até o Fechamento Diário',
    status: 'pendente',
    statusLabel: 'Pendente',
    obligatory: true,
    closingImpact: true,
    centralLink: `/central-execucao?origem=feedback&feedback=${feedback.id}`,
    completionCriteria: 'Cumprir a meta indicada no feedback ou registrar justificativa no fechamento diário.',
  }
}

function buildIndicator(feedback: Devolutiva): string {
  if (feedback.leads_week || feedback.meta_compromisso) {
    return `${feedback.leads_week || 0} leads, ${feedback.agd_week || 0} agendamentos e meta ${feedback.meta_compromisso || feedback.commitment_suggested || 0}`
  }
  if (feedback.tx_lead_agd) return `${Math.round(feedback.tx_lead_agd)}% de conversão lead-agendamento`
  return 'Indicador registrado no feedback'
}

function mergeView(
  feedback: FeedbackView,
  feedbackOverrides: Record<string, Partial<FeedbackView>>,
  actionOverrides: Record<string, Partial<FeedbackActionView>>,
): FeedbackView {
  const overridden = { ...feedback, ...(feedbackOverrides[feedback.id] || {}) }
  if (!overridden.action) return overridden
  return {
    ...overridden,
    action: {
      ...overridden.action,
      ...(actionOverrides[overridden.action.id] || {}),
    },
  }
}

function dateParts(value: string) {
  const date = new Date(value)
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: MES_CURTO[date.getMonth()],
    year: String(date.getFullYear()),
    full: date.toLocaleDateString('pt-BR'),
    date,
  }
}

export default function VendedorFeedback() {
  const { profile, storeId, activeStoreId } = useAuth()
  const { devolutivas, loading, acknowledge, createAutonomousFeedback } = useFeedbacks()
  const { analytics, loading: analyticsLoading } = useCadenciaAnalytics()
  const { vinculoTipo } = useVendedorPerfil()
  const [feedbackOverrides, setFeedbackOverrides] = useState<Record<string, Partial<FeedbackView>>>({})
  const [actionOverrides, setActionOverrides] = useState<Record<string, Partial<FeedbackActionView>>>({})
  const [modal, setModal] = useState<ModalState>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [justifyReason, setJustifyReason] = useState('Meta não concluída')
  const [justifyDescription, setJustifyDescription] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const autonomousFeedbackRequestedRef = useRef<string | null>(null)

  const feedbackRows = useMemo(() => (devolutivas || []) as DevolutivaComNomes[], [devolutivas])
  const autonomousFeedback = useMemo(() => buildAutonomousFeedbackFromCadencia({
    analytics,
    sellerId: profile?.id || '',
    storeId: activeStoreId || storeId || null,
    vinculoTipo,
  }), [activeStoreId, analytics, profile?.id, storeId, vinculoTipo])
  const hasAutonomousFeedbackForWeek = useMemo(() => {
    if (!autonomousFeedback) return false
    return feedbackRows.some(item => {
      const diagnostic = diagnosticOf(item)
      return item.week_reference === autonomousFeedback.week_reference
        && item.manager_id === null
        && diagnostic.origem === 'sistema'
        && diagnostic.rule_id === 'cadencia_gargalo_principal'
    })
  }, [autonomousFeedback, feedbackRows])

  useEffect(() => {
    if (!autonomousFeedback || analyticsLoading || hasAutonomousFeedbackForWeek) return
    if (autonomousFeedbackRequestedRef.current === autonomousFeedback.week_reference) return
    autonomousFeedbackRequestedRef.current = autonomousFeedback.week_reference
    void createAutonomousFeedback(autonomousFeedback)
  }, [analyticsLoading, autonomousFeedback, createAutonomousFeedback, hasAutonomousFeedbackForWeek])

  const feedbacks = useMemo(() => {
    const real = feedbackRows.map(mapFeedbackToView)
    // Demo serve apenas como preview de onboarding quando não há feedback real.
    // Nunca é mesclado ao fluxo real para não misturar dados fictícios com produção.
    const base = real.length > 0 ? real : DEMO_FEEDBACKS
    return base.map(row => mergeView(row, feedbackOverrides, actionOverrides))
  }, [actionOverrides, feedbackOverrides, feedbackRows])

  const pendingFeedbacks = feedbacks.filter(row => row.status === 'Pendente' || row.status === 'Ação pendente' || row.status === 'Vencido')
  const actions = feedbacks
    .map(row => row.action ? { feedback: row, action: row.action } : null)
    .filter((row): row is { feedback: FeedbackView; action: FeedbackActionView } => Boolean(row))
    .filter(row => row.action.obligatory)
    .slice(0, 3)
  const history = [...feedbacks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 7)
  const firstMandatoryAction = actions[0]?.action || DEMO_ACTIONS[0]
  const hojeLabel = `${new Date().toLocaleDateString('pt-BR')} (${new Date().toLocaleDateString('pt-BR', { weekday: 'long' })})`

  async function confirmFeedback(feedback: FeedbackView) {
    setConfirmingId(feedback.id)
    try {
      if (feedback.source === 'real') {
        const { error } = await acknowledge({ id: feedback.id, sellerComment: feedback.sellerComment || undefined })
        if (error) {
          toast.error(error)
          return
        }
      }

      setFeedbackOverrides(current => ({
        ...current,
        [feedback.id]: {
          acknowledged: true,
          acknowledgedAt: new Date().toISOString(),
          status: feedback.action?.obligatory ? 'Ação pendente' : 'Lido e compreendido',
        },
      }))
      toast.success(feedback.action?.obligatory
        ? 'Leitura confirmada. A ação vinculada continua pendente até execução ou justificativa.'
        : 'Leitura confirmada. Seu líder será notificado.')
    } catch {
      toast.error('Não foi possível confirmar agora. Tente novamente.')
    } finally {
      setConfirmingId(null)
    }
  }

  function openComment(feedback: FeedbackView) {
    setCommentDraft(feedback.sellerComment || '')
    setModal({ type: 'comment', feedback })
  }

  function submitComment() {
    if (!modal || modal.type !== 'comment') return
    const comment = commentDraft.trim()
    if (comment.length < 3) {
      toast.error('Escreva um comentário antes de enviar.')
      return
    }
    setFeedbackOverrides(current => ({
      ...current,
      [modal.feedback.id]: {
        sellerComment: comment,
      },
    }))
    toast.success('Comentário enviado ao líder e vinculado ao feedback.')
    setModal(null)
    setCommentDraft('')
  }

  function openJustification(action: FeedbackActionView, feedback?: FeedbackView) {
    setJustifyReason('Meta não concluída')
    setJustifyDescription('')
    setModal({ type: 'justify', action, feedback })
  }

  function submitJustification() {
    if (!modal || modal.type !== 'justify') return
    const description = justifyDescription.trim()
    if (description.length < 8) {
      toast.error('Descreva o motivo da não conclusão.')
      return
    }
    setActionOverrides(current => ({
      ...current,
      [modal.action.id]: {
        status: 'justificada',
        statusLabel: 'Justificado',
      },
    }))
    if (modal.feedback) {
      setFeedbackOverrides(current => ({
        ...current,
        [modal.feedback!.id]: {
          status: 'Justificado',
          sellerComment: description,
        },
      }))
    }
    toast.success('Justificativa registrada e líder notificado.')
    setModal(null)
  }

  function markActionDone(action: FeedbackActionView) {
    if (action.progressCurrent < action.progressTarget) {
      toast.error('Você ainda não concluiu a meta desta ação. Registre os retornos ou envie uma justificativa.')
      return
    }
    setActionOverrides(current => ({
      ...current,
      [action.id]: {
        status: 'concluida',
        statusLabel: 'Ação concluída',
      },
    }))
    toast.success('Ação concluída e registrada no histórico.')
  }

  function openCentral(action: FeedbackActionView) {
    window.history.pushState({}, '', action.centralLink)
    toast.info('Filtro da Central de Execução aplicado para a ação vinculada.')
  }

  return (
    <main className="min-h-screen bg-surface-alt p-mx-lg">
      <div className="space-y-mx-lg">
        <PageHeading
          title="Feedback"
          subtitle="Receba feedbacks, leia com atenção e confirme para acompanharmos seu desenvolvimento."
          actions={(
            <span className="inline-flex items-center gap-mx-xs rounded-mx-md border border-border-default bg-white px-mx-sm py-mx-xs text-sm font-semibold text-text-primary">
              <Calendar size={16} /> {hojeLabel}
            </span>
          )}
        />

        <section className="grid grid-cols-1 gap-mx-sm md:grid-cols-2 xl:grid-cols-6" aria-label="KPIs de feedback">
          {KPI_CARDS.map(card => (
            <MetricCard key={card.label} {...card} />
          ))}
        </section>

        <div className="grid grid-cols-1 gap-mx-lg xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-mx-lg">
            <LinkedActionsSection
              rows={actions}
              onOpenCentral={openCentral}
              onDone={markActionDone}
              onJustify={openJustification}
            />

            <PendingFeedbacksSection
              feedbacks={pendingFeedbacks}
              loading={loading}
              confirmingId={confirmingId}
              onConfirm={confirmFeedback}
              onComment={openComment}
              onViewAction={(feedback) => feedback.action && setModal({ type: 'action', action: feedback.action, feedback })}
            />
          </div>

          <aside className="space-y-mx-md" aria-label="Orientações e impactos de feedback">
            <WhyConfirmCard />
            <ClosingImpactCard action={firstMandatoryAction} onDone={markActionDone} onJustify={(action) => openJustification(action)} />
            <CentralLinkCard action={firstMandatoryAction} onOpenCentral={openCentral} />
          </aside>
        </div>

        <HistorySection feedbacks={history} />
        <EvolutionSection />
      </div>

      <FeedbackModal
        modal={modal}
        commentDraft={commentDraft}
        justifyReason={justifyReason}
        justifyDescription={justifyDescription}
        onCommentChange={setCommentDraft}
        onJustifyReasonChange={setJustifyReason}
        onJustifyDescriptionChange={setJustifyDescription}
        onClose={() => setModal(null)}
        onSubmitComment={submitComment}
        onSubmitJustification={submitJustification}
        onOpenCentral={openCentral}
        onDone={markActionDone}
        onJustify={openJustification}
      />
    </main>
  )
}

function MetricCard({ icon, label, value, detail, tone, action }: {
  icon: ReactNode
  label: string
  value: string
  detail: string
  tone: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  action: string
}) {
  const toneClass = {
    blue: 'bg-status-info-surface text-status-info',
    green: 'bg-status-success-surface text-status-success',
    orange: 'bg-status-warning-surface text-status-warning',
    red: 'bg-status-error-surface text-status-error',
    purple: 'bg-accent-purple-soft text-accent-purple',
  }[tone]
  return (
    <Card className="rounded-mx-lg border border-border-default bg-white p-mx-md shadow-none">
      <div className="flex items-center gap-mx-sm">
        <span className={`grid h-mx-12 w-mx-12 shrink-0 place-items-center rounded-full ${toneClass}`}>{icon}</span>
        <div className="min-w-0">
          <Typography variant="caption" className="tracking-normal text-text-primary">{label}</Typography>
          <Typography variant="h2" className={`text-3xl tracking-normal ${tone === 'red' ? 'text-status-error' : ''}`}>{value}</Typography>
          <Typography variant="tiny" tone="muted" className="tracking-normal">{detail}</Typography>
          <button type="button" className="mt-mx-xs text-xs font-black text-status-info">{action} ›</button>
        </div>
      </div>
    </Card>
  )
}

function LinkedActionsSection({
  rows,
  onOpenCentral,
  onDone,
  onJustify,
}: {
  rows: { feedback: FeedbackView; action: FeedbackActionView }[]
  onOpenCentral: (action: FeedbackActionView) => void
  onDone: (action: FeedbackActionView) => void
  onJustify: (action: FeedbackActionView, feedback?: FeedbackView) => void
}) {
  return (
    <section aria-label="Ações vinculadas a feedback">
      <div className="mb-mx-sm">
        <Typography variant="h2" className="text-xl tracking-normal">Ações vinculadas a feedback</Typography>
        <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
          Ações geradas pelos feedbacks do seu líder e conectadas à sua rotina comercial.
        </Typography>
      </div>
      <Card className="overflow-hidden rounded-mx-lg border border-border-default bg-white p-0 shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-surface-alt text-xs uppercase text-text-secondary">
              <tr>
                {['Ação', 'Origem', 'Competência', 'Meta', 'Progresso', 'Prazo', 'Status', 'Ações'].map(header => (
                  <th scope="col" key={header} className="px-mx-md py-mx-sm font-black">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ feedback, action }) => (
                <tr key={action.id} className="border-t border-border-default">
                  <td className="px-mx-md py-mx-sm">
                    <div className="flex items-center gap-mx-sm">
                      <span className="grid h-mx-10 w-mx-10 shrink-0 place-items-center rounded-full bg-status-warning-surface text-status-warning">
                        <ClipboardCheck size={18} />
                      </span>
                      <Typography variant="p" className="font-black text-text-primary">{action.title}</Typography>
                    </div>
                  </td>
                  <td className="px-mx-md py-mx-sm font-semibold text-text-secondary">{action.origin}</td>
                  <td className="px-mx-md py-mx-sm font-semibold text-text-secondary">{action.competence}</td>
                  <td className="px-mx-md py-mx-sm font-semibold text-text-secondary">{action.meta}</td>
                  <td className="px-mx-md py-mx-sm">
                    <Progress value={action.progressCurrent} total={action.progressTarget} label={action.progressLabel} />
                  </td>
                  <td className="px-mx-md py-mx-sm font-semibold text-text-secondary">{action.deadline}</td>
                  <td className="px-mx-md py-mx-sm"><ActionStatusBadge action={action} /></td>
                  <td className="px-mx-md py-mx-sm">
                    <div className="grid gap-mx-xs">
                      <Button size="xs" variant="outline" onClick={() => onOpenCentral(action)}>Ver na Central de Execução</Button>
                      <div className="grid grid-cols-2 gap-mx-xs">
                        <Button size="xs" variant="outline" onClick={() => onDone(action)}><CheckCircle2 size={14} /> Marcar como feito</Button>
                        <Button size="xs" variant="outline" onClick={() => onJustify(action, feedback)}><MessageSquare size={14} /> Justificar</Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  )
}

function PendingFeedbacksSection({
  feedbacks,
  loading,
  confirmingId,
  onConfirm,
  onComment,
  onViewAction,
}: {
  feedbacks: FeedbackView[]
  loading: boolean
  confirmingId: string | null
  onConfirm: (feedback: FeedbackView) => void
  onComment: (feedback: FeedbackView) => void
  onViewAction: (feedback: FeedbackView) => void
}) {
  const navigate = useNavigate()
  return (
    <section aria-label="Feedback pendente">
      <div className="mb-mx-sm flex items-center gap-mx-sm">
        <Typography variant="h2" className="text-xl tracking-normal">Feedback pendente</Typography>
        <span className="grid h-mx-6 min-w-mx-6 place-items-center rounded-full bg-status-error px-mx-xs text-xs font-black text-white">{feedbacks.length}</span>
      </div>
      <Card className="overflow-hidden rounded-mx-lg border border-border-default bg-white p-0 shadow-none">
        {loading && feedbacks.length === 0 && (
          <Typography tone="muted" className="p-mx-md">Carregando feedback...</Typography>
        )}
        {!loading && feedbacks.length === 0 && (
          <div className="p-mx-lg text-center">
            <CheckCircle2 size={28} className="mx-auto text-status-success" />
            <Typography variant="p" className="mt-mx-sm font-black">Tudo confirmado!</Typography>
            <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Nenhum feedback aguardando sua leitura.</Typography>
            <div className="mt-mx-md flex justify-center gap-mx-sm">
              <Button variant="outline" size="sm" onClick={() => document.getElementById('historico-feedbacks')?.scrollIntoView({ behavior: 'smooth' })}>Ver histórico</Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/pdi')}>Ver PDI</Button>
            </div>
          </div>
        )}
        {feedbacks.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="bg-surface-alt text-xs uppercase text-text-secondary">
                <tr>
                  {['Data', 'Tipo', 'Competência', 'Motivo / Caso', 'Indicador', 'Comentário do líder', 'Responsável', 'Ação vinculada', 'Ações'].map(header => (
                    <th scope="col" key={header} className="px-mx-md py-mx-sm font-black">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {feedbacks.map(feedback => (
                  <tr key={feedback.id} className="border-t border-border-default align-top">
                    <td className="px-mx-md py-mx-sm"><FeedbackDate value={feedback.createdAt} /></td>
                    <td className="px-mx-md py-mx-sm"><FeedbackKindBadge kind={feedback.kind} /></td>
                    <td className="px-mx-md py-mx-sm font-semibold text-text-secondary">{feedback.competence}</td>
                    <td className="px-mx-md py-mx-sm font-semibold text-text-secondary">{feedback.reason}</td>
                    <td className="px-mx-md py-mx-sm font-semibold text-text-secondary">{feedback.indicator}</td>
                    <td className="px-mx-md py-mx-sm text-text-secondary">{feedback.leaderComment}</td>
                    <td className="px-mx-md py-mx-sm">
                      <ResponsibleCell name={feedback.responsibleName} role={feedback.responsibleRole} />
                    </td>
                    <td className="px-mx-md py-mx-sm">
                      {feedback.action ? (
                        <button type="button" className="text-left font-black text-status-success" onClick={() => onViewAction(feedback)}>
                          {feedback.action.title}
                        </button>
                      ) : (
                        <Typography variant="tiny" tone="muted" className="tracking-normal">Sem ação vinculada</Typography>
                      )}
                    </td>
                    <td className="px-mx-md py-mx-sm">
                      <div className="grid gap-mx-xs">
                        <Button size="xs" variant="outline" onClick={() => onConfirm(feedback)} disabled={confirmingId === feedback.id}>
                          {confirmingId === feedback.id ? 'Confirmando...' : 'Li e compreendi'}
                        </Button>
                        <Button size="xs" variant="outline" onClick={() => onComment(feedback)}>
                          <MessageSquare size={14} /> Deixar comentário
                        </Button>
                        {feedback.action && (
                          <Button size="xs" variant="ghost" onClick={() => onViewAction(feedback)}>
                            Ver ação <ExternalLink size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {feedbacks.length > 0 && (
          <button type="button" className="w-full border-t border-border-default py-mx-sm text-sm font-black text-status-success">
            Ver todos os feedbacks pendentes ({feedbacks.length}) ›
          </button>
        )}
      </Card>
    </section>
  )
}

function WhyConfirmCard() {
  const bullets = [
    'Garante que você está alinhado com as expectativas.',
    'Ajuda a direcionar seu plano de desenvolvimento.',
    'Fortalece a comunicação com seu líder.',
    'Impacta diretamente na sua evolução e resultados.',
  ]
  return (
    <Card className="rounded-mx-lg border border-status-success/20 bg-status-success-surface p-mx-lg shadow-none">
      <div className="mb-mx-sm flex items-start gap-mx-sm">
        <span className="grid h-mx-11 w-mx-11 shrink-0 place-items-center rounded-full bg-white text-status-success">
          <CheckCircle2 size={22} />
        </span>
        <Typography variant="h3" className="leading-tight">Por que é importante confirmar seus feedbacks?</Typography>
      </div>
      <ul className="space-y-mx-sm text-sm font-semibold text-text-secondary">
        {bullets.map(text => (
          <li key={text} className="flex gap-mx-xs">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-status-success" /> {text}
          </li>
        ))}
      </ul>
    </Card>
  )
}

function ClosingImpactCard({ action, onDone, onJustify }: {
  action: FeedbackActionView
  onDone: (action: FeedbackActionView) => void
  onJustify: (action: FeedbackActionView) => void
}) {
  return (
    <Card className="rounded-mx-lg border border-status-warning/30 bg-status-warning-surface p-mx-lg shadow-none">
      <div className="mb-mx-sm flex items-start gap-mx-sm">
        <span className="grid h-mx-11 w-mx-11 shrink-0 place-items-center rounded-full bg-white text-status-warning">
          <AlertTriangle size={22} />
        </span>
        <div>
          <Typography variant="h3">Impacto no Fechamento Diário</Typography>
          <Typography variant="p" tone="muted" className="mt-mx-xs">
            Este feedback possui ação obrigatória. Para fechar o dia, conclua a ação ou registre uma justificativa.
          </Typography>
        </div>
      </div>
      <div className="mt-mx-md flex items-center gap-mx-sm">
        <Typography variant="p" className="font-black text-text-primary">Status:</Typography>
        <ActionStatusBadge action={action} />
      </div>
      <div className="mt-mx-md grid grid-cols-2 gap-mx-sm">
        <Button variant="success" onClick={() => onDone(action)}>Concluir ação</Button>
        <Button variant="outline" onClick={() => onJustify(action)}>Justificar</Button>
      </div>
    </Card>
  )
}

function CentralLinkCard({ action, onOpenCentral }: { action: FeedbackActionView; onOpenCentral: (action: FeedbackActionView) => void }) {
  return (
    <Card className="rounded-mx-lg border border-status-info/20 bg-status-info-surface p-mx-lg shadow-none">
      <div className="mb-mx-md flex items-center gap-mx-sm">
        <span className="grid h-mx-11 w-mx-11 shrink-0 place-items-center rounded-full bg-white text-status-info">
          <Target size={22} />
        </span>
        <Typography variant="h3">Vinculado à Central de Execução</Typography>
      </div>
      <div className="rounded-mx-md border border-border-default bg-white p-mx-md">
        <Typography variant="p" className="font-black text-text-primary">{action.title}</Typography>
        <div className="mt-mx-sm grid grid-cols-2 gap-mx-sm">
          <div>
            <Typography variant="tiny" tone="muted" className="tracking-normal">Meta</Typography>
            <Typography variant="p" className="font-semibold text-text-primary">{action.meta}</Typography>
          </div>
          <div>
            <Typography variant="tiny" tone="muted" className="tracking-normal">Status</Typography>
            <Typography variant="p" className="font-semibold text-text-primary">{action.progressLabel}</Typography>
          </div>
        </div>
        <div className="mt-mx-sm">
          <Progress value={action.progressCurrent} total={action.progressTarget} label="" />
        </div>
      </div>
      <Button className="mt-mx-md w-full" onClick={() => onOpenCentral(action)}>
        Ver ação do dia <ExternalLink size={16} />
      </Button>
    </Card>
  )
}

function HistorySection({ feedbacks }: { feedbacks: FeedbackView[] }) {
  return (
    <section id="historico-feedbacks" aria-label="Histórico de feedbacks">
      <div className="mb-mx-sm">
        <Typography variant="h2" className="text-xl tracking-normal">Histórico de feedbacks</Typography>
      </div>
      <Card className="overflow-hidden rounded-mx-lg border border-border-default bg-white p-0 shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-surface-alt text-xs uppercase text-text-secondary">
              <tr>
                {['Data', 'Tipo', 'Competência', 'Motivo / Caso', 'Ação vinculada', 'Responsável', 'Confirmado em', 'Meu comentário', 'Status'].map(header => (
                  <th scope="col" key={header} className="px-mx-md py-mx-sm font-black">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {feedbacks.map(row => (
                <tr key={`history-${row.id}`} className="border-t border-border-default">
                  <td className="px-mx-md py-mx-sm font-semibold text-text-secondary">{dateParts(row.createdAt).full}</td>
                  <td className="px-mx-md py-mx-sm"><FeedbackKindBadge kind={row.kind} /></td>
                  <td className="px-mx-md py-mx-sm font-semibold text-text-secondary">{row.competence}</td>
                  <td className="px-mx-md py-mx-sm font-semibold text-text-secondary">{row.reason}</td>
                  <td className="px-mx-md py-mx-sm">
                    {row.action ? <span className="font-black text-status-success">{row.action.title}</span> : <Typography variant="tiny" tone="muted" className="tracking-normal">Sem ação vinculada</Typography>}
                  </td>
                  <td className="px-mx-md py-mx-sm"><ResponsibleCell name={row.responsibleName} role={row.responsibleRole} compact /></td>
                  <td className="px-mx-md py-mx-sm font-semibold text-text-secondary">{row.acknowledgedAt ? new Date(row.acknowledgedAt).toLocaleString('pt-BR') : '—'}</td>
                  <td className="px-mx-md py-mx-sm text-text-secondary">{row.sellerComment || '—'}</td>
                  <td className="px-mx-md py-mx-sm"><FeedbackStatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  )
}

function EvolutionSection() {
  const cards = [
    { icon: <Phone size={23} />, value: '+12', label: 'contatos realizados' },
    { icon: <CalendarCheck size={23} />, value: '+3', label: 'retornos agendados' },
    { icon: <TrendingUp size={23} />, value: '+1', label: 'venda gerada pela carteira' },
    { icon: <CheckCircle2 size={23} />, value: '2', label: 'ações concluídas esta semana' },
  ]
  return (
    <section aria-label="Evolução após feedbacks">
      <Card className="rounded-mx-lg border border-border-default bg-white p-mx-lg shadow-none">
        <Typography variant="h2" className="text-xl tracking-normal">Evolução após feedbacks</Typography>
        <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Resultados acumulados nos últimos 90 dias</Typography>
        <div className="mt-mx-md grid grid-cols-1 gap-mx-md sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(card => (
            <div key={card.label} className="rounded-mx-md border border-border-default p-mx-md text-center">
              <span className="mx-auto grid h-mx-12 w-mx-12 place-items-center rounded-full bg-status-success-surface text-status-success">{card.icon}</span>
              <Typography variant="h2" className="mt-mx-sm text-2xl tracking-normal">{card.value}</Typography>
              <Typography variant="p" tone="muted">{card.label}</Typography>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}

function FeedbackModal({
  modal,
  commentDraft,
  justifyReason,
  justifyDescription,
  onCommentChange,
  onJustifyReasonChange,
  onJustifyDescriptionChange,
  onClose,
  onSubmitComment,
  onSubmitJustification,
  onOpenCentral,
  onDone,
  onJustify,
}: {
  modal: ModalState
  commentDraft: string
  justifyReason: string
  justifyDescription: string
  onCommentChange: (value: string) => void
  onJustifyReasonChange: (value: string) => void
  onJustifyDescriptionChange: (value: string) => void
  onClose: () => void
  onSubmitComment: () => void
  onSubmitJustification: () => void
  onOpenCentral: (action: FeedbackActionView) => void
  onDone: (action: FeedbackActionView) => void
  onJustify: (action: FeedbackActionView, feedback?: FeedbackView) => void
}) {
  if (!modal) return null

  if (modal.type === 'comment') {
    return (
      <Modal
        open
        onClose={onClose}
        title="Deixar comentário"
        description="Seu comentário fica vinculado ao feedback e notifica seu líder."
        footer={(
          <>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={onSubmitComment}><Send size={16} /> Enviar comentário</Button>
          </>
        )}
      >
        <div className="space-y-mx-md">
          <div>
            <Typography variant="caption" className="tracking-normal text-text-primary">Comentário do vendedor</Typography>
            <textarea
              aria-label="Comentário do vendedor"
              value={commentDraft}
              onChange={(event) => onCommentChange(event.target.value)}
              rows={5}
              className="mt-mx-xs w-full rounded-mx-md border border-border-default p-mx-sm text-sm"
              placeholder="Escreva seu comentário sobre o feedback."
            />
          </div>
          <label className="block">
            <Typography variant="caption" className="tracking-normal text-text-primary">Anexo opcional</Typography>
            <input type="file" aria-label="Anexo opcional" className="mt-mx-xs w-full rounded-mx-md border border-border-default bg-white p-mx-sm text-sm" />
          </label>
        </div>
      </Modal>
    )
  }

  if (modal.type === 'justify') {
    return (
      <Modal
        open
        onClose={onClose}
        title="Justificar ação pendente"
        description="A justificativa libera o fluxo do Fechamento Diário quando a regra permitir."
        footer={(
          <>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={onSubmitJustification}><Send size={16} /> Enviar justificativa</Button>
          </>
        )}
      >
        <div className="space-y-mx-md">
          <div>
            <Typography variant="caption" className="tracking-normal text-text-primary">Motivo da não conclusão</Typography>
            <select
              aria-label="Motivo da não conclusão"
              value={justifyReason}
              onChange={(event) => onJustifyReasonChange(event.target.value)}
              className="mt-mx-xs h-mx-11 w-full rounded-mx-md border border-border-default bg-white px-mx-sm text-sm font-semibold"
            >
              <option>Meta não concluída</option>
              <option>Cliente sem resposta</option>
              <option>Falta de agenda disponível</option>
              <option>Outro motivo</option>
            </select>
          </div>
          <div>
            <Typography variant="caption" className="tracking-normal text-text-primary">Descrição obrigatória</Typography>
            <textarea
              aria-label="Descrição obrigatória"
              value={justifyDescription}
              onChange={(event) => onJustifyDescriptionChange(event.target.value)}
              rows={5}
              className="mt-mx-xs w-full rounded-mx-md border border-border-default p-mx-sm text-sm"
              placeholder="Descreva o que impediu a conclusão da ação."
            />
          </div>
          <label className="block">
            <Typography variant="caption" className="tracking-normal text-text-primary">Anexo opcional</Typography>
            <input type="file" aria-label="Anexo opcional" className="mt-mx-xs w-full rounded-mx-md border border-border-default bg-white p-mx-sm text-sm" />
          </label>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Detalhe da ação vinculada"
      description="Ação gerada a partir do feedback e conectada à Central de Execução."
      footer={(
        <>
          <Button variant="outline" onClick={() => onJustify(modal.action, modal.feedback)}>Justificar</Button>
          <Button variant="outline" onClick={() => onDone(modal.action)}>Marcar como feito</Button>
          <Button onClick={() => onOpenCentral(modal.action)}>Ver na Central</Button>
        </>
      )}
    >
      <div className="space-y-mx-md">
        <InfoRow label="Ação" value={modal.action.title} />
        <InfoRow label="Origem do feedback" value={modal.action.origin} />
        <InfoRow label="Meta" value={modal.action.meta} />
        <InfoRow label="Prazo" value={modal.action.deadline} />
        <div>
          <Typography variant="caption" className="tracking-normal text-text-primary">Progresso</Typography>
          <Progress value={modal.action.progressCurrent} total={modal.action.progressTarget} label={modal.action.progressLabel} />
        </div>
        <InfoRow label="Critério de conclusão" value={modal.action.completionCriteria} />
        <InfoRow label="Impacto no fechamento" value={modal.action.closingImpact ? 'Exige conclusão ou justificativa no Fechamento Diário.' : 'Sem impacto obrigatório no fechamento.'} />
        <InfoRow label="Vínculo com PDI" value={modal.action.pdiLink || 'Opcional, não aplicado automaticamente ao Score comparativo.'} />
      </div>
    </Modal>
  )
}

function Progress({ value, total, label }: { value: number; total: number; label: string }) {
  const width = `${Math.min(Math.max((value / Math.max(total, 1)) * 100, 0), 100)}%`
  return (
    <div>
      {label && <Typography variant="tiny" className="mb-1 block font-black tracking-normal text-text-primary">{label}</Typography>}
      <div className="h-mx-2 overflow-hidden rounded-full bg-border-default">
        <div className="h-full rounded-full bg-status-success" style={{ width }} />
      </div>
    </div>
  )
}

function FeedbackDate({ value }: { value: string }) {
  const parts = dateParts(value)
  return (
    <div className="text-center">
      <Typography variant="h3" className="leading-none">{parts.day}</Typography>
      <Typography variant="tiny" className="block font-black uppercase tracking-normal">{parts.month}</Typography>
      <Typography variant="tiny" tone="muted" className="block font-black tracking-normal">{parts.year}</Typography>
    </div>
  )
}

function ResponsibleCell({ name, role, compact = false }: { name: string; role: string; compact?: boolean }) {
  const initials = name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="flex items-center gap-mx-sm">
      <span className={`${compact ? 'h-mx-8 w-mx-8 text-[10px]' : 'h-mx-10 w-mx-10 text-xs'} grid shrink-0 place-items-center rounded-full bg-mx-green-900 font-black text-white`}>
        {initials}
      </span>
      <div>
        <Typography variant="p" className="font-black text-text-primary">{name}</Typography>
        <Typography variant="tiny" tone="muted" className="tracking-normal">{role}</Typography>
      </div>
    </div>
  )
}

function FeedbackKindBadge({ kind }: { kind: FeedbackKind }) {
  if (kind === 'Positivo') return <Badge variant="success" className="bg-status-success-surface text-status-success"><ThumbsUp size={13} /> {kind}</Badge>
  if (kind === 'Obrigatório') return <Badge variant="danger" className="bg-status-error-surface text-status-error"><AlertCircle size={13} /> {kind}</Badge>
  if (kind === 'Automático') return <Badge variant="info" className="bg-status-info-surface text-status-info"><FileText size={13} /> {kind}</Badge>
  if (kind === 'PDI') return <Badge variant="brand">{kind}</Badge>
  return <Badge variant="warning" className="bg-status-warning-surface text-status-warning"><TrendingUp size={13} /> {kind}</Badge>
}

function FeedbackStatusBadge({ status }: { status: FeedbackStatus }) {
  if (status === 'Lido e compreendido' || status === 'Ação concluída') return <Badge variant="success" className="bg-status-success-surface text-status-success">{status}</Badge>
  if (status === 'Justificado') return <Badge variant="info" className="bg-status-info-surface text-status-info">{status}</Badge>
  if (status === 'Vinculado ao PDI') return <Badge variant="brand">{status}</Badge>
  if (status === 'Vencido') return <Badge variant="danger" className="bg-status-error-surface text-status-error">{status}</Badge>
  return <Badge variant="warning" className="bg-status-warning-surface text-status-warning">{status}</Badge>
}

function ActionStatusBadge({ action }: { action: FeedbackActionView }) {
  if (action.status === 'concluida') return <Badge variant="success" className="bg-status-success-surface text-status-success">{action.statusLabel}</Badge>
  if (action.status === 'justificada') return <Badge variant="info" className="bg-status-info-surface text-status-info">{action.statusLabel}</Badge>
  if (action.status === 'em_andamento') return <Badge variant="info" className="bg-status-info-surface text-status-info">{action.statusLabel}</Badge>
  return <Badge variant="warning" className="bg-status-warning-surface text-status-warning">{action.statusLabel}</Badge>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-mx-md border border-border-default p-mx-sm">
      <Typography variant="caption" className="tracking-normal text-text-primary">{label}</Typography>
      <Typography variant="p" tone="muted" className="mt-1">{value}</Typography>
    </div>
  )
}
