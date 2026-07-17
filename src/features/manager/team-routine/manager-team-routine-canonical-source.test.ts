import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const routeSource = readFileSync(
  new URL('./ManagerTeamRoutine.container.tsx', import.meta.url),
  'utf8',
)
const canonicalSource = readFileSync(
  new URL('./ManagerTeamRoutineCanonical.container.tsx', import.meta.url),
  'utf8',
)

describe('Rotina da Equipe canonical source', () => {
  test('routes the active page through the canonical snapshot container', () => {
    expect(routeSource).toContain("export { default } from './ManagerTeamRoutineCanonical.container'")
  })

  test('consolidates and reads official immutable SellerRoutineSnapshots', () => {
    expect(canonicalSource).toContain("supabase.rpc('consolidate_seller_routine_snapshots'")
    expect(canonicalSource).toContain(".from('seller_routine_snapshots')")
    expect(canonicalSource).toContain('latestSnapshotsBySellerAndDate')
    expect(canonicalSource).toContain('buildOfficialScoreFromSnapshot')
  })

  test('does not calculate a competing official score from operational actions', () => {
    expect(canonicalSource).not.toContain('calculateOfficialRoutineScore(')
    expect(canonicalSource).not.toContain('buildOfficialRoutineInput(')
    expect(canonicalSource).toContain('const execution = officialScore?.score ?? null')
  })

  test('keeps non-applicable days as gaps in the official history', () => {
    expect(canonicalSource).toContain('buildSnapshotTrend(historySnapshots')
    expect(canonicalSource).toContain('dias não aplicáveis ficam sem ponto')
  })
})
