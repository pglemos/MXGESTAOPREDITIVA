import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { Calendar, CheckCircle2, Link as LinkIcon, AlertCircle, RefreshCw, Building2 } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { useAuth } from '@/hooks/useAuth'
import { isAdminMasterMxProfile } from '@/lib/agenda/admin-master'
import { motion } from 'motion/react'

interface Props {
  clientId?: string
  compact?: boolean
}

export function GoogleCalendarStatus({ clientId, compact = false }: Props) {
  const { profile } = useAuth()
  const canViewCentralAgenda = isAdminMasterMxProfile(profile, import.meta.env.VITE_MX_ADMIN_MASTER_EMAILS)
  const {
    personalConnected,
    centralConnected,
    centralMeetCohostsAuthorized,
    personalGoogleEmail,
    centralGoogleEmail,
    loading,
    error,
    refetch,
    connectPersonal,
    connectCentral,
    events,
  } = useGoogleCalendar({ autoFetch: true, includeCentral: true })

  const upcoming = events.slice(0, compact ? 3 : 6)

  return (
    <Card className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-none">
      <header className="flex min-w-0 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-emerald-600">
            <Calendar size={20} />
          </div>
          <div className="min-w-0">
            <Typography variant="h3" className="text-base">Google Calendar</Typography>
            <Typography variant="caption" tone="muted" className="uppercase tracking-widest text-[10px]">
              Sincronização híbrida
            </Typography>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={refetch} aria-label="Atualizar agenda" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </Button>
      </header>

      <div className={`grid grid-cols-1 gap-4 ${canViewCentralAgenda ? 'sm:grid-cols-2' : ''}`}>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`min-w-0 rounded-2xl border p-4 ${personalConnected ? 'bg-emerald-50 border-emerald-600/20' : 'bg-gray-50 border-gray-100'}`}
        >
          <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
            <span className="min-w-0 truncate text-[10px] font-black uppercase tracking-widest text-gray-500">Sua agenda</span>
            {personalConnected
              ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              : <AlertCircle size={16} className="shrink-0 text-gray-500" />}
          </div>
          {personalConnected ? (
            <div className="flex min-w-0 flex-col gap-1">
              <Badge variant="success" className="w-fit text-[8px]">Conectada</Badge>
              {personalGoogleEmail && (
                <Typography variant="tiny" tone="muted" className="truncate text-[10px]">
                  {personalGoogleEmail}
                </Typography>
              )}
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => connectPersonal(clientId)} className="w-full mt-2 min-h-11 gap-2 px-2 text-center tracking-tight [white-space:normal]">
              <LinkIcon size={14} />
              <span className="sm:hidden">Conectar conta</span>
              <span className="hidden sm:inline">Conectar minha conta</span>
            </Button>
          )}
        </motion.div>

        {canViewCentralAgenda && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`min-w-0 rounded-2xl border p-4 ${centralConnected && centralMeetCohostsAuthorized ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}
          >
            <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                <Building2 size={12} className="shrink-0" />
                <span className="truncate">Agenda Central MX</span>
              </span>
              {centralConnected && centralMeetCohostsAuthorized
                ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                : <AlertCircle size={16} className="shrink-0 text-amber-600" />}
            </div>
            {centralConnected && centralMeetCohostsAuthorized ? (
              <div className="min-w-0">
                <Typography variant="tiny" className="block truncate rounded-xl bg-emerald-600 px-2 py-1 font-black uppercase tracking-widest text-white">
                  {centralGoogleEmail || 'gestao@mxconsultoria.com.br'}
                </Typography>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={connectCentral} className="w-full mt-2 min-h-11 gap-2 px-2 text-center tracking-tight [white-space:normal]">
                <LinkIcon size={14} />
                <span className="sm:hidden">{centralConnected ? 'Autorizar Meet' : 'Conectar central'}</span>
                <span className="hidden sm:inline">{centralConnected ? 'Autorizar co-hosts do Meet' : 'Conectar Agenda Central'}</span>
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-600/20 text-red-600 text-[10px] font-bold">
          {error}
        </div>
      )}

      {!compact && canViewCentralAgenda && centralConnected && !personalConnected && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-gray-600 text-[10px] font-bold leading-relaxed">
          A Agenda Central MX está conectada. Para receber os compromissos na própria conta Google, cada admin MX precisa entrar no sistema com seu usuário e conectar a agenda pessoal.
        </div>
      )}

      {!compact && canViewCentralAgenda && centralConnected && !centralMeetCohostsAuthorized && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-500/20 text-gray-600 text-[10px] font-bold leading-relaxed">
          Reconecte a Agenda Central MX para autorizar Daniel, Jose, Mariane e Joao como co-hosts das reunioes Google Meet.
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black text-[10px]">
            Próximos eventos
          </Typography>
          <ul className="space-y-1">
            {upcoming.map((ev) => {
              const start = ev.start?.dateTime || ev.start?.date || ''
              const dt = start ? new Date(start) : null
              return (
                <li key={`${ev._source}-${ev.id}`} className="flex min-w-0 items-center gap-4 rounded-xl p-2 transition-colors hover:bg-gray-50">
                  <span className={`h-6 w-1 shrink-0 rounded-full ${ev._source === 'central' ? 'bg-emerald-600' : 'bg-blue-600'}`} />
                  <div className="min-w-0 flex-1">
                    <Typography variant="caption" className="font-bold truncate block">
                      {ev.summary || '(sem título)'}
                    </Typography>
                    {dt && (
                      <Typography variant="tiny" tone="muted" className="block truncate text-[10px]">
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
