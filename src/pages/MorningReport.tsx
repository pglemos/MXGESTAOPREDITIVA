import { useState, useEffect } from 'react'
import { Send, Clipboard, AlertTriangle, TrendingUp, Users, Clock, Sparkles, ChevronRight, Share2, Target, Calendar, Bot, BrainCircuit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'
import useAppStore from '@/stores/main'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function MorningReport() {
    const { team, leads, goals } = useAppStore()
    const [isGenerating, setIsGenerating] = useState(false)
    const [report, setReport] = useState<string | null>(null)

    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [loadingAi, setLoadingAi] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchLatestAiInsight();
    }, []);

    const fetchLatestAiInsight = async () => {
        setLoadingAi(true);
        try {
            const { data, error } = await supabase
                .from('report_history')
                .select('ai_insight')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                console.error('Error fetching AI insight:', error);
            }
            if (data) {
                setAiInsight(data.ai_insight);
            }
        } catch (e) {
            console.error('Error fetching AI insight:', e);
        } finally {
            setLoadingAi(false);
        }
    };

    const totalSales = team.reduce((a, t) => a + t.sales, 0)
    const teamGoal = goals.find((g) => g.type === 'Equipe')?.amount || 25
    const goalProgress = (totalSales / teamGoal) * 100
    const staleLeads = leads.filter((l) => l.stagnantDays && l.stagnantDays >= 2).length
    const newLeads = leads.filter((l) => l.stage === 'Lead').length
    const activeLeads = leads.filter((l) => l.stage !== 'Perdido' && l.stage !== 'Venda').length

    const generateReport = () => {
        setIsGenerating(true)
        setTimeout(() => {
            const dateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
            const topSellers = [...team].sort((a, b) => b.sales - a.sales).slice(0, 3)

            const reportText = `📊 *AUTOFLUX — RELATÓRIO MATINAL (${dateStr})*

🎯 *PERFORMANCE DO TIME*
• Vendas Acumuladas: ${totalSales}/${teamGoal} (${goalProgress.toFixed(1)}%)
• Ritmo Atual: ${totalSales > 0 ? (totalSales * 1.2).toFixed(0) : 0} unidades (Projeção)

👥 *TOP PERFORMANCE*
${topSellers.map((t, i) => `· ${i + 1}º ${t.name}: ${t.sales} vendas (${t.conversion}% conv.)`).join('\n')}

🚨 *FOCO NO ATENDIMENTO*
• ${newLeads} leads novos aguardando contato (D0).
• ${staleLeads} leads estagnados (+48h sem ação).

💡 *DIAGNÓSTICO IA*
• Prioridade 1: Atender os ${newLeads} novos leads antes das 10:30h.
• Prioridade 2: Revisar propostas dos ${leads.filter(l => l.stage === 'Proposta').length} leads em fase de fechamento.`

            setReport(reportText)
            setIsGenerating(false)
            toast({ title: 'Relatório Consolidado', description: 'Insights gerados com sucesso.' })
        }, 1500)
    }

    const copyReport = () => {
        if (report) {
            navigator.clipboard.writeText(report)
            toast({ title: 'Copiado!', description: 'Relatório formatado pronto para envio.' })
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="px-2 py-0.5 bg-electric-blue/10 text-electric-blue rounded text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" /> INTELIGÊNCIA OPERACIONAL
                        </div>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-pure-black dark:text-off-white">
                        Relatório <span className="text-electric-blue">Matinal</span>
                    </h1>
                    <p className="text-muted-foreground font-medium">Análise estratégica de vendas e leads para o seu dia.</p>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-2xl h-12 font-bold bg-white/50 dark:bg-black/50 border-white/20">
                        <Calendar className="w-4 h-4 mr-2" /> {new Date().toLocaleDateString('pt-BR')}
                    </Button>
                    <Button
                        onClick={generateReport}
                        disabled={isGenerating}
                        className="rounded-2xl h-12 px-8 font-bold bg-pure-black text-white dark:bg-white dark:text-pure-black shadow-lg hover:shadow-electric-blue/20 transition-all hover:scale-[1.02]"
                    >
                        {isGenerating ? <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-current animate-bounce" /> Analisando...</div> : <div className="flex items-center gap-2"><Target className="w-4 h-4" /> Gerar Insights</div>}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hyper-glass rounded-[2.5rem] border-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="micro-label flex items-center gap-2"><TrendingUp className="w-4 h-4 text-electric-blue" /> Vendas do Mês</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-5xl font-black text-pure-black dark:text-off-white font-mono-numbers">{totalSales}</span>
                            <span className="text-muted-foreground font-bold mb-1.5">/ {teamGoal}</span>
                        </div>
                        <Progress value={goalProgress} className="h-3 bg-black/5 dark:bg-white/5" indicatorClassName="bg-electric-blue shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                        <p className="mt-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Faltam {teamGoal - totalSales} para a meta</p>
                    </CardContent>
                </Card>

                <Card className="hyper-glass rounded-[2.5rem] border-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="micro-label flex items-center gap-2"><Users className="w-4 h-4 text-electric-blue" /> Pipeline Ativo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-5xl font-black text-pure-black dark:text-off-white font-mono-numbers">{activeLeads}</span>
                            <Badge variant="outline" className="mb-2 font-bold border-emerald-500/30 text-emerald-500 bg-emerald-500/5">+{Math.round(leads.length * 0.1)} hoje</Badge>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-emerald-500/20"><div className="h-full bg-emerald-500 rounded-full w-full" /></div>
                            <div className="flex-1 h-1.5 rounded-full bg-electric-blue/20"><div className="h-full bg-electric-blue rounded-full w-2/3" /></div>
                            <div className="flex-1 h-1.5 rounded-full bg-mars-orange/20"><div className="h-full bg-mars-orange rounded-full w-1/3" /></div>
                        </div>
                        <p className="mt-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Saúde do Funil: Excelente</p>
                    </CardContent>
                </Card>

                <Card className="hyper-glass rounded-[2.5rem] border-none border-t-4 border-t-mars-orange/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="micro-label flex items-center gap-2 text-mars-orange"><AlertTriangle className="w-4 h-4" /> Alertas Críticos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-5xl font-black text-mars-orange font-mono-numbers">{staleLeads + newLeads}</span>
                            <span className="text-muted-foreground font-bold mb-1.5 uppercase text-[10px]">Ações Pendentes</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-muted-foreground">AGUARDANDO CONTATO</span>
                                <span className="text-pure-black dark:text-white">{newLeads}</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-muted-foreground">ESTAGNADOS (+48H)</span>
                                <span className="text-mars-orange">{staleLeads}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* AI Insight Section */}
            {aiInsight && (
                <Card className="hyper-glass rounded-[2.5rem] border-none bg-gradient-to-br from-electric-blue/10 via-transparent to-mars-orange/5 overflow-hidden relative group">
                    <CardContent className="p-8">
                        <div className="flex items-start gap-6">
                            <div className="p-4 rounded-2xl bg-electric-blue/10 border border-electric-blue/20">
                                <BrainCircuit className="w-8 h-8 text-electric-blue" />
                            </div>
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-electric-blue uppercase tracking-[0.2em]">Diagnóstico IA Autônomo</span>
                                    {loadingAi && <div className="w-2 h-2 bg-electric-blue rounded-full animate-ping" />}
                                </div>
                                <p className="text-xl font-bold text-pure-black dark:text-off-white leading-relaxed">
                                    {aiInsight}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <AnimatePresence>
                {report && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                    >
                        <div className="space-y-6">
                            <div className="p-10 hyper-glass rounded-[3rem] border border-white/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Clock className="w-32 h-32 -mr-16 -mt-16" />
                                </div>
                                <div className="relative">
                                    <div className="flex justify-between items-start mb-8">
                                        <Badge className="bg-electric-blue text-white rounded-xl font-bold px-4 py-1">VERSÃO EXECUTIVA</Badge>
                                        <Button variant="ghost" size="icon" onClick={copyReport} className="rounded-full hover:bg-electric-blue/10 text-electric-blue"><Clipboard className="w-5 h-5" /></Button>
                                    </div>
                                    <pre className="whitespace-pre-wrap text-base font-bold text-pure-black dark:text-off-white leading-relaxed font-sans">{report}</pre>
                                    <div className="mt-10 pt-6 border-t border-black/5 dark:border-white/10 flex justify-between items-center">
                                        <span className="text-xs font-bold text-muted-foreground">Gerado em {new Date().toLocaleTimeString()}</span>
                                        <Button className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 shadow-lg shadow-emerald-500/20">
                                            <Share2 className="w-4 h-4 mr-2" /> Enviar WhatsApp
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-electric-blue" /> Sugestões Estratégicas
                            </h3>
                            <div className="space-y-4">
                                <ActionInsight
                                    title="Priorizar leads D0"
                                    desc={`Existem ${newLeads} leads que entraram nas últimas 24h e ainda não tiveram o primeiro contato realizado.`}
                                    tag="Imediato"
                                    color="emerald"
                                />
                                <ActionInsight
                                    title="Redistribuição de Carga"
                                    desc="O vendedor Ricardo está com 12 leads estagnados. Considere redistribuir para vendedores com menor carga atual."
                                    tag="Gestão"
                                    color="electric-blue"
                                />
                                <ActionInsight
                                    title="Follow-up de Visitas"
                                    desc={`Temos ${leads.filter(l => l.stage === 'Visita').length} leads que realizaram visitas ontem. Solicite o feedback dos vendedores.`}
                                    tag="Processo"
                                    color="mars-orange"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!report && !isGenerating && (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                    <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-10 h-10 text-muted-foreground opacity-40 shrink-0" />
                    </div>
                    <h2 className="text-2xl font-bold">Nenhum relatório consolidado</h2>
                    <p className="text-muted-foreground max-w-sm">Clique no botão acima para consolidar os dados do dia e gerar sua análise matinal.</p>
                </div>
            )}
        </div>
    )
}

function ActionInsight({ title, desc, tag, color }: { title: string; desc: string; tag: string; color: 'emerald' | 'electric-blue' | 'mars-orange' }) {
    const colorMap = {
        'emerald': 'bg-emerald-500 text-emerald-500',
        'electric-blue': 'bg-electric-blue text-electric-blue',
        'mars-orange': 'bg-mars-orange text-mars-orange',
    }

    return (
        <div className="p-6 hyper-glass rounded-3xl group cursor-pointer hover:scale-[1.01] transition-all border-none">
            <div className="flex justify-between items-start mb-3">
                <Badge variant="outline" className={cn("font-bold text-[9px] uppercase tracking-widest border-none px-0", colorMap[color].split(' ')[1])}>
                    {tag}
                </Badge>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-pure-black dark:group-hover:text-white transition-colors" />
            </div>
            <h4 className="font-extrabold text-[15px] mb-2">{title}</h4>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">{desc}</p>
        </div>
    )
}
