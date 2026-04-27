import { useMyCheckins } from '@/hooks/useCheckins'
import { calcularTotais } from '@/lib/calculations'
import { motion, AnimatePresence } from 'motion/react'
import { 
    History, Calendar, Car, Users, Globe, Eye, 
    MessageSquare, Search, ArrowUpDown, RefreshCw, X,
    CalendarDays, Phone, AlertCircle, Send
} from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Card } from '@/components/molecules/Card'
import { Modal } from '@/components/organisms/Modal'
import { toast } from 'sonner'
import { useCheckinAuditor } from '@/hooks/useCheckinAuditor'
import type { CheckinWithTotals } from '@/types/database'

export default function Historico() {
    const { checkins, loading, refetch } = useMyCheckins()
    const { requestCorrection, loading: submittingCorrection } = useCheckinAuditor()
    const [searchTerm, setSearchTerm] = useState('')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [isRefetching, setIsRefetching] = useState(false)

    // Estado para correção
    const [selectedCheckin, setSelectedCheckin] = useState<CheckinWithTotals | null>(null)
    const [correctionReason, setCorrectionReason] = useState('')
    const [formData, setFormData] = useState({
        leads: 0,
        agd_cart: 0,
        agd_net: 0,
        vnd_porta: 0,
        vnd_cart: 0,
        vnd_net: 0,
        visitas: 0
    })

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true); await refetch(); setIsRefetching(false)
        toast.success('Histórico sincronizado!')
    }, [refetch])

    const openCorrectionModal = (c: CheckinWithTotals) => {
        setSelectedCheckin(c)
        setCorrectionReason('')
        setFormData({
            leads: c.leads_prev_day || 0,
            agd_cart: c.agd_cart_today || 0,
            agd_net: c.agd_net_today || 0,
            vnd_porta: c.vnd_porta_prev_day || 0,
            vnd_cart: c.vnd_cart_prev_day || 0,
            vnd_net: c.vnd_net_prev_day || 0,
            visitas: c.visit_prev_day || 0
        })
    }

    const handleRequestCorrection = async () => {
        if (!selectedCheckin) return
        if (!correctionReason.trim()) return toast.error('Descreva o motivo da correção')

        // Mapear campos para as colunas reais do banco para a aprovação ser atômica
        // Usamos os nomes canônicos que a RPC agora suporta e que a trigger respeita
        const updatePayload = {
            leads_prev_day: formData.leads,
            agd_cart_today: formData.agd_cart,
            agd_net_today: formData.agd_net,
            vnd_porta_prev_day: formData.vnd_porta,
            vnd_cart_prev_day: formData.vnd_cart,
            vnd_net_prev_day: formData.vnd_net,
            visit_prev_day: formData.visitas
        }

        const { error } = await requestCorrection(selectedCheckin.id, updatePayload as any, correctionReason)
        
        if (error) {
            toast.error(error)
        } else {
            toast.success('Solicitação de correção enviada ao Gerente!')
            setSelectedCheckin(null)
        }
    }

    const processedCheckins = useMemo(() => {
        return checkins
            .map(c => ({
                ...c,
                parsedDate: parseISO(c.reference_date),
                totals: calcularTotais(c)
            }))
            .filter(c => 
                c.reference_date.includes(searchTerm) || 
                c.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.zero_reason?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => {
                const timeA = a.parsedDate.getTime(); const timeB = b.parsedDate.getTime()
                return sortOrder === 'desc' ? timeB - timeA : timeA - timeB
            })
    }, [checkins, searchTerm, sortOrder])

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Recuperando Memória...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / History Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Histórico <span className="text-mx-green-700">Operacional</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Registros Sincronizados na Malha MX</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <div className="relative group w-full sm:w-mx-sidebar-expanded">
                        <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                        <Input 
                            placeholder="BUSCAR REGISTRO..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="!pl-mx-11 !h-mx-12 !text-mx-tiny uppercase tracking-mx-wide"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} aria-label="Alternar ordenação" className="rounded-mx-xl h-mx-xl w-mx-xl shadow-mx-sm">
                        <ArrowUpDown size={18} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Atualizar" className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                </div>
            </header>

            {processedCheckins.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-40 rounded-mx-3xl text-center border-dashed border-2 border-border-default bg-white/50 shadow-inner">
                    <History size={48} className="text-text-tertiary mb-6 opacity-30" />
                    <Typography variant="h2" className="mb-2">Memória Vazia</Typography>
                    <Typography variant="p" tone="muted" className="max-w-xs uppercase tracking-tight">Nenhum registro localizado para o termo buscado na rede.</Typography>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-mx-lg pb-32" aria-live="polite">
                    <AnimatePresence mode="popLayout">
                        {processedCheckins.map((c, i) => (
                            <motion.div key={c.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}>
                                <Card className="p-mx-lg md:p-10 group hover:shadow-mx-xl transition-all border-none shadow-mx-lg bg-white relative overflow-hidden">
                                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-3xl -mr-16 -mt-16" />
                                    
                                    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-mx-md mb-8 border-b border-border-default pb-8 relative z-10">
                                        <div className="flex items-center gap-mx-sm">
                                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center text-brand-primary shadow-inner group-hover:bg-brand-primary group-hover:text-white transition-all">
                                                <Calendar size={24} />
                                            </div>
                                            <div>
                                                <Typography variant="h3" className="text-base">
                                                    <time dateTime={c.reference_date}>{format(c.parsedDate, "eeee, dd 'de' MMMM", { locale: ptBR })}</time>
                                                </Typography>
                                                <Typography variant="caption" tone="muted" className="uppercase tracking-widest">SNAPSHOT OPERACIONAL</Typography>
                                            </div>
                                        </div>
                                        <Badge variant={c.totals.vnd_total > 0 ? 'success' : c.zero_reason ? 'warning' : 'outline'} className="px-6 py-2 rounded-mx-full shadow-mx-sm font-black uppercase tracking-widest">
                                            {c.totals.vnd_total > 0 ? `${c.totals.vnd_total} VENDAS` : c.zero_reason || 'INATIVO'}
                                        </Badge>
                                    </header>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-mx-sm mb-10 relative z-10">
                                        {[
                                            { label: 'LEADS', val: c.leads_prev_day, icon: Phone, tone: 'brand' },
                                            { label: 'AGEND.', val: c.totals.agd_total, icon: CalendarDays, tone: 'info' },
                                            { label: 'VISITAS', val: c.visit_prev_day, icon: Eye, tone: 'warning' },
                                            { label: 'VENDAS', val: c.totals.vnd_total, icon: Car, tone: 'success' },
                                        ].map(stat => (
                                            <div key={stat.label} className="bg-surface-alt rounded-mx-2xl p-mx-5 text-center border border-border-default shadow-inner group-hover:bg-white group-hover:shadow-mx-sm transition-all">
                                                <stat.icon size={16} className={cn("mx-auto mb-3 opacity-40", 
                                                    stat.tone === 'brand' ? 'text-brand-primary' : 
                                                    stat.tone === 'info' ? 'text-status-info' : 
                                                    stat.tone === 'warning' ? 'text-status-warning' : 
                                                    'text-status-success'
                                                )} />
                                                <Typography variant="h2" className="text-2xl font-mono-numbers mb-1">{stat.val}</Typography>
                                                <Typography variant="caption" tone="muted" className="text-mx-micro uppercase tracking-widest">{stat.label}</Typography>
                                            </div>
                                        ))}
                                    </div>

                                    {c.note && (
                                        <footer className="pt-8 border-t border-border-default flex items-start gap-mx-sm relative z-10">
                                            <div className="w-mx-lg h-mx-lg rounded-mx-full bg-mx-indigo-50 flex items-center justify-center text-brand-primary shrink-0 shadow-inner">
                                                <MessageSquare size={14} />
                                            </div>
                                            <Typography variant="p" className="text-xs italic leading-relaxed text-text-secondary uppercase tracking-tight line-clamp-2">
                                                "{c.note}"
                                            </Typography>
                                        </footer>
                                    )}

                                    <div className="mt-mx-lg flex justify-end relative z-10 border-t border-border-default pt-mx-lg border-dashed">
                                        <Button variant="ghost" size="sm" onClick={() => openCorrectionModal(c)} className="text-mx-nano font-black uppercase tracking-mx-widest text-text-tertiary hover:text-brand-primary hover:bg-brand-primary/5 gap-mx-xs group/btn">
                                            <AlertCircle size={14} className="group-hover/btn:animate-pulse" /> SOLICITAR CORREÇÃO
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Modal de Correção */}
            <Modal
                open={!!selectedCheckin}
                onClose={() => setSelectedCheckin(null)}
                title="Solicitar Correção de Registro"
                description={`Ajuste de produção para o dia ${selectedCheckin ? format(parseISO(selectedCheckin.reference_date), 'dd/MM/yyyy') : ''}`}
                size="lg"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setSelectedCheckin(null)} disabled={submittingCorrection}>CANCELAR</Button>
                        <Button onClick={handleRequestCorrection} disabled={submittingCorrection} className="gap-mx-xs">
                            {submittingCorrection ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                            ENVIAR SOLICITAÇÃO
                        </Button>
                    </>
                }
            >
                <div className="space-y-mx-lg py-4">
                    <div className="grid grid-cols-2 gap-mx-md">
                        <div className="space-y-mx-xs">
                            <Typography variant="tiny" tone="muted" className="font-black uppercase">Leads Recebidos</Typography>
                            <Input type="number" value={formData.leads} onChange={(e) => setFormData(p => ({ ...p, leads: Number(e.target.value) }))} />
                        </div>
                        <div className="space-y-mx-xs">
                            <Typography variant="tiny" tone="muted" className="font-black uppercase">Visitas Realizadas</Typography>
                            <Input type="number" value={formData.visitas} onChange={(e) => setFormData(p => ({ ...p, visitas: Number(e.target.value) }))} />
                        </div>
                        <div className="space-y-mx-xs">
                            <Typography variant="tiny" tone="muted" className="font-black uppercase">Vendas Porta</Typography>
                            <Input type="number" value={formData.vnd_porta} onChange={(e) => setFormData(p => ({ ...p, vnd_porta: Number(e.target.value) }))} />
                        </div>
                        <div className="space-y-mx-xs">
                            <Typography variant="tiny" tone="muted" className="font-black uppercase">Vendas Carteira</Typography>
                            <Input type="number" value={formData.vnd_cart} onChange={(e) => setFormData(p => ({ ...p, vnd_cart: Number(e.target.value) }))} />
                        </div>
                        <div className="space-y-mx-xs">
                            <Typography variant="tiny" tone="muted" className="font-black uppercase">Vendas Internet</Typography>
                            <Input type="number" value={formData.vnd_net} onChange={(e) => setFormData(p => ({ ...p, vnd_net: Number(e.target.value) }))} />
                        </div>
                        <div className="space-y-mx-xs">
                            <Typography variant="tiny" tone="muted" className="font-black uppercase">Agend. Carteira</Typography>
                            <Input type="number" value={formData.agd_cart} onChange={(e) => setFormData(p => ({ ...p, agd_cart: Number(e.target.value) }))} />
                        </div>
                        <div className="space-y-mx-xs">
                            <Typography variant="tiny" tone="muted" className="font-black uppercase">Agend. Internet</Typography>
                            <Input type="number" value={formData.agd_net} onChange={(e) => setFormData(p => ({ ...p, agd_net: Number(e.target.value) }))} />
                        </div>
                    </div>

                    <div className="space-y-mx-xs pt-mx-md border-t border-border-default">
                        <Typography variant="tiny" tone="muted" className="font-black uppercase">Motivo da Alteração (Obrigatório)</Typography>
                        <Textarea 
                            placeholder="Descreva por que este registro precisa ser corrigido..."
                            value={correctionReason}
                            onChange={(e) => setCorrectionReason(e.target.value)}
                            className="min-h-mx-32"
                        />
                        <Typography variant="caption" tone="muted" className="italic text-mx-nano">
                            *Sua solicitação será enviada para auditoria do Gerente da Unidade.
                        </Typography>
                    </div>
                </div>
            </Modal>
        </main>
    )
}
