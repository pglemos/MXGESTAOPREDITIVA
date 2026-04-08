import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'motion/react'
import { Building2, ArrowRight, ShieldCheck, Zap, TrendingUp, Globe, Smartphone, Sparkles, User, Lock, Mail, RefreshCw } from 'lucide-react'

export default function Login() {
    const { signIn, profile, loading: authLoading } = useAuth()
    const navigate = useNavigate()

    // 1. Unified Design System Audit - V2
    useEffect(() => {
        if (profile) {
            navigate('/', { replace: true })
        }
    }, [profile, navigate])

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (loading) return
        setError('')
        setLoading(true)
        try {
            const { error: err } = await signIn(email, password)
            if (err) { 
                setError(err)
                setLoading(false)
                return 
            }
            // After successful sign in, wait a bit for profile loading
            // The useAuth hook will handle the loading state
        } catch (err: any) {
            setError(err.message || 'Erro inesperado ao realizar login.')
            setLoading(false)
        }
    }

    const Feature = ({ icon: Icon, text }: { icon: any, text: string }) => (
        <div className="flex items-center gap-4 text-white/60">
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Icon size={18} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest">{text}</span>
        </div>
    )

    // If loading but we have a user and NO profile after some time, it might be a data issue
    const [showProfileError, setShowProfileError] = useState(false)
    useEffect(() => {
        let tid: any;
        if (authLoading && !profile) {
            tid = setTimeout(() => setShowProfileError(true), 5000)
        } else {
            setShowProfileError(false)
        }
        return () => clearTimeout(tid)
    }, [authLoading, profile])

    if (authLoading && !profile) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] animate-pulse">Sincronizando Perfil MX...</p>
                {showProfileError && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 max-w-xs">
                        <p className="text-xs text-rose-400 font-bold mb-4">A sincronização está demorando mais que o esperado.</p>
                        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all">Tentar Novamente</button>
                    </motion.div>
                )}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-surface-alt flex items-center justify-center p-4 selection:bg-brand-secondary selection:text-white relative overflow-hidden">

            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-indigo-50/50 rounded-full blur-[120px] -mr-[25vw] -mt-[25vw] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-emerald-50/30 rounded-full blur-[100px] -ml-[20vw] -mb-[20vw] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[1240px] bg-white ring-1 ring-gray-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)] rounded-[3rem] md:rounded-[4rem] overflow-hidden flex flex-col lg:flex-row relative z-10"
            >
                {/* Left Side: Brand / Marketing */}
                <div className="hidden lg:flex lg:w-[45%] bg-brand-secondary p-16 flex-col justify-between relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent z-0 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 font-black text-2xl text-white mb-20">
                            <div className="w-12 h-12 rounded-[1.5rem] bg-white text-text-primary flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                <Building2 size={24} />
                            </div>
                            <span className="tracking-tighter uppercase">MX PERFORMANCE</span>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="max-w-md"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-8">
                                <Sparkles size={12} className="fill-indigo-400" /> Sistema de Performance v2.0
                            </div>
                            <h1 className="text-6xl font-black tracking-tighter text-white mb-8 leading-[0.9]">
                                Performance <br />
                                <span className="text-indigo-400">sob controle.</span>
                            </h1>
                            <p className="text-gray-400 text-lg leading-relaxed font-bold mb-12 opacity-80">
                                A sua central de inteligência para monitoramento de metas em tempo real e análise de performance corporativa.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <Feature icon={Globe} text="Dashboard 100% Online" />
                            <Feature icon={TrendingUp} text="Ranking Elitizado" />
                            <Feature icon={Zap} text="Dados Preditivos" />
                            <Feature icon={Smartphone} text="Mobile Optimized" />
                        </div>
                    </div>

                    <div className="relative z-10 pt-16 border-t border-white/5 flex items-center justify-between">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">© {new Date().getFullYear()} MX CONSULTORIA</p>
                        <ShieldCheck size={20} className="text-gray-700 hover:text-indigo-400 transition-colors cursor-help" />
                    </div>

                    {/* Abstract elements */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px] opacity-20 pointer-events-none" />
                </div>

                {/* Right Side: Login Form */}
                <div className="w-full lg:w-[55%] flex items-center justify-center p-10 sm:p-24 relative bg-white">
                    <div className="w-full max-w-md">
                        <div className="lg:hidden flex items-center justify-center gap-4 font-black text-3xl mb-16 text-text-primary">
                            <div className="w-12 h-12 rounded-2xl bg-brand-secondary text-white flex items-center justify-center shadow-2xl">
                                <Building2 size={24} />
                            </div>
                            <span className="tracking-tighter uppercase">MX PERFORMANCE</span>
                        </div>

                        <div className="mb-12 text-center lg:text-left">
                            <h2 className="text-4xl font-black tracking-tighter text-text-primary mb-4">Acesse sua Conta</h2>
                            <p className="text-gray-400 text-base font-bold leading-relaxed opacity-60">Utilize suas credenciais corporativas para entrar na plataforma de gestão.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-3 group">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 group-focus-within:text-indigo-600 transition-colors">
                                        <Mail size={12} /> E-mail Institucional
                                    </label>
                                    <input
                                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="seu@email.com.br" required autoFocus
                                        className="w-full px-8 py-5 bg-surface-alt border border-gray-100 rounded-[2rem] text-base font-black text-text-primary placeholder:text-gray-300 focus:outline-none focus:bg-white focus:border-brand-primary focus:shadow-2xl focus:shadow-indigo-500/5 transition-all shadow-sm"
                                    />
                                </div>

                                <div className="space-y-3 group">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 group-focus-within:text-indigo-600 transition-colors">
                                        <Lock size={12} /> Código de Acesso
                                    </label>
                                    <input
                                        type="password" value={password} onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••" required
                                        className="w-full px-8 py-5 bg-surface-alt border border-gray-100 rounded-[2rem] text-base font-black text-text-primary placeholder:text-gray-300 focus:outline-none focus:bg-white focus:border-brand-primary focus:shadow-2xl focus:shadow-indigo-500/5 transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="px-8 py-5 bg-red-50/50 border border-red-100 text-red-600 text-sm rounded-[2rem] font-black text-center shadow-lg shadow-red-500/5"
                                    >
                                        ⚠️ {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="pt-6">
                                <button
                                    type="submit" disabled={loading}
                                    className="mx-button-primary w-full !h-20 !text-lg !tracking-widest relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {loading ? (
                                        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>Entrar na Plataforma <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" /></>
                                    )}
                                </button>

                                <p className="mt-10 text-center text-gray-400 text-[9px] font-black uppercase tracking-[0.4em] opacity-40">Acesso Restrito • MX CONSULTORIA LTDA</p>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
