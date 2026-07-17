import { useMemo } from 'react'
import { useExecutionActions } from '@/features/crm/hooks/useExecutionActions'
import { mapExecutionActionRows } from '@/features/central-execucao/lib/activity-mappers'
import { sortCentralActions } from '@/features/central-execucao/lib/activity-priority'

export function useCentralExecutionActions() {
  const { acoes, loading, error, refetch } = useExecutionActions()

  const actions = useMemo(() => {
    return mapExecutionActionRows(sortCentralActions(acoes))
  }, [acoes])

  const pendingPrevious = useMemo(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    return actions.filter(action => {
      const dueTimestamp = new Date(action.dueAt).getTime()
      return Number.isFinite(dueTimestamp) && dueTimestamp < startOfToday.getTime()
    })
  }, [actions])

  return {
    actions,
    pendingPrevious,
    loading,
    error,
    refetch,
  }
}
