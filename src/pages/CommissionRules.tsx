import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { 
    Plus, Trash2, FileSignature, RefreshCw, AlertTriangle, 
    CheckCircle2, X, ChevronRight, Settings, Target, TrendingUp,
    ShieldCheck, Users, Car, ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import { useFinance } from '@/stores/FinanceContext'
import { useUsers } from '@/stores/UsersContext'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'

export default function CommissionRules() {
    const { commissionRules, addCommissionRule, deleteCommissionRule, updateCommissionRule, refetch: refetchFinance } = useFinance()
    const { team = [] } = useUsers()
    const [open, setOpen] = useState(false)
    const [isRefetching, setIsRefetching] = useState(false)
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
    const undoRef = useRef<(() => void) | null>(null)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                if (undoRef.current) { e.preventDefault(); undoRef.current(); undoRef.current = null }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const handleDelete = (id: string) => {
        const ruleToDelete = commissionRules.find(r => r.id === id);
        if (!ruleToDelete) return;

        let wasCanceled = false;
        const cancelAction = () => { wasCanceled = true; undoRef.current = null; toast.success("Diretriz preservada!") };
        undoRef.current = cancelAction;

        toast.warning(`Removendo diretriz estratégica`, {
            description: "Pressione Ctrl+Z para desfazer.",
            action: { label: "DESFAZER", onClick: cancelAction },
            onAutoClose: () => {
                if (!wasCanceled) { deleteCommissionRule(id); if (undoRef.current === cancelAction) undoRef.current = null }
            },
            duration: 5000,
        });
    }
    
    const [form, setForm] = useState({ sellerId: 'all', vehicleType: 'all', marginMin: '', marginMax: '', percentage: '' })

    const resetForm = useCallback(() => {
        setForm({ sellerId: 'all', vehicleType: 'all', marginMin: '', marginMax: '', percentage: '' })
        setEditingRuleId(null)
    }, [])

    const handleSave = async () => {
        if (!form.percentage) return
        if (form.marginMin && form.marginMax && Number(form.marginMin) >= Number(form.marginMax)) {
            toast.error('Margem mínima deve ser menor que a máxima.'); return
        }

        const ruleData: any = {
            sellerId: form.sellerId === 'all' ? undefined : form.sellerId,
            vehicleType: form.vehicleType === 'all' ? undefined : form.vehicleType,
            marginMin: form.marginMin ? Number(form.marginMin) : undefined,
            marginMax: form.marginMax ? Number(form.marginMax) : undefined,
            percentage: Number(form.percentage),
        }

        try {
            if (editingRuleId) await updateCommissionRule(editingRuleId, ruleData)
            else await addCommissionRule(ruleData)
            setOpen(false); resetForm(); toast.success('Matriz estratégica atualizada!')
        } catch (e) { toast.error('Falha na persistência.') }
    }

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / Finance Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Regras de <span className="text-brand-primary">Incentivo</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">ALGORITMO DE COMISSIONAMENTO OPERACIONAL</Typography>
                </div>

                <div className="flex items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={() => {setIsRefetching(true); refetchFinance?.().then(()=>setIsRefetching(false))}} className="w-mx-xl h-mx-xl rounded-mx-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <Button onClick={() => { resetForm(); setOpen(true) }} className="h-mx-xl px-8 shadow-mx-lg bg-brand-secondary">
                        <Plus size={18} className="mr-2" /> NOVA DIRETRIZ
                    </Button>
                </div>
            </header>

            <Card className="mb-20 overflow-hidden border-none shadow-mx-lg bg-white">
                <CardHeader className="bg-surface-alt/30 flex flex-row items-center justify-between p-mx-lg border-b border-border-default">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-md"><FileSignature size={24} /></div>
                        <div>
                            <Typography variant="h3">Motor Financeiro</Typography>
                            <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1">DIRETRIZES DE PERFORMANCE DA REDE</Typography>
                        </div>
                    </div>
                    <Badge variant="brand" className="px-6 py-2 rounded-mx-full font-black shadow-mx-sm">{commissionRules.length} REGRAS ATIVAS</Badge>
                </CardHeader>
                
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left min-w-mx-elite-table">
                        <thead>
                            <tr className="bg-surface-alt/50 border-b border-border-default text-mx-tiny font-black uppercase tracking-mx-wide text-text-tertiary">
                                <th scope="col" className="pl-10 py-6">ESPECIALISTA ALVO</th>
                                <th scope="col" className="px-6 py-6">SEGMENTO ATIVO</th>
                                <th scope="col" className="px-6 py-6 text-center">RANGE MARGEM</th>
                                <th scope="col" className="px-6 py-6 text-center">INCENTIVO</th>
                                <th scope="col" className="pr-10 py-6 text-right">AÇÕES TÁTICAS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                            {commissionRules.map((rule) => (
                                <tr key={rule.id} className="hover:bg-surface-alt/30 transition-colors group h-mx-3xl">
                                    <td className="pl-10">
                                        <div className="flex items-center gap-mx-sm">
                                            <div className="w-mx-10 h-mx-10 rounded-mx-lg bg-surface-alt border border-border-default flex items-center justify-center font-black text-text-tertiary text-xs group-hover:bg-brand-primary group-hover:text-white transition-all shadow-inner uppercase">
                                                {rule.sellerId ? team.find(t => t.id === rule.sellerId)?.name?.charAt(0) : <Users size={16} />}
                                            </div>
                                            <Typography variant="h3" className="text-base uppercase tracking-tight">
                                                {rule.sellerId ? team.find(t => t.id === rule.sellerId)?.name || 'Especialista' : 'TODA A EQUIPE'}
                                            </Typography>
                                        </div>
                                    </td>
                                    <td className="px-6">
                                        <Badge variant="outline" className="px-4 py-1.5 rounded-mx-lg border-border-strong text-mx-micro font-black uppercase">
                                            {rule.vehicleType || 'TODOS OS ATIVOS'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 text-center">
                                        <Typography variant="mono" tone="muted" className="text-sm">
                                            {rule.marginMin || 0}% <ArrowRight size={12} className="inline mx-2" /> {rule.marginMax || '∞'}%
                                        </Typography>
                                    </td>
                                    <td className="px-6 text-center">
                                        <div className="inline-flex items-center px-6 py-2.5 rounded-mx-xl bg-mx-indigo-50 text-brand-primary border border-mx-indigo-100 font-black text-lg tabular-nums shadow-inner">
                                            {rule.percentage}%
                                        </div>
                                    </td>
                                    <td className="pr-10 text-right">
                                        <div className="flex items-center justify-end gap-mx-xs opacity-0 group-hover:opacity-100 transition-all">
                                            <Button variant="outline" size="icon" onClick={() => handleDelete(rule.id)} className="w-mx-10 h-mx-10 rounded-mx-xl text-text-tertiary hover:text-status-error hover:bg-status-error-surface transition-all">
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <AnimatePresence>
                {open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-mx-md bg-pure-black/60 backdrop-blur-xl">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="w-full max-w-xl">
                            <Card className="border-none shadow-mx-xl bg-white overflow-hidden relative">
                                <div className="bg-brand-secondary p-mx-10 text-white relative overflow-hidden">
                                    <div className="absolute top-mx-0 right-mx-0 w-mx-sidebar-expanded h-mx-64 bg-white/5 rounded-mx-full blur-3xl -mr-32 -mt-32" />
                                    <Typography variant="h1" tone="white" className="text-3xl leading-none mb-2">{editingRuleId ? 'Ajustar Regra' : 'Nova Diretriz'}</Typography>
                                    <Typography variant="caption" tone="white" className="opacity-40 uppercase tracking-widest">ALGORITMO DE CÁLCULO OPERACIONAL</Typography>
                                    <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="absolute top-mx-lg right-mx-lg text-white/40 hover:text-white hover:bg-white/10 rounded-mx-full w-mx-xl h-mx-xl transition-all">
                                        <X size={24} />
                                    </Button>
                                </div>

                                <div className="p-mx-10 space-y-mx-10">
                                    <div className="space-y-mx-sm">
                                        <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Alvo Estratégico</Typography>
                                        <div className="relative group">
                                            <select 
                                                value={form.sellerId} onChange={e => setForm({...form, sellerId: e.target.value})}
                                                className="w-full h-mx-14 bg-surface-alt border border-border-default rounded-mx-xl px-6 text-sm font-bold text-text-primary outline-none focus:border-brand-primary transition-all appearance-none cursor-pointer shadow-inner"
                                            >
                                                <option value="all">TODA A EQUIPE</option>
                                                {team.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>)}
                                            </select>
                                            <ChevronDown size={18} className="absolute right-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-hover:text-brand-primary transition-colors pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-lg">
                                        <div className="space-y-mx-sm">
                                            <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Margem Mín (%)</Typography>
                                            <Input type="number" value={form.marginMin} onChange={e => setForm({...form, marginMin: e.target.value})} className="!h-14 font-mono-numbers text-lg" placeholder="0" />
                                        </div>
                                        <div className="space-y-mx-sm">
                                            <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Margem Máx (%)</Typography>
                                            <Input type="number" value={form.marginMax} onChange={e => setForm({...form, marginMax: e.target.value})} className="!h-14 font-mono-numbers text-lg" placeholder="100" />
                                        </div>
                                    </div>

                                    <Card className="p-mx-lg bg-mx-indigo-50 border-mx-indigo-100 shadow-inner flex flex-col items-center text-center space-y-mx-sm">
                                        <Typography variant="caption" tone="brand" className="font-black uppercase tracking-widest">Percentual de Incentivo</Typography>
                                        <input 
                                            type="number" value={form.percentage} onChange={e => setForm({...form, percentage: e.target.value})}
                                            className="w-full bg-white border-4 border-white focus:border-brand-primary rounded-mx-2xl h-mx-3xl text-6xl font-black text-center text-brand-primary transition-all outline-none font-mono-numbers shadow-mx-lg"
                                            placeholder="0"
                                        />
                                    </Card>
                                </div>

                                <footer className="p-mx-lg bg-surface-alt border-t border-border-default flex gap-mx-sm">
                                    <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 h-mx-14 rounded-mx-full uppercase font-black tracking-widest text-mx-tiny">DESCARTAR</Button>
                                    <Button onClick={handleSave} className="flex-[2] h-mx-14 rounded-mx-full shadow-mx-xl uppercase font-black tracking-widest text-mx-tiny">
                                        <ShieldCheck size={18} className="mr-2" /> FIXAR DIRETRIZ
                                    </Button>
                                </footer>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    )
}

const ChevronDown = ({ size, className }: { size?: number, className?: string }) => (
    <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m6 9 6 6 6-6"/>
    </svg>
)
