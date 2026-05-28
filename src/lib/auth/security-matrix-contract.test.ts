import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { MX_ROLE_CODES } from './roles'

const matrix = readFileSync(
  new URL('../../../docs/architecture/security-matrix.md', import.meta.url),
  'utf8',
)

const rlsStory = readFileSync(
  new URL('../../../docs/stories/story-MX-02-20260527-rls-policies.md', import.meta.url),
  'utf8',
)

describe('security matrix contract', () => {
  test('documents every canonical role and the MX meta-role', () => {
    for (const roleCode of MX_ROLE_CODES) {
      expect(matrix).toContain(`\`${roleCode}\``)
    }
  })

  test('covers MX-02.2 critical entities and score draft status', () => {
    for (const entity of [
      'roles',
      'usuarios',
      'lojas',
      'score_inputs',
      'score_calculations',
      'score_history',
      'score_observations',
      'alerts',
      'alert_channels',
      'planos_acao',
      'historico_planos_acao',
      'benchmark_snapshots',
      'eventos_agenda_executiva',
      'departamentos_mx',
    ]) {
      expect(matrix).toContain(`\`${entity}\``)
    }

    expect(matrix).toContain('20260527130000_score_rls_final.sql')
    expect(matrix).toContain('DRAFT/NOT APPLIED')
    expect(matrix).toContain('score_inputs.scope_id')
  })

  test('keeps the story linked to the security matrix deliverable', () => {
    expect(rlsStory).toContain('docs/architecture/security-matrix.md')
    expect(rlsStory).toContain('20260527120000_role_rls_helpers.sql')
  })
})
