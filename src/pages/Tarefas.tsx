import { useState, useMemo, useCallback, useEffect } from 'react'
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
    LayoutGrid,
    List,
    RefreshCw,
    X,
    CalendarDays
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import useAppStore, { Task, TaskPriority, TaskStatus } from '@/stores/main'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { format, isBefore, startOfDay, parseISO } from 'date-fns'

// 1. priorityStyle moved outside component
const priorityConfig = {
    'Alta': { 
        style: 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm', 
        icon: <AlertTriangle className="w-3 h-3" />,
        accent: 'bg-rose-500'
    },
    'Média': { 
        style: 'bg-amber-50 text-amber-600 border-amber-100 shadow-sm', 
        icon: <Clock className="w-3 h-3" />,
        accent: 'bg-amber-500'
    },
    'Baixa': { 
        style: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm', 
        icon: <CheckCircle2 className="w-3 h-3" />,
        accent: 'bg-emerald-500'
    }
}

export default function Tarefas() {
    const { tasks, addTask, updateTask, deleteTask, leads, refetch: refetchTasks } = useAppStore()
    const [open, setOpen] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isRefetching, setIsRefetching] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Form State
    const [form, setForm] = useState({
        title: '',
        description: '',
        priority: 'Média' as TaskPriority,
        leadId: '',
        dueDate: new Date().toISOString().split('T')[0]
    })
    
    const [view, setView] = useState<'board' | 'list'>('board')

    const resetForm = useCallback(() => {
        setForm({
            title: '',
            description: '',
            priority: 'Média',
            leadId: '',
            dueDate: new Date().toISOString().split('T')[0]
        })
        setEditMode(false)
        setSelectedId(null)
    }, [])

    // 13. Memoized filtering to avoid O(3n) in render
    const taskGroups = useMemo(() => {
        const filtered = tasks.filter(t => 
            !searchTerm || 
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        return {
            'Pendente': filtered.filter(t => t.status === 'Pendente'),
            'Concluída': filtered.filter(t => t.status === 'Concluída'),
            'Atrasada': filtered.filter(t => t.status === 'Atrasada' || (t.status === 'Pendente' && isBefore(new Date(t.dueDate), startOfDay(new Date()))))
        }
    }, [tasks, searchTerm])

    const handleSave = async () => {
        if (!form.title) return
        
        try {
            if (editMode && selectedId) {
                await updateTask(selectedId, { ...form })
                toast.success('Missão reajustada com sucesso!')
            } else {
                await addTask({ ...form })
                toast.success('Nova missão iniciada!')
            }
            setOpen(false)
            resetForm()
        } catch (e) {
            toast.error('Erro ao salvar missão.')
        }
    }

    const handleEdit = (task: Task) => {
        // 4. Robust date parsing
        const dateStr = task.dueDate.includes('T') ? task.dueDate.split('T')[0] : task.dueDate
        setForm({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            leadId: task.leadId || '',
            dueDate: dateStr
        })
        setSelectedId(task.id)
        setEditMode(true)
        setOpen(true)
    }

    const handleDelete = (id: string) => {
        // 5. Deletion confirmation
        if (window.confirm("Deseja realmente abortar esta missão?")) {
            deleteTask(id)
            toast.info('Missão removida do cockpit.')
        }
    }

    const toggleStatus = (id: string, current: TaskStatus) => {
        const next = current === 'Pendente' ? 'Concluída' : 'Pendente'
        updateTask(id, { status: next })
        if (next === 'Concluída') {
            toast.success('Check-point atingido! ✨')
        }
    }

    const handleRefresh = async () => {
        setIsRefetching(true)
        await refetchTasks?.()
        setIsRefetching(false)
    }

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">
            {/* Header / 18. Header search integrated */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-gray-100 pb-10 relative z-10">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Produtividade Ativa</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none mb-4">Suas <span className="text-electric-blue">Missões</span></h1>
                    <p className="text-sm font-bold text-gray-500 max-w-2xl leading-relaxed">
                        Organização de fluxo tático para maximização de conversão e follow-up.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-electric-blue transition-colors" />
                        <input 
                            type="text"
                            placeholder="Buscar missão..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-full pl-11 pr-10 py-3 text-xs font-bold focus:outline-none focus:border-indigo-200 shadow-sm transition-all"
                        />
                        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500"><X size={14} /></button>}
                    </div>

                    <div className="bg-gray-100/50 p-1 rounded-2xl flex border border-gray-100 shadow-inner">
                        <button 
                            onClick={() => setView('board')} 
                            className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", view === 'board' ? "bg-white text-pure-black shadow-sm" : "text-gray-400 hover:text-pure-black")}
                        >
                            <LayoutGrid size={18} strokeWidth={2.5} />
                        </button>
                        <button 
                            onClick={() => setView('list')} 
                            className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", view === 'list' ? "bg-white text-pure-black shadow-sm" : "text-gray-400 hover:text-pure-black")}
                        >
                            <List size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                    
                    <button 
                        onClick={handleRefresh}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black active:scale-90 transition-all"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>

                    <button 
                        onClick={() => { resetForm(); setOpen(true) }} 
                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-pure-black text-white font-black hover:bg-black shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Nova Missão
                    </button>
                </div>
            </div>

            {/* 2. Min-h-screen equivalent padding to avoid flash */}
            <div className="flex-1 min-h-[500px]">
                <AnimatePresence mode="wait">
                    {view === 'board' ? (
                        <motion.div 
                            key="board" 
                            initial={{ opacity: 0, x: -20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: 20 }} 
                            className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full"
                        >
                            {(['Pendente', 'Concluída', 'Atrasada'] as const).map((status) => (
                                <div key={status} className="flex flex-col gap-6 h-full">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-2 h-2 rounded-full", status === 'Concluída' ? 'bg-emerald-500' : status === 'Atrasada' ? 'bg-rose-500' : 'bg-amber-500')}></div>
                                            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-400">{status}</h3>
                                            <span className="bg-gray-100 text-gray-500 font-mono-numbers text-[9px] px-2 py-0.5 rounded-full border border-gray-200">{taskGroups[status].length}</span>
                                        </div>
                                    </div>
                                    
                                    <ScrollArea className="flex-1 no-scrollbar pr-2">
                                        <div className="space-y-4 pb-10">
                                            {taskGroups[status].map((task, idx) => (
                                                <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                                                    <div 
                                                        onClick={() => handleEdit(task)}
                                                        className="bg-white border border-gray-100 rounded-[2.2rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden"
                                                    >
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div className={cn("px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border flex items-center gap-1.5", priorityConfig[task.priority].style)}>
                                                                {priorityConfig[task.priority].icon}
                                                                {task.priority}
                                                            </div>
                                                            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                                <button onClick={() => handleDelete(task.id)} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-400 hover:text-rose-600 border border-rose-100 flex items-center justify-center transition-colors">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="space-y-2 mb-6">
                                                            <h4 className={cn("font-black text-lg text-pure-black tracking-tight leading-tight", task.status === 'Concluída' && "line-through opacity-40")}>{task.title}</h4>
                                                            {task.description && <p className="text-xs font-bold text-gray-400 line-clamp-2 leading-relaxed">{task.description}</p>}
                                                        </div>

                                                        <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                                            <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                                <User size={12} className="text-electric-blue" strokeWidth={2.5} />
                                                                <span className="truncate max-w-[100px]">{leads.find(l => l.id === task.leadId)?.name || 'S/ Lead'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase">
                                                                <Calendar size={12} />
                                                                {format(new Date(task.dueDate), 'dd/MM')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                            <button 
                                                onClick={() => { resetForm(); setOpen(true) }}
                                                className="w-full border-2 border-dashed border-gray-100 rounded-[2.2rem] py-8 text-gray-300 font-black text-[9px] uppercase tracking-[0.4em] hover:border-indigo-200 hover:bg-indigo-50/20 hover:text-indigo-400 transition-all flex flex-col items-center gap-3"
                                            >
                                                <Plus size={20} /> Adicionar Item
                                            </button>
                                        </div>
                                    </ScrollArea>
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div key="list" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                            <div className="bg-white border border-gray-100 shadow-elevation rounded-[2.5rem] overflow-hidden">
                                <div className="overflow-x-auto no-scrollbar">
                                    <table className="w-full text-left min-w-[800px]">
                                        <thead>
                                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                                <th className="pl-10 py-5 font-black text-[9px] uppercase tracking-[0.2em] text-gray-400">Status</th>
                                                <th className="py-5 font-black text-[9px] uppercase tracking-[0.2em] text-gray-400">Missão</th>
                                                <th className="py-5 font-black text-[9px] uppercase tracking-[0.2em] text-gray-400">Alvo / Lead</th>
                                                <th className="py-5 font-black text-[9px] uppercase tracking-[0.2em] text-gray-400">Nível</th>
                                                <th className="pr-10 py-5 text-right font-black text-[9px] uppercase tracking-[0.2em] text-gray-400">Timeline</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 bg-white">
                                            {tasks.map((task) => (
                                                <tr key={task.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => handleEdit(task)}>
                                                    <td className="pl-10 py-6">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); toggleStatus(task.id, task.status) }}
                                                            className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 hover:text-emerald-500 hover:border-emerald-100 transition-all"
                                                        >
                                                            {task.status === 'Concluída' ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6" />}
                                                        </button>
                                                    </td>
                                                    <td className="py-6">
                                                        <div className="flex flex-col">
                                                            <span className={cn("font-black text-sm text-pure-black tracking-tight", task.status === 'Concluída' && "line-through opacity-40")}>{task.title}</span>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{task.description || 'Sem briefings'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-pure-black text-[10px] font-black">{leads.find(l => l.id === task.leadId)?.name?.charAt(0) || 'L'}</div>
                                                            <span className="text-xs font-black text-pure-black uppercase tracking-widest opacity-70">{leads.find(l => l.id === task.leadId)?.name || '-'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6">
                                                        <div className={cn("px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-fit", priorityConfig[task.priority].style)}>
                                                            {task.priority}
                                                        </div>
                                                    </td>
                                                    <td className="pr-10 py-6 text-right">
                                                        <div className="flex flex-col items-end gap-1.5">
                                                            <span className="font-mono-numbers font-black text-sm text-pure-black">{format(new Date(task.dueDate), 'dd/MM/yyyy')}</span>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id) }} className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) resetForm() }}>
                <DialogContent className="sm:max-w-[520px] rounded-[3rem] p-0 border-none shadow-3xl overflow-hidden">
                    <div className="bg-pure-black p-10 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-electric-blue/20 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                        {/* 10. Title fixed */}
                        <DialogTitle className="text-3xl font-black tracking-tighter mb-2 relative z-10">{editMode ? 'Ajustar Missão' : 'Nova Missão'}</DialogTitle>
                        <DialogDescription className="text-white/40 font-bold uppercase text-[10px] tracking-[0.3em] relative z-10">Configurações de Fluxo Tático</DialogDescription>
                    </div>
                    
                    <div className="p-10 space-y-8 bg-white">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Objetivo da Missão</Label>
                            <input 
                                value={form.title} 
                                onChange={(e) => setForm({ ...form, title: e.target.value })} 
                                className="premium-input !rounded-2xl h-14" 
                                placeholder="Ex: Resolver pendência documental Porsche" 
                            />
                        </div>
                        
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Briefing Operacional</Label>
                            <textarea 
                                value={form.description} 
                                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                                className="premium-input !rounded-3xl min-h-[100px] py-4" 
                                placeholder="Quais os detalhes cruciais para o fechamento?" 
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Impacto</Label>
                                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as TaskPriority })}>
                                    <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-bold shadow-inner focus:ring-2 focus:ring-indigo-500/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-gray-100 shadow-3xl">
                                        <SelectItem value="Alta" className="font-black text-rose-600">ALTA PRIORIDADE</SelectItem>
                                        <SelectItem value="Média" className="font-black text-amber-600">MÉDIA</SelectItem>
                                        <SelectItem value="Baixa" className="font-black text-emerald-600">BAIXA</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Prazo Final</Label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-focus-within:text-electric-blue transition-colors" />
                                    <input 
                                        type="date" 
                                        value={form.dueDate} 
                                        onChange={(e) => setForm({ ...form, dueDate: e.target.value })} 
                                        className="premium-input !pl-12 !rounded-2xl h-14 font-mono-numbers" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Lead Vinculado</Label>
                            <Select value={form.leadId} onValueChange={(v) => setForm({ ...form, leadId: v })}>
                                <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-bold shadow-inner">
                                    <SelectValue placeholder="Selecione o lead..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-gray-100 shadow-3xl">
                                    {leads.map((l) => (
                                        <SelectItem key={l.id} value={l.id} className="font-bold">{l.name} <span className="text-gray-300 mx-1">/</span> {l.car}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-gray-50/50 flex flex-col sm:flex-row gap-4 border-t border-gray-100">
                        <button onClick={() => setOpen(false)} className="flex-1 px-8 py-4 rounded-full border border-gray-200 font-black text-[10px] uppercase tracking-[0.3em] text-gray-400 hover:bg-white hover:text-pure-black transition-all">Abandonar</button>
                        <button 
                            onClick={handleSave} 
                            disabled={!form.title} 
                            className="flex-[2] px-10 py-4 rounded-full bg-electric-blue text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-30"
                        >
                            {editMode ? 'Salvar Alterações' : 'Iniciar Missão'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
