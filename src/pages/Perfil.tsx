import { useState } from 'react'
import { User, Mail, Shield, Save, Camera, LogOut, Key, Bell, Globe, Palette, RefreshCw, ChevronRight, CheckCircle2, AlertTriangle, Zap, Sparkles, Settings, Smartphone, History, ShieldCheck } from 'lucide-react'
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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
            <Typography variant="h1">Painel de <span className="text-brand-primary">Identidade</span></Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">GESTÃO DE CREDENCIAIS & SEGURANÇA MX</Typography>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <Button variant="outline" size="icon" onClick={() => signOut()} className="w-14 h-14 rounded-xl text-status-error border-status-error/20 hover:bg-status-error-surface shadow-mx-sm">
            <LogOut size={24} />
          </Button>
          <Button onClick={handleSave} disabled={loading} className="h-14 px-10 rounded-full shadow-mx-xl">
            {loading ? <RefreshCw className="animate-spin mr-2" /> : <ShieldCheck size={18} className="mr-2" />} FIRMAR ALTERAÇÕES
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0 pb-32">
        
        {/* Left Column: Avatar & Quick Info */}
        <aside className="lg:col-span-4 flex flex-col gap-mx-lg h-full">
          <Card className="p-10 md:p-12 flex flex-col items-center text-center group relative overflow-hidden border-none shadow-mx-lg bg-white">
            <div className="absolute top-0 left-0 w-full h-32 bg-brand-secondary z-0 opacity-10" />
            <div className="relative z-10 space-y-8">
              <div className="relative group/avatar inline-block">
                <div className="w-32 h-32 rounded-mx-3xl border-8 border-white shadow-mx-xl overflow-hidden bg-surface-alt transition-transform group-hover/avatar:scale-105 duration-500">
                  <img src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || '')}&size=256&background=4f46e5&color=fff&bold=true`} alt="" className="w-full h-full object-cover" />
                </div>
                <button type="button" className="absolute inset-0 bg-black/60 rounded-mx-3xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                    <Camera size={24} />
                    <Typography variant="caption" tone="white" className="text-[8px] font-black">ALTERAR</Typography>
                </button>
              </div>
              
              <div>
                <Typography variant="h2" className="text-2xl uppercase tracking-tighter">{profile.name}</Typography>
                <div className="flex items-center justify-center gap-3 mt-3">
                    <Badge variant="brand" className="px-4 py-1 uppercase font-black">{role} TIER</Badge>
                    <div className="w-1.5 h-1.5 rounded-full bg-status-success shadow-mx-sm animate-pulse" />
                </div>
              </div>
            </div>

            <div className="w-full mt-14 pt-10 border-t border-border-default grid grid-cols-2 gap-6 relative z-10">
              <div className="bg-surface-alt p-6 rounded-mx-2xl border border-border-default shadow-inner text-center">
                <Typography variant="caption" tone="muted" className="text-[8px] mb-2 block uppercase font-black tracking-widest">XP SEASON</Typography>
                <Typography variant="h1" className="text-2xl tabular-nums">12.4K</Typography>
              </div>
              <div className="bg-surface-alt p-6 rounded-mx-2xl border border-border-default shadow-inner text-center">
                <Typography variant="caption" tone="muted" className="text-[8px] mb-2 block uppercase font-black tracking-widest">ARENA RANK</Typography>
                <Typography variant="h1" tone="brand" className="text-2xl tabular-nums">#04</Typography>
              </div>
            </div>
          </Card>

          <Card className="p-10 md:p-12 space-y-10 border-none shadow-mx-lg bg-white h-full flex flex-col">
            <header className="flex items-center gap-4 border-b border-border-default pb-6">
                <div className="w-12 h-12 rounded-mx-xl bg-mx-black text-indigo-400 flex items-center justify-center shadow-mx-md transform -rotate-3"><Shield size={24} /></div>
                <Typography variant="h3">Privacidade</Typography>
            </header>
            <div className="space-y-4 flex-1">
              {['Visibilidade Arena', 'Status Live-time', 'Logs de Sessão'].map(p => (
                <div key={p} className="flex items-center justify-between p-6 rounded-mx-xl bg-surface-alt border border-border-default hover:bg-white hover:shadow-mx-sm transition-all group/toggle">
                  <Typography variant="p" className="text-xs font-black text-text-secondary uppercase tracking-tight group-hover/toggle:text-text-primary transition-colors">{p}</Typography>
                  <div className="w-12 h-6 bg-status-success rounded-full flex items-center px-1 shadow-inner relative cursor-pointer">
                    <div className="w-4 h-4 bg-white rounded-full shadow-mx-sm translate-x-6" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        {/* Right Column: Account & Security */}
        <section className="lg:col-span-8 flex flex-col gap-mx-lg h-full">
          <Card className="h-full flex flex-col overflow-hidden border-none shadow-mx-xl bg-white group">
            <CardHeader className="bg-surface-alt/30 border-b border-border-default p-10 md:p-14 flex flex-row items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[100px] -mr-32 -mt-32" />
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 rounded-mx-2xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-xl transform rotate-2"><Settings size={32} /></div>
                <div>
                  <Typography variant="h2" className="text-2xl uppercase">Configurações de Conta</Typography>
                  <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black mt-1">SINC: IDENTITY GATEWAY v4.0</Typography>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-10 md:p-14 space-y-14 flex-1 overflow-y-auto no-scrollbar relative z-10">
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                    <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest leading-none">Nome Operacional</Typography>
                    <Input value={name} onChange={e => setName(e.target.value)} className="!h-14 px-6 font-bold" />
                </div>
                <div className="space-y-4">
                    <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest leading-none">E-mail Fixado</Typography>
                    <Input value={profile.email} disabled className="!h-14 px-6 font-bold opacity-50 bg-surface-alt" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                    <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest leading-none">Fuso Horário</Typography>
                    <div className="relative group">
                        <select className="w-full h-14 px-6 bg-surface-alt border border-border-default rounded-mx-xl text-sm font-bold text-text-primary appearance-none outline-none focus:border-brand-primary transition-all shadow-inner cursor-pointer">
                            <option>America/Sao_Paulo (GMT-3)</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary rotate-90" />
                    </div>
                </div>
                <div className="space-y-4">
                    <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest leading-none">Moeda Local</Typography>
                    <div className="relative group">
                        <select className="w-full h-14 px-6 bg-surface-alt border border-border-default rounded-mx-xl text-sm font-bold text-text-primary appearance-none outline-none focus:border-brand-primary transition-all shadow-inner cursor-pointer">
                            <option>Real Brasileiro (BRL)</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary rotate-90" />
                    </div>
                </div>
              </div>

              <div className="pt-14 border-t border-border-default space-y-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-mx-lg bg-mx-indigo-50 text-brand-primary flex items-center justify-center shadow-inner"><ShieldCheck size={20} /></div>
                    <Typography variant="caption" tone="brand" className="font-black uppercase tracking-[0.3em]">Segurança & Criptografia MX</Typography>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="p-8 bg-surface-alt/50 border border-border-subtle rounded-mx-2xl flex items-center justify-between group/sec cursor-pointer hover:bg-white hover:shadow-mx-lg transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-mx-xl bg-white border border-border-default flex items-center justify-center text-text-tertiary group-hover/sec:text-brand-primary transition-colors shadow-mx-sm"><Key size={20} /></div>
                        <Typography variant="caption" className="font-black uppercase tracking-widest">Alterar Senha</Typography>
                    </div>
                    <ChevronRight size={18} className="text-text-tertiary opacity-30 group-hover/sec:translate-x-1 transition-all" />
                  </Card>

                  <Card className="p-8 bg-surface-alt/50 border border-border-subtle rounded-mx-2xl flex items-center justify-between group/sec cursor-pointer hover:bg-white hover:shadow-mx-lg transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-mx-xl bg-white border border-border-default flex items-center justify-center text-status-success shadow-mx-sm"><ShieldCheck size={20} /></div>
                        <Typography variant="caption" className="font-black uppercase tracking-widest">Double Factor</Typography>
                    </div>
                    <Badge variant="success" className="px-4 py-1 rounded-full text-[8px] font-black border-none">ATIVO</Badge>
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
