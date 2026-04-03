import { Award, Medal, Star, Target, TrendingUp, Trophy, Zap, RefreshCw, ChevronRight, Crown, Flame, Search } from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import useAppStore from '@/stores/main'
import { Badge } from '@/components/ui/badge'

const INITIAL_RANKING = [
  { id: '1', name: 'João Silva', points: 1250, sales: 12, appointments: 45, trend: 'up', avatar: 'https://i.pravatar.cc/150?u=joao' },
  { id: '2', name: 'Maria Oliveira', points: 1100, sales: 10, appointments: 38, trend: 'up', avatar: 'https://i.pravatar.cc/150?u=maria' },
  { id: '3', name: 'Pedro Santos', points: 950, sales: 8, appointments: 30, trend: 'down', avatar: 'https://i.pravatar.cc/150?u=pedro' },
]

const challenges = [
  { id: 1, title: 'Mestre dos Agendamentos', description: 'Faça 15 agendamentos esta semana.', target: 15, current: 12, reward: '500 pts', icon: Target, color: 'text-brand-primary', bg: 'bg-brand-primary-surface' },
  { id: 2, title: 'Fechador de Ouro', description: 'Conclua 5 vendas no mês.', target: 5, current: 3, reward: '1000 pts', icon: Award, color: 'text-status-warning', bg: 'bg-status-warning-surface' },
]

