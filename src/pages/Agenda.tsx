import { useState, useMemo, useCallback, useEffect } from 'react'
import { 
    CalendarDays, Plus, ChevronLeft, ChevronRight, Clock, MapPin, 
    User, MoreVertical, CheckCircle2, AlertTriangle, Search, 
    RefreshCw, X, History, Target, Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import useAppStore, { Task } from '@/stores/main'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { format, addDays, startOfWeek, isSameDay, addMonths, subMonths, isToday, isBefore, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'

export default function Agenda() {
    const { tasks, addTask, updateTask, leads, refetch: refetchTasks } = useAppStore()
    const [viewDate, setViewDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isRefetching, setIsRefetching] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    
    const [newTask, setNewTask] = useState<Partial<Task>>({ 
        title: '', description: '', priority: 'Média', 
        dueDate: new Date().toISOString(), leadId: '' 
    })

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
        try {
            await addTask({ 
                title: newTask.title as string, 
                description: newTask.description || '', 
                dueDate: newTask.dueDate || new Date().toISOString(), 
                priority: newTask.priority as any, 
                leadId: newTask.leadId || '' 
            })
            setIsDialogOpen(false)
            setNewTask({ title: '', description: '', priority: 'Média', dueDate: new Date().toISOString(), leadId: '' })
            toast.success('Agendamento confirmado!')
        } catch (e) { toast.error('Erro ao salvar.') }
    }

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-4 md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Agenda <Typography as="span" className="text-brand-primary">Operacional</Typography></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">PLANEJAMENTO TÁTICO DE CICLO</Typography>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <div className="flex items-center bg-white border border-border-default p-mx-tiny rounded-mx-full shadow-mx-sm">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="w-mx-10 h-mx-10 rounded-mx-full hover:bg-surface-alt transition-all">
                            <ChevronLeft size={18} strokeWidth={2} />
                        </Button>
                        <div className="px-6 min-w-mx-xl text-center">
                            <Typography variant="caption" tone="default" className="font-black">
                                {format(viewDate, 'MMMM yyyy', { locale: ptBR })}
                            </Typography>
                        </div>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="w-mx-10 h-mx-10 rounded-mx-full hover:bg-surface-alt transition-all">
                            <ChevronRight size={18} strokeWidth={2} />
                        </Button>
                    </div>
                    
                    <div className="flex items-center gap-mx-sm w-full sm:w-auto">
                        <Button variant="outline" size="icon" onClick={() => {setIsRefetching(true); refetchTasks?.().then(()=>setIsRefetching(false))}} className="w-mx-xl h-mx-xl rounded-mx-xl shadow-mx-sm bg-white border-border-strong">
                            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                        </Button>
                        <Button onClick={() => setIsDialogOpen(true)} className="h-mx-xl px-8 shadow-mx-lg flex-1 sm:flex-none uppercase font-black tracking-widest text-xs">
                            <Plus size={18} className="mr-2" /> NOVO REGISTRO
                        </Button>
                    </div>
                </div>
            </header>

            <div className="overflow-x-auto no-scrollbar pb-4 -mx-mx-lg px-mx-lg">
                <div className="grid grid-cols-1 sm:grid-cols- gap-mx-sm min-w-[600px] sm:min-w-0 shrink-0">
                    {weekDays.map((day, i) => {
                        const isSelected = isSameDay(day, selectedDate)
                        const active = isToday(day)
                        const hasTasks = tasks.some(t => isSameDay(new Date(t.dueDate), day))

                        return (
                            <button
                                key={i} onClick={() => setSelectedDate(day)}
                                className={cn(
                                    "flex flex-col items-center p-4 md:p-mx-md rounded-mx-3xl transition-all border relative group",
                                    isSelected ? "bg-brand-secondary text-white border-brand-secondary shadow-mx-xl scale-105 z-10" : "bg-white border-border-subtle hover:border-brand-primary/30 hover:bg-mx-indigo-50/30"
                                )}
                            >
                                <Typography variant="caption" tone={isSelected ? 'white' : 'muted'} className="mb-2 opacity-60 uppercase font-black text-[10px]">{format(day, 'EEE', { locale: ptBR })}</Typography>
                                <Typography variant="h1" tone={isSelected ? 'white' : 'default'} className="text-3xl tabular-nums leading-none font-black">{format(day, 'dd')}</Typography>
                                {active && !isSelected && <div className="absolute top-mx-sm right-mx-sm w-mx-xs h-mx-xs rounded-mx-full bg-brand-primary shadow-mx-md" />}
                                {hasTasks && <div className={cn("mt-3 w-1.5 h-1.5 rounded-mx-full", isSelected ? "bg-mx-indigo-400 shadow-mx-sm" : "bg-brand-primary")} />}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0 pb-32">
                <section className="lg:col-span-8 space-y-mx-lg">
                    <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-mx-lg mb-4">
                        <div className="flex items-center gap-mx-sm">
                            <div className="w-1.5 h-mx-lg bg-brand-secondary rounded-mx-full" />
                            <Typography variant="h2" className="text-2xl uppercase tracking-tighter">{format(selectedDate, "eeee, d 'de' MMMM", { locale: ptBR })}</Typography>
                        </div>
                        <div className="relative group w-full sm:w-72">
                            <Search className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" size={16} />
                            <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="FILTRAR EVENTOS..." className="!pl-11 !h-12 !text-xs uppercase tracking-widest" />
                        </div>
                    </header>

                    <div className="space-y-mx-md" aria-live="polite">
                        <AnimatePresence mode="popLayout">
                            {filteredDayTasks.length > 0 ? (
                                filteredDayTasks.map((task, idx) => (
                                    <motion.div key={task.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                                        <Card className="p-4 md:p-mx-lg flex flex-col sm:flex-row sm:items-center gap-mx-lg group relative overflow-hidden border-none shadow-mx-lg hover:shadow-mx-xl transition-all bg-white">
                                            <div className="flex flex-col items-center justify-center w-mx-20 h-mx-header bg-surface-alt border border-border-default rounded-mx-2xl shrink-0 shadow-inner group-hover:bg-brand-secondary group-hover:border-brand-secondary transition-all">
                                                <Typography variant="mono" className="text-xs font-black group-hover:text-white transition-colors">{format(new Date(task.dueDate), 'HH:mm')}</Typography>
                                                <Clock className="w-mx-sm h-mx-sm text-brand-primary mt-2 group-hover:text-white transition-colors" strokeWidth={2} />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-mx-xs relative z-10">
                                                <div className="flex flex-wrap items-center gap-mx-xs">
                                                    <Typography variant="h3" className={cn("text-xl leading-none uppercase tracking-tight", task.status === 'Concluída' && "line-through opacity-30")}>{task.title}</Typography>
                                                    <Badge variant={task.priority === 'Alta' ? 'danger' : task.priority === 'Média' ? 'warning' : 'success'} className="px-3 py-0.5 rounded-mx-lg text-xs uppercase font-black shadow-sm">
                                                        {task.priority}
                                                    </Badge>
                                                </div>
                                                <Typography variant="p" tone="muted" className="text-sm line-clamp-2 leading-relaxed italic uppercase tracking-tight opacity-60">
                                                    "{task.description || 'Sem briefing detalhado para esta missão.'}"
                                                </Typography>
                                            </div>
                                            <div className="flex gap-mx-xs relative z-10 shrink-0">
                                                <Button variant="outline" size="icon" onClick={() => updateTask(task.id, { status: 'Concluída' })} className="w-mx-xl h-mx-xl rounded-mx-xl text-text-tertiary hover:text-status-success hover:bg-status-success-surface transition-all shadow-sm bg-white border-border-strong">
                                                    <CheckCircle2 size={24} />
                                                </Button>
                                                <Button variant="outline" size="icon" className="w-mx-xl h-mx-xl rounded-mx-xl text-text-tertiary shadow-sm bg-white border-border-strong">
                                                    <MoreVertical size={20} />
                                                </Button>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-mx-3xl border-dashed border-2 border-border-default group shadow-inner">
                                    <CalendarDays size={48} className="text-text-tertiary mb-8 group-hover:rotate-12 transition-transform duration-500 opacity-20" />
                                    <Typography variant="h2" className="mb-2 uppercase tracking-tighter">Ciclo Livre</Typography>
                                    <Typography variant="caption" tone="muted" className="max-w-xs mx-auto mb-10 uppercase tracking-widest font-black opacity-40">Nenhuma missão tática confirmada para esta data.</Typography>
                                    <Button onClick={() => setIsDialogOpen(true)} className="rounded-mx-full px-10 h-mx-14 shadow-mx-xl font-black uppercase text-xs tracking-widest bg-brand-primary">Novo Registro</Button>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                <aside className="lg:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-mx-10 border-none shadow-mx-lg bg-white relative overflow-hidden group">
                        <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-status-error-surface rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" />
                        <header className="flex items-center gap-mx-sm mb-10 relative z-10">
                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-status-error-surface text-status-error border border-mx-rose-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                <AlertTriangle size={28} strokeWidth={2} />
                            </div>
                            <Typography variant="h3" className="uppercase tracking-tight">Alertas Críticos</Typography>
                        </header>
                        
                        <div className="space-y-mx-sm relative z-10">
                            {criticalTasks.length > 0 ? criticalTasks.slice(0, 4).map((task) => (
                                <Card key={task.id} className="p-4 md:p-mx-md bg-surface-alt/50 border border-border-subtle group/item hover:bg-white hover:shadow-mx-lg transition-all cursor-pointer">
                                    <header className="flex justify-between items-center mb-3">
                                        <Badge variant="danger" className="text-xs font-black px-3 py-1 uppercase shadow-sm">EXPIRADO</Badge>
                                        <Typography variant="mono" className="text-xs font-black opacity-40 uppercase">{format(new Date(task.dueDate), 'dd/MM')}</Typography>
                                    </header>
                                    <Typography variant="h3" className="text-sm uppercase tracking-tight group-hover/item:text-status-error transition-colors truncate">{task.title}</Typography>
                                </Card>
                            )) : (
                                <Card className="py-10 text-center bg-status-success-surface/20 border-dashed border border-mx-emerald-100 shadow-inner">
                                    <CheckCircle2 size={32} className="mx-auto mb-4 text-status-success opacity-40" />
                                    <Typography variant="caption" tone="success" className="font-black tracking-mx-wide uppercase">100% Sincronizada ✨</Typography>
                                </Card>
                            )}
                        </div>
                    </Card>

                    <Card className="bg-mx-black p-mx-10 rounded-mx-2xl text-white shadow-mx-xl text-center border-none relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-transparent opacity-50" />
                        <Typography variant="h3" tone="white" className="mb-2 uppercase tracking-tighter">Saúde Temporal</Typography>
                        <Typography variant="caption" tone="white" className="opacity-60 leading-relaxed uppercase tracking-widest italic font-black block mt-4">
                            "A agenda é o esqueleto da alta performance."
                        </Typography>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
