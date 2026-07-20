import { createContext, useContext, ReactNode } from 'react'
import type { Store } from '@/types/database'
import type { OwnerPerformanceAlert } from '@/features/dashboard-loja/sections/PerformanceAlerts'
import type { ActionRow, DashboardData, DepartmentScore } from '@/features/dashboard-loja/sections/owner-cockpit/types'

export interface OwnerContextValue {
  profile: any
  signOut: () => Promise<void>
  storeSlug: string
  selectedStoreId: string | null
  selectedStore: Store | null
  selectableStores: Store[]
  changeStore: (storeId: string) => void
  data: DashboardData
  centralMx: any
  ownerAlerts: OwnerPerformanceAlert[]
  actions: ActionRow[]
  departments: DepartmentScore[]
  panoramaData: Array<{ label: string; planejado: number; realizado: number }>
  periodLabel: string
  marginPercent: number | null
  mxScore: number | null
  selectedDepartmentCode: string | null
  consultantModalOpen: boolean
  openConsultantModal: () => void
  closeConsultantModal: () => void
}

const OwnerContext = createContext<OwnerContextValue | null>(null)

export interface OwnerProviderProps {
  value: OwnerContextValue
  children: ReactNode
}

export function OwnerProvider({ value, children }: OwnerProviderProps) {
  return <OwnerContext.Provider value={value}>{children}</OwnerContext.Provider>
}

export function useOwnerContext() {
  const context = useContext(OwnerContext)
  if (!context) {
    throw new Error('useOwnerContext must be used inside OwnerProvider')
  }
  return context
}

export default OwnerContext
