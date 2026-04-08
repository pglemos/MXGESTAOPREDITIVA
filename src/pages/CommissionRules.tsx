import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Plus, Trash2, FileSignature, RefreshCw, AlertTriangle, CheckCircle2, X, ChevronRight, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useFinance } from '@/stores/FinanceContext'
import { useUsers } from '@/stores/UsersContext'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'

export default function CommissionRules() {
    const { commissionRules, addCommissionRule, deleteCommissionRule, updateCommissionRule, refetch: refetchFinance } = useFinance()
    const { team = [] } = useUsers()
    const [open, setOpen] = useState(false)
    const [isRefetching, setIsRefetching] = useState(false)
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
    const undoRef = useRef<(() => void) | null>(null)

    // Atalho Global Ctrl+Z / Cmd+Z
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                if (undoRef.current) {
                    e.preventDefault()
                    undoRef.current()
                    undoRef.current = null
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const handleDelete = (id: string) => {
        const ruleToDelete = commissionRules.find(r => r.id === id);
        if (!ruleToDelete) return;

        let wasCanceled = false;

        const cancelAction = () => {
            wasCanceled = true;
            undoRef.current = null;
            toast.success("Diretriz de incentivo preservada!", {
                icon: <RefreshCw size={14} className="animate-spin text-brand-primary" />
            });
        };

        undoRef.current = cancelAction;

        toast.warning(`Removendo diretriz estratégica`, {
            description: "Pressione Ctrl+Z para desfazer agora.",
            action: {
                label: "DESFAZER",
                onClick: cancelAction
            },
            onAutoClose: () => {
                if (!wasCanceled) {
                    deleteCommissionRule(id);
                    if (undoRef.current === cancelAction) undoRef.current = null;
                }
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
        <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-mx-xs">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
                        <h1 className="mx-heading-hero">Regras de <span className="text-brand-primary">Incentivo</span></h1>
                    </div>
                    <p className="mx-text-caption pl-mx-md opacity-60 uppercase">Algoritmo de Comissionamento Operacional</p>
                </div>

                <div className="flex items-center gap-mx-sm shrink-0">
                    <button onClick={() => refetchFinance?.()} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary transition-all"><RefreshCw size={20} className={cn(isRefetching && "animate-spin")} /></button>
                    <button onClick={() => { resetForm(); setOpen(true) }} className="mx-button-primary bg-brand-secondary flex items-center gap-2"><Plus size={18} /> Nova Diretriz</button>
                </div>
            </div>

            <Card className="mb-mx-3xl overflow-hidden">
                <CardHeader className="bg-mx-slate-50/30">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-10 h-10 rounded-mx-md bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg"><FileSignature size={20} /></div>
                        <div><CardTitle className="!text-lg">Motor Financeiro</CardTitle><p className="mx-text-caption !text-[8px]">Diretrizes de Performance da Rede</p></div>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left min-w-[800px]">
                        <thead><tr className="bg-mx-slate-50/50 mx-text-caption border-b border-border-default"><th className="pl-mx-lg py-mx-md uppercase tracking-[0.3em]">Especialista</th><th className="py-mx-md uppercase tracking-[0.3em]">Ativo</th><th className="py-mx-md uppercase tracking-[0.3em] text-center">Margem %</th><th className="py-mx-md uppercase tracking-[0.3em] text-center">Incentivo %</th><th className="pr-mx-lg py-mx-md uppercase tracking-[0.3em] text-right">Ação</th></tr></thead>
                        <tbody className="divide-y divide-border-subtle bg-white">
                            {commissionRules.map((rule) => (
                                <tr key={rule.id} className="hover:bg-mx-slate-50/50 transition-colors group h-20">
                                    <td className="pl-mx-lg py-4"><span className="font-black text-sm text-text-primary uppercase tracking-tight">{rule.sellerId ? team.find(t => t.id === rule.sellerId)?.name || 'Especialista' : 'Toda a Equipe'}</span></td>
                                    <td className="py-4"><Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest">{rule.vehicleType || 'Todos'}</Badge></td>
                                    <td className="py-4 text-center font-mono-numbers font-bold text-xs text-text-tertiary">{rule.marginMin || 0}% → {rule.marginMax || '∞'}%</td>
                                    <td className="py-4 text-center"><div className="inline-flex items-center px-mx-sm py-1.5 rounded-mx-md bg-brand-primary-surface text-brand-primary font-black text-sm shadow-mx-sm">{rule.percentage}%</div></td>
                                    <td className="pr-mx-lg py-4 text-right"><div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleDelete(rule.id)} className="w-9 h-9 rounded-mx-md bg-mx-slate-50 text-text-tertiary hover:text-status-error transition-all flex items-center justify-center"><Trash2 size={16} /></button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Dialog open={open} onOpenChange={v => { setOpen(v); if(!v) resetForm() }}>
                <DialogContent className="sm:max-w-[520px] rounded-mx-3xl p-0 border-none shadow-mx-elite overflow-hidden">
                    <div className="bg-brand-secondary p-mx-lg text-white relative overflow-hidden"><DialogTitle className="text-3xl font-black tracking-tighter uppercase mb-1 relative z-10">{editingRuleId ? 'Ajustar Regra' : 'Nova Diretriz'}</DialogTitle><p className="mx-text-caption text-white/40">Algoritmo de Cálculo Operacional</p></div>
                    <div className="p-mx-lg space-y-mx-md bg-white">
                        <div className="space-y-1"><label className="mx-text-caption ml-2">Alvo</label><select value={form.sellerId} onChange={e => setForm({...form, sellerId: e.target.value})} className="mx-input appearance-none"><option value="all">Toda a Equipe</option>{team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                        <div className="grid grid-cols-2 gap-mx-sm">
                            <div className="space-y-1"><label className="mx-text-caption ml-2">Margem Mín %</label><input type="number" value={form.marginMin} onChange={e => setForm({...form, marginMin: e.target.value})} className="mx-input font-mono-numbers text-lg" placeholder="0" /></div>
                            <div className="space-y-1"><label className="mx-text-caption ml-2">Margem Máx %</label><input type="number" value={form.marginMax} onChange={e => setForm({...form, marginMax: e.target.value})} className="mx-input font-mono-numbers text-lg" placeholder="100" /></div>
                        </div>
                        <div className="space-y-1 p-mx-md bg-brand-primary-surface rounded-mx-xl border border-mx-indigo-100"><label className="mx-text-caption text-brand-primary ml-2">Incentivo Final %</label><input type="number" value={form.percentage} onChange={e => setForm({...form, percentage: e.target.value})} className="mx-input !bg-white !text-4xl text-center h-20" placeholder="0" /></div>
                    </div>
                    <DialogFooter className="p-mx-md bg-mx-slate-50 border-t border-border-default flex gap-mx-sm"><button onClick={() => setOpen(false)} className="mx-button-primary !bg-white !text-text-tertiary border border-border-default flex-1">Descartar</button><button onClick={handleSave} className="mx-button-primary bg-brand-primary flex-[2]">Fixar Diretriz</button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
