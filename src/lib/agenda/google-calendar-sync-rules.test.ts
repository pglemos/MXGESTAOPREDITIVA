import { describe, expect, test } from 'bun:test'
import {
  filterCentralAttendeesForPersonalMirrors,
  filterPersonalMirrorCandidates,
  getDuplicateGoogleEventIds,
  getEffectiveCalendarAction,
  getStaleMirrorRows,
  isCanceledCalendarStatus,
  mergeGoogleCalendarEventsBySource,
} from '../../../supabase/functions/_shared/google_calendar_sync_rules'

describe('google calendar sync rules', () => {
  test('treats canceled visit and schedule event statuses as delete actions', () => {
    expect(isCanceledCalendarStatus('visit', 'cancelada')).toBe(true)
    expect(isCanceledCalendarStatus('schedule_event', 'cancelado')).toBe(true)
    expect(getEffectiveCalendarAction('upsert', 'visit', 'cancelada')).toBe('delete')
    expect(getEffectiveCalendarAction('upsert', 'schedule_event', 'cancelado')).toBe('delete')
    expect(getEffectiveCalendarAction('upsert', 'visit', 'agendada')).toBe('upsert')
    expect(getEffectiveCalendarAction('delete', 'visit', 'agendada')).toBe('delete')
  })

  test('keeps explicitly related MX administrators in personal mirrors', () => {
    const candidates = filterPersonalMirrorCandidates([
      {
        userId: 'admin-master',
        name: 'Jose',
        role: 'administrador_geral',
        profileEmail: 'joseroberto20161@gmail.com',
        googleEmail: 'joseroberto20161@gmail.com',
      },
      {
        userId: 'consultant',
        name: 'Consultor',
        role: 'consultor_mx',
        profileEmail: 'consultor@mx.com',
        googleEmail: 'consultor@gmail.com',
      },
      {
        userId: 'admin-master-by-google',
        name: 'Admin',
        role: 'administrador_geral',
        profileEmail: 'admin@sistema.local',
        googleEmail: 'gestao@mxconsultoria.com.br',
      },
      {
        userId: 'admin-mx',
        name: 'Admin MX',
        role: 'administrador_mx',
        profileEmail: 'admin.mx@sistema.local',
        googleEmail: 'admin.mx@gmail.com',
      },
      {
        userId: 'admin-general-not-allowlisted',
        name: 'Daniel',
        role: 'administrador_geral',
        profileEmail: 'danieljsvendas@gmail.com',
        googleEmail: 'danieljsvendas@gmail.com',
      },
    ])

    expect(candidates.map((candidate) => candidate.userId)).toEqual([
      'admin-master',
      'consultant',
      'admin-master-by-google',
      'admin-mx',
      'admin-general-not-allowlisted',
    ])
  })

  test('removes central attendees that already receive personal mirrors', () => {
    const attendees = filterCentralAttendeesForPersonalMirrors([
      { email: 'consultor@gmail.com', displayName: 'Consultor' },
      { email: 'auxiliar@mx.com', displayName: 'Auxiliar' },
      { email: 'cliente@loja.com', displayName: 'Cliente' },
    ], [
      {
        userId: 'consultant',
        name: 'Consultor',
        profileEmail: 'consultor@mx.com',
        googleEmail: 'consultor@gmail.com',
      },
      {
        userId: 'auxiliary',
        name: 'Auxiliar',
        profileEmail: 'auxiliar@mx.com',
        googleEmail: 'auxiliar@gmail.com',
      },
    ])

    expect(attendees).toEqual([{ email: 'cliente@loja.com', displayName: 'Cliente' }])
  })

  test('detects stale personal mirror rows after owner changes', () => {
    expect(getStaleMirrorRows([
      { user_id: 'daniel', google_event_id: 'old' },
      { user_id: 'jose', google_event_id: 'current' },
    ], ['jose'])).toEqual([{ user_id: 'daniel', google_event_id: 'old' }])
  })

  test('keeps canonical Google event id and returns duplicate ids', () => {
    const duplicateIds = getDuplicateGoogleEventIds([
      { id: 'created-first', extendedProperties: { private: { mx_source_kind: 'visit', mx_source_id: 'visit-1' } } },
      { id: 'saved-in-db', extendedProperties: { private: { mx_source_kind: 'visit', mx_source_id: 'visit-1' } } },
      { id: 'created-last', extendedProperties: { private: { mx_source_kind: 'visit', mx_source_id: 'visit-1' } } },
    ], new Set(['saved-in-db']))

    expect(duplicateIds).toEqual(['created-first', 'created-last'])
  })

  test('dedupes merged personal and central calendar events by MX source', () => {
    const merged = mergeGoogleCalendarEventsBySource([
      { id: 'personal-visit', extendedProperties: { private: { mx_source_kind: 'visit', mx_source_id: 'visit-1' } } },
      { id: 'personal-free-time' },
    ], [
      { id: 'central-visit', extendedProperties: { private: { mx_source_kind: 'visit', mx_source_id: 'visit-1' } } },
      { id: 'central-other', extendedProperties: { private: { mx_source_kind: 'visit', mx_source_id: 'visit-2' } } },
    ])

    expect(merged.map((event) => `${event._source}:${event.id}`)).toEqual([
      'personal:personal-visit',
      'personal:personal-free-time',
      'central:central-other',
    ])
  })
})
