import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, Mail, Store, Shield, ChevronRight, Zap } from 'lucide-react'
import { motion } from 'motion/react'

export default function Perfil() {
    const { profile, role, membership, signOut } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => { await signOut(); navigate('/login') }

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col items-center justify-center relative text-[#1A1D20] py-12 sm:py-16 overflow-y-auto no-scrollbar px-4 md:px-10">

            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(79,70,229,0.03)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />
            <div className="absolute -right-32 -top-32 w-96 h-96 bg-indigo-50/50 rounded-full blur-[100px] z-0 pointer-events-none" />
            <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-emerald-50/30 rounded-full blur-[100px] z-0 pointer-events-none" />

            <div className="w-full max-w-xl relative z-10 flex flex-col items-center">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-32 h-32 sm:w-40 sm:h-40 rounded-[3rem] bg-gradient-to-tr from-indigo-500 via-indigo-600 to-blue-600 p-1 mx-auto mb-8 shadow-[0_30px_60px_-15px_rgba(79,70,229,0.3)] relative group"
                    >
                        <div className="absolute -inset-4 bg-indigo-500 rounded-[3.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="w-full h-full rounded-[2.8rem] bg-white p-1.5 relative z-10">
                            <div className="w-full h-full rounded-[2.5rem] bg-[#F8FAFC] flex items-center justify-center">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-[2.5rem]" />
                                ) : (
                                    <span className="text-6xl font-black text-indigo-600">{profile?.name?.charAt(0) || '?'}</span>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-col items-center"
                    >
                        <h1 className="text-[34px] sm:text-[40px] font-black tracking-tighter text-[#1A1D20] mb-3 leading-none text-center">{profile?.name}</h1>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <span className="bg-[#1A1D20] text-white text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full shadow-lg shadow-black/10 flex items-center gap-2">
                                <Zap size={12} className="text-indigo-400" /> {role}
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Active Session</span>
                        </div>
                    </motion.div>
                </div>

                <div className="w-full grid grid-cols-1 gap-6 mb-16">
                    {[
                        { icon: Mail, label: 'Email Institucional', value: profile?.email, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                        { icon: Store, label: 'Unidade de Trabalho', value: (membership as any)?.store?.name || 'Administração Central', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { icon: Shield, label: 'Nível de Permissão', value: `Acesso Nível ${role?.toUpperCase()}`, color: 'text-amber-500', bg: 'bg-amber-50' },
                    ].map((item, idx) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (idx * 0.1) }}
                            className="inner-card p-5 sm:p-6 bg-white border border-gray-100 hover:border-indigo-100/50 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all group cursor-default rounded-[2.5rem]"
                        >
                            <div className="flex items-center gap-4 sm:gap-6">
                                <div className={`w-16 h-16 rounded-[1.8rem] ${item.bg} flex items-center justify-center border border-white shadow-inner group-hover:bg-[#1A1D20] transition-colors`}>
                                    <item.icon size={24} className={`${item.color} group-hover:text-white transition-colors`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1 opacity-60">{item.label}</p>
                                    <p className="text-base sm:text-lg font-black text-[#1A1D20] tracking-tight break-words">{item.value}</p>
                                </div>
                                <div className="w-12 h-12 rounded-[1.2rem] bg-[#F8FAFC] flex items-center justify-center text-gray-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={handleLogout}
                    className="w-full py-6 rounded-[3rem] bg-white border-2 border-gray-100/50 text-gray-400 font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition-all shadow-sm hover:shadow-xl active:scale-[0.98] group"
                >
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                        <LogOut size={16} />
                    </div>
                    Encerrar Sessão Segura
                </motion.button>

                <p className="text-center mt-12 text-[9px] font-black text-gray-300 uppercase tracking-[0.4em] opacity-40">
                    System Build 2026.03 • MX Gestão
                </p>
            </div>
        </div>
    )
}
