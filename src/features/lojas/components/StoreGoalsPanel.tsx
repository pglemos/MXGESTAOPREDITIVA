import { useEffect, useState } from 'react'
import { Calendar, RefreshCw, Save, Target, Trash2, TrendingUp, Users, Zap } from 'lucide-react'
import { toast } from '@/lib/toast'

import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { isAdministradorMx, useAuth } from '@/hooks/useAuth'
import { useStoreGoal, useStoreMetaRules } from '@/hooks/useGoals'
import { cn } from '@/lib/utils'
import { requestToastConfirmation } from '@/lib/ui/confirmAction'

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

  const executeDelete = async () => {
    if (!storeId || !canManageGoals) return

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

  const handleDelete = () => {
    if (!storeId || !canManageGoals) return
    requestToastConfirmation({
      key: `delete-store-goals:${storeId}`,
      title: `Excluir metas de ${storeName || 'loja'}?`,
      description: 'A loja voltará aos padrões até uma nova configuração ser salva.',
      label: 'Excluir',
      onConfirm: executeDelete,
    })
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
    <section className="space-y-mx-lg pb-24 md:pb-32" aria-label="Metas da loja">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-mx-md bg-white border border-border-default rounded-mx-3xl p-mx-lg md:p-mx-xl shadow-mx-sm">
        <div className="min-w-0">
          <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest opacity-60 text-mx-tiny">Aba de Metas</Typography>
          <Typography variant="h2" className="uppercase tracking-tight truncate text-xl md:text-2xl">{storeName || 'Unidade MX'}</Typography>
          <Typography variant="p" tone="muted" className="mt-mx-xs max-w-2xl text-sm">Meta mensal, objetivo nominal de sell-out e benchmarks oficiais da unidade.</Typography>
        </div>
        {canManageGoals ? (
          <div className="grid w-full grid-cols-2 gap-mx-xs sm:flex sm:w-auto sm:items-center sm:gap-mx-sm">
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting || saving || !hasPersistedRules}
              className="h-mx-10 w-full rounded-mx-xl text-mx-tiny sm:h-mx-11 sm:w-auto"
            >
              {deleting ? <RefreshCw className="animate-spin mr-2" /> : <Trash2 size={16} className="mr-2" />}
              Excluir
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || deleting || !hasChanges}
              className="h-mx-10 w-full rounded-mx-xl text-mx-tiny sm:h-mx-11 sm:w-auto"
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
        <section className="xl:col-span-7 bg-white border border-border-default rounded-mx-3xl p-mx-lg md:p-mx-xl shadow-mx-lg">
          <div>
            <header className="flex items-center gap-mx-sm mb-mx-lg border-b border-border-default pb-mx-md md:mb-10 md:pb-8">
              <div className="w-mx-xl h-mx-xl rounded-mx-2xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg md:h-mx-2xl md:w-mx-2xl">
                <Target size={28} className="text-brand-primary/80 md:size-8" />
              </div>
              <div className="min-w-0">
                <Typography variant="h2" className="text-lg md:text-2xl">Meta Mensal de Vendas</Typography>
                <Typography variant="p" tone="muted" className="text-sm">Objetivo nominal de sell-out por unidade</Typography>
              </div>
            </header>

            <div className="grid grid-cols-1 gap-mx-md items-stretch lg:grid-cols-2 lg:gap-mx-lg">
              <div className="min-w-0 rounded-mx-2xl border border-border-default bg-surface-alt p-mx-md shadow-inner md:p-mx-lg">
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
                  className="w-full bg-transparent px-mx-sm pb-mx-sm pt-mx-xs text-center font-mono-numbers text-5xl font-black leading-none tracking-normal text-text-primary transition-all focus:outline-none disabled:opacity-60 sm:text-6xl lg:text-7xl"
                />
                <Typography variant="caption" tone="muted" className="block text-center font-black uppercase tracking-mx-wider">Unidades comerciais</Typography>
              </div>
              <div className="bg-brand-primary p-mx-lg text-white rounded-mx-2xl shadow-mx-lg flex flex-col justify-center items-center text-center border border-brand-primary/10 min-h-36 md:min-h-48">
                <TrendingUp size={36} className="mb-mx-md opacity-40" />
                <Typography variant="p" tone="white" className="max-w-xs text-sm font-black italic uppercase leading-relaxed opacity-90">Metas agressivas, porém pautadas no histórico.</Typography>
              </div>
            </div>
          </div>
        </section>

        <aside className="xl:col-span-5 bg-white border border-border-default rounded-mx-3xl p-mx-lg md:p-mx-xl shadow-mx-lg">
          <header className="flex items-center gap-mx-sm mb-mx-lg border-b border-border-default pb-mx-md md:mb-10 md:pb-8">
            <div className="w-mx-xl h-mx-xl rounded-mx-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shadow-inner md:h-mx-2xl md:w-mx-2xl">
              <Zap size={28} />
            </div>
            <div className="min-w-0">
              <Typography variant="h2" className="text-lg md:text-2xl">Matriz de Benchmarks (20/60/33)</Typography>
              <Typography variant="p" tone="muted" className="text-sm">Taxas de conversão oficiais para auditoria forense</Typography>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-mx-md">
            {[
              { label: 'Lead -> Agd', field: 'lead_to_agend' as const, icon: Users, tone: 'brand' },
              { label: 'Agd -> Visita', field: 'agend_to_visit' as const, icon: Calendar, tone: 'warning' },
              { label: 'Visita -> Vnd', field: 'visit_to_sale' as const, icon: TrendingUp, tone: 'success' },
            ].map((benchmark) => (
              <div key={benchmark.field} className="p-mx-md bg-surface-alt border border-border-default rounded-mx-2xl group/item hover:bg-white hover:shadow-mx-lg transition-all shadow-inner md:p-mx-lg">
                <div className="flex items-center justify-between gap-mx-md">
                  <div className={cn(
                    'w-mx-10 h-mx-10 rounded-mx-xl border flex items-center justify-center shadow-mx-sm shrink-0 md:h-mx-12 md:w-mx-12',
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
                        className="w-mx-20 bg-transparent font-mono-numbers text-3xl font-black tracking-normal text-text-primary transition-all focus:outline-none disabled:opacity-60 md:w-mx-3xl md:text-4xl"
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
