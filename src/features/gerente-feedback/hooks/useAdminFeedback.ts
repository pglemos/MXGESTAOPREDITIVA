import { useCallback, useEffect, useMemo, useState } from 'react'
import { endOfWeek, format, parseISO, startOfWeek } from 'date-fns'
import { toast } from '@/lib/toast'
import { useFeedbacks, useWeeklyFeedbackReports } from '@/hooks/useData'
import { useAllSellers, useStores } from '@/hooks/useTeam'
import { formatStructuredWhatsAppFeedback } from '@/lib/calculations'
import type { DailyCheckin, FeedbackFormData } from '@/types/database'
import {
  buildFeedbackMetricsPatch,
  formatSafeDate,
  getFeedbackSellerName,
  getPreviousWeekRange,
  type FeedbackListItem,
  type FeedbackTab,
} from '../lib/helpers'

export function useAdminFeedback() {
  const {
    devolutivas,
    loading: devolutivasLoading,
    createFeedback,
    refetch: refetchFeedbacks,
  } = useFeedbacks()
  const {
    reports,
    loading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = useWeeklyFeedbackReports()
  const { sellers: allSellers, loading: sellersLoading } = useAllSellers()
  const { lojas } = useStores()

  const previousWeek = useMemo(() => getPreviousWeekRange(), [])

  const [activeTab, setActiveTab] = useState<FeedbackTab>('individual')
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefetching, setIsRefetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')
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
    notes: '',
  })

  useEffect(() => {
    setFormData((f) => ({ ...f, week_reference: previousWeek.startKey }))
  }, [previousWeek.startKey])

  const filteredSellers = useMemo(() => {
    if (!selectedStoreId) return allSellers
    return allSellers.filter((s) => s.store_id === selectedStoreId)
  }, [allSellers, selectedStoreId])

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

  const loadSellerMetrics = useCallback(
    async (sellerId: string, weekReference: string) => {
      if (!sellerId) {
        setFormData((f) => ({ ...f, seller_id: '' }))
        return
      }
      const seller = allSellers.find((s) => s.id === sellerId)
      if (!seller) return

      let selectedWeekStart: Date
      let selectedWeekEnd: Date
      try {
        selectedWeekStart = startOfWeek(parseISO(weekReference), { weekStartsOn: 1 })
        selectedWeekEnd = endOfWeek(selectedWeekStart, { weekStartsOn: 1 })
      } catch {
        toast.error('Semana inválida.')
        return
      }

      const { supabase } = await import('@/lib/supabase')
      const { isLancamentosViaRpcEnabled } = await import('@/lib/feature-flags')

      let weekCheckins: DailyCheckin[] | null = null
      let error: { message: string } | null = null
      if (isLancamentosViaRpcEnabled()) {
        const { data, error: rpcErr } = await supabase.rpc(
          'get_lancamentos_por_vendedor_periodo',
          {
            p_seller_id: sellerId,
            p_store_id: seller.store_id!,
            p_start_date: format(selectedWeekStart, 'yyyy-MM-dd'),
            p_end_date: format(selectedWeekEnd, 'yyyy-MM-dd'),
            p_scope: 'daily',
          },
        )
        weekCheckins = (data as DailyCheckin[] | null) || []
        error = rpcErr
      } else {
        const res = await supabase
          .from('lancamentos_diarios')
          .select(
            'id, seller_user_id, store_id, reference_date, leads_prev_day, agd_cart_prev_day, agd_net_prev_day, agd_cart_today, agd_net_today, vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day, visit_prev_day',
          )
          .eq('seller_user_id', sellerId)
          .eq('store_id', seller.store_id)
          .gte('reference_date', format(selectedWeekStart, 'yyyy-MM-dd'))
          .lte('reference_date', format(selectedWeekEnd, 'yyyy-MM-dd'))
        weekCheckins = res.data as DailyCheckin[] | null
        error = res.error
      }
      if (error) {
        toast.error('Não foi possível carregar os check-ins do especialista.')
        return
      }

      setFormData((f) => ({
        ...f,
        seller_id: sellerId,
        week_reference: weekReference,
        ...buildFeedbackMetricsPatch((weekCheckins || []) as DailyCheckin[]),
      }))
    },
    [allSellers],
  )

  const handleSellerSelect = useCallback(
    (sellerId: string) => {
      void loadSellerMetrics(sellerId, formData.week_reference)
    },
    [formData.week_reference, loadSellerMetrics],
  )

  const handleWeekReferenceChange = useCallback(
    (weekReference: string) => {
      setFormData((f) => ({ ...f, week_reference: weekReference }))
      if (formData.seller_id) void loadSellerMetrics(formData.seller_id, weekReference)
    },
    [formData.seller_id, loadSellerMetrics],
  )

  const handleSubmit = useCallback(async () => {
    if (
      !formData.seller_id ||
      !formData.positives.trim() ||
      !formData.attention_points.trim() ||
      !formData.action.trim()
    ) {
      toast.error('Preencha especialista, pontos fortes, pontos de atenção e ação.')
      return
    }
    setSaving(true)
    const seller = allSellers.find((s) => s.id === formData.seller_id)
    if (!seller) {
      setSaving(false)
      toast.error('Selecione um vendedor.')
      return
    }
    const { error } = await createFeedback({ ...formData, store_id: seller.store_id })
    setSaving(false)
    if (error) toast.error(error)
    else {
      toast.success('Mentoria registrada!')
      setShowForm(false)
      await refetchFeedbacks()
    }
  }, [allSellers, createFeedback, formData, refetchFeedbacks])

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

  return {
    isLoading: devolutivasLoading || reportsLoading || sellersLoading,
    reports,
    reportsError,
    activeTab,
    setActiveTab,
    showForm,
    setShowForm,
    searchTerm,
    setSearchTerm,
    isRefetching,
    saving,
    selectedStoreId,
    setSelectedStoreId,
    formData,
    setFormData,
    filteredSellers,
    filteredFeedbacks,
    lojas,
    previousWeek,
    handleRefresh,
    handleSellerSelect,
    handleWeekReferenceChange,
    handleSubmit,
    handleShareWhatsApp,
  }
}
