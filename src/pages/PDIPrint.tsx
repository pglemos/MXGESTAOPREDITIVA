import { usePDIs } from '@/hooks/useData'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { Target, Calendar, User, Award, CheckCircle2, ShieldCheck, Zap, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Card } from '@/components/molecules/Card'

export default function PDIPrint() {
    const { id } = useParams()
    const { pdis } = usePDIs()
    const navigate = useNavigate()
    const pdi = pdis.find(p => p.id === id)
    const [isPrinting, setIsPrinting] = useState(false)

    useEffect(() => {
        if (pdi && !isPrinting) {
            setIsPrinting(true)
            setTimeout(() => { window.print() }, 1000)
        }
    }, [pdi, isPrinting])

    if (!pdi) return (
        <div className="p-20 text-center flex flex-col items-center justify-center">
            <History size={48} className="text-text-tertiary mb-6 opacity-20" />
            <Typography variant="h3" tone="muted">Plano não localizado na malha...</Typography>
        </div>
    )

    const radarData = [
        { subject: 'Prospecção', A: pdi.comp_prospeccao },
        { subject: 'Abordagem', A: pdi.comp_abordagem },
        { subject: 'Demonstração', A: pdi.comp_demonstracao },
        { subject: 'Fechamento', A: pdi.comp_fechamento },
        { subject: 'CRM', A: pdi.comp_crm },
        { subject: 'Digital', A: pdi.comp_digital },
        { subject: 'Disciplina', A: pdi.comp_disciplina },
        { subject: 'Organização', A: pdi.comp_organizacao },
        { subject: 'Negociação', A: pdi.comp_negociacao },
        { subject: 'Produto', A: pdi.comp_produto },
    ]

    return (
        <div className="min-h-screen bg-white p-10 md:p-20 text-text-primary font-sans print:p-0">
            {/* Header / Brand */}
            <header className="border-b-8 border-mx-black pb-14 mb-16 flex justify-between items-end">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-mx-black rounded-mx-2xl flex items-center justify-center text-white shadow-mx-xl">
                            <Target size={32} />
                        </div>
                        <Typography variant="h2" className="text-2xl tracking-tighter">MX <span className="text-brand-primary">PERFORMANCE</span></Typography>
                    </div>
                    <Typography variant="h1" className="text-6xl leading-none">Certificado de <span className="text-brand-primary">Compromisso</span></Typography>
                    <Typography variant="caption" tone="muted" className="text-xs font-black tracking-[0.4em] mt-4 block">PLANO DE DESENVOLVIMENTO INDIVIDUAL (PDI 4.0)</Typography>
                </div>
                <div className="text-right space-y-2">
                    <Typography variant="caption" tone="muted" className="text-[10px] font-black uppercase">Protocolo de Rede</Typography>
                    <Typography variant="mono" className="text-sm font-black uppercase bg-surface-alt px-4 py-2 rounded-lg">{pdi.id.split('-')[0]}</Typography>
                </div>
            </header>

            {/* Specialist Info */}
            <div className="grid grid-cols-3 gap-10 mb-20">
                <Card className="p-8 bg-surface-alt border-none shadow-inner">
                    <Typography variant="caption" tone="muted" className="mb-3 flex items-center gap-2 font-black uppercase tracking-widest"><User size={14}/> Especialista</Typography>
                    <Typography variant="h3" className="text-xl uppercase">{(pdi as any).seller_name}</Typography>
                </Card>
                <Card className="p-8 bg-surface-alt border-none shadow-inner">
                    <Typography variant="caption" tone="muted" className="mb-3 flex items-center gap-2 font-black uppercase tracking-widest"><Briefcase size={14}/> Unidade</Typography>
                    <Typography variant="h3" className="text-xl uppercase">MATRIZ OPERACIONAL</Typography>
                </Card>
                <Card className="p-8 bg-surface-alt border-none shadow-inner">
                    <Typography variant="caption" tone="muted" className="mb-3 flex items-center gap-2 font-black uppercase tracking-widest"><Calendar size={14}/> Data de Emissão</Typography>
                    <Typography variant="h3" className="text-xl uppercase font-mono-numbers">{new Date().toLocaleDateString('pt-BR')}</Typography>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 mb-24">
                {/* Radar Capability */}
                <section className="space-y-10">
                    <header className="border-b-2 border-border-default pb-4">
                        <Typography variant="caption" className="text-xs font-black uppercase tracking-[0.3em]">Radar de Capacidade Técnica</Typography>
                    </header>
                    <div className="h-[450px] w-full bg-surface-alt/30 rounded-[3rem] p-10 border border-border-subtle">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                                <Radar
                                    name="Especialista" dataKey="A"
                                    stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} strokeWidth={3}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Horizons */}
                <section className="space-y-14">
                    <header className="border-b-2 border-border-default pb-4">
                        <Typography variant="caption" className="text-xs font-black uppercase tracking-[0.3em]">Horizontes de Crescimento</Typography>
                    </header>
                    
                    <div className="space-y-12">
                        <div className="relative pl-10 border-l-8 border-brand-primary">
                            <Typography variant="caption" tone="brand" className="text-[10px] font-black uppercase tracking-widest block mb-2">06 Meses — Curto Prazo</Typography>
                            <Typography variant="p" className="text-lg font-bold text-text-secondary italic leading-relaxed">"{(pdi as any).meta_6m || pdi.objective}"</Typography>
                        </div>
                        <div className="relative pl-10 border-l-8 border-status-warning">
                            <Typography variant="caption" tone="warning" className="text-[10px] font-black uppercase tracking-widest block mb-2">12 Meses — Médio Prazo</Typography>
                            <Typography variant="p" className="text-lg font-bold text-text-secondary italic leading-relaxed">"{(pdi as any).meta_12m || 'Definir na revisão tática'}"</Typography>
                        </div>
                        <div className="relative pl-10 border-l-8 border-status-error">
                            <Typography variant="caption" tone="error" className="text-[10px] font-black uppercase tracking-widest block mb-2">24 Meses — Visão de Futuro</Typography>
                            <Typography variant="p" className="text-lg font-bold text-text-secondary italic leading-relaxed">"{(pdi as any).meta_24m || 'Plano em expansão'}"</Typography>
                        </div>
                    </div>
                </section>
            </div>

            {/* Mandatory Actions */}
            <section className="mb-24">
                <header className="border-b-2 border-border-default pb-4 mb-10">
                    <Typography variant="caption" className="text-xs font-black uppercase tracking-[0.3em]">Plano de Ação Mandatário (Próximos 180 Dias)</Typography>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[pdi.action_1, pdi.action_2, pdi.action_3, pdi.action_4, pdi.action_5].filter(Boolean).map((action, i) => (
                        <Card key={i} className="flex gap-8 p-10 bg-surface-alt border border-border-default rounded-mx-3xl items-start shadow-inner">
                            <div className="w-10 h-10 rounded-xl bg-mx-black text-white flex items-center justify-center text-xs font-black shrink-0 shadow-mx-lg">0{i+1}</div>
                            <Typography variant="p" className="text-sm font-bold text-text-secondary leading-relaxed uppercase tracking-tight">{action}</Typography>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Signatures */}
            <footer className="pt-32 mt-auto grid grid-cols-2 gap-24">
                <div className="text-center space-y-6">
                    <div className="border-t-4 border-mx-black pt-6">
                        <Typography variant="caption" className="text-[11px] font-black uppercase tracking-[0.2em]">Assinatura do Especialista</Typography>
                        <Typography variant="caption" tone="muted" className="text-[8px] uppercase mt-2 block">Concordância com as metas e prazos estipulados</Typography>
                    </div>
                </div>
                <div className="text-center space-y-6">
                    <div className="border-t-4 border-mx-black pt-6">
                        <Typography variant="caption" className="text-[11px] font-black uppercase tracking-[0.2em]">Responsável Técnico (MX)</Typography>
                        <Typography variant="caption" tone="muted" className="text-[8px] uppercase mt-2 block">Validação metodológica e suporte tático</Typography>
                    </div>
                </div>
            </footer>

            <div className="mt-24 text-center">
                <Typography variant="caption" tone="muted" className="text-[9px] font-black uppercase tracking-[0.6em] opacity-30">MX PERFORMANCE — AIOX MASTER CERTIFIED SYSTEM</Typography>
            </div>

            <button 
                onClick={() => navigate(-1)}
                className="fixed bottom-10 right-10 px-10 py-5 bg-mx-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-mx-elite hover:scale-105 active:scale-95 transition-all print:hidden"
            >
                Retornar ao Painel
            </button>
        </div>
    )
}

const Briefcase = ({ size, className }: { size?: number, className?: string }) => (
    <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
)
