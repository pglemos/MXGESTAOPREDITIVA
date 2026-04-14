import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { 
    User, Mail, Shield, Smartphone, Globe, 
    RefreshCw, Save, Camera, Lock, Bell, 
    Palette, ChevronRight, LogOut, Info,
    ShieldCheck, Eye, EyeOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn, getAvatarUrl } from '@/lib/utils'
import { toast } from 'sonner'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { FormField } from '@/components/molecules/FormField'

export default function Configuracoes() {
    const { profile, role, signOut, updateProfile } = useAuth()
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        name: profile?.name || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
        notifications: true,
    })

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim()) {
            toast.error('Nome não pode ficar vazio.')
            return
        }
        setSaving(true)
        const { error } = await updateProfile({ name: form.name.trim(), phone: form.phone.trim() || undefined })
        setSaving(false)
        if (error) {
            toast.error(error)
        } else {
            toast.success('Configurações de perfil firmadas!')
        }
    }

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Ajustes de <span className="text-mx-green-700">Identidade</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">PERFIL & EXPERIÊNCIA DO ESPECIALISTA</Typography>
                </div>

                <div className="flex items-center gap-mx-sm">
                    <Button variant="outline" onClick={() => signOut()} className="h-mx-xl px-6 text-status-error border-status-error/20 hover:bg-status-error-surface rounded-mx-xl bg-white shadow-sm font-black uppercase tracking-widest">
                        <LogOut size={18} className="mr-2" /> Encerrar Sessão
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="h-mx-14 px-10 rounded-mx-full shadow-mx-xl font-black uppercase tracking-widest">
                        {saving ? <RefreshCw className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />} 
                        FIRMAR ALTERAÇÕES
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg pb-32">
                <section className="xl:col-span-8 flex flex-col gap-mx-lg">
                    <Card className="p-mx-10 md:p-14 border-none shadow-mx-lg bg-white">
                        <div className="flex items-center gap-mx-lg mb-14 border-b border-border-default pb-10">
                            <div className="relative group">
                                <div className="w-mx-28 h-mx-3xl rounded-mx-3xl bg-surface-alt border border-border-default flex items-center justify-center shadow-inner overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                    <img 
                                        src={getAvatarUrl(form.name, { background: '0D3B2E', color: '22C55E', size: 128 })} 
                                        alt={form.name ? `Avatar de ${form.name}` : 'Avatar do usuário'} className="w-full h-full object-cover"
                                    />
                                </div>
                                <Button size="icon" variant="secondary" className="absolute -bottom-2 -right-2 w-mx-10 h-mx-10 rounded-mx-xl shadow-mx-lg border-2 border-white" aria-label="Ação">
                                    <Camera size={16} />
                                </Button>
                            </div>
                            <div className="space-y-mx-xs">
                                <Typography variant="h2" className="uppercase tracking-tighter">{form.name}</Typography>
                                <div className="flex items-center gap-mx-sm">
                                    <Badge variant="brand" className="px-4 py-1 uppercase font-black shadow-sm">{role} tier</Badge>
                                    <div className="flex items-center gap-mx-xs">
                                        <div className="w-1.5 h-1.5 rounded-mx-full bg-status-success shadow-mx-sm animate-pulse" />
                                        <Typography variant="caption" tone="muted" className="font-black opacity-40 uppercase tracking-widest">MEMBRO ATIVO MX</Typography>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-mx-lg">
                            <div className="space-y-mx-sm">
                                <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Nome de Guerra</Typography>
                                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="!h-14 px-6 font-bold" />
                            </div>
                            <div className="space-y-mx-sm">
                                <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">E-mail Corporativo</Typography>
                                <Input value={form.email} disabled className="!h-14 px-6 font-bold opacity-50 bg-surface-alt" />
                            </div>
                            <div className="md:col-span-2 pt-10 border-t border-border-default flex items-start gap-mx-sm">
                                <div className="w-mx-lg h-mx-lg rounded-mx-full bg-mx-indigo-50 text-brand-primary flex items-center justify-center shrink-0 shadow-inner border border-mx-indigo-100"><Info size={14} strokeWidth={2} /></div>
                                <Typography variant="p" tone="muted" className="uppercase font-bold leading-relaxed opacity-40 text-xs">Os dados de e-mail e hierarquia são gerenciados exclusivamente pela administração da rede para fins de auditoria imutável.</Typography>
                            </div>
                        </form>
                    </Card>

                    <Card className="p-mx-10 md:p-14 border-none shadow-mx-lg bg-white">
                        <header className="flex items-center gap-mx-sm mb-12 border-b border-border-default pb-8">
                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-mx-indigo-50 text-brand-primary flex items-center justify-center border border-mx-indigo-100 shadow-inner"><Bell size={28} /></div>
                            <div>
                                <Typography variant="h3" className="uppercase tracking-tight">Canais de Alerta</Typography>
                                <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1 font-black opacity-40">GERENCIAMENTO DE NOTIFICAÇÕES</Typography>
                            </div>
                        </header>
                        
                        <div className="space-y-mx-md">
                            <Card className="flex items-center justify-between p-mx-lg bg-surface-alt border border-border-subtle shadow-inner group hover:bg-white hover:border-brand-primary/20 hover:shadow-mx-sm transition-all">
                                <div className="space-y-mx-tiny">
                                    <Typography variant="h3" className="text-base uppercase tracking-tight group-hover:text-brand-primary transition-colors">Notificações Push</Typography>
                                    <Typography variant="p" tone="muted" className="lowercase tracking-normal italic uppercase tracking-widest font-black opacity-40 text-xs">Alertas de gaps, rituais pendentes e novos feedbacks</Typography>
                                </div>
                                <Button 
                                    variant={form.notifications ? 'primary' : 'outline'}
                                    onClick={() => setForm(p => ({ ...p, notifications: !p.notifications }))}
                                    className="w-mx-3xl h-mx-xl rounded-mx-full font-black text-mx-tiny shadow-mx-sm"
                                >
                                    {form.notifications ? 'ATIVADO' : 'OFF'}
                                </Button>
                            </Card>
                        </div>
                    </Card>
                </section>

                <aside className="xl:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-mx-10 bg-pure-black text-white border-none shadow-mx-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-transparent z-0 opacity-50" />
                        <div className="absolute top-mx-0 right-mx-0 w-mx-48 h-mx-48 bg-brand-primary/10 rounded-mx-full blur-3xl -mr-24 -mt-24 pointer-events-none group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                        
                        <header className="flex items-center gap-mx-sm mb-12 relative z-10">
                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner group-hover:rotate-6 transition-transform"><Palette size={28} className="text-brand-primary" /></div>
                            <div>
                                <Typography variant="h3" tone="white" className="uppercase tracking-tight">Estética MX</Typography>
                                <Typography variant="caption" tone="white" className="opacity-40 uppercase tracking-widest mt-1 font-black">PERSONALIZAÇÃO</Typography>
                            </div>
                        </header>

                        <div className="space-y-mx-lg relative z-10">
                            <div className="flex items-center justify-between group/item">
                                <Typography variant="caption" tone="white" className="opacity-60 group-hover/item:opacity-100 transition-opacity uppercase tracking-widest font-black">Modo Escuro (Beta)</Typography>
                                <Button 
                                    variant="outline" size="sm" 
                                    className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-mx-lg px-6 font-black uppercase tracking-widest text-xs"
                                    onClick={() => toast.info('O Modo Escuro será liberado no próximo ciclo.')}
                                >
                                    ATIVAR
                                </Button>
                            </div>
                            <div className="pt-8 border-t border-white/10">
                                <Typography variant="caption" tone="white" className="opacity-20 uppercase tracking-widest font-black text-center block text-xs">VERSÃO DO TERMINAL: 4.0.2-STABLE</Typography>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-mx-10 md:p-12 border-none shadow-mx-lg bg-white space-y-mx-10">
                        <header className="flex items-center gap-mx-sm border-b border-border-default pb-8">
                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-surface-alt flex items-center justify-center text-text-tertiary shadow-inner border border-border-default group-hover:bg-brand-primary group-hover:text-white transition-all"><ShieldCheck size={28} /></div>
                            <Typography variant="h3" className="uppercase tracking-tight">Segurança</Typography>
                        </header>
                        
                        <div className="space-y-mx-md">
                            <Button variant="outline" className="w-full h-mx-2xl rounded-mx-2xl justify-between px-8 border-border-strong group hover:border-brand-primary transition-all shadow-sm font-black uppercase tracking-widest bg-white text-xs">
                                ALTERAR CREDENCIAIS <Lock size={18} className="text-text-tertiary group-hover:text-brand-primary transition-colors" />
                            </Button>
                            <Card className="p-mx-md bg-status-info-surface border border-status-info/20 shadow-inner">
                                <Typography variant="caption" tone="info" className="text-center block font-black uppercase tracking-widest leading-relaxed text-xs">Sua sessão expira em 24h por protocolo de segurança imutável.</Typography>
                            </Card>
                        </div>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
