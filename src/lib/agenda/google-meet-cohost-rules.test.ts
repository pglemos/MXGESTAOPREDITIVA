import { describe, expect, test } from 'bun:test'
import {
  DEFAULT_GOOGLE_MEET_COHOST_EMAILS,
  getGoogleMeetCohostActions,
  getGoogleMeetCohostEmails,
  getGoogleMeetSpaceName,
} from '../../../supabase/functions/_shared/google_meet_cohost_rules'

describe('google meet cohost rules', () => {
  test('uses the four Admin MX emails by default', () => {
    expect(getGoogleMeetCohostEmails()).toEqual(DEFAULT_GOOGLE_MEET_COHOST_EMAILS)
  })

  test('normalizes configured cohost emails without duplicates', () => {
    expect(getGoogleMeetCohostEmails(' Jose@example.com,JOSE@example.com, joao@example.com ')).toEqual([
      'jose@example.com',
      'joao@example.com',
    ])
  })

  test('extracts a Meet space name from a Google Meet URL', () => {
    expect(getGoogleMeetSpaceName('https://meet.google.com/abc-defg-hij')).toBe('spaces/abc-defg-hij')
    expect(getGoogleMeetSpaceName('https://meet.google.com/abc-defg-hij?authuser=0')).toBe('spaces/abc-defg-hij')
  })

  test('rejects non-Meet URLs and invalid meeting codes', () => {
    expect(getGoogleMeetSpaceName('https://example.com/abc-defg-hij')).toBeNull()
    expect(getGoogleMeetSpaceName('https://meet.google.com/not-a-code')).toBeNull()
    expect(getGoogleMeetSpaceName(null)).toBeNull()
  })

  test('creates only missing cohosts and replaces members with another role', () => {
    expect(getGoogleMeetCohostActions([
      { name: 'spaces/space/members/daniel', email: 'daniel@example.com', role: 'COHOST' },
      { name: 'spaces/space/members/jose', email: 'jose@example.com', role: 'ROLE_UNSPECIFIED' },
    ], ['daniel@example.com', 'jose@example.com', 'joao@example.com'])).toEqual({
      createEmails: ['joao@example.com'],
      replaceMembers: [{ name: 'spaces/space/members/jose', email: 'jose@example.com' }],
      configuredEmails: ['daniel@example.com'],
    })
  })
})
