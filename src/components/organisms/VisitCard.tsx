import { Link } from 'react-router-dom'
import { format, parseISO, isToday, isPast } from 'date-fns'
import { Building2, Clock, MapPin, Play, X, Trash2, ChevronRight, User, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'

export interface VisitCardData {
  id: string
  client_id: string
  client_name: string
  visit_number: number
  scheduled_at: string
  duration_hours: number
  modality?: string
  objective?: string | null
  status: string
  consultant?: { name: string } | null
}

export interface VisitCardProps {
  visit: VisitCardData
  onStart?: (id: string) => void
  onCancel?: (id: string) => void
  onDelete?: (id: string) => void
  onEdit?: (id: string) => void
  linkTo: string
  className?: string
}

function getVisitStatusBadge(status: string) {
  switch (status) {
    case 'agendada': return <Badge variant="outline" className="border-brand-primary/30 text-brand-primary">AGENDADA</Badge>
    case 'em_andamento': return <Badge variant="info">EM ANDAMENTO</Badge>
    case 'concluida': return <Badge variant="success">CONCLUÍDA</Badge>
    case 'cancelada': return <Badge variant="danger">CANCELADA</Badge>
    default: return <Badge variant="ghost">{status.toUpperCase()}</Badge>
  }
}

export function VisitCard({
  visit,
  onStart,
  onCancel,
  onDelete,
  onEdit,
  linkTo,
  className,
}: VisitCardProps) {
  const scheduledDate = parseISO(visit.scheduled_at)
  const isExpired = isPast(scheduledDate) && visit.status === 'agendada'

  return (
    <Card className={cn(
      'p-mx-md border-none shadow-mx-md bg-white hover:shadow-mx-xl transition-all group',
      isExpired && 'border-l-4 border-l-status-warning',
      visit.status === 'em_andamento' && 'border-l-4 border-l-status-info',
      className,
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-mx-md">
        <Link
          to={linkTo}
          className="flex items-center gap-mx-md min-w-0 flex-1 cursor-pointer"
        >
          <div className={cn(
            'w-mx-10 h-mx-10 rounded-mx-lg border flex items-center justify-center shrink-0',
            isToday(scheduledDate) ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' : 'bg-surface-alt border-border-default text-text-tertiary'
          )}>
            <Typography variant="h3" className="text-lg font-black">
              {format(scheduledDate, 'dd')}
            </Typography>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-mx-xs mb-1">
              <Building2 size={14} className="text-brand-primary shrink-0" />
              <Typography variant="h3" className="text-sm truncate">{visit.client_name}</Typography>
            </div>
            <div className="flex items-center gap-mx-sm text-text-tertiary">
              <div className="flex items-center gap-mx-xs">
                <Clock size={12} />
                <Typography variant="tiny">
                  {format(scheduledDate, 'HH:mm')} - {visit.duration_hours}h
                </Typography>
              </div>
              {visit.modality && (
                <div className="flex items-center gap-mx-xs">
                  <MapPin size={12} />
                  <Typography variant="tiny">{visit.modality}</Typography>
                </div>
              )}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-mx-sm sm:gap-mx-md">
          {visit.objective && (
            <Typography variant="tiny" tone="muted" className="hidden lg:block max-w-48 truncate">
              {visit.objective}
            </Typography>
          )}

          <div className="flex flex-col items-end gap-mx-xs">
            {getVisitStatusBadge(visit.status)}
            <div className="flex items-center gap-mx-xs">
              <Typography variant="tiny" tone="muted">
                Visita {visit.visit_number}/7
              </Typography>
            </div>
          </div>

          {visit.consultant && (
            <div className="hidden md:flex items-center gap-mx-xs">
              <User size={14} className="text-text-tertiary" />
              <Typography variant="tiny" tone="muted">{visit.consultant.name}</Typography>
            </div>
          )}

          <div className="flex items-center gap-mx-xs">
            {onEdit && visit.status !== 'concluida' && (
              <Button variant="ghost" size="sm" className="text-brand-primary" onClick={() => onEdit(visit.id)}>
                <Pencil size={14} />
              </Button>
            )}
            {visit.status === 'agendada' && onStart && (
              <Button variant="ghost" size="sm" className="text-status-info" onClick={() => onStart(visit.id)}>
                <Play size={14} />
              </Button>
            )}
            {visit.status === 'agendada' && onCancel && (
              <Button variant="ghost" size="sm" className="text-status-error" onClick={() => onCancel(visit.id)}>
                <X size={14} />
              </Button>
            )}
            {visit.status === 'cancelada' && onDelete && (
              <Button variant="ghost" size="sm" className="text-status-error" onClick={() => onDelete(visit.id)}>
                <Trash2 size={14} />
              </Button>
            )}
            <Link to={linkTo}>
              <ChevronRight size={18} className="text-text-tertiary group-hover:text-brand-primary transition-colors shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}
