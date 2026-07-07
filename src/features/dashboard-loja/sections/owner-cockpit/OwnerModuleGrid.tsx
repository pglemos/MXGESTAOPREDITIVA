import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import { toneClasses, type KpiTone } from './types'
import { SectionTitle } from './primitives'

export function OwnerModuleGrid({
  title,
  subtitle,
  items,
}: {
  title: string
  subtitle: string
  items: Array<{ title: string; detail: string; icon: ReactNode; tone: KpiTone }>
}) {
  return (
    <div className="space-y-mx-md">
      <SectionTitle title={title} subtitle={subtitle} />
      <div className="grid grid-cols-1 gap-mx-md md:grid-cols-3">
        {items.map((item) => {
          const classes = toneClasses[item.tone]
          return (
            <Card key={item.title} className="min-h-[180px] rounded-mx-2xl p-mx-lg">
              <div className={cn('h-mx-12 w-mx-12 rounded-mx-xl flex items-center justify-center shadow-mx-sm', classes.bg)}>
                {item.icon}
              </div>
              <Typography variant="h3" className="mt-mx-md text-lg font-black">{item.title}</Typography>
              <Typography variant="p" tone="muted" className="mt-mx-xs text-sm font-bold">{item.detail}</Typography>
              <div className="mt-mx-md flex items-center gap-mx-xs text-brand-primary">
                <Typography variant="tiny" className="font-black uppercase">Abrir</Typography>
                <ChevronRight size={16} />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
