import { useState } from 'react'
import { PageHeader } from '@/components/molecules/PageHeader'
import { TabNav, type TabNavItem } from '@/components/molecules/TabNav'
import { TesteComportamental } from './components/TesteComportamental'
import { BancoTalentos } from './components/BancoTalentos'

type TabKey = 'teste' | 'banco'

const TABS: TabNavItem<TabKey>[] = [
  { key: 'teste', label: 'Teste comportamental' },
  { key: 'banco', label: 'Banco de talentos' },
]

export default function ComportamentalPage() {
  const [tab, setTab] = useState<TabKey>('teste')

  return (
<div className="w-full space-y-mx-lg">
      <PageHeader
        title="Teste Comportamental & Banco de Talentos"
        description="Aplique o teste no onboarding e construa o banco de perfis vencedores."
      />
      <TabNav tabs={TABS} activeTab={tab} onTabChange={setTab} />
      <section id={`${tab}-panel`} role="tabpanel" aria-labelledby={`${tab}-tab`}>
        {tab === 'teste' ? <TesteComportamental /> : <BancoTalentos />}
      </section>
    </div>
  )
}
