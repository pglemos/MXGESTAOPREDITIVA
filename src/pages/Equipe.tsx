import { useTeam, useStores } from '@/hooks/useTeam'
import { UserCreationModal } from '@/features/equipe/components/UserCreationModal'
import { useState, useMemo, useCallback } from 'react'
import { 
    Users, UserPlus, Search, Phone, Shield, 
    RefreshCw, X, TrendingUp, Zap, 
    ShieldAlert, Clock, ShieldCheck,
    ArrowUpRight, Settings2, Power, Building2
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn, getAvatarUrl } from '@/lib/utils'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { Typography } from '@/components/atoms/Typography'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { PageHeader } from '@/components/molecules/PageHeader'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Equipe() {
  const urlStoreId = new URLSearchParams(window.location.search).get('id')
  const { role, storeId: authStoreId } = useAuth()
  const isAdmin = role === 'admin'
  const { stores } = useStores()
  const [selectedStoreId, setSelectedStoreId] = useState(urlStoreId || '')
  
  const effectiveStoreId = isAdmin ? selectedStoreId : (urlStoreId || authStoreId || undefined)
  const { team, loading, refetch, updateVigencia, registerUser } = useTeam(effectiveStoreId || undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingMember, setEditingMember] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isRefetching, setIsRefetching] = useState(false)

  const filteredTeam = useMemo(() => {
    return (team || []).filter(m => 
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [team, searchTerm])

  const stats = useMemo(() => {
    const total = (team || []).length;
    const leaders = (team || []).filter(m => m.role === 'admin' || m.role === 'dono' || m.role === 'gerente');
    const operational = (team || []).filter(m => m.checkin_today);
    
    return [
        { label: 'Tropa Total', value: total, icon: Users, tone: 'brand', color: 'from-brand-primary/20 to-brand-primary/5' },
        { label: 'Operacionais', value: operational.length, icon: Zap, tone: 'success', color: 'from-status-success-surface to-transparent' },
        { label: 'Offline', value: total - operational.length, icon: Clock, tone: 'error', color: 'from-status-error-surface to-transparent' },
        { label: 'Líderes', value: leaders.length, icon: Shield, tone: 'warning', color: 'from-status-warning-surface to-transparent' },
    ];
  }, [team])

  const handleUpdateVigencia = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await updateVigencia(editingMember.id, {
      started_at: editingMember.started_at,
      ended_at: editingMember.ended_at,
      is_active: editingMember.is_active,
      closing_month_grace: editingMember.closing_month_grace
    })
    setSaving(false)
    if (error) toast.error(error); else { toast.success('Vigência atualizada!'); setEditingMember(null); refetch() }
  }

  const getVigenciaStatus = (m: any) => {
    if (!m.is_active) return { label: 'INATIVO', variant: 'outline' as const, color: 'text-text-tertiary border-border-default bg-surface-alt' }
    if (m.ended_at && new Date(m.ended_at) < new Date()) return { label: 'ENCERRADO', variant: 'danger' as const, color: 'text-status-error border-status-error/10 bg-status-error-surface' }
    return { label: 'ATIVO', variant: 'success' as const, color: 'text-status-success border-status-success/10 bg-status-success-surface' }
  }

  const handleRefresh = useCallback(async () => {
    setIsRefetching(true)
    try {
      await refetch()
    } finally {
      setIsRefetching(false)
    }
  }, [refetch])

  if (loading) return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-md md:p-mx-lg bg-surface-alt animate-in fade-in duration-500 overflow-hidden">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
            <div className="space-y-mx-xs">
                <Skeleton className="h-mx-10 w-mx-64" />
                <div className="flex gap-mx-sm">
                  <Skeleton className="h-mx-xs w-mx-48" />
                  <Skeleton className="h-mx-xs w-mx-48" />
                </div>
            </div>
            <div className="flex gap-mx-sm">
                <Skeleton className="h-mx-14 w-mx-48 rounded-mx-xl" />
            </div>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-mx-20 rounded-mx-2xl" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg mt-mx-lg">
            {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-mx-64 rounded-mx-3xl" />)}
        </div>
    </main>
  )

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-md md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt relative">
      
      {/* Selection State for Admin/Owners without a store context */}
      {(isAdmin || role === 'dono') && !selectedStoreId && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-mx-lg">
          <div className="relative">
            <div className="w-mx-20 h-mx-20 rounded-mx-4xl bg-white flex items-center justify-center border border-border-default shadow-mx-xl">
              <Building2 size={48} className="text-brand-primary" />
            </div>
            <div className="absolute -inset-mx-xs bg-brand-primary/5 rounded-mx-4xl blur-mx-xl -z-10 animate-pulse" />
          </div>
          <div className="space-y-mx-tiny">
            <Typography variant="h1" className="text-3xl sm:text-5xl font-black uppercase tracking-tighter leading-none">Central de <span className="text-brand-primary">Governança</span></Typography>
            <Typography variant="caption" tone="muted" className="uppercase tracking-mx-wider font-black text-mx-tiny block mt-2">Selecione uma unidade operacional para gerenciar</Typography>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-sm w-full max-w-5xl pt-mx-lg">
            {isAdmin && (
              <button
                onClick={() => setSelectedStoreId('all')}
                className="p-mx-lg rounded-mx-3xl bg-white border border-border-default hover:border-brand-primary hover:shadow-mx-lg transition-all group text-left relative overflow-hidden"
              >
                <div className="absolute top-mx-0 right-mx-0 p-mx-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={20} className="text-brand-primary" />
                </div>
                <Typography variant="caption" tone="brand" className="block font-black uppercase tracking-mx-widest text-mx-nano mb-2">Visão Global</Typography>
                <Typography variant="h3" className="font-black uppercase tracking-tight group-hover:text-brand-primary transition-colors leading-tight">Visualizar Toda a Tropa</Typography>
              </button>
            )}
            {stores.map(store => (
              <button
                key={store.id}
                onClick={() => setSelectedStoreId(store.id)}
                className="p-mx-lg rounded-mx-3xl bg-white border border-border-default hover:border-brand-primary hover:shadow-mx-lg transition-all group text-left relative overflow-hidden"
              >
                <div className="absolute top-mx-0 right-mx-0 p-mx-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={20} className="text-brand-primary" />
                </div>
                <Typography variant="caption" tone="muted" className="block font-black uppercase tracking-mx-widest text-mx-nano mb-2">Unidade</Typography>
                <Typography variant="h3" className="font-black uppercase tracking-tight group-hover:text-brand-primary transition-colors leading-tight">{store.name}</Typography>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {(!isAdmin || selectedStoreId) && (
        <>
          <PageHeader 
            title="Time de Elite"
            description="Gestão de Tropa & Hierarquia MX"
            actions={
              <div className="flex flex-col sm:flex-row items-center gap-mx-sm w-full lg:w-auto">
                <div className="relative group w-full sm:w-mx-96">
                  <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                  <Input 
                    placeholder="LOCALIZAR ESPECIALISTA..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="!pl-12 !h-mx-14 uppercase font-black tracking-widest text-mx-tiny"
                  />
                </div>
                <div className="flex w-full sm:w-auto gap-mx-sm">
                  <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handleRefresh} 
                      className="w-mx-14 h-mx-14 rounded-mx-xl bg-white shadow-mx-sm border-border-default shrink-0"
                  >
                    <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                  </Button>
                  {(role === 'admin' || role === 'dono' || role === 'gerente') && (
                    <Button 
                      onClick={() => setIsUserModalOpen(true)}
                      className="flex-1 sm:flex-none h-mx-14 px-8 rounded-mx-xl font-black uppercase tracking-widest text-mx-tiny shadow-mx-lg"
                    >
                      <UserPlus size={18} className="mr-2" /> NOVO RECRUTA
                    </Button>
                  )}
                  {(isAdmin || role === 'dono') && (
                    <Button 
                      variant="ghost"
                      onClick={() => setSelectedStoreId('')}
                      className="h-mx-14 px-4 rounded-mx-xl border border-border-default bg-white hover:border-brand-primary/50 text-text-tertiary hover:text-brand-primary transition-all shadow-mx-sm uppercase font-black tracking-widest text-mx-nano"
                    >
                      {selectedStoreId === 'all' ? 'GLOBAL' : (stores.find(s => s.id === selectedStoreId)?.name?.split(' ')[0] || 'UNIDADE')}
                      <RefreshCw size={12} className="ml-2 opacity-50" />
                    </Button>
                  )}
                </div>
              </div>
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-md md:gap-mx-lg shrink-0 mt-mx-md">
            {stats.map((item, idx) => (
              <motion.div 
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-mx-lg rounded-mx-3xl bg-white border border-border-default relative overflow-hidden group shadow-mx-sm hover:shadow-mx-md transition-all"
              >
                <div className={cn("absolute -top-mx-lg -right-mx-lg w-mx-20 h-mx-20 blur-mx-xl opacity-40 bg-gradient-to-br", item.color)} />
                <div className="flex items-center justify-between relative z-10">
                  <div className="space-y-mx-tiny">
                    <Typography variant="tiny" tone="muted" className="block uppercase tracking-mx-widest font-black">{item.label}</Typography>
                    <Typography variant="h1" className="text-4xl font-black tabular-nums leading-none font-mono-numbers">{item.value}</Typography>
                  </div>
                  <div className={cn(
                    "w-mx-14 h-mx-14 rounded-mx-xl flex items-center justify-center bg-surface-alt border border-border-default text-text-tertiary transition-all group-hover:scale-110 group-hover:border-brand-primary/20 group-hover:text-brand-primary",
                    item.tone === 'brand' && "text-brand-primary border-brand-primary/10 bg-brand-primary/5"
                  )}>
                    <item.icon size={24} strokeWidth={1.5} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex-1 min-h-0 pb-32 mt-mx-md">
            {filteredTeam.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg">
                {filteredTeam.map((member, i) => {
                  const vigencia = getVigenciaStatus(member)
                  return (
                    <motion.article 
                      key={member.id} 
                      layout 
                      initial={{ opacity: 0, scale: 0.98 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      transition={{ delay: i * 0.03 }} 
                      className="group relative rounded-mx-4xl bg-white border border-border-default hover:border-brand-primary/30 hover:shadow-mx-xl transition-all duration-500 overflow-hidden flex flex-col h-full shadow-mx-sm"
                    >
                      <div className="absolute top-mx-0 left-mx-0 right-mx-0 h-mx-3xl bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none group-hover:opacity-100 transition-opacity duration-700" />
                      
                      <div className="p-mx-md pb-0 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-mx-xs px-3 py-1.5 rounded-mx-full bg-surface-alt border border-border-default shadow-mx-inner">
                          <div className={cn("w-1.5 h-1.5 rounded-mx-full", member.checkin_today ? "bg-status-success shadow-mx-glow-brand animate-pulse" : "bg-text-tertiary/20")} />
                          <span className="text-mx-nano font-black uppercase tracking-mx-widest text-text-tertiary">
                            {member.checkin_today ? 'Operacional' : 'Offline'}
                          </span>
                        </div>
                        <Badge variant={vigencia.variant} className="font-black uppercase tracking-mx-widest text-mx-nano">
                          {vigencia.label}
                        </Badge>
                      </div>

                      <div className="p-mx-lg flex flex-col items-center text-center space-y-mx-md relative z-10 flex-1">
                        <div className="relative">
                          <div className="w-mx-24 h-mx-24 rounded-mx-4xl bg-surface-alt border-2 border-border-default overflow-hidden group-hover:scale-105 group-hover:border-brand-primary/30 transition-all duration-500 shadow-mx-lg">
                            <img 
                              src={getAvatarUrl(member.name || '', { background: 'f8fafc', color: '22C55E' })} 
                              alt="" className="w-full h-full object-cover" 
                            />
                          </div>
                          {member.role === 'admin' && (
                            <div className="absolute -top-mx-xs -right-mx-xs w-mx-10 h-mx-10 rounded-mx-full bg-mx-black text-white flex items-center justify-center border-4 border-white shadow-mx-md">
                                <Shield size={16} className="text-brand-primary" />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-mx-tiny w-full">
                          <Typography variant="h3" className="text-xl font-black uppercase tracking-tight truncate px-mx-sm">{member.name}</Typography>
                          <div className="flex flex-col items-center gap-mx-nano">
                            <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-mx-wide text-mx-tiny opacity-80">
                                {member.role || 'ESPECIALISTA'}
                            </Typography>
                            {selectedStoreId === 'all' && member.store_name && (
                                <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-mx-widest text-mx-nano">
                                    • {member.store_name} •
                                </Typography>
                            )}
                          </div>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-mx-xs pt-mx-sm border-t border-border-subtle">
                          <div className="p-mx-xs rounded-mx-2xl bg-surface-alt/50 border border-border-default/50">
                            <span className="block text-mx-nano text-text-tertiary font-black uppercase tracking-mx-widest mb-1">Entrada</span>
                            <span className="text-mx-tiny text-text-primary font-black uppercase">{member.started_at ? format(parseISO(member.started_at), 'dd/MM/yy') : '---'}</span>
                          </div>
                          <div className="p-mx-xs rounded-mx-2xl bg-surface-alt/50 border border-border-default/50">
                            <span className="block text-mx-nano text-text-tertiary font-black uppercase tracking-mx-widest mb-1">Status</span>
                            <span className="text-mx-tiny text-text-primary font-black uppercase">{member.ended_at ? 'CICLO FIM' : 'EFETIVO'}</span>
                          </div>
                        </div>
                      </div>

                      <footer className="p-mx-md pt-0 mt-auto relative z-10 grid grid-cols-3 gap-mx-xs">
                        <Button 
                          variant="outline"
                          onClick={() => setEditingMember(member)}
                          className="h-mx-12 rounded-mx-2xl bg-surface-alt border-border-default text-text-tertiary hover:text-brand-primary hover:bg-white transition-all shadow-mx-sm"
                          aria-label="Configurações"
                        >
                          <Settings2 size={18} />
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => window.open(`tel:${member.phone}`)}
                          className="h-mx-12 rounded-mx-2xl bg-brand-primary/5 border-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-mx-sm"
                          aria-label="Contato"
                        >
                          <Phone size={18} />
                        </Button>
                        <Button 
                          variant="outline"
                          asChild
                          className="h-mx-12 rounded-mx-2xl bg-surface-alt border-border-default text-text-tertiary hover:text-status-info hover:bg-white transition-all shadow-mx-sm"
                        >
                          <Link to="/relatorios/performance-vendedores" aria-label="Performance">
                            <TrendingUp size={18} />
                          </Link>
                        </Button>
                      </footer>
                    </motion.article>
                  )
                })}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[40vh] space-y-mx-lg text-center border-2 border-dashed border-border-default rounded-mx-4xl bg-white/50">
                <div className="w-mx-20 h-mx-20 rounded-mx-full bg-surface-alt flex items-center justify-center text-text-tertiary opacity-20">
                  <Users size={40} />
                </div>
                <div className="space-y-mx-tiny">
                  <Typography variant="h3" className="font-black uppercase tracking-tight">Vácuo de Tropa</Typography>
                  <Typography variant="p" tone="muted" className="uppercase tracking-mx-widest font-black text-mx-tiny">Nenhum especialista localizado nesta unidade operacional</Typography>
                </div>
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {editingMember && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-mx-md overflow-hidden" role="dialog" aria-modal="true">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingMember(null)} className="absolute inset-0 bg-mx-black/60 backdrop-blur-md" />
                
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="w-full max-w-xl relative z-10">
                  <Card className="shadow-mx-elite border-none">
                    <CardHeader className="bg-mx-black border-none text-white p-mx-xl relative">
                        <div className="absolute top-mx-0 left-mx-0 w-full h-mx-px bg-brand-primary shadow-mx-glow-brand" />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-mx-md">
                                <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-brand-primary flex items-center justify-center shadow-mx-xl">
                                    <ShieldCheck size={28} className="text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-white text-2xl">Governança MX</CardTitle>
                                    <Typography variant="caption" tone="white" className="opacity-60 block uppercase font-black tracking-mx-widest text-mx-nano">Configurar vigência de {editingMember.name}</Typography>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setEditingMember(null)} className="text-white/40 hover:text-white hover:bg-white/10 rounded-mx-full">
                                <X size={20} />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-mx-xl space-y-mx-lg">
                      <form onSubmit={handleUpdateVigencia} className="space-y-mx-lg">
                        <div className="grid grid-cols-2 gap-mx-md">
                          <div className="space-y-mx-tiny">
                            <Typography variant="tiny" tone="muted" className="px-2 font-black uppercase tracking-mx-widest">Início Contrato</Typography>
                            <input 
                              type="date" required 
                              value={editingMember.started_at || ''} 
                              onChange={e => setEditingMember({...editingMember, started_at: e.target.value})} 
                              className="w-full h-mx-14 px-4 bg-surface-alt border border-border-default rounded-mx-2xl text-text-primary font-bold focus:outline-none focus:border-brand-primary transition-all uppercase" 
                            />
                          </div>
                          <div className="space-y-mx-tiny">
                            <Typography variant="tiny" tone="muted" className="px-2 font-black uppercase tracking-mx-widest">Término (Opcional)</Typography>
                            <input 
                              type="date" 
                              value={editingMember.ended_at || ''} 
                              onChange={e => setEditingMember({...editingMember, ended_at: e.target.value})} 
                              className="w-full h-mx-14 px-4 bg-surface-alt border border-border-default rounded-mx-2xl text-text-primary font-bold focus:outline-none focus:border-brand-primary transition-all uppercase" 
                            />
                          </div>
                          
                          <div className="col-span-2 space-y-mx-sm pt-mx-md border-t border-border-default">
                            <label className="flex items-center justify-between p-mx-md rounded-mx-2xl bg-surface-alt border border-border-default hover:bg-white hover:shadow-mx-sm transition-all cursor-pointer group">
                              <div className="flex items-center gap-mx-md">
                                <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary"><Power size={20} /></div>
                                <div className="space-y-0.5">
                                  <Typography variant="h3" className="text-sm font-black uppercase tracking-tight">Status Ativo</Typography>
                                  <Typography variant="caption" tone="muted" className="text-mx-nano uppercase font-black">Habilitado no ecossistema</Typography>
                                </div>
                              </div>
                              <input type="checkbox" checked={editingMember.is_active} onChange={e => setEditingMember({...editingMember, is_active: e.target.checked})} className="w-mx-sm h-mx-sm rounded-mx-md accent-brand-primary cursor-pointer" />
                            </label>
                            
                            <label className="flex items-center justify-between p-mx-md rounded-mx-2xl bg-surface-alt border border-border-default hover:bg-white hover:shadow-mx-sm transition-all cursor-pointer group">
                              <div className="flex items-center gap-mx-md">
                                <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-status-warning-surface text-status-warning border border-status-warning/10"><ShieldAlert size={20} /></div>
                                <div className="space-y-0.5">
                                  <Typography variant="h3" className="text-sm font-black uppercase tracking-tight">Carência MX</Typography>
                                  <Typography variant="caption" tone="muted" className="text-mx-nano uppercase font-black">Ignorar metas do mês vigente</Typography>
                                </div>
                              </div>
                              <input type="checkbox" checked={editingMember.closing_month_grace} onChange={e => setEditingMember({...editingMember, closing_month_grace: e.target.checked})} className="w-mx-sm h-mx-sm rounded-mx-md accent-status-warning cursor-pointer" />
                            </label>
                          </div>
                        </div>

                        <Button 
                          type="submit" disabled={saving} 
                          className="w-full h-mx-16 rounded-mx-2xl font-black uppercase tracking-mx-wide text-xs shadow-mx-lg"
                        >
                          {saving ? <RefreshCw className="animate-spin mr-2" /> : <Zap size={20} className="fill-current mr-2" />}
                          SINCRONIZAR VIGÊNCIA
                        </Button>
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
                storeId={effectiveStoreId}
                stores={stores}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </main>
  )
}
