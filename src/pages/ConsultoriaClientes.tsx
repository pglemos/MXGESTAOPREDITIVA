import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  PauseCircle,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
} from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { toast } from '@/lib/toast'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Typography } from '@/components/atoms/Typography'
import { DataGrid, type Column } from '@/components/organisms/DataGrid'
import { Badge } from '@/components/atoms/Badge'
import {
  MxField,
  MxMetricCard,
  MxModuleHeader,
  MxModulePage,
  MxSectionCard,
  MxStatusBanner,
  MxTableSurface,
  MxToolbar,
} from '@/components/module/MxModuleVisualPrimitives'
import { useConsultingClients, useConsultingClientMetrics } from '@/hooks/useConsultingClients'
import { DEFAULT_CONSULTING_MODULES } from '@/hooks/useConsultingModules'
import type { ConsultingClient } from '@/lib/schemas/consulting-client.schema'
import { cn } from '@/lib/utils'

type ConsultingClientForm = {
  name: string
  legal_name: string
  cnpj: string
  product_name: string
  notes: string
  enabled_modules: string[]
}

function getDefaultEnabledModules() {
  return DEFAULT_CONSULTING_MODULES
    .filter((module) => module.enabled)
    .map((module) => module.module_key)
}

const initialForm = (): ConsultingClientForm => ({
  name: '',
  legal_name: '',
  cnpj: '',
  product_name: '',
  notes: '',
  enabled_modules: getDefaultEnabledModules(),
})

