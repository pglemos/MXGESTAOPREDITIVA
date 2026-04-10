import { motion, AnimatePresence } from 'motion/react'
import { Search, BarChart3, Trophy, Medal, Star, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardContent } from '@/components/molecules/Card'

interface PowerRankingListProps {
  ranking: any[]
  searchTerm: string
  onSearchChange: (value: string) => void
}

export function PowerRankingList({ ranking, searchTerm, onSearchChange }: PowerRankingListProps) {
  return (
    <Card className="border-none shadow-mx-xl bg-white overflow-hidden h-full flex flex-col group">
      <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-10 flex flex-col sm:flex-row sm:items-center justify-between gap-mx-lg relative z-10">
        <div className="flex items-center gap-mx-md">
          <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-pure-black text-white flex items-center justify-center shadow-mx-xl transform rotate-2">
            <BarChart3 size={32} className="text-status-warning" />
          </div>
          <div>
            <Typography variant="h2" className="text-2xl uppercase">Power Ranking</Typography>
            <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1">PONDERADO POR RESULTADO & PROCESSO</Typography>
          </div>
        </div>
        <div className="relative group w-full sm:w-72">
          <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
          <Input 
              placeholder="FILTRAR TROPA..." value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="!pl-11 !h-12 !text-mx-tiny uppercase tracking-widest"
          />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto no-scrollbar p-mx-0 relative z-10">
        <ul className="divide-y divide-border-default" role="list">
          <AnimatePresence mode="popLayout">
            {ranking.map((user, i) => (
              <motion.li 
                  key={user.user_id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className={cn("p-mx-10 flex flex-col sm:flex-row sm:items-center justify-between gap-mx-10 transition-all hover:bg-surface-alt/30 group/item", i === 0 && "bg-mx-amber-50/20 border-l-8 border-status-warning")}
              >
                <div className="flex items-center gap-mx-10 min-w-0">
                  <div className="relative shrink-0">
                    <div className={cn(
                      "w-mx-14 h-mx-14 rounded-mx-full flex items-center justify-center border-2 shadow-mx-sm transition-transform group-hover/item:scale-110",
                      i === 0 ? "bg-status-warning border-mx-amber-300 text-white" :
                      i === 1 ? "bg-slate-200 border-slate-300 text-text-secondary" :
                      i === 2 ? "bg-orange-100 border-orange-200 text-orange-700" :
                      "bg-white border-border-default text-text-secondary"
                    )}>
                      {i === 0 ? <Trophy size={20} /> : i === 1 ? <Medal size={20} /> : i === 2 ? <Star size={20} /> : <span className="font-black text-sm">{i + 1}</span>}
                    </div>
                    {i < 3 && <div className="absolute -bottom-1 -right-1 w-mx-md h-mx-md bg-pure-black text-white rounded-mx-full flex items-center justify-center text-mx-tiny font-black border-2 border-white shadow-mx-sm">#{i + 1}</div>}
                  </div>
                  
                  <div className="min-w-0">
                    <div className="flex items-center gap-mx-xs">
                        <Typography variant="h3" className="truncate text-lg group-hover/item:text-brand-primary transition-colors uppercase tracking-tight">{user.user_name}</Typography>
                        {user.is_venda_loja && <Badge variant="secondary" className="bg-mx-indigo-50 text-brand-primary text-mx-micro border-none px-2">UNIDADE</Badge>}
                    </div>
                    <div className="flex items-center gap-mx-sm mt-1 opacity-60">
                      <div className="flex items-center gap-mx-xs">
                        <Trophy size={10} className="text-status-warning" />
                        <Typography variant="caption" className="text-mx-micro uppercase font-black">Score {user.mx_score}</Typography>
                      </div>
                      <div className="w-mx-tiny h-mx-tiny rounded-mx-full bg-border-default" />
                      <Typography variant="caption" className="text-mx-micro uppercase font-bold">{user.vnd_total} Vendas</Typography>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-mx-10 shrink-0">
                  <div className="text-right hidden sm:block">
                    <Typography variant="caption" tone="muted" className="block text-mx-micro uppercase tracking-widest font-black opacity-40 mb-1">Status Performance</Typography>
                    <Badge variant={user.conversion_status === 'EXCELÊNCIA' ? 'success' : 'warning'} className="text-mx-micro uppercase font-black tracking-widest px-4 py-1.5 rounded-mx-full border-none">
                        {user.conversion_status}
                    </Badge>
                  </div>
                  <div className="w-px h-mx-10 bg-border-default hidden sm:block" />
                  <div className="flex items-center gap-mx-sm group/btn cursor-pointer">
                    <div className="text-right">
                        <Typography variant="h2" className="text-2xl tabular-nums leading-none tracking-tighter">{user.mx_score}</Typography>
                        <Typography variant="caption" tone="muted" className="text-mx-micro uppercase font-black tracking-tighter block mt-1">MX POINTS</Typography>
                    </div>
                    <div className="w-mx-10 h-mx-10 rounded-mx-full border border-border-default flex items-center justify-center group-hover/btn:bg-pure-black group-hover/btn:text-white transition-all shadow-mx-sm">
                        <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </CardContent>
    </Card>
  )
}
