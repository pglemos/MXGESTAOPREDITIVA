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
  await Promise.all([
    refetchDailyCheckins(),
    refetchMonthlyCheckins(),
    refetchSellers(),
    refetchStoreGoal(),
    refetchOperationalSettings(),
  ])
}
