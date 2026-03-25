import { useState } from 'react'
import { Plus, Trash2, FileSignature } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { useFinance } from '@/stores/FinanceContext'
import { useUsers } from '@/stores/UsersContext'
import type { CommissionRule } from '@/types'
import { cn } from '@/lib/utils'

export default function CommissionRules({ standalone = true }: { standalone?: boolean }) {
    const { commissionRules, addCommissionRule, deleteCommissionRule } = useFinance()
    const { team = [] } = useUsers()
    const [open, setOpen] = useState(false)
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
    const [sellerId, setSellerId] = useState('all')
    const [vehicleType, setVehicleType] = useState('all')
    const [marginMin, setMarginMin] = useState('')
    const [marginMax, setMarginMax] = useState('')
    const [percentage, setPercentage] = useState('')

    const handleSave = () => {
        if (!percentage) return
        const ruleData = {
            sellerId: sellerId === 'all' ? undefined : sellerId,
            vehicleType: vehicleType === 'all' ? undefined : vehicleType,
            marginMin: marginMin ? Number(marginMin) : undefined,
            marginMax: marginMax ? Number(marginMax) : undefined,
            percentage: Number(percentage),
        }

        if (editingRuleId) {
            deleteCommissionRule(editingRuleId)
            addCommissionRule(ruleData as any)
            toast({ title: 'Regra Atualizada', description: 'A regra de comissão foi modificada com sucesso.' })
        } else {
            addCommissionRule(ruleData as any)
            toast({ title: 'Regra Criada', description: 'Nova regra de comissão adicionada.' })
        }

        setOpen(false)
        setEditingRuleId(null)
        setSellerId('all'); setVehicleType('all'); setMarginMin(''); setMarginMax(''); setPercentage('')
    }

    const handleEdit = (rule: any) => {
        setEditingRuleId(rule.id)
        setSellerId(rule.sellerId || 'all')
        setVehicleType(rule.vehicleType || 'all')
        setMarginMin(rule.marginMin?.toString() || '')
        setMarginMax(rule.marginMax?.toString() || '')
        setPercentage(rule.percentage.toString())
        setOpen(true)
    }

    const handleNew = () => {
        setEditingRuleId(null)
        setSellerId('all'); setVehicleType('all'); setMarginMin(''); setMarginMax(''); setPercentage('')
        setOpen(true)
    }

    return (
        <div className={cn("space-y-8 max-w-5xl mx-auto pb-12", !standalone && "max-w-none pb-0")}>
            {standalone && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-electric-blue"></div>
                            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">CONFIGURAÇÃO</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-pure-black dark:text-off-white">
                            Regras de <span className="text-electric-blue">Comissão</span>
                        </h1>
                    </div>
                    <Button onClick={handleNew} className="rounded-full px-6 h-11 font-bold bg-pure-black text-white dark:bg-white dark:text-pure-black shadow-elevation hover:scale-105 transition-transform">
                        <Plus className="w-4 h-4 mr-2" /> Nova Regra
                    </Button>
                </div>
            )}

            <Card className="border-none bg-white dark:bg-pure-black shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-black/5 dark:border-white/5 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-electric-blue/10 rounded-xl"><FileSignature className="h-5 w-5 text-electric-blue" /></div>
                        <div>
                            <CardTitle className="text-lg font-extrabold text-pure-black dark:text-off-white">Motor de Comissões</CardTitle>
                            <CardDescription className="font-semibold text-muted-foreground mt-1">As regras são aplicadas automaticamente na etapa de Venda do funil.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-black/5 dark:bg-white/5">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4 text-pure-black dark:text-off-white pl-6">Vendedor</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4 text-pure-black dark:text-off-white">Tipo Veículo</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4 text-pure-black dark:text-off-white">Margem Mín.</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4 text-pure-black dark:text-off-white">Margem Máx.</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4 text-pure-black dark:text-off-white">Comissão %</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4 text-pure-black dark:text-off-white pr-6">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {commissionRules.map((rule) => (
                                <TableRow key={rule.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-none">
                                    <TableCell className="font-bold text-sm py-4 pl-6 text-pure-black dark:text-off-white">{rule.sellerId ? team.find((t) => t.id === rule.sellerId)?.name || rule.sellerId : 'Todos'}</TableCell>
                                    <TableCell className="font-bold text-sm py-4 text-pure-black dark:text-off-white">{rule.vehicleType || 'Todos'}</TableCell>
                                    <TableCell className="font-bold text-sm py-4 text-muted-foreground">{rule.marginMin != null ? `${rule.marginMin}%` : '-'}</TableCell>
                                    <TableCell className="font-bold text-sm py-4 text-muted-foreground">{rule.marginMax != null ? `${rule.marginMax}%` : '-'}</TableCell>
                                    <TableCell className="py-4"><Badge variant="secondary" className="font-mono-numbers bg-electric-blue/10 text-electric-blue border-none font-bold">{rule.percentage}%</Badge></TableCell>
                                    <TableCell className="py-4 pr-6">
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}
                                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-electric-blue hover:bg-electric-blue/10">
                                                <FileSignature className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => { deleteCommissionRule(rule.id); toast({ title: 'Regra Removida' }) }}
                                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-mars-orange hover:bg-mars-orange/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {commissionRules.length === 0 && (
                                <TableRow><TableCell colSpan={6} className="p-12 text-center text-muted-foreground font-bold">Nenhuma regra configurada.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-2xl">
                    <DialogHeader><DialogTitle className="font-extrabold text-2xl text-pure-black dark:text-off-white">
                        {editingRuleId ? 'Editar Regra' : 'Nova Regra de Comissão'}
                    </DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2"><Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground dark:text-off-white/60">Vendedor</Label>
                            <Select value={sellerId} onValueChange={setSellerId}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-xl"><SelectItem value="all">Todos</SelectItem>{team.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground dark:text-off-white/60">Tipo de Veículo</Label>
                            <Select value={vehicleType} onValueChange={setVehicleType}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-xl"><SelectItem value="all">Todos</SelectItem><SelectItem value="Sedan">Sedan</SelectItem><SelectItem value="SUV">SUV</SelectItem><SelectItem value="Esportivo">Esportivo</SelectItem><SelectItem value="Utilitário">Utilitário</SelectItem></SelectContent></Select></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground dark:text-off-white/60">Margem Mín. %</Label><Input type="number" value={marginMin} onChange={(e) => setMarginMin(e.target.value)} className="rounded-xl" /></div>
                            <div className="space-y-2"><Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground dark:text-off-white/60">Margem Máx. %</Label><Input type="number" value={marginMax} onChange={(e) => setMarginMax(e.target.value)} className="rounded-xl" /></div>
                        </div>
                        <div className="space-y-2"><Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground dark:text-off-white/60">Percentual de Comissão</Label><Input type="number" value={percentage} onChange={(e) => setPercentage(e.target.value)} className="rounded-xl" placeholder="Ex: 15" /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                        <Button onClick={handleSave} disabled={!percentage} className="rounded-xl font-bold bg-electric-blue text-white">Salvar Regra</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
