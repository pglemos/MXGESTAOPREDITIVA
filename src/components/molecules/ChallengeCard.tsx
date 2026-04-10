import { motion } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Card } from '@/components/molecules/Card'

interface ChallengeCardProps {
  challenge: {
    id: number
    title: string
    description: string
    target: number
    current: number
    reward: string
    icon: any
    tone: 'brand' | 'error'
  }
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const Icon = challenge.icon
  const progress = Math.min(100, Math.round((challenge.current / challenge.target) * 100))

  return (
    <Card className="p-mx-lg border-none shadow-mx-md hover:shadow-mx-lg transition-all bg-white group overflow-hidden relative">
      <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-surface-alt rounded-mx-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-primary/10 transition-colors" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className={cn(
              "w-mx-xl h-mx-xl rounded-mx-xl flex items-center justify-center border shadow-sm",
              challenge.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' : 'bg-status-error-surface border-mx-rose-100 text-status-error'
          )}>
            <Icon size={20} />
          </div>
          <Badge variant="outline" className="rounded-mx-full px-4 py-1 text-mx-micro uppercase font-black tracking-widest border-border-default">XP REWARD</Badge>
        </div>
        
        <Typography variant="h3" className="mb-2 uppercase text-lg">{challenge.title}</Typography>
        <Typography variant="caption" tone="muted" className="mb-8 block leading-relaxed">{challenge.description}</Typography>
        
        <div className="space-y-mx-sm">
          <div className="flex justify-between items-end">
            <Typography variant="caption" className="font-black text-mx-tiny uppercase tracking-tighter">Progresso do Objetivo</Typography>
            <Typography variant="h2" className="text-xl tabular-nums leading-none tracking-tighter">{progress}%</Typography>
          </div>
          <div className="h-mx-xs w-full bg-surface-alt rounded-mx-full overflow-hidden border border-border-default p-[2px]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={cn(
                  "h-full rounded-mx-full shadow-inner",
                  challenge.tone === 'brand' ? 'bg-brand-primary' : 'bg-status-error'
              )}
            />
          </div>
          <div className="flex justify-between items-center pt-2">
              <Typography variant="caption" tone="muted" className="text-mx-micro uppercase font-black">{challenge.current} / {challenge.target} atingidos</Typography>
              <div className="flex items-center gap-mx-xs">
                  <Sparkles size={12} className="text-status-warning" />
                  <Typography variant="caption" className="text-mx-micro font-black uppercase text-status-warning tracking-widest">{challenge.reward}</Typography>
              </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
