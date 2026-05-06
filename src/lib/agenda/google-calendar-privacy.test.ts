import { describe, expect, test } from 'bun:test'
import {
  centralEventMatchesUser,
  collectUserCalendarEmails,
  isAdminMasterMx,
} from '../../../supabase/functions/_shared/google_calendar_privacy'

describe('google calendar privacy helpers', () => {
  test('allows only Daniel/admin master to read every central calendar event', () => {
    expect(isAdminMasterMx({ role: 'administrador_geral', email: 'danieljsvendas@gmail.com', name: 'Daniel' })).toBe(true)
    expect(isAdminMasterMx({ role: 'administrador_geral', email: 'outro@mx.com', name: 'Outro Admin' })).toBe(false)
    expect(isAdminMasterMx({ role: 'consultor_mx', email: 'danieljsvendas@gmail.com', name: 'Daniel' })).toBe(false)
  })

  test('matches central events by Google attendee email', () => {
    const userEmails = collectUserCalendarEmails(
      { role: 'consultor_mx', email: 'jose@mx.com', name: 'Jose Roberto' },
      'joseroberto20161@gmail.com',
    )

    expect(centralEventMatchesUser({
      id: 'central-1',
      attendees: [{ email: 'joseroberto20161@gmail.com' }],
    }, {
      userId: 'user-jose',
      userEmails,
      allowedGoogleEventIds: new Set(),
    })).toBe(true)

    expect(centralEventMatchesUser({
      id: 'central-2',
      attendees: [{ email: 'outro@gmail.com' }],
    }, {
      userId: 'user-jose',
      userEmails,
      allowedGoogleEventIds: new Set(),
    })).toBe(false)
  })

  test('matches central events by CRM google event id and related user metadata', () => {
    expect(centralEventMatchesUser({
      id: 'google-central-id',
      attendees: [{ email: 'outro@gmail.com' }],
    }, {
      userId: 'user-jose',
      userEmails: new Set(),
      allowedGoogleEventIds: new Set(['google-central-id']),
    })).toBe(true)

    expect(centralEventMatchesUser({
      id: 'google-central-with-props',
      extendedProperties: {
        private: { mx_related_user_ids: 'user-maria,user-jose' },
      },
    }, {
      userId: 'user-jose',
      userEmails: new Set(),
      allowedGoogleEventIds: new Set(),
    })).toBe(true)
  })
})
