import { useMemo, useState } from 'react'
import { Plus, Search, Trash2, Edit3, RefreshCw, Users, ShieldCheck, ShieldAlert, Building2, Mail } from 'lucide-react'
import { useTeam, useStores } from '@/hooks/useTeam'
import { isAdministradorMx, isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { Card } from '@/components/molecules/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { UserCreationModal } from '@/features/equipe/components/UserCreationModal'
import { EditUserModal } from '@/features/configuracoes/components/EditUserModal'
import type { UserRole } from '@/types/database'
import type { TabContext } from '@/features/configuracoes/types'

const ROLE_LABEL: Record<string, string> = {
    administrador_geral: 'Admin Master',
    administrador_mx: 'Admin MX',
    consultor_mx: 'Consultor MX',
    dono: 'Dono',
    gerente: 'Gerente',
    vendedor: 'Vendedor',
}

const ROLE_BADGE: Record<string, 'brand' | 'success' | 'warning' | 'outline'> = {
    administrador_geral: 'brand',
    administrador_mx: 'brand',
    consultor_mx: 'success',
    dono: 'warning',
    gerente: 'warning',
    vendedor: 'outline',
}

export function EquipeUsuariosTab({ isReadOnly }: TabContext) {
    const { role, storeId } = useAuth()
    const isGlobalAdmin = isAdministradorMx(role)
    const canCreate = !isReadOnly
    const canMutateExisting = !isReadOnly && isAdministradorMx(role)
    // Admin master/MX vêem global; outros vêem só sua loja
    const scopedStoreId = isGlobalAdmin ? 'all' : (storeId || undefined)
    const { sellers, loading, registerUser, updateTeamMember, deleteTeamMember, refetch } = useTeam(scopedStoreId)
    const { lojas } = useStores()

    const [showCreate, setShowCreate] = useState(false)
    const [editingUser, setEditingUser] = useState<any>(null)
    const [filter, setFilter] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('')

    const allowedRolesForCreate = useMemo<UserRole[]>(() => {
        if (role === 'administrador_geral') return ['administrador_geral', 'administrador_mx', 'consultor_mx', 'dono', 'gerente', 'vendedor']
        if (role === 'administrador_mx') return ['administrador_mx', 'consultor_mx', 'dono', 'gerente', 'vendedor']
        if (role === 'dono') return ['gerente', 'vendedor']
        if (role === 'gerente') return ['vendedor']
        return []
    }, [role])

    const filtered = useMemo(() => {
        return sellers.filter(s => {
            const matchesText = !filter ||
                s.name?.toLowerCase().includes(filter.toLowerCase()) ||
                s.email?.toLowerCase().includes(filter.toLowerCase())
            const matchesRole = !roleFilter || s.role === roleFilter
            return matchesText && matchesRole
        })
    }, [sellers, filter, roleFilter])

    const handleDelete = async (user: any) => {
        const confirmed = window.confirm(`Remover ${user.name} da equipe? Esta ação desativa o vínculo. O histórico é preservado.`)
        if (!confirmed) return
        const { error } = await deleteTeamMember(user.id, user.store_id)
        if (error) toast.error(error)
        else toast.success(`${user.name} removido da equipe.`)
    }

    const stats = useMemo(() => ({
        total: sellers.length,
        ativos: sellers.filter(s => s.is_active !== false && s.active !== false).length,
        admins: sellers.filter(s => isPerfilInternoMx(s.role)).length,
        sellers: sellers.filter(s => s.role === 'vendedor').length,
    }), [sellers])

    return (
        <div className="space-y-mx-lg">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-mx-md">
                <StatCard icon={<Users size={18} />} label="Total" value={stats.total} />
                <StatCard icon={<ShieldCheck size={18} />} label="Ativos" value={stats.ativos} tone="success" />
                <StatCard icon={<ShieldAlert size={18} />} label="Admins MX" value={stats.admins} tone="brand" />
                <StatCard icon={<Building2 size={18} />} label="Vendedores" value={stats.sellers} tone="muted" />
            </div>

            {/* Toolbar */}
            <Card className="p-mx-md border-none shadow-mx-md bg-white flex flex-col md:flex-row items-stretch md:items-center gap-mx-md">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <Input
                        id="team-search"
                        name="team-search"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        placeholder="Buscar por nome ou e-mail..."
                        className="!pl-mx-10 !h-mx-12 font-bold"
                    />
                </div>
                <select
                    id="team-role-filter"
                    name="role-filter"
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="h-mx-12 px-mx-sm bg-surface-alt border border-border-default rounded-mx-xl font-black uppercase text-xs cursor-pointer"
                >
                    <option value="">Todos os papéis</option>
                    {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v.toUpperCase()}</option>)}
                </select>
                <Button variant="outline" onClick={refetch} className="h-mx-12 px-mx-sm rounded-mx-xl" aria-label="Atualizar equipe">
                    <RefreshCw size={14} />
                </Button>
                {canCreate && allowedRolesForCreate.length > 0 && (
                    <Button
                        onClick={() => setShowCreate(true)}
                        className="h-mx-12 px-6 rounded-mx-xl font-black uppercase tracking-widest text-xs"
                    >
                        <Plus size={16} className="mr-2" /> Novo Usuário
                    </Button>
                )}
            </Card>

            {/* Lista */}
            <Card className="border-none shadow-mx-lg bg-white overflow-hidden">
                {loading ? (
                    <div className="p-mx-xl text-center">
                        <RefreshCw size={24} className="animate-spin mx-auto text-brand-primary" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-mx-xl text-center space-y-mx-sm">
                        <Users size={40} className="mx-auto text-text-tertiary opacity-30" />
                        <Typography variant="caption" tone="muted" className="font-black uppercase">Nenhum usuário encontrado</Typography>
                    </div>
                ) : (
                    <div className="divide-y divide-border-default">
                        {filtered.map(user => {
                            const isInactive = user.is_active === false || user.active === false
                            return (
                                <div key={`${user.id}-${user.store_id || 'no-store'}`} className="flex items-center justify-between gap-mx-md p-mx-md hover:bg-surface-alt transition-colors">
                                    <div className="flex items-center gap-mx-sm flex-1 min-w-0">
                                        <div className={`w-mx-12 h-mx-12 rounded-mx-xl flex items-center justify-center font-black text-white text-sm shrink-0 ${isInactive ? 'bg-text-tertiary' : 'bg-brand-primary'}`}>
                                            {(user.name || '?').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-mx-sm">
                                                <Typography variant="caption" className="font-black uppercase tracking-tight truncate">
                                                    {user.name || '—'}
                                                </Typography>
                                                {isInactive && <Badge variant="outline" className="text-mx-micro font-black uppercase">Inativo</Badge>}
                                                {user.must_change_password && <Badge variant="warning" className="text-mx-micro font-black uppercase">Trocar Senha</Badge>}
                                            </div>
                                            <div className="flex items-center gap-mx-md flex-wrap mt-1">
                                                <span className="flex items-center gap-mx-tiny text-mx-micro font-bold text-text-tertiary">
                                                    <Mail size={11} />{user.email}
                                                </span>
                                                {(user as any).store_name && (
                                                    <span className="flex items-center gap-mx-tiny text-mx-micro font-bold text-text-tertiary">
                                                        <Building2 size={11} />{(user as any).store_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant={ROLE_BADGE[user.role || ''] || 'outline'} className="font-black uppercase shrink-0">
                                        {ROLE_LABEL[user.role || ''] || user.role}
                                    </Badge>
                                    {canMutateExisting && (
                                        <div className="flex gap-mx-xs shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditingUser(user)}
                                                aria-label={`Editar ${user.name}`}
                                                className="h-mx-10 w-mx-10 rounded-mx-xl"
                                            >
                                                <Edit3 size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(user)}
                                                aria-label={`Remover ${user.name}`}
                                                className="h-mx-10 w-mx-10 rounded-mx-xl text-status-error hover:bg-status-error-surface"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </Card>

            {canCreate && (
                <UserCreationModal
                    isOpen={showCreate}
                    onClose={() => setShowCreate(false)}
                    onSuccess={refetch}
                    registerUser={registerUser}
                    storeId={isGlobalAdmin ? undefined : (storeId || undefined)}
                    lojas={lojas}
                />
            )}

            {canMutateExisting && (
                <EditUserModal
                    open={Boolean(editingUser)}
                    user={editingUser}
                    lojas={lojas}
                    allowedRoles={allowedRolesForCreate}
                    onClose={() => setEditingUser(null)}
                    onSubmit={updateTeamMember}
                />
            )}
        </div>
    )
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone?: 'success' | 'brand' | 'muted' }) {
    const toneColor = tone === 'success' ? 'text-status-success' :
        tone === 'brand' ? 'text-brand-primary' : 'text-text-primary'
    return (
        <Card className="p-mx-md border-none shadow-mx-sm bg-white">
            <div className="flex items-center gap-mx-sm">
                <div className={`w-mx-10 h-mx-10 rounded-mx-xl bg-surface-alt flex items-center justify-center ${toneColor}`}>
                    {icon}
                </div>
                <div>
                    <Typography variant="tiny" tone="muted" className="font-black uppercase">{label}</Typography>
                    <Typography variant="h3" className="font-black tabular-nums">{value}</Typography>
                </div>
            </div>
        </Card>
    )
}
