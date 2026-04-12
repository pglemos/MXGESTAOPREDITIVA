import { useCheckins } from '@/hooks/useCheckins'
import { useCheckinAuditor } from '@/hooks/useCheckinAuditor'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
    Calendar, Search, Filter, Download, 
    RefreshCw, X, FileText, CheckCircle2, AlertTriangle, 
    TrendingUp, Edit3, Send
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

import { DataGrid, Column } from '@/components/organisms/DataGrid'

export default function HistoryPage() {
  const { profile } = useAuth()
  const { checkins, loading, fetchCheckins: refetch } = useCheckins()
  const { requestCorrection, loading: requestLoading } = useCheckinAuditor()
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefetching, setIsRefetching] = useState(false)
  const [userRequests, setUserRequests] = useState<any[]>([])

  // ... (keeping fetchUserRequests, useEffect, openRequestModal, handleSendRequest)

  const filteredCheckins = useMemo(() => {
    return [...checkins]
        .filter(c => c.reference_date.includes(searchTerm))
        .sort((a, b) => new Date(b.reference_date).getTime() - new Date(a.reference_date).getTime())
  }, [checkins, searchTerm])

  const columns = useMemo<Column<any>[]>(() => [
    {
        key: 'reference_date',
        header: 'DATA OPERAÇÃO',
        render: (c) => (
            <div className="flex flex-col">
                <Typography variant="h3" className="text-base uppercase tracking-tight group-hover:text-brand-primary transition-colors font-black">
                    {format(parseISO(c.reference_date), "dd 'de' MMMM", { locale: ptBR })}
                </Typography>
                <Typography variant="caption" tone="muted" className="text-mx-micro font-black uppercase mt-1 opacity-40">Snapshot Consolidado</Typography>
            </div>
        )
    },
    { key: 'vnd_porta_prev_day', header: 'PORTA', align: 'center', desktopOnly: true, render: (c) => <span className="opacity-60 tabular-nums">{c.vnd_porta_prev_day || 0}</span> },
    { key: 'vnd_cart_prev_day', header: 'CARTEIRA', align: 'center', desktopOnly: true, render: (c) => <span className="opacity-60 tabular-nums">{c.vnd_cart_prev_day || 0}</span> },
    { key: 'vnd_net_prev_day', header: 'DIGITAL', align: 'center', desktopOnly: true, render: (c) => <span className="opacity-60 tabular-nums">{c.vnd_net_prev_day || 0}</span> },
    {
        key: 'funnel',
        header: 'FUNIL (L/A/V)',
        align: 'center',
        render: (c) => (
            <div className="inline-flex items-center gap-mx-xs px-6 py-2.5 rounded-mx-full bg-surface-alt border border-border-default shadow-inner">
                <div className="flex flex-col items-center">
                    <Typography variant="mono" tone="brand" className="text-xs font-black">{c.leads_prev_day || 0}</Typography>
                    <Typography variant="caption" className="text-mx-micro opacity-40 font-black">L</Typography>
                </div>
                <div className="w-px h-mx-sm bg-border-strong opacity-20" />
                <div className="flex flex-col items-center">
                    <Typography variant="mono" tone="warning" className="text-xs font-black">{(c.agd_cart_today || 0) + (c.agd_net_today || 0)}</Typography>
                    <Typography variant="caption" className="text-mx-micro opacity-40 font-black">A</Typography>
                </div>
                <div className="w-px h-mx-sm bg-border-strong opacity-20" />
                <div className="flex flex-col items-center">
                    <Typography variant="mono" tone="success" className="text-xs font-black">{c.visit_prev_day || 0}</Typography>
                    <Typography variant="caption" className="text-mx-micro opacity-40 font-black">V</Typography>
                </div>
            </div>
        )
    },
    {
        key: 'status',
        header: 'STATUS',
        align: 'right',
        render: (c) => {
            const request = userRequests.find(r => r.checkin_id === c.id)
            return (
                <div className="flex items-center justify-end gap-mx-sm">
                    {request ? (
                        <Badge variant={request.status === 'pending' ? 'warning' : request.status === 'approved' ? 'success' : 'danger'} className="px-4 py-1.5 rounded-mx-lg shadow-sm border uppercase font-black tracking-widest text-mx-micro">
                            {request.status === 'pending' ? 'AJUSTE PENDENTE' : request.status === 'approved' ? 'AJUSTE APROVADO' : 'AJUSTE NEGADO'}
                        </Badge>
                    ) : (
                        <Button 
                            variant="ghost" size="sm" 
                            onClick={(e) => { e.stopPropagation(); openRequestModal(c) }}
                            className="h-mx-xl px-4 rounded-mx-lg font-black text-mx-micro uppercase text-text-tertiary hover:text-brand-primary hover:bg-mx-indigo-50"
                        >
                            <Edit3 size={14} className="mr-2" /> SOLICITAR AJUSTE
                        </Button>
                    )}
                    <Badge variant="success" className="hidden sm:inline-flex px-6 py-1.5 rounded-mx-lg shadow-sm border uppercase font-black tracking-widest text-mx-micro">
                        VERIFICADO
                    </Badge>
                </div>
            )
        }
    }
  ], [userRequests])

  // ... (keeping stats, loading state)

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-4 md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      
      {/* ... (keeping header, stats grid) */}

      {/* Audit Table Card via DataGrid Organism */}
      <Card className="flex-1 overflow-hidden flex flex-col border-none shadow-mx-xl bg-white mb-20">
        <CardHeader className="p-4 md:p-mx-lg md:p-10 border-b border-border-default bg-surface-alt/30 flex flex-col sm:flex-row items-center justify-between gap-mx-md">
          <div className="flex items-center gap-mx-md">
            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg transform -rotate-2"><FileText size={28} /></div>
            <div>
              <Typography variant="h2" className="text-2xl uppercase font-black tracking-tighter">Timeline de Registros</Typography>
              <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1 font-black opacity-40">SINC: LIVE AUDIT SYSTEM</Typography>
            </div>
          </div>
          <div className="relative group w-full sm:w-mx-sidebar-expanded">
            <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
            <Input 
                placeholder="BUSCAR DATA..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="!pl-11 !h-12 !text-mx-tiny uppercase tracking-widest font-black"
            />
          </div>
        </CardHeader>

        <div className="p-4 md:p-mx-md md:p-0">
            <DataGrid 
                columns={columns} 
                data={filteredCheckins} 
                emptyMessage="Nenhuma timeline localizada para este período."
            />
        </div>
      </Card>

      {/* ... (keeping Modal) */}
    </main>
  )
}

      {/* Modal de Solicitação de Ajuste */}
      <AnimatePresence>
          {requestingCheckin && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-mx-sm md:p-10 bg-mx-black/60 backdrop-blur-sm"
              >
                  <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto no-scrollbar shadow-mx-2xl border-none flex flex-col bg-white rounded-mx-3xl">
                      <header className="p-4 md:p-mx-lg md:p-10 border-b border-border-default flex items-center justify-between sticky top-mx-0 bg-white z-10">
                          <div className="flex items-center gap-mx-sm">
                              <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-brand-primary text-white flex items-center justify-center shadow-mx-md"><Edit3 size={20} /></div>
                              <div>
                                  <Typography variant="h3" className="font-black uppercase">Solicitar Ajuste</Typography>
                                  <Typography variant="caption" tone="muted" className="font-black uppercase opacity-40">Ref: {format(parseISO(requestingCheckin.reference_date), "dd/MM/yyyy")}</Typography>
                              </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => setRequestingCheckin(null)} className="rounded-mx-full w-mx-10 h-mx-10 hover:bg-surface-alt"><X size={20} /></Button>
                      </header>

                      <div className="p-4 md:p-mx-lg md:p-10 space-y-mx-xl">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-mx-lg">
                              <div className="space-y-mx-xs">
                                  <Typography variant="tiny" className="font-black text-text-tertiary uppercase ml-1">Leads</Typography>
                                  <Input type="number" value={correctionForm.leads} onChange={e => setCorrectionForm(p => ({ ...p, leads: Number(e.target.value) }))} className="!h-14 font-mono-numbers text-xl font-black" />
                              </div>
                              <div className="space-y-mx-xs">
                                  <Typography variant="tiny" className="font-black text-text-tertiary uppercase ml-1">Visitas</Typography>
                                  <Input type="number" value={correctionForm.visitas} onChange={e => setCorrectionForm(p => ({ ...p, visitas: Number(e.target.value) }))} className="!h-14 font-mono-numbers text-xl font-black" />
                              </div>
                              <div className="space-y-mx-xs">
                                  <Typography variant="tiny" className="font-black text-text-tertiary uppercase ml-1">Vendas Porta</Typography>
                                  <Input type="number" value={correctionForm.vnd_porta} onChange={e => setCorrectionForm(p => ({ ...p, vnd_porta: Number(e.target.value) }))} className="!h-14 font-mono-numbers text-xl font-black" />
                              </div>
                              <div className="space-y-mx-xs">
                                  <Typography variant="tiny" className="font-black text-text-tertiary uppercase ml-1">Vendas Cart.</Typography>
                                  <Input type="number" value={correctionForm.vnd_cart} onChange={e => setCorrectionForm(p => ({ ...p, vnd_cart: Number(e.target.value) }))} className="!h-14 font-mono-numbers text-xl font-black" />
                              </div>
                              <div className="space-y-mx-xs">
                                  <Typography variant="tiny" className="font-black text-text-tertiary uppercase ml-1">Vendas Net</Typography>
                                  <Input type="number" value={correctionForm.vnd_net} onChange={e => setCorrectionForm(p => ({ ...p, vnd_net: Number(e.target.value) }))} className="!h-14 font-mono-numbers text-xl font-black" />
                              </div>
                              <div className="space-y-mx-xs">
                                  <Typography variant="tiny" className="font-black text-text-tertiary uppercase ml-1">Agend. Cart.</Typography>
                                  <Input type="number" value={correctionForm.agd_cart} onChange={e => setCorrectionForm(p => ({ ...p, agd_cart: Number(e.target.value) }))} className="!h-14 font-mono-numbers text-xl font-black" />
                              </div>
                              <div className="space-y-mx-xs">
                                  <Typography variant="tiny" className="font-black text-text-tertiary uppercase ml-1">Agend. Net</Typography>
                                  <Input type="number" value={correctionForm.agd_net} onChange={e => setCorrectionForm(p => ({ ...p, agd_net: Number(e.target.value) }))} className="!h-14 font-mono-numbers text-xl font-black" />
                              </div>
                          </div>

                          <div className="space-y-mx-sm">
                              <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest ml-1">Justificativa da Mudança (Obrigatório)</Typography>
                              <textarea 
                                value={correctionForm.reason} onChange={e => setCorrectionForm(p => ({ ...p, reason: e.target.value }))}
                                className="w-full h-mx-32 p-4 md:p-mx-md rounded-mx-2xl bg-surface-alt border border-border-default focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all text-sm font-bold outline-none resize-none shadow-mx-inner"
                                placeholder="Descreva por que este dado precisa ser alterado..."
                              />
                          </div>

                          <Card className="p-4 md:p-mx-md bg-status-warning-surface border border-mx-amber-100 flex items-start gap-mx-sm rounded-mx-2xl">
                              <AlertTriangle size={18} className="text-status-warning shrink-0 mt-0.5" />
                              <Typography variant="tiny" tone="warning" className="font-black uppercase leading-tight">
                                  Sua solicitação passará por auditoria do gerente antes de ser aplicada ao histórico consolidado.
                              </Typography>
                          </Card>
                      </div>

                      <footer className="p-4 md:p-mx-lg md:p-10 border-t border-border-default flex justify-end sticky bottom-mx-0 bg-white z-10">
                          <Button 
                            onClick={handleSendRequest}
                            disabled={requestLoading || !correctionForm.reason}
                            className="h-mx-14 px-14 rounded-mx-full shadow-mx-xl font-black uppercase text-xs tracking-widest"
                          >
                              {requestLoading ? <RefreshCw className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />}
                              ENVIAR PARA AUDITORIA
                          </Button>
                      </footer>
                  </Card>
              </motion.div>
          )}
      </AnimatePresence>
    </main>
  )
}
