import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import {
  getDuplicateGoogleEventIds,
  getEffectiveCalendarAction,
  getGoogleCalendarSourceKey,
  type SourceKind,
} from '../supabase/functions/_shared/google_calendar_sync_rules.ts'
import type { GoogleCalendarLikeEvent } from '../supabase/functions/_shared/google_calendar_privacy.ts'

type TokenRow = {
  id: string
  user_id: string | null
  provider: string
  access_token: string
  refresh_token: string | null
  expires_at: string | null
  google_email: string | null
}

type UserRow = {
  id: string
  name: string | null
  email: string | null
  role: string | null
}

type VisitRow = {
  id: string
  client_id: string | null
  scheduled_at: string
  status: string | null
  consultant_id: string | null
  auxiliary_consultant_id: string | null
  google_event_id: string | null
  google_event_id_central: string | null
  client?: { name?: string | null } | null
}

type ScheduleEventRow = {
  id: string
  title: string
  starts_at: string
  status: string | null
  responsible_user_id: string | null
  google_event_id: string | null
  google_event_id_personal: string | null
}

type MirrorRow = {
  user_id: string
  source_kind: SourceKind
  source_id: string
  google_event_id: string | null
}

type CalendarRef = {
  kind: 'central' | 'personal'
  userId?: string | null
  accessToken: string
}

type CalendarScan = {
  calendar: CalendarRef
  eventsBySource: Map<string, GoogleCalendarLikeEvent[]>
}

type SourceRecord = {
  kind: SourceKind
  id: string
  title: string
  startsAt: string
  status: string | null
  centralEventId: string | null
  personalEventId: string | null
}

const DRY_RUN = !process.argv.includes('--execute')
const TIME_MIN = process.env.GOOGLE_RECONCILE_TIME_MIN || '2026-01-01T00:00:00.000Z'
const TIME_MAX = process.env.GOOGLE_RECONCILE_TIME_MAX || '2027-01-01T00:00:00.000Z'
const CENTRAL_CALENDAR_ID = process.env.GOOGLE_CENTRAL_CALENDAR_ID || 'primary'

function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

async function decryptToken(payload: string): Promise<string> {
  if (!payload.startsWith('v1.')) return payload
  const [, ivPart, cipherPart] = payload.split('.')
  if (!ivPart || !cipherPart) throw new Error('Invalid encrypted token payload')
  const key = await deriveAesKey(requireEnv('GOOGLE_TOKEN_ENCRYPTION_SECRET', process.env.GOOGLE_TOKEN_ENCRYPTION_SECRET))
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64Url(ivPart) },
    key,
    fromBase64Url(cipherPart),
  )
  return new TextDecoder().decode(plaintext)
}

async function encryptToken(plaintext: string): Promise<string> {
  const key = await deriveAesKey(requireEnv('GOOGLE_TOKEN_ENCRYPTION_SECRET', process.env.GOOGLE_TOKEN_ENCRYPTION_SECRET))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext))
  return `v1.${toBase64Url(iv)}.${toBase64Url(new Uint8Array(ciphertext))}`
}

async function refreshGoogleAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: requireEnv('GOOGLE_CLIENT_ID', process.env.GOOGLE_CLIENT_ID),
      client_secret: requireEnv('GOOGLE_CLIENT_SECRET', process.env.GOOGLE_CLIENT_SECRET),
      grant_type: 'refresh_token',
    }),
  })
  const data = await response.json()
  if (data.error) throw new Error(`Token refresh failed: ${data.error_description || data.error}`)
  return { access_token: data.access_token, expires_in: data.expires_in }
}

const supabase = createClient(
  requireEnv('VITE_SUPABASE_URL', process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
  { auth: { persistSession: false, autoRefreshToken: false } },
)

async function getAccessToken(tokenRow: TokenRow): Promise<string> {
  let accessToken = await decryptToken(tokenRow.access_token)
  const expiresAt = tokenRow.expires_at ? Date.parse(tokenRow.expires_at) : 0
  if (!expiresAt || Date.now() < expiresAt - 60_000) return accessToken
  if (!tokenRow.refresh_token) return accessToken

  const refreshToken = await decryptToken(tokenRow.refresh_token)
  const refreshed = await refreshGoogleAccessToken(refreshToken)
  accessToken = refreshed.access_token

  if (!DRY_RUN) {
    const encrypted = await encryptToken(accessToken)
    const { error } = await supabase
      .from('tokens_oauth_consultoria')
      .update({
        access_token: encrypted,
        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      })
      .eq('id', tokenRow.id)
    if (error) throw error
  }

  return accessToken
}

async function googleApi(accessToken: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const response = await fetch(`https://www.googleapis.com${path}`, { ...init, headers })
  if (!response.ok && response.status !== 404 && response.status !== 410) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data?.error?.message || `Google API error (${response.status})`)
  }
  return response
}

