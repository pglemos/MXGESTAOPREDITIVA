import { useState } from 'react'
import { Lock, RefreshCw, Save, Eye, EyeOff, ShieldCheck, AlertTriangle, KeyRound, LogOut, Smartphone } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { Card } from '@/components/molecules/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from '@/lib/auth/passwordPolicy'
import { requestToastConfirmation } from '@/lib/ui/confirmAction'

export function SegurancaTab() {
    const { changePassword, signOut, profile } = useAuth()
    const [form, setForm] = useState({ current: '', next: '', confirm: '' })
    const [showPasswords, setShowPasswords] = useState(false)
    const [saving, setSaving] = useState(false)

    const handleChangePassword = async () => {
        if (!isStrongPassword(form.next)) return toast.error(PASSWORD_POLICY_MESSAGE)
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

    const executeForceLogoutAll = async () => {
        await supabase.auth.signOut({ scope: 'global' })
        await signOut()
        toast.success('Todas as sessões foram encerradas.')
    }

    const handleForceLogoutAll = () => {
        requestToastConfirmation({
            key: `force-logout-all:${profile?.id || 'current'}`,
            title: 'Encerrar todas as sessões ativas?',
            description: 'Esta sessão também será encerrada e será necessário fazer login novamente.',
            label: 'Encerrar',
            onConfirm: executeForceLogoutAll,
        })
    }

    return (
        <div className="space-y-8">
            {/* Alterar senha */}
            <Card className="p-8 md:p-12 border-none shadow-sm bg-white">
                <header className="flex items-center gap-4 pb-6 border-b border-gray-100 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-emerald-600 flex items-center justify-center border border-indigo-100 shadow-inner">
                        <KeyRound size={26} />
                    </div>
                    <div>
                        <Typography variant="h3" className="uppercase tracking-tight">Alterar Credenciais</Typography>
                        <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black">Senha de acesso ao sistema</Typography>
                    </div>
                </header>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4 md:col-span-2">
                        <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Nova Senha</Typography>
                        <div className="relative">
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <Input
                                id="settings-new-password"
                                name="new-password"
                                type={showPasswords ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={form.next}
                                onChange={e => setForm(p => ({ ...p, next: e.target.value }))}
                                className="!h-14 !pl-12 pr-12 font-bold"
                                placeholder="Mínimo 10, Aa1#"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(s => !s)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-emerald-600"
                                aria-label={showPasswords ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-4 md:col-span-2">
                        <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Confirmar Nova Senha</Typography>
                        <div className="relative">
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <Input
                                id="settings-confirm-password"
                                name="confirm-password"
                                type={showPasswords ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={form.confirm}
                                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                                className="!h-14 !pl-12 font-bold"
                                placeholder="Repita a senha"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end">
                    <Button
                        onClick={handleChangePassword}
                        disabled={saving || !form.next || !form.confirm}
                        className="h-12 px-8 rounded-full font-black uppercase tracking-widest"
                    >
                        {saving ? <RefreshCw className="animate-spin mr-2" size={16} /> : <ShieldCheck size={16} className="mr-2" />}
                        Atualizar Senha
                    </Button>
                </div>
            </Card>

            {/* must_change_password warning */}
            {profile?.must_change_password && (
                <Card className="p-6 bg-amber-50 border border-amber-500/30">
                    <div className="flex items-start gap-4">
                        <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
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
            <Card className="p-8 border-none shadow-sm bg-white">
                <header className="flex items-center gap-4 pb-6 border-b border-gray-100 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-500 flex items-center justify-center border border-gray-100 shadow-inner">
                        <Smartphone size={26} />
                    </div>
                    <div>
                        <Typography variant="h3" className="uppercase tracking-tight">Sessões Ativas</Typography>
                        <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black">Dispositivos conectados</Typography>
                    </div>
                </header>

                <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
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
                        className="w-full h-12 rounded-2xl border-red-600/30 text-red-600 hover:bg-red-50 font-black uppercase tracking-widest"
                    >
                        <LogOut size={16} className="mr-2" /> Encerrar todas as sessões
                    </Button>
                </div>
            </Card>

            {/* 2FA placeholder */}
            <Card className="p-8 border-none shadow-sm bg-white">
                <header className="flex items-center gap-4 pb-6 border-b border-gray-100 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-emerald-600 flex items-center justify-center border border-indigo-100 shadow-inner">
                        <ShieldCheck size={26} />
                    </div>
                    <div>
                        <Typography variant="h3" className="uppercase tracking-tight">Autenticação em Dois Fatores</Typography>
                        <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black">Recurso não habilitado</Typography>
                    </div>
                </header>
                <div className="flex items-center justify-between">
                    <Typography variant="caption" tone="muted" className="font-bold leading-relaxed">
                        2FA ainda não está disponível neste ambiente. A segurança ativa hoje é feita por senha com mínimo de 6 caracteres, troca obrigatória e encerramento global de sessões.
                    </Typography>
                    <Badge variant="outline" className="font-black uppercase shrink-0">Indisponível</Badge>
                </div>
            </Card>
        </div>
    )
}
