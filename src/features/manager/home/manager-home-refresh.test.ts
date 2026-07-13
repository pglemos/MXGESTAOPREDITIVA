import { describe, expect, test } from 'bun:test'

describe('manager home refresh', () => {
  test('recarrega todas as fontes que alimentam o Início gerencial', async () => {
    const module = await import('./manager-home-refresh').catch(() => ({})) as Record<string, unknown>
    const refreshManagerHomeData = module.refreshManagerHomeData

    expect(typeof refreshManagerHomeData).toBe('function')
    if (typeof refreshManagerHomeData !== 'function') return

    const refreshed: string[] = []
    const refresh = (source: string) => async () => {
      refreshed.push(source)
    }

    await refreshManagerHomeData({
      refetchDailyCheckins: refresh('daily-checkins'),
      refetchMonthlyCheckins: refresh('monthly-checkins'),
      refetchSellers: refresh('sellers'),
      refetchStoreGoal: refresh('store-goal'),
      refetchOperationalSettings: refresh('operational-settings'),
    })

    expect(refreshed.sort()).toEqual([
      'daily-checkins',
      'monthly-checkins',
      'operational-settings',
      'sellers',
      'store-goal',
    ])
  })
})
