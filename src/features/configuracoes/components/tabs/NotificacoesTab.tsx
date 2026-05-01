import { useState, useEffect } from 'react'
import { Bell, Mail, Smartphone, Save, RefreshCw, Calendar, BarChart3, GraduationCap, Trophy, Megaphone, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Card } from '@/components/molecules/Card'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { DEFAULT_NOTIFICATION_PREFERENCES, type NotificationPreferences } from '@/types/database'

const CHANNEL_DEFINITIONS: Array<{
    key: keyof NotificationPreferences
    label: string
    desc: string
    icon: any
    section: 'canal' | 'topico'
}> = [
    { key: 'push', label: 'Notificações Push', desc: 'Alertas em tempo real no navegador e app', icon: Smartphone, section: 'canal' },
    { key: 'email', label: 'E-mail', desc: 'Resumos e alertas críticos por e-mail', icon: Mail, section: 'canal' },
    { key: 'matinal', label: 'Relatório Matinal', desc: 'Resumo diário antes do horário limite', icon: Calendar, section: 'topico' },
    { key: 'weekly', label: 'Ciclo Semanal', desc: 'Devolutivas e fechamentos de semana', icon: BarChart3, section: 'topico' },
    { key: 'monthly', label: 'Estratégico Mensal', desc: 'Visão de fechamento e BI', icon: BarChart3, section: 'topico' },
    { key: 'gaps', label: 'Alertas de Gaps', desc: 'Quando há rituais ou metas em risco', icon: AlertTriangle, section: 'topico' },
    { key: 'pdi', label: 'PDI & Devolutivas', desc: 'Novas devolutivas e atualizações de PDI', icon: GraduationCap, section: 'topico' },
    { key: 'rituals', label: 'Rituais Pendentes', desc: 'Lembretes de check-ins e rituais', icon: Trophy, section: 'topico' },
    { key: 'broadcasts', label: 'Comunicados da Rede', desc: 'Anúncios oficiais MX', icon: Megaphone, section: 'topico' },
]

export function NotificacoesTab() {
    const { profile, supabaseUser } = useAuth()
    const [prefs, setPrefs] = useState<NotificationPreferences>(
        profile?.notification_preferences || DEFAULT_NOTIFICATION_PREFERENCES
    )
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (profile?.notification_preferences) {
            setPrefs({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...profile.notification_preferences })
        }
    }, [profile?.notification_preferences])

    const toggle = (key: keyof NotificationPreferences) => {
        setPrefs(p => ({ ...p, [key]: !p[key] }))
    }

    const handleSave = async () => {
        if (!supabaseUser?.id) return
        setSaving(true)
        const { error } = await supabase
            .from('usuarios')
            .update({ notification_preferences: prefs })
            .eq('id', supabaseUser.id)
        setSaving(false)
        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Preferências de notificação atualizadas!')
        }
    }

    const channels = CHANNEL_DEFINITIONS.filter(c => c.section === 'canal')
    const topicos = CHANNEL_DEFINITIONS.filter(c => c.section === 'topico')

    return (
        <div className="space-y-mx-lg">
            <Card className="p-mx-lg md:p-mx-xl border-none shadow-mx-lg bg-white">
                <header className="flex items-center gap-mx-sm pb-mx-md border-b border-border-default mb-mx-lg">
                    <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-mx-indigo-50 text-brand-primary flex items-center justify-center border border-mx-indigo-100 shadow-inner">
                        <Bell size={26} />
                    </div>
                    <div>
                        <Typography variant="h3" className="uppercase tracking-tight">Canais de Entrega</Typography>
                        <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black">Como você quer receber notificações</Typography>
                    </div>
                </header>
                <div className="space-y-mx-md">
                    {channels.map(ch => {
                        const Icon = ch.icon
                        return (
                            <PrefRow
                                key={ch.key}
                                icon={<Icon size={18} />}
                                label={ch.label}
                                desc={ch.desc}
                                checked={Boolean(prefs[ch.key])}
                                onToggle={() => toggle(ch.key)}
                            />
                        )
                    })}
                </div>
            </Card>

            <Card className="p-mx-lg md:p-mx-xl border-none shadow-mx-lg bg-white">
                <header className="flex items-center gap-mx-sm pb-mx-md border-b border-border-default mb-mx-lg">
                    <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-surface-alt text-text-tertiary flex items-center justify-center border border-border-default shadow-inner">
                        <BarChart3 size={26} />
                    </div>
                    <div>
                        <Typography variant="h3" className="uppercase tracking-tight">Tópicos de Notificação</Typography>
                        <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black">Quais assuntos você quer acompanhar</Typography>
                    </div>
                </header>
                <div className="space-y-mx-md">
                    {topicos.map(ch => {
                        const Icon = ch.icon
                        return (
                            <PrefRow
                                key={ch.key}
                                icon={<Icon size={18} />}
                                label={ch.label}
                                desc={ch.desc}
                                checked={Boolean(prefs[ch.key])}
                                onToggle={() => toggle(ch.key)}
                            />
                        )
                    })}
                </div>

                <div className="mt-mx-lg pt-mx-md border-t border-border-default flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-mx-xl px-8 rounded-mx-full font-black uppercase tracking-widest"
                    >
                        {saving ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
                        Salvar Preferências
                    </Button>
                </div>
            </Card>
        </div>
    )
}

function PrefRow({ icon, label, desc, checked, onToggle }: {
    icon: React.ReactNode
    label: string
    desc: string
    checked: boolean
    onToggle: () => void
}) {
    return (
        <div className="flex flex-col gap-mx-md p-mx-md bg-surface-alt rounded-mx-xl border border-border-subtle hover:bg-white hover:border-brand-primary/20 transition-all sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-mx-sm flex-1 min-w-0">
                <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-white border border-border-default flex items-center justify-center text-brand-primary shrink-0">
                    {icon}
                </div>
                <div className="space-y-mx-tiny min-w-0">
                    <Typography variant="caption" className="font-black uppercase tracking-tight">{label}</Typography>
                    <Typography variant="tiny" tone="muted" className="font-bold leading-relaxed">{desc}</Typography>
                </div>
            </div>
            <Button
                variant={checked ? 'primary' : 'outline'}
                onClick={onToggle}
                className="w-full h-mx-xl rounded-mx-full font-black text-mx-tiny shadow-sm shrink-0 sm:w-mx-3xl"
                aria-pressed={checked}
            >
                {checked ? 'ATIVADO' : 'OFF'}
            </Button>
        </div>
    )
}
