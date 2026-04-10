import { useState } from 'react'
import { User, Mail, Shield, Save, Camera, LogOut, Key, Bell, Globe, Palette, RefreshCw, ChevronRight, CheckCircle2, AlertTriangle, Zap, Sparkles, Settings, Smartphone, History, ShieldCheck, Lock } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export default function Perfil() {
  const { profile, role, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(profile?.name || '')
  const [isRefetching, setIsRefetching] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      if (profile) {
        const { error } = await supabase.from('users').update({ name }).eq('id', profile.id)
        if (error) throw error
        toast.success('Perfil de Identidade Atualizado!')
      }
    } catch (e) {
        toast.error('Falha ao sincronizar identidade.')
    } finally { setLoading(false) }
  }

  if (!profile) return null

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      
      {/* Header / Identity Toolbar */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <div className="flex flex-col gap-mx-tiny">
          <div className="flex items-center gap-mx-sm">
            <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
            <Typography variant="h1">Painel de <Typography as="span" className="text-brand-primary">Identidade</Typography></Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">GESTÃO DE CREDENCIAIS & SEGURANÇA MX</Typography>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <Button variant="outline" size="icon" onClick={() => signOut()} className="w-mx-14 h-mx-14 rounded-mx-xl text-status-error border-status-error/20 hover:bg-status-error-surface shadow-mx-sm bg-white">
            <LogOut size={24} />
          </Button>
          <Button onClick={handleSave} disabled={loading} className="h-mx-14 px-10 rounded-mx-full shadow-mx-xl">
            {loading ? <RefreshCw className="animate-spin mr-2" /> : <ShieldCheck size={18} className="mr-2" />} 
            <Typography variant="tiny" as="span" className="font-black uppercase tracking-widest">FIRMAR ALTERAÇÕES</Typography>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0 pb-32">
        
        {/* Left Column: Avatar & Quick Info */}
        <aside className="lg:col-span-4 flex flex-col gap-mx-lg h-full">
          <Card className="p-mx-10 md:p-12 flex flex-col items-center text-center group relative overflow-hidden border-none shadow-mx-lg bg-white">
            <div className="absolute top-mx-0 left-mx-0 w-full h-mx-4xl bg-brand-secondary z-0 opacity-10" aria-hidden="true" />
            <div className="relative z-10 space-y-mx-lg">
              <div className="relative group/avatar inline-block">
                <div className="w-mx-4xl h-mx-4xl rounded-mx-3xl border-8 border-white shadow-mx-xl overflow-hidden bg-surface-alt transition-transform group-hover/avatar:scale-105 duration-500">
                  <img src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || '')}&size=256&background=4f46e5&color=fff&bold=true`} alt="" className="w-full h-full object-cover" />
                </div>
                <button type="button" className="absolute inset-0 bg-black/60 rounded-mx-3xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-mx-xs">
                    <Camera size={24} />
                    <Typography variant="tiny" tone="white">ALTERAR</Typography>
                </button>
              </div>
              
              <div>
                <Typography variant="h2" className="text-2xl uppercase tracking-tighter font-black">{profile.name}</Typography>
                <div className="flex items-center justify-center gap-mx-xs mt-3">
                    <Badge variant="brand" className="px-4 py-1 shadow-sm">
                        <Typography variant="tiny" as="span" className="font-black uppercase">{role} tier</Typography>
                    </Badge>
                    <div className="w-1.5 h-1.5 rounded-mx-full bg-status-success shadow-mx-sm animate-pulse" />
                </div>
              </div>
            </div>

            <div className="w-full mt-14 pt-10 border-t border-border-default grid grid-cols-2 gap-mx-md relative z-10">
              <div className="bg-surface-alt p-mx-md rounded-mx-2xl border border-border-default shadow-inner text-center">
                <Typography variant="tiny" tone="muted" className="mb-2 block tracking-widest font-black opacity-40 uppercase">XP SEASON</Typography>
                <Typography variant="h1" className="text-2xl tabular-nums font-black">12.4K</Typography>
              </div>
              <div className="bg-surface-alt p-mx-md rounded-mx-2xl border border-border-default shadow-inner text-center">
                <Typography variant="tiny" tone="muted" className="mb-2 block tracking-widest font-black opacity-40 uppercase">ARENA RANK</Typography>
                <Typography variant="h1" tone="brand" className="text-2xl tabular-nums font-black">#04</Typography>
              </div>
            </div>
          </Card>

          <Card className="p-mx-10 md:p-12 space-y-mx-10 border-none shadow-mx-lg bg-white h-full flex flex-col">
            <header className="flex items-center gap-mx-sm border-b border-border-default pb-6">
                <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-mx-black text-brand-primary flex items-center justify-center shadow-mx-md transform -rotate-3"><Shield size={24} /></div>
                <Typography variant="h3" className="uppercase tracking-tight">Privacidade</Typography>
            </header>
            <div className="space-y-mx-sm flex-1">
              {['Visibilidade Arena', 'Status Live-time', 'Logs de Sessão'].map(p => (
                <div key={p} className="flex items-center justify-between p-mx-md rounded-mx-xl bg-surface-alt border border-border-default hover:bg-white hover:shadow-mx-sm transition-all group/toggle">
                  <Typography variant="tiny" className="text-text-secondary group-hover/toggle:text-text-primary transition-colors">{p}</Typography>
                  <div className="w-mx-xl h-mx-md bg-status-success rounded-mx-full flex items-center px-1 shadow-inner relative cursor-pointer">
                    <div className="w-mx-sm h-mx-sm bg-white rounded-mx-full shadow-mx-sm translate-x-6" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        {/* Right Column: Account & Security */}
        <section className="lg:col-span-8 flex flex-col gap-mx-lg h-full">
          <Card className="h-full flex flex-col overflow-hidden border-none shadow-mx-xl bg-white group">
            <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-10 md:p-14 flex flex-row items-center justify-between relative overflow-hidden">
              <div className="absolute top-mx-0 right-mx-0 w-mx-sidebar-expanded h-mx-64 bg-brand-primary/5 rounded-mx-full blur-mx-xl -mr-32 -mt-32" aria-hidden="true" />
              <div className="flex items-center gap-mx-md relative z-10">
                <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-xl transform rotate-2"><Settings size={32} /></div>
                <div>
                  <Typography variant="h2" className="text-2xl uppercase tracking-tighter leading-none">Configurações de Conta</Typography>
                  <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black mt-1 font-black opacity-40">SINC: IDENTITY GATEWAY v4.0</Typography>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-mx-10 md:p-14 space-y-mx-14 flex-1 overflow-y-auto no-scrollbar relative z-10">
              <div className="grid md:grid-cols-2 gap-mx-10">
                <div className="space-y-mx-sm">
                    <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest leading-none">Nome Operacional</Typography>
                    <Input value={name} onChange={e => setName(e.target.value)} className="!h-14 px-6 font-bold" />
                </div>
                <div className="space-y-mx-sm">
                    <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest leading-none">E-mail Fixado</Typography>
                    <Input value={profile.email} disabled className="!h-14 px-6 font-bold opacity-50 bg-surface-alt" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-mx-10">
                <div className="space-y-mx-sm">
                    <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest leading-none">Fuso Horário</Typography>
                    <div className="relative group">
                        <select className="w-full h-mx-14 px-6 bg-surface-alt border border-border-default rounded-mx-xl text-sm font-bold text-text-primary appearance-none outline-none focus:border-brand-primary transition-all shadow-inner cursor-pointer">
                            <option>America/Sao_Paulo (GMT-3)</option>
                        </select>
                        <ChevronRight className="absolute right-mx-sm top-1/2 -translate-y-1/2 w-mx-sm h-mx-sm text-text-tertiary rotate-90" />
                    </div>
                </div>
                <div className="space-y-mx-sm">
                    <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest leading-none">Moeda Local</Typography>
                    <div className="relative group">
                        <select className="w-full h-mx-14 px-6 bg-surface-alt border border-border-default rounded-mx-xl text-sm font-bold text-text-primary appearance-none outline-none focus:border-brand-primary transition-all shadow-inner cursor-pointer">
                            <option>Real Brasileiro (BRL)</option>
                        </select>
                        <ChevronRight className="absolute right-mx-sm top-1/2 -translate-y-1/2 w-mx-sm h-mx-sm text-text-tertiary rotate-90" />
                    </div>
                </div>
              </div>

              <div className="pt-14 border-t border-border-default space-y-mx-10">
                <div className="flex items-center gap-mx-sm">
                    <div className="w-mx-10 h-mx-10 rounded-mx-lg bg-mx-indigo-50 text-brand-primary flex items-center justify-center shadow-inner border border-mx-indigo-100"><ShieldCheck size={20} /></div>
                    <Typography variant="caption" tone="brand" className="font-black uppercase tracking-widest">Segurança & Criptografia MX</Typography>
                </div>
                
                <div className="grid md:grid-cols-2 gap-mx-lg">
                  <Card className="p-mx-lg bg-surface-alt/50 border border-border-subtle rounded-mx-2xl flex items-center justify-between group/sec cursor-pointer hover:bg-white hover:shadow-mx-lg transition-all">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-white border border-border-default flex items-center justify-center text-text-tertiary group-hover/sec:text-brand-primary transition-colors shadow-mx-sm"><Key size={20} /></div>
                        <Typography variant="tiny" className="font-black uppercase tracking-widest">Alterar Senha</Typography>
                    </div>
                    <ChevronRight size={18} className="text-text-tertiary opacity-30 group-hover/sec:translate-x-1 transition-all" />
                  </Card>

                  <Card className="p-mx-lg bg-surface-alt/50 border border-border-subtle rounded-mx-2xl flex items-center justify-between group/sec cursor-pointer hover:bg-white hover:shadow-mx-lg transition-all">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-white border border-border-default flex items-center justify-center text-status-success shadow-mx-sm"><ShieldCheck size={20} /></div>
                        <Typography variant="tiny" className="font-black uppercase tracking-widest">Double Factor</Typography>
                    </div>
                    <Badge variant="success" className="px-4 py-1 rounded-mx-full border-none">
                        <Typography variant="tiny" as="span" className="font-black uppercase">Ativo</Typography>
                    </Badge>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
