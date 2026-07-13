import type { ManagerRoutineCategory, ManagerRoutineOrigin } from './manager-day-routine'

export type ManagerRoutineNavigationFilter = 'todas' | ManagerRoutineCategory
export type ManagerRoutineNavigationSort = 'prioridade' | 'horario' | 'origem'

export function buildManagerRoutineNavigationContext(input: {
  taskId: string
  date: string
  module: ManagerRoutineOrigin
  filter: ManagerRoutineNavigationFilter
  sort: ManagerRoutineNavigationSort
}) {
  return {
    origemNavegacao: 'ROTINA_DO_DIA_GERENTE' as const,
    tarefaId: input.taskId,
    data: input.date,
    modulo: input.module,
    filtros: {
      filtro: input.filter,
      ordenacao: input.sort,
    },
  }
}

export function parseManagerRoutineNavigationContext(
  raw: string | null | undefined,
): { filter: ManagerRoutineNavigationFilter; sort: ManagerRoutineNavigationSort } | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Record<string, unknown>
    if (value.origemNavegacao !== 'ROTINA_DO_DIA_GERENTE') return null
    const filters = value.filtros
    if (!filters || typeof filters !== 'object' || Array.isArray(filters)) return null
    const filter = (filters as Record<string, unknown>).filtro
    const sort = (filters as Record<string, unknown>).ordenacao
    if (!isFilter(filter) || !isSort(sort)) return null
    return { filter, sort }
  } catch {
    return null
  }
}

function isFilter(value: unknown): value is ManagerRoutineNavigationFilter {
  return value === 'todas'
    || value === 'resultado'
    || value === 'equipe'
    || value === 'desenvolvimento'
    || value === 'operacao'
}

function isSort(value: unknown): value is ManagerRoutineNavigationSort {
  return value === 'prioridade' || value === 'horario' || value === 'origem'
}
