import { usePDIs } from '@/hooks/useData'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { Target, Calendar, User, Briefcase, Award, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PDIPrint() {
    const { id } = useParams()
    const { pdis } = usePDIs()
    const navigate = useNavigate()
    const pdi = pdis.find(p => p.id === id)
    const [isPrinting, setIsPrinting] = useState(false)

    useEffect(() => {
        if (pdi && !isPrinting) {
            setIsPrinting(true)
            setTimeout(() => {
                window.print()
            }, 1000)
        }
    }, [pdi, isPrinting])

    if (!pdi) return <div className="p-20 text-center font-black uppercase tracking-widest text-gray-400">Plano não localizado...</div>

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
        <div className="min-h-screen bg-white p-8 md:p-16 text-slate-950 font-sans print:p-0">
            {/* Header / Brand */}
            <div className="border-b-4 border-slate-950 pb-10 mb-12 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-white">
                            <Target size={24} />
                        </div>
                        <span className="text-2xl font-black tracking-tighter uppercase">MX Gestão Preditiva</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter leading-none uppercase">Certificado de <span className="text-indigo-600">Compromisso</span></h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.4em] mt-3">Plano de Desenvolvimento Individual (PDI 2.0)</p>
                </div>
                <div className="text-right space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400">ID do Protocolo</p>
                    <p className="text-xs font-mono font-bold uppercase">{pdi.id.split('-')[0]}</p>
                </div>
            </div>

            {/* Specialist Info */}
            <div className="grid grid-cols-3 gap-8 mb-16">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><User size={12}/> Especialista</p>
                    <p className="text-lg font-black uppercase tracking-tight">{(pdi as any).seller_name}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Briefcase size={12}/> Unidade</p>
                    <p className="text-lg font-black uppercase tracking-tight">Matriz MX</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Calendar size={12}/> Data de Emissão</p>
                    <p className="text-lg font-black uppercase tracking-tight">{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-20">
                {/* Radar Capability */}
                <div className="space-y-8">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] border-b-2 border-slate-100 pb-4">Radar de Capacidade Técnica</h3>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                                <Radar
                                    name="Especialista"
                                    dataKey="A"
                                    stroke="#4f46e5"
                                    fill="#4f46e5"
                                    fillOpacity={0.15}
                                    strokeWidth={2.5}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Horizons */}
                <div className="space-y-10">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] border-b-2 border-slate-100 pb-4">Horizontes de Crescimento</h3>
                    
                    <div className="space-y-8">
                        <div className="relative pl-8 border-l-4 border-indigo-600">
                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-1">06 Meses — Curto Prazo</span>
                            <p className="text-sm font-bold text-slate-700 italic leading-relaxed">"{pdi.meta_6m}"</p>
                        </div>
                        <div className="relative pl-8 border-l-4 border-amber-500">
                            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block mb-1">12 Meses — Médio Prazo</span>
                            <p className="text-sm font-bold text-slate-700 italic leading-relaxed">"{pdi.meta_12m}"</p>
                        </div>
                        <div className="relative pl-8 border-l-4 border-rose-500">
                            <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest block mb-1">24 Meses — Visão de Futuro</span>
                            <p className="text-sm font-bold text-slate-700 italic leading-relaxed">"{pdi.meta_24m}"</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mandatory Actions */}
            <div className="mb-20">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] border-b-2 border-slate-100 pb-4 mb-8">Plano de Ação Mandatário (Próximos 180 Dias)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[pdi.action_1, pdi.action_2, pdi.action_3, pdi.action_4, pdi.action_5].filter(Boolean).map((action, i) => (
                        <div key={i} className="flex gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 items-start">
                            <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center text-[10px] font-black shrink-0">0{i+1}</div>
                            <p className="text-xs font-bold text-slate-700 leading-relaxed">{action}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Signatures */}
            <div className="pt-20 mt-auto grid grid-cols-2 gap-20">
                <div className="text-center space-y-4">
                    <div className="border-t-2 border-slate-950 pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest">Assinatura do Especialista</p>
                        <p className="text-[8px] text-slate-400 uppercase mt-1">Concordância com as metas e prazos estipulados</p>
                    </div>
                </div>
                <div className="text-center space-y-4">
                    <div className="border-t-2 border-slate-950 pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest">Responsável Técnico (MX)</p>
                        <p className="text-[8px] text-slate-400 uppercase mt-1">Validação metodológica e suporte tático</p>
                    </div>
                </div>
            </div>

            <div className="mt-20 text-center">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">MX Gestão Preditiva — AIOX MASTER CERTIFIED SYSTEM</p>
            </div>

            <button 
                onClick={() => navigate(-1)}
                className="fixed bottom-8 right-8 px-8 py-4 bg-slate-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95 print:hidden"
            >
                Voltar ao Painel
            </button>
        </div>
    )
}
