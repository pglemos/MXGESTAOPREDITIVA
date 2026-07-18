import { ChevronRight, Database, FileText, ListChecks, Sparkles } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { ConsultingParametersView } from '@/features/consultoria/components/ConsultingParametersView'

export function ConsultoriaPmrTab() {
    return (
        <div className="space-y-8">
            <Card className="p-8 border-none shadow-sm bg-gray-950 text-white relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-emerald-600">
                        <Sparkles size={28} />
                    </div>
                    <div className="flex-1 space-y-2">
                        <Typography variant="h3" tone="white" className="uppercase tracking-tight">Parâmetros da Consultoria PMR</Typography>
                        <Typography variant="caption" tone="white" className="uppercase tracking-widest font-black opacity-60">
                            Conjuntos ativos, programas de visita, métricas e diagnósticos
                        </Typography>
                    </div>
                </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
                <ShortcutCard
                    icon={<Database size={22} />}
                    label="Conjuntos de Parâmetros"
                    desc="Versionamento dos parâmetros PMR ativos por programa"
                    badge="Ativo"
                />
                <ShortcutCard
                    icon={<ListChecks size={22} />}
                    label="Programas de Visita"
                    desc="Mapeamento de visitas e blocos por programa de consultoria"
                    badge="7 visitas"
                />
                <ShortcutCard
                    icon={<FileText size={22} />}
                    label="Catálogo de Métricas"
                    desc="Indicadores acompanhados ao longo do programa"
                    badge="Sincronizado"
                />
            </div>

            {/* Embed da view existente */}
            <div className="rounded-2xl overflow-hidden border border-gray-100">
                <ConsultingParametersView />
            </div>
        </div>
    )
}

function ShortcutCard({ icon, label, desc, badge }: { icon: React.ReactNode; label: string; desc: string; badge: string }) {
    return (
        <Card className="p-6 border-none shadow-sm bg-white">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-emerald-600 flex items-center justify-center">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <Typography variant="caption" className="font-black uppercase tracking-tight">{label}</Typography>
                        <Badge variant="success" className="text-[9px] font-black uppercase shrink-0">{badge}</Badge>
                    </div>
                    <Typography variant="tiny" tone="muted" className="font-bold leading-relaxed mt-1">{desc}</Typography>
                </div>
            </div>
        </Card>
    )
}
