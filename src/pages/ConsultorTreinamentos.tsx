import { useTrainings } from '@/hooks/useData'
import { useState } from 'react'
import { toast } from 'sonner'
import { 
    GraduationCap, Plus, X, Save, ExternalLink, CheckCircle, 
    Play, Filter, Sparkles, BookOpen, Clock, Target, 
    Users, LayoutDashboard, ChevronRight, RefreshCw, Smartphone
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'

const types = ['prospeccao', 'fechamento', 'atendimento', 'gestao', 'pre-vendas']
const audiences = ['vendedor', 'gerente', 'todos']

export default function ConsultorTreinamentos() {
    const { trainings, loading, error, createTraining, refetch } = useTrainings()
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ title: '', description: '', type: 'prospeccao', video_url: '', target_audience: 'todos' })
    const [saving, setSaving] = useState(false)
    const [isRefetching, setIsRefetching] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title || !form.video_url) { toast.error('Preencha os campos obrigatórios.'); return }
        setSaving(true)
        const { error: createError } = await createTraining(form)
        setSaving(false)
        if (createError) { toast.error(createError); return }
        toast.success('Novo módulo de aprendizado publicado!')
        setShowForm(false); setForm({ title: '', description: '', type: 'prospeccao', video_url: '', target_audience: 'todos' })
        refetch()
    }

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Auditando Academy...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / Academy Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Curadoria <Typography as="span" className="text-brand-primary">Academy</Typography></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">GESTÃO DE CONHECIMENTO & ALTA PERFORMANCE</Typography>
                </div>

                <div className="flex items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={() => {setIsRefetching(true); refetch().then(()=>setIsRefetching(false))}} className="w-mx-xl h-mx-xl rounded-mx-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <Button onClick={() => setShowForm(true)} className="h-mx-xl px-8 shadow-mx-lg bg-brand-secondary">
                        <Plus size={18} className="mr-2" /> <Typography as="span">NOVO CONTEÚDO</Typography>
                    </Button>
                </div>
            </header>

            <AnimatePresence>
                {showForm && (
                    <motion.section initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="shrink-0 mb-10">
                        <form onSubmit={handleSubmit}>
                            <Card className="p-mx-10 md:p-14 border-none shadow-mx-xl bg-white overflow-hidden relative">
                                <div className="absolute top-mx-0 right-mx-0 w-mx-96 h-mx-96 bg-brand-primary/5 rounded-mx-full blur-mx-xl -mr-48 -mt-48" />
                                
                                <header className="flex items-center justify-between border-b border-border-default pb-8 mb-10 relative z-10">
                                    <div className="flex items-center gap-mx-md">
                                        <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg transform rotate-2"><GraduationCap size={24} /></div>
                                        <div>
                                            <Typography variant="h3">Publicar Treinamento</Typography>
                                            <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1">EXPANSÃO DE BASE TÉCNICA</Typography>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="rounded-mx-full w-mx-xl h-mx-xl bg-surface-alt hover:bg-white shadow-sm"><X size={24} /></Button>
                                </header>

                                <div className="grid lg:grid-cols-2 gap-mx-14 relative z-10">
                                    <div className="space-y-mx-lg">
                                        <div className="space-y-mx-sm">
                                            <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Título da Aula</Typography>
                                            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Masterizando o Script de Fechamento" required className="!h-14 px-6 font-bold" />
                                        </div>
                                        <div className="space-y-mx-sm">
                                            <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Ementa / Descrição</Typography>
                                            <textarea 
                                                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                                className="w-full bg-surface-alt border border-border-default rounded-mx-xl p-mx-lg text-sm font-bold text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-primary focus:ring-8 focus:ring-brand-primary/5 transition-all resize-none shadow-inner h-mx-xl"
                                                placeholder="Descreva detalhadamente os objetivos desta aula..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-mx-10">
                                        <div className="space-y-mx-sm">
                                            <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">URL do Material (Vídeo)</Typography>
                                            <Input value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))} placeholder="https://youtube.com/v/..." required className="!h-14 px-6 font-medium" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-mx-md">
                                            <div className="space-y-mx-sm">
                                                <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Pilar de Vendas</Typography>
                                                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full h-mx-14 bg-surface-alt border border-border-default rounded-mx-xl px-6 text-sm font-bold text-text-primary focus:border-brand-primary transition-all appearance-none cursor-pointer shadow-inner">
                                                    {types.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-mx-sm">
                                                <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Público Alvo</Typography>
                                                <select value={form.target_audience} onChange={e => setForm(p => ({ ...p, target_audience: e.target.value }))} className="w-full h-mx-14 bg-surface-alt border border-border-default rounded-mx-xl px-6 text-sm font-bold text-text-primary focus:border-brand-primary transition-all appearance-none cursor-pointer shadow-inner">
                                                    {audiences.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <footer className="pt-10 flex justify-end gap-mx-sm border-t border-border-default mt-10 relative z-10">
                                    <Button type="submit" disabled={saving} className="h-mx-2xl px-14 rounded-mx-full shadow-mx-xl font-black uppercase tracking-mx-wide">
                                        {saving ? <RefreshCw className="animate-spin mr-3" /> : <Save size={20} className="mr-3" />} <Typography variant="caption" as="span">PUBLICAR TREINAMENTO</Typography>
                                    </Button>
                                </footer>
                            </Card>
                        </form>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* Academy Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-mx-lg pb-32" aria-live="polite">
                {trainings.map((t, i) => (
                    <motion.article key={t.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                        <Card className="p-mx-lg h-full border-none shadow-mx-lg bg-white group hover:shadow-mx-xl transition-all relative overflow-hidden flex flex-col">
                            <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-mx-huge -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="flex items-start justify-between mb-8 border-b border-border-default pb-6 relative z-10">
                                <div className={cn("w-mx-xl h-mx-xl rounded-mx-2xl flex items-center justify-center transition-all shadow-inner transform group-hover:rotate-6", t.watched ? "bg-status-success-surface text-status-success" : "bg-surface-alt text-text-tertiary group-hover:bg-brand-secondary group-hover:text-white")}>
                                    {t.watched ? <CheckCircle size={20} /> : <Play size={20} className="ml-1" />}
                                </div>
                                <div className="flex flex-col items-end gap-mx-xs">
                                    <Badge variant="brand" className="px-4 py-1 rounded-mx-full">{t.type}</Badge>
                                    {t.watched && <Typography variant="tiny" tone="success" className="font-black tracking-widest uppercase">CONCLUÍDO</Typography>}
                                </div>
                            </div>

                            <div className="flex-1 mb-8 relative z-10 space-y-mx-xs">
                                <Typography variant="h3" className="uppercase leading-tight group-hover:text-brand-primary transition-colors line-clamp-2">{t.title}</Typography>
                                <Typography variant="p" tone="muted" className="leading-relaxed line-clamp-3 italic">"{t.description}"</Typography>
                                
                                <div className="flex flex-wrap gap-mx-xs pt-4">
                                    <Badge variant="outline" className="border-border-strong px-3"><Users size={10} className="mr-1.5" /> <Typography variant="tiny" as="span">{t.target_audience?.toUpperCase()}</Typography></Badge>
                                    <Badge variant="outline" className="border-border-strong px-3"><Clock size={10} className="mr-1.5" /> <Typography variant="tiny" as="span">12 MIN</Typography></Badge>
                                </div>
                            </div>

                            <footer className="pt-6 border-t border-border-default flex items-center justify-between mt-auto relative z-10">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(j => (
                                        <div key={j} className="w-mx-lg h-mx-lg rounded-mx-full border-2 border-white bg-surface-alt flex items-center justify-center text-text-tertiary uppercase">
                                            <Typography variant="caption" as="span">{String.fromCharCode(64 + j)}</Typography>
                                        </div>
                                    ))}
                                    <div className="w-mx-lg h-mx-lg rounded-mx-full border-2 border-white bg-mx-indigo-50 flex items-center justify-center text-brand-primary shadow-sm">
                                        <Typography variant="tiny" as="span">+12</Typography>
                                    </div>
                                </div>
                                <Button asChild size="icon" variant="secondary" className="w-mx-xl h-mx-xl rounded-mx-xl shadow-mx-md group-hover:scale-110 transition-transform">
                                    <a href={t.video_url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink size={20} />
                                    </a>
                                </Button>
                            </footer>
                        </Card>
                    </motion.article>
                ))}
            </div>
        </main>
    )
}
