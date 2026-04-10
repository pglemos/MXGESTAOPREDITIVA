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
    const passwordRef = React.useRef<HTMLInputElement>(null);
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        const lastEmail = localStorage.getItem('mx_last_email');
        console.log("DEBUG: E-mail recuperado do LocalStorage:", lastEmail);
        if (lastEmail) {
            setEmail(lastEmail);
            setIsHydrated(true);
            setTimeout(() => passwordRef.current?.focus(), 200);
        }
    }, [])

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
            localStorage.setItem('mx_last_email', email);
        } catch (err: any) {
            setError(err.message || 'Erro inesperado ao realizar login.')
            setLoading(false)
        }
    }

    const Feature = ({ icon: Icon, text }: { icon: any, text: string }) => (
        <div className="flex items-center gap-mx-sm group/feat">
            <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 transition-all group-hover/feat:bg-brand-primary/20 group-hover/feat:border-brand-primary/30">
                <Icon size={18} className="text-white/40 group-hover/feat:text-white transition-colors" />
            </div>
            <Typography variant="tiny" tone="white" className="opacity-40 group-hover/feat:opacity-100 transition-opacity">{text}</Typography>
        </div>
    )

    if (authLoading && !profile) {
        return (
            <main className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center p-mx-md text-center">
                <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
                <Typography variant="caption" tone="white" className="animate-pulse tracking-widest uppercase font-black">Sincronizando Perfil MX...</Typography>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-mx-md selection:bg-brand-primary/20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-mx-aside"
            >
                {/* Header Identidade */}
                <div className="mb-12 text-center">
                    <div className="w-mx-2xl h-mx-2xl rounded-mx-3xl bg-gradient-to-br from-brand-primary to-indigo-600 mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-brand-primary/20">
                        <Building2 className="text-white" size={32} />
                    </div>
                    <Typography variant="h1" className="text-3xl text-white tracking-tighter mb-2">MX PERFORMANCE</Typography>
                    <Typography variant="tiny" className="text-white/40 uppercase tracking-mx-wide font-bold">ACESSO AO SISTEMA DE ELITE</Typography>
                </div>

                {/* Card de Acesso */}
                <Card className="bg-[#121214] border-white/5 p-mx-lg rounded-mx-3xl shadow-2xl backdrop-blur-xl">
                    <form key={isHydrated ? 'hydrated' : 'initial'} onSubmit={handleSubmit} className="space-y-mx-md">
                        <div className="space-y-mx-xs">
                            <label className="text-mx-tiny font-black text-white/30 uppercase tracking-[0.15em] ml-1">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                <Input
                                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="seu@email.com.br" required autoFocus={!email}
                                    className="!h-14 !pl-12 !bg-[#1A1A1D] !border-none !text-white !rounded-2xl placeholder:text-white/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-mx-xs">
                            <label className="text-mx-tiny font-black text-white/30 uppercase tracking-[0.15em] ml-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                <Input
                                    type="password" ref={passwordRef} value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••" required
                                    className="!h-14 !pl-12 !bg-[#1A1A1D] !border-none !text-white !rounded-2xl placeholder:text-white/20"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit" disabled={loading}
                            className="w-full h-mx-14 !bg-white !text-black !rounded-2xl !font-black !text-xs !uppercase !tracking-mx-wide hover:bg-white/90 transition-all mt-4"
                        >
                            {loading ? 'ACESSANDO...' : 'ENTRAR NA MALHA'}
                        </Button>
                    </form>
                </Card>

                <div className="mt-8 text-center">
                    <Typography variant="tiny" className="text-white/20 uppercase tracking-widest">Acesso restrito • v4.0</Typography>
                </div>
            </motion.div>
        </main>
    )
}

const AlertCircle = ({ size, className }: { size?: number, className?: string }) => (
    <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
)
