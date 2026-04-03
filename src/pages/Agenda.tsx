import { useState, useMemo, useCallback, useEffect } from 'react'
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Clock, MapPin, User, MoreVertical, CheckCircle2, AlertCircle, Search, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import useAppStore, { Task } from '@/stores/main'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { format, addDays, startOfWeek, isSameDay, addMonths, subMonths, isToday, isBefore, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Agenda() {
    const { tasks, addTask, updateTask, leads, refetch: refetchTasks } = useAppStore()
    const [viewDate, setViewDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isRefetching, setIsRefetching] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    
    const [newTask, setNewTask] = useState<Partial<Task>>({ title: '', description: '', priority: 'Média', dueDate: new Date().toISOString(), leadId: '' })

    const nextMonth = useCallback(() => setViewDate(prev => addMonths(prev, 1)), [])
    const prevMonth = useCallback(() => setViewDate(prev => subMonths(prev, 1)), [])

    const weekDays = useMemo(() => {
        const start = startOfWeek(viewDate, { weekStartsOn: 0 })
        return Array.from({ length: 7 }, (_, i) => addDays(start, i))
    }, [viewDate])

    const filteredDayTasks = useMemo(() => {
        return tasks.filter(t => {
            const dateMatch = isSameDay(new Date(t.dueDate), selectedDate)
            const searchMatch = !searchTerm || t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.description?.toLowerCase().includes(searchTerm.toLowerCase())
            return dateMatch && searchMatch
        })
    }, [tasks, selectedDate, searchTerm])

    const criticalTasks = useMemo(() => {
        return tasks.filter(t => t.status === 'Atrasada' || (t.status === 'Pendente' && isBefore(new Date(t.dueDate), startOfDay(new Date()))))
    }, [tasks])

    const handleAddTask = async () => {
        if (!newTask.title) return
        if (isBefore(new Date(newTask.dueDate!), startOfDay(new Date()))) {
            if (!window.confirm("Confirmar agendamento no passado?")) return
        }

        try {
            await addTask({ title: newTask.title as string, description: newTask.description || '', dueDate: newTask.dueDate || new Date().toISOString(), priority: newTask.priority as any, leadId: newTask.leadId || '' })
            setIsDialogOpen(false)
            setNewTask({ title: '', description: '', priority: 'Média', dueDate: new Date().toISOString(), leadId: '' })
            toast.success('Agendamento confirmado!')
        } catch (e) { toast.error('Erro ao salvar.') }
    }

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-mx-xs">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
                        <h1 className="mx-heading-hero">Agenda Operacional</h1>
                    </div>
                    <p className="mx-text-caption pl-mx-md opacity-60 uppercase tracking-widest">Planejamento Tático de Ciclo</p>
                </div>

                <div className="flex w-full flex-col gap-mx-sm shrink-0 sm:w-auto sm:flex-row sm:items-center">
                    <div className="flex items-center justify-between bg-white border border-border-default p-1.5 rounded-mx-lg shadow-mx-sm sm:w-auto">
                        <button onClick={prevMonth} className="w-10 h-10 rounded-mx-md flex items-center justify-center text-text-tertiary hover:bg-mx-slate-50 hover:text-text-primary transition-all"><ChevronLeft size={18} strokeWidth={2.5} /></button>
                        <span className="px-mx-md font-black text-[10px] uppercase tracking-[0.2em] text-text-primary min-w-[140px] text-center">{format(viewDate, 'MMMM yyyy', { locale: ptBR })}</span>
                        <button onClick={nextMonth} className="w-10 h-10 rounded-mx-md flex items-center justify-center text-text-tertiary hover:bg-mx-slate-50 hover:text-text-primary transition-all"><ChevronRight size={18} strokeWidth={2.5} /></button>
                    </div>
                    
                    <div className="flex items-center gap-mx-sm">
                        <button onClick={() => refetchTasks?.()} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary active:scale-90 transition-all"><RefreshCw size={20} className={cn(isRefetching && "animate-spin")} /></button>
                        <button onClick={() => setIsDialogOpen(true)} className="mx-button-primary bg-brand-secondary flex-1 sm:flex-none flex items-center justify-center gap-2">
                            <Plus size={18} /> Novo Agendamento
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Strip - 8pt Grid */}
            <div className="grid grid-cols-7 gap-mx-sm shrink-0">
                {weekDays.map((day, i) => {
                    const isSelected = isSameDay(day, selectedDate)
                    const active = isToday(day)
                    const hasTasks = tasks.some(t => isSameDay(new Date(t.dueDate), day))

                    return (
                        <button
                            key={i} onClick={() => setSelectedDate(day)}
                            className={cn(
                                "flex flex-col items-center p-mx-md rounded-mx-3xl transition-all border relative group",
                                isSelected ? "bg-brand-secondary text-white border-brand-secondary shadow-mx-xl scale-105 z-10" : "bg-white border-border-subtle hover:border-mx-indigo-100 hover:bg-brand-primary-surface/20"
                            )}
                        >
                            <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-mx-sm", isSelected ? "text-mx-indigo-400" : "text-text-tertiary")}>{format(day, 'EEE', { locale: ptBR })}</span>
                            <span className="text-3xl font-black tracking-tighter font-mono-numbers leading-none">{format(day, 'dd')}</span>
                            {active && !isSelected && <div className="absolute top-mx-sm right-mx-sm w-1.5 h-1.5 rounded-full bg-brand-primary shadow-mx-md" />}
                            {hasTasks && <div className={cn("mt-mx-sm w-1.5 h-1.5 rounded-full", isSelected ? "bg-mx-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" : "bg-brand-primary")} />}
                        </button>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg shrink-0 pb-mx-3xl">
                <div className="lg:col-span-8 space-y-mx-lg">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-mx-lg">
                        <div className="flex items-center gap-mx-sm"><div className="w-1.5 h-6 bg-brand-secondary rounded-full" /><h3 className="text-2xl font-black tracking-tight text-text-primary uppercase">{format(selectedDate, "eeee, d 'de' MMMM", { locale: ptBR })}</h3></div>
                        <div className="relative group w-full sm:w-64">
                            <Search className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary" size={14} />
                            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Filtrar eventos..." className="mx-input !h-10 !pl-10 text-[10px]" />
                        </div>
                    </div>

                    <div className="space-y-mx-sm">
                        <AnimatePresence mode="popLayout">
                            {filteredDayTasks.length > 0 ? (
                                filteredDayTasks.map((task, idx) => (
                                    <motion.div key={task.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                                        <div className="mx-card p-mx-lg flex flex-col sm:flex-row sm:items-center gap-mx-lg mx-card-hover group relative overflow-hidden">
                                            <div className="flex flex-col items-center justify-center w-20 h-20 bg-mx-slate-50 border border-border-default rounded-mx-lg shrink-0 shadow-inner group-hover:bg-brand-secondary transition-all">
                                                <span className="text-xs font-black text-text-tertiary uppercase tracking-widest group-hover:text-white transition-colors">{format(new Date(task.dueDate), 'HH:mm')}</span>
                                                <Clock className="w-4 h-4 text-brand-primary mt-1.5" strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-mx-xs relative z-10">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className={cn("font-black text-xl text-text-primary tracking-tight leading-none", task.status === 'Concluída' && "line-through opacity-40")}>{task.title}</h4>
                                                    <Badge className={cn("text-[8px] border-none px-2 h-5 rounded-md", task.priority === 'Alta' ? "bg-status-error-surface text-status-error" : task.priority === 'Média' ? "bg-status-warning-surface text-status-warning" : "bg-status-success-surface text-status-success")}>{task.priority}</Badge>
                                                </div>
                                                <p className="text-sm font-bold text-text-secondary line-clamp-2 leading-relaxed italic">"{task.description || 'Sem briefing'}"</p>
                                            </div>
                                            <div className="flex gap-mx-xs relative z-10 shrink-0">
                                                <button onClick={() => updateTask(task.id, { status: 'Concluída' })} className="w-12 h-12 rounded-mx-md bg-mx-slate-50 border border-border-default text-text-tertiary hover:text-status-success hover:bg-status-success-surface transition-all"><CheckCircle2 size={22} /></button>
                                                <button className="w-12 h-12 rounded-mx-md bg-mx-slate-50 border border-border-default text-text-tertiary hover:text-brand-secondary hover:bg-white shadow-mx-sm transition-all"><MoreVertical size={20} /></button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-mx-3xl flex flex-col items-center justify-center text-center bg-mx-slate-50/30 rounded-mx-3xl border-dashed border-2 border-border-default group">
                                    <CalendarDays size={40} className="text-mx-slate-200 mb-mx-lg group-hover:rotate-12 transition-transform duration-500" />
                                    <h4 className="text-2xl font-black text-text-primary tracking-tighter mb-2 uppercase">Ciclo Livre</h4>
                                    <p className="text-text-tertiary text-sm font-bold max-w-xs mx-auto mb-mx-lg opacity-80">Nenhuma missão tática confirmada para esta data.</p>
                                    <button onClick={() => setIsDialogOpen(true)} className="mx-button-primary">Novo Registro</button>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-mx-lg">
                    <div className="mx-card p-mx-lg group relative overflow-hidden">
                        <div className="flex items-center gap-mx-sm mb-mx-lg relative z-10">
                            <div className="w-12 h-12 rounded-mx-lg bg-status-error-surface text-status-error border border-mx-rose-100 flex items-center justify-center shadow-inner"><AlertTriangle size={24} /></div>
                            <h3 className="text-xl font-black tracking-tight text-text-primary uppercase">Críticos</h3>
                        </div>
                        <div className="space-y-mx-sm relative z-10">
                            {criticalTasks.slice(0, 3).map((task) => (
                                <div key={task.id} className="p-mx-md bg-mx-slate-50/50 border border-border-subtle rounded-mx-xl space-y-2 hover:bg-white hover:shadow-mx-lg transition-all cursor-pointer group/gap">
                                    <div className="flex justify-between items-center"><span className="text-[8px] font-black text-status-error uppercase tracking-widest bg-status-error-surface px-2 h-5 flex items-center rounded border border-mx-rose-100">Expirado</span><span className="text-[10px] font-black text-text-tertiary font-mono-numbers">{format(new Date(task.dueDate), 'dd/MM')}</span></div>
                                    <h5 className="font-black text-sm text-text-primary group-hover/gap:text-status-error transition-colors truncate uppercase">{task.title}</h5>
                                </div>
                            ))}
                            {criticalTasks.length === 0 && <div className="py-mx-lg text-center bg-status-success-surface/20 border border-dashed border-mx-emerald-100 rounded-mx-xl"><span className="mx-text-caption text-status-success uppercase">Health Check: 100% OK ✨</span></div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
