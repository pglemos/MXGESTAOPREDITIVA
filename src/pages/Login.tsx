import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'motion/react'
import { 
    Building2, ArrowRight, ShieldCheck, Zap, TrendingUp, 
    Globe, Smartphone, Sparkles, User, Lock, Mail, RefreshCw 
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'

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
        } catch (err: any) {
            setError(err.message || 'Erro inesperado ao realizar login.')
            setLoading(false)
        }
    }

    const Feature = ({ icon: Icon, text }: { icon: any, text: string }) => (
        <div className="flex items-center gap-4 group/feat">
            <div className="w-10 h-10 rounded-mx-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 transition-all group-hover/feat:bg-brand-primary/20 group-hover/feat:border-brand-primary/30">
                <Icon size={18} className="text-white/40 group-hover/feat:text-white transition-colors" />
            </div>
            <Typography variant="tiny" tone="white" className="opacity-40 group-hover/feat:opacity-100 transition-opacity">{text}</Typography>
        </div>
    )

    if (authLoading && !profile) {
        return (
            <main className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center p-6 text-center">
                <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-6" />
                <Typography variant="caption" tone="white" className="animate-pulse tracking-widest uppercase font-black">Sincronizando Perfil MX...</Typography>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-surface-alt flex items-center justify-center p-4 sm:p-10 selection:bg-brand-primary selection:text-white relative overflow-hidden">

            <div className="absolute top-0 right-0 w-mx-hero h-mx-hero bg-brand-primary/5 rounded-full blur-mx-xl -mr-mx-lg -mt-mx-lg pointer-events-none" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 w-mx-xl h-mx-xl bg-status-success-surface rounded-full blur-mx-lg -ml-mx-lg -mb-mx-lg pointer-events-none" aria-hidden="true" />

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[1240px] bg-white ring-1 ring-border-default shadow-mx-elite rounded-mx-3xl md:rounded-mx-full overflow-hidden flex flex-col lg:flex-row relative z-10"
            >
                <section className="hidden lg:flex lg:w-[45%] bg-brand-secondary p-16 flex-col justify-between relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent z-0 pointer-events-none" />

                    <header className="relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-mx-2xl bg-white text-brand-secondary flex items-center justify-center shadow-mx-xl group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                <Building2 size={28} />
                            </div>
                            <Typography variant="h2" tone="white" className="text-2xl uppercase tracking-tighter">MX <span className="text-brand-primary">PERFORMANCE</span></Typography>
                        </div>
                    </header>

                    <div className="relative z-10">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="max-w-md"
                        >
                            <Badge variant="outline" className="text-brand-primary border-brand-primary/20 bg-brand-primary/5 px-6 py-2 rounded-full mb-10 shadow-mx-sm font-black uppercase text-tiny">
                                <Sparkles size={12} className="mr-2 fill-brand-primary" /> SISTEMA DE ELITE v4.0
                            </Badge>
                            <Typography variant="h1" tone="white" className="text-7xl leading-[0.9] mb-10 tracking-tighter uppercase">
                                Performance <br />
                                <span className="text-brand-primary underline decoration-indigo-500/20 underline-offset-8">Sob Controle.</span>
                            </Typography>
                            <Typography variant="p" tone="white" className="text-lg opacity-60 mb-14 leading-relaxed italic font-bold">
                                "A central de inteligência para quem não aceita nada menos que o topo da arena."
                            </Typography>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                            <Feature icon={Globe} text="Auditória 100% Online" />
                            <Feature icon={TrendingUp} text="Arena Meritocrática" />
                            <Feature icon={Zap} text="Protocolos Preditivos" />
                            <Feature icon={Smartphone} text="Mobile Experience" />
                        </div>
                    </div>

                    <footer className="relative z-10 pt-16 border-t border-white/5 flex items-center justify-between">
                        <Typography variant="tiny" tone="white" className="opacity-30 tracking-widest font-black uppercase">© MX CONSULTORIA</Typography>
                        <ShieldCheck size={20} className="text-white/20 hover:text-brand-primary transition-colors cursor-help" />
                    </footer>
                </section>

                <section className="w-full lg:w-[55%] flex items-center justify-center p-10 sm:p-24 relative bg-white">
                    <div className="w-full max-w-md">
                        <header className="lg:hidden flex items-center justify-center gap-4 mb-16">
                            <div className="w-12 h-12 rounded-mx-xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg">
                                <Building2 size={24} />
                            </div>
                            <Typography variant="h2" className="text-2xl uppercase">MX PERFORMANCE</Typography>
                        </header>

                        <div className="mb-14 text-center lg:text-left">
                            <Typography variant="h1" className="text-5xl mb-4 tracking-tighter">BEM-VINDO.</Typography>
                            <Typography variant="tiny" tone="muted" className="text-base font-black opacity-40">IDENTIFIQUE-SE PARA ACESSAR A MALHA.</Typography>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-10">
                            <div className="space-y-8">
                                <div className="space-y-3 group">
                                    <Typography variant="caption" tone="muted" className="ml-4 font-black uppercase group-focus-within:text-brand-primary transition-colors">E-mail Institucional</Typography>
                                    <div className="relative">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" size={18} />
                                        <Input
                                            type="email" value={email} onChange={e => setEmail(e.target.value)}
                                            placeholder="seu@email.com.br" required autoFocus
                                            className="!h-16 !pl-16 !rounded-mx-2xl !bg-surface-alt hover:!bg-white focus:!bg-white shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 group">
                                    <Typography variant="caption" tone="muted" className="ml-4 font-black uppercase group-focus-within:text-brand-primary transition-colors">Código de Acesso</Typography>
                                    <div className="relative">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" size={18} />
                                        <Input
                                            type="password" value={password} onChange={e => setPassword(e.target.value)}
                                            placeholder="••••••••" required
                                            className="!h-16 !pl-16 !rounded-mx-2xl !bg-surface-alt hover:!bg-white focus:!bg-white shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                                        <Card className="p-6 bg-status-error-surface border-status-error/20 flex items-center justify-center gap-4 shadow-mx-lg">
                                            <AlertCircle size={20} className="text-status-error" />
                                            <Typography variant="tiny" tone="error" className="font-black uppercase">{error}</Typography>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <footer className="pt-6">
                                <Button
                                    type="submit" disabled={loading}
                                    className="w-full h-20 text-xl font-black tracking-widest rounded-mx-full shadow-mx-elite hover:-translate-y-1 active:scale-95 transition-all relative overflow-hidden group/btn uppercase"
                                >
                                    {loading ? (
                                        <RefreshCw className="w-8 h-8 animate-spin" />
                                    ) : (
                                        <div className="flex items-center gap-6">
                                            ENTRAR NA MALHA <ArrowRight size={24} className="group-hover/btn:translate-x-2 transition-transform" strokeWidth={3} />
                                        </div>
                                    )}
                                </Button>

                                <Typography variant="tiny" tone="muted" className="mt-14 text-center block opacity-20 tracking-widest font-black uppercase">ACESSO RESTRITO • MX CONSULTORIA</Typography>
                            </footer>
                        </form>
                    </div>
                </section>
            </motion.div>
        </main>
    )
}

const AlertCircle = ({ size, className }: { size?: number, className?: string }) => (
    <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
)
