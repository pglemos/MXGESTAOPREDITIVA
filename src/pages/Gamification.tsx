import { Award, Medal, Star, Target, TrendingUp, Trophy, Zap, RefreshCw, X, Search, ChevronRight, Flame, Crown } from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import useAppStore from '@/stores/main'

const INITIAL_RANKING = [
  { id: '1', name: 'João Silva', points: 1250, sales: 12, appointments: 45, trend: 'up', avatar: 'https://i.pravatar.cc/150?u=joao' },
  { id: '2', name: 'Maria Oliveira', points: 1100, sales: 10, appointments: 38, trend: 'up', avatar: 'https://i.pravatar.cc/150?u=maria' },
  { id: '3', name: 'Pedro Santos', points: 950, sales: 8, appointments: 30, trend: 'down', avatar: 'https://i.pravatar.cc/150?u=pedro' },
  { id: '4', name: 'Ana Costa', points: 820, sales: 7, appointments: 25, trend: 'up', avatar: 'https://i.pravatar.cc/150?u=ana' },
  { id: '5', name: 'Lucas Lima', points: 750, sales: 6, appointments: 22, trend: 'down', avatar: 'https://i.pravatar.cc/150?u=lucas' },
]

const challenges = [
  { id: 1, title: 'Mestre dos Agendamentos', description: 'Faça 15 agendamentos esta semana.', target: 15, current: 12, reward: '500 pts + Insignia', icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
  { id: 2, title: 'Fechador de Ouro', description: 'Conclua 5 vendas no mês.', target: 5, current: 3, reward: '1000 pts + Medalha', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
  { id: 3, title: 'Flash Follow-up', description: 'Responda 20 leads em menos de 5 minutos.', target: 20, current: 20, reward: '300 pts', icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100', completed: true },
]

const badges = [
  { id: 1, name: 'Top Seller (Jan)', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50', date: 'Jan 2026' },
  { id: 2, name: 'SLA Master', icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50', date: 'Fev 2026' },
  { id: 3, name: '100 Visitas', icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-50', date: 'Dez 2025' },
]

export default function Gamification() {
  const { refetch: refetchAll } = useAppStore()
  const [isRefetching, setIsRefetching] = useState(false)
  const [timeFilter, setTimeFilter] = useState('Semana')
  const [searchTerm, setSearchTerm] = useState('')

  // 11. Performance: Memoized ranking filtering
  const filteredRanking = useMemo(() => {
    return INITIAL_RANKING.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [searchTerm])

  const handleRefresh = async () => {
    setIsRefetching(true)
    await refetchAll?.()
    setIsRefetching(false)
    toast.success('Matrix de reconhecimento sincronizada!')
  }

  return (
    <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)]" />
            <h1 className="text-[38px] font-black tracking-tighter leading-none">Cultura de <span className="text-amber-500">Elite</span></h1>
          </div>
          <div className="flex items-center gap-3 pl-6 mt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Reconhecimento & Engajamento Operacional</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <button 
            onClick={handleRefresh}
            className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black active:scale-90 transition-all"
          >
            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
          </button>
          
          <div className="bg-gray-100/50 p-1 rounded-2xl flex border border-gray-100 shadow-inner">
            {['Semana', 'Mês', 'Ano'].map((label) => (
              <button 
                key={label}
                onClick={() => setTimeFilter(label)}
                className={cn("px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", timeFilter === label ? "bg-white text-amber-600 shadow-sm" : "text-gray-400 hover:text-pure-black")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 shrink-0">
        {[
          { label: 'Pontos Totais', value: '4.870', icon: Trophy, tone: 'bg-amber-50 text-amber-600 border-amber-100' },
          { label: 'Desafios Ativos', value: '03', icon: Target, tone: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
          { label: 'Insígnias', value: '03', icon: Award, tone: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
          { label: 'Tendência', value: '+12%', icon: TrendingUp, tone: 'bg-orange-50 text-orange-600 border-orange-100' },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-gray-100 rounded-[2.2rem] p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className={cn("absolute -right-4 -top-4 w-24 h-24 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity", item.tone.split(' ')[1])} />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border border-white shadow-sm", item.tone)}>
                <item.icon size={18} strokeWidth={2.5} />
              </div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{item.label}</p>
            </div>
            <h3 className="text-3xl font-black text-pure-black tracking-tighter font-mono-numbers relative z-10">{item.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 min-h-0 pb-32">
        
        {/* Ranking List (8/12) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="bg-white border border-gray-100 rounded-[3rem] shadow-elevation overflow-hidden flex flex-col h-full group relative">
            <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shrink-0 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-pure-black text-white flex items-center justify-center shadow-2xl transform rotate-3">
                  <Trophy size={28} strokeWidth={2.5} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-pure-black tracking-tight leading-none mb-1">Mural da Glória</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Ranking Consolidado da Unidade</p>
                </div>
              </div>
              <div className="relative group w-full max-w-[240px]">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500" />
                <input 
                  type="text" 
                  placeholder="Buscar especialista..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-full pl-10 pr-4 py-2.5 text-xs font-bold focus:outline-none focus:border-amber-200 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              <ul className="divide-y divide-gray-50">
                <AnimatePresence mode="popLayout">
                  {filteredRanking.map((user, index) => (
                    <motion.li 
                      key={user.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        "p-8 transition-all hover:bg-gray-50/50 group/item flex items-center justify-between gap-8",
                        index === 0 && "bg-amber-50/20 border-l-4 border-amber-500"
                      )}
                    >
                      <div className="flex items-center gap-6 min-w-0">
                        <div className="w-12 text-center shrink-0">
                          {index === 0 ? <Crown size={32} className="text-amber-500 fill-amber-500/20 mx-auto animate-bounce" /> : 
                           index === 1 ? <Medal size={28} className="text-gray-400 mx-auto" /> : 
                           index === 2 ? <Medal size={28} className="text-orange-700 mx-auto" /> : 
                           <span className="text-lg font-black text-gray-200 font-mono-numbers">#{(index + 1).toString().padStart(2, '0')}</span>}
                        </div>
                        
                        <div className="relative">
                          <div className="w-16 h-16 rounded-[1.5rem] border-2 border-white shadow-xl overflow-hidden group-hover/item:rotate-3 transition-transform">
                            {/* 6. Broken Avatar fix */}
                            <img 
                              src={user.avatar} 
                              alt="" 
                              className="w-full h-full object-cover" 
                              onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f1f5f9&color=1a1d20&bold=true` }}
                            />
                          </div>
                          {index === 0 && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-white shadow-sm flex items-center justify-center">
                              <Star size={10} className="text-white fill-current" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-lg font-black text-pure-black truncate uppercase tracking-tight group-hover/item:text-amber-600 transition-colors">{user.name}</h4>
                          <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 opacity-60">
                            <span className="flex items-center gap-1.5"><ChevronRight size={10} strokeWidth={3} className="text-amber-500" /> {user.sales} Vendas</span>
                            <span className="flex items-center gap-1.5"><ChevronRight size={10} strokeWidth={3} className="text-amber-500" /> {user.appointments} Agd</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 shrink-0">
                        <div className="text-right">
                          <p className="text-3xl font-black text-indigo-600 font-mono-numbers tracking-tighter leading-none mb-1">{user.points}</p>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none">PTS ACUMULADOS</p>
                        </div>
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm", user.trend === 'up' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100")}>
                          <TrendingUp size={20} strokeWidth={2.5} className={cn(user.trend === 'down' && "rotate-180")} />
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Sidebar (4/12) */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-pure-black rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-3xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-transparent to-transparent z-0 opacity-40" />
            
            <div className="relative z-10 flex items-center gap-5 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-xl">
                <Target size={28} className="text-amber-500" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1">Desafios Ativos</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Geração de XP Extra</p>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              {challenges.map((ch) => (
                <div key={ch.id} className={cn(
                  "p-6 rounded-3xl border transition-all relative overflow-hidden group/ch",
                  ch.completed ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10 hover:bg-white/10"
                )}>
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", ch.completed ? "bg-emerald-500 text-white" : "bg-white/10 text-white/60")}>
                      <ch.icon size={20} strokeWidth={2.5} />
                    </div>
                    <Badge className={cn("font-black text-[8px] uppercase border-none px-3 h-6 rounded-lg", ch.completed ? "bg-emerald-500 text-white" : "bg-amber-500 text-pure-black")}>
                      {ch.completed ? 'VALIDADO' : ch.reward}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-black mb-2 uppercase tracking-tight">{ch.title}</h4>
                  <p className="text-xs font-bold text-white/40 mb-6 leading-relaxed">{ch.description}</p>
                  
                  {!ch.completed && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/30">
                        <span>Progresso</span>
                        <span className="text-amber-500 font-mono-numbers">{ch.current} / {ch.target}</span>
                      </div>
                      {/* 3. Progress bar animation */}
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-px shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(ch.current / ch.target) * 100}%` }}
                          transition={{ duration: 1.5, ease: "circOut" }}
                          className="h-full bg-amber-500 rounded-full shadow-lg shadow-amber-500/20"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <Award size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-pure-black tracking-tight leading-none mb-1">Insígnias</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Suas Conquistas</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {badges.map((badge) => (
                <div key={badge.id} className="p-5 rounded-[2rem] bg-gray-50/50 border border-gray-100 flex flex-col items-center text-center hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all cursor-help group/badge">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-white transition-transform group-hover/badge:scale-110 group-hover/badge:rotate-6", badge.bg, badge.color)}>
                    <badge.icon size={28} strokeWidth={2.5} />
                  </div>
                  <p className="text-[10px] font-black text-pure-black uppercase tracking-tight mb-1">{badge.name}</p>
                  <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{badge.date}</p>
                </div>
              ))}
              {/* 17. Empty state fix */}
              <div className="p-5 rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all cursor-help bg-white/50">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
                  <Star size={24} className="text-gray-300" strokeWidth={2.5} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Bloqueado</p>
                <button className="mt-2 text-[8px] font-black text-indigo-500 uppercase tracking-widest hover:underline">Ver Requisitos</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
