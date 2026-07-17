import { describe, expect, test } from 'bun:test'
import {
  buildOfficialScoreFromSnapshot,
  buildSnapshotTrend,
  latestSnapshotsBySellerAndDate,
  type SellerRoutineSnapshotRow,
} from './seller-routine-snapshot-adapter'

const base: SellerRoutineSnapshotRow = {
  seller_user_id: 'seller-1',
  reference_date: '2026-07-17',
  version: 1,
  eligible: true,
  reliable_work_base: true,
  access_numerator: 1,
  pending_resolved: 1,
  pending_expected: 2,
  attack_executed: 3,
  attack_expected: 4,
  prospecting_executed: 2,
  prospecting_expected: 2,
  updates_completed: 1,
  updates_expected: 2,
  access_points: 10,
  pending_points: 5,
  attack_points: 15,
  prospecting_points: 20,
  update_points: 10,
  closing_points: 20,
  execution_score: 80,
  routine_status: 'em_dia',
  score_denominator: 100,
  source_payload: {},
}

describe('SellerRoutineSnapshot adapter', () => {
  test('converts persisted points to component percentages without recalculating the total', () => {
    const score = buildOfficialScoreFromSnapshot(base)
    expect(score.score).toBe(80)
    expect(score.denominator).toBe(100)
    expect(score.components.map(component => component.value)).toEqual([100, 50, 75, 100, 50, 100])
  })

  test('keeps a non-applicable day outside the denominator', () => {
    const score = buildOfficialScoreFromSnapshot({
      ...base,
      eligible: false,
      access_points: null,
      pending_points: null,
      attack_points: null,
      prospecting_points: null,
      update_points: null,
      closing_points: null,
      execution_score: null,
      routine_status: 'nao_aplicavel',
      score_denominator: 0,
    })
    expect(score.score).toBeNull()
    expect(score.denominator).toBe(0)
    expect(score.components.every(component => !component.applicable)).toBe(true)
  })

  test('chooses the latest immutable version per seller and date', () => {
    const latest = latestSnapshotsBySellerAndDate([
      base,
      { ...base, version: 2, execution_score: 90 },
      { ...base, seller_user_id: 'seller-2', version: 1 },
    ])
    expect(latest.get('2026-07-17:seller-1')?.version).toBe(2)
    expect(latest.get('2026-07-17:seller-2')?.version).toBe(1)
  })

  test('builds history using only eligible official snapshots', () => {
    const trend = buildSnapshotTrend([
      base,
      { ...base, seller_user_id: 'seller-2', execution_score: 60 },
      { ...base, reference_date: '2026-07-16', eligible: false, execution_score: null },
    ], '2026-07-16', '2026-07-17')
    expect(trend).toEqual([
      { date: '2026-07-16', label: '16/07', value: null },
      { date: '2026-07-17', label: '17/07', value: 70 },
    ])
  })
})
