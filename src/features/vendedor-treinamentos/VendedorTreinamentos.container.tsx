import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
    BookOpen, Star, BarChart3, CheckCircle2, ClipboardCheck, Search, Play,
    Video, Calendar, Download, MessageSquare, X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeading } from '@/components/molecules/PageHeading'
import { StatCard } from '@/components/molecules/StatCard'
import { Card } from '@/components/molecules/Card'
import { TabNavPill } from '@/components/molecules/TabNavPill'
import { EmptyState } from '@/components/atoms/EmptyState'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import {
    useVendedorTreinamentos,
    type Treinamento,
    type TarefaTreinamento,
} from './hooks/useVendedorTreinamentos'
import {
    YouTubeCompliancePlayer,
    HTML5CompliancePlayer,
    getYoutubeEmbed,
    getYoutubeThumbnail,
} from './components/CompliancePlayers'

const CATEGORIES = ['Atendimento', 'Prospecção', 'WhatsApp', 'Negociação', 'Financiamento', 'Fechamento', 'Pós-venda', 'Carteira', 'Mentalidade']
const LEVELS = ['N1 Iniciante', 'N2 Intermediário', 'N3 Performance', 'N4 Alta Performance']

const LEVEL_TONE: Record<string, 'brand' | 'blue' | 'orange'> = {
    'N1 Iniciante': 'brand',
    'N2 Intermediário': 'blue',
    'N3 Performance': 'orange',
    'N4 Alta Performance': 'brand',
}

type TabKey = 'biblioteca' | 'trilha' | 'aovivo'

