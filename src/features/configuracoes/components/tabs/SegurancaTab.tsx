import { useState } from 'react'
import { Lock, RefreshCw, Save, Eye, EyeOff, ShieldCheck, AlertTriangle, KeyRound, LogOut, Smartphone } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Card } from '@/components/molecules/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'

export function SegurancaTab() {
    const { changePassword, signOut, profile } = useAuth()
    const [form, setForm] = useState({ current: '', next: '', confirm: '' })
    const [showPasswords, setShowPasswords] = useState(false)
    const [saving, setSaving] = useState(false)

    const handleChangePassword = async () => {
        if (form.next.length < 6) return toast.error('Nova senha deve ter ao menos 6 caracteres.')
        if (form.next !== form.confirm) return toast.error('Confirmação de senha não confere.')
        setSaving(true)
        const { error } = await changePassword(form.next)
        setSaving(false)
        if (error) {
            toast.error(error)
        } else {
            toast.success('Senha alterada com sucesso!')
            setForm({ current: '', next: '', confirm: '' })
        }
    }

    const handleForceLogoutAll = async () => {
        const confirmed = window.confirm('Encerrar TODAS as sessões ativas (incluindo esta)? Você precisará fazer login novamente.')
        if (!confirmed) return
        await supabase.auth.signOut({ scope: 'global' as any })
        await signOut()
        toast.success('Todas as sessões foram encerradas.')
    }

    return (
        <div className="space-y-mx-lg">
            {/* Alterar senha */}
            <Card className="p-mx-lg md:p-mx-xl border-none shadow-mx-lg bg-white">
                <header className="flex items-center gap-mx-sm pb-mx-md border-b border-border-default mb-mx-lg">
                    <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-mx-indigo-50 text-brand-primary flex items-center justify-center border border-mx-indigo-100 shadow-inner">
                        <KeyRound size={26} />
                    </div>
                    <div>
                        <Typography variant="h3" className="uppercase tracking-tight">Alterar Credenciais</Typography>
                        <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black">Senha de acesso ao sistema</Typography>
                    </div>
                </header>

                <div className="grid md:grid-cols-2 gap-mx-lg">
                    <div className="space-y-mx-sm md:col-span-2">
                        <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Nova Senha</Typography>
                        <div className="relative">
                            <Lock size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" />
                            <Input
                                type={showPasswords ? 'text' : 'password'}
                                value={form.next}
                                onChange={e => setForm(p => ({ ...p, next: e.target.value }))}
                                className="!h-mx-14 !pl-mx-12 pr-mx-12 font-bold"
                                placeholder="Mínimo 6 caracteres"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(s => !s)}
                                className="absolute right-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary hover:text-brand-primary"
                                aria-label={showPasswords ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-mx-sm md:col-span-2">
                        <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Confirmar Nova Senha</Typography>
                        <div className="relative">
                            <Lock size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" />
                            <Input
                                type={showPasswords ? 'text' : 'password'}
                                value={form.confirm}
                                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                                className="!h-mx-14 !pl-mx-12 font-bold"
                                placeholder="Repita a senha"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-mx-lg pt-mx-md border-t border-border-default flex items-center justify-end">
                    <Button
                        onClick={handleChangePassword}
                        disabled={saving || !form.next || !form.confirm}
                        className="h-mx-xl px-8 rounded-mx-full font-black uppercase tracking-widest"
                    >
                        {saving ? <RefreshCw className="animate-spin mr-2" size={16} /> : <ShieldCheck size={16} className="mr-2" />}
                        Atualizar Senha
                    </Button>
                </div>
            </Card>

            {/* must_change_password warning */}
            {profile?.must_change_password && (
                <Card className="p-mx-md bg-status-warning-surface border border-status-warning/30">
                    <div className="flex items-start gap-mx-sm">
                        <AlertTriangle size={20} className="text-status-warning shrink-0 mt-0.5" />
                        <div>
                            <Typography variant="caption" tone="warning" className="font-black uppercase tracking-widest">Troca de Senha Obrigatória</Typography>
                            <Typography variant="tiny" tone="muted" className="font-bold leading-relaxed">
                                Você está usando uma senha provisória. Por favor, defina uma senha pessoal acima.
                            </Typography>
                        </div>
                    </div>
                </Card>
            )}

            {/* Sessões ativas */}
            <Card className="p-mx-lg border-none shadow-mx-md bg-white">
                <header className="flex items-center gap-mx-sm pb-mx-md border-b border-border-default mb-mx-lg">
                    <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-surface-alt text-text-tertiary flex items-center justify-center border border-border-default shadow-inner">
                        <Smartphone size={26} />
                    </div>
                    <div>
                        <Typography variant="h3" className="uppercase tracking-tight">Sessões Ativas</Typography>
                        <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black">Dispositivos conectados</Typography>
                    </div>
                </header>

                <div className="space-y-mx-md">
                    <div className="flex items-center justify-between p-mx-md bg-surface-alt rounded-mx-xl border border-border-subtle">
                        <div className="flex items-center gap-mx-sm">
                            <div className="w-mx-10 h-mx-10 rounded-mx-full bg-status-success/10 text-status-success flex items-center justify-center">
                                <ShieldCheck size={18} />
                            </div>
                            <div>
                                <Typography variant="caption" className="font-black uppercase tracking-widest">Esta sessão</Typography>
                                <Typography variant="tiny" tone="muted" className="font-bold">Sessão expira em 24h por protocolo de segurança.</Typography>
                            </div>
                        </div>
                        <Badge variant="success" className="font-black uppercase">Ativa</Badge>
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleForceLogoutAll}
                        className="w-full h-mx-xl rounded-mx-xl border-status-error/30 text-status-error hover:bg-status-error-surface font-black uppercase tracking-widest"
                    >
                        <LogOut size={16} className="mr-2" /> Encerrar todas as sessões
                    </Button>
                </div>
            </Card>

            {/* 2FA placeholder */}
            <Card className="p-mx-lg border-none shadow-mx-md bg-white">
                <header className="flex items-center gap-mx-sm pb-mx-md border-b border-border-default mb-mx-lg">
                    <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-mx-indigo-50 text-brand-primary flex items-center justify-center border border-mx-indigo-100 shadow-inner">
                        <ShieldCheck size={26} />
                    </div>
                    <div>
                        <Typography variant="h3" className="uppercase tracking-tight">Autenticação em Dois Fatores</Typography>
                        <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black">2FA via TOTP / SMS</Typography>
                    </div>
                </header>
                <div className="flex items-center justify-between">
                    <Typography variant="caption" tone="muted" className="font-bold leading-relaxed">
                        2FA está em desenvolvimento. Em breve você poderá ativar autenticação por aplicativo (Google Authenticator, Authy).
                    </Typography>
                    <Badge variant="outline" className="font-black uppercase shrink-0">Em breve</Badge>
                </div>
            </Card>
        </div>
    )
}
