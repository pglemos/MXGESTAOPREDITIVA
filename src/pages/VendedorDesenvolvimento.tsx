import type { ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import VendedorFeedback from '@/pages/VendedorFeedback'
import VendedorPDI from '@/pages/VendedorPDI'

type DesenvolvimentoTab = 'feedback' | 'pdi'

const TABS: Array<{ key: DesenvolvimentoTab; label: string }> = [
  { key: 'feedback', label: 'Feedback' },
  { key: 'pdi', label: 'PDI' },
]

function getTab(value: string | null): DesenvolvimentoTab {
  return value === 'pdi' ? 'pdi' : 'feedback'
}

type VendedorDesenvolvimentoProps = {
  FeedbackPage?: ComponentType
  PDIPage?: ComponentType
}

export function VendedorDesenvolvimentoShell({
  FeedbackPage = VendedorFeedback,
  PDIPage = VendedorPDI,
}: VendedorDesenvolvimentoProps = {}) {
  const [params, setParams] = useSearchParams()
  const tab = getTab(params.get('tab'))

  function setTab(nextTab: DesenvolvimentoTab) {
    const next = new URLSearchParams(params)
    if (nextTab === 'feedback') next.delete('tab')
    else next.set('tab', nextTab)
    setParams(next, { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex h-16 items-center gap-3">
          <BookOpen className="h-5 w-5 text-sky-600" />
          <h1 className="text-[18px] font-black uppercase tracking-tight text-slate-900 sm:text-[22px]">
            Desenvolvimento
          </h1>
        </div>
        <div className="flex gap-1 -mb-px" role="tablist" aria-label="Desenvolvimento">
          {TABS.map(item => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
              className={cn(
                'border-b-2 px-5 py-2.5 text-sm font-semibold transition-colors',
                tab === item.key
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {tab === 'feedback' ? <FeedbackPage /> : <PDIPage />}
      </div>
    </div>
  )
}

export default function VendedorDesenvolvimento() {
  return <VendedorDesenvolvimentoShell />
}
