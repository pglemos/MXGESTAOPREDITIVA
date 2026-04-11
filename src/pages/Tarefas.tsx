import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { 
    Plus, Trash2, CheckSquare, Clock, AlertTriangle, Edit2, 
    Calendar, Search, Filter, MoreVertical, CheckCircle2, 
    Circle, User, ChevronRight, LayoutGrid, List, RefreshCw, X, 
    CalendarDays, Smartphone, History, ShieldCheck, Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format, isBefore, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import useAppStore, { Task, TaskPriority } from '@/stores/main'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'

const priorityConfig = {
    'Alta': { tone: 'error' as const, icon: <AlertTriangle size={12} strokeWidth={2.5} /> },
    'Média': { tone: 'warning' as const, icon: <Clock size={12} strokeWidth={2.5} /> },
    'Baixa': { tone: 'success' as const, icon: <CheckCircle2 size={12} strokeWidth={2.5} /> }
}

export default function Tarefas() {
    const { tasks, addTask, updateTask, deleteTask, leads, refetch: refetchTasks } = useAppStore()
    const [open, setOpen] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [view, setView] = useState<'board' | 'list'>('board')
    const [isRefetching, setIsRefetching] = useState(false)

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
            setOpen(false); resetForm(); toast.success('Missão firmada!')
        } catch (e) { toast.error('Erro no registro.') }
    }

    const handleDelete = (id: string) => {
        const taskToDelete = tasks.find(t => t.id === id);
        if (!taskToDelete) return;
        let wasCanceled = false;
        const cancelAction = () => { wasCanceled = true; undoRef.current = null; toast.success(`Missão preservada!`) };
        undoRef.current = cancelAction;
        toast.warning(`Removendo: ${taskToDelete.title}`, {
            description: "Ctrl+Z para desfazer.",
            action: { label: "DESFAZER", onClick: cancelAction },
            onAutoClose: () => {
                if (!wasCanceled) { deleteTask(id); if (undoRef.current === cancelAction) undoRef.current = null }
            },
            duration: 5000,
        });
    }

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / Tasks Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Gestão de <span className="text-brand-primary">Missões</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">FLUXO TÁTICO DE ALTA PERFORMANCE</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={() => {setIsRefetching(true); refetchTasks?.().then(()=>setIsRefetching(false))}} className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <div className="bg-white p-mx-tiny rounded-mx-full flex border border-border-default shadow-mx-sm">
                        <Button 
                            variant={view === 'board' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setView('board')} className="w-mx-10 h-mx-10 p-mx-0 rounded-mx-full"
                        >
                            <LayoutGrid size={18} />
                        </Button>
                        <Button 
                            variant={view === 'list' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setView('list')} className="w-mx-10 h-mx-10 p-mx-0 rounded-mx-full"
                        >
                            <List size={18} />
                        </Button>
                    </div>
                    <Button onClick={() => {resetForm(); setOpen(true)}} className="h-mx-xl px-8 shadow-mx-lg bg-brand-secondary">
                        <Plus size={18} className="mr-2" /> NOVA MISSÃO
                    </Button>
                </div>
            </header>

            <div className="flex-1 min-h-mx-section-lg pb-32" aria-live="polite">
                <AnimatePresence mode="wait">
                    {view === 'board' ? (
                        <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg h-full">
                            {(['Pendente', 'Concluída', 'Atrasada'] as const).map((status) => (
                                <div key={status} className="flex flex-col gap-mx-md">
                                    <header className="flex items-center justify-between px-4">
                                        <div className="flex items-center gap-mx-xs">
                                            <div className={cn("w-mx-xs h-mx-xs rounded-mx-full shadow-sm", status === 'Concluída' ? 'bg-status-success' : status === 'Atrasada' ? 'bg-status-error' : 'bg-status-warning')} />
                                            <Typography variant="caption" className="font-black uppercase tracking-mx-wide">{status}</Typography>
                                        </div>
                                        <Badge variant="outline" className="text-mx-tiny font-black h-mx-md px-3 bg-white border-border-default shadow-inner">{taskGroups[status].length}</Badge>
                                    </header>
                                    
                                    <div className="space-y-mx-md flex-1 overflow-y-auto no-scrollbar pr-2 pb-20">
                                        {taskGroups[status].map((task) => (
                                            <motion.div key={task.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                                <Card className="p-mx-lg group hover:shadow-mx-xl transition-all border-none shadow-mx-lg bg-white relative overflow-hidden flex flex-col justify-between h-auto cursor-pointer" onClick={() => setSelectedId(task.id)}>
                                                    <div>
                                                        <header className="flex justify-between items-start mb-6">
                                                            <Badge variant={priorityConfig[task.priority].tone as any} className="text-mx-micro font-black px-3 h-mx-5 border-none shadow-sm flex items-center gap-1.5 uppercase">
                                                                {priorityConfig[task.priority].icon} {task.priority}
                                                            </Badge>
                                                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(task.id) }} className="w-mx-lg h-mx-lg rounded-mx-lg text-text-tertiary hover:text-status-error opacity-0 group-hover:opacity-100 transition-all">
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </header>
                                                        <Typography variant="h3" className={cn("text-base uppercase tracking-tight mb-2 group-hover:text-brand-primary transition-colors", task.status === 'Concluída' && "line-through opacity-30")}>{task.title}</Typography>
                                                        <Typography variant="p" tone="muted" className="text-xs italic line-clamp-3 opacity-60 leading-relaxed mb-8">"{task.description || 'Sem briefing.'}"</Typography>
                                                    </div>
                                                    <footer className="pt-6 border-t border-border-default flex items-center justify-between mt-auto">
                                                        <div className="flex items-center gap-mx-xs">
                                                            <User size={12} className="text-brand-primary opacity-40" />
                                                            <Typography variant="caption" tone="muted" className="text-mx-micro font-black uppercase">{leads.find(l => l.id === task.leadId)?.name || 'Sem Alvo'}</Typography>
                                                        </div>
                                                        <Typography variant="mono" tone="muted" className="text-mx-tiny opacity-40">{format(new Date(task.dueDate), 'dd/MM')}</Typography>
                                                    </footer>
                                                </Card>
                                            </motion.div>
                                        ))}
                                        <Button variant="outline" onClick={() => {resetForm(); setOpen(true)}} className="w-full h-mx-3xl border-2 border-dashed border-border-default rounded-mx-3xl bg-transparent text-text-tertiary hover:border-brand-primary hover:text-brand-primary hover:bg-white transition-all flex flex-col gap-mx-xs">
                                            <Plus size={24} strokeWidth={3} />
                                            <Typography variant="caption" className="font-black">NOVA MISSÃO</Typography>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        <Card className="border-none shadow-mx-lg bg-white overflow-hidden">
                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-left min-w-mx-table-wide">
                                    <thead>
                                        <tr className="bg-surface-alt/50 border-b border-border-default text-mx-tiny font-black uppercase tracking-mx-wider text-text-tertiary">
                                            <th scope="col" className="pl-10 py-6 w-mx-2xl text-center">STATUS</th>
                                            <th scope="col" className="px-6 py-6">MISSÃO OPERACIONAL</th>
                                            <th scope="col" className="px-6 py-6 text-center">IMPACTO</th>
                                            <th scope="col" className="pr-10 py-6 text-right">DEADLINE</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-default">
                                        {tasks.map((task) => (
                                            <tr key={task.id} className="hover:bg-surface-alt/30 transition-colors h-mx-3xl group cursor-pointer">
                                                <td className="pl-10 text-center">
                                                    <div className={cn("w-mx-md h-mx-md rounded-mx-full mx-auto border-2 flex items-center justify-center transition-all", task.status === 'Concluída' ? "bg-status-success border-status-success text-white shadow-mx-sm" : "border-border-strong")}>
                                                        {task.status === 'Concluída' && <CheckCircle2 size={14} strokeWidth={3} />}
                                                    </div>
                                                </td>
                                                <td className="px-6">
                                                    <Typography variant="h3" className={cn("text-base uppercase tracking-tight group-hover:text-brand-primary transition-colors", task.status === 'Concluída' && "line-through opacity-30")}>{task.title}</Typography>
                                                    <Typography variant="caption" tone="muted" className="text-mx-micro font-black uppercase mt-1">Lead: {leads.find(l => l.id === task.leadId)?.name || '-'}</Typography>
                                                </td>
                                                <td className="px-6 text-center">
                                                    <Badge variant={priorityConfig[task.priority].tone as any} className="text-mx-micro font-black px-4 shadow-sm border-none uppercase">{task.priority}</Badge>
                                                </td>
                                                <td className="pr-10 text-right">
                                                    <Typography variant="mono" tone="muted" className="text-xs font-black">{format(new Date(task.dueDate), 'dd/MM/yyyy')}</Typography>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </AnimatePresence>
            </div>

            {/* Modal de Missão - Atomizado */}
            <AnimatePresence>
                {open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-mx-md bg-pure-black/60 backdrop-blur-xl">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-xl">
                            <Card className="border-none shadow-mx-xl bg-white overflow-hidden">
                                <header className="bg-brand-secondary p-mx-10 text-white relative overflow-hidden">
                                    <div className="absolute top-mx-0 right-mx-0 w-mx-sidebar-expanded h-mx-64 bg-white/5 rounded-mx-full blur-3xl -mr-32 -mt-32" />
                                    <Typography variant="h1" tone="white" className="text-3xl leading-none mb-2">Ficha de Missão</Typography>
                                    <Typography variant="caption" tone="white" className="opacity-40 uppercase tracking-widest">PLANEJAMENTO TÁTICO MX</Typography>
                                    <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="absolute top-mx-lg right-mx-lg text-white/40 hover:text-white hover:bg-white/10 rounded-mx-full w-mx-xl h-mx-xl transition-all">
                                        <X size={24} />
                                    </Button>
                                </header>

                                <div className="p-mx-10 space-y-mx-10">
                                    <div className="space-y-mx-sm">
                                        <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Objetivo Central</Typography>
                                        <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ex: Resolver pendência Porsche" className="!h-14 px-6 font-bold" />
                                    </div>
                                    <div className="space-y-mx-sm">
                                        <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Briefing / Detalhes</Typography>
                                        <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-surface-alt border border-border-default rounded-mx-2xl p-mx-md text-sm font-bold text-text-primary focus:border-brand-primary outline-none transition-all resize-none shadow-inner h-mx-4xl" placeholder="Detalhes cruciais para a execução..." />
                                    </div>
                                    <div className="grid grid-cols-2 gap-mx-lg">
                                        <div className="space-y-mx-sm">
                                            <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Nível de Impacto</Typography>
                                            <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})} className="w-full h-mx-14 bg-surface-alt border border-border-default rounded-mx-xl px-6 text-sm font-bold text-text-primary outline-none focus:border-brand-primary transition-all cursor-pointer shadow-inner">
                                                <option value="Alta">ALTA (CRÍTICO)</option>
                                                <option value="Média">MÉDIA (OPERACIONAL)</option>
                                                <option value="Baixa">BAIXA (ROTINA)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-mx-sm">
                                            <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Deadline</Typography>
                                            <Input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="!h-14 px-6 font-mono-numbers" />
                                        </div>
                                    </div>
                                </div>

                                <footer className="p-mx-lg bg-surface-alt border-t border-border-default flex gap-mx-sm mt-4">
                                    <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 h-mx-14 rounded-mx-full uppercase font-black tracking-widest text-mx-tiny">ABORTAR</Button>
                                    <Button onClick={handleSave} className="flex-[2] h-mx-14 rounded-mx-full shadow-mx-xl uppercase font-black tracking-widest text-mx-tiny">
                                        <Zap size={18} className="mr-2" /> INICIAR MISSÃO
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
