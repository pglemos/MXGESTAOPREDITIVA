import { useState } from 'react'
import { User, Mail, Shield, Save, Camera, LogOut, Key, Bell, Globe, Palette, RefreshCw, ChevronRight, CheckCircle2, AlertTriangle, Zap, Sparkles, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export default function Perfil() {
  const { profile, role, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(profile?.name || '')

  const handleSave = async () => {
    setLoading(true)
    try {
      // Simulação ou update via supabase direto
      if (profile) await supabase.from('users').update({ name }).eq('id', profile.id)
      toast.success('Perfil de Identidade Atualizado!')
    } finally { setLoading(false) }
  }

  if (!profile) return null

  return (
    <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-mx-xs">
            <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
            <h1 className="mx-heading-hero">Perfil de <span className="text-brand-primary">Identidade</span></h1>
          </div>
          <p className="mx-text-caption pl-mx-md opacity-60 uppercase tracking-widest">Gestão de Credenciais & Segurança</p>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <button onClick={() => signOut()} className="w-12 h-12 rounded-mx-lg bg-status-error-surface text-status-error border border-mx-rose-100 shadow-mx-sm flex items-center justify-center hover:bg-status-error hover:text-white transition-all"><LogOut size={20} /></button>
          <button onClick={handleSave} disabled={loading} className="mx-button-primary bg-brand-primary flex items-center gap-2">{loading ? <RefreshCw className="animate-spin" /> : <><Save size={18} /> Salvar Alterações</>}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0 pb-mx-3xl">
        <div className="lg:col-span-4 flex flex-col gap-mx-lg h-full">
          <div className="mx-card p-mx-lg flex flex-col items-center text-center group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-brand-secondary z-0" />
            <div className="relative z-10 pt-12">
              <div className="w-32 h-32 rounded-mx-3xl border-8 border-white shadow-mx-xl overflow-hidden bg-mx-slate-50 relative group/avatar">
                <img src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || '')}&size=256&background=4f46e5&color=fff&bold=true`} className="w-full h-full object-cover" />
                <button className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-black uppercase"><Camera size={24} className="mb-1" /> Alterar</button>
              </div>
              <h3 className="text-2xl font-black text-text-primary tracking-tighter mt-mx-md uppercase leading-none">{profile.name}</h3>
              <p className="mx-text-caption !text-[10px] text-brand-primary mt-2 font-black tracking-[0.3em]">{role} TIER</p>
            </div>
            <div className="w-full mt-mx-xl grid grid-cols-2 gap-mx-sm">
              <div className="bg-mx-slate-50/50 border border-border-subtle p-3 rounded-mx-xl text-center"><p className="mx-text-caption !text-[8px] mb-1">XP Season</p><p className="text-xl font-black font-mono-numbers text-text-primary">12.4k</p></div>
              <div className="bg-mx-slate-50/50 border border-border-subtle p-3 rounded-mx-xl text-center"><p className="mx-text-caption !text-[8px] mb-1">Rank</p><p className="text-xl font-black font-mono-numbers text-text-primary">#04</p></div>
            </div>
          </div>

          <div className="mx-card p-mx-lg space-y-mx-md h-full flex flex-col">
            <h3 className="text-xl font-black text-text-primary tracking-tight leading-none uppercase mb-mx-sm">Privacidade</h3>
            {['Visibilidade de Ranking', 'Status Online Real-time', 'Logs de Atividade'].map(p => (
              <div key={p} className="flex items-center justify-between p-3 rounded-mx-lg bg-mx-slate-50/50 border border-border-subtle">
                <span className="text-xs font-bold text-text-secondary uppercase">{p}</span>
                <div className="w-10 h-5 bg-status-success rounded-full flex items-center px-1 shadow-inner"><div className="w-3 h-3 bg-white rounded-full translate-x-5" /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-mx-lg h-full">
          <div className="mx-card h-full flex flex-col overflow-hidden group">
            <div className="p-mx-lg border-b border-border-subtle bg-mx-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-mx-sm">
                <div className="w-12 h-12 rounded-mx-lg bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg"><Settings size={24} /></div>
                <div><h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1 uppercase">Ajustes de Conta</h3><p className="mx-text-caption">Preferências da Interface</p></div>
              </div>
            </div>
            <div className="p-mx-lg md:p-mx-xl space-y-mx-2xl flex-1 overflow-y-auto no-scrollbar">
              <div className="grid md:grid-cols-2 gap-mx-lg">
                <div className="space-y-2"><label className="mx-text-caption ml-2">Nome Operacional</label><input value={name} onChange={e => setName(e.target.value)} className="mx-input" /></div>
                <div className="space-y-2"><label className="mx-text-caption ml-2">E-mail Fixado</label><input value={profile.email} disabled className="mx-input opacity-60 bg-mx-slate-100" /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-mx-lg">
                <div className="space-y-2"><label className="mx-text-caption ml-2">Timezone</label><select className="mx-input appearance-none"><option>America/Sao_Paulo (GMT-3)</option></select></div>
                <div className="space-y-2"><label className="mx-text-caption ml-2">Moeda Base</label><select className="mx-input appearance-none"><option>Real Brasileiro (BRL)</option></select></div>
              </div>
              <div className="pt-mx-lg border-t border-border-subtle space-y-mx-lg">
                <h3 className="mx-text-caption text-brand-primary flex items-center gap-2"><Shield size={14} /> Segurança MX</h3>
                <div className="grid md:grid-cols-2 gap-mx-lg">
                  <div className="p-mx-md rounded-mx-xl border border-border-subtle bg-mx-slate-50/50 flex items-center justify-between group/sec cursor-pointer hover:bg-white transition-all">
                    <div className="flex items-center gap-mx-sm"><div className="w-10 h-10 rounded-mx-md bg-white flex items-center justify-center text-text-tertiary group-hover/sec:text-brand-primary transition-colors shadow-mx-sm"><Key size={18} /></div><span className="text-[10px] font-black uppercase tracking-widest text-text-primary">Alterar Senha</span></div>
                    <ChevronRight size={16} className="text-mx-slate-200 group-hover/sec:translate-x-1 transition-all" />
                  </div>
                  <div className="p-mx-md rounded-mx-xl border border-border-subtle bg-mx-slate-50/50 flex items-center justify-between group/sec cursor-pointer hover:bg-white transition-all">
                    <div className="flex items-center gap-mx-sm"><div className="w-10 h-10 rounded-mx-md bg-white flex items-center justify-center text-text-tertiary group-hover/sec:text-brand-primary transition-colors shadow-mx-sm"><Shield size={18} /></div><span className="text-[10px] font-black uppercase tracking-widest text-text-primary">2-Factor Auth</span></div>
                    <Badge className="bg-status-success-surface text-status-success border-none text-[8px]">ON</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
