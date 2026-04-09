import { AlertTriangle, FileText, Lock, ChevronRight, Zap, ShieldCheck, ArrowLeft } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardContent } from '@/components/molecules/Card'

export default function Terms() {
    const navigate = useNavigate()

    return (
        <main className="min-h-screen bg-surface-alt flex items-center justify-center p-4 sm:p-10 selection:bg-brand-primary selection:text-white relative overflow-hidden">

            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-brand-primary/5 rounded-full blur-[120px] -mr-[25vw] -mt-[25vw] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-status-success-surface rounded-full blur-[100px] -ml-[20vw] -mb-[20vw] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-4xl"
            >
                <Card className="border-none shadow-mx-elite bg-white overflow-hidden flex flex-col relative z-10">
                    <header className="bg-brand-secondary p-10 md:p-16 relative overflow-hidden text-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent z-0 pointer-events-none" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px] opacity-20 pointer-events-none" />

                        <div className="w-20 h-20 rounded-mx-3xl bg-white/10 text-white flex items-center justify-center mx-auto mb-8 shadow-mx-xl backdrop-blur-xl relative z-10 border border-white/10">
                            <FileText size={32} strokeWidth={2.5} />
                        </div>
                        <Typography variant="h1" tone="white" className="text-4xl md:text-5xl mb-4 relative z-10">Termos de <span className="text-brand-primary">Serviço</span></Typography>
                        <Typography variant="p" tone="white" className="max-w-xl mx-auto opacity-60 relative z-10 uppercase tracking-widest font-black text-xs">CONTRATO DE LICENCIAMENTO & USO MX PERFORMANCE</Typography>
                    </header>

                    <CardContent className="p-10 md:p-20 space-y-14">
                        <div className="space-y-10">
                            <Typography variant="p" className="text-xl font-bold text-text-secondary leading-relaxed border-l-4 border-brand-primary pl-8 italic">
                                "O acesso contínuo e a utilização do sistema MX PERFORMANCE caracterizam concordância incondicional com as diretrizes e protocolos de segurança aqui estipulados."
                            </Typography>

                            <div className="grid md:grid-cols-2 gap-8">
                                <Card className="bg-surface-alt p-10 rounded-[2.5rem] border-none shadow-inner group hover:bg-white hover:shadow-mx-lg transition-all">
                                    <div className="w-14 h-14 rounded-mx-xl bg-mx-indigo-50 text-brand-primary flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                                        <Lock size={24} strokeWidth={2.5} />
                                    </div>
                                    <Typography variant="h3" className="mb-4 uppercase tracking-tight">Autoridade de Acesso</Typography>
                                    <Typography variant="p" tone="muted" className="text-sm font-bold leading-relaxed">
                                        O portal é dedicado restritamente a colaboradores com credenciais validadas. Cada agente responde pela segurança de suas chaves.
                                    </Typography>
                                </Card>

                                <Card className="bg-surface-alt p-10 rounded-[2.5rem] border-none shadow-inner group hover:bg-white hover:shadow-mx-lg transition-all">
                                    <div className="w-14 h-14 rounded-mx-xl bg-status-warning-surface text-status-warning flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                                        <AlertTriangle size={24} strokeWidth={2.5} />
                                    </div>
                                    <Typography variant="h3" className="mb-4 uppercase tracking-tight">Obrigações & Sanções</Typography>
                                    <Typography variant="p" tone="muted" className="text-sm font-bold leading-relaxed">
                                        O provimento de dados deve ser factual. Distorções recorrentes autorizam o encerramento do acesso por quebra de governança.
                                    </Typography>
                                </Card>
                            </div>

                            <div className="space-y-6 pt-10 border-t border-border-default">
                                <header className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-mx-lg bg-mx-black text-indigo-400 flex items-center justify-center shadow-mx-lg"><Zap size={20} /></div>
                                    <Typography variant="h2" className="text-2xl uppercase tracking-tighter">Desempenho e Disponibilidade</Typography>
                                </header>
                                <Typography variant="p" tone="muted" className="text-base font-bold leading-relaxed">
                                    As informações transacionadas via interface (Check-ins, Metas, Feedbacks) são estritamente para fins de consultoria operacional. A MX assegura as melhores tecnologias para processamento dos índices preditivos com alta disponibilidade.
                                </Typography>
                            </div>
                        </div>

                        <footer className="pt-10 border-t border-border-default flex flex-col sm:flex-row items-center justify-between gap-10">
                            <Button variant="ghost" onClick={() => navigate(-1)} className="text-[10px] font-black uppercase tracking-[0.3em] text-text-tertiary hover:text-brand-primary">
                                <ArrowLeft size={16} className="mr-2" /> VOLTAR AO SISTEMA
                            </Button>
                            <div className="text-center sm:text-right space-y-1">
                                <Typography variant="caption" tone="muted" className="text-[9px] font-black uppercase tracking-widest opacity-40">MX CONSULTORIA LTDA © {new Date().getFullYear()}</Typography>
                                <Typography variant="caption" tone="muted" className="text-[8px] font-black uppercase tracking-[0.4em] opacity-20">PLATAFORMA LICENCIADA</Typography>
                            </div>
                        </footer>
                    </CardContent>
                </Card>
            </motion.div>
        </main>
    )
}
