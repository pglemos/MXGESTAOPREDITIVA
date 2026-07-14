import { useCallback, useEffect, useMemo, useState } from 'react'
import { isSameWeek, parseISO, startOfWeek } from 'date-fns'
import { toast } from '@/lib/toast'
import { useFeedbacks, useWeeklyFeedbackReports } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { useTeam } from '@/hooks/useTeam'
import { useCheckins } from '@/hooks/useCheckins'
import { canManageFeedback } from '@/lib/auth/capabilities'
import { formatStructuredWhatsAppFeedback } from '@/lib/calculations'
import type { FeedbackFormData } from '@/types/database'
import {
  buildFeedbackMetricsPatch,
  formatSafeDate,
  getFeedbackSellerName,
  getPreviousWeekRange,
  type FeedbackListItem,
  type FeedbackTab,
} from '../lib/helpers'
import { validarFeedbackObrigatorio } from '../lib/validation'

export function useStoreFeedback() {
  const { role } = useAuth()
  const {
    devolutivas,
    loading: devolutivasLoading,
    createFeedback,
    refetch: refetchFeedbacks,
  } = useFeedbacks()
  const {
    reports,
    loading: reportsLoading,
    refetch: refetchReports,
  } = useWeeklyFeedbackReports()
  const { sellers } = useTeam()
  const { checkins } = useCheckins()
  const previousWeek = useMemo(() => getPreviousWeekRange(), [])

  const [activeTab, setActiveTab] = useState<FeedbackTab>('individual')
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefetching, setIsRefetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<FeedbackFormData>({
    seller_id: '',
    week_reference: previousWeek.startKey,
    leads_week: 0,
    agd_week: 0,
    visit_week: 0,
    vnd_week: 0,
    tx_lead_agd: 0,
    tx_agd_visita: 0,
    tx_visita_vnd: 0,
    meta_compromisso: 0,
    positives: '',
    attention_points: '',
    action: '',
    caso_motivo: '',
    notes: '',
  })

  useEffect(() => {
    setFormData((f) => ({ ...f, week_reference: previousWeek.startKey }))
  }, [previousWeek.startKey])

  const calculateStoreSellerMetrics = useCallback(
    (sellerId: string, weekReference: string) => {
      if (!sellerId) {
        setFormData((f) => ({ ...f, seller_id: '' }))
        return null
      }
      let selectedWeekStart: Date
      try {
        selectedWeekStart = startOfWeek(parseISO(weekReference), { weekStartsOn: 1 })
      } catch {
        toast.error('Semana inválida.')
        return null
      }
      const weekCheckins = checkins.filter(
        (c) =>
          c.seller_user_id === sellerId &&
          (() => {
            try {
              return isSameWeek(parseISO(c.reference_date), selectedWeekStart, {
                weekStartsOn: 1,
              })
            } catch {
              return false
            }
          })(),
      )
      return buildFeedbackMetricsPatch(weekCheckins, 'suggested')
    },
    [checkins],
  )

  const handleSellerSelect = useCallback(
    (sellerId: string) => {
      if (!sellerId) {
        setFormData((f) => ({ ...f, seller_id: '' }))
        return
      }
      const metricsPatch = calculateStoreSellerMetrics(sellerId, formData.week_reference)
      if (!metricsPatch) return
      setFormData((f) => ({
        ...f,
        seller_id: sellerId,
        ...metricsPatch,
      }))
    },
    [calculateStoreSellerMetrics, formData.week_reference],
  )

  const handleWeekReferenceChange = useCallback(
    (weekReference: string) => {
      const metricsPatch = formData.seller_id
        ? calculateStoreSellerMetrics(formData.seller_id, weekReference)
        : null
      setFormData((f) => ({
        ...f,
        week_reference: weekReference,
        ...(metricsPatch || {}),
      }))
    },
    [calculateStoreSellerMetrics, formData.seller_id],
  )

  const handleSubmit = useCallback(async (submittedData: FeedbackFormData = formData) => {
    const validation = validarFeedbackObrigatorio(submittedData)
    if (!validation.ok) {
      toast.error(validation.message)
      return false
    }
    setSaving(true)
    try {
      const { error } = await createFeedback(submittedData)
      if (error) {
        toast.error(error)
        return false
      }
      toast.success('Mentoria registrada!')
      setShowForm(false)
      await refetchFeedbacks()
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao salvar mentoria.')
      return false
    } finally {
      setSaving(false)
    }
  }, [createFeedback, formData, refetchFeedbacks])

  const handleShareWhatsApp = useCallback((f: FeedbackListItem) => {
    const text = formatStructuredWhatsAppFeedback({
      sellerName: getFeedbackSellerName(f),
      metrics: {
        vnd_total: f.vnd_week,
        agd_total: f.agd_week,
        visitas: f.visit_week,
        leads: f.leads_week,
      },
      diagnostic: { diagnostico: f.attention_points, sugestao: f.action },
      actions: [f.action],
      periodLabel: `Semana ${f.week_reference}`,
      dateLabel: f.created_at ? formatSafeDate(f.created_at) : f.week_reference,
      metaIndividual: f.commitment_suggested || f.meta_compromisso || f.vnd_week,
      metaCompromisso: f.meta_compromisso,
      positives: f.positives,
      attentionPoints: f.attention_points,
    })
    const opened = window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer',
    )
    if (!opened) toast.error('O navegador bloqueou a janela do WhatsApp.')
  }, [])

  const filteredFeedbacks = useMemo<FeedbackListItem[]>(() => {
    return devolutivas.filter(
      (f) =>
        getFeedbackSellerName(f).toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.week_reference.includes(searchTerm),
    )
  }, [devolutivas, searchTerm])

  const handleRefresh = useCallback(async () => {
    setIsRefetching(true)
    try {
      if (activeTab === 'individual') await refetchFeedbacks()
      else await refetchReports()
      toast.success('Sincronizado!')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Falha ao sincronizar devolutivas.',
      )
    } finally {
      setIsRefetching(false)
    }
  }, [activeTab, refetchFeedbacks, refetchReports])

  const isOwner = role === 'dono'
  const canCreateFeedback = canManageFeedback(role)
  const isManager = role === 'gerente'

  return {
    isLoading: devolutivasLoading || reportsLoading,
    reports,
    sellers,
    activeTab,
    setActiveTab,
    showForm,
    setShowForm,
    searchTerm,
    setSearchTerm,
    isRefetching,
    saving,
    formData,
    setFormData,
    filteredFeedbacks,
    handleRefresh,
    handleSellerSelect,
    handleWeekReferenceChange,
    handleSubmit,
    handleShareWhatsApp,
    isOwner,
    isManager,
    canCreateFeedback,
  }
}
