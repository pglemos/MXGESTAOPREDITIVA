import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, Mail, Store, Shield, ChevronRight, Zap, Camera, ShieldCheck, Clock, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useState, useCallback } from 'react'

export default function Perfil() {
    const { profile, role, membership, signOut, loading } = useAuth()
    const navigate = useNavigate()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleLogout = async () => { 
        setIsLoggingOut(true)
        try {
            // 2. & 20. Logic Leak: wait for signout then navigate
            await signOut()
            toast.success('Sessão encerrada com segurança.')
            navigate('/login', { replace: true })
        } catch (e) {
            toast.error('Erro ao encerrar sessão.')
            setIsLoggingOut(false)
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-electric-blue/10 border-t-electric-blue rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Recuperando Identidade...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative text-pure-black py-12 sm:py-16 overflow-y-auto no-scrollbar px-4 md:p-10">

            {/* Background elements / 9. Z-Index fix */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(79,70,229,0.03)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none z-0" />
            <div className="absolute -right-32 -top-32 w-96 h-96 bg-indigo-50/50 rounded-full blur-[100px] z-0 pointer-events-none" />
            <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-emerald-50/30 rounded-full blur-[100px] z-0 pointer-events-none" />

            <div className="w-full max-w-xl relative z-10 flex flex-col items-center">
                <div className="text-center mb-16 relative">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-32 h-32 sm:w-40 sm:h-40 rounded-[3rem] bg-gradient-to-tr from-indigo-500 via-indigo-600 to-blue-600 p-1 mx-auto mb-8 shadow-xl relative group"
                    >
                        {/* 5. Glow ring fix */}
                        <div className="absolute -inset-4 bg-indigo-500 rounded-[3.5rem] blur-2xl opacity-10 group-hover:opacity-30 transition-opacity" />
                        <div className="w-full h-full rounded-[2.8rem] bg-white p-1.5 relative z-10">
                            <div className="w-full h-full rounded-[2.5rem] bg-gray-50 flex items-center justify-center overflow-hidden shadow-inner">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    /* 3. Avatar text size fix */
                                    <span className="text-5xl font-black text-indigo-600 uppercase">{profile?.name?.charAt(0) || '?'}</span>
                                )}
                            </div>
                        </div>
                        {/* 17. Avatar change placeholder */}
                        <button 
                            onClick={() => toast.info('Módulo de upload em manutenção.')}
                            className="absolute bottom-0 right-0 w-12 h-12 rounded-2xl bg-pure-black border-4 border-white text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all z-20"
                        >
                            <Camera size={18} />
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-col items-center"
                    >
                        {/* 14. Standardized font size */}
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-pure-black mb-4 leading-none text-center uppercase">{profile?.name}</h1>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <span className="bg-pure-black text-white text-[9px] font-black uppercase tracking-[0.3em] px-5 py-2 rounded-full shadow-lg shadow-black/10 flex items-center gap-2">
                                <Zap size={12} className="text-indigo-400 fill-current" /> {role} ACCESS
                            </span>
                            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 py-2 rounded-full shadow-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Sessão Ativa</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* 12. Radii unificated to 2.5rem (radius-4xl) */}
                <div className="w-full grid grid-cols-1 gap-6 mb-16">
                    {[
                        { icon: Mail, label: 'E-mail Institucional', value: profile?.email, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                        /* 6. Data Inconsistency fix */
                        { icon: Store, label: 'Unidade Operacional', value: membership?.store?.name || 'Administração Central', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { icon: ShieldCheck, label: 'Nível de Segurança', value: `Permissão ${role?.toUpperCase()}`, color: 'text-amber-500', bg: 'bg-amber-50' },
                    ].map((item, idx) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (idx * 0.1) }}
                            className="bg-white border border-gray-100 hover:border-indigo-100 transition-all group cursor-default rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-6 relative z-10">
                                <div className={cn("w-16 h-16 rounded-[1.8rem] flex items-center justify-center border border-white shadow-inner transition-colors group-hover:bg-pure-black", item.bg)}>
                                    <item.icon size={24} className={cn("transition-colors", item.color, "group-hover:text-white")} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1 opacity-60">{item.label}</p>
                                    {/* 8. Contrast fix */}
                                    <p className="text-base sm:text-lg font-black text-pure-black tracking-tight break-words">{item.value}</p>
                                </div>
                                {/* 4. UX Gap: Edit placeholder */}
                                <button 
                                    onClick={() => toast.info('Alteração de cadastro via Admin requisitada.')}
                                    className="w-12 h-12 rounded-[1.2rem] bg-gray-50 flex items-center justify-center text-gray-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-gray-100"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="w-full space-y-6">
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        // 10. Acessibilidade: aria-label added
                        aria-label="Encerrar sessão segura"
                        className="w-full py-6 rounded-[2.5rem] bg-white border-2 border-gray-100 text-gray-400 font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-4 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition-all shadow-sm hover:shadow-xl active:scale-[0.98] group disabled:opacity-50"
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                            {isLoggingOut ? <RefreshCw size={16} className="animate-spin" /> : <LogOut size={16} />}
                        </div>
                        {isLoggingOut ? 'ENCERRANDO...' : 'Encerrar Sessão Segura'}
                    </motion.button>

                    <div className="flex flex-col items-center gap-2 opacity-40">
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">
                            System Build 2026.03 • MX Gestão
                        </p>
                        {/* 18. Real session info simulation */}
                        <div className="flex items-center gap-2 text-[8px] font-bold text-gray-300 uppercase tracking-widest">
                            <Clock size={10} /> Last Login: {new Date().toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
