import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Link } from 'react-router-dom'

export default function Financeiro() {
    return (
        <main className="h-full w-full flex flex-col items-center justify-center p-mx-lg bg-surface-alt text-center">
            <Card className="max-w-md w-full p-10 md:p-14 border-none shadow-mx-xl bg-white flex flex-col items-center">
                <div className="w-20 h-20 rounded-mx-3xl bg-status-warning-surface text-status-warning flex items-center justify-center mb-8 border border-mx-amber-100 shadow-inner" aria-hidden="true">
                    <AlertTriangle size={40} strokeWidth={2.5} />
                </div>
                
                <Typography variant="h2" className="mb-4 uppercase tracking-tighter">Módulo <span className="text-status-warning">Descontinuado</span></Typography>
                <Typography variant="caption" tone="muted" className="max-w-xs mx-auto uppercase tracking-widest leading-relaxed mb-10 opacity-60 font-black text-xs">
                    O ambiente financeiro foi movido para o ecossistema legado (ERP) conforme diretrizes de governança MX.
                </Typography>

                <div className="w-full pt-8 border-t border-border-default">
                    <Button asChild variant="outline" className="w-full h-14 rounded-full font-black uppercase tracking-widest text-xs shadow-sm bg-white border-border-strong hover:border-brand-primary">
                        <Link to="/home">Retornar ao Cockpit</Link>
                    </Button>
                </div>
            </Card>
            
            <footer className="mt-8 flex items-center gap-2 opacity-20">
                <ShieldCheck size={14} />
                <Typography variant="caption" className="text-xs font-black uppercase tracking-widest">Protocolo de Segurança MX</Typography>
            </footer>
        </main>
    )
}
