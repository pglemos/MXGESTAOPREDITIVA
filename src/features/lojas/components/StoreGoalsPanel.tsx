import { useEffect, useState } from 'react'
import { Calendar, RefreshCw, Save, Target, Trash2, TrendingUp, Users, Zap } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { isAdministradorMx, useAuth } from '@/hooks/useAuth'
import { useStoreGoal, useStoreMetaRules } from '@/hooks/useGoals'
import { cn } from '@/lib/utils'

type StoreBenchmarks = {
  lead_to_agend: number
  agend_to_visit: number
  visit_to_sale: number
}

interface StoreGoalsPanelProps {
  storeId: string | null
  storeName?: string
}

const DEFAULT_BENCHMARKS: StoreBenchmarks = {
  lead_to_agend: 20,
  agend_to_visit: 60,
  visit_to_sale: 33,
}

export function StoreGoalsPanel({ storeId, storeName }: StoreGoalsPanelProps) {
  const { role } = useAuth()
  const { refetch: refetchGoal } = useStoreGoal(storeId)
  const { metaRules, loading, updateMetaRules, deleteMetaRules } = useStoreMetaRules(storeId || undefined)

  const [storeMeta, setStoreMeta] = useState(0)
  const [storeBench, setStoreBench] = useState<StoreBenchmarks>(DEFAULT_BENCHMARKS)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const canManageGoals = isAdministradorMx(role)
  const hasPersistedRules = Boolean(metaRules)

  useEffect(() => {
    setStoreMeta(metaRules?.monthly_goal || 0)
    setStoreBench({
      lead_to_agend: metaRules?.bench_lead_agd || DEFAULT_BENCHMARKS.lead_to_agend,
      agend_to_visit: metaRules?.bench_agd_visita || DEFAULT_BENCHMARKS.agend_to_visit,
      visit_to_sale: metaRules?.bench_visita_vnd || DEFAULT_BENCHMARKS.visit_to_sale,
    })
    setHasChanges(false)
  }, [metaRules, storeId])

  const handleSave = async () => {
    if (!storeId || !canManageGoals) return
    setSaving(true)
    try {
      const { error } = await updateMetaRules({
        monthly_goal: storeMeta,
        bench_lead_agd: storeBench.lead_to_agend,
        bench_agd_visita: storeBench.agend_to_visit,
        bench_visita_vnd: storeBench.visit_to_sale,
      })
      if (error) {
        toast.error(error)
        return
      }
      await refetchGoal()
      toast.success('Metas da loja salvas.')
      setHasChanges(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!storeId || !canManageGoals) return
    const confirmed = window.confirm('Excluir a configuração de metas desta loja? A loja voltará aos padrões até uma nova configuração ser salva.')
    if (!confirmed) return

    setDeleting(true)
    try {
      const { error } = await deleteMetaRules()
      if (error) {
        toast.error(error)
        return
      }
      await refetchGoal()
      toast.success('Configuração de metas excluída.')
      setStoreMeta(0)
      setStoreBench(DEFAULT_BENCHMARKS)
      setHasChanges(false)
    } finally {
      setDeleting(false)
    }
  }

  const updateBenchmark = (field: keyof StoreBenchmarks, value: string) => {
    if (!canManageGoals) return
    setStoreBench(prev => ({ ...prev, [field]: Number(value.replace(/\D/g, '')) || 0 }))
    setHasChanges(true)
  }

  if (!storeId) {
    return (
      <div className="min-h-mx-section-lg bg-white border-2 border-dashed border-border-default rounded-mx-3xl flex flex-col items-center justify-center text-center p-mx-14">
        <Target size={48} className="text-text-tertiary mb-6" />
        <Typography variant="h2" className="mb-3">Selecione uma loja</Typography>
        <Typography variant="p" tone="muted" className="max-w-sm uppercase tracking-tight">A aba de metas precisa de uma unidade ativa para carregar as regras oficiais.</Typography>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-mx-section-lg bg-white rounded-mx-3xl flex flex-col items-center justify-center">
        <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
        <Typography variant="caption" tone="muted" className="animate-pulse">Carregando metas da loja...</Typography>
      </div>
    )
  }

  return (
    <section className="space-y-mx-lg pb-32" aria-label="Metas da loja">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-mx-md bg-white border border-border-default rounded-mx-3xl p-mx-lg shadow-mx-sm">
        <div className="min-w-0">
          <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest opacity-60 text-mx-tiny">Aba de Metas</Typography>
          <Typography variant="h2" className="uppercase tracking-tight truncate">{storeName || 'Unidade MX'}</Typography>
          <Typography variant="caption" tone="muted">Meta mensal, objetivo nominal de sell-out e benchmarks oficiais da unidade.</Typography>
        </div>
        {canManageGoals ? (
          <div className="flex flex-wrap items-center gap-mx-sm">
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting || saving || !hasPersistedRules}
              className="h-mx-11 rounded-mx-xl"
            >
              {deleting ? <RefreshCw className="animate-spin mr-2" /> : <Trash2 size={16} className="mr-2" />}
              Excluir
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || deleting || !hasChanges}
              className="h-mx-11 rounded-mx-xl"
            >
              {saving ? <RefreshCw className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
              Salvar
            </Button>
          </div>
        ) : (
          <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest">Somente Admin Master e Admin MX editam</Typography>
        )}
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg">
        <section className="xl:col-span-7 bg-white border border-border-default rounded-mx-3xl p-mx-lg md:p-mx-10 shadow-mx-lg relative overflow-hidden">
          <div className="absolute top-mx-0 right-mx-0 w-mx-96 h-mx-96 bg-brand-primary/5 rounded-mx-full blur-3xl -mr-48 -mt-48" />
          <div className="relative z-10">
            <header className="flex items-center gap-mx-sm mb-10 border-b border-border-default pb-8">
              <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-xl">
                <Target size={32} className="text-brand-primary/80" />
              </div>
              <div>
                <Typography variant="h2">Meta Mensal de Vendas</Typography>
                <Typography variant="caption" tone="muted">Objetivo nominal de sell-out por unidade</Typography>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-mx-lg items-stretch">
              <div className="relative min-w-0">
                <input
                  type="text"
                  inputMode="numeric"
                  value={storeMeta}
                  onChange={(event) => {
                    if (!canManageGoals) return
                    setStoreMeta(Number(event.target.value.replace(/\D/g, '')) || 0)
                    setHasChanges(true)
                  }}
                  disabled={!canManageGoals}
                  aria-label="Meta mensal de vendas"
                  className="w-full text-6xl sm:text-7xl lg:text-8xl font-black tracking-normal text-text-primary bg-surface-alt border-4 border-transparent rounded-mx-2xl py-12 text-center focus:outline-none focus:bg-white focus:border-brand-primary transition-all font-mono-numbers shadow-inner disabled:opacity-60"
                />
                <span className="absolute bottom-mx-md left-1/2 -translate-x-1/2">
                  <Typography variant="caption" tone="muted" className="font-black uppercase tracking-mx-wider whitespace-nowrap">Unidades comerciais</Typography>
                </span>
              </div>
              <div className="bg-brand-primary p-mx-lg text-white rounded-mx-2xl shadow-mx-xl flex flex-col justify-center items-center text-center border-none min-h-48">
                <TrendingUp size={44} className="mb-6 opacity-30" />
                <Typography variant="p" tone="white" className="text-sm font-black italic uppercase leading-relaxed opacity-80">Metas agressivas, porém pautadas no histórico.</Typography>
              </div>
            </div>
          </div>
        </section>

        <aside className="xl:col-span-5 bg-white border border-border-default rounded-mx-3xl p-mx-lg md:p-mx-10 shadow-mx-lg">
          <header className="flex items-center gap-mx-sm mb-10 border-b border-border-default pb-8">
            <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shadow-inner">
              <Zap size={32} />
            </div>
            <div>
              <Typography variant="h2">Matriz de Benchmarks (20/60/33)</Typography>
              <Typography variant="caption" tone="muted">Taxas de conversão oficiais para auditoria forense</Typography>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-mx-md">
            {[
              { label: 'Lead -> Agd', field: 'lead_to_agend' as const, icon: Users, tone: 'brand' },
              { label: 'Agd -> Visita', field: 'agend_to_visit' as const, icon: Calendar, tone: 'warning' },
              { label: 'Visita -> Vnd', field: 'visit_to_sale' as const, icon: TrendingUp, tone: 'success' },
            ].map((benchmark) => (
              <div key={benchmark.field} className="p-mx-lg bg-surface-alt border border-border-default rounded-mx-2xl group/item hover:bg-white hover:shadow-mx-lg transition-all shadow-inner">
                <div className="flex items-center justify-between gap-mx-md">
                  <div className={cn(
                    'w-mx-12 h-mx-12 rounded-mx-xl border flex items-center justify-center shadow-mx-sm shrink-0',
                    benchmark.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                      benchmark.tone === 'success' ? 'bg-status-success-surface border-mx-emerald-100 text-status-success' :
                        'bg-status-warning-surface border-mx-amber-100 text-status-warning'
                  )}>
                    <benchmark.icon size={22} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Typography variant="caption" tone="muted" className="mb-2 block font-black tracking-widest">{benchmark.label}</Typography>
                    <div className="flex items-baseline gap-mx-xs">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={storeBench[benchmark.field]}
                        onChange={(event) => updateBenchmark(benchmark.field, event.target.value)}
                        disabled={!canManageGoals}
                        aria-label={`Benchmark ${benchmark.label}`}
                        className="w-mx-3xl text-4xl font-black tracking-normal text-text-primary bg-transparent border-b-4 border-transparent focus:outline-none focus:border-brand-primary transition-all font-mono-numbers disabled:opacity-60"
                      />
                      <Typography variant="h1" tone="muted" className="text-2xl">%</Typography>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}
