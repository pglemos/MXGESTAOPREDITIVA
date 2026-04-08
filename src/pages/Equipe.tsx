import { useTeam } from '@/hooks/useTeam'
import { useState, useMemo } from 'react'
import { Users, UserPlus, Search, Mail, Phone, Shield, BadgeCheck, MoreVertical, RefreshCw, X, ChevronRight, Star, TrendingUp, Zap, Filter, Calendar, Settings2, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns'
import { supabase } from '@/lib/supabase'

export default function Team() {
  const { sellers, loading, refetch } = useTeam()
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefetching, setIsRefetching] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const teamList = sellers || []
  const filteredTeam = useMemo(() => {
    return teamList.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.role?.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [teamList, searchTerm])

  const handleUpdateVigencia = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMember) return
    setSaving(true)
    const { error } = await supabase
      .from('store_sellers')
      .update({
        started_at: editingMember.started_at,
        ended_at: editingMember.ended_at || null,
        is_active: editingMember.is_active,
        closing_month_grace: editingMember.closing_month_grace
      })
      .eq('seller_user_id', editingMember.id)
    
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Vigência operacional atualizada!')
    setEditingMember(null)
    refetch()
  }

  const getVigenciaStatus = (member: any) => {
    const today = startOfDay(new Date())
    const start = member.started_at ? startOfDay(parseISO(member.started_at)) : null
    const end = member.ended_at ? startOfDay(parseISO(member.ended_at)) : null
    
    if (!member.is_active) return { label: 'Inativo', color: 'bg-rose-100 text-rose-700' }
    if (start && isAfter(start, today)) return { label: 'Pré-Contrato', color: 'bg-indigo-100 text-indigo-700' }
    if (end && isBefore(end, today)) return { label: 'Contrato Encerrado', color: 'bg-rose-100 text-rose-700' }
    if (end) return { label: 'Em Aviso', color: 'bg-amber-100 text-amber-700' }
    return { label: 'Ativo', color: 'bg-emerald-100 text-emerald-700' }
  }

  const stats = useMemo(() => [
    { label: 'Efetivo Total', value: teamList.length, icon: Users, tone: 'bg-indigo-50 text-indigo-600' },
    { label: 'Online Agora', value: teamList.filter(s => s.checkin_today).length, icon: Zap, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Elite Tier', value: '08', icon: Star, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Ativos', value: teamList.filter(s => s.is_active).length, icon: BadgeCheck, tone: 'bg-slate-50 text-slate-400' },
  ], [teamList])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-surface-alt/50 backdrop-blur-xl">
      <div className="w-16 h-16 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin"></div>
      <p className="mt-mx-md mx-text-caption animate-pulse uppercase">Escaneando Hierarquia de Elite...</p>
    </div>
  )

  return (
    <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-mx-xs">
            <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
            <h1 className="mx-heading-hero">Time de <span className="text-brand-primary">Elite</span></h1>
          </div>
          <p className="mx-text-caption pl-mx-md opacity-60 uppercase tracking-widest">Gestão de Tropa & Hierarquia</p>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <button onClick={() => {setIsRefetching(true); refetch().then(() => setIsRefetching(false))}} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary"><RefreshCw size={20} className={cn(isRefetching && "animate-spin")} /></button>
          <div className="relative group w-48 hidden sm:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input type="text" placeholder="Buscar vendedor..." className="mx-input !h-9 !pl-9 !text-[10px]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>          <button className="mx-button-primary bg-brand-secondary"><UserPlus size={18} /> Novo Recruta</button>
        </div>
      </div>

      {/* Stats Grid - Deve aparecer SEMPRE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-mx-sm shrink-0">
        {stats.map((item) => (
          <div key={item.label} className="mx-card p-mx-md flex flex-col justify-between group relative overflow-hidden">
            <div className="flex items-center justify-between gap-mx-xs relative z-10">
              <div><p className="mx-text-caption mb-1">{item.label}</p><p className="text-3xl font-black tracking-tighter font-mono-numbers leading-none">{item.value}</p></div>
              <div className={cn('h-10 w-10 rounded-mx-md flex items-center justify-center border shadow-sm', item.tone)}><item.icon size={18} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Area - Condicional */}
      <div className="flex-1 min-h-0 pb-mx-3xl">
        {filteredTeam.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg">
            {filteredTeam.map((member, i) => {
              const vigencia = getVigenciaStatus(member)
              return (
              <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="mx-card flex flex-col group hover:shadow-mx-xl hover:-translate-y-1 relative overflow-hidden">
                <div className="p-mx-lg border-b border-border-subtle bg-mx-slate-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", member.checkin_today ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-mx-slate-300")} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-text-tertiary">{member.checkin_today ? 'Operacional' : 'Offline'}</span>
                  </div>
                  <Badge className={cn("text-[7px] font-black tracking-widest border-none px-2", vigencia.color)}>{vigencia.label}</Badge>
                </div>
                <div className="p-mx-lg flex flex-col items-center text-center flex-1">
                  <div className="w-20 h-20 rounded-mx-2xl border-4 border-white shadow-mx-lg overflow-hidden bg-mx-slate-50 mb-mx-md group-hover:scale-105 transition-transform">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || '')}&background=4f46e5&color=fff&bold=true`} alt={`Avatar de ${member.name || 'membro da equipe'}`} width={80} height={80} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-lg font-black text-text-primary uppercase tracking-tight leading-none mb-1 group-hover:text-brand-primary transition-colors">{member.name}</h3>
                  <p className="mx-text-caption !text-[8px] opacity-60 uppercase">{member.role || 'Especialista'}</p>
                  
                  <div className="w-full mt-mx-lg grid grid-cols-2 gap-2">
                    <div className="bg-mx-slate-50 p-2 rounded-mx-lg border border-border-subtle"><p className="text-[8px] font-black text-text-tertiary uppercase mb-0.5">Entrada</p><p className="font-black text-[10px] font-mono-numbers">{member.started_at ? format(parseISO(member.started_at), 'dd/MM/yy') : '---'}</p></div>
                    <div className="bg-mx-slate-50 p-2 rounded-mx-lg border border-border-subtle"><p className="text-[8px] font-black text-text-tertiary uppercase mb-0.5">Saída</p><p className="font-black text-[10px] font-mono-numbers">{member.ended_at ? format(parseISO(member.ended_at), 'dd/MM/yy') : 'ATIVA'}</p></div>
                  </div>
                </div>
                <div className="p-mx-md border-t border-border-subtle bg-mx-slate-50/30 flex gap-2">
                  <button 
                    onClick={() => setEditingMember(member)}
                    className="flex-1 h-10 rounded-mx-lg bg-white border border-border-default text-text-tertiary hover:text-indigo-600 transition-all flex items-center justify-center shadow-mx-sm"
                    title="Configurar Vigência"
                  >
                    <Settings2 size={16} />
                  </button>
                  <button className="flex-1 h-10 rounded-mx-lg bg-white border border-border-default text-text-tertiary hover:text-emerald-600 transition-all flex items-center justify-center shadow-mx-sm"><Phone size={16} /></button>
                  <button className="flex-1 h-10 rounded-mx-lg bg-slate-950 text-white flex items-center justify-center shadow-mx-md hover:shadow-mx-lg transition-all"><ChevronRight size={18} /></button>
                </div>
              </motion.div>
            )})}
          </div>
        ) : (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-mx-xl bg-mx-slate-50/20 border-2 border-dashed border-border-default rounded-[3rem]">
            <div className="w-24 h-24 rounded-mx-3xl bg-white shadow-mx-lg flex items-center justify-center mb-mx-lg"><Users size={48} className="text-mx-slate-200" /></div>
            <h3 className="text-3xl font-black text-text-primary tracking-tighter uppercase mb-2">Vácuo de Tropa</h3>
            <p className="mx-text-caption text-text-tertiary max-w-xs leading-relaxed uppercase">Nenhum especialista localizado na loja.</p>
          </div>
        )}
      </div>

      {/* Modal de Gestão de Vigência (EPIC-01) */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] shadow-3xl w-full max-w-xl overflow-hidden border border-white"
            >
              <form onSubmit={handleUpdateVigencia} className="p-10 md:p-14 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm"><Shield size={24} /></div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight">Vigência Operacional</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{editingMember.name}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setEditingMember(null)} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all"><X size={20} /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Início de Contrato</label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input 
                        type="date" 
                        required
                        value={editingMember.started_at || ''} 
                        onChange={e => setEditingMember({...editingMember, started_at: e.target.value})}
                        className="mx-input !pl-12"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Término (Opcional)</label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input 
                        type="date" 
                        value={editingMember.ended_at || ''} 
                        onChange={e => setEditingMember({...editingMember, ended_at: e.target.value})}
                        className="mx-input !pl-12"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 p-6 rounded-3xl bg-slate-50 border border-gray-100 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-emerald-500"><BadgeCheck size={18} /></div>
                        <p className="text-xs font-black uppercase text-slate-700">Contrato Ativo</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={editingMember.is_active} 
                        onChange={e => setEditingMember({...editingMember, is_active: e.target.checked})}
                        className="w-6 h-6 rounded-lg accent-emerald-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-amber-500"><ShieldAlert size={18} /></div>
                        <p className="text-xs font-black uppercase text-slate-700">Carência de Fechamento</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={editingMember.closing_month_grace} 
                        onChange={e => setEditingMember({...editingMember, closing_month_grace: e.target.checked})}
                        className="w-6 h-6 rounded-lg accent-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="mx-button-primary hover:bg-slate-900 shadow-xl w-full sm:w-auto"
                  >
                    {saving ? <RefreshCw className="animate-spin" /> : 'Sincronizar Vigência'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
