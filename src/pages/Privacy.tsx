import { Shield, Lock, FileText, ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'

export default function Privacy() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-8 selection:bg-[#1A1D20] selection:text-white relative overflow-hidden">

            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-indigo-50/50 rounded-full blur-[120px] -mr-[25vw] -mt-[25vw] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-emerald-50/30 rounded-full blur-[100px] -ml-[20vw] -mb-[20vw] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-4xl bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden flex flex-col relative z-10 border border-gray-100"
            >
                <div className="bg-[#1A1D20] p-10 md:p-14 relative overflow-hidden text-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent z-0 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px] opacity-20 pointer-events-none" />

                    <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/20 relative z-10 border border-indigo-500/30">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 relative z-10">Política de Privacidade</h1>
                    <p className="text-gray-400 font-bold max-w-xl mx-auto opacity-80 relative z-10">Diretrizes de proteção e tratamento de dados corporativos no ecossistema MX Gestão Preditiva.</p>
                </div>

                <div className="p-10 md:p-16 space-y-10 text-[#1A1D20]">
                    <div className="prose prose-lg max-w-none">
                        <p className="text-lg text-gray-500 font-bold mb-8">
                            A MX Gestão Preditiva respeita a privacidade dos seus usuários. Esta política descreve como coletamos, usamos e protegemos as informações trafegadas em nosso sistema, assegurando conformidade com as melhores práticas de governança de dados.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8 mb-12">
                            <div className="bg-[#F8FAFC] p-8 rounded-[2.5rem] border border-gray-100 group hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all">
                                <FileText size={24} className="text-indigo-500 mb-6 group-hover:scale-110 transition-transform" />
                                <h2 className="text-xl font-black mb-3 tracking-tight">Coleta de Métricas</h2>
                                <p className="text-sm font-bold text-gray-500 leading-relaxed">
                                    Registramos dados operacionais (volume de vendas, prospectos, agendamentos, conversões) alimentados voluntariamente pelos usuários em suas rotinas de check-in para gerar inteligência comercial.
                                </p>
                            </div>

                            <div className="bg-[#F8FAFC] p-8 rounded-[2.5rem] border border-gray-100 group hover:bg-white hover:shadow-xl hover:border-emerald-100 transition-all">
                                <Shield size={24} className="text-emerald-500 mb-6 group-hover:scale-110 transition-transform" />
                                <h2 className="text-xl font-black mb-3 tracking-tight">Aplicação Analítica</h2>
                                <p className="text-sm font-bold text-gray-500 leading-relaxed">
                                    As informações formam a base do nosso motor preditivo, alimentando dashboards de performance, matrizes de ranking e diagnósticos gerenciais de forma exclusiva dentro do ambiente do sistema.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                                <Lock className="text-indigo-500" size={24} /> Arquitetura de Segurança
                            </h2>
                            <p className="text-gray-500 font-bold leading-relaxed">
                                Implementamos protocolos rigorosos de criptografia em trânsito e em repouso. O controle de acesso é gerenciado através de Políticas de Segurança em Nível de Linha (Row-Level Security - RLS), garantindo que os usuários acessem rigorosamente apenas os conjuntos de dados pertinentes às suas credenciais e nível hierárquico.
                            </p>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-[#1A1D20] flex items-center gap-2 transition-colors px-6 py-3 rounded-full hover:bg-gray-50"
                        >
                            Voltar ao Sistema
                        </button>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-center sm:text-right">
                            MX CONSULTORIA LTDA © {new Date().getFullYear()} <br /> Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