function TrainingCard({ training, completed, onOpen }: { training: Treinamento; completed: boolean; onOpen: () => void }) {
    const thumbUrl = getYoutubeThumbnail(training.video_url)
    return (
        <button
            type="button"
            onClick={onOpen}
            className="group overflow-hidden rounded-mx-2xl border border-border-subtle bg-white text-left shadow-mx-sm transition-all hover:shadow-mx-md focus:outline-none focus:ring-4 focus:ring-brand-primary/20"
        >
            <div className="relative h-28 overflow-hidden bg-pure-black">
                {thumbUrl ? (
                    <img src={thumbUrl} alt={training.title} className="absolute inset-0 h-full w-full object-cover opacity-75 transition-all group-hover:scale-105 group-hover:opacity-90" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary to-brand-primary" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-pure-black/25">
                    <Play className="h-10 w-10 text-white/80 transition-all group-hover:scale-110 group-hover:text-white" />
                </div>
                {completed && (
                    <div className="absolute right-3 top-3 z-10">
                        <CheckCircle2 className="h-6 w-6 fill-white text-status-success" />
                    </div>
                )}
            </div>
            <div className="p-mx-md">
                <div className="mb-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{training.level}</Badge>
                    <span className="text-[10px] text-text-tertiary">{training.duration_minutes} min</span>
                </div>
                <Typography variant="p" className="line-clamp-2 text-sm font-semibold">{training.title}</Typography>
                <Typography variant="caption" tone="muted" className="mt-1 block">{training.category}</Typography>
            </div>
        </button>
    )
}

export default function VendedorTreinamentosContainer() {
    const {
        trainings, loading, completedIds, completedCount, tarefas,
        nivelMaturidade, nivelMaturidadeLabel, toggleTarefa, markCompleted,
    } = useVendedorTreinamentos()

    const [tab, setTab] = useState<TabKey>('biblioteca')
    const [search, setSearch] = useState('')
    const [filterCat, setFilterCat] = useState('all')
    const [filterLevel, setFilterLevel] = useState('all')
    const [selectedTraining, setSelectedTraining] = useState<Treinamento | null>(null)
    const [comment, setComment] = useState('')
    const [savingInteraction, setSavingInteraction] = useState(false)
    const [watchedPercent, setWatchedPercent] = useState(0)

    const filtered = useMemo(() => trainings.filter(t => {
        if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
        if (filterCat !== 'all' && t.category !== filterCat) return false
        if (filterLevel !== 'all' && t.level !== filterLevel) return false
        return true
    }), [trainings, search, filterCat, filterLevel])

    const liveTrainings = trainings.filter(t => t.is_live)
    const upcomingLive = liveTrainings.filter(t => t.live_date && new Date(t.live_date) > new Date())
    const pastLive = liveTrainings.filter(t => t.live_date && new Date(t.live_date) <= new Date())

    const tarefasDaAula = selectedTraining ? tarefas.filter(t => t.training_id === selectedTraining.id) : []
    const totalTarefasConcluidas = tarefas.filter(t => t.concluida).length

    const openTraining = async (training: Treinamento) => {
        setSelectedTraining(training)
        setComment('')
        setWatchedPercent(completedIds.has(training.id) ? 100 : 0)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('treinamento_avaliacoes').select('comment').eq('training_id', training.id).eq('user_id', user.id).maybeSingle()
        setComment((data as { comment?: string } | null)?.comment || '')
    }

    const saveComment = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !selectedTraining || !comment.trim()) return
        setSavingInteraction(true)
        const { error } = await supabase.from('treinamento_avaliacoes').upsert({
            training_id: selectedTraining.id, user_id: user.id, rating: 5, comment: comment.trim(), updated_at: new Date().toISOString(),
        }, { onConflict: 'training_id,user_id' })
        setSavingInteraction(false)
        error ? toast.error(error.message) : toast.success('Comentário e sugestão salvos.')
    }

    const handleMarkCompleted = async () => {
        if (!selectedTraining) return
        setSavingInteraction(true)
        const { error } = await markCompleted(selectedTraining.id)
        setSavingInteraction(false)
        error ? toast.error(error) : toast.success('Aula concluída e progresso atualizado.')
    }

    const handleToggleTask = async (tarefa: TarefaTreinamento, checked: boolean) => {
        const { error } = await toggleTarefa(tarefa, checked)
        if (error) toast.error(error)
    }

    if (loading) {
        return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-border-subtle border-t-brand-primary" /></div>
    }

    const progressoPercent = trainings.length > 0 ? Math.round((completedCount / trainings.length) * 100) : 0

    return (
        <div className="space-y-8">
            <PageHeading title="Universidade MX" subtitle="Desenvolva suas habilidades de vendas" />

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard icon={<Star size={20} />} label="Minha Trilha" value={nivelMaturidade} detail={nivelMaturidadeLabel} tone="blue" />
                <StatCard icon={<BarChart3 size={20} />} label="Progresso" value={`${progressoPercent}%`} tone="green" />
                <StatCard icon={<CheckCircle2 size={20} />} label="Aulas Concluídas" value={completedCount} tone="brand" />
                <StatCard icon={<ClipboardCheck size={20} />} label="Tarefas Práticas Concluídas" value={totalTarefasConcluidas} tone="orange" />
            </div>

            <TabNavPill<TabKey>
                tabs={[
                    { key: 'biblioteca', label: 'Biblioteca' },
                    { key: 'trilha', label: 'Trilha' },
                    { key: 'aovivo', label: 'Aulas ao Vivo' },
                ]}
                activeTab={tab}
                onTabChange={setTab}
                aria-label="Seções da Universidade MX"
            />

            {tab === 'biblioteca' && (
                <div className="space-y-6">
                    <div className="flex flex-wrap gap-3">
                        <div className="relative min-w-[200px] flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar treinamento..." className="pl-9" />
                        </div>
                        <Select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="w-auto min-w-[160px]">
                            <option value="all">Todas as categorias</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </Select>
                        <Select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="w-auto min-w-[180px]">
                            <option value="all">Todos os níveis</option>
                            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </Select>
                    </div>

                    {filtered.length === 0 ? (
                        <Card>
                            <EmptyState icon={<BookOpen />} title="Nenhum treinamento encontrado." size="lg" />
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {filtered.map(t => <TrainingCard key={t.id} training={t} completed={completedIds.has(t.id)} onOpen={() => void openTraining(t)} />)}
                        </div>
                    )}
                </div>
            )}

            {tab === 'trilha' && (
                <div className="space-y-6">
                    <Card className="p-mx-lg">
                        <Typography variant="h3" className="mb-1">Sua Maturidade Profissional</Typography>
                        <Typography variant="caption" tone="muted" className="mb-6 block">
                            A trilha reflete tempo de mercado, experiência declarada e cargo — não apenas quantas aulas você assistiu.
                        </Typography>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                            {LEVELS.map((level, idx) => {
                                const isActive = level.startsWith(nivelMaturidade)
                                return (
                                    <div key={level} className={`rounded-mx-xl border-2 p-4 text-center transition-all ${isActive ? 'border-brand-primary bg-brand-primary/5' : 'border-border-subtle'}`}>
                                        <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${isActive ? 'bg-brand-primary text-white' : 'bg-surface-alt text-text-tertiary'}`}>
                                            {idx + 1}
                                        </div>
                                        <Typography variant="p" className={`text-sm font-semibold ${isActive ? '' : 'text-text-tertiary'}`}>{level}</Typography>
                                    </div>
                                )
                            })}
                        </div>
                    </Card>

                    {LEVELS.map(level => {
                        const levelTrainings = trainings.filter(t => t.level === level)
                        if (levelTrainings.length === 0) return null
                        return (
                            <div key={level}>
                                <div className="mb-3 flex items-center gap-2">
                                    <Typography variant="h3">{level}</Typography>
                                    <Badge variant={LEVEL_TONE[level] === 'brand' ? 'brand' : 'outline'}>{levelTrainings.length}</Badge>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {levelTrainings.map(t => <TrainingCard key={t.id} training={t} completed={completedIds.has(t.id)} onOpen={() => void openTraining(t)} />)}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {tab === 'aovivo' && (
                <div className="space-y-6">
                    {upcomingLive.length > 0 && (
                        <div>
                            <Typography variant="h3" className="mb-3">Próximas Aulas</Typography>
                            <div className="space-y-3">
                                {upcomingLive.map(t => (
                                    <Card key={t.id} className="flex items-center gap-4 p-mx-md">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-mx-xl bg-status-error/10">
                                            <Video className="h-5 w-5 text-status-error" />
                                        </div>
                                        <div className="flex-1">
                                            <Typography variant="p" className="text-sm font-semibold">{t.title}</Typography>
                                            <Typography variant="caption" tone="muted" className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {t.live_date ? new Date(t.live_date).toLocaleDateString('pt-BR') : '—'}
                                            </Typography>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {pastLive.length > 0 && (
                        <div>
                            <Typography variant="h3" className="mb-3">Gravações</Typography>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {pastLive.map(t => <TrainingCard key={t.id} training={t} completed={completedIds.has(t.id)} onOpen={() => void openTraining(t)} />)}
                            </div>
                        </div>
                    )}

                    {liveTrainings.length === 0 && (
                        <Card>
                            <EmptyState icon={<Video />} title="Nenhuma aula ao vivo agendada." size="lg" />
                        </Card>
                    )}
                </div>
            )}

            {selectedTraining && (
                <div className="fixed inset-0 z-[160] grid place-items-center bg-pure-black/55 p-4" onClick={(event) => { if (event.target === event.currentTarget) setSelectedTraining(null) }}>
                    <div role="dialog" aria-modal="true" aria-labelledby="training-detail-title" className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-mx-2xl bg-white shadow-mx-lg">
                        <header className="flex items-start justify-between border-b border-border-subtle p-5">
                            <div>
                                <Typography variant="h2" id="training-detail-title">{selectedTraining.title}</Typography>
                                {selectedTraining.description && <Typography variant="p" tone="muted" className="mt-1">{selectedTraining.description}</Typography>}
                            </div>
                            <button type="button" onClick={() => setSelectedTraining(null)} aria-label="Fechar aula" className="rounded-mx-md p-2 hover:bg-surface-alt"><X /></button>
                        </header>
                        <div className="space-y-5 overflow-y-auto p-5">
                            <div className="aspect-video overflow-hidden rounded-mx-xl bg-pure-black">
                                {getYoutubeEmbed(selectedTraining.video_url) ? (
                                    <YouTubeCompliancePlayer videoUrl={selectedTraining.video_url} onProgressUpdate={setWatchedPercent} onCompleted={() => setWatchedPercent(100)} />
                                ) : selectedTraining.video_url ? (
                                    <HTML5CompliancePlayer videoUrl={selectedTraining.video_url} onProgressUpdate={setWatchedPercent} onCompleted={() => setWatchedPercent(100)} />
                                ) : (
                                    <div className="grid h-full place-items-center text-sm text-white/70">Vídeo ainda não publicado.</div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {selectedTraining.material_url && (
                                    <a href={selectedTraining.material_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-mx-xl border border-border-subtle px-4 py-2 text-sm font-semibold text-brand-primary">
                                        <Download size={16} /> Abrir material complementar
                                    </a>
                                )}
                                <button
                                    type="button"
                                    disabled={savingInteraction || (!completedIds.has(selectedTraining.id) && Boolean(selectedTraining.video_url) && watchedPercent < 95)}
                                    onClick={() => void handleMarkCompleted()}
                                    className="inline-flex items-center gap-2 rounded-mx-xl bg-status-success px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    <CheckCircle2 size={16} />
                                    {completedIds.has(selectedTraining.id)
                                        ? 'Concluída'
                                        : watchedPercent >= 95
                                            ? 'Concluir Aula'
                                            : `Concluir Aula (${Math.round(watchedPercent)}%)`}
                                </button>
                            </div>
                            {tarefasDaAula.length > 0 && (
                                <section className="rounded-mx-xl border border-border-subtle bg-surface-alt/40 p-4">
                                    <Typography variant="p" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                                        <CheckCircle2 size={16} className="text-brand-primary" />
                                        Plano de Ação — Tarefa Prática da Aula
                                    </Typography>
                                    <Typography variant="caption" tone="muted" className="mb-3 mt-1 block">
                                        Execute estas ações hoje para consolidar o aprendizado da aula:
                                    </Typography>
                                    <div className="space-y-2">
                                        {tarefasDaAula.map(tarefa => (
                                            <label key={tarefa.id} className="flex cursor-pointer select-none items-start gap-2.5 rounded-mx-md border border-border-subtle bg-white p-2.5 transition-colors hover:border-border-strong">
                                                <input
                                                    type="checkbox"
                                                    checked={tarefa.concluida}
                                                    onChange={e => void handleToggleTask(tarefa, e.target.checked)}
                                                    className="mt-0.5 h-4 w-4 rounded border-border-strong text-brand-primary focus:ring-brand-primary"
                                                />
                                                <span className={`text-xs ${tarefa.concluida ? 'font-medium text-text-tertiary line-through' : 'font-semibold text-text-primary'}`}>
                                                    {tarefa.descricao}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </section>
                            )}
                            <section className="rounded-mx-xl border border-border-subtle p-4">
                                <Typography variant="p" className="flex items-center gap-2 font-semibold"><MessageSquare size={16} /> Comentário ou sugestão</Typography>
                                <textarea
                                    value={comment}
                                    onChange={event => setComment(event.target.value)}
                                    maxLength={1000}
                                    rows={4}
                                    className="mt-3 w-full rounded-mx-xl border border-border-subtle p-3 text-sm outline-none focus:ring-4 focus:ring-brand-primary/20"
                                    placeholder="Compartilhe uma dúvida, comentário ou sugestão de conteúdo."
                                />
                                <div className="mt-3 flex justify-end">
                                    <button type="button" disabled={savingInteraction || !comment.trim()} onClick={() => void saveComment()} className="rounded-mx-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                                        Salvar comentário
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
