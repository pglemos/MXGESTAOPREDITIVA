import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, RefreshCw, Search, BriefcaseBusiness, Building2, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Input } from '@/components/atoms/Input'
import { Typography } from '@/components/atoms/Typography'
import { DataGrid, type Column } from '@/components/organisms/DataGrid'
import { Badge } from '@/components/atoms/Badge'
import { useConsultingClients, useConsultingClientMetrics } from '@/hooks/useConsultingClients'
import { DEFAULT_CONSULTING_MODULES } from '@/hooks/useConsultingModules'

export default function ConsultoriaClientes() {
  const navigate = useNavigate()
  const { clients, loading, error, canCreate, refetch, createClient } = useConsultingClients()
  const { metrics } = useConsultingClientMetrics()
  const [searchTerm, setSearchTerm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<{
    name: string
    legal_name: string
    cnpj: string
    product_name: string
    notes: string
    enabled_modules: string[]
  }>({
    name: '',
    legal_name: '',
    cnpj: '',
    product_name: '',
    notes: '',
    enabled_modules: DEFAULT_CONSULTING_MODULES.filter((m: any) => m.enabled).map((m: any) => m.module_key),
  })

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
    setForm({ 
        name: '', legal_name: '', cnpj: '', product_name: '', notes: '', 
        enabled_modules: DEFAULT_CONSULTING_MODULES.filter((m: any) => m.enabled).map((m: any) => m.module_key) 
    })
    setShowCreate(false)
  }

  const toggleModule = (key: string) => {
    setForm(prev => {
        const has = prev.enabled_modules.includes(key)
        return {
            ...prev,
            enabled_modules: has ? prev.enabled_modules.filter(k => k !== key) : [...prev.enabled_modules, key]
        }
    })
  }

  const columns = useMemo<Column<any>[]>(() => [
    {
      key: 'name',
      header: 'CLIENTE',
      render: (client) => (
        <div className="flex items-center gap-mx-sm min-w-0">
          <div className="w-mx-10 h-mx-10 rounded-mx-lg bg-surface-alt border border-border-default flex items-center justify-center text-brand-primary shrink-0">
            <Building2 size={18} />
          </div>
          <div className="min-w-0">
            <Typography variant="h3" className="text-sm truncate">{client.name}</Typography>
            <Typography variant="tiny" tone="muted" className="opacity-50">{client.legal_name || 'Sem razão social'}</Typography>
          </div>
        </div>
      ),
    },
    {
      key: 'product_name',
      header: 'PRODUTO',
      align: 'center',
      render: (client) => (
        <Badge variant="outline" className="px-3 py-1 rounded-mx-full border-border-default">
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
          <div className="flex flex-col items-center gap-mx-xs">
            <Typography variant="tiny" className="font-black">{step} / 7</Typography>
            <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden" style={{ width: '6rem' }}>
              <div 
                className="h-full bg-brand-primary transition-all" 
                style={{ width: `${(step / 7) * 100}%` }}
              />
            </div>
          </div>
        )
      }
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: (client) => (
        <Badge
          variant={client.status === 'ativo' ? 'success' : 'outline'}
          className="px-3 py-1 rounded-mx-full border-none"
        >
          {String(client.status || 'ativo').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'AÇÃO',
      align: 'right',
      render: (client) => (
        <Button asChild variant="secondary" size="sm" className="rounded-mx-lg">
          <Link to={`/consultoria/clientes/${client.slug || client.id}`}>ABRIR</Link>
        </Button>
      ),
    },
  ], [])

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <div className="flex flex-col gap-mx-tiny">
          <div className="flex items-center gap-mx-sm">
            <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
            <Typography variant="h1">CRM de <span className="text-mx-green-700">Consultoria</span></Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md">CLIENTES INTERNOS DA MX</Typography>
        </div>

        <div className="flex flex-wrap items-center gap-mx-sm">
          <div className="grid grid-cols-3 gap-mx-sm">
            <Card className="p-mx-md border-none shadow-mx-md bg-white">
              <Typography variant="tiny" tone="muted">TOTAL</Typography>
              <Typography variant="h2">{metrics.total}</Typography>
            </Card>
            <Card className="p-mx-md border-none shadow-mx-md bg-white">
              <Typography variant="tiny" tone="muted">ATIVOS</Typography>
              <Typography variant="h2" tone="success">{metrics.active}</Typography>
            </Card>
            <Card className="p-mx-md border-none shadow-mx-md bg-white">
              <Typography variant="tiny" tone="muted">PAUSADOS</Typography>
              <Typography variant="h2" tone="warning">{metrics.paused}</Typography>
            </Card>
          </div>

          <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Atualizar" className="rounded-mx-xl bg-white">
            <RefreshCw size={18} />
          </Button>

          <Button asChild variant="outline" size="default" className="rounded-mx-xl bg-white">
            <Link to="/agenda">
              <CalendarDays size={18} className="mr-2" /> AGENDA MX
            </Link>
          </Button>

          {canCreate && (
            <Button onClick={() => setShowCreate((value) => !value)} className="bg-brand-secondary">
              <Plus size={18} className="mr-2" />
              NOVO CLIENTE
            </Button>
          )}
        </div>
      </header>

      {error && (
        <Card className="p-mx-lg bg-status-error-surface border border-status-error/20">
          <Typography variant="p" tone="error">Falha ao carregar clientes: {error}</Typography>
        </Card>
      )}

      <Card className="p-mx-lg border-none shadow-mx-md bg-white">
        <div className="relative max-w-mx-sidebar-expanded">
          <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar cliente, produto ou CNPJ..."
            className="!pl-11"
          />
        </div>
      </Card>

      {showCreate && canCreate && (
        <Card className="p-mx-lg border-none shadow-mx-md bg-white">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-mx-md">
            <div className="space-y-mx-xs md:col-span-2">
              <Typography as="label" htmlFor="consulting-client-name" variant="caption">Nome do cliente</Typography>
              <Input
                id="consulting-client-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ex: DNA Veículos"
              />
            </div>

            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="consulting-client-legal-name" variant="caption">Razão social</Typography>
              <Input
                id="consulting-client-legal-name"
                value={form.legal_name}
                onChange={(event) => setForm((current) => ({ ...current, legal_name: event.target.value }))}
                placeholder="Razão social"
              />
            </div>

            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="consulting-client-cnpj" variant="caption">CNPJ</Typography>
              <Input
                id="consulting-client-cnpj"
                value={form.cnpj}
                onChange={(event) => setForm((current) => ({ ...current, cnpj: event.target.value }))}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="consulting-client-product" variant="caption">Produto</Typography>
              <Input
                id="consulting-client-product"
                value={form.product_name}
                onChange={(event) => setForm((current) => ({ ...current, product_name: event.target.value }))}
                placeholder="Ex: PMR Presencial"
              />
            </div>

            <div className="space-y-mx-xs md:col-span-2">
              <Typography as="label" htmlFor="consulting-client-notes" variant="caption">Notas</Typography>
              <Input
                id="consulting-client-notes"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Observações iniciais do cliente"
              />
            </div>

            <div className="md:col-span-2 pt-4 border-t border-border-default">
              <Typography variant="h3" className="mb-2">MÓDULOS & RECURSOS DA CONSULTORIA</Typography>
              <Typography variant="caption" tone="muted" className="block mb-4">
                Selecione os módulos internos que este cliente terá acesso (DRE, Planos, etc). 
                Diferente do 'Produto Comercial', esses são os recursos habilitados no painel.
              </Typography>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {DEFAULT_CONSULTING_MODULES.map((mod: any) => {
                  const isEnabled = form.enabled_modules.includes(mod.module_key)
                  return (
                    <label key={mod.module_key} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${isEnabled ? 'bg-mx-indigo-50 border-brand-primary' : 'bg-surface-alt border-border-default hover:bg-white'}`}>
                      <input 
                        type="checkbox" 
                        checked={isEnabled} 
                        onChange={() => toggleModule(mod.module_key)} 
                        className="mt-1"
                      />
                      <div>
                        <Typography variant="p" className="font-bold leading-none">{mod.label}</Typography>
                        {mod.premium && <Badge variant="warning" className="mt-1 px-2 py-0.5 text-[9px]">PREMIUM</Badge>}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-mx-sm mt-4">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>CANCELAR</Button>
              <Button type="submit" disabled={submitting}>
                <BriefcaseBusiness size={16} className="mr-2" />
                {submitting ? 'SALVANDO...' : 'CRIAR CLIENTE'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="border-none shadow-mx-xl bg-white overflow-hidden p-mx-0">
        <DataGrid
          columns={columns}
          data={filteredClients}
          loading={loading}
          emptyMessage="Nenhum cliente da consultoria localizado."
          onRowClick={(client) => navigate(`/consultoria/clientes/${client.slug || client.id}`)}
        />
      </Card>
    </main>
  )
}
