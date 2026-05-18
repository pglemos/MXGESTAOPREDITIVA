import { useTeam, useStores, type TeamMember } from '@/hooks/useTeam'
import { UserCreationModal } from '@/features/equipe/components/UserCreationModal'
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
    Users, UserPlus, Search, Phone, Shield, Mail, User, Trash2, Save,
    RefreshCw, X, TrendingUp, Zap,
    ShieldAlert, Clock, ShieldCheck,
    Settings2, Power, Copy, Link2, ClipboardList, BriefcaseBusiness, Check, Ban
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn, getPreRegistrationLink } from '@/lib/utils'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { Typography } from '@/components/atoms/Typography'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Input } from '@/components/atoms/Input'
import { Avatar } from '@/components/atoms/Avatar'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { PageHeader } from '@/components/molecules/PageHeader'
import { Link } from 'react-router-dom'
import { isAdministradorMx, isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { canManageTeam } from '@/lib/auth/capabilities'
import { getSupabaseFunctionUrl, supabase } from '@/lib/supabase'
import type { MembershipRole, StorePreRegistration } from '@/types/database'

type StoreTeamPanelProps = {
  storeId: string | null
  storeName?: string
}

type EditableTeamMember = TeamMember & {
  previous_store_id?: string | null
}

type PendingConfirmation = {
  key: string
  title: string
  description: string
  label: string
  onConfirm: () => void
}

const getDeleteMemberConfirmationKey = (member: TeamMember | EditableTeamMember) => `delete-member:${member.id}:${member.store_id || 'sem-loja'}`
const getPreRegistrationConfirmationKey = (item: StorePreRegistration) => `pre-registration:${item.id}`

export function StoreTeamPanel({ storeId, storeName }: StoreTeamPanelProps) {
  const { role } = useAuth()
  const canManageTeamMembers = canManageTeam(role)
  const canApprovePreRegistrations = isAdministradorMx(role)
  const canSharePreRegistrationLink = isAdministradorMx(role)
  const canCreateMembers = canManageTeamMembers
  const { lojas } = useStores()
  const editableStoreRoles = useMemo<MembershipRole[]>(() => {
    if (role === 'gerente') return ['vendedor']
    if (role === 'dono') return ['gerente', 'vendedor']
    return ['dono', 'gerente', 'vendedor']
  }, [role])

  const { team, loading, error: teamError, refetch, updateTeamMember, deleteTeamMember, registerUser } = useTeam(storeId || undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingMember, setEditingMember] = useState<EditableTeamMember | null>(null)
  const [saving, setSaving] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isRefetching, setIsRefetching] = useState(false)
  const [preRegistrations, setPreRegistrations] = useState<StorePreRegistration[]>([])
  const [loadingPreRegistrations, setLoadingPreRegistrations] = useState(false)
  const [reviewingPreRegistrationId, setReviewingPreRegistrationId] = useState<string | null>(null)
  const [pendingConfirmations, setPendingConfirmations] = useState<Set<string>>(() => new Set())
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null)
  const [expandedPreRegistrations, setExpandedPreRegistrations] = useState<Set<string>>(() => new Set())
  const approvalFunctionUrl = useMemo(() => getSupabaseFunctionUrl('approve-store-registration'), [])

  const registrationLink = useMemo(() => {
    if (!storeName) return ''
    return getPreRegistrationLink(storeName)
  }, [storeName])

  const handleCopyRegistrationLink = useCallback(async () => {
    if (!canSharePreRegistrationLink || !registrationLink) return
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard indisponível.')
      await navigator.clipboard.writeText(registrationLink)
      toast.success('Link de pré-cadastro copiado.')
    } catch {
      toast.error('Não foi possível copiar o link. Copie manualmente pela barra do navegador.')
    }
  }, [canSharePreRegistrationLink, registrationLink])

  const fetchPreRegistrations = useCallback(async () => {
    if (!storeId) return
    setLoadingPreRegistrations(true)
    try {
      const { data, error } = canApprovePreRegistrations
        ? await supabase
          .from('pre_cadastros_loja')
          .select('id, store_id, store_name_snapshot, auth_user_id, full_name, email, phone, role, segment, store_tenure, market_experience, notes, company_legal_name, company_cnpj, company_address, company_administrative_phone, avatar_url, avatar_storage_path, status, submitted_at, reviewed_by, reviewed_at, approved_by, approved_at, rejected_by, rejected_at, approval_note')
          .eq('store_id', storeId)
          .order('submitted_at', { ascending: false })
          .limit(20)
        : { data: [], error: null }

      if (error) throw error
      setPreRegistrations((data || []) as StorePreRegistration[])
    } catch {
      toast.error('Não foi possível carregar os pré-cadastros.')
      setPreRegistrations([])
    } finally {
      setLoadingPreRegistrations(false)
    }
  }, [canApprovePreRegistrations, storeId])

  useEffect(() => {
    fetchPreRegistrations()
  }, [fetchPreRegistrations])

  const clearPendingConfirmation = useCallback((key: string) => {
    setPendingConfirmations((current) => {
      const next = new Set(current)
      next.delete(key)
      return next
    })
    setPendingConfirmation(current => current?.key === key ? null : current)
  }, [])

  const requestConfirmation = useCallback((input: {
    key: string
    title: string
    description: string
    label: string
    onConfirm: () => void
  }) => {
    if (pendingConfirmations.has(input.key)) {
      toast.info('Confirmação já aberta para este item.')
      return
    }

    setPendingConfirmations((current) => new Set(current).add(input.key))
    setPendingConfirmation(input)
  }, [pendingConfirmations])

  useEffect(() => {
    if (!pendingConfirmation) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') clearPendingConfirmation(pendingConfirmation.key)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [clearPendingConfirmation, pendingConfirmation])

  const togglePreRegistrationDetails = useCallback((id: string) => {
    setExpandedPreRegistrations(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const redactEmail = useCallback((email: string) => {
    const [local, domain] = email.split('@')
    if (!local || !domain) return 'e-mail oculto'
    return `${local.slice(0, 2)}***@${domain}`
  }, [])

  const redactPhone = useCallback((phone?: string | null) => {
    const digits = (phone || '').replace(/\D/g, '')
    if (digits.length < 4) return 'telefone oculto'
    return `***${digits.slice(-4)}`
  }, [])

  const filteredTeam = useMemo(() => {
    return (team || []).filter(m =>
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [team, searchTerm])

  const stats = useMemo(() => {
    const total = (team || []).length;
    const leaders = (team || []).filter(m => isPerfilInternoMx(m.role) || m.role === 'dono' || m.role === 'gerente');
    const activeMembers = (team || []).filter(m => m.active !== false && m.is_active !== false);

    return [
        { label: 'Integrantes', shortLabel: 'Int.', value: total, icon: Users, tone: 'brand', color: 'from-brand-primary/20 to-brand-primary/5' },
        { label: 'Ativos', shortLabel: 'Atv.', value: activeMembers.length, icon: Zap, tone: 'success', color: 'from-status-success-surface to-transparent' },
        { label: 'Inativos', shortLabel: 'Inat.', value: total - activeMembers.length, icon: Clock, tone: 'error', color: 'from-status-error-surface to-transparent' },
        { label: 'Líderes', shortLabel: 'Líd.', value: leaders.length, icon: Shield, tone: 'warning', color: 'from-status-warning-surface to-transparent' },
    ];
  }, [team])

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMember) return
    const memberStoreId = editingMember.store_id || storeId
    if (!memberStoreId && !isPerfilInternoMx(editingMember.role)) {
      toast.error('Selecione a loja do integrante.')
      return
    }

    setSaving(true)
    try {
      const { error } = await updateTeamMember(editingMember.id, {
        name: editingMember.name,
        email: editingMember.email,
        phone: editingMember.phone,
        role: editingMember.role,
        active: editingMember.active,
        store_id: memberStoreId,
        previous_store_id: editingMember.previous_store_id || editingMember.store_id || storeId,
        started_at: editingMember.started_at,
        ended_at: editingMember.ended_at,
        is_active: editingMember.active === false ? false : editingMember.is_active,
        closing_month_grace: editingMember.closing_month_grace,
        is_venda_loja: editingMember.is_venda_loja
      })
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Integrante atualizado.')
      setEditingMember(null)
      await refetch()
    } finally {
      setSaving(false)
    }
  }

  const executeDeleteMember = useCallback(async (member: TeamMember | EditableTeamMember) => {
    if (!canManageTeamMembers) return
    const memberStoreId = member.store_id || storeId

    setSaving(true)
    try {
      const { error } = await deleteTeamMember(member.id, memberStoreId)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Vínculo encerrado.')
      setEditingMember(null)
      await refetch()
    } finally {
      setSaving(false)
    }
  }, [canManageTeamMembers, deleteTeamMember, refetch, storeId])

  const handleDeleteMember = useCallback((member: TeamMember | EditableTeamMember) => {
    if (!canManageTeamMembers) return
    const memberStoreId = member.store_id || storeId
    requestConfirmation({
      key: getDeleteMemberConfirmationKey(member),
      title: `Remover ${member.name} da equipe?`,
      description: `${memberStoreId ? 'O vínculo desta loja será encerrado.' : 'O vínculo selecionado será encerrado.'} O login não será desativado automaticamente.`,
      label: 'Remover',
      onConfirm: () => void executeDeleteMember(member),
    })
  }, [canManageTeamMembers, executeDeleteMember, requestConfirmation, storeId])

  const getVigenciaStatus = (m: TeamMember) => {
    const today = new Date().toISOString().slice(0, 10)
    if (!m.is_active) return { label: 'INATIVO', variant: 'outline' as const, color: 'text-text-tertiary border-border-default bg-surface-alt' }
    if (m.ended_at && m.ended_at.slice(0, 10) < today) return { label: 'ENCERRADO', variant: 'danger' as const, color: 'text-status-error border-status-error/10 bg-status-error-surface' }
    return { label: 'ATIVO', variant: 'success' as const, color: 'text-status-success border-status-success/10 bg-status-success-surface' }
  }

  const handleRefresh = useCallback(async () => {
    setIsRefetching(true)
    try {
      await Promise.all([refetch(), fetchPreRegistrations()])
    } catch {
      toast.error('Não foi possível atualizar a equipe.')
    } finally {
      setIsRefetching(false)
    }
  }, [fetchPreRegistrations, refetch])

  const executeReviewPreRegistration = useCallback(async (item: StorePreRegistration, action: 'approve' | 'reject') => {
    if (!canApprovePreRegistrations) return

    setReviewingPreRegistrationId(item.id)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        toast.error('Sessão expirada. Entre novamente.')
        return
      }

      const response = await fetch(approvalFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pre_registration_id: item.id,
          action,
          role: item.role,
        }),
      })
      const payload = await response.json().catch(() => null) as { success?: boolean; error?: string; temporary_password?: unknown } | null
      if (!payload) throw new Error('Não foi possível interpretar a resposta da aprovação.')
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Não foi possível revisar o login.')

      const temporaryPassword = typeof payload.temporary_password === 'string' ? payload.temporary_password : ''
      if (action === 'approve' && temporaryPassword) {
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(temporaryPassword)
            toast.success('Login aprovado. Senha temporária copiada para a área de transferência.')
          } else {
            toast.success('Login aprovado. Gere uma nova senha temporária em caso de perda.')
          }
        } catch {
          toast.success('Login aprovado. Gere uma nova senha temporária em caso de perda.')
        }
      } else {
        toast.success(action === 'approve' ? 'Login aprovado e sincronizado.' : 'Login rejeitado.')
      }
      await Promise.all([refetch(), fetchPreRegistrations()])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao revisar login.')
    } finally {
      setReviewingPreRegistrationId(null)
    }
  }, [approvalFunctionUrl, canApprovePreRegistrations, fetchPreRegistrations, refetch])

  const handleReviewPreRegistration = useCallback((item: StorePreRegistration, action: 'approve' | 'reject') => {
    if (!canApprovePreRegistrations) return
    requestConfirmation({
      key: getPreRegistrationConfirmationKey(item),
      title: `${action === 'approve' ? 'Aprovar' : 'Rejeitar'} login de ${item.full_name}?`,
      description: `Solicitação de ${item.role} para ${item.store_name_snapshot}.`,
      label: action === 'approve' ? 'Aprovar' : 'Rejeitar',
      onConfirm: () => void executeReviewPreRegistration(item, action),
    })
  }, [canApprovePreRegistrations, executeReviewPreRegistration, requestConfirmation])

  if (!storeId) return (
    <section className="w-full rounded-mx-3xl border border-border-default bg-white p-mx-xl text-center shadow-mx-sm">
      <Typography variant="h2" className="uppercase tracking-tight">Selecione uma loja</Typography>
      <Typography variant="caption" tone="muted" className="mt-2 block uppercase tracking-widest font-black">
        A equipe agora é administrada dentro do dashboard operacional de cada loja.
      </Typography>
    </section>
  )

  if (loading) return (
    <section className="w-full flex flex-col gap-mx-lg animate-in fade-in duration-500 overflow-hidden">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
            <div className="space-y-mx-xs">
                <Skeleton className="h-mx-10 w-mx-64" />
                <div className="flex gap-mx-sm">
                  <Skeleton className="h-mx-xs w-mx-48" />
                  <Skeleton className="h-mx-xs w-mx-32 opacity-50" />
                </div>
            </div>
            <div className="flex gap-mx-sm">
                <Skeleton className="h-mx-14 w-mx-14 rounded-mx-xl" />
                <Skeleton className="h-mx-14 w-mx-48 rounded-mx-xl" />
            </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
            <Skeleton className="h-mx-24 rounded-mx-4xl" />
            <Skeleton className="h-mx-24 rounded-mx-4xl" />
            <Skeleton className="h-mx-24 rounded-mx-4xl" />
            <Skeleton className="h-mx-24 rounded-mx-4xl" />
        </div>

        <div className="flex-1 mt-mx-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg">
                {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className="h-mx-96 rounded-mx-4xl bg-white/50 border-2 border-dashed border-border-default flex flex-col items-center justify-center p-mx-xl">
                        <Skeleton className="w-mx-24 h-mx-24 rounded-mx-4xl mb-6" />
                        <Skeleton className="h-mx-sm w-full mb-2" />
                        <Skeleton className="h-mx-xs w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    </section>
  )

  return (
    <section className="w-full flex flex-col gap-mx-lg relative">
        <>
          <AnimatePresence>
            {pendingConfirmation && (
              <div className="fixed inset-0 z-[140] flex items-center justify-center p-mx-md" role="presentation">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-mx-black/60 backdrop-blur-md"
                  onClick={() => clearPendingConfirmation(pendingConfirmation.key)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 12 }}
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="team-confirm-title"
                  aria-describedby="team-confirm-description"
                  className="relative z-10 w-full max-w-md rounded-mx-3xl border border-border-default bg-white p-mx-xl shadow-mx-elite"
                >
                  <Typography id="team-confirm-title" variant="h2" className="font-black uppercase tracking-tight text-text-primary">
                    {pendingConfirmation.title}
                  </Typography>
                  <Typography id="team-confirm-description" variant="caption" tone="muted" className="mt-mx-sm block font-bold leading-relaxed">
                    {pendingConfirmation.description}
                  </Typography>
                  <div className="mt-mx-xl flex flex-col-reverse sm:flex-row gap-mx-sm sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => clearPendingConfirmation(pendingConfirmation.key)}
                      className="h-mx-12 rounded-mx-xl font-black uppercase tracking-widest text-mx-nano"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => {
                        const action = pendingConfirmation.onConfirm
                        clearPendingConfirmation(pendingConfirmation.key)
                        action()
                      }}
                      className="h-mx-12 rounded-mx-xl font-black uppercase tracking-widest text-mx-nano"
                    >
                      {pendingConfirmation.label}
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <PageHeader
            title="Equipe da Loja"
            description={`Criar, editar e remover integrantes vinculados à loja ${storeName || ''}`.trim()}
            actions={
              <div className="flex flex-col sm:flex-row items-center gap-mx-sm w-full lg:w-auto">
                <div className="relative group w-full sm:w-mx-96">
                  <label htmlFor="search-specialist" className="sr-only">Buscar integrante da equipe</label>
                  <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                  <Input
                    id="search-specialist"
                    name="search-specialist"
                    placeholder="Buscar por nome ou perfil"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="!pl-12 !h-mx-14 uppercase font-black tracking-widest text-mx-tiny"
                  />
                </div>
                <div className="flex w-full sm:w-auto gap-mx-sm">
                  <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={handleRefresh}
                      aria-label="Atualizar equipe e pré-cadastros"
                      className="w-mx-14 h-mx-14 rounded-mx-xl bg-white shadow-mx-sm border-border-default shrink-0"
                  >
                    <RefreshCw size={20} aria-hidden="true" className={cn(isRefetching && "animate-spin")} />
                  </Button>
                  {canCreateMembers && (
                    <Button
                      onClick={() => setIsUserModalOpen(true)}
                      className="flex-1 sm:flex-none h-mx-14 px-8 rounded-mx-xl font-black uppercase tracking-widest text-mx-tiny shadow-mx-lg"
                    >
                      <UserPlus size={18} className="mr-2" /> NOVO INTEGRANTE
                    </Button>
                  )}
                </div>
              </div>
            }
          />

          <div className="grid grid-cols-4 gap-mx-xs md:gap-mx-lg shrink-0 mt-mx-md">
            {stats.map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-mx-xs sm:p-mx-lg rounded-mx-2xl sm:rounded-mx-4xl bg-white border border-border-default relative overflow-hidden group shadow-mx-lg hover:shadow-mx-xl transition-all h-mx-16 sm:h-mx-24 flex items-center"
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 group-hover:opacity-70 transition-opacity", item.color)} />
                <div className="flex items-center justify-between relative z-10 w-full">
                  <div className="space-y-0.5 min-w-0">
                    <Typography variant="tiny" tone="muted" className="block uppercase tracking-mx-widest font-black text-mx-nano opacity-60 truncate">
                      <span className="sm:hidden">{item.shortLabel}</span>
                      <span className="hidden sm:inline">{item.label}</span>
                    </Typography>
                    <Typography variant="h1" className="text-2xl sm:text-3xl font-black tabular-nums leading-none font-mono-numbers">{item.value}</Typography>
                  </div>
                  <div className={cn(
                    "hidden sm:flex w-mx-12 h-mx-12 rounded-mx-2xl items-center justify-center bg-white shadow-mx-md border border-border-default text-text-tertiary transition-all group-hover:rotate-6 group-hover:border-brand-primary/20 group-hover:text-brand-primary",
                    item.tone === 'brand' && "text-brand-primary"
                  )}>
                    <item.icon size={20} strokeWidth={2} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid mx-team-layout-grid gap-mx-lg items-start mt-mx-32 sm:mt-mx-md">

          {canSharePreRegistrationLink ? (
          <aside className="order-2 min-w-0 xl:sticky xl:top-[var(--spacing-mx-layout-offset-top)]">
          <Card className="border border-border-default bg-white shadow-mx-sm overflow-hidden rounded-mx-3xl">
            <CardHeader className="border-b border-border-default bg-surface-alt/60 p-mx-md">
              <div className="flex flex-col gap-mx-md">
                <div className="flex items-start gap-mx-sm min-w-0">
                  <div className="w-mx-12 h-mx-12 rounded-mx-2xl bg-brand-primary/10 border border-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                    <ClipboardList size={22} />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-lg">Pré-cadastros</CardTitle>
                    <CardDescription>Fila de entrada e histórico de solicitações da loja.</CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleCopyRegistrationLink()}
                  className="h-mx-12 rounded-mx-xl bg-white w-full"
                  disabled={!registrationLink}
                >
                  <Copy size={16} className="mr-2" />
                  COPIAR LINK
                </Button>
              </div>
              <div className="mt-mx-md flex items-center gap-mx-xs rounded-mx-xl border border-border-default bg-white px-mx-md py-mx-sm text-mx-tiny font-bold text-text-secondary min-w-0">
                <Link2 size={14} className="text-brand-primary shrink-0" />
                <span className="truncate">{registrationLink || 'Link indisponível até a loja ser identificada'}</span>
              </div>
            </CardHeader>

            <CardContent className="p-mx-md mx-pre-registration-scroll">
              {!canApprovePreRegistrations ? (
                <div className="rounded-mx-2xl border border-dashed border-border-default bg-surface-alt p-mx-lg text-center">
                  <ShieldCheck size={24} className="mx-auto text-brand-primary" />
                  <Typography variant="caption" className="mt-mx-sm block font-black uppercase tracking-widest">Aprovação restrita ao Admin MX</Typography>
                  <Typography variant="tiny" tone="muted" className="mt-2 block font-bold">A loja pode compartilhar o link; a fila de validação fica visível apenas para Admin MX e MX Master.</Typography>
                </div>
              ) : loadingPreRegistrations ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-md">
                  <Skeleton className="h-mx-32 rounded-mx-2xl" />
                  <Skeleton className="h-mx-32 rounded-mx-2xl" />
                </div>
              ) : preRegistrations.length > 0 ? (
                <div className="grid grid-cols-1 gap-mx-sm">
                  {preRegistrations.map(item => {
                    const detailsExpanded = expandedPreRegistrations.has(item.id)
                    return (
                    <div key={item.id} className="rounded-mx-2xl border border-border-default bg-surface-alt p-mx-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-mx-sm">
                        <div className="flex items-start gap-mx-sm min-w-0">
                          <div className="h-mx-14 w-mx-14 overflow-hidden rounded-mx-2xl border border-border-default bg-white shrink-0">
                            {item.avatar_url ? (
                              <img src={item.avatar_url} alt={item.full_name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-brand-primary"><User size={20} /></div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <Typography variant="caption" className="block max-w-full font-black uppercase tracking-tight truncate">{item.full_name}</Typography>
                            <div className="mt-1 flex flex-wrap gap-x-mx-md gap-y-mx-tiny text-mx-micro font-bold text-text-tertiary">
                              <span className="inline-flex items-center gap-mx-tiny"><Mail size={11} aria-hidden="true" />{detailsExpanded ? item.email : redactEmail(item.email)}</span>
                              <span className="inline-flex items-center gap-mx-tiny"><Phone size={11} aria-hidden="true" />{detailsExpanded ? item.phone : redactPhone(item.phone)}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant={item.status === 'pending' ? 'warning' : item.status === 'synced' ? 'success' : 'outline'} className="font-black uppercase shrink-0">
                          {item.status}
                        </Badge>
                      </div>
                      <div className="mt-mx-md grid grid-cols-1 sm:grid-cols-3 gap-mx-sm text-mx-tiny font-black uppercase">
                        <div>
                          <span className="block text-mx-nano text-text-tertiary tracking-mx-widest">Papel</span>
                          {item.role}
                        </div>
                        <div>
                          <span className="block text-mx-nano text-text-tertiary tracking-mx-widest">Na loja</span>
                          {item.store_tenure}
                        </div>
                        <div>
                          <span className="block text-mx-nano text-text-tertiary tracking-mx-widest">Mercado</span>
                          {item.market_experience}
                        </div>
                      </div>
                      <div className="mt-mx-sm flex items-center gap-mx-xs text-mx-tiny font-bold text-text-secondary">
                        <BriefcaseBusiness size={13} className="text-brand-primary" />
                        <span>{item.segment}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => togglePreRegistrationDetails(item.id)}
                        className="mt-mx-sm h-mx-9 rounded-mx-lg px-mx-sm text-mx-nano font-black uppercase tracking-widest text-brand-primary"
                        aria-expanded={detailsExpanded}
                      >
                        {detailsExpanded ? 'Ocultar dados sensíveis' : 'Ver dados sensíveis'}
                      </Button>
                      {item.role === 'dono' && detailsExpanded && (
                        <div className="mt-mx-sm rounded-mx-xl border border-brand-primary/15 bg-white p-mx-sm">
                          <Typography variant="tiny" tone="brand" className="mb-mx-xs block font-black uppercase tracking-widest">
                            Dados administrativos
                          </Typography>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-xs text-mx-micro font-bold text-text-secondary">
                            <span><b>Razão:</b> {item.company_legal_name || 'não informado'}</span>
                            <span><b>CNPJ:</b> {item.company_cnpj || 'não informado'}</span>
                            <span><b>Telefone:</b> {item.company_administrative_phone || 'não informado'}</span>
                            <span><b>Endereço:</b> {item.company_address || 'não informado'}</span>
                          </div>
                        </div>
                      )}
                      {item.notes && detailsExpanded && (
                        <Typography variant="tiny" tone="muted" className="mt-mx-sm block font-bold leading-relaxed">
                          {item.notes}
                        </Typography>
                      )}
                      {item.status === 'pending' && (
                        <div className="mt-mx-md flex flex-col sm:flex-row gap-mx-xs">
                          <Button
                            type="button"
                            onClick={() => handleReviewPreRegistration(item, 'approve')}
                            disabled={reviewingPreRegistrationId === item.id || pendingConfirmations.has(getPreRegistrationConfirmationKey(item))}
                            className="h-mx-11 rounded-mx-xl font-black uppercase tracking-widest text-mx-nano"
                          >
                            <Check size={15} className="mr-2" />
                            Aprovar login
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleReviewPreRegistration(item, 'reject')}
                            disabled={reviewingPreRegistrationId === item.id || pendingConfirmations.has(getPreRegistrationConfirmationKey(item))}
                            className="h-mx-11 rounded-mx-xl font-black uppercase tracking-widest text-mx-nano text-status-error hover:bg-status-error-surface"
                          >
                            <Ban size={15} className="mr-2" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              ) : (
                <div className="rounded-mx-2xl border border-dashed border-border-default bg-surface-alt p-mx-lg text-center">
                  <Typography variant="caption" className="font-black uppercase tracking-widest">Nenhum pré-cadastro recebido</Typography>
                  <Typography variant="tiny" tone="muted" className="mt-2 block font-bold">Assim que alguém preencher o link da loja, os dados aparecem aqui.</Typography>
                </div>
              )}
            </CardContent>
          </Card>
          </aside>
          ) : null}

          <section className="order-1 min-w-0 pb-24">
            {teamError ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[40vh] space-y-mx-lg text-center border-2 border-dashed border-status-error/20 rounded-mx-4xl bg-status-error-surface/40 p-mx-xl">
                <div className="w-mx-20 h-mx-20 rounded-mx-3xl bg-white flex items-center justify-center text-status-error shadow-mx-lg border border-status-error/10">
                  <ShieldAlert size={34} />
                </div>
                <div className="space-y-mx-sm max-w-lg">
                  <Typography variant="h1" className="text-3xl font-black uppercase tracking-tight">Falha ao carregar equipe</Typography>
                  <Typography variant="p" tone="muted" className="uppercase tracking-mx-widest font-black text-mx-tiny leading-relaxed">{teamError}</Typography>
                </div>
                <Button type="button" variant="outline" onClick={handleRefresh} className="h-mx-12 rounded-mx-xl font-black uppercase tracking-widest">
                  <RefreshCw size={16} className="mr-2" />
                  Tentar novamente
                </Button>
              </motion.div>
            ) : filteredTeam.length > 0 ? (
              <Card className="border-none shadow-mx-lg bg-white overflow-hidden">
                <CardHeader className="border-b border-border-default bg-white p-mx-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-mx-sm">
                    <div>
                      <CardTitle className="text-lg">Integrantes vinculados</CardTitle>
                      <CardDescription>Equipe operacional ativa no sistema de performance da loja.</CardDescription>
                    </div>
                    <Badge variant="outline" className="w-fit font-black uppercase">{filteredTeam.length} registros</Badge>
                  </div>
                </CardHeader>
                <div className="hidden lg:grid store-team-grid gap-mx-md px-mx-lg py-mx-sm bg-surface-alt border-b border-border-default text-mx-nano font-black uppercase tracking-mx-widest text-text-tertiary">
                  <span>Integrante</span>
                  <span>Papel</span>
                  <span>Status</span>
                  <span>Vigência</span>
                  <span className="text-right">Ações</span>
                </div>
                <div className="divide-y divide-border-default">
                  {filteredTeam.map((member, i) => {
                    const vigencia = getVigenciaStatus(member)
                    return (
                      <motion.div
                        key={`${member.id}-${member.store_id || storeId || 'sem-loja'}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="grid grid-cols-1 lg:store-team-grid gap-mx-md p-mx-lg items-center hover:bg-surface-alt/60 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-mx-sm min-w-0">
                            <Avatar
                              src={member.avatar_url || undefined}
                              alt={`Avatar de ${member.name || 'integrante'}`}
                              fallback={member.name || '?'}
                              size="lg"
                              className="rounded-mx-xl bg-brand-primary/10 text-brand-primary border-brand-primary/10"
                            />
                            <div className="min-w-0 flex-1">
                              <Typography variant="caption" className="block max-w-full font-black uppercase tracking-tight truncate">{member.name}</Typography>
                              <div className="mt-1 flex flex-wrap gap-x-mx-md gap-y-mx-tiny text-mx-micro font-bold text-text-tertiary">
                                <span className="inline-flex items-center gap-mx-tiny min-w-0"><Mail size={11} />{member.email || 'sem e-mail'}</span>
                                <span className="inline-flex items-center gap-mx-tiny"><Phone size={11} />{member.phone || 'sem telefone'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-mx-xs">
                          <Badge variant={member.role === 'vendedor' ? 'outline' : 'warning'} className="font-black uppercase">
                            {member.role || 'vendedor'}
                          </Badge>
                          {member.is_venda_loja && <Badge variant="brand" className="font-black uppercase">Venda loja</Badge>}
                        </div>

                        <div className="flex flex-wrap items-center gap-mx-xs">
                          <Badge variant={vigencia.variant} className="font-black uppercase">{vigencia.label}</Badge>
                          <Badge variant={member.checkin_today ? 'success' : 'outline'} className="font-black uppercase">
                            {member.checkin_today ? 'Check-in hoje' : 'Sem check-in'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-mx-sm text-mx-tiny font-black uppercase">
                          <div>
                            <span className="block text-mx-nano text-text-tertiary tracking-mx-widest">Início</span>
                            {member.started_at ? format(parseISO(member.started_at), 'dd/MM/yyyy') : '--'}
                          </div>
                          <div>
                            <span className="block text-mx-nano text-text-tertiary tracking-mx-widest">Fim</span>
                            {member.ended_at ? format(parseISO(member.ended_at), 'dd/MM/yyyy') : '--'}
                          </div>
                        </div>

                        <div className="flex items-center justify-start lg:justify-end gap-mx-xs">
                          {canManageTeamMembers && (
                            <Button variant="outline" size="icon" onClick={() => setEditingMember({ ...member, previous_store_id: member.store_id })} className="h-mx-10 w-mx-10 rounded-mx-xl" aria-label={`Editar ${member.name}`}>
                              <Settings2 size={16} />
                            </Button>
                          )}
                          {canManageTeamMembers && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteMember(member)}
                              disabled={pendingConfirmations.has(getDeleteMemberConfirmationKey(member))}
                              className="h-mx-10 w-mx-10 rounded-mx-xl text-status-error hover:bg-status-error-surface"
                              aria-label={`Encerrar vínculo de ${member.name}`}
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                          <Button variant="outline" size="icon" onClick={() => member.phone && window.open(`tel:${member.phone}`)} disabled={!member.phone} className="h-mx-10 w-mx-10 rounded-mx-xl" aria-label={member.phone ? `Ligar para ${member.name}` : `Telefone não informado para ${member.name}`}>
                            <Phone size={16} />
                          </Button>
                          <Button variant="outline" size="icon" asChild className="h-mx-10 w-mx-10 rounded-mx-xl bg-mx-black text-white border-none hover:bg-brand-primary" aria-label={`Ver performance de ${member.name}`}>
                            <Link to={`/relatorios/performance-vendedor?id=${member.id}`}>
                              <TrendingUp size={16} />
                            </Link>
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </Card>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-h-[50vh] space-y-mx-xl text-center border-2 border-dashed border-border-default rounded-mx-4xl bg-white/30 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative">
                    <div className="w-mx-32 h-mx-32 rounded-mx-4xl bg-white flex items-center justify-center text-text-tertiary shadow-mx-xl border border-border-default group-hover:rotate-12 transition-transform duration-700">
                      <Users size={64} strokeWidth={1} className="opacity-20" />
                    </div>
                    <div className="absolute -top-mx-xs -right-mx-xs w-mx-12 h-mx-12 rounded-mx-full bg-brand-primary flex items-center justify-center text-white shadow-mx-glow-brand animate-pulse">
                        <UserPlus size={18} />
                    </div>
                </div>
                <div className="space-y-mx-sm max-w-md relative z-10">
                  <Typography variant="h1" className="text-4xl font-black uppercase tracking-tighter leading-none">Equipe <span className="text-brand-primary">vazia</span></Typography>
                  <Typography variant="p" tone="muted" className="uppercase tracking-mx-widest font-black text-mx-tiny leading-relaxed opacity-60">A loja selecionada ainda não possui integrantes vinculados ao sistema de performance.</Typography>
                </div>
                {canCreateMembers && (
                  <Button
                      onClick={() => setIsUserModalOpen(true)}
                      className="h-mx-16 px-10 rounded-mx-full font-black uppercase tracking-widest text-mx-tiny shadow-mx-xl relative z-10"
                  >
                      <UserPlus size={18} className="mr-2" /> ADICIONAR INTEGRANTE
	                  </Button>
	                )}
	              </motion.div>
	            )}
	          </section>
          </div>

	          <AnimatePresence>
            {editingMember && (
              <div className="fixed inset-0 z-[100] flex items-start justify-center p-mx-md overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="edit-team-member-title">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingMember(null)} className="absolute inset-0 bg-mx-black/60 backdrop-blur-md" />

                <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="w-full max-w-2xl relative z-10 my-mx-lg">
                  <Card className="shadow-mx-elite border-none overflow-hidden">
                    <CardHeader className="bg-mx-black border-none text-white p-mx-xl relative">
                        <div className="absolute top-mx-0 left-mx-0 w-full h-mx-px bg-brand-primary shadow-mx-glow-brand" />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-mx-md">
                                <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-brand-primary flex items-center justify-center shadow-mx-xl">
                                    <ShieldCheck size={28} className="text-white" />
                                </div>
                                <div>
                                    <CardTitle id="edit-team-member-title" className="text-white text-2xl">Editar integrante</CardTitle>
                                    <Typography variant="caption" tone="white" className="opacity-60 block uppercase font-black tracking-mx-widest text-mx-nano">Dados de acesso, vínculo e vigência de {editingMember.name}</Typography>
                                </div>
                            </div>
                            <Button type="button" variant="ghost" size="icon" aria-label="Fechar edição de integrante" onClick={() => setEditingMember(null)} className="text-white/40 hover:text-white hover:bg-white/10 rounded-mx-full">
                                <X size={20} />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-mx-xl space-y-mx-lg overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                      <form onSubmit={handleUpdateMember} className="space-y-mx-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-md">
                          <div className="space-y-mx-tiny">
                            <label htmlFor="edit-member-name" className="px-2 text-mx-tiny font-black uppercase tracking-mx-widest text-text-tertiary">Nome</label>
                            <div className="relative">
                              <User size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" />
                              <input
                                id="edit-member-name"
                                name="name"
                                required
                                value={editingMember.name || ''}
                                onChange={e => setEditingMember({ ...editingMember, name: e.target.value.toUpperCase() })}
                                className="w-full h-mx-14 pl-12 pr-4 bg-surface-alt border border-border-default rounded-mx-2xl text-text-primary font-black uppercase tracking-tight focus:outline-none focus:border-brand-primary transition-all"
                              />
                            </div>
                          </div>
                          <div className="space-y-mx-tiny">
                            <label htmlFor="edit-member-email" className="px-2 text-mx-tiny font-black uppercase tracking-mx-widest text-text-tertiary">E-mail</label>
                            <div className="relative">
                              <Mail size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" />
                              <input
                                id="edit-member-email"
                                name="email"
                                required
                                type="email"
                                value={editingMember.email || ''}
                                onChange={e => setEditingMember({ ...editingMember, email: e.target.value })}
                                className="w-full h-mx-14 pl-12 pr-4 bg-surface-alt border border-border-default rounded-mx-2xl text-text-primary font-bold focus:outline-none focus:border-brand-primary transition-all"
                              />
                            </div>
                          </div>
                          <div className="space-y-mx-tiny">
                            <label htmlFor="edit-member-phone" className="px-2 text-mx-tiny font-black uppercase tracking-mx-widest text-text-tertiary">Telefone</label>
                            <div className="relative">
                              <Phone size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" />
                              <input
                                id="edit-member-phone"
                                name="phone"
                                value={editingMember.phone || ''}
                                onChange={e => setEditingMember({ ...editingMember, phone: e.target.value })}
                                className="w-full h-mx-14 pl-12 pr-4 bg-surface-alt border border-border-default rounded-mx-2xl text-text-primary font-bold focus:outline-none focus:border-brand-primary transition-all"
                              />
                            </div>
                          </div>
                          <div className="space-y-mx-tiny">
                            <label htmlFor="edit-member-role" className="px-2 text-mx-tiny font-black uppercase tracking-mx-widest text-text-tertiary">Papel na loja</label>
                            <select
                              id="edit-member-role"
                              name="role"
                              value={editingMember.role || 'vendedor'}
                              onChange={e => setEditingMember({ ...editingMember, role: e.target.value as MembershipRole })}
                              className="w-full h-mx-14 px-4 bg-surface-alt border border-border-default rounded-mx-2xl text-text-primary font-black uppercase focus:outline-none focus:border-brand-primary transition-all"
                            >
                              {editableStoreRoles.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-2 space-y-mx-tiny">
                            <label htmlFor="edit-member-store" className="px-2 text-mx-tiny font-black uppercase tracking-mx-widest text-text-tertiary">Loja vinculada</label>
                            <select
                              id="edit-member-store"
                              name="store_id"
                              value={editingMember.store_id || storeId || ''}
                              onChange={e => setEditingMember({ ...editingMember, store_id: e.target.value })}
                              className="w-full h-mx-14 px-4 bg-surface-alt border border-border-default rounded-mx-2xl text-text-primary font-black uppercase focus:outline-none focus:border-brand-primary transition-all"
                            >
                              <option value="">Selecione a loja</option>
                              {lojas.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-mx-md">
                          <div className="space-y-mx-tiny">
                            <label htmlFor="started-at" className="px-2 text-mx-tiny font-black uppercase tracking-mx-widest text-text-tertiary">Início da vigência</label>
                            <input
                              id="started-at"
                              name="started_at"
                              type="date" required
                              value={editingMember.started_at || ''}
                              onChange={e => setEditingMember({...editingMember, started_at: e.target.value})}
                              className="w-full h-mx-14 px-4 bg-surface-alt border border-border-default rounded-mx-2xl text-text-primary font-bold focus:outline-none focus:border-brand-primary transition-all uppercase"
                            />
                          </div>
                          <div className="space-y-mx-tiny">
                            <label htmlFor="ended-at" className="px-2 text-mx-tiny font-black uppercase tracking-mx-widest text-text-tertiary">Término (Opcional)</label>
                            <input
                              id="ended-at"
                              name="ended_at"
                              type="date"
                              value={editingMember.ended_at || ''}
                              onChange={e => setEditingMember({...editingMember, ended_at: e.target.value})}
                              className="w-full h-mx-14 px-4 bg-surface-alt border border-border-default rounded-mx-2xl text-text-primary font-bold focus:outline-none focus:border-brand-primary transition-all uppercase"
                            />
                          </div>

                          <div className="col-span-2 space-y-mx-sm pt-mx-md border-t border-border-default">
                            <label className="flex items-center justify-between p-mx-md rounded-mx-2xl bg-surface-alt border border-border-default hover:bg-white hover:shadow-mx-sm transition-all cursor-pointer group">
                              <div className="flex items-center gap-mx-md">
                                <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-status-success-surface text-status-success flex items-center justify-center border border-status-success/10"><ShieldCheck size={20} /></div>
                                <div className="space-y-0.5">
                                  <Typography variant="h3" className="text-sm font-black uppercase tracking-tight">Usuário ativo</Typography>
                                  <Typography variant="caption" tone="muted" className="text-mx-nano uppercase font-black">Permite acesso ao sistema</Typography>
                                </div>
                              </div>
                              <input type="checkbox" name="active" checked={editingMember.active ?? true} onChange={e => setEditingMember({...editingMember, active: e.target.checked})} className="w-mx-sm h-mx-sm rounded-mx-md accent-status-success cursor-pointer" />
                            </label>
                            <label className="flex items-center justify-between p-mx-md rounded-mx-2xl bg-surface-alt border border-border-default hover:bg-white hover:shadow-mx-sm transition-all cursor-pointer group">
                              <div className="flex items-center gap-mx-md">
                                <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary"><Power size={20} /></div>
                                <div className="space-y-0.5">
                                  <Typography variant="h3" className="text-sm font-black uppercase tracking-tight">Vigência ativa</Typography>
                                  <Typography variant="caption" tone="muted" className="text-mx-nano uppercase font-black">Conta na lista operacional da loja</Typography>
                                </div>
                              </div>
                              <input type="checkbox" name="is_active" checked={editingMember.is_active} onChange={e => setEditingMember({...editingMember, is_active: e.target.checked})} className="w-mx-sm h-mx-sm rounded-mx-md accent-brand-primary cursor-pointer" />
                            </label>

                            <label className="flex items-center justify-between p-mx-md rounded-mx-2xl bg-surface-alt border border-border-default hover:bg-white hover:shadow-mx-sm transition-all cursor-pointer group">
                              <div className="flex items-center gap-mx-md">
                                <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary"><TrendingUp size={20} /></div>
                                <div className="space-y-0.5">
                                  <Typography variant="h3" className="text-sm font-black uppercase tracking-tight">Venda loja</Typography>
                                  <Typography variant="caption" tone="muted" className="text-mx-nano uppercase font-black">Conta como indicador operacional da unidade</Typography>
                                </div>
                              </div>
                              <input type="checkbox" name="is_venda_loja" checked={editingMember.is_venda_loja ?? false} onChange={e => setEditingMember({...editingMember, is_venda_loja: e.target.checked})} className="w-mx-sm h-mx-sm rounded-mx-md accent-brand-primary cursor-pointer" />
                            </label>

                            <label className="flex items-center justify-between p-mx-md rounded-mx-2xl bg-surface-alt border border-border-default hover:bg-white hover:shadow-mx-sm transition-all cursor-pointer group">
                              <div className="flex items-center gap-mx-md">
                                <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-status-warning-surface text-status-warning border border-status-warning/10"><ShieldAlert size={20} /></div>
                                <div className="space-y-0.5">
                                  <Typography variant="h3" className="text-sm font-black uppercase tracking-tight">Carência MX</Typography>
                                  <Typography variant="caption" tone="muted" className="text-mx-nano uppercase font-black">Ignorar metas do mês vigente</Typography>
                                </div>
                              </div>
                              <input type="checkbox" name="closing_month_grace" checked={editingMember.closing_month_grace} onChange={e => setEditingMember({...editingMember, closing_month_grace: e.target.checked})} className="w-mx-sm h-mx-sm rounded-mx-md accent-status-warning cursor-pointer" />
                            </label>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-mx-sm">
                          <Button
                            type="button"
                            variant="danger"
                            disabled={saving || pendingConfirmations.has(getDeleteMemberConfirmationKey(editingMember))}
                            onClick={() => handleDeleteMember(editingMember)}
                            className="h-mx-16 sm:w-mx-40 rounded-mx-2xl font-black uppercase tracking-mx-wide text-xs shadow-mx-lg"
                          >
                            <Trash2 size={18} className="mr-2" />
                            ENCERRAR
                          </Button>
                          <Button
                            type="submit" disabled={saving}
                            className="h-mx-16 flex-1 rounded-mx-2xl font-black uppercase tracking-mx-wide text-xs shadow-mx-lg"
                          >
                            {saving ? <RefreshCw className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                            SALVAR INTEGRANTE
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}

            {isUserModalOpen && (
              <UserCreationModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSuccess={refetch}
                registerUser={registerUser}
                storeId={storeId}
                lojas={lojas}
              />
            )}
          </AnimatePresence>
        </>
    </section>
  )
}

export default StoreTeamPanel
