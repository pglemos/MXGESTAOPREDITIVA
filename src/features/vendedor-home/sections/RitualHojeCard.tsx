import { Link } from 'react-router-dom'
import { Bell, CheckSquare, LifeBuoy } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'

interface RitualHojeCardProps {
  hasTodayCheckin: boolean
}

/**
 * Card "Ritual de hoje" — atalhos para lançamento, alertas e ajuda.
 * Story 3.4 reconciliada (ADR-0050).
 */
export function RitualHojeCard({ hasTodayCheckin }: RitualHojeCardProps) {
  return (
    <Card className="shrink-0 border border-border-default bg-white p-mx-md shadow-mx-sm">
      <div className="flex flex-col gap-mx-md lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Typography variant="h3" className="uppercase tracking-tight">
            Ritual de hoje
          </Typography>
          <Typography variant="p" tone="muted" className="text-sm">
            Primeiro confira o lançamento obrigatório; depois veja alertas e suporte sem sair
            da rotina.
          </Typography>
        </div>
        <div className="grid grid-cols-1 gap-mx-xs sm:grid-cols-3 lg:min-w-mx-card-lg">
          <Button
            asChild
            variant={hasTodayCheckin ? 'outline' : 'primary'}
            className="h-mx-12 rounded-mx-xl justify-start"
          >
            <Link to="/lancamento-diario">
              <CheckSquare size={16} className="mr-2" />
              {hasTodayCheckin ? 'Revisar lançamento' : 'Fazer lançamento'}
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-mx-12 rounded-mx-xl justify-start bg-white">
            <Link to="/notificacoes">
              <Bell size={16} className="mr-2" />
              Ver alertas
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-mx-12 rounded-mx-xl justify-start bg-white">
            <Link to="/ajuda">
              <LifeBuoy size={16} className="mr-2" />
              Ajuda
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default RitualHojeCard
