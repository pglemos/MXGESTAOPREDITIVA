import { Award, Medal, Star, Target, TrendingUp, Trophy, Zap, RefreshCw, ChevronRight, Crown, Flame, Search, ShieldCheck, Clock, BarChart3, Users, Car, Sparkles, LayoutDashboard } from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useCheckins } from '@/hooks/useCheckins'
import { useRanking } from '@/hooks/useRanking'
import { calcularFunil, calcularScoreMX, getDiasInfo } from '@/lib/calculations'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'

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

  const handleRefresh = useCallback(async () => {
    setIsRefetching(true); await refetchRanking(); setIsRefetching(false)
    toast.success('Matrix de Elite Sincronizada!')
  }, [refetchRanking])

  const challenges = [
    { id: 1, title: 'Check-in Impecável', description: 'Mantenha 100% de disciplina este mês.', target: dias.total, current: checkins.filter(c => c.seller_user_id === profile?.id).length, reward: 'Power Up Multiplier 1.2x', icon: ShieldCheck, tone: 'brand' },
    { id: 2, title: 'Fechador de Elite', description: 'Atinja o benchmark de 33% de conversão Visita/Venda.', target: 33, current: myStats ? Math.round((myStats.vnd_total / (myStats.visitas || 1)) * 100) : 0, reward: 'Elite Badge', icon: Zap, tone: 'error' },
  ]

  if (checkisLoading || rankingLoading) return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
        <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-6" />
        <Typography variant="caption" tone="muted" className="animate-pulse">Calculando Scores...</Typography>
    </div>
  )

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      
      {/* Header / Culture Toolbar */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
            <Typography variant="h1">Cultura de <span className="text-brand-primary">Elite</span></Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">RECONHECIMENTO & PERFORMANCE MX</Typography>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl shadow-mx-sm h-12 w-12">
            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
          </Button>
          <div className="flex items-center gap-4 bg-white border border-border-default px-8 h-12 rounded-full shadow-mx-sm">
            <Trophy size={18} className="text-status-warning" />
            <Typography variant="caption" className="whitespace-nowrap font-black uppercase tracking-widest">SEASON ALPHA 2026</Typography>
          </div>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
        {[
          { label: 'Seu MX Score', value: myStats?.mx_score || 0, icon: Trophy, tone: 'brand', sub: 'High Perf' },
          { label: 'Vendas Mês', value: myStats?.vnd_total || 0, icon: Car, tone: 'success', sub: `${myStats?.atingimento}% Meta` },
          { label: 'Disciplina', value: `${challenges[0].current}/${dias.decorridos}`, icon: ShieldCheck, tone: 'brand', sub: 'Check-ins' },
          { label: 'Unidade', value: `#${myStats?.position || '--'}`, icon: Crown, tone: 'warning', sub: 'Ranking Local' },
        ].map((item) => (
          <Card key={item.label} className="p-8 border-none shadow-mx-sm group hover:shadow-mx-lg transition-all bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-3xl -mr-12 -mt-12" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <Typography variant="caption" tone="muted" className="block uppercase tracking-widest text-[8px]">{item.label}</Typography>
                <div className="flex items-baseline gap-2">
                    <Typography variant="h1" className="text-4xl tabular-nums leading-none">{item.value}</Typography>
                    <Typography variant="caption" tone="muted" className="text-[8px] font-black uppercase opacity-40">{item.sub}</Typography>
                </div>
              </div>
              <div className={cn(
                'h-12 w-12 rounded-mx-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110',
                item.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                item.tone === 'success' ? 'bg-status-success-surface border-mx-emerald-100 text-status-success' :
                item.tone === 'warning' ? 'bg-status-warning-surface border-mx-amber-100 text-status-warning' :
                'bg-status-error-surface border-mx-rose-100 text-status-error'
              )}>
                <item.icon size={22} strokeWidth={2.5} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0 pb-32">
        {/* Power Ranking List */}
        <section className="lg:col-span-8 flex flex-col">
          <Card className="border-none shadow-mx-xl bg-white overflow-hidden h-full flex flex-col group">
            <CardHeader className="bg-surface-alt/30 border-b border-border-default p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-mx-2xl bg-pure-black text-white flex items-center justify-center shadow-mx-xl transform rotate-2">
                  <BarChart3 size={32} className="text-status-warning" />
                </div>
                <div>
                  <Typography variant="h2" className="text-2xl uppercase">Power Ranking</Typography>
                  <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1">PONDERADO POR RESULTADO & PROCESSO</Typography>
                </div>
              </div>
              <div className="relative group w-full sm:w-72">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                <Input 
                    placeholder="FILTRAR TROPA..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="!pl-11 !h-12 !text-[10px] uppercase tracking-widest"
                />
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto no-scrollbar p-0 relative z-10">
              <ul className="divide-y divide-border-default" role="list">
                <AnimatePresence mode="popLayout">
                  {processedRanking.map((user, i) => (
                    <motion.li 
                        key={user.user_id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className={cn("p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-10 transition-all hover:bg-surface-alt/30 group/item", i === 0 && "bg-mx-amber-50/20 border-l-8 border-status-warning")}
                    >
                      <div className="flex items-center gap-10 min-w-0">
                        <div className="w-12 text-center shrink-0">
                          {i === 0 ? (
                            <div className="relative">
                              <Crown size={32} className="text-status-warning animate-bounce mx-auto" />
                              <Typography variant="caption" tone="warning" className="text-[8px] font-black uppercase absolute -bottom-4 left-1/2 -translate-x-1/2">ELITE</Typography>
                            </div>
                          ) : (
                            <Typography variant="h1" className="text-2xl opacity-20 tabular-nums">#{(i + 1).toString().padStart(2, '0')}</Typography>
                          )}
                        </div>
                        
                        <div className="w-16 h-16 rounded-mx-2xl border-4 border-white shadow-mx-lg overflow-hidden bg-surface-alt shrink-0 transform group-hover/item:scale-105 transition-all">
                          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_name)}&background=4f46e5&color=fff&bold=true`} alt="" width={64} height={64} className="w-full h-full object-cover" />
                        </div>
                        
                        <div className="min-w-0 space-y-2">
                          <Typography variant="h3" className="text-lg uppercase tracking-tight group-hover/item:text-brand-primary transition-colors truncate">{user.user_name}</Typography>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-[7px] font-black bg-white">{user.vnd_total} VENDAS</Badge>
                            <Badge variant="outline" className="text-[7px] font-black bg-mx-indigo-50 text-brand-primary border-mx-indigo-100">{user.conversion_status}</Badge>
                            <Badge variant={user.discipline_status === 'IMPECÁVEL' ? 'success' : 'danger'} className="text-[7px] font-black">{user.discipline_status}</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-10 shrink-0">
                        <div className="text-right">
                          <Typography variant="caption" tone="muted" className="text-[9px] font-black uppercase tracking-widest mb-1">MX SCORE</Typography>
                          <Typography variant="h1" className="text-4xl tabular-nums leading-none tracking-tighter">{user.mx_score}</Typography>
                        </div>
                        <div className={cn("w-12 h-12 rounded-mx-xl flex items-center justify-center border shadow-inner transition-all", user.mx_score > 800 ? "bg-status-success-surface text-status-success border-mx-emerald-100" : "bg-status-error-surface text-status-error border-mx-rose-100")}>
                          <TrendingUp size={20} className={cn(user.mx_score < 400 && "rotate-180")} strokeWidth={3} />
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Sidebar - Missions */}
        <aside className="lg:col-span-4 flex flex-col gap-mx-lg h-full">
          <Card className="bg-pure-black text-white p-10 border-none shadow-mx-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-transparent to-transparent pointer-events-none" />
            <header className="flex items-center gap-4 mb-12 relative z-10">
              <div className="w-14 h-14 rounded-mx-2xl bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-xl group-hover:rotate-6 transition-transform">
                <Target size={28} className="text-status-warning" />
              </div>
              <div>
                <Typography variant="h3" tone="white">Missões Ativas</Typography>
                <Typography variant="caption" tone="white" className="opacity-40 uppercase tracking-widest mt-1">GANHOS EM XP MX</Typography>
              </div>
            </header>
            
            <div className="space-y-6 relative z-10 flex-1">
              {challenges.map(ch => (
                <Card key={ch.id} className="p-8 border-white/5 bg-white/5 hover:bg-white/10 transition-all group/ch">
                  <div className="flex justify-between items-start mb-8">
                    <div className={cn("w-12 h-12 rounded-mx-xl flex items-center justify-center shadow-inner border border-white/5 group-hover/ch:scale-110 transition-transform", 
                        ch.tone === 'brand' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-rose-500/20 text-rose-400'
                    )}>
                      <ch.icon size={24} />
                    </div>
                    <Badge variant="warning" className="text-pure-black border-none text-[8px] font-black px-3 shadow-mx-sm">{ch.reward.toUpperCase()}</Badge>
                  </div>
                  <Typography variant="h3" tone="white" className="text-base uppercase mb-2">{ch.title}</Typography>
                  <Typography variant="p" tone="white" className="text-[10px] font-bold opacity-40 uppercase mb-8 leading-relaxed italic">"{ch.description}"</Typography>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <Typography variant="caption" tone="brand" className="text-[8px] font-black tracking-widest">PROGRESSO</Typography>
                      <Typography variant="mono" tone="white" className="text-xs font-black">{Math.min(ch.current, ch.target)}/{ch.target}</Typography>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-mx-full overflow-hidden p-0.5 shadow-inner border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${Math.min((ch.current/ch.target)*100, 100)}%` }} 
                        transition={{ duration: 2, ease: "circOut" }} 
                        className="h-full bg-status-warning rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" 
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          <Card className="p-10 border-none shadow-mx-lg bg-white flex flex-col items-center text-center group">
            <div className="w-20 h-20 rounded-mx-3xl bg-status-success-surface text-status-success border border-mx-emerald-100 flex items-center justify-center shadow-inner mb-8 group-hover:scale-110 transition-transform">
              <Award size={40} strokeWidth={2.5} />
            </div>
            <Typography variant="h2" className="mb-4 uppercase tracking-tight">Status Evolutivo</Typography>
            <Typography variant="p" tone="muted" className="text-[10px] font-black uppercase tracking-widest mb-10 max-w-[200px] leading-relaxed">
              {myStats && myStats.mx_score > 800 ? "Você atingiu o nível Platinum de Excelência!" : `Faltam ${800 - (myStats?.mx_score || 0)} MX Score para o status Elite Platinum.`}
            </Typography>
            <Button className="w-full h-14 rounded-full font-black uppercase tracking-widest text-[10px] shadow-mx-xl">
                RECOMPENSAS DA SEASON
            </Button>
          </Card>
        </aside>
      </div>
    </main>
  )
}