export default function ConsultoriaClientes() {
  const navigate = useNavigate()
  const { clients, loading, error, canCreate, refetch, createClient } = useConsultingClients()
  const { metrics } = useConsultingClientMetrics()
  const [searchTerm, setSearchTerm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<ConsultingClientForm>(initialForm)

  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return clients

    return clients.filter((client) =>
      [client.name, client.legal_name, client.product_name, client.cnpj]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    )
  }, [clients, searchTerm])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) {
      toast.error('Nome do cliente é obrigatório.')
      return
    }

    setSubmitting(true)
    const { error: createError } = await createClient(form)
    setSubmitting(false)

    if (createError) {
      toast.error(createError)
      return
    }

    toast.success('Cliente da consultoria criado.')
    setForm(initialForm())
    setShowCreate(false)
  }

  const toggleModule = (key: string) => {
    setForm((current) => {
      const enabled = current.enabled_modules.includes(key)
      return {
        ...current,
        enabled_modules: enabled
          ? current.enabled_modules.filter((moduleKey) => moduleKey !== key)
          : [...current.enabled_modules, key],
      }
    })
  }

  const columns = useMemo<Column<ConsultingClient>[]>(
    () => [
      {
        key: 'name',
        header: 'CLIENTE',
        render: (client) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600">
              <Building2 size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <Typography variant="h3" className="truncate text-sm text-gray-800">
                {client.name}
              </Typography>
              <Typography variant="tiny" className="text-gray-500">
                {client.legal_name || 'Sem razão social'}
              </Typography>
            </div>
          </div>
        ),
      },
      {
        key: 'product_name',
        header: 'PRODUTO',
        align: 'center',
        render: (client) => (
          <Badge variant="outline" className="rounded-full border-gray-200 px-3 py-1 text-gray-600">
            {client.product_name || 'Não definido'}
          </Badge>
        ),
      },
      {
        key: 'progress',
        header: 'PROGRESSO',
        align: 'center',
        render: (client) => {
          const step = client.current_visit_step || 0
          return (
            <div className="flex flex-col items-center gap-2">
              <Typography variant="tiny" className="font-semibold text-gray-600">
                {step} / 7
              </Typography>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all"
                  style={{ width: `${(step / 7) * 100}%` }}
                />
              </div>
            </div>
          )
        },
      },
      {
        key: 'status',
        header: 'STATUS',
        align: 'center',
        render: (client) => (
          <Badge
            variant={client.status === 'ativo' ? 'success' : 'outline'}
            className="rounded-full border-none px-3 py-1"
          >
            {String(client.status || 'ativo').toUpperCase()}
          </Badge>
        ),
      },
      {
        key: 'health',
        header: 'SAÚDE RITUAL',
        align: 'center',
        render: (client) => {
          if (!client.last_visit_at) {
            return <Badge variant="outline" className="border-gray-200 text-gray-500">SEM VISITA</Badge>
          }

          const daysSince = differenceInDays(new Date(), new Date(client.last_visit_at))
          let variant: 'success' | 'warning' | 'danger' = 'success'
          let label = 'EM DIA'

          if (daysSince > 21) {
            variant = 'danger'
            label = `ATRASO CRÍTICO (${daysSince}D)`
          } else if (daysSince > 10) {
            variant = 'warning'
            label = `ALERTA (${daysSince}D)`
          }

          return (
            <Badge variant={variant} className="rounded-full border-none px-3 py-1 text-[10px] font-semibold">
              {label}
            </Badge>
          )
        },
      },
      {
        key: 'actions',
        header: 'AÇÃO',
        align: 'right',
        render: (client) => (
          <Button asChild variant="managerSecondary" size="sm">
            <Link to={`/consultoria/clientes/${client.slug || client.id}`}>Abrir</Link>
          </Button>
        ),
      },
    ],
    [],
  )

  return (
    <MxModulePage>
      <MxModuleHeader
        eyebrow="Gestão de clientes"
        title="CRM de Consultoria"
        description="Acompanhe clientes internos, evolução das visitas, módulos contratados e saúde do ritual de consultoria."
        actions={(
          <>
            <Button
              variant="managerSecondary"
              size="icon"
              onClick={() => void refetch()}
              aria-label="Atualizar clientes"
            >
              <RefreshCw size={18} />
            </Button>
            <Button asChild variant="managerSecondary">
              <Link to="/agenda">
                <CalendarDays size={18} />
                Agenda MX
              </Link>
            </Button>
            {canCreate ? (
              <Button
                variant="managerPrimary"
                onClick={() => setShowCreate((visible) => !visible)}
              >
                <Plus size={18} />
                Novo cliente
              </Button>
            ) : null}
          </>
        )}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores da consultoria">
        <MxMetricCard
          title="Total"
          value={metrics.total}
          detail="Clientes cadastrados"
          icon={Building2}
          tone="neutral"
        />
        <MxMetricCard
          title="Ativos"
          value={metrics.active}
          detail="Em acompanhamento"
          icon={CheckCircle2}
          tone="success"
        />
        <MxMetricCard
          title="Pausados"
          value={metrics.paused}
          detail="Acompanhamento suspenso"
          icon={PauseCircle}
          tone="warning"
        />
        <MxMetricCard
          title="ROI médio da rede"
          value="+32,4%"
          detail="Indicador consolidado"
          icon={TrendingUp}
          tone="brand"
        />
      </section>

      {error ? (
        <MxStatusBanner tone="danger">
          Falha ao carregar clientes: {error}
        </MxStatusBanner>
      ) : null}

      <MxToolbar aria-label="Busca e ações do CRM">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar cliente, produto ou CNPJ"
            aria-label="Buscar cliente, produto ou CNPJ"
            className="h-11 rounded-xl border-gray-200 bg-white pl-10 text-gray-800 shadow-none"
          />
        </div>
        <Typography variant="tiny" className="text-gray-500 sm:ml-auto">
          {filteredClients.length} de {clients.length} clientes
        </Typography>
      </MxToolbar>

      {showCreate && canCreate ? (
        <MxSectionCard>
          <div className="border-b border-gray-100 px-5 py-4">
            <Typography as="h2" variant="h3" className="text-base text-gray-800">
              Novo cliente da consultoria
            </Typography>
            <Typography variant="p" className="mt-1 text-sm text-gray-500">
              Cadastre a empresa e selecione os módulos que ficarão disponíveis no acompanhamento.
            </Typography>
          </div>

          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
            <MxField label="Nome do cliente" htmlFor="consulting-client-name" className="md:col-span-2">
              <Input
                id="consulting-client-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ex.: DNA Veículos"
                className="h-11 rounded-xl border-gray-200"
              />
            </MxField>

            <MxField label="Razão social" htmlFor="consulting-client-legal-name">
              <Input
                id="consulting-client-legal-name"
                value={form.legal_name}
                onChange={(event) => setForm((current) => ({ ...current, legal_name: event.target.value }))}
                placeholder="Razão social"
                className="h-11 rounded-xl border-gray-200"
              />
            </MxField>

            <MxField label="CNPJ" htmlFor="consulting-client-cnpj">
              <Input
                id="consulting-client-cnpj"
                value={form.cnpj}
                onChange={(event) => setForm((current) => ({ ...current, cnpj: event.target.value }))}
                placeholder="00.000.000/0000-00"
                className="h-11 rounded-xl border-gray-200"
              />
            </MxField>

            <MxField label="Produto" htmlFor="consulting-client-product">
              <Input
                id="consulting-client-product"
                value={form.product_name}
                onChange={(event) => setForm((current) => ({ ...current, product_name: event.target.value }))}
                placeholder="Ex.: PMR Presencial"
                className="h-11 rounded-xl border-gray-200"
              />
            </MxField>

            <MxField label="Notas" htmlFor="consulting-client-notes" className="md:col-span-2">
              <Input
                id="consulting-client-notes"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Observações iniciais do cliente"
                className="h-11 rounded-xl border-gray-200"
              />
            </MxField>

            <fieldset className="md:col-span-2">
              <legend className="text-sm font-semibold text-gray-700">Módulos e recursos da consultoria</legend>
              <p className="mt-1 text-sm text-gray-500">
                Selecione os recursos internos que este cliente poderá utilizar no painel.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {DEFAULT_CONSULTING_MODULES.map((module) => {
                  const enabled = form.enabled_modules.includes(module.module_key)
                  return (
                    <label
                      key={module.module_key}
                      className={cn(
                        'flex min-h-16 cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                        enabled
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => toggleModule(module.module_key)}
                        className="mt-1 accent-emerald-600"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-gray-800">{module.label}</span>
                        {module.premium ? (
                          <Badge variant="warning" className="mt-2 px-2 py-0.5 text-[10px]">Premium</Badge>
                        ) : null}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4 md:col-span-2">
              <Button type="button" variant="managerGhost" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="managerPrimary" disabled={submitting}>
                <BriefcaseBusiness size={16} />
                {submitting ? 'Salvando...' : 'Criar cliente'}
              </Button>
            </div>
          </form>
        </MxSectionCard>
      ) : null}

      <MxSectionCard>
        <div className="border-b border-gray-100 px-5 py-4">
          <Typography as="h2" variant="h3" className="text-base text-gray-800">
            Clientes acompanhados
          </Typography>
          <Typography variant="p" className="mt-1 text-sm text-gray-500">
            Abra um cliente para consultar visitas, módulos e próximos passos.
          </Typography>
        </div>
        <MxTableSurface className="rounded-none border-0 shadow-none">
          <DataGrid
            columns={columns}
            data={filteredClients}
            loading={loading}
            emptyMessage="Nenhum cliente da consultoria localizado."
            onRowClick={(client) => navigate(`/consultoria/clientes/${client.slug || client.id}`)}
          />
        </MxTableSurface>
      </MxSectionCard>
    </MxModulePage>
  )
}
