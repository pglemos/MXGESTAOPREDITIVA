import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  Archive,
  Edit3,
  ExternalLink,
  Globe,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { z } from 'zod'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { EmptyState } from '@/components/atoms/EmptyState'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Textarea } from '@/components/atoms/Textarea'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { Modal } from '@/components/organisms/Modal'
import { isAdministradorMx, isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { DigitalProduct, UserRole } from '@/types/database'

type ProductAudience = 'vendedor' | 'gerente' | 'dono'
type ProductStatus = 'ativo' | 'rascunho' | 'arquivado'

type ProductForm = {
  name: string
  description: string
  link: string
  category: string
  target_roles: ProductAudience[]
  status: ProductStatus
  sort_order: string
}

type ProductRecord = DigitalProduct & {
  category?: string | null
  target_roles?: ProductAudience[] | null
  status?: ProductStatus | null
  sort_order?: number | null
}

const PRODUCT_AUDIENCES: Array<{ key: ProductAudience; label: string; description: string }> = [
  { key: 'vendedor', label: 'Vendedores', description: 'Aparece para vendedores' },
  { key: 'gerente', label: 'Gerentes', description: 'Aparece para gerentes' },
  { key: 'dono', label: 'Dono', description: 'Aparece para proprietários' },
]

const PRODUCT_CATEGORIES = ['Operacional', 'Treinamento', 'Consultoria', 'Gestão', 'Comercial', 'Financeiro'] as const
const PRODUCT_STATUSES: ProductStatus[] = ['ativo', 'rascunho', 'arquivado']
const PRODUCT_DEFAULT_CATALOG: Array<Omit<ProductForm, 'sort_order'> & { sort_order: number }> = [
  {
    name: 'PPA',
    description: 'Produto base para agenda e acompanhamento de consultoria MX.',
    link: '/produtos',
    category: 'Consultoria',
    target_roles: ['vendedor', 'gerente', 'dono'],
    status: 'ativo',
    sort_order: 10,
  },
  {
    name: 'PPA PREMIUM',
    description: 'Produto premium para agenda e acompanhamento de consultoria MX.',
    link: '/produtos',
    category: 'Consultoria',
    target_roles: ['vendedor', 'gerente', 'dono'],
    status: 'ativo',
    sort_order: 20,
  },
  {
    name: 'PMR RENOVAÇÃO',
    description: 'Produto de renovação PMR para agenda e rotinas comerciais.',
    link: '/produtos',
    category: 'Gestão',
    target_roles: ['vendedor', 'gerente', 'dono'],
    status: 'ativo',
    sort_order: 30,
  },
  {
    name: 'PMR PRESENCIAL',
    description: 'Produto PMR presencial para agenda e execução de consultoria.',
    link: '/produtos',
    category: 'Gestão',
    target_roles: ['vendedor', 'gerente', 'dono'],
    status: 'ativo',
    sort_order: 40,
  },
  {
    name: 'PMR ONLINE',
    description: 'Produto PMR online para agenda e acompanhamento remoto.',
    link: '/produtos',
    category: 'Gestão',
    target_roles: ['vendedor', 'gerente', 'dono'],
    status: 'ativo',
    sort_order: 50,
  },
  {
    name: 'MENTORIA',
    description: 'Produto de mentoria para desenvolvimento comercial e acompanhamento.',
    link: '/produtos',
    category: 'Treinamento',
    target_roles: ['vendedor', 'gerente', 'dono'],
    status: 'ativo',
    sort_order: 60,
  },
]

const defaultForm: ProductForm = {
  name: '',
  description: '',
  link: '',
  category: 'Operacional',
  target_roles: ['vendedor', 'gerente', 'dono'],
  status: 'ativo',
  sort_order: '0',
}

const productSchema = z.object({
  name: z.string().trim().min(3, 'Nome muito curto'),
  description: z.string().trim().min(5, 'Descrição necessária'),
  link: z.string().trim().url('URL inválida'),
  category: z.string().trim().min(2, 'Categoria obrigatória'),
  target_roles: z.array(z.enum(['vendedor', 'gerente', 'dono'])).min(1, 'Selecione ao menos um público'),
  status: z.enum(['ativo', 'rascunho', 'arquivado']),
  sort_order: z.coerce.number().int().min(0).max(999),
})

function normalizeProduct(product: ProductRecord): ProductRecord {
  return {
    ...product,
    category: product.category || 'Operacional',
    target_roles: product.target_roles?.length ? product.target_roles : ['vendedor', 'gerente', 'dono'],
    status: product.status || 'ativo',
    sort_order: product.sort_order ?? 0,
  }
}

function getAudienceForRole(role: UserRole | null): ProductAudience | null {
  if (role === 'vendedor' || role === 'gerente' || role === 'dono') return role
  return null
}

function isVisibleForRole(product: ProductRecord, role: UserRole | null, canManage: boolean) {
  if (canManage) return true
  if (product.status !== 'ativo') return false
  if (isPerfilInternoMx(role)) return true

  const audience = getAudienceForRole(role)
  if (!audience) return false
  return (product.target_roles || []).includes(audience)
}

function getStatusBadgeVariant(status: ProductStatus | null | undefined) {
  if (status === 'ativo') return 'success' as const
  if (status === 'rascunho') return 'warning' as const
  return 'ghost' as const
}

function getRoleLabel(role: ProductAudience) {
  return PRODUCT_AUDIENCES.find((item) => item.key === role)?.label || role
}

function toForm(product: ProductRecord): ProductForm {
  const normalized = normalizeProduct(product)
  return {
    name: normalized.name || '',
    description: normalized.description || '',
    link: normalized.link || '',
    category: normalized.category || 'Operacional',
    target_roles: normalized.target_roles || ['vendedor', 'gerente', 'dono'],
    status: normalized.status || 'ativo',
    sort_order: String(normalized.sort_order ?? 0),
  }
}

export default function ProdutosDigitais() {
  const { role } = useAuth()
  const canManage = isAdministradorMx(role)
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creatingDefaults, setCreatingDefaults] = useState(false)
  const [isRefetching, setIsRefetching] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null)
  const [form, setForm] = useState<ProductForm>(defaultForm)
  const [searchTerm, setSearchTerm] = useState('')
  const [audienceFilter, setAudienceFilter] = useState<ProductAudience | 'todos'>('todos')
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'todos'>(canManage ? 'todos' : 'ativo')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await supabase
        .from('produtos_digitais')
        .select('*')
        .order('created_at', { ascending: false })

      if (response.error) {
        toast.error(response.error.message)
        setProducts([])
        return
      }

      const normalized = ((response.data || []) as ProductRecord[])
        .map(normalizeProduct)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      setProducts(normalized)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const createDefaultProducts = async () => {
    if (!canManage || creatingDefaults) return

    const existingNames = new Set(products.map((product) => product.name.trim().toLowerCase()))
    const missingProducts = PRODUCT_DEFAULT_CATALOG.filter((product) => !existingNames.has(product.name.toLowerCase()))

    if (missingProducts.length === 0) {
      toast.success('Produtos padrão já estão cadastrados.')
      return
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mxperformance.vercel.app'
    const payload = missingProducts.map((product) => ({
      ...product,
      link: new URL(product.link, origin).toString(),
    }))

    setCreatingDefaults(true)
    const { error } = await supabase.from('produtos_digitais').insert(payload)
    setCreatingDefaults(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(`${missingProducts.length} produto(s) padrão criado(s).`)
    fetchProducts()
  }

  const openCreateForm = () => {
    setEditingProduct(null)
    setForm(defaultForm)
    setShowForm(true)
  }

  const openEditForm = (product: ProductRecord) => {
    setEditingProduct(product)
    setForm(toForm(product))
    setShowForm(true)
  }

  const toggleAudience = (audience: ProductAudience) => {
    setForm((current) => {
      const exists = current.target_roles.includes(audience)
      const next = exists
        ? current.target_roles.filter((item) => item !== audience)
        : [...current.target_roles, audience]
      return { ...current, target_roles: next }
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canManage) {
      toast.error('Apenas Administrador MX e Admin Master podem gerenciar produtos.')
      return
    }

    const result = productSchema.safeParse(form)
    if (!result.success) {
      toast.error(result.error.issues[0]?.message || 'Verifique os campos do produto.')
      return
    }

    const payload = {
      name: result.data.name,
      description: result.data.description,
      link: result.data.link,
      category: result.data.category,
      target_roles: result.data.target_roles,
      status: result.data.status,
      sort_order: result.data.sort_order,
    }

    setSaving(true)
    const response = editingProduct
      ? await supabase.from('produtos_digitais').update(payload).eq('id', editingProduct.id)
      : await supabase.from('produtos_digitais').insert(payload)
    setSaving(false)

    if (response.error) {
      toast.error(response.error.message)
      return
    }

    toast.success(editingProduct ? 'Produto atualizado.' : 'Produto criado.')
    setShowForm(false)
    setEditingProduct(null)
    setForm(defaultForm)
    fetchProducts()
  }

  const handleDelete = async (product: ProductRecord) => {
    if (!canManage) {
      toast.error('Permissão negada.')
      return
    }
    const confirmed = window.confirm(`Excluir o produto "${product.name}"?`)
    if (!confirmed) return

    const { error } = await supabase.from('produtos_digitais').delete().eq('id', product.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Produto excluído.')
    fetchProducts()
  }

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return products
      .filter((product) => isVisibleForRole(product, role, canManage))
      .filter((product) => statusFilter === 'todos' || product.status === statusFilter)
      .filter((product) => audienceFilter === 'todos' || (product.target_roles || []).includes(audienceFilter))
      .filter((product) => {
        if (!term) return true
        return [
          product.name,
          product.description,
          product.category,
          product.link,
          ...(product.target_roles || []),
        ].some((value) => String(value || '').toLowerCase().includes(term))
      })
  }, [audienceFilter, canManage, products, role, searchTerm, statusFilter])

  const metrics = useMemo(() => {
    const visible = products.filter((product) => isVisibleForRole(product, role, canManage))
    return {
      total: visible.length,
      ativos: visible.filter((product) => product.status === 'ativo').length,
      vendedores: visible.filter((product) => product.target_roles?.includes('vendedor')).length,
      gerentes: visible.filter((product) => product.target_roles?.includes('gerente')).length,
      donos: visible.filter((product) => product.target_roles?.includes('dono')).length,
    }
  }, [canManage, products, role])

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
        <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
        <Typography variant="caption" tone="muted" className="animate-pulse">
          Sincronizando produtos...
        </Typography>
      </div>
    )
  }

  return (
    <main className="w-full h-full flex flex-col gap-mx-md sm:gap-mx-lg p-mx-sm sm:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      <header className="flex flex-col xl:flex-row xl:items-start justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
        <div className="flex min-w-0 flex-col gap-mx-tiny">
          <div className="flex items-center gap-mx-sm">
            <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
            <Typography variant="h1" className="min-w-0">
              Produtos <span className="text-mx-green-700">Digitais</span>
            </Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">
            CATÁLOGO POR PÚBLICO • VENDEDORES, GERENTES E DONOS
          </Typography>
        </div>

        <div className="grid w-full grid-cols-2 gap-mx-xs sm:grid-cols-5 xl:max-w-3xl">
          {[
            ['Total', metrics.total],
            ['Ativos', metrics.ativos],
            ['Vendedores', metrics.vendedores],
            ['Gerentes', metrics.gerentes],
            ['Donos', metrics.donos],
          ].map(([label, value]) => (
            <Card key={label} className="min-w-0 border-none bg-white p-mx-sm text-center shadow-mx-md">
              <Typography variant="tiny" tone="muted" className="block text-mx-micro leading-tight tracking-widest">
                {label}
              </Typography>
              <Typography variant="h2" className="mt-1 text-2xl">{value}</Typography>
            </Card>
          ))}
        </div>
      </header>

      <Card className="border-none bg-white p-mx-sm sm:p-mx-md shadow-mx-md">
        <div className="flex flex-col gap-mx-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-1 gap-mx-xs sm:grid-cols-3 lg:flex lg:flex-wrap">
            <Select
              id="product-audience-filter"
              value={audienceFilter}
              onChange={(event) => setAudienceFilter(event.target.value as ProductAudience | 'todos')}
              aria-label="Filtrar por público"
              className="!h-mx-10 !py-1.5 text-xs uppercase tracking-widest"
            >
              <option value="todos">Todos os públicos</option>
              {PRODUCT_AUDIENCES.map((audience) => (
                <option key={audience.key} value={audience.key}>{audience.label}</option>
              ))}
            </Select>
            {canManage && (
              <Select
                id="product-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ProductStatus | 'todos')}
                aria-label="Filtrar por status"
                className="!h-mx-10 !py-1.5 text-xs uppercase tracking-widest"
              >
                <option value="todos">Todos os status</option>
                {PRODUCT_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </Select>
            )}
            <div className="relative min-w-0 sm:col-span-1 lg:w-mx-sidebar-expanded">
              <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
              <Input
                placeholder="BUSCAR PRODUTO..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="!h-mx-10 !pl-11 !text-mx-tiny uppercase tracking-widest"
              />
            </div>
          </div>

          <div className="order-first grid grid-cols-[auto_1fr] gap-mx-xs sm:flex sm:justify-end lg:order-none">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setIsRefetching(true)
                fetchProducts().finally(() => setIsRefetching(false))
              }}
              aria-label="Atualizar produtos"
              className="rounded-mx-xl bg-white"
            >
              <RefreshCw size={18} className={cn(isRefetching && 'animate-spin')} />
            </Button>
            {canManage && (
              <div className="flex min-w-0 flex-col gap-mx-xs sm:flex-row">
                {PRODUCT_DEFAULT_CATALOG.some(
                  (item) => !products.some((product) => product.name.trim().toLowerCase() === item.name.toLowerCase()),
                ) && (
                  <Button
                    variant="outline"
                    onClick={createDefaultProducts}
                    disabled={creatingDefaults}
                    className="rounded-mx-xl bg-white text-mx-micro font-black uppercase tracking-widest"
                  >
                    <Package size={16} className="mr-2" />
                    {creatingDefaults ? 'CRIANDO...' : 'CRIAR PADRÃO'}
                  </Button>
                )}
                <Button onClick={openCreateForm} className="bg-brand-secondary">
                  <Plus size={18} className="mr-2" /> NOVO PRODUTO
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {!canManage && (
        <Card className="border-none bg-brand-primary/5 p-mx-md shadow-mx-sm">
          <Typography variant="tiny" tone="muted" className="uppercase tracking-widest">
            Você está vendo apenas produtos ativos liberados para o seu público.
          </Typography>
        </Card>
      )}

      <section className="flex-1 min-h-0 pb-32" aria-live="polite">
        {filteredProducts.length === 0 ? (
          <Card className="border-none bg-white shadow-mx-md">
            <EmptyState
              size="lg"
              icon={<Package />}
              title="Nenhum produto encontrado"
              description={canManage ? 'Crie ou ajuste os filtros do catálogo.' : 'Nenhum produto ativo foi liberado para o seu público.'}
            />
            {canManage && products.length === 0 && (
              <div className="flex justify-center px-mx-md pb-mx-lg">
                <Button onClick={createDefaultProducts} disabled={creatingDefaults} className="bg-brand-secondary">
                  <Package size={18} className="mr-2" />
                  {creatingDefaults ? 'CRIANDO PRODUTOS...' : 'CRIAR PRODUTOS PADRÃO'}
                </Button>
              </div>
            )}
          </Card>
        ) : (
          <ul role="list" className="grid grid-cols-1 gap-mx-md sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, index) => (
                <motion.li
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card className="h-full border-none bg-white p-mx-md shadow-mx-md transition-all hover:shadow-mx-xl">
                    <div className="flex h-full flex-col gap-mx-md">
                      <header className="flex items-start justify-between gap-mx-md border-b border-border-default pb-mx-md">
                        <div className="flex items-start gap-mx-sm min-w-0">
                          <div className="w-mx-12 h-mx-12 rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center shrink-0">
                            <Package size={22} className="text-brand-primary" />
                          </div>
                          <div className="min-w-0">
                            <Typography variant="h3" className="text-base uppercase tracking-tight line-clamp-2">
                              {product.name}
                            </Typography>
                            <Typography variant="tiny" tone="muted" className="mt-1 block uppercase tracking-widest">
                              {product.category}
                            </Typography>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(product.status)} className="shrink-0 text-mx-micro">
                          {product.status || 'ativo'}
                        </Badge>
                      </header>

                      <Typography variant="p" tone="muted" className="text-xs font-bold leading-relaxed line-clamp-4">
                        {product.description}
                      </Typography>

                      <div className="flex flex-wrap gap-mx-xs">
                        {(product.target_roles || []).map((audience) => (
                          <Badge key={audience} variant="outline" className="text-mx-nano">
                            {getRoleLabel(audience)}
                          </Badge>
                        ))}
                      </div>

                      <footer className="mt-auto flex flex-col gap-mx-sm border-t border-border-default pt-mx-md">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-mx-xs">
                            <div className="w-mx-lg h-mx-lg rounded-mx-lg bg-surface-alt flex items-center justify-center text-text-tertiary" aria-hidden="true">
                              <Smartphone size={14} />
                            </div>
                            <div className="w-mx-lg h-mx-lg rounded-mx-lg bg-surface-alt flex items-center justify-center text-text-tertiary" aria-hidden="true">
                              <Globe size={14} />
                            </div>
                          </div>
                          <Typography variant="caption" tone="muted" className="text-mx-micro font-black uppercase">
                            Ordem {product.sort_order ?? 0}
                          </Typography>
                        </div>

                        <div className="grid grid-cols-1 gap-mx-xs">
                          <Button
                            variant="outline"
                            className="w-full rounded-mx-xl text-mx-micro font-black uppercase tracking-widest"
                            onClick={() => window.open(product.link, '_blank', 'noopener,noreferrer')}
                          >
                            ACESSAR PRODUTO <ExternalLink size={14} className="ml-2" />
                          </Button>
                          {canManage && (
                            <div className="grid grid-cols-2 gap-mx-xs">
                              <Button variant="ghost" size="sm" onClick={() => openEditForm(product)} className="text-brand-primary">
                                <Edit3 size={14} className="mr-2" /> EDITAR
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(product)} className="text-status-error">
                                <Trash2 size={14} className="mr-2" /> EXCLUIR
                              </Button>
                            </div>
                          )}
                        </div>
                      </footer>
                    </div>
                  </Card>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingProduct(null)
        }}
        title={editingProduct ? 'Editar Produto Digital' : 'Novo Produto Digital'}
        description="Defina acesso, público e dados comerciais do produto"
        size="2xl"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => {
              setShowForm(false)
              setEditingProduct(null)
            }}>
              CANCELAR
            </Button>
            <Button type="submit" form="digital-product-form" disabled={saving} className="bg-brand-secondary">
              {saving ? 'SALVANDO...' : editingProduct ? 'SALVAR ALTERAÇÕES' : 'CRIAR PRODUTO'}
            </Button>
          </>
        }
      >
        <form id="digital-product-form" onSubmit={handleSubmit} className="space-y-mx-lg">
          <div className="grid grid-cols-1 gap-mx-md sm:grid-cols-2">
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="product-name" variant="caption" className="font-black uppercase tracking-widest">
                Nome do produto *
              </Typography>
              <Input
                id="product-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ex: Método Vendedor Profissional"
                required
              />
            </div>
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="product-link" variant="caption" className="font-black uppercase tracking-widest">
                Link do produto *
              </Typography>
              <Input
                id="product-link"
                value={form.link}
                onChange={(event) => setForm((current) => ({ ...current, link: event.target.value }))}
                placeholder="https://..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-mx-md sm:grid-cols-3">
            <Select
              id="product-category"
              label="Categoria"
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
            >
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Select>
            <Select
              id="product-status"
              label="Status"
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ProductStatus }))}
            >
              <option value="ativo">Ativo</option>
              <option value="rascunho">Rascunho</option>
              <option value="arquivado">Arquivado</option>
            </Select>
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="product-sort-order" variant="caption" className="font-black uppercase tracking-widest">
                Ordem
              </Typography>
              <Input
                id="product-sort-order"
                type="number"
                min="0"
                max="999"
                value={form.sort_order}
                onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-mx-sm">
            <div className="flex items-center gap-mx-xs">
              <Users size={16} className="text-brand-primary" />
              <Typography variant="caption" className="font-black uppercase tracking-widest">
                Públicos onde aparece *
              </Typography>
            </div>
            <div className="grid grid-cols-1 gap-mx-xs sm:grid-cols-3">
              {PRODUCT_AUDIENCES.map((audience) => {
                const selected = form.target_roles.includes(audience.key)
                return (
                  <button
                    key={audience.key}
                    type="button"
                    onClick={() => toggleAudience(audience.key)}
                    className={cn(
                      'min-h-mx-20 rounded-mx-xl border p-mx-md text-left transition-all',
                      selected
                        ? 'border-brand-primary bg-brand-primary/10 text-text-primary shadow-mx-sm'
                        : 'border-border-default bg-surface-alt text-text-secondary hover:border-brand-primary/30',
                    )}
                  >
                    <span className="block text-xs font-black uppercase tracking-widest">{audience.label}</span>
                    <span className="mt-1 block text-mx-tiny font-bold uppercase tracking-widest text-text-tertiary">{audience.description}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-mx-xs">
            <Typography as="label" htmlFor="product-description" variant="caption" className="font-black uppercase tracking-widest">
              Descrição *
            </Typography>
            <Textarea
              id="product-description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Descreva o produto, objetivo e quando deve ser usado."
              className="min-h-mx-32"
              required
            />
          </div>

          {editingProduct?.status === 'arquivado' && (
            <Card className="border-none bg-status-warning/10 p-mx-md shadow-none">
              <div className="flex items-center gap-mx-sm">
                <Archive size={18} className="text-status-warning" />
                <Typography variant="tiny" className="font-black uppercase tracking-widest text-text-secondary">
                  Produto arquivado não aparece para vendedores, gerentes ou donos.
                </Typography>
              </div>
            </Card>
          )}

          <Card className="border-none bg-surface-alt p-mx-md shadow-none">
            <div className="flex items-start gap-mx-sm">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand-primary" />
              <Typography variant="tiny" tone="muted" className="uppercase tracking-widest">
                Administrador MX e Admin Master podem criar, editar, excluir, arquivar e alterar o público de exibição.
              </Typography>
            </div>
          </Card>
        </form>
      </Modal>
    </main>
  )
}
