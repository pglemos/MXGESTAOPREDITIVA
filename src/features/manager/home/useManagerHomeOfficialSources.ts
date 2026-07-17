import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type StoreTargetPlanRow = {
  id: string
  version: number
  monthly_goal: number | string | null
  realized: number | string
  required_sales: number | string | null
  appointments_per_sale: number | string | null
  operational_need: number | string | null
  proportional_goal: number | string | null
  business_days_total: number | null
  business_days_elapsed: number | null
  focus_message: string | null
  source_hash: string | null
}

type OfficialManagerHomePlan = {
  id: string
  version: number
  monthly_goal: number | null
  realized: number
  required_sales: number | null
  appointments_per_sale: number | null
  operational_need: number | null
  proportional_goal: number | null
  business_days_total: number | null
  business_days_elapsed: number | null
  focus_message: string | null
  source_hash: string | null
}

type AppointmentRow = {
  id: string
  seller_user_id: string
}

export function useManagerHomeOfficialSources({
  storeId,
  referenceDate,
}: {
  storeId: string | null
  referenceDate: string
}) {
  const [plan, setPlan] = useState<OfficialManagerHomePlan | null>(null)
  const [appointmentRows, setAppointmentRows] = useState<AppointmentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!storeId) {
      setPlan(null)
      setAppointmentRows([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const consolidation = await supabase.rpc('consolidate_store_target_plan', {
        p_store_id: storeId,
        p_reference_date: referenceDate,
      })
      if (consolidation.error) throw consolidation.error

      const start = `${referenceDate}T00:00:00-03:00`
      const end = `${referenceDate}T23:59:59-03:00`
      const [planResult, appointmentsResult] = await Promise.all([
        supabase
          .from('store_target_plans')
          .select('id,version,monthly_goal,realized,required_sales,appointments_per_sale,operational_need,proportional_goal,business_days_total,business_days_elapsed,focus_message,source_hash')
          .eq('store_id', storeId)
          .eq('reference_date', referenceDate)
          .eq('horizon', 'hoje')
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('agendamentos')
          .select('id,seller_user_id')
          .eq('loja_id', storeId)
          .gte('data_hora', start)
          .lte('data_hora', end)
          .eq('confirmation_status', 'confirmado')
          .not('modalidade', 'is', null)
          .not('cliente_id', 'is', null),
      ])

      if (planResult.error) throw planResult.error
      if (appointmentsResult.error) throw appointmentsResult.error

      setPlan(planResult.data ? normalizePlan(planResult.data as StoreTargetPlanRow) : null)
      setAppointmentRows((appointmentsResult.data || []) as AppointmentRow[])
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Falha ao carregar as fontes oficiais do Dashboard.'
      setPlan(null)
      setAppointmentRows([])
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [referenceDate, storeId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const appointmentsBySeller = useMemo(() => {
    const totals = new Map<string, number>()
    for (const appointment of appointmentRows) {
      totals.set(appointment.seller_user_id, (totals.get(appointment.seller_user_id) || 0) + 1)
    }
    return totals
  }, [appointmentRows])

  return {
    plan,
    appointmentsBySeller,
    totalAppointments: appointmentRows.length,
    loading,
    error,
    refresh,
  }
}

function normalizePlan(row: StoreTargetPlanRow): OfficialManagerHomePlan {
  return {
    id: row.id,
    version: row.version,
    monthly_goal: nullableNumber(row.monthly_goal),
    realized: nullableNumber(row.realized) ?? 0,
    required_sales: nullableNumber(row.required_sales),
    appointments_per_sale: nullableNumber(row.appointments_per_sale),
    operational_need: nullableNumber(row.operational_need),
    proportional_goal: nullableNumber(row.proportional_goal),
    business_days_total: row.business_days_total,
    business_days_elapsed: row.business_days_elapsed,
    focus_message: row.focus_message,
    source_hash: row.source_hash,
  }
}

function nullableNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
