import { describe, expect, test } from 'bun:test'
import {
  filterPersonalMirrorCandidates,
  getDuplicateGoogleEventIds,
  getEffectiveCalendarAction,
  getStaleMirrorRows,
  isCanceledCalendarStatus,
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

  test('excludes Admin Master users from personal mirrors', () => {
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
    ])

    expect(candidates.map((candidate) => candidate.userId)).toEqual(['consultant'])
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
})
