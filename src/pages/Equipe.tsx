import { useTeam, useStores } from '@/hooks/useTeam'
import { UserCreationModal } from '@/features/equipe/components/UserCreationModal'
import { useState, useMemo, useCallback } from 'react'
import { 
    Users, UserPlus, Search, Mail, Phone, Shield, 
    BadgeCheck, RefreshCw, X, ChevronRight, Star, 
    TrendingUp, Zap, Filter, Calendar, Settings2, ShieldAlert, Clock, ShieldCheck,
    Target, ArrowUpRight, MessageCircle, MoreHorizontal, Power, Briefcase, Building2
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn, getAvatarUrl } from '@/lib/utils'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Typography } from '@/components/atoms/Typography'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Input } from '@/components/atoms/Input'
import { Card } from '@/components/molecules/Card'

import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Equipe() {
  const urlStoreId = new URLSearchParams(window.location.search).get('id')
  const { role, storeId: authStoreId, profile } = useAuth()
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
        { label: 'Tropa Total', value: total, icon: Users, tone: 'brand', color: 'from-brand-primary to-mx-emerald-700' },
        { label: 'Operacionais', value: operational.length, icon: Zap, tone: 'success', color: 'from-mx-blue-500 to-mx-indigo-600' },
        { label: 'Pendentes', value: total - operational.length - leaders.length, icon: Clock, tone: 'error', color: 'from-status-error to-status-error/60' },
        { label: 'Líderes', value: leaders.length, icon: Star, tone: 'warning', color: 'from-status-warning to-status-warning/60' },
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
    if (!m.is_active) return { label: 'INATIVO', variant: 'outline' as const, color: 'text-text-tertiary border-white/10' }
    if (m.ended_at && new Date(m.ended_at) < new Date()) return { label: 'ENCERRADO', variant: 'danger' as const, color: 'text-status-error border-status-error/20' }
    return { label: 'ATIVO', variant: 'success' as const, color: 'text-brand-primary border-brand-primary/20' }
  }

  if (loading) return (
    <main className="w-full h-full flex flex-col gap-8 p-8 bg-[#0A0A0B] animate-in fade-in duration-500 overflow-hidden">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10">
            <div className="space-y-4">
                <Skeleton className="h-10 w-64 bg-white/5" />
                <Skeleton className="h-4 w-48 bg-white/5" />
            </div>
            <div className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-2xl bg-white/5" />
                <Skeleton className="h-12 w-48 rounded-2xl bg-white/5" />
            </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-3xl bg-white/5" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-80 rounded-[40px] bg-white/5" />)}
        </div>
    </main>
  )

  return (
    <main className="w-full h-full flex flex-col gap-8 p-8 overflow-y-auto no-scrollbar bg-[#0A0A0B] relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-mx-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Selection for Admins/Owners */}
      {(isAdmin || role === 'dono') && !selectedStoreId && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-brand-primary/20 to-mx-emerald-700/20 flex items-center justify-center border border-white/10 shadow-2xl">
              <Building2 size={56} className="text-brand-primary" />
            </div>
            <div className="absolute -inset-4 bg-brand-primary/10 rounded-[50px] blur-2xl animate-pulse -z-10" />
          </div>
          <div className="space-y-2">
            <Typography variant="h1" className="text-5xl font-black uppercase tracking-tighter text-white">Central de <span className="text-brand-primary">Governança</span></Typography>
            <Typography variant="body" className="text-white/40 uppercase tracking-[0.3em] font-black text-xs">Selecione uma unidade operacional para gerenciar</Typography>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl pt-8">
            {isAdmin && (
              <button
                onClick={() => setSelectedStoreId('all')}
                className="p-6 rounded-3xl bg-brand-primary/[0.05] border border-brand-primary/20 hover:border-brand-primary/50 hover:bg-brand-primary/[0.1] transition-all group text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={20} className="text-brand-primary" />
                </div>
                <Typography variant="caption" className="block text-brand-primary font-black uppercase tracking-widest text-[10px] mb-2">Visão Global</Typography>
                <Typography variant="h3" className="text-white font-black uppercase tracking-tight group-hover:text-brand-primary transition-colors">Visualizar Toda a Tropa</Typography>
              </button>
            )}
            {stores.map(store => (
              <button
                key={store.id}
                onClick={() => setSelectedStoreId(store.id)}
                className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-brand-primary/50 hover:bg-white/[0.05] transition-all group text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={20} className="text-brand-primary" />
                </div>
                <Typography variant="caption" className="block text-white/40 font-black uppercase tracking-widest text-[10px] mb-2">Unidade</Typography>
                <Typography variant="h3" className="text-white font-black uppercase tracking-tight group-hover:text-brand-primary transition-colors">{store.name}</Typography>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {(!isAdmin || selectedStoreId) && (
        <>
          <header className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8 shrink-0">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                  <Users size={24} />
                </div>
                {(isAdmin || role === 'dono') && (
                  <button onClick={() => setSelectedStoreId('')} className="group flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 hover:border-brand-primary/50 transition-all">
                    <Typography variant="tiny" className="font-black uppercase tracking-widest text-white/40 group-hover:text-brand-primary transition-colors">
                      {selectedStoreId === 'all' ? 'VISÃO GLOBAL' : (stores.find(s => s.id === selectedStoreId)?.name || 'UNIDADE')}
                    </Typography>
                    <RefreshCw size={12} className="text-white/20 group-hover:text-brand-primary group-hover:rotate-180 transition-all duration-500" />
                  </button>
                )}
              </div>
              <div className="space-y-1">
                <Typography variant="h1" className="text-5xl font-black uppercase tracking-tighter text-white">
                  Time de <span className="text-brand-primary">Elite</span>
                </Typography>
                <Typography variant="body" className="text-white/40 uppercase tracking-[0.3em] font-black text-xs">Gestão de Tropa & Hierarquia MX</Typography>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full lg:w-auto">
              <div className="relative group w-full sm:w-80">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                <input 
                  placeholder="LOCALIZAR ESPECIALISTA..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-white/10"
                />
              </div>
              <div className="flex w-full sm:w-auto gap-4">
                <button 
                  onClick={() => {setIsRefetching(true); refetch().then(() => setIsRefetching(false))}} 
                  className="h-14 w-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all active:scale-95"
                >
                  <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                </button>
                {(role === 'admin' || role === 'dono' || role === 'gerente') && (
                  <button 
                    onClick={() => setIsUserModalOpen(true)}
                    className="flex-1 sm:flex-none h-14 px-8 bg-brand-primary hover:bg-brand-primary-hover text-[#0A0A0B] rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-[0_10px_30px_rgba(34,197,94,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus size={18} /> NOVO RECRUTA
                  </button>
                )}
              </div>
            </div>
          </header>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
            {stats.map((item, idx) => (
              <motion.div 
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5 relative overflow-hidden group"
              >
                <div className={cn("absolute -top-12 -right-12 w-24 h-24 blur-[40px] opacity-20 bg-gradient-to-br", item.color)} />
                <div className="flex items-center justify-between relative z-10">
                  <div className="space-y-2">
                    <Typography variant="caption" className="block uppercase tracking-widest text-white/40 font-black text-[9px]">{item.label}</Typography>
                    <Typography variant="h1" className="text-4xl font-black text-white tabular-nums leading-none">{item.value}</Typography>
                  </div>
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-white transition-all group-hover:scale-110 group-hover:border-white/20",
                    item.tone === 'brand' && "text-brand-primary border-brand-primary/20 bg-brand-primary/5"
                  )}>
                    <item.icon size={24} strokeWidth={1.5} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="relative z-10 flex-1 min-h-0 pb-32" aria-live="polite">
            {filteredTeam.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTeam.map((member, i) => {
                  const vigencia = getVigenciaStatus(member)
                  return (
                    <motion.article 
                      key={member.id} 
                      layout 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      transition={{ delay: i * 0.05 }} 
                      className="group relative rounded-[40px] bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden flex flex-col h-full"
                    >
                      {/* Card Header Background Glow */}
                      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      
                      <div className="p-6 pb-0 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                          <div className={cn("w-1.5 h-1.5 rounded-full", member.checkin_today ? "bg-brand-primary shadow-[0_0_8px_#22C55E] animate-pulse" : "bg-white/20")} />
                          <span className="text-[9px] font-black uppercase tracking-widest text-white/60">
                            {member.checkin_today ? 'Operacional' : 'Offline'}
                          </span>
                        </div>
                        <div className={cn("px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest", vigencia.color)}>
                          {vigencia.label}
                        </div>
                      </div>

                      <div className="p-8 flex flex-col items-center text-center space-y-6 relative z-10 flex-1">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-[36px] bg-gradient-to-br from-brand-primary/20 to-mx-emerald-900/20 border-2 border-white/10 overflow-hidden group-hover:scale-105 group-hover:border-brand-primary/50 transition-all duration-500 shadow-2xl">
                            <img 
                              src={getAvatarUrl(member.name || '', { background: '0D3B2E', color: '22C55E' })} 
                              alt="" className="w-full h-full object-cover" 
                            />
                          </div>
                          {member.role === 'admin' && <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-mx-blue-500 text-white flex items-center justify-center border-4 border-[#0A0A0B] shadow-lg"><Shield size={14} /></div>}
                        </div>
                        
                        <div className="space-y-1">
                          <Typography variant="h3" className="text-xl font-black text-white uppercase tracking-tight truncate max-w-[200px]">{member.name}</Typography>
                          <Typography variant="caption" className="text-brand-primary font-black uppercase tracking-[0.2em] text-[9px]">
                            {member.role || 'ESPECIALISTA'} {selectedStoreId === 'all' && member.store_name && `• ${member.store_name}`}
                          </Typography>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-3 pt-4">
                          <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                            <span className="block text-[8px] text-white/30 font-black uppercase tracking-widest mb-1">Entrada</span>
                            <span className="text-[10px] text-white font-bold">{member.started_at ? format(parseISO(member.started_at), 'dd/MM/yy') : '---'}</span>
                          </div>
                          <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                            <span className="block text-[8px] text-white/30 font-black uppercase tracking-widest mb-1">Saída</span>
                            <span className="text-[10px] text-white font-bold">{member.ended_at ? format(parseISO(member.ended_at), 'dd/MM/yy') : 'ATIVA'}</span>
                          </div>
                        </div>
                      </div>

                      <footer className="p-6 pt-0 mt-auto relative z-10 grid grid-cols-3 gap-3">
                        <button 
                          onClick={() => setEditingMember(member)}
                          className="h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                          title="Configurações"
                        >
                          <Settings2 size={18} />
                        </button>
                        <button 
                          onClick={() => window.open(`tel:${member.phone}`)}
                          className="h-12 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary hover:bg-brand-primary/10 transition-all"
                          title="Contato"
                        >
                          <Phone size={18} />
                        </button>
                        <Link 
                          to="/relatorios/performance-vendedores"
                          className="h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                          title="Performance"
                        >
                          <TrendingUp size={18} />
                        </Link>
                      </footer>
                    </motion.article>
                  )
                })}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[40vh] space-y-6 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/10">
                  <Users size={40} />
                </div>
                <div className="space-y-1">
                  <Typography variant="h3" className="text-white font-black uppercase tracking-tight">Vácuo de Tropa</Typography>
                  <Typography variant="body" className="text-white/20 uppercase tracking-widest font-black text-[10px]">Nenhum especialista localizado nesta unidade operacional</Typography>
                </div>
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {editingMember && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 overflow-hidden" role="dialog" aria-modal="true">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingMember(null)} className="absolute inset-0 bg-[#050A09]/95 backdrop-blur-2xl" />
                
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="w-full max-w-xl relative z-10">
                  <div className="relative bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-mx-3xl overflow-hidden">
                    <div className="h-2 w-full bg-gradient-to-r from-brand-primary via-mx-emerald-400 to-mx-blue-500" />
                    
                    <form onSubmit={handleUpdateVigencia} className="p-10 space-y-8">
                      <header className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                            <ShieldCheck size={32} />
                          </div>
                          <div>
                            <Typography variant="h3" className="text-2xl font-black uppercase tracking-tight text-white">Controle Operacional</Typography>
                            <Typography variant="caption" className="text-brand-primary uppercase tracking-[0.2em] font-black text-[10px]">{editingMember.name}</Typography>
                          </div>
                        </div>
                        <button type="button" onClick={() => setEditingMember(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">
                          <X size={20} />
                        </button>
                      </header>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Typography variant="caption" className="px-2 font-black uppercase tracking-widest text-white/40 text-[9px]">Início Contrato</Typography>
                          <input 
                            type="date" required 
                            value={editingMember.started_at || ''} 
                            onChange={e => setEditingMember({...editingMember, started_at: e.target.value})} 
                            className="w-full h-14 px-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:outline-none focus:border-brand-primary/50 transition-all [color-scheme:dark]" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Typography variant="caption" className="px-2 font-black uppercase tracking-widest text-white/40 text-[9px]">Término (Opcional)</Typography>
                          <input 
                            type="date" 
                            value={editingMember.ended_at || ''} 
                            onChange={e => setEditingMember({...editingMember, ended_at: e.target.value})} 
                            className="w-full h-14 px-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:outline-none focus:border-brand-primary/50 transition-all [color-scheme:dark]" 
                          />
                        </div>
                        
                        <div className="col-span-2 space-y-4 pt-4 border-t border-white/5">
                          <label className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all cursor-pointer group">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary"><Power size={20} /></div>
                              <div className="space-y-0.5">
                                <Typography variant="h3" className="text-sm font-black uppercase tracking-tight text-white">Status Ativo</Typography>
                                <Typography variant="caption" className="text-[9px] text-white/30 uppercase font-black">Habilitado no ecossistema</Typography>
                              </div>
                            </div>
                            <input type="checkbox" checked={editingMember.is_active} onChange={e => setEditingMember({...editingMember, is_active: e.target.checked})} className="w-6 h-6 rounded-lg accent-brand-primary" />
                          </label>
                          
                          <label className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all cursor-pointer group">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-status-warning/10 flex items-center justify-center text-status-warning"><ShieldAlert size={20} /></div>
                              <div className="space-y-0.5">
                                <Typography variant="h3" className="text-sm font-black uppercase tracking-tight text-white">Carência MX</Typography>
                                <Typography variant="caption" className="text-[9px] text-white/30 uppercase font-black">Ignorar metas do mês vigente</Typography>
                              </div>
                            </div>
                            <input type="checkbox" checked={editingMember.closing_month_grace} onChange={e => setEditingMember({...editingMember, closing_month_grace: e.target.checked})} className="w-6 h-6 rounded-lg accent-status-warning" />
                          </label>
                        </div>
                      </div>

                      <button 
                        type="submit" disabled={saving} 
                        className="w-full h-16 bg-brand-primary hover:bg-brand-primary-hover text-[#0A0A0B] rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                      >
                        {saving ? <RefreshCw className="animate-spin" /> : <Zap size={20} className="fill-[#0A0A0B]" />}
                        SINCRONIZAR VIGÊNCIA
                      </button>
                    </form>
                  </div>
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
