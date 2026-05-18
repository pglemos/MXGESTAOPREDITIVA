import { supabase } from '@/lib/supabase'
import type {
  CalendarSyncResult,
  ScheduleEventCalendarRow,
  VisitCalendarRow,
} from './types'

const SAO_PAULO_OFFSET = '-03:00'

export function buildSaoPauloDateTime(date: string, time: string) {
  return `${date}T${time}:00${SAO_PAULO_OFFSET}`
}

export function getCentralSyncError(result: CalendarSyncResult | null) {
  if (!result) return 'Agendamento salvo no sistema, mas não foi possível confirmar a sincronização com a Agenda Central MX.'
  const centralError = result.errors.find((item) => item.calendar === 'central')
  if (centralError) return `Agendamento salvo no sistema, mas não sincronizou com a Agenda Central MX: ${centralError.message}`
  if (!result.centralConnected) return 'Agendamento salvo no sistema, mas a Agenda Central MX não está conectada.'
  return null
}

export async function syncVisitToGoogle(
  visitId: string,
  action: 'upsert' | 'delete' = 'upsert',
): Promise<CalendarSyncResult | null> {
  try {
    const { data: visit } = await supabase
      .from('visitas_consultoria')
      .select(`
        id,
        client_id,
        consultant_id,
        auxiliary_consultant_id,
        scheduled_at,
        duration_hours,
        modality,
        status,
        objective,
        visit_reason,
        target_audience,
        product_name,
        google_event_id,
        google_event_id_central,
        google_meet_link,
        consultant:usuarios!visitas_consultoria_consultor_id_fkey(email),
        client:clientes_consultoria!client_id(name)
      `)
      .eq('id', visitId)
      .maybeSingle() as { data: VisitCalendarRow | null }
    if (!visit) return null
    const payload = {
      id: visit.id,
      client_id: visit.client_id,
      client_name: visit.client?.name ?? null,
      client_address: null,
      scheduled_at: visit.scheduled_at,
      duration_hours: visit.duration_hours,
      modality: visit.modality,
      status: visit.status,
      objective: visit.objective,
      visit_reason: visit.visit_reason ?? null,
      target_audience: visit.target_audience ?? null,
      product_name: visit.product_name ?? null,
      consultant_email: visit.consultant?.email ?? null,
      consultant_id: visit.consultant_id ?? null,
      auxiliary_consultant_id: visit.auxiliary_consultant_id ?? null,
      google_event_id: visit.google_event_id ?? null,
      google_event_id_central: visit.google_event_id_central ?? null,
      google_meet_link: visit.google_meet_link ?? null,
    }
    const { data, error } = await supabase.functions.invoke<CalendarSyncResult>('google-calendar-sync', { body: { action, visit: payload } })
    if (error) throw error
    return data ?? null
  } catch {
    return null
  }
}

export async function syncScheduleEventToGoogle(
  eventId: string,
  action: 'upsert' | 'delete' = 'upsert',
): Promise<CalendarSyncResult | null> {
  try {
    const { data: event } = await supabase
      .from('eventos_agenda_consultoria')
      .select(`
        id,
        event_type,
        title,
        topic,
        starts_at,
        duration_hours,
        modality,
        location,
        target_audience,
        audience_goal,
        responsible_name,
        responsible_user_id,
        ticket_price_text,
        visit_reason,
        product_name,
        google_event_id,
        google_event_id_personal,
        google_meet_link,
        status,
        responsible:usuarios!eventos_agenda_consultoria_responsavel_usuario_id_fkey(email)
      `)
      .eq('id', eventId)
      .maybeSingle() as { data: ScheduleEventCalendarRow | null }
    if (!event) return null

    const payload = {
      id: event.id,
      event_type: event.event_type,
      title: event.title,
      topic: event.topic ?? null,
      starts_at: event.starts_at,
      duration_hours: event.duration_hours,
      modality: event.modality,
      location: event.location ?? null,
      target_audience: event.target_audience ?? null,
      audience_goal: event.audience_goal ?? null,
      responsible_name: event.responsible_name ?? null,
      responsible_user_id: event.responsible_user_id ?? null,
      responsible_email: event.responsible?.email ?? null,
      ticket_price_text: event.ticket_price_text ?? null,
      visit_reason: event.visit_reason ?? null,
      product_name: event.product_name ?? null,
      google_event_id: event.google_event_id ?? null,
      google_event_id_personal: event.google_event_id_personal ?? null,
      google_meet_link: event.google_meet_link ?? null,
      status: event.status,
    }
    const { data, error } = await supabase.functions.invoke<CalendarSyncResult>('google-calendar-sync', {
      body: { action, event: payload },
    })
    if (error) throw error
    return data ?? null
  } catch {
    return null
  }
}
