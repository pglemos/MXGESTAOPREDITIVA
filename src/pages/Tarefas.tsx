import { useState } from 'react'
import {
    Plus,
    Trash2,
    CheckSquare,
    Clock,
    AlertTriangle,
    Edit2,
    Calendar,
    Search,
    Filter,
    MoreVertical,
    CheckCircle2,
    Circle,
    User,
    ChevronRight,
    Tag,
    Briefcase
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import useAppStore, { Task, TaskPriority, TaskStatus } from '@/stores/main'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'

export default function Tarefas() {
    const { tasks, addTask, updateTask, deleteTask, leads } = useAppStore()
    const [open, setOpen] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)

    // Form State
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState<TaskPriority>('Média')
    const [leadId, setLeadId] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [view, setView] = useState<'board' | 'list'>('board')

    const resetForm = () => {
        setTitle(''); setDescription(''); setPriority('Média'); setLeadId(''); setDueDate('')
        setEditMode(false); setSelectedId(null)
    }

    const handleSave = () => {
        if (!title) return
        if (editMode && selectedId) {
            updateTask(selectedId, { title, description, priority, leadId, dueDate: dueDate || new Date().toISOString() })
            toast({ title: 'Tarefa Atualizada' })
        } else {
            addTask({ title, description, priority, leadId, dueDate: dueDate || new Date().toISOString() })
            toast({ title: 'Tarefa Criada' })
        }
        setOpen(false)
        resetForm()
    }

    const handleEdit = (task: Task) => {
        setTitle(task.title); setDescription(task.description || ''); setPriority(task.priority); setLeadId(task.leadId || ''); setDueDate(task.dueDate.split('T')[0])
        setSelectedId(task.id); setEditMode(true); setOpen(true)
    }

    const toggleStatus = (id: string, current: TaskStatus) => {
        const next = current === 'Pendente' ? 'Concluída' : 'Pendente'
        updateTask(id, { status: next })
        toast({ title: next === 'Concluída' ? '✅ Meta Atingida!' : 'Tarefa reaberta para ação' })
    }

    const columns: { title: string, status: TaskStatus, color: string }[] = [
        { title: 'Pendentes', status: 'Pendente', color: 'bg-amber-500' },
        { title: 'Concluídas', status: 'Concluída', color: 'bg-emerald-500' },
        { title: 'Críticas', status: 'Atrasada', color: 'bg-mars-orange' },
    ]

    const priorityStyle = (p: TaskPriority) => {
        switch (p) {
            case 'Alta': return 'bg-mars-orange/10 text-mars-orange border-mars-orange/20'
            case 'Média': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            case 'Baixa': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            default: return 'bg-black/5'
        }
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 flex flex-col h-full px-4 md:px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-mars-orange animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">PRODUCTIVITY ENGINE</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-pure-black dark:text-off-white">Suas <span className="text-electric-blue">Missões</span></h1>
                    <p className="text-muted-foreground font-medium mt-1">Organize seu fluxo de trabalho e maximize suas conversões.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="bg-black/5 dark:bg-white/5 p-1 rounded-2xl flex">
                        <Button variant="ghost" size="icon" onClick={() => setView('board')} className={cn("rounded-xl h-10 w-10", view === 'board' && "bg-white dark:bg-black shadow-sm")}>
                            <Tag className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setView('list')} className={cn("rounded-xl h-10 w-10", view === 'list' && "bg-white dark:bg-black shadow-sm")}>
                            <Briefcase className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button onClick={() => { resetForm(); setOpen(true) }} className="rounded-2xl px-8 h-12 font-bold bg-pure-black text-white dark:bg-white dark:text-pure-black shadow-xl hover:scale-[1.02] transition-all w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" /> Nova Missão
                    </Button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {view === 'board' ? (
                    <motion.div key="board" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
                        {columns.map((col) => (
                            <div key={col.status} className="flex flex-col gap-6">
                                <div className="flex items-center justify-between px-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-2 h-2 rounded-full", col.color)}></div>
                                        <h3 className="font-black text-xs uppercase tracking-widest text-pure-black dark:text-off-white">{col.title}</h3>
                                        <Badge variant="secondary" className="font-mono-numbers bg-black/5 dark:bg-white/10 text-[10px] px-2">{tasks.filter(t => t.status === col.status).length}</Badge>
                                    </div>
                                </div>
                                <ScrollArea className="flex-1">
                                    <div className="space-y-4 pr-4">
                                        {tasks.filter(t => t.status === col.status).map((task, idx) => (
                                            <motion.div key={task.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}>
                                                <Card className="border-none bg-white dark:bg-[#111] shadow-xl rounded-[2rem] group hover:shadow-electric-blue/10 transition-all cursor-pointer overflow-hidden p-0">
                                                    <CardContent className="p-6 space-y-4">
                                                        <div className="flex justify-between items-start">
                                                            <Badge variant="outline" className={cn("text-[9px] font-black uppercase px-2 py-0 border-none rounded-lg", priorityStyle(task.priority))}>
                                                                {task.priority}
                                                            </Badge>
                                                            <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(task)} className="h-7 w-7 rounded-lg hover:bg-electric-blue/10 text-electric-blue"><Edit2 className="w-3.5 h-3.5" /></Button>
                                                                <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)} className="h-7 w-7 rounded-lg hover:bg-mars-orange/10 text-mars-orange"><Trash2 className="w-3.5 h-3.5" /></Button>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1" onClick={() => toggleStatus(task.id, task.status)}>
                                                            <h4 className={cn("font-black text-base text-pure-black dark:text-off-white leading-tight", task.status === 'Concluída' && "line-through opacity-40")}>{task.title}</h4>
                                                            {task.description && <p className="text-[11px] font-bold text-muted-foreground line-clamp-2">{task.description}</p>}
                                                        </div>
                                                        <div className="pt-4 flex items-center justify-between border-t border-black/5 dark:border-white/5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center"><User className="w-3.5 h-3.5 text-muted-foreground" /></div>
                                                                <span className="text-[10px] font-black text-muted-foreground uppercase truncate max-w-[80px]">
                                                                    {leads.find(l => l.id === task.leadId)?.name || 'S/ Lead'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase">
                                                                <Calendar className="w-3 h-3 text-electric-blue" />
                                                                {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                        <Button onClick={() => { resetForm(); setOpen(true) }} variant="ghost" className="w-full border-2 border-dashed border-black/5 dark:border-white/5 rounded-[2rem] h-16 text-muted-foreground font-black text-xs hover:border-electric-blue/30 hover:bg-electric-blue/5 transition-all">
                                            <Plus className="w-4 h-4 mr-2" /> NOVA MISSÃO
                                        </Button>
                                    </div>
                                </ScrollArea>
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div key="list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <Card className="border-none bg-white dark:bg-[#111] shadow-2xl rounded-[3rem] overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-black/5 dark:bg-white/5">
                                            <th className="p-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground first:pl-10">Status</th>
                                            <th className="p-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground">O que fazer</th>
                                            <th className="p-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Responsável</th>
                                            <th className="p-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Prioridade</th>
                                            <th className="p-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-right last:pr-10">Prazo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                        {tasks.map((task) => (
                                            <tr key={task.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => handleEdit(task)}>
                                                <td className="p-6 first:pl-10">
                                                    <button onClick={(e) => { e.stopPropagation(); toggleStatus(task.id, task.status) }}>
                                                        {task.status === 'Concluída' ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-muted-foreground/30 hover:text-electric-blue transition-colors" />}
                                                    </button>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col">
                                                        <span className={cn("font-black text-base text-pure-black dark:text-off-white", task.status === 'Concluída' && "line-through opacity-40")}>{task.title}</span>
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{task.description || 'Sem detalhes'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 font-black text-xs text-muted-foreground uppercase">{leads.find(l => l.id === task.leadId)?.name || '-'}</td>
                                                <td className="p-6">
                                                    <Badge className={cn("border-none font-black uppercase text-[9px] px-2.5 py-0.5 rounded-lg", priorityStyle(task.priority))}>{task.priority}</Badge>
                                                </td>
                                                <td className="p-6 text-right last:pr-10">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-mono-numbers font-black text-sm">{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-mars-orange" onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }}><Trash2 className="w-3.5 h-3.5" /></Button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[480px] rounded-[3rem] border-none shadow-3xl p-0 overflow-hidden">
                    <div className="bg-electric-blue p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <DialogTitle className="font-black text-3xl tracking-tighter">{editMode ? 'Ajustar Missão' : 'Nova Missão'}</DialogTitle>
                        <DialogDescription className="text-white/70 font-bold">Defina as coordenadas para o sucesso desta tarefa.</DialogDescription>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="space-y-2">
                            <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Objetivo Principal</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Resolver pendência documental Porsche" className="rounded-2xl h-14 bg-black/5 dark:bg-white/5 border-none font-black text-lg focus-visible:ring-electric-blue" />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Briefing da Missão</Label>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Quais os detalhes cruciais?" rows={3} className="rounded-2xl bg-black/5 dark:bg-white/5 border-none font-bold text-sm focus-visible:ring-electric-blue" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Nivel de Impacto</Label>
                                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                                    <SelectTrigger className="rounded-2xl h-12 bg-black/5 dark:bg-white/5 border-none font-black">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                        <SelectItem value="Alta" className="font-black text-mars-orange">ALTA PRIORIDADE</SelectItem>
                                        <SelectItem value="Média" className="font-black text-amber-500">MÉDIA</SelectItem>
                                        <SelectItem value="Baixa" className="font-black text-emerald-500">BAIXA</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Deadline</Label>
                                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-2xl h-12 bg-black/5 dark:bg-white/5 border-none font-black focus-visible:ring-electric-blue appearance-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Lead Alvo</Label>
                            <Select value={leadId} onValueChange={setLeadId}>
                                <SelectTrigger className="rounded-2xl h-12 bg-black/5 dark:bg-white/5 border-none font-black">
                                    <SelectValue placeholder="Selecione o lead..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl">
                                    {leads.map((l) => (
                                        <SelectItem key={l.id} value={l.id} className="font-bold">{l.name} <span className="text-muted-foreground mx-1">•</span> {l.car}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="p-6 sm:p-10 bg-black/5 dark:bg-white/5 flex flex-col sm:flex-row gap-4">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-2xl font-black px-8 h-12 uppercase tracking-widest text-[10px] w-full sm:w-auto">Abandonar</Button>
                        <Button onClick={handleSave} disabled={!title} className="rounded-2xl font-black bg-electric-blue text-white px-10 h-12 shadow-xl shadow-electric-blue/20 hover:scale-[1.05] transition-all uppercase tracking-widest text-[10px] w-full sm:w-auto">{editMode ? 'Salvar Alterações' : 'Iniciar Missão'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
