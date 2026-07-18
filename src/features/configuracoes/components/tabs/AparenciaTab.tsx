import { useEffect, useState } from 'react'
import { Palette, Moon, Sun, Monitor, Sparkles } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { toast } from '@/lib/toast'
import { useAuth } from '@/hooks/useAuth'

type Theme = 'light' | 'dark' | 'system'
type Density = 'comfortable' | 'compact'

const THEME_KEY = 'mx_theme_preference'
const DENSITY_KEY = 'mx_density_preference'

function scopedPreferenceKey(key: string, userId?: string | null) {
    return userId ? `${key}:${userId}` : `${key}:anon`
}

function applyThemeClass(t: Theme) {
    if (typeof window === 'undefined') return
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', t === 'dark' || (t === 'system' && prefersDark))
}

function applyDensityClass(d: Density) {
    if (typeof document === 'undefined') return
    document.documentElement.dataset.mxDensity = d
}

export function AparenciaTab() {
    const { profile } = useAuth()
    const [theme, setTheme] = useState<Theme>('light')
    const [density, setDensity] = useState<Density>('comfortable')
    const themeKey = scopedPreferenceKey(THEME_KEY, profile?.id)
    const densityKey = scopedPreferenceKey(DENSITY_KEY, profile?.id)

    useEffect(() => {
        if (typeof window === 'undefined') return
        const saved = (localStorage.getItem(themeKey) || localStorage.getItem(THEME_KEY)) as Theme | null
        const nextTheme = saved || 'light'
        const savedDensity = (localStorage.getItem(densityKey) || localStorage.getItem(DENSITY_KEY)) as Density | null
        const nextDensity = savedDensity || 'comfortable'
        setTheme(nextTheme)
        setDensity(nextDensity)
        applyThemeClass(nextTheme)
        applyDensityClass(nextDensity)

        const media = window.matchMedia('(prefers-color-scheme: dark)')
        const handleSystemThemeChange = () => {
            const current = (localStorage.getItem(themeKey) || 'light') as Theme
            if (current === 'system') applyThemeClass('system')
        }
        media.addEventListener('change', handleSystemThemeChange)
        return () => media.removeEventListener('change', handleSystemThemeChange)
    }, [densityKey, themeKey])

    const applyTheme = (t: Theme) => {
        setTheme(t)
        localStorage.setItem(themeKey, t)
        localStorage.removeItem(THEME_KEY)
        applyThemeClass(t)
        if (t === 'dark') {
            toast.success('Modo escuro ativado.')
        } else if (t === 'light') {
            toast.success('Modo claro ativado.')
        } else {
            toast.success('Tema seguindo preferência do sistema.')
        }
    }

    const applyDensity = (d: Density) => {
        setDensity(d)
        localStorage.setItem(densityKey, d)
        localStorage.removeItem(DENSITY_KEY)
        applyDensityClass(d)
        toast.success(d === 'compact' ? 'Densidade compacta ativada.' : 'Densidade confortável ativada.')
    }

    return (
        <div className="space-y-8">
            {/* Tema */}
            <Card className="p-8 md:p-12 border-none shadow-sm bg-white">
                <header className="flex items-center gap-4 pb-6 border-b border-gray-100 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-emerald-600 flex items-center justify-center border border-indigo-100">
                        <Palette size={26} />
                    </div>
                    <div>
                        <Typography variant="h3" className="uppercase tracking-tight">Tema Visual</Typography>
                        <Typography variant="caption" className="uppercase tracking-widest font-black text-gray-600">Modo de exibição da interface</Typography>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ThemeOption icon={<Sun size={22} />} label="Claro" desc="Interface clara padrão MX" active={theme === 'light'} onClick={() => applyTheme('light')} />
                    <ThemeOption icon={<Moon size={22} />} label="Escuro" desc="Conforto visual em ambientes escuros" active={theme === 'dark'} onClick={() => applyTheme('dark')} badge="Beta" />
                    <ThemeOption icon={<Monitor size={22} />} label="Sistema" desc="Acompanha preferência do dispositivo" active={theme === 'system'} onClick={() => applyTheme('system')} />
                </div>
            </Card>

            {/* Densidade */}
            <Card className="p-8 border-none shadow-sm bg-white">
                <header className="flex items-center gap-4 pb-6 border-b border-gray-100 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-500 flex items-center justify-center border border-gray-100">
                        <Sparkles size={26} />
                    </div>
                    <div>
                        <Typography variant="h3" className="uppercase tracking-tight">Densidade</Typography>
                        <Typography variant="caption" className="uppercase tracking-widest font-black text-gray-600">Espaçamento da interface</Typography>
                    </div>
                </header>

                <div className="grid grid-cols-2 gap-6">
                    <DensityOption label="Confortável" desc="Padrão MX, mais espaço" active={density === 'comfortable'} onClick={() => applyDensity('comfortable')} />
                    <DensityOption label="Compacto" desc="Mais informação por tela" active={density === 'compact'} onClick={() => applyDensity('compact')} />
                </div>
            </Card>

            {/* Branding */}
            <Card className="p-8 border-none shadow-sm bg-white">
                <header className="flex items-center justify-between pb-6 border-b border-gray-100 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gray-950 text-emerald-600 flex items-center justify-center">
                            <Sparkles size={26} />
                        </div>
                        <div>
                            <Typography variant="h3" className="uppercase tracking-tight">Branding</Typography>
                            <Typography variant="caption" className="uppercase tracking-widest font-black text-gray-600">Cores e logo da marca</Typography>
                        </div>
                    </div>
                    <Badge variant="outline" className="font-black uppercase">Em breve</Badge>
                </header>
                <Typography variant="caption" className="font-bold leading-relaxed text-gray-600">
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
            className={`text-left p-6 rounded-2xl border-2 transition-all ${
                active
                    ? 'border-emerald-600 bg-emerald-600/5 shadow-sm'
                    : 'border-gray-100 bg-white hover:border-emerald-600/30 hover:bg-gray-50'
            }`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${active ? 'bg-emerald-600 text-white' : 'bg-gray-50 text-emerald-600'}`}>
                    {icon}
                </div>
                {badge && <Badge variant="outline" className="text-[9px] font-black uppercase">{badge}</Badge>}
            </div>
            <Typography variant="caption" className="font-black uppercase tracking-tight !text-gray-800">{label}</Typography>
            <Typography variant="tiny" className="font-bold leading-relaxed mt-1 text-gray-600">{desc}</Typography>
        </button>
    )
}

function DensityOption({ label, desc, active, onClick }: { label: string; desc: string; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`text-left p-6 rounded-2xl border-2 transition-all ${
                active
                    ? 'border-emerald-600 bg-emerald-600/5'
                    : 'border-gray-100 bg-white hover:border-emerald-600/30'
            }`}
        >
            <Typography variant="caption" className="font-black uppercase tracking-tight !text-gray-800">{label}</Typography>
            <Typography variant="tiny" className="font-bold leading-relaxed mt-1 text-gray-600">{desc}</Typography>
        </button>
    )
}
