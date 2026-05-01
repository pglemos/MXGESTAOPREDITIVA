import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { Calendar, CheckCircle2, Link as LinkIcon, AlertCircle, RefreshCw, Building2 } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { motion } from 'motion/react'

interface Props {
  clientId?: string
  compact?: boolean
}

export function GoogleCalendarStatus({ clientId, compact = false }: Props) {
  const { personalConnected, centralConnected, loading, error, refetch, connectPersonal, connectCentral, events } = useGoogleCalendar({ autoFetch: true })

  const upcoming = events.slice(0, compact ? 3 : 6)

  return (
    <Card className="p-mx-lg border-none shadow-mx-md bg-white space-y-mx-md">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-mx-sm">
          <div className="w-mx-12 h-mx-12 rounded-mx-xl bg-mx-indigo-50 border border-mx-indigo-100 flex items-center justify-center text-brand-primary">
            <Calendar size={20} />
          </div>
          <div>
            <Typography variant="h3" className="text-base">Google Calendar</Typography>
            <Typography variant="caption" tone="muted" className="uppercase tracking-widest text-mx-tiny">
              Sincronização híbrida
            </Typography>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={refetch} aria-label="Atualizar agenda" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-sm">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-mx-sm rounded-mx-lg border ${personalConnected ? 'bg-status-success-surface border-status-success/20' : 'bg-surface-alt border-border-default'}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">Sua agenda</span>
            {personalConnected
              ? <CheckCircle2 size={16} className="text-status-success" />
              : <AlertCircle size={16} className="text-text-tertiary" />}
          </div>
          {personalConnected ? (
            <Badge variant="success" className="text-mx-nano">Conectada</Badge>
          ) : (
            <Button size="sm" variant="outline" onClick={() => connectPersonal(clientId)} className="w-full mt-2 min-h-mx-11 gap-mx-xs px-2 text-center tracking-tight [white-space:normal]">
              <LinkIcon size={14} />
              <span className="sm:hidden">Conectar conta</span>
              <span className="hidden sm:inline">Conectar minha conta</span>
            </Button>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-mx-sm rounded-mx-lg border ${centralConnected ? 'bg-mx-green-50 border-mx-green-200' : 'bg-surface-alt border-border-default'}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary flex items-center gap-mx-xs">
              <Building2 size={12} /> Agenda Central MX
            </span>
            {centralConnected
              ? <CheckCircle2 size={16} className="text-status-success" />
              : <AlertCircle size={16} className="text-status-warning" />}
          </div>
          {centralConnected ? (
            <Badge variant="brand" className="text-mx-nano">gestao@mxconsultoria.com.br</Badge>
          ) : (
            <Button size="sm" variant="outline" onClick={connectCentral} className="w-full mt-2 min-h-mx-11 gap-mx-xs px-2 text-center tracking-tight [white-space:normal]">
              <LinkIcon size={14} />
              <span className="sm:hidden">Conectar central</span>
              <span className="hidden sm:inline">Conectar Agenda Central</span>
            </Button>
          )}
        </motion.div>
      </div>

      {error && (
        <div className="p-mx-sm rounded-mx-md bg-status-error-surface border border-status-error/20 text-status-error text-mx-tiny font-bold">
          {error}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-mx-xs">
          <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black text-mx-tiny">
            Próximos eventos
          </Typography>
          <ul className="space-y-mx-tiny">
            {upcoming.map((ev) => {
              const start = ev.start?.dateTime || ev.start?.date || ''
              const dt = start ? new Date(start) : null
              return (
                <li key={`${ev._source}-${ev.id}`} className="flex items-center gap-mx-sm p-mx-xs rounded-mx-md hover:bg-surface-alt transition-colors">
                  <span className={`w-mx-tiny h-mx-md rounded-full ${ev._source === 'central' ? 'bg-brand-primary' : 'bg-status-info'}`} />
                  <div className="min-w-0 flex-1">
                    <Typography variant="caption" className="font-bold truncate block">
                      {ev.summary || '(sem título)'}
                    </Typography>
                    {dt && (
                      <Typography variant="tiny" tone="muted" className="text-mx-tiny">
                        {dt.toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {ev._source === 'central' ? ' • Central' : ' • Pessoal'}
                      </Typography>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Card>
  )
}
