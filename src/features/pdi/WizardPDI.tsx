import { useState, useEffect, useMemo } from 'react'
import { usePDI_MX } from '@/hooks/usePDI_MX'
import { useTeam } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { X, Target, LayoutDashboard, Zap, ChevronLeft, ChevronRight, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card } from '@/components/molecules/Card'
import { toast } from 'sonner'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import { cn } from '@/lib/utils'
import * as Dialog from '@radix-ui/react-dialog'

export function WizardPDI({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const { storeId } = useAuth()
    const { sellers } = useTeam()
    const { cargos, template, loading, fetchCargos, fetchTemplate, fetchSuggestedActions, saveSessionBundle } = usePDI_MX()
    
    const [currentStep, setCurrentStep] = useState(0)
    const [saving, setSaving] = useState(false)
    const [suggestedActions, setSuggestedActions] = useState<Record<string, any[]>>({})

    const [form, setForm] = useState({
        colaborador_id: '',
        cargo_id: '',
        proxima_revisao_data: '',
        metas: [
            { prazo: '6_meses', tipo: 'pessoal', descricao: '' },
            { prazo: '6_meses', tipo: 'profissional', descricao: '' },
            { prazo: '6_meses', tipo: 'pessoal', descricao: '' },
            { prazo: '12_meses', tipo: 'pessoal', descricao: '' },
            { prazo: '12_meses', tipo: 'profissional', descricao: '' },
            { prazo: '12_meses', tipo: 'pessoal', descricao: '' },
            { prazo: '24_meses', tipo: 'pessoal', descricao: '' },
            { prazo: '24_meses', tipo: 'profissional', descricao: '' },
            { prazo: '24_meses', tipo: 'pessoal', descricao: '' },
        ],
        avaliacoes: {} as Record<string, number>,
        plano_acao: Array(5).fill({ competencia_id: '', descricao_acao: '', data_conclusao: '', impacto: 'medio', custo: 'medio' })
    })

    useEffect(() => {
        fetchCargos().then(cargos => {
            const vendedor = cargos?.find(c => c.nome.toLowerCase().includes('consultor'))
            if (vendedor) setForm(f => ({ ...f, cargo_id: vendedor.id }))
        })
    }, [fetchCargos])

    useEffect(() => {
        if (form.cargo_id) {
            fetchTemplate(form.cargo_id).then(t => {
                if (t?.competencias) {
                    const initialEval: Record<string, number> = {}
                    t.competencias.forEach(c => initialEval[c.id] = t.escala?.[0]?.nota || 6)
                    setForm(f => ({ ...f, avaliacoes: initialEval }))
                }
            })
        }
    }, [form.cargo_id, fetchTemplate])

    // Fetch suggested actions when a top gap is selected in the action plan
    const handleCompetenciaAcaoChange = async (index: number, compId: string) => {
        const novoPlano = [...form.plano_acao]
        novoPlano[index] = { ...novoPlano[index], competencia_id: compId, descricao_acao: '' }
        setForm({ ...form, plano_acao: novoPlano })

        if (compId && !suggestedActions[compId]) {
            const actions = await fetchSuggestedActions(compId)
            setSuggestedActions(prev => ({ ...prev, [compId]: actions }))
        }
    }

    const topGaps = useMemo(() => {
        if (!template?.competencias) return []
        return template.competencias.map(c => ({
            id: c.id,
            nome: c.nome,
            alvo: c.alvo,
            nota: form.avaliacoes[c.id] || c.alvo,
            gap: c.alvo - (form.avaliacoes[c.id] || c.alvo)
        })).sort((a, b) => b.gap - a.gap).slice(0, 5)
    }, [template, form.avaliacoes])

    const validateMetas = () => {
        const groups = ['6_meses', '12_meses', '24_meses']
        for (const prazo of groups) {
            const metasDoPrazo = form.metas.filter(m => m.prazo === prazo && m.descricao.trim())
            const temPessoal = metasDoPrazo.some(m => m.tipo === 'pessoal')
            const temProfissional = metasDoPrazo.some(m => m.tipo === 'profissional')
            if (!temPessoal || !temProfissional) {
                toast.error(`Para ${prazo.replace('_', ' ')}, é necessário ao menos 1 meta pessoal e 1 profissional.`)
                return false
            }
        }
        return true
    }

    const validateAcoes = () => {
        for (let i = 0; i < form.plano_acao.length; i++) {
            const a = form.plano_acao[i]
            if (!a.competencia_id || !a.descricao_acao.trim() || !a.data_conclusao) {
                toast.error(`Ação ${i + 1} está incompleta. Selecione a competência, descreva a ação e informe a data.`)
                return false
            }
        }
        if (!form.proxima_revisao_data) {
            toast.error('Informe a data da próxima revisão mensal.')
            return false
        }
        return true
    }

    const handleNext = () => {
        if (currentStep === 0 && (!form.colaborador_id || !form.cargo_id)) return toast.error('Selecione colaborador e cargo.')
        if (currentStep === 1 && !validateMetas()) return
        setCurrentStep(s => s + 1)
    }

    const handleSubmit = async () => {
        if (!validateAcoes()) return
        setSaving(true)
        try {
            const payload = {
                colaborador_id: form.colaborador_id,
                loja_id: storeId,
                proxima_revisao_data: form.proxima_revisao_data,
                metas: form.metas.filter(m => m.descricao.trim()),
                avaliacoes: Object.entries(form.avaliacoes).map(([competencia_id, nota_atribuida]) => {
                    const comp = template?.competencias.find(c => c.id === competencia_id)
                    return { competencia_id, nota_atribuida, alvo: comp?.alvo || 10 }
                }),
                plano_acao: form.plano_acao
            }
            await saveSessionBundle(payload)
            toast.success('Sessão de PDI concluída com sucesso! O bundle foi gerado.')
            onSuccess()
        } catch (err: any) {
            toast.error(err.message || 'Erro ao salvar PDI')
        } finally {
            setSaving(false)
        }
    }

    const randomFrase = useMemo(() => template?.frases?.[Math.floor(Math.random() * template.frases.length)] || '', [template])
    const steps = [
        { id: 'setup', label: 'Especialista', icon: Target },
        { id: 'goals', label: 'Metas (7 min)', icon: Target },
        { id: 'skills', label: 'Mapeamento (10 min)', icon: LayoutDashboard },
        { id: 'actions', label: 'Plano de Ação (11 min)', icon: Zap }
    ]

    return (
        <Dialog.Root open onOpenChange={(open) => { if (!open) onClose() }}>
            <Dialog.Portal forceMount>
                <Dialog.Overlay asChild forceMount>
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-mx-sm md:p-10 bg-mx-black/80 backdrop-blur-md"
                    >
                        <Dialog.Content asChild forceMount>
                            <Card className="w-full max-w-mx-6xl max-h-full overflow-y-auto no-scrollbar shadow-mx-elite border-none flex flex-col bg-white rounded-mx-2xl">
                <header className="p-mx-lg md:p-10 border-b border-border-default flex flex-col gap-mx-lg sticky top-mx-0 bg-white z-10 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-mx-sm">
                            <div className="w-mx-xl h-mx-xl rounded-mx-2xl bg-brand-primary text-white flex items-center justify-center shadow-mx-lg"><Target size={24} /></div>
                            <div>
                                <Typography variant="h2" className="uppercase tracking-tighter">Sessão PDI MX 360º</Typography>
                                <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest">{steps[currentStep].label}</Typography>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-mx-full w-mx-xl h-mx-xl bg-surface-alt hover:bg-border-default"><X size={24} /></Button>
                    </div>
                    {randomFrase && (
                        <div className="bg-mx-indigo-50 border border-brand-primary/20 p-mx-sm rounded-mx-xl flex items-center gap-mx-sm">
                            <Sparkles className="text-brand-primary shrink-0" size={20} />
                            <Typography variant="p" tone="brand" className="text-sm font-bold italic">{randomFrase}</Typography>
                        </div>
                    )}
                    <div className="flex items-center justify-between gap-mx-sm">
                        {steps.map((step, idx) => (
                            <div key={step.id} className="flex-1 flex flex-col gap-mx-xs">
                                <div className={cn("h-mx-xs rounded-mx-full transition-all duration-500", idx <= currentStep ? "bg-brand-primary" : "bg-surface-alt")} />
                            </div>
                        ))}
                    </div>
                </header>

                <div className="p-mx-lg md:p-10 flex-1">
                    {loading && !template ? (
                        <div className="flex justify-center py-20"><Typography variant="h3" className="animate-pulse">Sincronizando Metodologia MX...</Typography></div>
                    ) : (
                        <>
                            {currentStep === 0 && (
                                <div className="space-y-mx-lg max-w-2xl mx-auto">
                                    <div className="space-y-mx-sm">
                                        <Typography variant="tiny" className="font-black uppercase text-text-tertiary">1. Selecione o Especialista</Typography>
                                        <select 
                                            value={form.colaborador_id} onChange={e => setForm({ ...form, colaborador_id: e.target.value })}
                                            aria-label="Selecione o Especialista"
                                            className="w-full h-mx-2xl px-6 bg-surface-alt rounded-mx-2xl font-black text-lg outline-none border focus:border-brand-primary"
                                        >
                                            <option value="">Selecione o vendedor...</option>
                                            {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-mx-sm">
                                        <Typography variant="tiny" className="font-black uppercase text-text-tertiary">2. Escala de Avaliação (Cargo)</Typography>
                                        <select 
                                            value={form.cargo_id} onChange={e => setForm({ ...form, cargo_id: e.target.value })}
                                            aria-label="Cargo do especialista"
                                            className="w-full h-mx-2xl px-6 bg-surface-alt rounded-mx-2xl font-black text-lg outline-none border focus:border-brand-primary"
                                        >
                                            <option value="">Selecione o nível do cargo...</option>
                                            {cargos.map(c => <option key={c.id} value={c.id}>Nível {c.nivel} - {c.nome} ({c.nota_min} a {c.nota_max})</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg">
                                    {['6_meses', '12_meses', '24_meses'].map(prazo => (
                                        <Card key={prazo} className="p-mx-md bg-surface-alt border-none shadow-sm space-y-mx-md">
                                            <Typography variant="h3" className="uppercase font-black border-b border-border-strong/10 pb-4">Visão {prazo.replace('_', ' ')}</Typography>
                                            {form.metas.map((meta, idx) => meta.prazo === prazo && (
                                                <div key={idx} className="space-y-mx-xs bg-white p-mx-sm rounded-mx-xl shadow-sm border border-border-default">
                                                    <div className="flex justify-between items-center">
                                                        <select 
                                                            value={meta.tipo}
                                                            onChange={e => { const nm = [...form.metas]; nm[idx].tipo = e.target.value; setForm({ ...form, metas: nm }) }}
                                                            aria-label="Tipo de meta"
                                                            className="text-mx-tiny font-black uppercase text-brand-primary bg-transparent outline-none cursor-pointer"
                                                        >
                                                            <option value="pessoal">META PESSOAL</option>
                                                            <option value="profissional">META PROFISSIONAL</option>
                                                        </select>
                                                    </div>
                                                    <textarea 
                                                        value={meta.descricao} placeholder="Descreva a meta..."
                                                        aria-label="Descrição da meta"
                                                        onChange={e => { const nm = [...form.metas]; nm[idx].descricao = e.target.value; setForm({ ...form, metas: nm }) }}
                                                        className="w-full h-mx-header text-sm resize-none outline-none font-bold placeholder:font-normal"
                                                    />
                                                </div>
                                            ))}
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {currentStep === 2 && template && (
                                <div className="space-y-mx-xl">
                                    <div className="bg-brand-secondary text-white p-mx-md rounded-mx-2xl flex items-center justify-between">
                                        <div>
                                            <Typography variant="h3" tone="white" className="uppercase">Mapeamento da Capacidade Atual</Typography>
                                            <Typography variant="p" tone="white" className="opacity-80">Avalie as competências do especialista de acordo com a escala do cargo.</Typography>
                                        </div>
                                        <div className="text-right">
                                            <Typography variant="tiny" tone="white" className="uppercase opacity-60 font-black">Escala Ativa</Typography>
                                            <Typography variant="h2" tone="white">{template.escala[0]?.nota} a {template.escala[template.escala.length - 1]?.nota}</Typography>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-mx-10">
                                        {['tecnica', 'comportamental'].map(tipo => (
                                            <div key={tipo} className="space-y-mx-md">
                                                <Typography variant="h3" className="uppercase font-black text-brand-primary border-b border-border-default pb-4">Competências {tipo}s</Typography>
                                                {template.competencias.filter(c => c.tipo === tipo).map(c => {
                                                    const nota = form.avaliacoes[c.id] || template.escala[0]?.nota
                                                    const descritor = template.escala.find(e => e.nota === nota)?.descritor || ''
                                                    return (
                                                        <div key={c.id} className="bg-surface-alt p-mx-md rounded-mx-2xl border border-border-default space-y-mx-sm hover:border-brand-primary/50 transition-colors">
                                                            <div className="flex justify-between items-start gap-mx-sm">
                                                                <div>
                                                                    <Typography variant="p" className="font-black uppercase">{c.nome}</Typography>
                                                                    <Typography variant="tiny" tone="muted" className="mt-1 leading-snug">{c.descricao_completa}</Typography>
                                                                </div>
                                                                <div className="bg-white px-4 py-2 rounded-mx-xl shadow-sm border border-border-default text-center min-w-mx-20">
                                                                    <Typography variant="h2" tone="brand">{nota}</Typography>
                                                                </div>
                                                            </div>
                                                            
                                                            <input 
                                                                type="range" min={template.escala[0]?.nota} max={template.escala[template.escala.length - 1]?.nota} 
                                                                value={nota}
                                                                aria-label="Nível da competência"
                                                                onChange={e => setForm(f => ({ ...f, avaliacoes: { ...f.avaliacoes, [c.id]: Number(e.target.value) } }))}
                                                                className="w-full accent-brand-primary"
                                                            />
                                                            
                                                            <div className="flex justify-between items-center bg-white p-mx-xs rounded-mx-lg text-xs font-bold text-text-secondary border border-border-default">
                                                                <span className="flex items-center gap-mx-xs text-brand-primary/80"><AlertCircle size={14}/> Ind: {c.indicador}</span>
                                                                <span className="uppercase text-mx-tiny tracking-widest">{descritor}</span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && template && (
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-10">
                                    <div className="xl:col-span-4 space-y-mx-md">
                                        <Card className="p-mx-md bg-surface-alt border-none shadow-sm flex flex-col items-center justify-center h-mx-96">
                                            <Typography variant="tiny" className="uppercase font-black text-text-tertiary mb-4">Radar de Competências</Typography>
                                            
                                            {/* Tabela Acessível para Leitores de Tela */}
                                            <table className="sr-only">
                                                <caption>Mapeamento de Competências e Notas</caption>
                                                <thead>
                                                    <tr>
                                                        <th scope="col">Competência</th>
                                                        <th scope="col">Nota Atual</th>
                                                        <th scope="col">Alvo</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {template.competencias.map(c => (
                                                        <tr key={c.id}>
                                                            <td>{c.nome}</td>
                                                            <td>{form.avaliacoes[c.id] || 0}</td>
                                                            <td>{c.alvo}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={template.competencias.map(c => ({ name: c.nome, nota: form.avaliacoes[c.id] || 0, alvo: c.alvo, fullMark: c.alvo }))}>
                                                    <PolarGrid stroke="var(--color-border-subtle)" />
                                                    <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 900 }} />
                                                    <Radar name="Alvo" dataKey="alvo" stroke="#94a3b8" strokeDasharray="3 3" fill="transparent" />
                                                    <Radar name="Nota" dataKey="nota" stroke="var(--color-brand-primary)" strokeWidth={2} fill="var(--color-brand-primary)" fillOpacity={0.3} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </Card>
                                        <div className="space-y-mx-xs">
                                            <Typography variant="tiny" className="uppercase font-black text-brand-primary">Top 5 Maiores Lacunas</Typography>
                                            {topGaps.map((gap, i) => (
                                                <div key={i} className="flex justify-between items-center p-mx-xs bg-white border border-status-error/20 rounded-mx-lg shadow-sm">
                                                    <Typography variant="p" className="text-xs font-bold uppercase">{gap.nome}</Typography>
                                                    <div className="text-right">
                                                        <Typography variant="mono" className="text-mx-tiny text-text-tertiary">Nota: {gap.nota}/{gap.alvo}</Typography>
                                                        <Typography variant="tiny" className="text-status-error font-black">GAP -{gap.gap}</Typography>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="xl:col-span-8 space-y-mx-md">
                                        <div className="flex items-center justify-between mb-2">
                                            <Typography variant="h3" className="uppercase font-black">5 Ações de Desenvolvimento</Typography>
                                            <div className="flex items-center gap-mx-sm">
                                                <div className="flex flex-col text-right">
                                                    <Typography variant="tiny" className="uppercase font-black text-text-tertiary">Revisão Mensal</Typography>
                                                    <input 
                                                        type="date" value={form.proxima_revisao_data} onChange={e => setForm({ ...form, proxima_revisao_data: e.target.value })}
                                                        aria-label="Data de revisão"
                                                        className="text-sm font-bold text-brand-primary border-none outline-none bg-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {form.plano_acao.map((acao, idx) => (
                                            <div key={idx} className="p-mx-md bg-surface-alt border border-border-default rounded-mx-2xl space-y-mx-sm">
                                                <div className="flex items-center gap-mx-sm">
                                                    <div className="w-mx-lg h-mx-lg rounded-mx-full bg-brand-primary text-white flex items-center justify-center font-black text-xs shrink-0">{idx + 1}</div>
                                                    <select 
                                                        value={acao.competencia_id} onChange={e => handleCompetenciaAcaoChange(idx, e.target.value)}
                                                        aria-label="Competência"
                                                        className="flex-1 h-mx-xl px-4 bg-white border border-border-default rounded-mx-xl text-sm font-bold outline-none uppercase"
                                                    >
                                                        <option value="">-- Vincular Competência (Lacuna) --</option>
                                                        {topGaps.map(g => <option key={g.id} value={g.id}>{g.nome} (Gap: {g.gap})</option>)}
                                                    </select>
                                                </div>

                                                {acao.competencia_id && suggestedActions[acao.competencia_id]?.length > 0 && (
                                                    <div className="pl-12">
                                                        <select 
                                                            onChange={e => { const np = [...form.plano_acao]; np[idx].descricao_acao = e.target.value; setForm({ ...form, plano_acao: np }) }}
                                                            className="w-full p-mx-xs bg-mx-indigo-50 border border-brand-primary/20 rounded-mx-lg text-xs font-bold text-brand-primary outline-none cursor-pointer"
                                                        >
                                                            <option value="">✨ Selecionar Ação Recomendada da MX...</option>
                                                            {suggestedActions[acao.competencia_id].map(sa => (
                                                                <option key={sa.id} value={sa.descricao_acao}>{sa.descricao_acao}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                <div className="pl-12 space-y-mx-sm">
                                                    <textarea 
                                                        value={acao.descricao_acao} placeholder="Descreva a ação de desenvolvimento..."
                                                        onChange={e => { const np = [...form.plano_acao]; np[idx].descricao_acao = e.target.value; setForm({ ...form, plano_acao: np }) }}
                                                        className="w-full h-mx-header p-mx-sm bg-white border border-border-default rounded-mx-xl text-sm font-bold resize-none outline-none"
                                                    />
                                                    <div className="flex gap-mx-sm">
                                                        <div className="flex-1">
                                                            <Typography variant="tiny" className="uppercase font-black text-text-tertiary mb-1 block">Conclusão</Typography>
                                                            <input type="date" aria-label="Data de conclusão" value={acao.data_conclusao} onChange={e => { const np = [...form.plano_acao]; np[idx].data_conclusao = e.target.value; setForm({ ...form, plano_acao: np }) }} className="w-full h-mx-xl px-4 bg-white border border-border-default rounded-mx-xl text-sm font-bold outline-none" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <Typography variant="tiny" className="uppercase font-black text-text-tertiary mb-1 block">Impacto</Typography>
                                                            <select aria-label="Impacto" value={acao.impacto} onChange={e => { const np = [...form.plano_acao]; np[idx].impacto = e.target.value; setForm({ ...form, plano_acao: np }) }} className="w-full h-mx-xl px-4 bg-white border border-border-default rounded-mx-xl text-sm font-bold outline-none uppercase">
                                                                <option value="alto">Alto</option><option value="medio">Médio</option><option value="baixo">Baixo</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex-1">
                                                            <Typography variant="tiny" className="uppercase font-black text-text-tertiary mb-1 block">Custo</Typography>
                                                            <select aria-label="Custo" value={acao.custo} onChange={e => { const np = [...form.plano_acao]; np[idx].custo = e.target.value; setForm({ ...form, plano_acao: np }) }} className="w-full h-mx-xl px-4 bg-white border border-border-default rounded-mx-xl text-sm font-bold outline-none uppercase">
                                                                <option value="alto">Alto</option><option value="medio">Médio</option><option value="baixo">Baixo</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <footer className="p-mx-lg md:p-10 border-t border-border-default sticky bottom-mx-0 bg-white z-10 flex flex-col sm:flex-row gap-mx-md justify-between">
                    <Button variant="ghost" onClick={() => currentStep > 0 ? setCurrentStep(s => s - 1) : onClose()} className="h-mx-14 px-8 rounded-mx-full font-black uppercase text-xs border border-border-default w-full sm:w-auto">
                        <ChevronLeft size={18} className="mr-2" /> {currentStep === 0 ? 'CANCELAR' : 'VOLTAR'}
                    </Button>
                    <Button onClick={currentStep < 3 ? handleNext : handleSubmit} disabled={saving} className="h-mx-14 px-12 rounded-mx-full shadow-mx-xl font-black uppercase text-xs w-full sm:w-auto">
                        {saving ? <div className="animate-spin mr-2"><LayoutDashboard size={18}/></div> : (currentStep === 3 ? <CheckCircle2 size={18} className="mr-2" /> : <ChevronRight size={18} className="ml-2" />)}
                        {currentStep === 3 ? 'CONCLUIR SESSÃO & GERAR PDI' : 'PRÓXIMO'}
                    </Button>
                </footer>
            </Card>
                        </Dialog.Content>
                    </motion.div>
                </Dialog.Overlay>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
