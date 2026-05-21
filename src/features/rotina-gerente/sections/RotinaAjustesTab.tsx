import { motion } from 'motion/react'
import { MessageSquare, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Avatar } from '@/components/atoms/Avatar'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import type { MetricTone, PendingCorrectionRequest } from '../data/types'

type Props = {
  pendingRequests: PendingCorrectionRequest[]
  auditorLoading: boolean
  onApprove: (req: PendingCorrectionRequest) => void
  onReject: (id: string) => void
}

/**
 * Aba "Ajustes" — auditoria de solicitações de correção retroativas (RLS / governança).
 */
export function RotinaAjustesTab({
  pendingRequests,
  auditorLoading,
  onApprove,
  onReject,
}: Props) {
  return (
    <motion.div
      key="ajustes"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-mx-lg"
    >
      <Card className="p-mx-10 md:p-14 border-none shadow-mx-xl bg-white relative overflow-hidden">
        <div
          className="absolute top-mx-0 right-mx-0 w-mx-sidebar-expanded h-mx-64 bg-brand-primary/5 rounded-mx-full blur-mx-xl -mr-32 -mt-32"
          aria-hidden="true"
        />
        <header className="flex items-center justify-between border-b border-border-default pb-8 mb-10 relative z-10">
          <div className="flex items-center gap-mx-md">
            <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-pure-black text-white flex items-center justify-center shadow-mx-xl transform rotate-2">
              <ShieldAlert size={32} className="text-brand-primary" />
            </div>
            <div>
              <Typography variant="h2" className="uppercase tracking-tighter leading-none">
                Auditoria de Ajustes
              </Typography>
              <Typography
                variant="caption"
                tone="muted"
                className="uppercase tracking-widest mt-1 font-black"
              >
                SOLICITAÇÕES RETROATIVAS PENDENTES
              </Typography>
            </div>
          </div>
          <Badge
            variant={pendingRequests.length > 0 ? 'warning' : 'success'}
            className="shadow-mx-md px-6 py-2 rounded-mx-full font-black uppercase text-tiny"
          >
            {pendingRequests.length} PENDÊNCIAS
          </Badge>
        </header>

        <div className="space-y-mx-md relative z-10">
          {pendingRequests.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-mx-md bg-surface-alt rounded-mx-3xl border-2 border-dashed border-border-default">
              <ShieldCheck size={48} className="text-text-tertiary/20" />
              <Typography
                variant="p"
                tone="muted"
                className="uppercase tracking-widest font-black"
              >
                Malha 100% Sincronizada
              </Typography>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <Card
                key={req.id}
                className="p-mx-lg border border-border-default bg-surface-alt/30 hover:bg-white hover:shadow-mx-lg transition-all group"
              >
                <div className="flex flex-col lg:flex-row gap-mx-lg">
                  <div className="flex-1 space-y-mx-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-mx-sm">
                        <Avatar
                          src={req.seller?.avatar_url || undefined}
                          alt={`Avatar de ${req.seller?.name || 'vendedor'}`}
                          fallback={req.seller?.name || '?'}
                          className="w-mx-10 h-mx-10 rounded-mx-xl bg-brand-primary text-white shadow-inner"
                        />
                        <div>
                          <Typography variant="h3" className="text-base uppercase font-black">
                            {req.seller?.name || 'Vendedor'}
                          </Typography>
                          <Typography
                            variant="tiny"
                            tone="muted"
                            className="font-black uppercase"
                          >
                            Solicitado em {new Date(req.created_at).toLocaleDateString('pt-BR')}
                          </Typography>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono-numbers">
                        {req.id.split('-')[0]}
                      </Badge>
                    </div>

                    <div className="bg-white p-mx-md rounded-mx-xl shadow-inner border border-border-default space-y-mx-sm">
                      <header className="flex items-center gap-mx-xs border-b border-border-default pb-2 mb-2">
                        <MessageSquare size={14} className="text-brand-primary" />
                        <Typography
                          variant="tiny"
                          className="font-black uppercase tracking-widest text-brand-primary"
                        >
                          Justificativa Operacional
                        </Typography>
                      </header>
                      <Typography
                        variant="p"
                        className="text-sm font-bold italic leading-relaxed"
                      >
                        &quot;{req.reason}&quot;
                      </Typography>
                    </div>
                    <div className="rounded-mx-xl border border-status-warning/20 bg-status-warning-surface p-mx-md">
                      <Typography
                        variant="tiny"
                        className="mb-mx-xs block font-black uppercase tracking-widest text-status-warning"
                      >
                        Decisão crítica
                      </Typography>
                      <Typography variant="p" className="text-sm text-status-warning">
                        Aprovar aplica estes valores ao histórico do lançamento. Rejeitar
                        mantém o registro atual e remove a solicitação da fila.
                      </Typography>
                      <Typography
                        variant="tiny"
                        className="mt-mx-xs block font-black uppercase text-status-warning"
                      >
                        Referência: {req.requested_values.reference_date || 'não informada'}
                      </Typography>
                    </div>
                  </div>

                  <div className="lg:w-mx-card-md space-y-mx-md">
                    <Typography
                      variant="tiny"
                      tone="muted"
                      className="ml-2 font-black uppercase tracking-widest"
                    >
                      Valores Solicitados
                    </Typography>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-mx-xs">
                      {[
                        {
                          l: 'L',
                          v: req.requested_values.leads_prev_day ?? req.requested_values.leads,
                          t: 'brand' as MetricTone,
                        },
                        {
                          l: 'V',
                          v:
                            req.requested_values.visit_prev_day ??
                            req.requested_values.visitas,
                          t: 'warning' as MetricTone,
                        },
                        {
                          l: 'VND',
                          v:
                            (req.requested_values.vnd_porta_prev_day ??
                              req.requested_values.vnd_porta ??
                              0) +
                            (req.requested_values.vnd_cart_prev_day ??
                              req.requested_values.vnd_cart ??
                              0) +
                            (req.requested_values.vnd_net_prev_day ??
                              req.requested_values.vnd_net ??
                              0),
                          t: 'success' as MetricTone,
                        },
                      ].map((val) => (
                        <div
                          key={val.l}
                          className="bg-white p-mx-sm rounded-mx-xl border border-border-default shadow-sm text-center"
                        >
                          <Typography variant="tiny" tone="muted" className="font-black block">
                            {val.l}
                          </Typography>
                          <Typography
                            variant="h3"
                            tone={val.t}
                            className="text-xl tabular-nums font-black"
                          >
                            {val.v}
                          </Typography>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-mx-sm pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReject(req.id)}
                        disabled={auditorLoading}
                        className="flex-1 h-mx-11 rounded-mx-xl font-black text-mx-micro uppercase hover:bg-status-error-surface hover:text-status-error transition-all"
                      >
                        REJEITAR
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onApprove(req)}
                        disabled={auditorLoading}
                        className="flex-1 h-mx-11 rounded-mx-xl font-black text-mx-micro uppercase shadow-mx-md"
                      >
                        APROVAR AJUSTE
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
    </motion.div>
  )
}

export default RotinaAjustesTab
