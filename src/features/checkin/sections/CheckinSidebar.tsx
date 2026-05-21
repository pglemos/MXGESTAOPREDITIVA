import { ShieldCheck, Zap } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { CHECKIN_DEADLINE_LABEL, CHECKIN_EDIT_LIMIT_LABEL } from '@/hooks/useCheckins'

interface CheckinSidebarProps {
    totalsVnd: number
}

/**
 * CheckinSidebar — aside informativo com o contrato MX e o card preto de
 * impacto em rede (vendas totais).
 */
export function CheckinSidebar({ totalsVnd }: CheckinSidebarProps) {
    return (
        <aside className="lg:w-mx-aside space-y-mx-lg shrink-0">
            <Card className="p-mx-10 border-none shadow-mx-lg bg-white space-y-mx-10">
                <header className="flex items-center gap-mx-sm border-b border-border-default pb-8">
                    <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-status-success-surface text-status-success flex items-center justify-center shadow-inner"><ShieldCheck size={24} /></div>
                    <Typography variant="h3">Contrato MX</Typography>
                </header>
                <ul className="space-y-mx-lg">
                    {[
                        `Envie o registro diário até ${CHECKIN_DEADLINE_LABEL}.`,
                        `Correções ficam disponíveis até ${CHECKIN_EDIT_LIMIT_LABEL}.`,
                        'A agenda de hoje determina o ritmo de amanhã.',
                        'Justificativa obrigatória para KPIs zerados.',
                    ].map((text, i) => (
                        <li key={i} className="flex gap-mx-sm items-start group">
                            <div className="w-mx-md h-mx-md rounded-mx-full bg-surface-alt flex items-center justify-center shrink-0 mt-0.5 font-black text-mx-tiny text-text-tertiary shadow-sm border border-border-default group-hover:bg-brand-primary group-hover:text-white transition-all" aria-hidden="true">{i + 1}</div>
                            <Typography variant="p" tone="muted" className="text-xs font-black uppercase tracking-tight leading-relaxed group-hover:text-text-primary transition-colors">{text}</Typography>
                        </li>
                    ))}
                </ul>
            </Card>

            <Card className="p-mx-10 bg-pure-black text-white border-none shadow-mx-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent pointer-events-none z-0" aria-hidden="true" />
                <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700" aria-hidden="true">
                    <Zap size={240} fill="currentColor" />
                </div>
                <div className="relative z-10">
                    <Typography variant="caption" tone="white" className="tracking-mx-widest mb-10 block">IMPACTO EM REDE</Typography>
                    <div className="flex items-baseline gap-mx-sm mb-6">
                        <Typography variant="h1" tone="white" className="text-8xl tabular-nums leading-none tracking-tighter" aria-live="polite">{totalsVnd}</Typography>
                        <Typography variant="h3" tone="brand" className="text-xl">VENDAS</Typography>
                    </div>
                    <Typography variant="p" tone="white" className="text-sm font-bold leading-relaxed opacity-60 uppercase tracking-tight italic">
                        "O sucesso é o somatório de registros precisos e execução impecável."
                    </Typography>
                </div>
            </Card>
        </aside>
    )
}
