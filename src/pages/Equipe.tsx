import { useTeam } from '@/hooks/useTeam'
import { useState, useMemo, useCallback } from 'react'
import { 
    Users, UserPlus, Search, Mail, Phone, Shield, 
    BadgeCheck, RefreshCw, X, ChevronRight, Star, 
    TrendingUp, Zap, Filter, Calendar, Settings2, ShieldAlert, Clock, ShieldCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'

export default function Equipe() {
  const { team, loading, refetch, updateVigencia } = useTeam()
  const [searchTerm, setSearchTerm] = useState('')
  const [editingMember, setEditingMember] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [isRefetching, setIsRefetching] = useState(false)

  const filteredTeam = useMemo(() => {
    return team.filter(m => 
      m.role === 'vendedor' && (
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.role?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [team, searchTerm])

  const stats = useMemo(() => {
    const vendedores = team.filter(m => m.role === 'vendedor');
    return [
        { label: 'Tropa Total', value: vendedores.length, icon: Users, tone: 'brand' },
        { label: 'Operacionais', value: vendedores.filter(m => m.checkin_today).length, icon: Zap, tone: 'success' },
        { label: 'Pendentes', value: vendedores.filter(m => !m.checkin_today).length, icon: Clock, tone: 'error' },
        { label: 'Líderes', value: team.filter(m => m.role === 'gerente').length, icon: Star, tone: 'warning' },
    ];
  }, [team])

  const handleUpdateVigencia = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await updateVigencia(editingMember.id, {
      started_at: editingMember.started_at,
      ended_at: editingMember.ended_at,
      is_active: editingMember.is_active,
      closing_month_grace: editingMember.closing_month_grace
    })
    setSaving(false)
    if (error) toast.error(error); else { toast.success('Vigência atualizada!'); setEditingMember(null); refetch() }
  }

  const getVigenciaStatus = (m: any) => {
    if (!m.is_active) return { label: 'INATIVO', variant: 'outline' as const }
    if (m.ended_at && new Date(m.ended_at) < new Date()) return { label: 'ENCERRADO', variant: 'danger' as const }
    return { label: 'ATIVO', variant: 'success' as const }
  }

  if (loading) return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
      <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-6" />
      <Typography variant="caption" tone="muted" className="animate-pulse">Escaneando Hierarquia...</Typography>
    </div>
  )

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      
      {/* Header / Team Toolbar */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
            <Typography variant="h1">Time de <span className="text-brand-primary">Elite</span></Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md">Gestão de Tropa & Hierarquia MX</Typography>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <div className="relative group w-full sm:w-64">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
            <Input 
              placeholder="BUSCAR ESPECIALISTA..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="!pl-11 !h-12 !text-[10px] uppercase tracking-widest"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => {setIsRefetching(true); refetch().then(() => setIsRefetching(false))}} className="rounded-xl shadow-mx-sm h-12 w-12">
            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
          </Button>
          <Button className="h-12 px-8 shadow-mx-lg bg-brand-secondary">
            <UserPlus size={18} className="mr-2" /> NOVO RECRUTA
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
        {stats.map((item) => (
          <Card key={item.label} className="p-8 border-none shadow-mx-sm group hover:shadow-mx-lg transition-all">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <Typography variant="caption" tone="muted" className="block uppercase tracking-widest">{item.label}</Typography>
                <Typography variant="h1" className="text-4xl tabular-nums">{item.value}</Typography>
              </div>
              <div className={cn(
                'h-14 w-14 rounded-mx-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110',
                item.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                item.tone === 'success' ? 'bg-status-success-surface border-mx-emerald-100 text-status-success' :
                item.tone === 'error' ? 'bg-status-error-surface border-mx-rose-100 text-status-error' :
                'bg-status-warning-surface border-mx-amber-100 text-status-warning'
              )}>
                <item.icon size={24} strokeWidth={2.5} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Team Grid */}
      <div className="flex-1 min-h-0 pb-mx-3xl" aria-live="polite">
        {filteredTeam.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg">
            {filteredTeam.map((member, i) => {
              const vigencia = getVigenciaStatus(member)
              return (
              <motion.article key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-mx-3xl border-none shadow-mx-lg flex flex-col group hover:shadow-mx-xl hover:-translate-y-1 transition-all relative overflow-hidden bg-white">
                <div className="p-6 border-b border-border-default bg-surface-alt/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", member.checkin_today ? "bg-status-success shadow-mx-sm animate-pulse" : "bg-text-tertiary/30")} aria-hidden="true" />
                    <Typography variant="caption" className="text-[8px] font-black uppercase tracking-widest">{member.checkin_today ? 'Operacional' : 'Offline'}</Typography>
                  </div>
                  <Badge variant={vigencia.variant} className="text-[8px] px-3 py-1 font-black shadow-sm">
                    {vigencia.label}
                  </Badge>
                </div>
                
                <div className="p-10 flex flex-col items-center text-center flex-1">
                  <div className="w-24 h-24 rounded-mx-3xl border-4 border-white shadow-mx-xl overflow-hidden bg-surface-alt mb-8 group-hover:scale-105 transition-transform">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || '')}&background=4f46e5&color=fff&bold=true`} 
                      alt="" width={96} height={96} className="w-full h-full object-cover" 
                    />
                  </div>
                  <Typography variant="h3" className="mb-1 text-lg group-hover:text-brand-primary transition-colors">{member.name}</Typography>
                  <Typography variant="caption" tone="muted" className="tracking-widest uppercase">{member.role || 'ESPECIALISTA'}</Typography>
                  
                  <div className="w-full mt-10 grid grid-cols-2 gap-4">
                    <div className="bg-surface-alt p-4 rounded-mx-xl border border-border-default shadow-inner">
                      <Typography variant="caption" className="text-[8px] mb-1 block opacity-50 uppercase">ENTRADA</Typography>
                      <Typography variant="mono" className="text-xs font-black">{member.started_at ? format(parseISO(member.started_at), 'dd/MM/yy') : '---'}</Typography>
                    </div>
                    <div className="bg-surface-alt p-4 rounded-mx-xl border border-border-default shadow-inner">
                      <Typography variant="caption" className="text-[8px] mb-1 block opacity-50 uppercase">SAÍDA</Typography>
                      <Typography variant="mono" className="text-xs font-black">{member.ended_at ? format(parseISO(member.ended_at), 'dd/MM/yy') : 'ATIVA'}</Typography>
                    </div>
                  </div>
                </div>

                <footer className="p-6 border-t border-border-default bg-surface-alt/30 flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => setEditingMember(member)} className="flex-1 h-12 rounded-mx-lg shadow-sm" aria-label="Configurar">
                    <Settings2 size={18} />
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 h-12 rounded-mx-lg text-status-success hover:bg-status-success-surface shadow-sm" aria-label="Contato">
                    <Phone size={18} />
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1 h-12 rounded-mx-lg shadow-mx-sm" aria-label="Ver Dash">
                    <ChevronRight size={22} />
                  </Button>
                </footer>
              </motion.article>
            )})}
          </div>
        ) : (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-mx-xl bg-white border-2 border-dashed border-border-default rounded-[3rem]">
            <div className="w-24 h-24 rounded-mx-3xl bg-surface-alt shadow-xl flex items-center justify-center mb-10 border border-border-default"><Users size={48} className="text-text-tertiary" /></div>
            <Typography variant="h2" className="mb-2">Vácuo de Tropa</Typography>
            <Typography variant="p" tone="muted" className="max-w-xs uppercase">Nenhum especialista localizado na malha desta unidade.</Typography>
          </div>
        )}
      </div>

      {/* Modal Vigência */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-pure-black/60 backdrop-blur-xl" role="dialog" aria-modal="true">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="w-full max-w-xl">
              <Card className="p-10 md:p-14 border-none shadow-mx-xl bg-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
                
                <form onSubmit={handleUpdateVigencia} className="space-y-12 relative z-10">
                  <header className="flex items-center justify-between border-b border-border-default pb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-mx-xl bg-mx-indigo-50 flex items-center justify-center text-brand-primary border border-mx-indigo-100 shadow-inner"><Shield size={28} /></div>
                      <div>
                        <Typography variant="h3">Vigência Operacional</Typography>
                        <Typography variant="caption" tone="muted" className="mt-1 block uppercase tracking-widest">{editingMember.name}</Typography>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setEditingMember(null)} className="rounded-full w-12 h-12 bg-surface-alt hover:bg-white shadow-sm transition-all"><X size={24} /></Button>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <Typography variant="caption" className="ml-2 font-black uppercase tracking-widest">Início Contrato</Typography>
                      <Input type="date" required value={editingMember.started_at || ''} onChange={e => setEditingMember({...editingMember, started_at: e.target.value})} className="!h-14 !px-6" />
                    </div>
                    <div className="space-y-3">
                      <Typography variant="caption" className="ml-2 font-black uppercase tracking-widest">Término (Opcional)</Typography>
                      <Input type="date" value={editingMember.ended_at || ''} onChange={e => setEditingMember({...editingMember, ended_at: e.target.value})} className="!h-14 !px-6" />
                    </div>
                    
                    <div className="md:col-span-2 p-10 rounded-mx-2xl bg-surface-alt border border-border-default space-y-10 shadow-inner">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-mx-xl bg-white border border-border-default flex items-center justify-center text-status-success shadow-mx-sm group-hover:scale-110 transition-transform"><BadgeCheck size={24} /></div>
                          <div className="space-y-1">
                            <Typography variant="h3" className="text-base">Contrato Ativo</Typography>
                            <Typography variant="caption" tone="muted" className="text-[8px] uppercase tracking-widest">Habilitar no sistema operacional</Typography>
                          </div>
                        </div>
                        <input type="checkbox" checked={editingMember.is_active} onChange={e => setEditingMember({...editingMember, is_active: e.target.checked})} className="w-8 h-8 rounded-lg accent-brand-primary cursor-pointer shadow-sm" />
                      </label>
                      
                      <label className="flex items-center justify-between pt-10 border-t border-border-default cursor-pointer group">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-mx-xl bg-white border border-border-default flex items-center justify-center text-status-warning shadow-mx-sm group-hover:scale-110 transition-transform"><ShieldAlert size={24} /></div>
                          <div className="space-y-1">
                            <Typography variant="h3" className="text-base">Carência MX</Typography>
                            <Typography variant="caption" tone="muted" className="text-[8px] uppercase tracking-widest">Ignorar métricas residuais do mês</Typography>
                          </div>
                        </div>
                        <input type="checkbox" checked={editingMember.closing_month_grace} onChange={e => setEditingMember({...editingMember, closing_month_grace: e.target.checked})} className="w-8 h-8 rounded-lg accent-status-warning cursor-pointer shadow-sm" />
                      </label>
                    </div>
                  </div>

                  <footer className="pt-10 flex justify-end border-t border-border-default">
                    <Button type="submit" disabled={saving} className="h-16 px-12 rounded-full shadow-mx-xl">
                      {saving ? <RefreshCw className="animate-spin mr-2" /> : <ShieldCheck size={20} className="mr-2" />}
                      SINCRONIZAR VIGÊNCIA
                    </Button>
                  </footer>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
