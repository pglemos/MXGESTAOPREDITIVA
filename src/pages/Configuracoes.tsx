import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { 
    User, Mail, Shield, Smartphone, Globe, 
    RefreshCw, Save, Camera, Lock, Bell, 
    Palette, ChevronRight, LogOut, Info
} from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { FormField } from '@/components/molecules/FormField'

export default function Configuracoes() {
    const { profile, role, signOut } = useAuth()
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        name: profile?.name || '',
        email: profile?.email || '',
        notifications: true,
        darkMode: false
    })

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        await new Promise(r => setTimeout(r, 1000))
        setSaving(false)
        toast.success('Perfil sincronizado com sucesso!')
    }

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Ajustes de <span className="text-brand-primary">Sistema</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Configurações de Identidade & Experiência</Typography>
                </div>

                <div className="flex items-center gap-mx-sm">
                    <Button variant="outline" onClick={() => signOut()} className="h-12 px-6 text-status-error border-status-error/20 hover:bg-status-error-surface">
                        <LogOut size={18} className="mr-2" /> Encerrar Sessão
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="h-12 px-10 rounded-full shadow-mx-xl">
                        {saving ? <RefreshCw className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />} Firmar Alterações
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg pb-32">
                <section className="xl:col-span-8 flex flex-col gap-mx-lg">
                    <Card className="p-10 md:p-14">
                        <div className="flex items-center gap-6 mb-12 border-b border-border-default pb-10">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-mx-3xl bg-surface-alt border border-border-default flex items-center justify-center shadow-inner overflow-hidden">
                                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}&background=4f46e5&color=fff&size=128&bold=true`} alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <Button size="icon" variant="secondary" className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl shadow-mx-lg border-2 border-white">
                                    <Camera size={16} />
                                </Button>
                            </div>
                            <div>
                                <Typography variant="h2">{form.name}</Typography>
                                <div className="flex items-center gap-3 mt-2">
                                    <Badge variant="brand" className="px-3 uppercase">{role}</Badge>
                                    <Typography variant="caption" tone="muted">Membro Ativo MX</Typography>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-mx-lg">
                            <FormField 
                                id="user-name" label="Nome Completo" 
                                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} 
                            />
                            <FormField 
                                id="user-email" label="E-mail Operacional" type="email" 
                                value={form.email} disabled 
                            />
                            <div className="md:col-span-2 pt-6 border-t border-border-default flex items-center gap-4">
                                <Info size={16} className="text-text-tertiary" />
                                <Typography variant="caption" tone="muted">O e-mail é gerenciado pelo administrador da rede.</Typography>
                            </div>
                        </form>
                    </Card>

                    <Card className="p-10 md:p-14">
                        <CardTitle className="mb-10 flex items-center gap-4">
                            <Bell size={24} className="text-brand-primary" /> Central de Alertas
                        </CardTitle>
                        <div className="space-y-8">
                            <div className="flex items-center justify-between p-6 rounded-2xl bg-surface-alt border border-border-default">
                                <div className="space-y-1">
                                    <Typography variant="h3" className="text-sm">Notificações Push</Typography>
                                    <Typography variant="caption" tone="muted">Alertas de gaps e novos feedbacks</Typography>
                                </div>
                                <Button 
                                    variant={form.notifications ? 'secondary' : 'outline'}
                                    onClick={() => setForm(p => ({ ...p, notifications: !p.notifications }))}
                                    className="w-20 h-10 rounded-full"
                                >
                                    {form.notifications ? 'ON' : 'OFF'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </section>

                <aside className="xl:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-10 bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16" aria-hidden="true" />
                        <Typography variant="h3" tone="white" className="mb-10 flex items-center gap-4">
                            <Palette size={24} className="text-indigo-400" /> Interface MX
                        </Typography>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between group/item">
                                <Typography variant="caption" tone="white" className="opacity-60 group-hover/item:opacity-100 transition-opacity">Modo Escuro (BETA)</Typography>
                                <Button 
                                    variant="outline" size="sm" 
                                    className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                                    onClick={() => toast.info('O Modo Escuro será habilitado no próximo ciclo.')}
                                >
                                    ATIVAR
                                </Button>
                            </div>
                            <div className="pt-6 border-t border-white/5">
                                <Typography variant="caption" tone="white" className="opacity-30">Versão do Sistema: 4.0.2-stable</Typography>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-10 space-y-8">
                        <Typography variant="h3" className="flex items-center gap-4">
                            <Shield size={24} className="text-brand-primary" /> Segurança
                        </Typography>
                        <Button variant="outline" className="w-full h-14 rounded-2xl justify-between px-6 group">
                            ALTERAR SENHA <Lock size={18} className="text-text-tertiary group-hover:text-brand-primary transition-colors" />
                        </Button>
                        <Typography variant="caption" tone="muted" className="text-center block">Sua sessão expira em 24 horas por protocolo de segurança.</Typography>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
