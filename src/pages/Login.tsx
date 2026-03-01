import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'motion/react'
import { Building2 } from 'lucide-react'

export default function Login() {
    const { signIn, profile } = useAuth()
    const navigate = useNavigate()

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
        setError('')
        setLoading(true)
        const { error: err } = await signIn(email, password)
        if (err) { setError(err); setLoading(false); return }
        window.location.href = '/'
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 selection:bg-blue-100 selection:text-blue-900">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[1000px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.05)] rounded-[40px] overflow-hidden flex flex-col lg:flex-row relative z-10"
            >
                {/* Left Side: Brand / Marketing */}
                <div className="hidden lg:flex lg:w-[45%] bg-slate-900 p-12 flex-col justify-between relative">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 font-extrabold text-xl text-white mb-12">
                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                <Building2 size={20} className="text-white" />
                            </div>
                            MX Gestão
                        </div>
                    </div>

                    <div className="relative z-10 max-w-sm">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
                            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-6 leading-tight">Gestão inteligente e preditiva.</h1>
                            <p className="text-slate-400 text-base leading-relaxed font-medium">
                                Acesso restrito ao sistema de acompanhamento corporativo. Monitore resultados e tome decisões baseadas em dados consolidados.
                            </p>
                        </motion.div>
                    </div>

                    <div className="relative z-10 flex flex-col gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        <p>© {new Date().getFullYear()} MX Consultoria.</p>
                    </div>

                    {/* Decorative abstract elements */}
                    <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[80px]" />
                    <div className="absolute top-10 -right-10 w-48 h-48 bg-purple-500/20 rounded-full blur-[60px]" />
                </div>

                {/* Right Side: Login Form */}
                <div className="w-full lg:w-[55%] flex items-center justify-center p-8 sm:p-16 relative bg-white">
                    <div className="w-full max-w-sm">
                        <div className="lg:hidden flex items-center justify-center gap-3 font-extrabold text-2xl mb-10 text-slate-800">
                            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-black/10">
                                <Building2 size={20} className="text-white" />
                            </div>
                            MX Gestão
                        </div>

                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-[28px] font-extrabold tracking-tight text-slate-900 mb-2">Bem-vindo</h2>
                            <p className="text-slate-500 text-sm font-medium">Faça login com sua credencial corporativa.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">E-mail</label>
                                    <input
                                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="nome@empresa.com.br" required autoFocus
                                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-base font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-slate-400 focus:bg-white transition-all shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Senha</label>
                                    <input
                                        type="password" value={password} onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••" required
                                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-base font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-slate-400 focus:bg-white transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="px-5 py-4 bg-red-50/80 border border-red-100 text-red-600 text-sm rounded-2xl font-semibold flex items-center justify-center text-center">
                                    {error}
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit" disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-4 rounded-full text-base font-bold transition-all disabled:opacity-70 shadow-lg shadow-slate-900/20 active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        "Acessar Plataforma"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
