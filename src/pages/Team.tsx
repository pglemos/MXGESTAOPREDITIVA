import { useTeam } from '@/hooks/useTeam'
import { useState, useMemo } from 'react'
import { Users, UserPlus, Search, Mail, Phone, Shield, BadgeCheck, MoreVertical, RefreshCw, X, ChevronRight, Star, TrendingUp, Zap, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'

export default function Team() {
  const { sellers, loading, refetch } = useTeam()
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefetching, setIsRefetching] = useState(false)

  const filteredTeam = useMemo(() => {
    return sellers.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.role?.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [sellers, searchTerm])

  const stats = [
    { label: 'Efetivo Total', value: sellers.length, icon: Users, tone: 'bg-brand-primary-surface text-brand-primary' },
    { label: 'Online Agora', value: sellers.filter(s => s.checkin_today).length, icon: Zap, tone: 'bg-status-success-surface text-status-success' },
    { label: 'Elite Tier', value: '08', icon: Star, tone: 'bg-status-warning-surface text-status-warning' },
    { label: 'Vagas Ativas', value: '02', icon: UserPlus, tone: 'bg-mx-slate-50 text-text-tertiary' },
  ]

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
            <input type="text" placeholder="Buscar especialista..." className="mx-input !h-9 !pl-9 !text-[10px]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button className="mx-button-primary bg-brand-secondary"><UserPlus size={18} /> Novo Recruta</button>
        </div>
      </div>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg pb-mx-3xl">
        {filteredTeam.map((member, i) => (
          <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="mx-card flex flex-col group hover:shadow-mx-xl hover:-translate-y-1 relative overflow-hidden">
            <div className="p-mx-lg border-b border-border-subtle bg-mx-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", member.checkin_today ? "bg-status-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-mx-slate-300")} />
                <span className="text-[8px] font-black uppercase tracking-widest text-text-tertiary">{member.checkin_today ? 'Operacional' : 'Offline'}</span>
              </div>
              <button className="w-8 h-8 rounded-mx-md text-mx-slate-300 hover:text-text-primary transition-all flex items-center justify-center"><MoreVertical size={16} /></button>
            </div>
            <div className="p-mx-lg flex flex-col items-center text-center flex-1">
              <div className="w-20 h-20 rounded-mx-2xl border-4 border-white shadow-mx-lg overflow-hidden bg-mx-slate-50 mb-mx-md group-hover:scale-105 transition-transform">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || '')}&background=4f46e5&color=fff&bold=true`} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-black text-text-primary uppercase tracking-tight leading-none mb-1 group-hover:text-brand-primary transition-colors">{member.name}</h3>
              <p className="mx-text-caption !text-[8px] opacity-60 uppercase">{member.role || 'Especialista'}</p>
              
              <div className="w-full mt-mx-lg grid grid-cols-2 gap-2">
                <div className="bg-mx-slate-50 p-2 rounded-mx-lg border border-border-subtle"><p className="text-[8px] font-black text-text-tertiary uppercase mb-0.5">Vendas</p><p className="font-black text-sm font-mono-numbers">12</p></div>
                <div className="bg-mx-slate-50 p-2 rounded-mx-lg border border-border-subtle"><p className="text-[8px] font-black text-text-tertiary uppercase mb-0.5">Agend</p><p className="font-black text-sm font-mono-numbers">45</p></div>
              </div>
            </div>
            <div className="p-mx-md border-t border-border-subtle bg-mx-slate-50/30 flex gap-2">
              <button className="flex-1 h-10 rounded-mx-lg bg-white border border-border-default text-text-tertiary hover:text-brand-primary transition-all flex items-center justify-center shadow-mx-sm"><Mail size={16} /></button>
              <button className="flex-1 h-10 rounded-mx-lg bg-white border border-border-default text-text-tertiary hover:text-status-success transition-all flex items-center justify-center shadow-mx-sm"><Phone size={16} /></button>
              <button className="flex-1 h-10 rounded-mx-lg bg-brand-secondary text-white flex items-center justify-center shadow-mx-md hover:shadow-mx-lg transition-all"><ChevronRight size={18} /></button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