export default function Gamification() {
  const { refetch: refetchAll } = useAppStore()
  const [isRefetching, setIsRefetching] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleRefresh = async () => {
    setIsRefetching(true); await refetchAll?.(); setIsRefetching(false); toast.success('Matriz de Reconhecimento Sincronizada!')
  }

  return (
    <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-mx-xs">
            <div className="w-2 h-10 bg-status-warning rounded-full shadow-mx-md" />
            <h1 className="mx-heading-hero">Cultura de <span className="text-status-warning">Elite</span></h1>
          </div>
          <p className="mx-text-caption pl-mx-md opacity-60 uppercase tracking-widest">Reconhecimento & Engajamento Operacional</p>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <button onClick={handleRefresh} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary active:scale-90 transition-all"><RefreshCw size={20} className={cn(isRefetching && "animate-spin")} /></button>
          <div className="flex items-center justify-center gap-3 rounded-full border border-border-default bg-white px-mx-md py-4 shadow-mx-sm"><Trophy size={18} className="text-status-warning" /><span className="mx-text-caption text-text-primary">Season Alpha 2026</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-mx-sm shrink-0">
        {[
          { label: 'Seu XP Total', value: '4.870', icon: Trophy, tone: 'bg-status-warning-surface text-status-warning' },
          { label: 'Desafios', value: '03', icon: Target, tone: 'bg-brand-primary-surface text-brand-primary' },
          { label: 'Conquistas', value: '12', icon: Award, tone: 'bg-status-success-surface text-status-success' },
          { label: 'Global Rank', value: '#04', icon: TrendingUp, tone: 'bg-mx-slate-50 text-text-tertiary' },
        ].map((item) => (
          <div key={item.label} className="mx-card p-mx-md group relative overflow-hidden">
            <div className="flex items-center justify-between gap-mx-sm relative z-10">
              <div><p className="mx-text-caption mb-1">{item.label}</p><p className="text-3xl font-black tracking-tighter font-mono-numbers">{item.value}</p></div>
              <div className={cn('h-10 w-10 rounded-mx-md flex items-center justify-center border shadow-sm', item.tone)}><item.icon size={18} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0 pb-mx-3xl">
        <div className="lg:col-span-8 flex flex-col gap-mx-lg">
          <div className="mx-card h-full flex flex-col overflow-hidden group">
            <div className="p-mx-lg border-b border-border-subtle flex items-center justify-between bg-mx-slate-50/30">
              <div className="flex items-center gap-mx-sm">
                <div className="w-12 h-12 rounded-mx-lg bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg transform rotate-3"><Trophy size={24} className="text-status-warning" /></div>
                <div><h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1">Mural da Glória</h3><p className="mx-text-caption">Ranking Unidade Alpha</p></div>
              </div>
              <div className="relative group w-48 hidden sm:block">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input type="text" placeholder="Filtrar tropa..." className="mx-input !h-9 !pl-9 !text-[10px]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar"><ul className="divide-y divide-border-subtle">
              {INITIAL_RANKING.map((user, i) => (
                <li key={user.id} className={cn("p-mx-lg flex items-center justify-between gap-mx-lg transition-all hover:bg-mx-slate-50/50 group/item", i === 0 && "bg-status-warning-surface/20 border-l-4 border-status-warning")}>
                  <div className="flex items-center gap-mx-lg min-w-0">
                    <div className="w-10 text-center shrink-0">
                      {i === 0 ? <Crown size={28} className="text-status-warning animate-bounce" /> : <span className="text-lg font-black text-mx-slate-200">#{(i + 1).toString().padStart(2, '0')}</span>}
                    </div>
                    <div className="w-14 h-14 rounded-mx-lg border-2 border-white shadow-mx-md overflow-hidden bg-mx-slate-50 shrink-0"><img src={user.avatar} className="w-full h-full object-cover" /></div>
                    <div className="min-w-0"><h4 className="text-lg font-black text-text-primary uppercase tracking-tight truncate group-hover/item:text-status-warning transition-colors">{user.name}</h4><p className="mx-text-caption !text-[8px] opacity-60 uppercase">{user.sales} Vendas • {user.appointments} Agd</p></div>
                  </div>
                  <div className="flex items-center gap-mx-lg">
                    <div className="text-right"><p className="text-2xl font-black text-brand-primary font-mono-numbers tracking-tighter leading-none mb-1">{user.points}</p><p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest">XP</p></div>
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm", user.trend === 'up' ? "bg-status-success-surface text-status-success border-mx-emerald-100" : "bg-status-error-surface text-status-error border-mx-rose-100")}><TrendingUp size={16} className={cn(user.trend === 'down' && "rotate-180")} /></div>
                  </div>
                </li>
              ))}
            </ul></div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-mx-lg">
          <div className="bg-brand-secondary rounded-mx-3xl p-mx-lg text-white shadow-mx-elite relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(245,158,11,0.1)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />
            <div className="flex items-center gap-mx-sm mb-mx-xl relative z-10">
              <div className="w-12 h-12 rounded-mx-lg bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-xl"><Target size={24} className="text-status-warning" /></div>
              <div><h3 className="text-xl font-black text-white tracking-tight uppercase">Desafios</h3><p className="mx-text-caption text-white/40">Power-ups Ativos</p></div>
            </div>
            <div className="space-y-mx-md relative z-10">
              {challenges.map(ch => (
                <div key={ch.id} className="p-mx-md rounded-mx-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group/ch">
                  <div className="flex justify-between items-start mb-mx-md">
                    <div className="w-10 h-10 rounded-mx-md bg-white/10 flex items-center justify-center text-status-warning shadow-inner"><ch.icon size={20} /></div>
                    <Badge className="bg-status-warning text-brand-secondary border-none text-[8px] px-2">{ch.reward}</Badge>
                  </div>
                  <h4 className="text-sm font-black mb-1 uppercase tracking-tight">{ch.title}</h4>
                  <div className="space-y-2"><div className="flex justify-between mx-text-caption !text-[8px] text-white/30"><span>Progresso</span><span className="text-status-warning font-mono-numbers">{ch.current}/{ch.target}</span></div><div className="h-1 bg-white/5 rounded-full overflow-hidden p-px shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: `${(ch.current/ch.target)*100}%` }} transition={{ duration: 1.5 }} className="h-full bg-status-warning rounded-full" /></div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-card p-mx-lg flex flex-col items-center text-center group">
            <div className="w-16 h-16 rounded-mx-lg bg-status-success-surface text-status-success border border-mx-emerald-100 flex items-center justify-center shadow-inner mb-mx-md group-hover:rotate-6 transition-transform"><Award size={32} /></div>
            <h3 className="text-xl font-black text-text-primary tracking-tight uppercase mb-1">Próximo Nível</h3>
            <p className="mx-text-caption !text-[8px] mb-mx-lg">Faltam 130 XP para Elite Platinum</p>
            <button className="mx-button-primary bg-brand-primary w-full">Ver Recompensas</button>
          </div>
        </div>
      </div>
    </div>
  )
}
