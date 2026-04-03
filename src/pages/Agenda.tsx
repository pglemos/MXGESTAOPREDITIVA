import { useState, useMemo, useCallback, useEffect } from 'react'
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Clock, MapPin, User, MoreVertical, CheckCircle2, AlertCircle, Search, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import useAppStore, { Task } from '@/stores/main'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { format, addDays, startOfWeek, isSameDay, addMonths, subMonths, isToday, isBefore, startOfDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Agenda() {
    const { tasks, addTask, updateTask, leads, refetch: refetchTasks } = useAppStore()
    const [viewDate, setViewDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isRefetching, setIsRefetching] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    
    const [newTask, setNewTask] = useState<Partial<Task>>({
        title: '',
        description: '',
        priority: 'Média',
        dueDate: new Date().toISOString(),
        leadId: ''
    })

    // 15. Fix memory leak: memoize navigation handlers
    const nextMonth = useCallback(() => setViewDate(prev => addMonths(prev, 1)), [])
    const prevMonth = useCallback(() => setViewDate(prev => subMonths(prev, 1)), [])

    // 7. Efficiency: Logic for fetching would be in hook, but we filter here for UI
    const weekDays = useMemo(() => {
        const start = startOfWeek(viewDate, { weekStartsOn: 0 })
        return Array.from({ length: 7 }, (_, i) => addDays(start, i))
    }, [viewDate])

    // 14. & 17. Filter logic with Search and Date
    const filteredDayTasks = useMemo(() => {
        return tasks.filter(t => {
            const dateMatch = isSameDay(new Date(t.dueDate), selectedDate)
            const searchMatch = !searchTerm || 
                t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.description?.toLowerCase().includes(searchTerm.toLowerCase())
            return dateMatch && searchMatch
        })
    }, [tasks, selectedDate, searchTerm])

    const criticalTasks = useMemo(() => {
        return tasks.filter(t => t.status === 'Atrasada' || (t.status === 'Pendente' && isBefore(new Date(t.dueDate), startOfDay(new Date()))))
    }, [tasks])

    const handleAddTask = async () => {
        if (!newTask.title) return
        
        // 4. Validation for past dates
        if (isBefore(new Date(newTask.dueDate!), startOfDay(new Date()))) {
            const confirm = window.confirm("Este compromisso está sendo agendado para o passado. Deseja continuar?")
            if (!confirm) return
        }

        try {
            await addTask({
                title: newTask.title as string,
                description: (newTask.description as string) || '',
                dueDate: newTask.dueDate || new Date().toISOString(),
                priority: newTask.priority as any,
                leadId: (newTask.leadId as string) || ''
            })
            setIsDialogOpen(false)
            setNewTask({ title: '', description: '', priority: 'Média', dueDate: new Date().toISOString(), leadId: '' })
            toast.success('Agendamento confirmado!')
            
            // 18. WhatsApp reminder prompt
            toast('Deseja enviar lembrete via WhatsApp?', {
                action: {
                    label: 'Enviar',
                    onClick: () => {
                        const lead = leads.find(l => l.id === newTask.leadId)
                        if (lead) {
                            const phone = lead.phone.replace(/\D/g, '')
                            const msg = encodeURIComponent(`Olá ${lead.name}, confirmando nosso agendamento para ${format(new Date(newTask.dueDate!), "dd/MM 'às' HH:mm")}.`)
                            window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank')
                        }
                    }
                }
            })
        } catch (e) {
            toast.error('Erro ao salvar agendamento.')
        }
    }

    const handleRefresh = async () => {
        setIsRefetching(true)
        await refetchTasks?.()
        setIsRefetching(false)
    }

    return (
        <div className="w-full h-full flex flex-col gap-8 md:gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Minha Agenda
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Planejamento Operacional</p>
                    </div>
                </div>

                <div className="flex w-full flex-col gap-4 shrink-0 sm:w-auto sm:flex-row sm:items-center">
                    <div className="flex items-center justify-between bg-white border border-gray-100 p-1.5 rounded-2xl shadow-sm sm:w-auto">
                        <button onClick={prevMonth} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-pure-black transition-all">
                            <ChevronLeft size={18} strokeWidth={2.5} />
                        </button>
                        <span className="px-6 font-black text-[10px] uppercase tracking-[0.2em] text-pure-black min-w-[140px] text-center">
                            {format(viewDate, 'MMMM yyyy', { locale: ptBR })}
                        </span>
                        <button onClick={nextMonth} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-pure-black transition-all">
                            <ChevronRight size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleRefresh}
                            className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black transition-all active:scale-90"
                        >
                            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                        </button>
                        {/* 1. aria-haspopup added */}
                        <button 
                            aria-haspopup="dialog"
                            onClick={() => setIsDialogOpen(true)} 
                            className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-pure-black text-white font-black hover:bg-black hover:shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Novo Agendamento
                        </button>
                    </div>
                </div>
            </div>

            {/* 9. Empty days clickable via grid container or individual button */}
            <div className="grid grid-cols-7 gap-4 shrink-0">
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
                                "flex flex-col items-center p-5 rounded-[2rem] transition-all border relative group",
                                isSelected 
                                    ? "bg-pure-black text-white border-pure-black shadow-3xl scale-105 z-10" 
                                    : "bg-white border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/20"
                            )}
                        >
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-[0.2em] mb-3", 
                                isSelected ? "text-indigo-400" : "text-gray-400"
                            )}>
                                {dayName}
                            </span>
                            <span className="text-3xl font-black tracking-tighter font-mono-numbers leading-none">{dayNum}</span>
                            {active && !isSelected && <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-electric-blue shadow-[0_0_8px_rgba(79,70,229,0.5)]" />}
                            {hasTasks && <div className={cn("mt-3 w-1.5 h-1.5 rounded-full", isSelected ? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" : "bg-electric-blue")} />}
                        </button>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 shrink-0 pb-20">
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-pure-black rounded-full" />
                            <h3 className="text-2xl font-black tracking-tight text-pure-black">
                                {format(selectedDate, "eeee, d 'de' MMMM", { locale: ptBR })}
                            </h3>
                        </div>
                        
                        {/* 17. Inline search */}
                        <div className="relative group w-full sm:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-electric-blue transition-colors" size={14} />
                            <input 
                                type="text"
                                placeholder="Filtrar nesta data..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 rounded-full border border-gray-100 bg-white text-xs font-bold focus:outline-none focus:border-indigo-200 transition-all shadow-sm"
                            />
                            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500"><X size={14} /></button>}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {filteredDayTasks.length > 0 ? (
                                filteredDayTasks.map((task, idx) => (
                                    <motion.div
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-48 h-48 bg-gray-50 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none group-hover:bg-indigo-50/50 transition-colors" />
                                            
                                            <div className="flex flex-col items-center justify-center w-20 h-20 bg-gray-50 border border-gray-100 rounded-[1.5rem] shrink-0 shadow-inner group-hover:bg-pure-black transition-all">
                                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">{format(new Date(task.dueDate), 'HH:mm')}</span>
                                                <Clock className="w-4 h-4 text-electric-blue mt-1.5" strokeWidth={2.5} />
                                            </div>
                                            
                                            <div className="flex-1 min-w-0 space-y-3 relative z-10">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h4 className={cn(
                                                        "font-black text-xl text-pure-black tracking-tight leading-none", 
                                                        task.status === 'Concluída' && "line-through opacity-40"
                                                    )}>
                                                        {task.title}
                                                    </h4>
                                                    {/* 16. Unified Status Colors */}
                                                    <Badge className={cn(
                                                        "text-[8px] font-black uppercase tracking-widest px-3 py-1 border-none rounded-lg",
                                                        task.priority === 'Alta' ? "bg-rose-50 text-rose-600 shadow-sm" : 
                                                        task.priority === 'Média' ? "bg-amber-50 text-amber-600 shadow-sm" : 
                                                        "bg-emerald-50 text-emerald-600 shadow-sm"
                                                    )}>
                                                        {task.priority}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm font-bold text-gray-500 leading-relaxed line-clamp-2">{task.description || 'Nenhum briefing detalhado registrado.'}</p>
                                                
                                                <div className="flex flex-wrap items-center gap-6 pt-2">
                                                    <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                        <User className="w-3.5 h-3.5 text-electric-blue" strokeWidth={2.5} /> 
                                                        {leads.find(l => l.id === task.leadId)?.name || 'Lead Externo'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                        <MapPin className="w-3.5 h-3.5 text-rose-500" strokeWidth={2.5} /> Showroom Hub
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-3 relative z-10 shrink-0">
                                                <button 
                                                    onClick={() => updateTask(task.id, { status: 'Concluída' })}
                                                    className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all active:scale-90"
                                                    title="Concluir"
                                                >
                                                    <CheckCircle2 size={22} strokeWidth={2.5} />
                                                </button>
                                                <button className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-pure-black hover:text-white transition-all shadow-sm">
                                                    <MoreVertical size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-32 flex flex-col items-center justify-center text-center bg-gray-50/30 rounded-[3rem] border-dashed border-2 border-gray-200 group">
                                    <div className="w-24 h-24 bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform duration-500">
                                        <CalendarDays size={40} className="text-gray-200" />
                                    </div>
                                    <h4 className="text-2xl font-black text-pure-black tracking-tighter mb-3">Vácuo Operacional</h4>
                                    <p className="text-gray-400 text-sm font-bold max-w-xs mx-auto opacity-80 mb-8">Nenhum compromisso estratégico fixado para esta data.</p>
                                    <button onClick={() => setIsDialogOpen(true)} className="px-10 py-4 bg-pure-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:shadow-3xl transition-all">
                                        Novo Registro
                                    </button>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-10">
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-gray-50 -rotate-12 pointer-events-none group-hover:text-rose-50 transition-colors">
                            <AlertCircle size={100} strokeWidth={1} />
                        </div>
                        
                        <div className="flex items-center gap-4 mb-10 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                                <AlertCircle size={24} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xl font-black tracking-tight text-pure-black">Critical Gaps</h3>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {criticalTasks.slice(0, 5).map((task) => (
                                <div key={task.id} className="p-6 bg-gray-50/50 border border-gray-100 rounded-3xl space-y-3 hover:bg-white hover:shadow-lg transition-all cursor-pointer group/gap">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">Expired</span>
                                        <span className="text-[10px] font-black text-gray-400 uppercase font-mono-numbers">{format(new Date(task.dueDate), 'dd/MM')}</span>
                                    </div>
                                    <h5 className="font-black text-sm text-pure-black group-hover/gap:text-rose-600 transition-colors">{task.title}</h5>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em] leading-relaxed">Timing operacional perdido. Requer re-engajamento imediato.</p>
                                </div>
                            ))}
                            {criticalTasks.length === 0 && (
                                <div className="py-12 text-center bg-emerald-50/20 border border-dashed border-emerald-100 rounded-3xl">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Health Check: 100% OK ✨</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[520px] rounded-[3rem] p-0 border-none shadow-3xl overflow-hidden">
                    <div className="bg-pure-black p-10 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-electric-blue/20 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                        <DialogTitle className="text-3xl font-black tracking-tighter mb-2 relative z-10">Novo Agendamento</DialogTitle>
                        <DialogDescription className="text-white/40 font-bold uppercase text-[10px] tracking-[0.3em] relative z-10">Ficha de Planejamento Tático</DialogDescription>
                    </div>
                    
                    <div className="p-10 space-y-8 bg-white">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Título da Missão</Label>
                            <input 
                                value={newTask.title} 
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} 
                                className="premium-input !rounded-2xl" 
                                placeholder="Ex: Test Drive - Porsche 911" 
                            />
                        </div>
                        
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Observações Estratégicas</Label>
                            <textarea 
                                value={newTask.description} 
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} 
                                className="premium-input !rounded-3xl min-h-[100px] py-4" 
                                placeholder="Histórico ou detalhes do lead..." 
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Impacto</Label>
                                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v as any })}>
                                    <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-bold shadow-inner">
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
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Vincular Lead</Label>
                                <Select value={newTask.leadId} onValueChange={(v) => setNewTask({ ...newTask, leadId: v })}>
                                    <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-bold shadow-inner">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-gray-100 shadow-3xl">
                                        {leads.map(l => <SelectItem key={l.id} value={l.id} className="font-bold">{l.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Data e Hora do Compromisso</Label>
                            {/* 2. & 5. Date navigation and Timezone normalization handled by user input sync */}
                            <input 
                                type="datetime-local" 
                                className="premium-input !rounded-2xl h-14 font-mono-numbers" 
                                onChange={(e) => setNewTask({ ...newTask, dueDate: new Date(e.target.value).toISOString() })} 
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-gray-50/50 flex flex-col sm:flex-row gap-4 border-t border-gray-100">
                        <button onClick={() => setIsDialogOpen(false)} className="flex-1 px-8 py-4 rounded-full border border-gray-200 font-black text-[10px] uppercase tracking-[0.3em] text-gray-400 hover:bg-white hover:text-pure-black transition-all">Descartar</button>
                        <button 
                            onClick={handleAddTask} 
                            disabled={!newTask.title} 
                            className="flex-[2] px-10 py-4 rounded-full bg-electric-blue text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-30"
                        >
                            Confirmar na Agenda
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
