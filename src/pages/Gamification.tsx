import { Award, Medal, Star, Target, TrendingUp, Trophy, Zap, RefreshCw, ChevronRight, Crown, Flame, Search, ShieldCheck, Clock, BarChart3, Users, Car, Sparkles, LayoutDashboard } from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useCheckins } from '@/hooks/useCheckins'
import { useRanking } from '@/hooks/useRanking'
import { useStoreGoal } from '@/hooks/useGoals'
import { useStoreSales } from '@/hooks/useStoreSales'
import { calcularFunil, calcularScoreMX, getDiasInfo } from '@/lib/calculations'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { MXScoreCard } from '@/components/molecules/MXScoreCard'
import { ChallengeCard } from '@/components/molecules/ChallengeCard'
import { PowerRankingList } from '@/components/organisms/PowerRankingList'

export default function Gamification() {
  const { profile } = useAuth()
  const { checkins, loading: checkisLoading } = useCheckins()
  const { ranking, loading: rankingLoading, refetch: refetchRanking } = useRanking()
  const { goal: storeGoal } = useStoreGoal()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefetching, setIsRefetching] = useState(false)

  const dias = useMemo(() => getDiasInfo(), [])

  // Lógica centralizada de Vendas e Ranking via Hook
  const storeSales = useStoreSales({
    checkins: checkins as any,
    ranking: ranking,
    rules: { monthly_goal: storeGoal?.target || 0 } as any
  })

  // Processar Ranking com MX Score (Lógica específica de Gamification)
  const processedRanking = useMemo(() => {
    return storeSales.processedRanking.map(entry => {
      const sellerCheckins = checkins.filter(c => c.seller_user_id === entry.user_id)
      const funil = calcularFunil(sellerCheckins as any)
      const score = calcularScoreMX(entry.vnd_total, entry.meta, funil, sellerCheckins.length, dias.decorridos)
      
      return {
        ...entry,
        mx_score: score,
        conversion_status: funil.tx_visita_vnd >= 33 ? 'EXCELÊNCIA' : 'EM EVOLUÇÃO',
        discipline_status: sellerCheckins.length >= dias.decorridos ? 'IMPECÁVEL' : 'PENDENTE'
      }
    }).sort((a, b) => b.mx_score - a.mx_score)
  }, [storeSales.processedRanking, checkins, dias])

  const myStats = useMemo(() => {
    return processedRanking.find(r => r.user_id === profile?.id)
  }, [processedRanking, profile])

  const handleRefresh = useCallback(async () => {
    setIsRefetching(true); await refetchRanking(); setIsRefetching(false)
    toast.success('Matrix de Elite Sincronizada!')
  }, [refetchRanking])

  const filteredRanking = useMemo(() => {
    return processedRanking.filter(r => r.user_name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [processedRanking, searchTerm])

  const challenges = [
    { id: 1, title: 'Check-in Impecável', description: 'Mantenha 100% de disciplina este mês.', target: dias.total, current: checkins.filter(c => c.seller_user_id === profile?.id).length, reward: 'Power Up Multiplier 1.2x', icon: ShieldCheck, tone: 'brand' as const },
    { id: 2, title: 'Fechador de Elite', description: 'Atinja o benchmark de 33% de conversão Visita/Venda.', target: 33, current: myStats ? Math.round((myStats.vnd_total / (myStats.visitas || 1)) * 100) : 0, reward: 'Elite Badge', icon: Zap, tone: 'error' as const },
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
        <MXScoreCard label="Seu MX Score" value={myStats?.mx_score || 0} icon={Trophy} tone="brand" sub="High Perf" />
        <MXScoreCard label="Vendas Mês" value={myStats?.vnd_total || 0} icon={Car} tone="success" sub={`${myStats?.atingimento}% Meta`} />
        <MXScoreCard label="Disciplina" value={`${challenges[0].current}/${dias.decorridos}`} icon={ShieldCheck} tone="brand" sub="Check-ins" />
        <MXScoreCard label="Unidade" value={`#${myStats?.position || '--'}`} icon={Crown} tone="warning" sub="Ranking Local" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0 pb-32">
        {/* Power Ranking List */}
        <section className="lg:col-span-8 flex flex-col">
          <PowerRankingList 
            ranking={filteredRanking} 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
          />
        </section>

        {/* Challenges Sidebar */}
        <section className="lg:col-span-4 space-y-mx-lg h-full overflow-y-auto no-scrollbar pr-2">
          <div className="flex items-center gap-4 mb-4">
            <Sparkles className="text-status-warning" size={20} />
            <Typography variant="h3" className="uppercase">Desafios Ativos</Typography>
          </div>
          
          <div className="grid grid-cols-1 gap-mx-lg">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
          
          {/* Season Pass Concept */}
          <Card className="p-10 border-none bg-pure-black text-white shadow-mx-2xl relative overflow-hidden group mt-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 rounded-full blur-[100px] -mr-32 -mt-32 animate-pulse" />
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                    <LayoutDashboard className="text-brand-primary" size={24} />
                    <Typography variant="h2" className="text-white uppercase">Season Pass</Typography>
                </div>
                <Typography variant="caption" className="text-white/60 mb-10 block leading-relaxed">Complete desafios para desbloquear emblemas exclusivos e subir na hierarquia da Matrix de Elite.</Typography>
                <Button className="w-full bg-brand-primary hover:bg-brand-secondary text-white border-none h-14 rounded-mx-xl font-black uppercase tracking-widest shadow-mx-lg transition-all active:scale-95">
                    Ver Recompensas
                </Button>
            </div>
          </Card>
        </section>
      </div>
    </main>
  )
}
