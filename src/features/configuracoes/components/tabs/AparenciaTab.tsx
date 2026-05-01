import { useEffect, useState } from 'react'
import { Palette, Moon, Sun, Monitor, Sparkles } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { toast } from 'sonner'

type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'mx_theme_preference'

export function AparenciaTab() {
    const [theme, setTheme] = useState<Theme>('light')
    const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')

    useEffect(() => {
        const saved = (typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null) as Theme | null
        if (saved) setTheme(saved)
    }, [])

    const applyTheme = (t: Theme) => {
        setTheme(t)
        localStorage.setItem(THEME_KEY, t)
        if (t === 'dark') {
            document.documentElement.classList.add('dark')
            toast.success('Modo escuro ativado.')
        } else if (t === 'light') {
            document.documentElement.classList.remove('dark')
            toast.success('Modo claro ativado.')
        } else {
            const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches
            document.documentElement.classList.toggle('dark', prefers)
            toast.success('Tema seguindo preferência do sistema.')
        }
    }

    return (
        <div className="space-y-mx-lg">
            {/* Tema */}
            <Card className="p-mx-lg md:p-mx-xl border-none shadow-mx-lg bg-white">
                <header className="flex items-center gap-mx-sm pb-mx-md border-b border-border-default mb-mx-lg">
                    <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-mx-indigo-50 text-brand-primary flex items-center justify-center border border-mx-indigo-100">
                        <Palette size={26} />
                    </div>
                    <div>
                        <Typography variant="h3" className="uppercase tracking-tight">Tema Visual</Typography>
                        <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black">Modo de exibição da interface</Typography>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-md">
                    <ThemeOption icon={<Sun size={22} />} label="Claro" desc="Interface clara padrão MX" active={theme === 'light'} onClick={() => applyTheme('light')} />
                    <ThemeOption icon={<Moon size={22} />} label="Escuro" desc="Conforto visual em ambientes escuros" active={theme === 'dark'} onClick={() => applyTheme('dark')} badge="Beta" />
                    <ThemeOption icon={<Monitor size={22} />} label="Sistema" desc="Acompanha preferência do dispositivo" active={theme === 'system'} onClick={() => applyTheme('system')} />
                </div>
            </Card>

            {/* Densidade */}
            <Card className="p-mx-lg border-none shadow-mx-lg bg-white">
                <header className="flex items-center gap-mx-sm pb-mx-md border-b border-border-default mb-mx-lg">
                    <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-surface-alt text-text-tertiary flex items-center justify-center border border-border-default">
                        <Sparkles size={26} />
                    </div>
                    <div>
                        <Typography variant="h3" className="uppercase tracking-tight">Densidade</Typography>
                        <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black">Espaçamento da interface</Typography>
                    </div>
                </header>

                <div className="grid grid-cols-2 gap-mx-md">
                    <DensityOption label="Confortável" desc="Padrão MX, mais espaço" active={density === 'comfortable'} onClick={() => setDensity('comfortable')} />
                    <DensityOption label="Compacto" desc="Mais informação por tela" active={density === 'compact'} onClick={() => setDensity('compact')} />
                </div>
            </Card>

            {/* Branding */}
            <Card className="p-mx-lg border-none shadow-mx-md bg-white">
                <header className="flex items-center justify-between pb-mx-md border-b border-border-default mb-mx-lg">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-pure-black text-brand-primary flex items-center justify-center">
                            <Sparkles size={26} />
                        </div>
                        <div>
                            <Typography variant="h3" className="uppercase tracking-tight">Branding</Typography>
                            <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black">Cores e logo da marca</Typography>
                        </div>
                    </div>
                    <Badge variant="outline" className="font-black uppercase">Em breve</Badge>
                </header>
                <Typography variant="caption" tone="muted" className="font-bold leading-relaxed">
                    Personalização de cores primárias, logo e favicon será liberada em breve para administradores master.
                    Por enquanto, o branding MX (verde MX 0D3B2E + accent 22C55E) é fixo em toda a rede.
                </Typography>
            </Card>
        </div>
    )
}

function ThemeOption({ icon, label, desc, active, onClick, badge }: {
    icon: React.ReactNode
    label: string
    desc: string
    active: boolean
    onClick: () => void
    badge?: string
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`text-left p-mx-md rounded-mx-xl border-2 transition-all ${
                active
                    ? 'border-brand-primary bg-brand-primary/5 shadow-mx-md'
                    : 'border-border-default bg-white hover:border-brand-primary/30 hover:bg-surface-alt'
            }`}
        >
            <div className="flex items-center justify-between mb-mx-sm">
                <div className={`w-mx-10 h-mx-10 rounded-mx-xl flex items-center justify-center ${active ? 'bg-brand-primary text-white' : 'bg-surface-alt text-brand-primary'}`}>
                    {icon}
                </div>
                {badge && <Badge variant="outline" className="text-mx-micro font-black uppercase">{badge}</Badge>}
            </div>
            <Typography variant="caption" className="font-black uppercase tracking-tight">{label}</Typography>
            <Typography variant="tiny" tone="muted" className="font-bold leading-relaxed mt-1">{desc}</Typography>
        </button>
    )
}

function DensityOption({ label, desc, active, onClick }: { label: string; desc: string; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`text-left p-mx-md rounded-mx-xl border-2 transition-all ${
                active
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-border-default bg-white hover:border-brand-primary/30'
            }`}
        >
            <Typography variant="caption" className="font-black uppercase tracking-tight">{label}</Typography>
            <Typography variant="tiny" tone="muted" className="font-bold leading-relaxed mt-1">{desc}</Typography>
        </button>
    )
}
