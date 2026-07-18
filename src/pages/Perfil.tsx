import { useState, useRef } from 'react'
import { User, Mail, Shield, Save, Camera, LogOut, Key, ChevronRight, ShieldCheck, RefreshCw, X } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardContent } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/lib/toast'
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from '@/lib/auth/passwordPolicy'
import { getAvatarDisplayUrl, uploadUserAvatar } from '@/lib/avatar'

export default function Perfil() {
  const { profile, role, signOut, updateProfile, changePassword } = useAuth()
  const isSeller = role === 'vendedor'
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(profile?.name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nome não pode ficar vazio.')
      return
    }
    setSaving(true)
    const { error } = await updateProfile({ name: name.trim(), phone: phone.trim() || undefined })
    setSaving(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Perfil atualizado!')
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile?.id) return

    setUploadingAvatar(true)
    try {
      const avatarUrl = await uploadUserAvatar(profile.id, file)
      const { error: updateError } = await updateProfile({ avatar_url: avatarUrl })
      if (updateError) throw updateError

      toast.success('Avatar atualizado!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao enviar avatar.')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleChangePassword = async () => {
    if (!isStrongPassword(newPassword)) {
      toast.error(PASSWORD_POLICY_MESSAGE)
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }
    setChangingPassword(true)
    const { error } = await changePassword(newPassword)
    setChangingPassword(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Senha alterada com sucesso!')
      setShowPasswordModal(false)
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  if (!profile) return null

  return (
    <main className="w-full h-full flex flex-col gap-8 p-6 md:p-8 overflow-y-auto no-scrollbar bg-gray-50">

      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-gray-100 pb-8 shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-emerald-600 rounded-full shadow-sm" aria-hidden="true" />
            <Typography variant="h1">{isSeller ? 'Minha' : 'Painel de'} <Typography as="span" className="text-emerald-600">{isSeller ? 'Conta' : 'Identidade'}</Typography></Typography>
          </div>
          <Typography variant="caption" className="pl-6 uppercase tracking-wide font-black">
            {isSeller ? 'Dados pessoais, telefone, foto e senha' : 'Gestão de credenciais e segurança MX'}
          </Typography>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <Button variant="outline" size="icon" onClick={() => signOut()} className="w-14 h-14 rounded-2xl text-red-600 border-red-600/20 hover:bg-red-50 shadow-sm bg-white">
            <LogOut size={24} />
          </Button>
          <Button onClick={handleSave} disabled={saving} className="h-14 px-10 rounded-full shadow-sm">
            {saving ? <RefreshCw className="animate-spin mr-2" /> : <ShieldCheck size={18} className="mr-2" />}
            <Typography variant="tiny" as="span" className="font-black uppercase tracking-widest">{isSeller ? 'Salvar conta' : 'Firmar alterações'}</Typography>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 pb-32">

        <aside className="lg:col-span-4 flex flex-col gap-8 h-full">
          <Card className="p-10 md:p-12 flex flex-col items-center text-center group relative overflow-hidden border-none shadow-sm bg-white">
            <div className="absolute top-0 left-0 w-full h-32 bg-gray-900 z-0 opacity-10" aria-hidden="true" />
            <div className="relative z-10 space-y-8">
              <div className="relative group/avatar inline-block">
                <div className="w-32 h-32 rounded-2xl border-8 border-white shadow-sm overflow-hidden bg-gray-50 transition-transform group-hover/avatar:scale-105 duration-500">
                  <img
                    src={getAvatarDisplayUrl(profile.avatar_url, profile.name, { size: 256, background: '4f46e5', color: 'fff' })}
                    alt={`Avatar de ${profile.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 disabled:opacity-50"
                >
                  {uploadingAvatar ? <RefreshCw size={24} className="animate-spin" /> : <Camera size={24} />}
                  <Typography variant="tiny" tone="white">{uploadingAvatar ? 'Enviando...' : 'ALTERAR'}</Typography>
                </button>
                <input aria-label="Selecionar arquivo" ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" capture="user" onChange={handleAvatarUpload} className="hidden" />
              </div>

              <div>
                <Typography variant="h2" className="text-2xl uppercase tracking-tighter font-black">{profile.name}</Typography>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Badge variant="brand" className="px-4 py-1 shadow-sm">
                    <Typography variant="tiny" as="span" className="font-black uppercase">{role} tier</Typography>
                  </Badge>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 shadow-sm animate-pulse" />
                </div>
              </div>
            </div>
          </Card>
        </aside>

        <section className="lg:col-span-8 flex flex-col gap-8 h-full">
          <Card className="h-full flex flex-col overflow-hidden border-none shadow-sm bg-white group">
            <CardHeader className="bg-gray-50/30 border-b border-gray-100 p-10 md:p-14 flex flex-row items-center justify-between relative overflow-hidden">
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-sm transform rotate-2"><User size={32} /></div>
                <div>
              <Typography variant="h2" className="text-2xl uppercase tracking-tighter leading-none">{isSeller ? 'Minha conta' : 'Configurações de Conta'}</Typography>
                  <Typography variant="caption" tone="muted" className="uppercase tracking-wide font-black mt-1 font-black">
                    {isSeller ? 'Informações usadas na rotina da loja' : 'Sinc: Identity Gateway v4.0'}
                  </Typography>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-10 md:p-14 space-y-14 flex-1 overflow-y-auto no-scrollbar relative z-10">
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest leading-none">Nome Operacional</Typography>
                  <Input aria-label="Nome Operacional" value={name} onChange={e => setName(e.target.value)} className="!h-14 px-6 font-bold" />
                </div>
                <div className="space-y-4">
                  <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest leading-none">E-mail Fixado</Typography>
                  <Input aria-label="E-mail Fixado" value={profile.email} disabled className="!h-14 px-6 font-bold opacity-50 bg-gray-50" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest leading-none">Telefone</Typography>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="!h-14 px-6 font-bold" />
                </div>
                <div className="space-y-4">
                  <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest leading-none">Cargo</Typography>
                  <Input aria-label="Cargo" value={role || ''} disabled className="!h-14 px-6 font-bold opacity-50 bg-gray-50 capitalize" />
                </div>
              </div>

              <div className="pt-14 border-t border-gray-100 space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-emerald-600 flex items-center justify-center shadow-inner border border-indigo-100"><ShieldCheck size={20} /></div>
                  <Typography variant="caption" tone="brand" className="font-black uppercase tracking-wide">
                    {isSeller ? 'Segurança da minha conta' : 'Segurança & Criptografia MX'}
                  </Typography>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <Card
                    className="p-8 bg-gray-50/50 border border-gray-100 rounded-2xl flex items-center justify-between group/sec cursor-pointer hover:bg-white hover:shadow-sm transition-all"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-500 group-hover/sec:text-emerald-600 transition-colors shadow-sm"><Key size={20} /></div>
                      <Typography variant="tiny" className="font-black uppercase tracking-widest">Alterar Senha</Typography>
                    </div>
                    <ChevronRight size={18} className="text-gray-500 opacity-30 group-hover/sec:translate-x-1 transition-all" />
                  </Card>

                  <Card className="p-8 bg-gray-50/50 border border-gray-100 rounded-2xl flex items-center justify-between group/sec">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-emerald-600 shadow-sm"><ShieldCheck size={20} /></div>
                      <Typography variant="tiny" className="font-black uppercase tracking-widest">Verificação de acesso</Typography>
                    </div>
                    <Badge variant="success" className="px-4 py-1 rounded-full border-none">
                      <Typography variant="tiny" as="span" className="font-black uppercase">Ativo</Typography>
                    </Badge>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {showPasswordModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-password-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setShowPasswordModal(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setShowPasswordModal(false)
          }}
        >
          <div
            role="presentation"
            className="bg-white rounded-2xl shadow-sm w-full max-w-md p-12"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <Typography variant="h3" id="profile-password-modal-title">Alterar Senha</Typography>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-500 hover:text-gray-800"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="profile-password-modal-new" className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">Nova Senha</label>
                <Input id="profile-password-modal-new" name="new-password" autoComplete="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 10, Aa1#" className="w-full" />
              </div>
              <div>
                <label htmlFor="profile-password-modal-confirm" className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">Confirmar Senha</label>
                <Input id="profile-password-modal-confirm" name="confirm-password" autoComplete="new-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" className="w-full" />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-12">
              <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(false)}>Cancelar</Button>
              <Button size="sm" className="bg-emerald-600 text-white" onClick={handleChangePassword} disabled={changingPassword}>
                {changingPassword ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
