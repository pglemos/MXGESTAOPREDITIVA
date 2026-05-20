import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TABS } from '../data/tabs'
import type { Tab } from '../data/types'

export function useActiveTab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  useEffect(() => {
    const tab = searchParams.get('tab') as Tab | null
    if (tab && TABS.some((t) => t.key === tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setSearchParams({ tab }, { replace: true })
  }

  return { activeTab, handleTabChange }
}
