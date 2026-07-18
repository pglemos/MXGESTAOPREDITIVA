import * as React from 'react'

export type ManagementVisualMode = 'default' | 'manager'

const ManagementVisualContext = React.createContext<ManagementVisualMode>('default')

export function ManagementVisualProvider({
  mode,
  children,
}: {
  mode: ManagementVisualMode
  children: React.ReactNode
}) {
  return (
    <ManagementVisualContext.Provider value={mode}>
      {children}
    </ManagementVisualContext.Provider>
  )
}

export function useManagementVisualMode() {
  return React.useContext(ManagementVisualContext)
}

export function useIsManagementVisual() {
  return useManagementVisualMode() === 'manager'
}
