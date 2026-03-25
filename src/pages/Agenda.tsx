import { useState, useMemo } from 'react'
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Clock, MapPin, User, MoreVertical, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import useAppStore, { Task } from '@/stores/main'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { format, addDays, startOfWeek, isSameDay, addMonths, subMonths, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Agenda() {
    const { tasks, addTask, updateTask, leads, team } = useAppStore()
    const [viewDate, setViewDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newTask, setNewTask] = useState<Partial<Task>>({
        title: '',
        description: '',
        priority: 'Média',
        dueDate: new Date().toISOString(),
        leadId: ''
    })

    const weekDays = useMemo(() => {
        const start = startOfWeek(viewDate, { weekStartsOn: 0 })
        return Array.from({ length: 7 }, (_, i) => addDays(start, i))
    }, [viewDate])

    const dayTasks = useMemo(() => {
        return tasks.filter(t => isSameDay(new Date(t.dueDate), selectedDate))
    }, [tasks, selectedDate])

    const handleAddTask = () => {
        if (!newTask.title) return
        addTask({
            title: newTask.title as string,
            description: (newTask.description as string) || '',
            dueDate: newTask.dueDate || new Date().toISOString(),
            priority: newTask.priority as any,
            leadId: (newTask.leadId as string) || ''
        })
        setIsDialogOpen(false)
        setNewTask({ title: '', description: '', priority: 'Média', dueDate: new Date().toISOString(), leadId: '' })
        toast({ title: 'Agendamento Criado', description: 'O compromisso foi adicionado à sua agenda.' })
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-in px-4 md:px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="px-2 py-0.5 bg-electric-blue/10 text-electric-blue rounded text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> PLANEJAMENTO SEMANAL
                        </div>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-pure-black dark:text-off-white">
                        Minha <span className="text-electric-blue">Agenda</span>
                    </h1>
                    <p className="text-muted-foreground font-medium">Controle de test drives, reuniões e follow-ups estratégicos.</p>
                </div>

                <div className="flex w-full md:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-1 rounded-2xl">
                        <Button variant="ghost" size="icon" onClick={() => setViewDate(subMonths(viewDate, 1))} className="rounded-xl h-10 w-10 hover:bg-white dark:hover:bg-black">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="px-2 sm:px-4 font-bold text-xs sm:text-sm min-w-[120px] sm:min-w-[140px] text-center uppercase tracking-[0.2em] sm:tracking-widest">
                            {format(viewDate, 'MMMM yyyy', { locale: ptBR })}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => setViewDate(addMonths(viewDate, 1))} className="rounded-xl h-10 w-10 hover:bg-white dark:hover:bg-black">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto rounded-2xl h-12 px-6 sm:px-8 font-bold bg-pure-black text-white dark:bg-white dark:text-pure-black shadow-lg hover:shadow-electric-blue/20 transition-all hover:scale-[1.02]">
                        <Plus className="w-4 h-4 mr-2" /> Novo Agendamento
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
                <div className="grid grid-cols-7 gap-3 min-w-[680px]">
                {weekDays.map((day, i) => {
                    const isSelected = isSameDay(day, selectedDate)
                    const active = isToday(day)
                    const dayName = format(day, 'EEE', { locale: ptBR })
                    const dayNum = format(day, 'dd')
                    const hasTasks = tasks.some(t => isSameDay(new Date(t.dueDate), day))

                    return (
                        <button
                            key={i}
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                                "flex flex-col items-center p-3 sm:p-4 rounded-3xl transition-all border-none relative group",
                                isSelected ? "bg-electric-blue text-white shadow-xl shadow-electric-blue/20 scale-105" : "hyper-glass hover:bg-electric-blue/5"
                            )}
                        >
                            <span className={cn("text-[10px] font-bold uppercase tracking-widest mb-2", isSelected ? "text-white/80" : "text-muted-foreground")}>
                                {dayName}
                            </span>
                            <span className="text-2xl font-black font-mono-numbers">{dayNum}</span>
                            {active && !isSelected && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-electric-blue" />}
                            {hasTasks && <div className={cn("mt-2 w-1 h-1 rounded-full", isSelected ? "bg-white" : "bg-electric-blue")} />}
                        </button>
                    )
                })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <h3 className="text-lg sm:text-xl font-black tracking-tight">{format(selectedDate, "eeee, d 'de' MMMM", { locale: ptBR })}</h3>
                        <Badge variant="outline" className="font-bold border-none bg-black/5 dark:bg-white/5">{dayTasks.length} {dayTasks.length === 1 ? 'Compromisso' : 'Compromissos'}</Badge>
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {dayTasks.length > 0 ? (
                                dayTasks.map((task, idx) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                            <Card className="hyper-glass border-none rounded-[2rem] group hover:scale-[1.01] transition-all cursor-pointer">
                                            <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                                                <div className="flex flex-col items-center justify-center w-[60px] h-[60px] bg-black/5 dark:bg-white/5 rounded-2xl">
                                                    <span className="text-xs font-bold text-muted-foreground uppercase">{format(new Date(task.dueDate), 'HH:mm')}</span>
                                                    <Clock className="w-3 h-3 text-electric-blue mt-1" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-extrabold text-base sm:text-lg text-pure-black dark:text-off-white">{task.title}</h4>
                                                        <Badge className={cn(
                                                            "text-[10px] font-bold uppercase px-2 py-0 border-none",
                                                            task.priority === 'Alta' ? "bg-mars-orange/10 text-mars-orange" : "bg-electric-blue/10 text-electric-blue"
                                                        )}>
                                                            {task.priority}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm font-medium text-muted-foreground line-clamp-1">{task.description || 'Sem descrição adicional.'}</p>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-2">
                                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase">
                                                            <User className="w-3 h-3" /> {leads.find(l => l.id === task.leadId)?.name || 'Lead Não Vinculado'}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase">
                                                            <MapPin className="w-3 h-3" /> Showroom Principal
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-emerald-500/10 hover:text-emerald-500" onClick={() => updateTask(task.id, { status: 'Concluída' })}>
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="rounded-full"><MoreVertical className="w-5 h-5" /></Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-center hyper-glass rounded-[3rem] border-dashed border-2 border-black/5 dark:border-white/5">
                                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                                        <CalendarDays className="w-8 h-8 text-muted-foreground/30" />
                                    </div>
                                    <h4 className="font-bold text-lg">Nada agendado para hoje</h4>
                                    <p className="text-muted-foreground text-sm max-w-xs mt-2">Aproveite para organizar seu funil ou realizar novos follow-ups.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-mars-orange" /> Pendências Críticas
                    </h3>
                    <div className="space-y-4">
                        {tasks.filter(t => t.status === 'Atrasada' || (t.status === 'Pendente' && new Date(t.dueDate) < new Date())).map((task) => (
                            <div key={task.id} className="p-5 hyper-glass border-l-4 border-l-mars-orange rounded-2xl space-y-2">
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-bold text-mars-orange uppercase tracking-widest">Atrasado</span>
                                    <span className="text-[10px] font-bold text-muted-foreground">{format(new Date(task.dueDate), 'dd/MM')}</span>
                                </div>
                                <h5 className="font-bold text-sm">{task.title}</h5>
                                <p className="text-xs text-muted-foreground font-medium">Ligar o quanto antes para não perder o timing do lead.</p>
                            </div>
                        ))}
                        {tasks.filter(t => t.status === 'Atrasada').length === 0 && (
                            <div className="p-8 text-center hyper-glass rounded-3xl opacity-50">
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tudo em dia! ✨</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight">Novo Agendamento</DialogTitle>
                        <DialogDescription>Reserve um horário para test drive ou reunião.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label className="font-bold">Título do Compromisso</Label>
                            <Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="rounded-xl h-12" placeholder="Ex: Test Drive - Porsche 911" />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Detalhes / Observações</Label>
                            <Input value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="rounded-xl h-12" placeholder="Opcional" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold">Prioridade</Label>
                                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v as any })}>
                                    <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="Alta">Alta</SelectItem>
                                        <SelectItem value="Média">Média</SelectItem>
                                        <SelectItem value="Baixa">Baixa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Vincular Lead</Label>
                                <Select value={newTask.leadId} onValueChange={(v) => setNewTask({ ...newTask, leadId: v })}>
                                    <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Data e Hora</Label>
                            <Input type="datetime-local" className="rounded-xl h-12" onChange={(e) => setNewTask({ ...newTask, dueDate: new Date(e.target.value).toISOString() })} />
                        </div>
                    </div>
                    <DialogFooter className="gap-3 flex-col sm:flex-row">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 font-bold w-full sm:w-auto">Cancelar</Button>
                        <Button onClick={handleAddTask} disabled={!newTask.title} className="rounded-xl h-12 px-8 font-bold bg-electric-blue text-white shadow-lg shadow-electric-blue/20 w-full sm:w-auto">
                            Confirmar Agendamento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
