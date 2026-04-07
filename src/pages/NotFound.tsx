import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Search, Zap } from 'lucide-react'
import { motion } from 'motion/react'

export default function NotFound() {
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
                className="w-full max-w-2xl bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden flex flex-col relative z-10 border border-gray-100"
            >
                <div className="bg-brand-secondary p-10 md:p-14 relative overflow-hidden text-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 to-transparent z-0 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px] opacity-20 pointer-events-none" />

                    <motion.div
                        initial={{ rotate: -10, scale: 0.9 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
                        className="w-24 h-24 rounded-[2rem] bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-6 shadow-[0_20px_40px_-10px_rgba(244,63,94,0.3)] relative z-10 border border-rose-500/30"
                    >
                        <Search size={40} />
                    </motion.div>
                    <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4 relative z-10">404</h1>
                    <p className="text-gray-400 font-bold max-w-xl mx-auto opacity-80 relative z-10 text-lg uppercase tracking-[0.3em]">Destino Inexistente</p>
                </div>

                <div className="p-10 md:p-14 space-y-10 text-center flex flex-col items-center">

                    <div className="max-w-md">
                        <p className="text-lg text-gray-500 font-bold mb-2">Parece que você se perdeu na navegação.</p>
                        <p className="text-sm font-bold text-gray-400">A página que você está procurando foi movida, excluída ou possivelmente nunca existiu. Verifique o link e tente novamente.</p>
                    </div>

                    <div className="h-px w-24 bg-gray-100 my-4" />

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full sm:w-auto px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-text-primary hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all flex items-center justify-center gap-3"
                        >
                            <ArrowLeft size={16} /> Voltar
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full sm:w-auto px-10 py-5 rounded-[2rem] bg-indigo-600 text-white font-black flex items-center justify-center gap-3 hover:bg-indigo-700 hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group/btn"
                        >
                            <Zap size={16} className="text-indigo-300 group-hover/btn:scale-110 transition-transform" /> Início do Sistema
                        </button>
                    </div>

                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-center mt-4">
                        MX PERFORMANCE © {new Date().getFullYear()}
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
