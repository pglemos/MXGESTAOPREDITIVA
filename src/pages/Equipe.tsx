import { useTeam } from '@/hooks/useTeam'
import { useState, useMemo, useCallback } from 'react'
import { 
    Users, UserPlus, Search, Mail, Phone, Shield, 
    BadgeCheck, RefreshCw, X, ChevronRight, Star, 
    TrendingUp, Zap, Filter, Calendar, Settings2, ShieldAlert
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'

export default function Equipe() {
  const { team, loading, refetch, updateVigencia } = useTeam()
  const [searchTerm, setSearchTerm] = useState('')
  const [editingMember, setEditingMember] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [isRefetching, setIsRefetching] = useState(false)

  const filteredTeam = useMemo(() => {
    return team.filter(m => 
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [team, searchTerm])

  const stats = useMemo(() => [
    { label: 'Tropa Total', value: team.length, icon: Users, tone: 'bg-indigo-50 border-indigo-100 text-indigo-600' },
    { label: 'Operacionais', value: team.filter(m => m.checkin_today).length, icon: Zap, tone: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
    { label: 'Pendentes', value: team.filter(m => !m.checkin_today).length, icon: Clock, tone: 'bg-rose-50 border-rose-100 text-rose-600' },
    { label: 'Líderes', value: team.filter(m => m.role === 'gerente').length, icon: Star, tone: 'bg-amber-50 border-amber-100 text-amber-600' },
  ], [team])

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
    if (!m.is_active) return { label: 'INATIVO', color: 'bg-gray-100 text-gray-500' }
    if (m.ended_at && new Date(m.ended_at) < new Date()) return { label: 'ENCERRADO', color: 'bg-rose-100 text-rose-600' }
    return { label: 'ATIVO', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
  }

  if (loading) return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-white">
      <RefreshCw className="w-10 h-10 animate-spin text-brand-primary mb-4" />
      <Typography variant="caption" tone="muted" className="animate-pulse">Escaneando Hierarquia...</Typography>
    </div>
  )

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-lg text-text-primary bg-white">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-mx-xs">
            <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
            <Typography variant="h1">Time de <span className="text-brand-primary">Elite</span></Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md">Gestão de Tropa & Hierarquia</Typography>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => {setIsRefetching(true); refetch().then(() => setIsRefetching(false))}} 
            aria-label="Atualizar lista da equipe"
            className="rounded-xl shadow-mx-sm"
          >
            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
          </Button>
          <div className="relative group w-48 hidden sm:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
            <label htmlFor="team-search" className="sr-only">Buscar especialista</label>
            <input 
              id="team-search"
              name="team-search"
              type="text" 
              placeholder="BUSCAR..." 
              className="w-full bg-surface-alt border border-border-default rounded-full h-10 pl-9 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-primary transition-all shadow-inner" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <Button className="bg-brand-secondary h-10 px-6">
            <UserPlus size={18} aria-hidden="true" /> Novo Recruta
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-mx-sm shrink-0" aria-label="Resumo estatístico da equipe">
        {stats.map((item) => (
          <Card key={item.label} className="p-6 border-none bg-surface-alt shadow-inner group">
            <div className="flex items-center justify-between gap-mx-xs relative z-10">
              <div>
                <Typography variant="caption" tone="muted" className="mb-1">{item.label}</Typography>
                <Typography variant="h1" className="text-3xl tabular-nums leading-none">{item.value}</Typography>
              </div>
              <div className={cn('h-10 w-10 rounded-mx-md flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110', item.tone)} aria-hidden="true">
                <item.icon size={18} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 pb-mx-3xl" aria-live="polite">
        {filteredTeam.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg">
            {filteredTeam.map((member, i) => {
              const vigencia = getVigenciaStatus(member)
              return (
              <motion.article key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-mx-2xl border border-border-default flex flex-col group hover:shadow-mx-xl hover:-translate-y-1 relative overflow-hidden bg-white">
                <div className="p-6 border-b border-border-default bg-surface-alt/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", member.checkin_today ? "bg-status-success shadow-mx-sm" : "bg-text-tertiary/20")} aria-hidden="true" />
                    <Typography variant="caption" className="text-[8px]">{member.checkin_today ? 'Operacional' : 'Offline'}</Typography>
                  </div>
                  <Badge variant={member.is_active ? 'success' : 'danger'} className="text-[8px] px-2">
                    {vigencia.label}
                  </Badge>
                </div>
                <div className="p-8 flex flex-col items-center text-center flex-1">
                  <div className="w-20 h-20 rounded-mx-2xl border-4 border-white shadow-mx-lg overflow-hidden bg-surface-alt mb-mx-md group-hover:scale-105 transition-transform">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || '')}&background=4f46e5&color=fff&bold=true`} 
                      alt={`Avatar de ${member.name}`} 
                      width={80} height={80} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <Typography variant="h3" className="mb-1 group-hover:text-brand-primary transition-colors">{member.name}</Typography>
                  <Typography variant="caption" tone="muted">{member.role?.toUpperCase() || 'ESPECIALISTA'}</Typography>
                  
                  <div className="w-full mt-mx-lg grid grid-cols-2 gap-3">
                    <div className="bg-surface-alt p-3 rounded-xl border border-border-default shadow-inner">
                      <Typography variant="caption" className="text-[8px] mb-1">Entrada</Typography>
                      <Typography variant="mono" className="text-xs">{member.started_at ? format(parseISO(member.started_at), 'dd/MM/yy') : '---'}</Typography>
                    </div>
                    <div className="bg-surface-alt p-3 rounded-xl border border-border-default shadow-inner">
                      <Typography variant="caption" className="text-[8px] mb-1">Saída</Typography>
                      <Typography variant="mono" className="text-xs">{member.ended_at ? format(parseISO(member.ended_at), 'dd/MM/yy') : 'ATIVA'}</Typography>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-border-default bg-surface-alt/30 flex gap-2">
                  <Button 
                    variant="outline" size="sm"
                    onClick={() => setEditingMember(member)}
                    className="flex-1 h-12 rounded-xl"
                    aria-label={`Configurar vigência de ${member.name}`}
                  >
                    <Settings2 size={18} aria-hidden="true" />
                  </Button>
                  <Button 
                    variant="outline" size="sm"
                    className="flex-1 h-12 rounded-xl text-status-success hover:bg-status-success-surface"
                    aria-label={`Ligar para ${member.name}`}
                  >
                    <Phone size={18} aria-hidden="true" />
                  </Button>
                  <Button 
                    variant="secondary" size="sm"
                    className="flex-1 h-12 rounded-xl"
                    aria-label={`Ver performance de ${member.name}`}
                  >
                    <ChevronRight size={22} aria-hidden="true" />
                  </Button>
                </div>
              </motion.article>
            )})}
          </div>
        ) : (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-mx-xl bg-surface-alt/50 border-2 border-dashed border-border-default rounded-[3rem]">
            <div className="w-24 h-24 rounded-mx-3xl bg-white shadow-xl flex items-center justify-center mb-mx-lg border border-border-default" aria-hidden="true"><Users size={48} className="text-text-tertiary" /></div>
            <Typography variant="h2" className="mb-2">Vácuo de Tropa</Typography>
            <Typography variant="p" tone="muted" className="max-w-xs uppercase">Nenhum especialista localizado na loja.</Typography>
          </div>
        )}
      </div>

      {/* Modal de Gestão de Vigência */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] shadow-mx-xl w-full max-w-xl overflow-hidden border border-white"
            >
              <form onSubmit={handleUpdateVigencia} className="p-10 md:p-14 space-y-10">
                <div className="flex items-center justify-between border-b border-border-default pb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-brand-primary border border-indigo-100 shadow-inner" aria-hidden="true"><Shield size={24} /></div>
                    <div>
                      <Typography variant="h3" id="modal-title">Vigência Operacional</Typography>
                      <Typography variant="caption" tone="muted" className="mt-1">{editingMember.name}</Typography>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setEditingMember(null)} aria-label="Fechar modal" className="rounded-full w-10 h-10"><X size={20} aria-hidden="true" /></Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <Typography variant="caption" className="ml-2">Início de Contrato</Typography>
                    <div className="relative group">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
                      <input 
                        type="date" required value={editingMember.started_at || ''} 
                        onChange={e => setEditingMember({...editingMember, started_at: e.target.value})}
                        className="w-full bg-surface-alt border border-border-default rounded-xl h-14 pl-12 pr-4 font-bold text-slate-950 outline-none focus:border-brand-primary transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Typography variant="caption" className="ml-2">Término (Opcional)</Typography>
                    <div className="relative group">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
                      <input 
                        type="date" value={editingMember.ended_at || ''} 
                        onChange={e => setEditingMember({...editingMember, ended_at: e.target.value})}
                        className="w-full bg-surface-alt border border-border-default rounded-xl h-14 pl-12 pr-4 font-bold text-slate-950 outline-none focus:border-brand-primary transition-all"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 p-8 rounded-[2rem] bg-surface-alt border border-border-default space-y-8 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-border-default flex items-center justify-center text-status-success shadow-sm" aria-hidden="true"><BadgeCheck size={20} /></div>
                        <div>
                          <Typography variant="h3" className="text-sm">Contrato Ativo</Typography>
                          <Typography variant="caption" tone="muted" className="text-[8px]">Habilitar no sistema</Typography>
                        </div>
                      </div>
                      <input 
                        type="checkbox" checked={editingMember.is_active} 
                        onChange={e => setEditingMember({...editingMember, is_active: e.target.checked})}
                        className="w-7 h-7 rounded-lg accent-status-success cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-border-default">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-border-default flex items-center justify-center text-status-warning shadow-sm" aria-hidden="true"><ShieldAlert size={20} /></div>
                        <div>
                          <Typography variant="h3" className="text-sm">Carência de Fechamento</Typography>
                          <Typography variant="caption" tone="muted" className="text-[8px]">Ignorar métricas residuais</Typography>
                        </div>
                      </div>
                      <input 
                        type="checkbox" checked={editingMember.closing_month_grace} 
                        onChange={e => setEditingMember({...editingMember, closing_month_grace: e.target.checked})}
                        className="w-7 h-7 rounded-lg accent-status-warning cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-10 flex justify-end">
                  <Button type="submit" disabled={saving} className="px-12 py-6 rounded-full shadow-mx-xl">
                    {saving ? <RefreshCw className="animate-spin" aria-hidden="true" /> : 'Sincronizar Vigência'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