async function listAllMxEvents(calendar: CalendarRef): Promise<Map<string, GoogleCalendarLikeEvent[]>> {
  const eventsBySource = new Map<string, GoogleCalendarLikeEvent[]>()
  const params = new URLSearchParams({
    timeMin: TIME_MIN,
    timeMax: TIME_MAX,
    maxResults: '2500',
    singleEvents: 'true',
  })
  const calendarId = calendar.kind === 'central' ? CENTRAL_CALENDAR_ID : 'primary'

  let pageToken: string | null = null
  do {
    const pageParams = new URLSearchParams(params)
    if (pageToken) pageParams.set('pageToken', pageToken)
    const response = await googleApi(calendar.accessToken, `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${pageParams.toString()}`)
    if (!response.ok) break
    const data = await response.json().catch(() => ({}))
    for (const event of Array.isArray(data.items) ? data.items as GoogleCalendarLikeEvent[] : []) {
      const sourceKey = getGoogleCalendarSourceKey(event)
      if (!sourceKey) continue
      eventsBySource.set(sourceKey, [...(eventsBySource.get(sourceKey) || []), event])
    }
    pageToken = typeof data.nextPageToken === 'string' ? data.nextPageToken : null
  } while (pageToken)

  return eventsBySource
}

async function deleteEvent(calendar: CalendarRef, googleEventId: string): Promise<boolean> {
  if (DRY_RUN) return true
  const calendarId = calendar.kind === 'central' ? CENTRAL_CALENDAR_ID : 'primary'
  await googleApi(
    calendar.accessToken,
    `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
    { method: 'DELETE' },
  )
  return true
}

function sourceFromVisit(row: VisitRow): SourceRecord {
  return {
    kind: 'visit',
    id: row.id,
    title: row.client?.name || row.client_id || 'visita',
    startsAt: row.scheduled_at,
    status: row.status,
    centralEventId: row.google_event_id_central,
    personalEventId: row.google_event_id,
  }
}

function sourceFromScheduleEvent(row: ScheduleEventRow): SourceRecord {
  return {
    kind: 'schedule_event',
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    status: row.status,
    centralEventId: row.google_event_id,
    personalEventId: row.google_event_id_personal,
  }
}

function groupDuplicateVisits(visits: VisitRow[]) {
  const groups = new Map<string, VisitRow[]>()
  for (const visit of visits) {
    if (getEffectiveCalendarAction('upsert', 'visit', visit.status) === 'delete') continue
    const key = [visit.client_id, visit.scheduled_at, visit.consultant_id || '', visit.auxiliary_consultant_id || ''].join('|')
    groups.set(key, [...(groups.get(key) || []), visit])
  }
  return Array.from(groups.values()).filter((items) => items.length > 1)
}

async function loadCalendarRefs(tokens: TokenRow[], usersById: Map<string, UserRow>): Promise<CalendarRef[]> {
  const calendars: CalendarRef[] = []

  for (const token of tokens.filter((item) => item.provider === 'google' && item.user_id)) {
    try {
      calendars.push({
        kind: 'personal',
        userId: token.user_id,
        accessToken: await getAccessToken(token),
      })
    } catch (error) {
      const user = token.user_id ? usersById.get(token.user_id) : null
      console.warn(`WARN personal calendar skipped: ${user?.name || 'usuario'} (${error instanceof Error ? error.message : 'token error'})`)
    }
  }

  const centralRefreshToken = process.env.GOOGLE_CENTRAL_REFRESH_TOKEN
  if (centralRefreshToken) {
    const refreshed = await refreshGoogleAccessToken(centralRefreshToken)
    calendars.push({ kind: 'central', accessToken: refreshed.access_token })
    return calendars
  }

  const centralToken = tokens.find((item) => item.provider === 'google_central')
  if (centralToken) {
    try {
      calendars.push({ kind: 'central', accessToken: await getAccessToken(centralToken) })
    } catch (error) {
      console.warn(`WARN central calendar skipped: ${error instanceof Error ? error.message : 'token error'}`)
    }
  }

  return calendars
}

async function reconcileSource(source: SourceRecord, scans: CalendarScan[], mirrors: MirrorRow[]) {
  const action = getEffectiveCalendarAction('upsert', source.kind, source.status)
  let canceledDeleted = 0
  let duplicateDeleted = 0
  const warnings: string[] = []

  for (const scan of scans) {
    const calendar = scan.calendar
    const sourceEvents = scan.eventsBySource.get(`${source.kind}:${source.id}`) || []
    const preferredIds = new Set([
      calendar.kind === 'central' ? source.centralEventId : source.personalEventId,
      ...mirrors
        .filter((mirror) => mirror.source_kind === source.kind && mirror.source_id === source.id && mirror.user_id === calendar.userId)
        .map((mirror) => mirror.google_event_id),
    ].filter((id): id is string => Boolean(id)))

    if (action === 'delete') {
      for (const event of sourceEvents) {
        if (!event.id) continue
        await deleteEvent(calendar, event.id)
        canceledDeleted += 1
      }
      const directIds = [
        calendar.kind === 'central' ? source.centralEventId : source.personalEventId,
        ...mirrors
          .filter((mirror) => mirror.source_kind === source.kind && mirror.source_id === source.id && mirror.user_id === calendar.userId)
          .map((mirror) => mirror.google_event_id),
      ].filter((id): id is string => Boolean(id))
      for (const directId of new Set(directIds)) {
        if (sourceEvents.some((event) => event.id === directId)) continue
        await deleteEvent(calendar, directId)
        canceledDeleted += 1
      }
      continue
    }

    const duplicateIds = getDuplicateGoogleEventIds(sourceEvents, preferredIds)
    for (const duplicateId of duplicateIds) {
      await deleteEvent(calendar, duplicateId)
      duplicateDeleted += 1
    }
  }

  if (!DRY_RUN && action === 'delete') {
    if (source.kind === 'visit') {
      const { error } = await supabase
        .from('visitas_consultoria')
        .update({ google_event_id: null, google_event_id_central: null, google_meet_link: null })
        .eq('id', source.id)
      if (error) warnings.push(error.message)
    } else {
      const { error } = await supabase
        .from('eventos_agenda_consultoria')
        .update({ google_event_id: null, google_event_id_personal: null, google_meet_link: null })
        .eq('id', source.id)
      if (error) warnings.push(error.message)
    }
    const { error: mirrorDeleteError } = await supabase
      .from('espelhos_agenda_google_usuario')
      .delete()
      .eq('source_kind', source.kind)
      .eq('source_id', source.id)
    if (mirrorDeleteError) warnings.push(mirrorDeleteError.message)
  }

  return { canceledDeleted, duplicateDeleted, warnings }
}

async function main() {
  const [tokensRes, usersRes, visitsRes, eventsRes, mirrorsRes] = await Promise.all([
    supabase.from('tokens_oauth_consultoria').select('id,user_id,provider,access_token,refresh_token,expires_at,google_email').in('provider', ['google', 'google_central']),
    supabase.from('usuarios').select('id,name,email,role'),
    supabase.from('visitas_consultoria').select('id,client_id,scheduled_at,status,consultant_id,auxiliary_consultant_id,google_event_id,google_event_id_central,client:clientes_consultoria!client_id(name)').limit(5000),
    supabase.from('eventos_agenda_consultoria').select('id,title,starts_at,status,responsible_user_id,google_event_id,google_event_id_personal').limit(5000),
    supabase.from('espelhos_agenda_google_usuario').select('user_id,source_kind,source_id,google_event_id').limit(10000),
  ])

  for (const [label, response] of Object.entries({ tokensRes, usersRes, visitsRes, eventsRes, mirrorsRes })) {
    if (response.error) throw new Error(`${label}: ${response.error.message}`)
  }

  const usersById = new Map(((usersRes.data || []) as UserRow[]).map((user) => [user.id, user]))
  const calendars = await loadCalendarRefs((tokensRes.data || []) as TokenRow[], usersById)
  const scans: CalendarScan[] = []
  for (const calendar of calendars) {
    scans.push({ calendar, eventsBySource: await listAllMxEvents(calendar) })
  }
  const visits = (visitsRes.data || []) as VisitRow[]
  const events = (eventsRes.data || []) as ScheduleEventRow[]
  const mirrors = (mirrorsRes.data || []) as MirrorRow[]
  const sources = [...visits.map(sourceFromVisit), ...events.map(sourceFromScheduleEvent)]

  let canceledDeleted = 0
  let duplicateDeleted = 0
  const warnings: string[] = []

  for (const source of sources) {
    const result = await reconcileSource(source, scans, mirrors)
    canceledDeleted += result.canceledDeleted
    duplicateDeleted += result.duplicateDeleted
    warnings.push(...result.warnings.map((warning) => `${source.kind}:${source.id} ${warning}`))
  }

  const ambiguousVisitGroups = groupDuplicateVisits(visits)
  const summary = {
    mode: DRY_RUN ? 'dry-run' : 'execute',
    calendarsScanned: calendars.length,
    sourcesScanned: sources.length,
    canceledGoogleEventsMatched: canceledDeleted,
    duplicateGoogleEventsMatched: duplicateDeleted,
    ambiguousSystemDuplicateGroups: ambiguousVisitGroups.length,
    warnings: warnings.length,
  }

  console.log(JSON.stringify(summary, null, 2))
  if (ambiguousVisitGroups.length > 0) {
    console.log('Ambiguous system duplicates retained for manual review:')
    for (const group of ambiguousVisitGroups.slice(0, 20)) {
      console.log(`- ${group[0]?.client?.name || group[0]?.client_id || 'cliente'} at ${group[0]?.scheduled_at}: ${group.length} rows`)
    }
  }
  if (warnings.length > 0) {
    console.log('Warnings:')
    for (const warning of warnings.slice(0, 20)) console.log(`- ${warning}`)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
