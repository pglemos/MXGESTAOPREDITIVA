import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Plus, Trash2, CheckSquare, Clock, AlertTriangle, Edit2, Calendar, Search, Filter, MoreVertical, CheckCircle2, Circle, User, ChevronRight, LayoutGrid, List, RefreshCw, X, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import useAppStore, { Task, TaskPriority, TaskStatus } from '@/stores/main'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { format, isBefore, startOfDay } from 'date-fns'

const priorityConfig = {
    'Alta': { style: 'bg-status-error-surface text-status-error border-mx-rose-100', icon: <AlertTriangle size={12} /> },
    'Média': { style: 'bg-status-warning-surface text-status-warning border-mx-amber-100', icon: <Clock size={12} /> },
    'Baixa': { style: 'bg-status-success-surface text-status-success border-mx-emerald-100', icon: <CheckCircle2 size={12} /> }
}

export default function Tarefas() {
    const { tasks, addTask, updateTask, deleteTask, leads, refetch: refetchTasks } = useAppStore()
    const [open, setOpen] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [view, setView] = useState<'board' | 'list'>('board')

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

    const [form, setForm] = useState({ title: '', description: '', priority: 'Média' as TaskPriority, leadId: '', dueDate: new Date().toISOString().split('T')[0] })

    const resetForm = useCallback(() => {
        setForm({ title: '', description: '', priority: 'Média', leadId: '', dueDate: new Date().toISOString().split('T')[0] })
        setEditMode(false); setSelectedId(null)
    }, [])

    const taskGroups = useMemo(() => {
        const filtered = tasks.filter(t => !searchTerm || t.title.toLowerCase().includes(searchTerm.toLowerCase()))
        return {
            'Pendente': filtered.filter(t => t.status === 'Pendente'),
            'Concluída': filtered.filter(t => t.status === 'Concluída'),
            'Atrasada': filtered.filter(t => t.status === 'Atrasada' || (t.status === 'Pendente' && isBefore(new Date(t.dueDate), startOfDay(new Date()))))
        }
    }, [tasks, searchTerm])

    const handleSave = async () => {
        if (!form.title) return
        try {
            if (editMode && selectedId) await updateTask(selectedId, { ...form })
            else await addTask({ ...form })
            setOpen(false); resetForm(); toast.success('Operação registrada!')
        } catch (e) { toast.error('Falha no registro.') }
    }

    const handleDelete = (id: string) => {
        const taskToDelete = tasks.find(t => t.id === id);
        if (!taskToDelete) return;

        let wasCanceled = false;
        
        const cancelAction = () => {
            wasCanceled = true;
            undoRef.current = null;
            toast.success(`Missão "${taskToDelete.title}" preservada!`, {
                icon: <RefreshCw size={14} className="animate-spin text-brand-primary" />
            });
        };

        undoRef.current = cancelAction;

        toast.warning(`Removendo: ${taskToDelete.title}`, {
            description: "Pressione Ctrl+Z para desfazer agora.",
            action: {
                label: "DESFAZER",
                onClick: cancelAction
            },
            onAutoClose: () => {
                if (!wasCanceled) {
                    deleteTask(id);
                    if (undoRef.current === cancelAction) undoRef.current = null;
                }
            },
            duration: 5000,
        });
    }

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl">
            {/* Header / Toolbar - Tokenized */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div>
                    <div className="flex items-center gap-mx-xs mb-mx-sm">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
                        <h1 className="mx-heading-hero">Gerenciador de <span className="text-brand-primary">Missões</span></h1>
                    </div>
                    <p className="mx-text-caption pl-mx-md opacity-60">Fluxo Tático de Alta Performance</p>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm">
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary" />
                        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar missão..." className="mx-input !h-11 !pl-11" />
                    </div>
                    <div className="bg-mx-slate-50/50 p-1 rounded-mx-lg flex border border-border-default shadow-inner">
                        <button onClick={() => setView('board')} className={cn("w-10 h-10 rounded-mx-md flex items-center justify-center transition-all", view === 'board' ? "bg-white text-text-primary shadow-mx-sm" : "text-text-tertiary")}><LayoutGrid size={18} /></button>
                        <button onClick={() => setView('list')} className={cn("w-10 h-10 rounded-mx-md flex items-center justify-center transition-all", view === 'list' ? "bg-white text-text-primary shadow-mx-sm" : "text-text-tertiary")}><List size={18} /></button>
                    </div>
                    <button onClick={() => {resetForm(); setOpen(true)}} className="mx-button-primary bg-brand-secondary flex-1 sm:flex-none flex items-center justify-center gap-2"><Plus size={18} /> Nova Missão</button>
                </div>
            </div>

            <div className="flex-1 min-h-[500px]">
                <AnimatePresence mode="wait">
                    {view === 'board' ? (
                        <motion.div key="board" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg h-full">
                            {(['Pendente', 'Concluída', 'Atrasada'] as const).map((status) => (
                                <div key={status} className="flex flex-col gap-mx-md">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", status === 'Concluída' ? 'bg-status-success' : status === 'Atrasada' ? 'bg-status-error' : 'bg-status-warning')} />
                                            <h3 className="mx-text-caption text-text-primary">{status}</h3>
                                            <span className="bg-mx-slate-50 text-text-tertiary font-mono-numbers text-[9px] px-2 py-0.5 rounded-full border border-border-default">{taskGroups[status].length}</span>
                                        </div>
                                    </div>
                                    <ScrollArea className="flex-1 no-scrollbar pr-2 space-y-mx-sm pb-mx-3xl">
                                        {taskGroups[status].map((task) => (
                                            <div key={task.id} onClick={() => { setSelectedId(task.id) }} className="mx-card p-mx-md mx-card-hover group cursor-pointer relative overflow-hidden">
                                                <div className="flex justify-between items-start mb-mx-md">
                                                    <div className={cn("px-2 py-0.5 rounded-mx-sm text-[8px] font-black uppercase tracking-widest border flex items-center gap-1.5", priorityConfig[task.priority].style)}>
                                                        {priorityConfig[task.priority].icon} {task.priority}
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id) }} className="w-7 h-7 rounded bg-status-error-surface text-status-error opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Trash2 size={12} /></button>
                                                </div>
                                                <h4 className={cn("font-black text-sm text-text-primary mb-1 uppercase tracking-tight", task.status === 'Concluída' && "line-through opacity-40")}>{task.title}</h4>
                                                <p className="text-[10px] font-bold text-text-tertiary line-clamp-2 leading-relaxed italic">"{task.description || 'Sem briefing'}"</p>
                                                <div className="pt-mx-md border-t border-border-subtle flex items-center justify-between mt-mx-md">
                                                    <div className="flex items-center gap-1.5 text-[8px] font-black text-text-tertiary uppercase tracking-widest"><User size={10} className="text-brand-primary" /> {leads.find(l => l.id === task.leadId)?.name || 'S/ Alvo'}</div>
                                                    <span className="text-[8px] font-black text-text-tertiary font-mono-numbers">{format(new Date(task.dueDate), 'dd/MM')}</span>
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={() => {resetForm(); setOpen(true)}} className="w-full border-2 border-dashed border-border-default rounded-mx-xl py-mx-lg text-text-tertiary hover:border-brand-primary hover:text-brand-primary transition-all flex flex-col items-center gap-2"><Plus size={18} /><span className="mx-text-caption opacity-60">Adicionar Missão</span></button>
                                    </ScrollArea>
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className="mx-card overflow-hidden"><table className="w-full text-left min-w-[800px]">
                            <thead><tr className="bg-mx-slate-50/50 mx-text-caption border-b border-border-default"><th className="pl-mx-lg py-mx-md w-16 text-center">Status</th><th className="py-mx-md">Missão</th><th className="py-mx-md">Lead Alvo</th><th className="py-mx-md text-center">Nível</th><th className="pr-mx-lg py-mx-md text-right">Timeline</th></tr></thead>
                            <tbody className="divide-y divide-border-subtle bg-white">
                                {tasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-mx-slate-50/50 transition-colors group cursor-pointer" onClick={() => {}}>
                                        <td className="pl-mx-lg py-mx-md text-center"><Circle size={18} className={cn(task.status === 'Concluída' ? "text-status-success fill-status-success/20" : "text-text-tertiary")} /></td>
                                        <td className="py-mx-md"><p className={cn("font-black text-sm text-text-primary", task.status === 'Concluída' && "line-through opacity-40")}>{task.title}</p></td>
                                        <td className="py-mx-md"><span className="mx-text-caption opacity-70">{leads.find(l => l.id === task.leadId)?.name || '-'}</span></td>
                                        <td className="py-mx-md text-center"><Badge variant="outline" className={cn("text-[8px] font-black", priorityConfig[task.priority].style)}>{task.priority}</Badge></td>
                                        <td className="pr-mx-lg py-mx-md text-right font-mono-numbers font-black text-xs text-text-tertiary">{format(new Date(task.dueDate), 'dd/MM/yyyy')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table></div>
                    )}
                </AnimatePresence>
            </div>

            <Dialog open={open} onOpenChange={v => { setOpen(v); if(!v) resetForm() }}>
                <DialogContent className="sm:max-w-[520px] rounded-mx-3xl p-0 border-none shadow-mx-elite overflow-hidden">
                    <div className="bg-brand-secondary p-mx-lg text-white relative overflow-hidden"><DialogTitle className="text-3xl font-black tracking-tighter uppercase mb-1 relative z-10">Ficha de Missão</DialogTitle><p className="mx-text-caption text-white/40">Planejamento Tático MX</p></div>
                    <div className="p-mx-lg space-y-mx-md bg-white">
                        <div className="space-y-1"><Label className="mx-text-caption ml-2">Objetivo</Label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="mx-input" placeholder="Ex: Resolver pendência Porsche" /></div>
                        <div className="space-y-1"><Label className="mx-text-caption ml-2">Briefing</Label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="mx-input !rounded-mx-xl h-24 resize-none" placeholder="Detalhes cruciais..." /></div>
                        <div className="grid grid-cols-2 gap-mx-sm">
                            <div className="space-y-1"><Label className="mx-text-caption ml-2">Impacto</Label><Select value={form.priority} onValueChange={v => setForm({...form, priority: v as any})}><SelectTrigger className="mx-input !h-14"><SelectValue /></SelectTrigger><SelectContent className="rounded-mx-lg"><SelectItem value="Alta" className="text-status-error font-black">ALTA</SelectItem><SelectItem value="Média" className="text-status-warning font-black">MÉDIA</SelectItem><SelectItem value="Baixa" className="text-status-success font-black">BAIXA</SelectItem></SelectContent></Select></div>
                            <div className="space-y-1"><Label className="mx-text-caption ml-2">Data</Label><input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="mx-input !h-14 font-mono-numbers" /></div>
                        </div>
                    </div>
                    <DialogFooter className="p-mx-md bg-mx-slate-50 border-t border-border-default flex gap-mx-sm"><button onClick={() => setOpen(false)} className="mx-button-primary !bg-white !text-text-tertiary border border-border-default flex-1">Abortar</button><button onClick={handleSave} className="mx-button-primary bg-brand-primary flex-[2]">Iniciar Missão</button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
