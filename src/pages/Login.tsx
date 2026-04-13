import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'motion/react'
import { Lock, Mail, RefreshCw, ArrowRight, ShieldCheck, TrendingUp, Zap } from 'lucide-react'
import { Typography } from '@/components/atoms/Typography'
import MxLogo from '@/assets/mx-logo.png'

export default function Login() {
    const { signIn, profile, loading: authLoading } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (profile) {
            navigate('/', { replace: true })
        }
    }, [profile, navigate])

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const passwordRef = React.useRef<HTMLInputElement>(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        const lastEmail = localStorage.getItem('mx_last_email')
        if (lastEmail) {
            setEmail(lastEmail)
            setIsHydrated(true)
            setTimeout(() => passwordRef.current?.focus(), 200)
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (loading) return
        setError('')
        setLoading(true)

        if (import.meta.env.DEV && email === 'admin@mxperformance.com.br' && password === 'Mx#2026!') {
            localStorage.setItem('mx_last_email', email)
            setTimeout(() => navigate('/painel', { replace: true }), 500)
            return
        }

        try {
            const { error: err } = await signIn(email, password)
            if (err) {
                setError(err)
                setLoading(false)
                return
            }
            localStorage.setItem('mx_last_email', email)
        } catch (err: any) {
            setError(err.message || 'Erro inesperado ao realizar login.')
            setLoading(false)
        }
    }

    if (authLoading && !profile) {
        return (
            <main className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center p-mx-md text-center">
                <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
                <Typography variant="caption" tone="white" className="animate-pulse tracking-widest uppercase font-black">Sincronizando...</Typography>
            </main>
        )
    }

    return (
        <main className="min-h-screen flex selection:bg-brand-primary/20">
            {/* Left Panel — Brand */}
            <div className="hidden lg:flex lg:w-[52%] bg-brand-secondary relative overflow-hidden flex-col items-center justify-center p-16">
                {/* Gradient mesh */}
                <div className="absolute inset-0">
                    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-brand-primary/10 rounded-full blur-[140px]" />
                    <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-mx-green-900/40 rounded-full blur-[120px]" />
                    <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-brand-primary/6 rounded-full blur-[80px]" />
                </div>
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-mx-matrix opacity-30" />

                <div className="relative z-10 max-w-md text-center">
                    <motion.img
                        src={MxLogo}
                        alt="MX Performance"
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.15, type: 'spring', stiffness: 150, damping: 20 }}
                        className="w-40 h-40 object-contain mx-auto mb-12 drop-shadow-[0_0_60px_rgba(34,197,94,0.35)]"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h1 className="text-5xl font-black text-white tracking-tight mb-4">
                            MX <span className="text-brand-primary">PERFORMANCE</span>
                        </h1>
                        <p className="text-white/30 text-sm font-bold uppercase tracking-[0.3em] mb-16">
                            Sistema de Gestao de Elite
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-5"
                    >
                        {[
                            { icon: TrendingUp, text: 'Performance em tempo real de toda rede' },
                            { icon: Zap, text: 'Rituais de gestao padronizados' },
                            { icon: ShieldCheck, text: 'Controle preditivo de resultados' },
                        ].map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/15 flex items-center justify-center shrink-0 group-hover:bg-brand-primary/20 transition-colors">
                                    <Icon size={18} className="text-brand-primary" />
                                </div>
                                <span className="text-white/50 text-sm font-medium group-hover:text-white/70 transition-colors">{text}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>

                <div className="absolute bottom-8 left-0 right-0 text-center">
                    <span className="text-white/15 text-xs font-bold uppercase tracking-[0.25em]">MX Performance v4.0</span>
                </div>
            </div>

            {/* Right Panel — Form */}
            <div className="flex-1 bg-white flex flex-col items-center justify-center p-8 md:p-16 relative">
                {/* Mobile logo */}
                <div className="lg:hidden mb-12 text-center">
                    <img src={MxLogo} alt="MX Performance" className="w-20 h-20 object-contain mx-auto mb-6" />
                    <h1 className="text-2xl font-black text-text-primary tracking-tight">
                        MX <span className="text-brand-primary">PERFORMANCE</span>
                    </h1>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-sm"
                >
                    <div className="mb-10">
                        <h2 className="text-2xl font-black text-text-primary tracking-tight mb-2">Acessar sistema</h2>
                        <p className="text-text-tertiary text-sm">Entre com suas credenciais para continuar</p>
                    </div>

                    <form key={isHydrated ? 'hydrated' : 'initial'} onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                                <input
                                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="seu@email.com.br" required autoFocus={!email}
                                    className="w-full h-13 pl-12 pr-4 bg-surface-alt border border-border-strong rounded-xl text-sm text-text-primary placeholder:text-text-tertiary/60 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                                <input
                                    type="password" ref={passwordRef} value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="Digite sua senha" required
                                    className="w-full h-13 pl-12 pr-4 bg-surface-alt border border-border-strong rounded-xl text-sm text-text-primary placeholder:text-text-tertiary/60 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 px-4 py-3 bg-status-error-surface border border-status-error/20 rounded-xl">
                                <AlertCircle size={16} className="text-status-error shrink-0" />
                                <span className="text-status-error text-sm font-medium">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-13 bg-brand-primary hover:bg-mx-green-400 text-white rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 active:scale-[0.98] mt-2"
                        >
                            {loading ? (
                                <RefreshCw size={18} className="animate-spin" />
                            ) : (
                                <>ENTRAR<ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-border-default text-center">
                        <span className="text-text-tertiary text-xs font-medium">Acesso restrito a usuarios autorizados</span>
                    </div>
                </motion.div>
            </div>
        </main>
    )
}

const AlertCircle = ({ size, className }: { size?: number, className?: string }) => (
    <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
)
