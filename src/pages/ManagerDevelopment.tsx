import { useSearchParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import ManagerFeedbackReference from '@/features/manager/development/ManagerFeedbackReference'
import ManagerPDIReference from '@/features/manager/development/ManagerPDIReference'
import { ManagerHomeReturnLink } from '@/features/manager/home/ManagerHomeReturnLink'

type DevelopmentTab = 'feedbacks' | 'pdis'

export default function ManagerDevelopment() {
  const [params, setParams] = useSearchParams()
  const requestedTab = params.get('tab')
  const tab: DevelopmentTab = requestedTab === 'pdi' || requestedTab === 'pdis' ? 'pdis' : 'feedbacks'

  const selectTab = (next: DevelopmentTab) => {
    const updated = new URLSearchParams(params)
    updated.set('tab', next)
    setParams(updated, { replace: true })
  }

  return (
    <main className="min-h-full bg-gray-50" id="main-content">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 pb-24">
        <ManagerHomeReturnLink />
        <header className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Sparkles size={20}/></span><div><h1 className="text-xl font-bold text-gray-800">Desenvolvimento</h1><p className="mt-0.5 text-sm text-gray-500">Central de gestão de pessoas: reconheça, oriente e desenvolva sua equipe.</p></div></div></header>
        <nav className="flex overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm" aria-label="Desenvolvimento" role="tablist">
          {([{ key: 'feedbacks', label: 'Feedback' }, { key: 'pdis', label: 'PDI' }] as const).map(({ key, label }) => <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => selectTab(key)} className={`shrink-0 px-6 py-3.5 text-sm font-medium transition-colors ${tab === key ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>{label}</button>)}
        </nav>
        {tab === 'pdis' ? <ManagerPDIReference /> : <ManagerFeedbackReference />}
      </div>
    </main>
  )
}
