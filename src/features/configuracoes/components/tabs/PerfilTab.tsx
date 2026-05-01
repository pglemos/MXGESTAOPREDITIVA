import { useState, useRef } from 'react'
import { Camera, RefreshCw, Save, User as UserIcon, Mail, Phone, Shield, Info, Upload } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { getAvatarUrl } from '@/lib/utils'
import { Card } from '@/components/molecules/Card'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'

const ROLE_LABELS: Record<string, string> = {
    administrador_geral: 'ADMIN MASTER MX',
    administrador_mx: 'ADMIN MX',
    consultor_mx: 'CONSULTOR MX',
    dono: 'DONO',
    gerente: 'GERENTE',
    vendedor: 'VENDEDOR',
}

export function PerfilTab() {
    const { profile, role, updateProfile, supabaseUser } = useAuth()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [saving, setSaving] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [form, setForm] = useState({
        name: profile?.name || '',
        phone: profile?.phone || '',
    })

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error('Nome não pode ficar vazio.')
            return
        }
        setSaving(true)
        const { error } = await updateProfile({
            name: form.name.trim(),
            phone: form.phone.trim() || undefined,
        })
        setSaving(false)
        if (error) toast.error(error)
        else toast.success('Perfil atualizado!')
    }

    const handleAvatarUpload = async (file: File) => {
        if (!supabaseUser?.id) return
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Avatar deve ter no máximo 2MB.')
            return
        }
        setUploadingAvatar(true)
        try {
            const fileExt = file.name.split('.').pop()
            const filePath = `avatars/${supabaseUser.id}-${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true })
            if (uploadError) throw uploadError
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
            const { error: updateError } = await updateProfile({ avatar_url: publicUrl })
            if (updateError) throw new Error(updateError)
            toast.success('Avatar atualizado!')
        } catch (err: any) {
            toast.error(err.message || 'Falha ao enviar avatar.')
        } finally {
            setUploadingAvatar(false)
        }
    }

    return (
        <div className="space-y-mx-lg">
            <Card className="p-mx-lg md:p-mx-xl border-none shadow-mx-lg bg-white">
                <header className="flex items-center gap-mx-lg pb-mx-md border-b border-border-default mb-mx-lg">
                    <div className="relative group">
                        <div className="w-mx-28 h-mx-28 rounded-mx-3xl bg-surface-alt border border-border-default flex items-center justify-center shadow-inner overflow-hidden">
                            <img
                                src={profile?.avatar_url || getAvatarUrl(form.name, { background: '0D3B2E', color: '22C55E', size: 128 })}
                                alt={form.name ? `Avatar de ${form.name}` : 'Avatar'}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="absolute -bottom-2 -right-2 w-mx-10 h-mx-10 rounded-mx-xl bg-brand-primary text-white shadow-mx-lg border-2 border-white flex items-center justify-center hover:bg-brand-primary-hover transition-all"
                            aria-label="Trocar avatar"
                        >
                            {uploadingAvatar ? <RefreshCw size={16} className="animate-spin" /> : <Camera size={16} />}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleAvatarUpload(file)
                            }}
                        />
                    </div>
                    <div className="flex-1 space-y-mx-xs">
                        <Typography variant="h2" className="uppercase tracking-tighter">{form.name || 'Sem nome'}</Typography>
                        <div className="flex items-center gap-mx-sm flex-wrap">
                            <Badge variant="brand" className="px-4 py-1 uppercase font-black">
                                {role ? ROLE_LABELS[role] : '—'}
                            </Badge>
                            <div className="flex items-center gap-mx-xs">
                                <div className="w-1.5 h-1.5 rounded-mx-full bg-status-success animate-pulse" />
                                <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest">Membro Ativo MX</Typography>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid md:grid-cols-2 gap-mx-lg">
                    <div className="space-y-mx-sm">
                        <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest flex items-center gap-mx-xs">
                            <UserIcon size={14} /> Nome Completo
                        </Typography>
                        <Input
                            value={form.name}
                            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            className="!h-mx-14 px-6 font-bold"
                            placeholder="Nome completo"
                        />
                    </div>
                    <div className="space-y-mx-sm">
                        <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest flex items-center gap-mx-xs">
                            <Mail size={14} /> E-mail Corporativo
                        </Typography>
                        <Input
                            value={profile?.email || ''}
                            disabled
                            className="!h-mx-14 px-6 font-bold opacity-50 bg-surface-alt"
                        />
                    </div>
                    <div className="space-y-mx-sm">
                        <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest flex items-center gap-mx-xs">
                            <Phone size={14} /> Telefone (WhatsApp)
                        </Typography>
                        <Input
                            value={form.phone}
                            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                            className="!h-mx-14 px-6 font-bold"
                            placeholder="(00) 00000-0000"
                        />
                    </div>
                    <div className="space-y-mx-sm">
                        <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest flex items-center gap-mx-xs">
                            <Shield size={14} /> Hierarquia
                        </Typography>
                        <Input
                            value={role ? ROLE_LABELS[role] : ''}
                            disabled
                            className="!h-mx-14 px-6 font-bold opacity-50 bg-surface-alt"
                        />
                    </div>
                </div>

                <div className="mt-mx-lg pt-mx-md border-t border-border-default flex items-center justify-between gap-mx-md">
                    <div className="flex items-start gap-mx-sm flex-1">
                        <Info size={16} className="text-brand-primary shrink-0 mt-1" />
                        <Typography variant="tiny" tone="muted" className="uppercase font-bold leading-relaxed">
                            E-mail e hierarquia são gerenciados pela administração MX para fins de auditoria imutável.
                        </Typography>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-mx-xl px-8 rounded-mx-full font-black uppercase tracking-widest shrink-0"
                    >
                        {saving ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
                        Salvar Perfil
                    </Button>
                </div>
            </Card>

            <Card className="p-mx-lg border-none shadow-mx-md bg-mx-indigo-50 border border-mx-indigo-100">
                <div className="flex items-start gap-mx-md">
                    <Upload size={20} className="text-brand-primary shrink-0 mt-1" />
                    <div className="space-y-mx-xs">
                        <Typography variant="caption" tone="brand" className="font-black uppercase tracking-widest">Avatar</Typography>
                        <Typography variant="tiny" tone="muted" className="font-bold leading-relaxed">
                            Formato JPG/PNG/WebP, até 2MB. O avatar aparece em rankings, devolutivas e relatórios da rede MX.
                        </Typography>
                    </div>
                </div>
            </Card>
        </div>
    )
}
