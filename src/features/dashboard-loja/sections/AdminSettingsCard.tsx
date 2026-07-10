import { useEffect, useState, type FormEvent } from 'react'
import { Settings2, Building2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { type useOperationalSettings, type StoreSettingsPayload } from '@/hooks/useOperationalSettings'
import type { ProjectionMode, Store } from '@/types/database'
import {
  joinRecipients,
  splitRecipients,
  toBoundedNumber,
  toNumber,
} from '../data/store-settings'
import { AdminSettingsForm, type SettingsFormState } from './AdminSettingsForm'

type OperationalSettings = ReturnType<typeof useOperationalSettings>

type AdminSettingsCardProps = {
  selectedStoreId: string
  selectedStore: Store | null
  operational: Pick<
    OperationalSettings,
    'store' | 'deliveryRules' | 'benchmark' | 'metaRules' | 'loading' | 'fetchSettings' | 'saveSettings'
  >
  storeGoalProjectionMode: ProjectionMode | undefined
  showAdminSettings: boolean
  onToggleAdminSettings: () => void
  onOpenEdit: () => void
  onNavigateLojas: () => void
  onDelete: () => void
  deletingStore: boolean
  onRefetchAll: () => Promise<void>
}

/**
 * Card de Administração da Loja — header com toggles + AdminSettingsForm interno.
 * Visível apenas para Admin MX. Extraído de DashboardLoja.tsx (Story 2.5).
 */
export function AdminSettingsCard({
  selectedStoreId,
  selectedStore,
  operational,
  storeGoalProjectionMode,
  showAdminSettings,
  onToggleAdminSettings,
  onOpenEdit,
  onNavigateLojas,
  onDelete,
  deletingStore,
  onRefetchAll,
}: AdminSettingsCardProps) {
  const {
    store: operationalStore,
    deliveryRules,
    benchmark,
    metaRules: operationalMetaRules,
    loading: operationalLoading,
    fetchSettings,
    saveSettings,
  } = operational

  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState<SettingsFormState>({
    source_mode: 'native_app',
    active: true,
    manager_email: '',
    monthly_goal: '0',
    individual_goal_mode: 'even',
    include_venda_loja_in_store_total: true,
    include_venda_loja_in_individual_goal: false,
    bench_lead_agd: '20',
    bench_agd_visita: '60',
    bench_visita_vnd: '33',
    matinal_recipients: '',
    weekly_recipients: '',
    monthly_recipients: '',
    whatsapp_group_ref: '',
    timezone: 'America/Sao_Paulo',
    delivery_active: true,
    projection_mode: 'calendar',
  })

  useEffect(() => {
    setSettingsForm({
      source_mode: operationalStore?.source_mode || selectedStore?.source_mode || 'native_app',
      active: operationalStore?.active ?? selectedStore?.active ?? true,
      manager_email: operationalStore?.manager_email || selectedStore?.manager_email || '',
      monthly_goal: String(operationalMetaRules?.monthly_goal ?? 0),
      individual_goal_mode: operationalMetaRules?.individual_goal_mode || 'even',
      include_venda_loja_in_store_total: operationalMetaRules?.include_venda_loja_in_store_total ?? true,
      include_venda_loja_in_individual_goal: operationalMetaRules?.include_venda_loja_in_individual_goal ?? false,
      bench_lead_agd: String(benchmark?.lead_to_agend ?? operationalMetaRules?.bench_lead_agd ?? 20),
      bench_agd_visita: String(benchmark?.agend_to_visit ?? operationalMetaRules?.bench_agd_visita ?? 60),
      bench_visita_vnd: String(benchmark?.visit_to_sale ?? operationalMetaRules?.bench_visita_vnd ?? 33),
      matinal_recipients: joinRecipients(deliveryRules?.matinal_recipients),
      weekly_recipients: joinRecipients(deliveryRules?.weekly_recipients),
      monthly_recipients: joinRecipients(deliveryRules?.monthly_recipients),
      whatsapp_group_ref: deliveryRules?.whatsapp_group_ref || '',
      timezone: deliveryRules?.timezone || 'America/Sao_Paulo',
      delivery_active: deliveryRules?.active ?? true,
      projection_mode: operationalMetaRules?.projection_mode || storeGoalProjectionMode || 'calendar',
    })
  }, [benchmark, deliveryRules, operationalMetaRules, operationalStore, selectedStore, storeGoalProjectionMode])

  const handleSettingsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const monthlyGoal = toBoundedNumber(settingsForm.monthly_goal, 0, 0, 999999)
    const benchLeadAgd = toBoundedNumber(settingsForm.bench_lead_agd, 20, 0, 100)
    const benchAgdVisita = toBoundedNumber(settingsForm.bench_agd_visita, 60, 0, 100)
    const benchVisitaVnd = toBoundedNumber(settingsForm.bench_visita_vnd, 33, 0, 100)
    if (
      String(monthlyGoal) !== String(toNumber(settingsForm.monthly_goal, 0)) ||
      String(benchLeadAgd) !== String(toNumber(settingsForm.bench_lead_agd, 20)) ||
      String(benchAgdVisita) !== String(toNumber(settingsForm.bench_agd_visita, 60)) ||
      String(benchVisitaVnd) !== String(toNumber(settingsForm.bench_visita_vnd, 33))
    ) {
      toast.error('Revise metas e benchmarks. Use valores entre 0 e 100 para conversões.')
      return
    }

    const payload: StoreSettingsPayload = {
      store: {
        id: selectedStoreId,
        manager_email: settingsForm.manager_email.trim() || null,
        source_mode: settingsForm.source_mode,
        active: settingsForm.active,
      },
      delivery: {
        store_id: selectedStoreId,
        matinal_recipients: splitRecipients(settingsForm.matinal_recipients),
        weekly_recipients: splitRecipients(settingsForm.weekly_recipients),
        monthly_recipients: splitRecipients(settingsForm.monthly_recipients),
        whatsapp_group_ref: settingsForm.whatsapp_group_ref.trim() || null,
        timezone: settingsForm.timezone.trim() || 'America/Sao_Paulo',
        active: settingsForm.delivery_active,
      },
      benchmark: {
        store_id: selectedStoreId,
        lead_to_agend: benchLeadAgd,
        agend_to_visit: benchAgdVisita,
        visit_to_sale: benchVisitaVnd,
      },
      meta: {
        store_id: selectedStoreId,
        monthly_goal: monthlyGoal,
        individual_goal_mode: settingsForm.individual_goal_mode,
        include_venda_loja_in_store_total: settingsForm.include_venda_loja_in_store_total,
        include_venda_loja_in_individual_goal: settingsForm.include_venda_loja_in_individual_goal,
        bench_lead_agd: benchLeadAgd,
        bench_agd_visita: benchAgdVisita,
        bench_visita_vnd: benchVisitaVnd,
        projection_mode: settingsForm.projection_mode,
      },
    }

    setSavingSettings(true)
    try {
      const { error } = await saveSettings(payload)
      if (error) { toast.error(error); return }
      await onRefetchAll()
      toast.success('Dados operacionais da loja atualizados.')
    } finally {
      setSavingSettings(false)
    }
  }

  if (!selectedStore) return null

  return (
    <Card className="w-full rounded-mx-lg border border-border-subtle bg-white overflow-hidden shadow-mx-sm">
      <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-md">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-mx-md">
          <div className="flex items-center gap-mx-sm min-w-0">
            <div className="w-mx-12 h-mx-12 rounded-mx-xl bg-brand-primary text-white flex items-center justify-center shadow-mx-inner shrink-0">
              <Settings2 size={22} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg md:text-xl tracking-tight">Administração da Loja</CardTitle>
              <CardDescription className="uppercase tracking-mx-wide font-black mt-1 text-mx-tiny">
                {operationalLoading
                  ? 'CARREGANDO DADOS...'
                  : `${selectedStore.name.toUpperCase()} · Cadastro e parâmetros separados da leitura de performance`}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-mx-sm">
            <Button type="button" variant="outline" onClick={onOpenEdit} className="h-mx-10 rounded-mx-xl">
              <Building2 size={16} className="mr-2" /> Editar cadastro
            </Button>
            <Button type="button" variant="outline" onClick={onNavigateLojas} className="h-mx-10 rounded-mx-xl">
              <Building2 size={16} className="mr-2" /> Gerenciar lojas
            </Button>
            <Button type="button" variant={showAdminSettings ? 'secondary' : 'outline'} onClick={onToggleAdminSettings} className="h-mx-10 rounded-mx-xl">
              <Settings2 size={16} className="mr-2" />
              {showAdminSettings ? 'Ocultar parâmetros' : 'Configurar parâmetros'}
            </Button>
          </div>
        </div>
      </CardHeader>
      {showAdminSettings && (
        <CardContent className="p-mx-md">
          <div className="mb-mx-lg rounded-mx-xl border border-border-default bg-surface-alt px-mx-md py-mx-sm">
            <Typography variant="p" tone="muted" className="text-sm">
              Estes parâmetros alteram metas, fonte de dados, benchmarks e entregas de relatório. A leitura de
              performance abaixo continua baseada nos lançamentos do período selecionado.
            </Typography>
          </div>
          <AdminSettingsForm
            form={settingsForm}
            setForm={setSettingsForm}
            saving={savingSettings}
            operationalLoading={operationalLoading}
            deletingStore={deletingStore}
            onSubmit={handleSettingsSubmit}
            onReload={fetchSettings}
            onDelete={onDelete}
          />
        </CardContent>
      )}
    </Card>
  )
}

export default AdminSettingsCard
