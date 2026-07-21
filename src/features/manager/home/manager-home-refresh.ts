type ManagerHomeRefreshOperation = () => Promise<unknown>

type ManagerHomeRefreshSources = {
  refetchDailyCheckins: ManagerHomeRefreshOperation
  refetchMonthlyCheckins: ManagerHomeRefreshOperation
  refetchSellers: ManagerHomeRefreshOperation
  refetchStoreGoal: ManagerHomeRefreshOperation
  refetchOperationalSettings: ManagerHomeRefreshOperation
}

export async function refreshManagerHomeData({
  refetchDailyCheckins,
  refetchMonthlyCheckins,
  refetchSellers,
  refetchStoreGoal,
  refetchOperationalSettings,
}: ManagerHomeRefreshSources) {
  const results = await Promise.allSettled([
    refetchDailyCheckins(),
    refetchMonthlyCheckins(),
    refetchSellers(),
    refetchStoreGoal(),
    refetchOperationalSettings(),
  ])

  const failures = results.filter(r => r.status === 'rejected')
  if (failures.length > 0) {
    console.warn('[ManagerHome] Partial refresh failure:', failures.map(r => r.status === 'rejected' ? r.reason : null))
  }
}
