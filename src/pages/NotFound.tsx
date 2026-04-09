import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Search, Zap, ShieldAlert } from 'lucide-react'
import { motion } from 'motion/react'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardContent } from '@/components/molecules/Card'

export default function NotFound() {
    const navigate = useNavigate()

    return (
        <main className="min-h-screen bg-surface-alt flex items-center justify-center p-4 sm:p-10 selection:bg-brand-primary selection:text-white relative overflow-hidden">

            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-brand-primary/5 rounded-full blur-[120px] -mr-[25vw] -mt-[25vw] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-status-error-surface rounded-full blur-[100px] -ml-[20vw] -mb-[20vw] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-2xl relative z-10"
            >
                <Card className="border-none shadow-mx-elite bg-white overflow-hidden flex flex-col">
                    <header className="bg-brand-secondary p-10 md:p-16 relative overflow-hidden text-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent z-0 pointer-events-none" />
                        
                        <motion.div
                            initial={{ rotate: -10, scale: 0.9 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
                            className="w-24 h-24 rounded-mx-3xl bg-white/10 text-white flex items-center justify-center mx-auto mb-8 shadow-mx-xl backdrop-blur-xl relative z-10 border border-white/10"
                        >
                            <ShieldAlert size={48} strokeWidth={2.5} />
                        </motion.div>
                        <Typography variant="h1" tone="white" className="text-7xl md:text-9xl mb-4 relative z-10 font-mono-numbers">404</Typography>
                        <Typography variant="p" tone="white" className="max-w-xl mx-auto opacity-60 relative z-10 uppercase tracking-[0.4em] font-black text-xs">Ponto Fora da Malha</Typography>
                    </header>

                    <CardContent className="p-10 md:p-16 text-center flex flex-col items-center gap-10">
                        <div className="max-w-md space-y-4">
                            <Typography variant="h2" className="text-2xl">Destino Inexistente</Typography>
                            <Typography variant="p" tone="muted" className="text-base leading-relaxed font-bold italic opacity-60">
                                "A coordenada solicitada não foi localizada nos servidores de inteligência MX. A rota pode ter sido alterada ou o acesso expirou."
                            </Typography>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
                            <Button 
                                variant="outline" onClick={() => navigate(-1)} 
                                className="w-full sm:w-auto h-14 px-10 rounded-full font-black uppercase tracking-widest text-[10px] shadow-sm bg-white"
                            >
                                <ArrowLeft size={16} className="mr-2" /> RECUAR
                            </Button>
                            <Button 
                                onClick={() => navigate('/')} 
                                className="w-full sm:w-auto h-14 px-12 rounded-full shadow-mx-xl font-black uppercase tracking-widest text-[10px]"
                            >
                                <Zap size={16} className="mr-2 fill-current" /> CENTRAL DE COMANDO
                            </Button>
                        </div>

                        <footer className="pt-10 border-t border-border-default w-full">
                            <Typography variant="caption" tone="muted" className="text-[9px] font-black uppercase tracking-[0.6em] opacity-20">MX PERFORMANCE • PROTOCOLO AIOX</Typography>
                        </footer>
                    </CardContent>
                </Card>
            </motion.div>
        </main>
    )
}
