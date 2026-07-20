import { createContext, useContext } from 'react'

const OwnerContext = createContext(null)

export function OwnerProvider({ value, children }) {
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
