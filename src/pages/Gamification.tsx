import { Award, Medal, Star, Target, TrendingUp, Trophy, Zap, RefreshCw, ChevronRight, Crown, Flame, Search, ShieldCheck, Clock, BarChart3, Users, Car } from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useCheckins } from '@/hooks/useCheckins'
import { useRanking } from '@/hooks/useRanking'
import { calcularFunil, calcularScoreMX, getDiasInfo } from '@/lib/calculations'
import { Badge } from '@/components/ui/badge'

export default function Gamification() {
  const { profile } = useAuth()
  const { checkins, loading: checkisLoading } = useCheckins()
  const { ranking, loading: rankingLoading, refetch: refetchRanking } = useRanking()
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefetching, setIsRefetching] = useState(false)

  const dias = useMemo(() => getDiasInfo(), [])

  // Processar Ranking com MX Score
  const processedRanking = useMemo(() => {
    return ranking.map(entry => {
      // Para cada vendedor no ranking, pegar seus checkins para calcular o funil e o score real
      const sellerCheckins = checkins.filter(c => c.seller_user_id === entry.user_id)
      const funil = calcularFunil(sellerCheckins)
      const score = calcularScoreMX(entry.vnd_total, entry.meta, funil, sellerCheckins.length, dias.decorridos)
      
      return {
        ...entry,
        mx_score: score,
        conversion_status: funil.tx_visita_vnd >= 33 ? 'EXCELÊNCIA' : 'EM EVOLUÇÃO',
        discipline_status: sellerCheckins.length >= dias.decorridos ? 'IMPECÁVEL' : 'PENDENTE'
      }
    }).sort((a, b) => b.mx_score - a.mx_score)
  }, [ranking, checkins, dias])

  const myStats = useMemo(() => {
    return processedRanking.find(r => r.user_id === profile?.id)
  }, [processedRanking, profile])

  const handleRefresh = async () => {
    setIsRefetching(true)
    await refetchRanking()
    setIsRefetching(false)
    toast.success('Matrix de Elite Sincronizada!')
  }

  const challenges = [
    { id: 1, title: 'Check-in Impecável', description: 'Mantenha 100% de disciplina este mês.', target: dias.total, current: checkins.filter(c => c.seller_user_id === profile?.id).length, reward: 'Power Up Multiplier 1.2x', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 2, title: 'Fechador de Elite', description: 'Atinja o benchmark de 33% de conversão Visita/Venda.', target: 33, current: myStats ? Math.round((myStats.vnd_total / (myStats.visitas || 1)) * 100) : 0, reward: 'Elite Badge', icon: Zap, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  if (checkisLoading || rankingLoading) return (
    <div className="h-full w-full flex items-center justify-center bg-white"><RefreshCw className="animate-spin text-indigo-600" /></div>
  )

  return (
    <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10 bg-white">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-gray-100 pb-10 shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-indigo-600 rounded-full shadow-lg" />
            <h1 className="text-[38px] font-black tracking-tighter leading-none uppercase">Cultura de <span className="text-indigo-600">Elite</span></h1>
          </div>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] pl-6 mt-2">Reconhecimento & Performance MX</p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button onClick={handleRefresh} className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-indigo-600 active:scale-90 transition-all">
            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
          </button>
          <div className="flex items-center justify-center gap-3 rounded-full border border-gray-100 bg-gray-50 px-6 py-3 shadow-sm">
            <Trophy size={18} className="text-amber-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-950">Season Alpha 2026</span>
          </div>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {[
          { label: 'Seu MX Score', value: myStats?.mx_score || 0, icon: Trophy, tone: 'bg-indigo-50 text-indigo-600', sub: 'High Perf' },
          { label: 'Vendas Mês', value: myStats?.vnd_total || 0, icon: Car, tone: 'bg-emerald-50 text-emerald-600', sub: `${myStats?.atingimento}% da Meta` },
          { label: 'Disciplina', value: `${challenges[0].current}/${dias.decorridos}`, icon: ShieldCheck, tone: 'bg-violet-50 text-violet-600', sub: 'Check-ins' },
          { label: 'Posição Unidade', value: `#${myStats?.position || '--'}`, icon: Crown, tone: 'bg-amber-50 text-amber-600', sub: 'Ranking Local' },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-gray-100 p-8 rounded-[2.5rem] flex flex-col justify-between group relative overflow-hidden shadow-sm hover:shadow-xl transition-all">
            <div className="flex items-center justify-between gap-4 relative z-10">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{item.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black tracking-tighter text-slate-950 font-mono-numbers">{item.value}</p>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{item.sub}</span>
                </div>
              </div>
              <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-3', item.tone)}>
                <item.icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 min-h-0 pb-32">
        {/* Power Ranking List */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          <div className="bg-white border border-gray-100 rounded-[3rem] h-full flex flex-col overflow-hidden shadow-sm group">
            <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-xl transform rotate-3">
                  <BarChart3 size={28} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Power Ranking Unidade</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Ranking Ponderado por Resultado e Processo</p>
                </div>
              </div>
              <div className="relative group w-64 hidden sm:block">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input 
                  type="text" 
                  placeholder="Filtrar tropa..." 
                  className="w-full h-12 pl-12 pr-6 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-indigo-400 transition-all shadow-inner" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <ul className="divide-y divide-gray-50">
                {processedRanking.map((user, i) => (
                  <li key={user.user_id} className={cn("p-10 flex items-center justify-between gap-10 transition-all hover:bg-gray-50/50 group/item", i === 0 && "bg-amber-50/20 border-l-8 border-amber-400")}>
                    <div className="flex items-center gap-10 min-w-0">
                      <div className="w-12 text-center shrink-0">
                        {i === 0 ? (
                          <div className="relative">
                            <Crown size={32} className="text-amber-500 animate-bounce mx-auto" />
                            <span className="text-[8px] font-black text-amber-600 uppercase absolute -bottom-4 left-1/2 -translate-x-1/2">Elite</span>
                          </div>
                        ) : (
                          <span className="text-2xl font-black text-gray-200 tracking-tighter">#{(i + 1).toString().padStart(2, '0')}</span>
                        )}
                      </div>
                      
                      <div className="w-16 h-16 rounded-[1.5rem] border-2 border-white shadow-lg overflow-hidden bg-gray-100 shrink-0 transform group-hover/item:scale-105 transition-all">
                        <img src={`https://ui-avatars.com/api/?name=${user.user_name}&background=6366f1&color=fff`} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="min-w-0">
                        <h4 className="text-xl font-black text-slate-950 uppercase tracking-tighter truncate group-hover/item:text-indigo-600 transition-colors">{user.user_name}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <Badge variant="outline" className="text-[7px] font-black uppercase border-gray-200 bg-white">{user.vnd_total} Vendas</Badge>
                          <Badge variant="outline" className="text-[7px] font-black uppercase border-indigo-100 bg-indigo-50 text-indigo-600">{user.conversion_status}</Badge>
                          <Badge variant={user.discipline_status === 'IMPECÁVEL' ? 'secondary' : 'outline'} className={cn("text-[7px] font-black uppercase", user.discipline_status === 'IMPECÁVEL' ? "bg-emerald-500 text-white border-none" : "border-rose-100 text-rose-600 bg-rose-50")}>{user.discipline_status}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-10">
                      <div className="text-right">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">MX Score</p>
                        <p className="text-4xl font-black text-slate-950 font-mono-numbers tracking-tighter leading-none">{user.mx_score}</p>
                      </div>
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm transition-all", user.mx_score > 800 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100")}>
                        <TrendingUp size={20} className={cn(user.mx_score < 400 && "rotate-180")} strokeWidth={3} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Sidebar - Challenges & Evolution */}
        <div className="lg:col-span-4 flex flex-col gap-10">
          <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-transparent pointer-events-none" />
            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-xl group-hover:rotate-6 transition-transform">
                <Target size={28} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Missões Ativas</h3>
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1">Ganhos em XP MX</p>
              </div>
            </div>
            
            <div className="space-y-6 relative z-10">
              {challenges.map(ch => (
                <div key={ch.id} className="p-8 rounded-[2rem] border border-white/5 bg-white/5 hover:bg-white/10 transition-all group/ch">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-amber-400 shadow-inner border border-white/5 group-hover/ch:scale-110 transition-transform">
                      <ch.icon size={24} />
                    </div>
                    <Badge className="bg-amber-500 text-slate-950 border-none text-[8px] font-black px-3 py-1 uppercase tracking-widest">{ch.reward}</Badge>
                  </div>
                  <h4 className="text-base font-black mb-2 uppercase tracking-tight">{ch.title}</h4>
                  <p className="text-[10px] font-bold text-white/40 uppercase mb-6 leading-relaxed">{ch.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[8px] font-black uppercase text-indigo-400 tracking-widest">Sincronização</span>
                      <span className="text-xs font-black font-mono-numbers">{Math.min(ch.current, ch.target)}/{ch.target}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden p-px shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${Math.min((ch.current/ch.target)*100, 100)}%` }} 
                        transition={{ duration: 2, ease: "circOut" }} 
                        className="h-full bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-[3rem] p-10 flex flex-col items-center text-center group shadow-sm">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-inner mb-6 group-hover:scale-110 transition-transform">
              <Award size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-950 tracking-tight uppercase mb-2">Status Evolutivo</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-10 max-w-[200px]">
              {myStats && myStats.mx_score > 800 ? "Você atingiu o nível Platinum de Excelência!" : `Faltam ${800 - (myStats?.mx_score || 0)} MX Score para o status Elite Platinum.`}
            </p>
            <button className="w-full py-5 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95">Recompensas da Season</button>
          </div>
        </div>
      </div>
    </div>
  )
}
