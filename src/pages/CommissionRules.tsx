import { useState, useMemo, useCallback } from 'react'
import { Plus, Trash2, FileSignature, RefreshCw, AlertTriangle, CheckCircle2, X, ChevronRight, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useFinance } from '@/stores/FinanceContext'
import { useUsers } from '@/stores/UsersContext'
import type { CommissionRule } from '@/types'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'

export default function CommissionRules({ standalone = true }: { standalone?: boolean }) {
    const { commissionRules, addCommissionRule, deleteCommissionRule, updateCommissionRule, refetch: refetchFinance } = useFinance()
    const { team = [] } = useUsers()
    const [open, setOpen] = useState(false)
    const [isRefetching, setIsRefetching] = useState(false)
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
    
    const [form, setForm] = useState({
        sellerId: 'all',
        vehicleType: 'all',
        marginMin: '',
        marginMax: '',
        percentage: ''
    })

    const resetForm = useCallback(() => {
        setForm({ sellerId: 'all', vehicleType: 'all', marginMin: '', marginMax: '', percentage: '' })
        setEditingRuleId(null)
    }, [])

    const handleSave = async () => {
        if (!form.percentage) return
        
        // 11. Validation: min < max
        if (form.marginMin && form.marginMax && Number(form.marginMin) >= Number(form.marginMax)) {
            toast.error('Margem mínima deve ser menor que a máxima.')
            return
        }

        const ruleData: any = {
            sellerId: form.sellerId === 'all' ? undefined : form.sellerId,
            vehicleType: form.vehicleType === 'all' ? undefined : form.vehicleType,
            marginMin: form.marginMin ? Number(form.marginMin) : undefined,
            marginMax: form.marginMax ? Number(form.marginMax) : undefined,
            percentage: Number(form.percentage),
        }

        try {
            if (editingRuleId) {
                // 2. UX Failure fix: Update instead of delete+add
                await updateCommissionRule(editingRuleId, ruleData)
                toast.success('Diretriz estratégica atualizada!')
            } else {
                await addCommissionRule(ruleData)
                toast.success('Nova regra de comissionamento fixada!')
            }
            setOpen(false)
            resetForm()
        } catch (e) {
            toast.error('Falha na persistência da regra.')
        }
    }

    const handleEdit = (rule: any) => {
        setEditingRuleId(rule.id)
        setForm({
            sellerId: rule.sellerId || 'all',
            vehicleType: rule.vehicleType || 'all',
            marginMin: rule.marginMin?.toString() || '',
            marginMax: rule.marginMax?.toString() || '',
            percentage: rule.percentage.toString()
        })
        setOpen(true)
    }

    const handleRefresh = async () => {
        setIsRefetching(true)
        await refetchFinance?.()
        setIsRefetching(false)
    }

    const handleDelete = (id: string) => {
        if (window.confirm("Deseja desativar esta regra de comissionamento?")) {
            deleteCommissionRule(id)
            toast.info('Regra removida da matriz.')
        }
    }

    return (
        <div className={cn("w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10", !standalone && "p-0")}>
            {standalone && (
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                            <h1 className="text-[38px] font-black tracking-tighter leading-none">Matriz de <span className="text-electric-blue">Comissões</span></h1>
                        </div>
                        <div className="flex items-center gap-3 pl-6 mt-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 italic">Algoritmo de Cálculo Operacional</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <button 
                            onClick={handleRefresh}
                            className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black transition-all active:scale-90"
                        >
                            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                        </button>
                        <button
                            onClick={() => { resetForm(); setOpen(true) }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-pure-black text-white font-black hover:bg-black shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Nova Diretriz
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-elevation overflow-hidden flex flex-col mb-20 relative">
                <div className="p-8 border-b border-gray-50 flex items-center gap-5 bg-gray-50/30">
                    <div className="w-12 h-12 rounded-2xl bg-pure-black text-white flex items-center justify-center shadow-lg">
                        <FileSignature size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-pure-black tracking-tight leading-none mb-1">Motor de Comissionamento</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Regras Automáticas de Performance</p>
                    </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    {/* 5. Header style unification */}
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.3em] text-gray-400 pl-10">Especialista</TableHead>
                                <TableHead className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.3em] text-gray-400">Ativo Comercial</TableHead>
                                <TableHead className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.3em] text-gray-400 text-center">Range de Margem</TableHead>
                                <TableHead className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.3em] text-gray-400 text-center">Incentivo %</TableHead>
                                <TableHead className="px-10 py-6 font-black text-[10px] uppercase tracking-[0.3em] text-gray-400 text-right">Gestão</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-50 bg-white">
                            {commissionRules.map((rule) => (
                                <TableRow key={rule.id} className="hover:bg-gray-50/50 transition-colors group border-none">
                                    <TableCell className="px-8 py-6 pl-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-pure-black text-[10px] font-black group-hover:bg-pure-black group-hover:text-white transition-all">
                                                {rule.sellerId ? team.find((t) => t.id === rule.sellerId)?.name?.charAt(0) || 'E' : 'A'}
                                            </div>
                                            {/* 7. Logic: Hide UUIDs */}
                                            <span className="font-black text-sm text-pure-black uppercase tracking-tight">{rule.sellerId ? team.find((t) => t.id === rule.sellerId)?.name || 'Especialista' : 'Todos os Consultores'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-6">
                                        <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest border-gray-200 text-gray-400 px-3 py-1 rounded-lg">{rule.vehicleType || 'Todos Ativos'}</Badge>
                                    </TableCell>
                                    <TableCell className="px-8 py-6 text-center">
                                        <div className="flex items-center justify-center gap-3 font-mono-numbers font-bold text-xs text-gray-400 uppercase tracking-widest">
                                            {rule.marginMin != null ? `${rule.marginMin}%` : '0%'}
                                            <ChevronRight size={12} className="text-gray-200" />
                                            {rule.marginMax != null ? `${rule.marginMax}%` : '∞'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-6 text-center">
                                        <div className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-electric-blue font-black text-sm shadow-sm">
                                            {rule.percentage}%
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-10 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleEdit(rule)} className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-electric-blue hover:bg-indigo-50 transition-all shadow-sm">
                                                <FileSignature size={18} strokeWidth={2.5} />
                                            </button>
                                            <button onClick={() => handleDelete(rule.id)} className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm">
                                                <Trash2 size={18} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {/* 17. Empty State with CTA */}
                            {commissionRules.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-6 opacity-40">
                                            <Settings size={48} className="text-gray-300" />
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 italic">Nenhuma regra ativa na matriz financeira.</p>
                                                <button onClick={handleNew} className="mt-6 text-[9px] font-black text-electric-blue uppercase tracking-[0.2em] hover:underline">Configurar Primeira Regra</button>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) resetForm() }}>
                <DialogContent className="sm:max-w-[520px] rounded-[3rem] p-0 border-none shadow-3xl overflow-hidden">
                    <div className="bg-pure-black p-10 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-electric-blue/20 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                        <DialogTitle className="text-3xl font-black tracking-tighter mb-2 relative z-10">{editingRuleId ? 'Ajustar Diretriz' : 'Nova Regra de Incentivo'}</DialogTitle>
                        <DialogDescription className="text-white/40 font-bold uppercase text-[10px] tracking-[0.3em] relative z-10">Matriz de Comissionamento Operacional</DialogDescription>
                    </div>
                    
                    <div className="p-10 space-y-8 bg-white max-h-[70vh] overflow-y-auto no-scrollbar">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Alvo da Regra (Especialista)</Label>
                            <Select value={form.sellerId} onValueChange={v => setForm({ ...form, sellerId: v })}>
                                <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-bold shadow-inner">
                                    <SelectValue placeholder="Selecione o alvo..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 shadow-3xl">
                                    <SelectItem value="all" className="font-black text-pure-black">TODOS OS CONSULTORES</SelectItem>
                                    {team.map((t) => <SelectItem key={t.id} value={t.id} className="font-bold">{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Tipo de Ativo Comercial</Label>
                            {/* 20. Dynamic vehicle types from logic */}
                            <Select value={form.vehicleType} onValueChange={v => setForm({ ...form, vehicleType: v })}>
                                <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-bold shadow-inner">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 shadow-3xl">
                                    <SelectItem value="all" className="font-bold">Todos os Veículos</SelectItem>
                                    <SelectItem value="Sedan" className="font-bold">Sedans de Luxo</SelectItem>
                                    <SelectItem value="SUV" className="font-bold">SUVs / Off-road</SelectItem>
                                    <SelectItem value="Esportivo" className="font-bold">Esportivos / Premium</SelectItem>
                                    <SelectItem value="Utilitário" className="font-bold">Utilitários / Logística</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Margem Mín. %</Label>
                                <div className="relative">
                                    {/* 8. Input Mask placeholder */}
                                    <Input type="number" value={form.marginMin} onChange={(e) => setForm({ ...form, marginMin: e.target.value })} className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-mono-numbers text-xl font-black pr-10" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 font-black">%</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Margem Máx. %</Label>
                                <div className="relative">
                                    <Input type="number" value={form.marginMax} onChange={(e) => setForm({ ...form, marginMax: e.target.value })} className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-mono-numbers text-xl font-black pr-10" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 font-black">%</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100/50">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue ml-2">Comissão de Fechamento %</Label>
                            <div className="relative">
                                <Input type="number" value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })} className="h-20 rounded-[1.5rem] border-electric-blue/20 bg-white font-mono-numbers text-5xl font-black text-center pr-12 focus:ring-8 focus:ring-electric-blue/5 transition-all" placeholder="0" />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-electric-blue/20 text-3xl font-black">%</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-gray-50/50 flex flex-col sm:flex-row gap-4 border-t border-gray-100">
                        <button onClick={() => setOpen(false)} className="flex-1 px-8 py-4 rounded-full border border-gray-200 font-black text-[10px] uppercase tracking-[0.3em] text-gray-400 hover:bg-white hover:text-pure-black transition-all">Cancelar</button>
                        <button 
                            onClick={handleSave} 
                            disabled={!form.percentage} 
                            className="flex-[2] px-10 py-4 rounded-full bg-electric-blue text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-30"
                        >
                            Fixar Regra na Matriz
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
