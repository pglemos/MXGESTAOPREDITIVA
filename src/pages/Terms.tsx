import { AlertTriangle, FileText, Lock, ChevronRight, Zap } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'

export default function Terms() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-surface-alt flex items-center justify-center p-4 sm:p-8 selection:bg-brand-secondary selection:text-white relative overflow-hidden">

            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-rose-50/50 rounded-full blur-[120px] -mr-[25vw] -mt-[25vw] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-indigo-50/30 rounded-full blur-[100px] -ml-[20vw] -mb-[20vw] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-4xl bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden flex flex-col relative z-10 border border-gray-100"
            >
                <div className="bg-brand-secondary p-10 md:p-14 relative overflow-hidden text-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 to-transparent z-0 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px] opacity-20 pointer-events-none" />

                    <div className="w-20 h-20 rounded-[2rem] bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-6 shadow-[0_20px_40px_-10px_rgba(244,63,94,0.3)] relative z-10 border border-rose-500/30">
                        <FileText size={32} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 relative z-10">Termos de Serviço</h1>
                    <p className="text-gray-400 font-bold max-w-xl mx-auto opacity-80 relative z-10">Condições gerais de provimento e acesso ao conjunto de ferramentas MX PERFORMANCE.</p>
                </div>

                <div className="p-10 md:p-16 space-y-10 text-text-primary">
                    <div className="prose prose-lg max-w-none">
                        <p className="text-lg text-gray-500 font-bold mb-8">
                            O acesso contínuo e a utilização do sistema MX PERFORMANCE caracterizam concordância incondicional com as diretrizes e regras aqui estipuladas. Recomendamos leitura atenta desta documentação.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8 mb-12">
                            <div className="bg-surface-alt p-8 rounded-[2.5rem] border border-gray-100 group hover:bg-white hover:shadow-xl hover:border-rose-100 transition-all">
                                <Lock size={24} className="text-rose-500 mb-6 group-hover:scale-110 transition-transform" />
                                <h2 className="text-xl font-black mb-3 tracking-tight">Autoridade de Acesso</h2>
                                <p className="text-sm font-bold text-gray-500 leading-relaxed">
                                    O portal é dedicado restritamente a colaboradores com credenciais validadas pela diretoria da MX Consultoria. Cada agente homologado responde integralmente por manter suas chaves seguras e intransferíveis.
                                </p>
                            </div>

                            <div className="bg-surface-alt p-8 rounded-[2.5rem] border border-gray-100 group hover:bg-white hover:shadow-xl hover:border-amber-100 transition-all">
                                <AlertTriangle size={24} className="text-amber-500 mb-6 group-hover:scale-110 transition-transform" />
                                <h2 className="text-xl font-black mb-3 tracking-tight">Obrigações e Sanções</h2>
                                <p className="text-sm font-bold text-gray-500 leading-relaxed">
                                    Os membros devem prover a plataforma apenas com dados operativos factuais. O envio recorrente de distorções prejudica a inteligência do sistema e autoriza o encerramento do contrato de acesso sem aviso.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                                <Zap className="text-rose-500" size={24} /> Desempenho
                            </h2>
                            <p className="text-gray-500 font-bold leading-relaxed">
                                As informações transacionadas via interface (Check-ins, Atualizações de Meta, Feedbacks) não servem para processamentos fiscais, sendo estritamente consultórias. A MX assegura as melhores tecnologias para processamento dos índices preditivos com alta disponibilidade.
                            </p>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-text-primary flex items-center gap-2 transition-colors px-6 py-3 rounded-full hover:bg-gray-50"
                        >
                            Voltar ao Sistema
                        </button>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-center sm:text-right">
                            MX CONSULTORIA LTDA © {new Date().getFullYear()} <br /> Plataforma Licenciada.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
