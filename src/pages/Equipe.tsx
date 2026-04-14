import { useTeam } from '@/hooks/useTeam'
import { useState, useMemo, useCallback } from 'react'
import { 
    Users, UserPlus, Search, Mail, Phone, Shield, 
    BadgeCheck, RefreshCw, X, ChevronRight, Star, 
    TrendingUp, Zap, Filter, Calendar, Settings2, ShieldAlert, Clock, ShieldCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn, getAvatarUrl } from '@/lib/utils'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Typography } from '@/components/atoms/Typography'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'

import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Equipe() {
  const [searchParams] = useSearchParams()
  const urlStoreId = searchParams.get('id')
  const { team, loading, refetch, updateVigencia } = useTeam(urlStoreId || undefined)
  const { role } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [editingMember, setEditingMember] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [isRefetching, setIsRefetching] = useState(false)

  const filteredTeam = useMemo(() => {
    return (team || []).filter(m => 
      m.role === 'vendedor' && (
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.role?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [team, searchTerm])

  const stats = useMemo(() => {
    const vendedores = (team || []).filter(m => m.role === 'vendedor');
    return [
        { label: 'Tropa Total', value: vendedores.length, icon: Users, tone: 'brand' },
        { label: 'Operacionais', value: vendedores.filter(m => m.checkin_today).length, icon: Zap, tone: 'success' },
        { label: 'Pendentes', value: vendedores.filter(m => !m.checkin_today).length, icon: Clock, tone: 'error' },
        { label: 'Líderes', value: (team || []).filter(m => m.role === 'gerente').length, icon: Star, tone: 'warning' },
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
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg bg-surface-alt animate-in fade-in duration-500">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
            <div className="space-y-mx-xs text-center lg:text-left">
                <Skeleton className="h-mx-10 w-mx-64 mx-auto lg:mx-0" />
                <Skeleton className="h-mx-xs w-mx-48 mx-auto lg:mx-0" />
            </div>
            <div className="flex justify-center gap-mx-sm">
                <Skeleton className="h-mx-14 w-mx-14 rounded-mx-xl" />
                <Skeleton className="h-mx-14 w-mx-48 rounded-mx-xl" />
            </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-mx-xl rounded-mx-2xl" />)}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg mt-mx-lg">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-mx-64 rounded-mx-2xl" />)}
        </div>
    </main>
  )

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <div className="flex flex-col gap-mx-tiny text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-mx-sm">
            <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
            <Typography variant="h1">Time de <span className="text-mx-green-700">Elite</span></Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black opacity-40">Gestão de Tropa & Hierarquia MX</Typography>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0 w-full lg:w-auto">
          <div className="relative group w-full sm:w-mx-sidebar-expanded">
            <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
            <Input 
              placeholder="LOCALIZAR ESPECIALISTA..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="!pl-11 !h-12 !text-mx-tiny uppercase tracking-widest font-black"
            />
          </div>
          <div className="flex w-full sm:w-auto gap-mx-sm">
            <Button variant="outline" size="icon" onClick={() => {setIsRefetching(true); refetch().then(() => setIsRefetching(false))}} aria-label="Atualizar" className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl bg-white">
              <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
            </Button>
            {role === 'admin' && (
              <Button className="flex-1 sm:flex-none h-mx-xl px-8 shadow-mx-lg bg-brand-secondary uppercase font-black tracking-widest text-xs">
                <UserPlus size={18} className="mr-2" /> NOVO RECRUTA
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
        {stats.map((item) => (
          <Card key={item.label} className="p-mx-lg border-none shadow-mx-sm group hover:shadow-mx-lg transition-all bg-white relative overflow-hidden">
            <div className="absolute top-mx-0 right-mx-0 w-mx-3xl h-mx-3xl bg-brand-primary/5 rounded-mx-full blur-3xl -mr-12 -mt-12" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-mx-tiny">
                <Typography variant="caption" tone="muted" className="block uppercase tracking-widest text-mx-micro">{item.label}</Typography>
                <Typography variant="h1" className="text-4xl tabular-nums leading-none">{item.value}</Typography>
              </div>
              <div className={cn(
                'h-mx-xl w-mx-xl rounded-mx-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110',
                item.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                item.tone === 'success' ? 'bg-status-success-surface border-mx-emerald-100 text-status-success' :
                item.tone === 'error' ? 'bg-status-error-surface border-mx-rose-100 text-status-error' :
                'bg-status-warning-surface border-mx-amber-100 text-status-warning'
              )}>
                <item.icon size={22} strokeWidth={2} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex-1 min-h-0 pb-32" aria-live="polite">
        {filteredTeam.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg">
            {filteredTeam.map((member, i) => {
              const vigencia = getVigenciaStatus(member)
              return (
              <motion.article key={member.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="rounded-mx-3xl border-none shadow-mx-lg flex flex-col group hover:shadow-mx-xl hover:-translate-y-1 transition-all relative overflow-hidden bg-white h-full">
                <div className="p-mx-md border-b border-border-default bg-surface-alt/30 flex items-center justify-between relative overflow-hidden">
                  <div className="absolute top-mx-0 right-mx-0 w-mx-2xl h-mx-2xl bg-brand-primary/5 rounded-mx-full blur-xl -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-mx-xs relative z-10">
                    <div className={cn("w-mx-xs h-mx-xs rounded-mx-full", member.checkin_today ? "bg-status-success shadow-mx-sm animate-pulse" : "bg-text-tertiary/30")} aria-hidden="true" />
                    <Typography variant="caption" className="text-mx-micro font-black uppercase tracking-widest">{member.checkin_today ? 'Operacional' : 'Offline'}</Typography>
                  </div>
                  <Badge variant={vigencia.variant} className="text-mx-micro px-3 py-1 font-black shadow-sm relative z-10 border-none">
                    {vigencia.label}
                  </Badge>
                </div>
                
                <div className="p-mx-lg flex flex-col items-center text-center flex-1">
                  <div className="w-mx-20 h-mx-20 rounded-mx-full border-4 border-white shadow-mx-md overflow-hidden bg-surface-alt mb-6 group-hover:scale-105 transition-transform shrink-0">
                    <img 
                      src={getAvatarUrl(member.name || '', { background: '0D3B2E', color: '22C55E' })} 
                      alt={`Avatar de ${member.name}`} width={80} height={80} className="w-full h-full object-cover" 
                    />
                  </div>
                  <Typography variant="h3" className="mb-1 text-base uppercase font-black truncate max-w-full group-hover:text-brand-primary transition-colors">{member.name}</Typography>
                  <Typography variant="caption" tone="muted" className="text-mx-micro tracking-widest uppercase font-black opacity-40">{member.role || 'ESPECIALISTA'}</Typography>
                  
                  <div className="w-full mt-10 grid grid-cols-1 sm:grid-cols-2 gap-mx-sm">
                    <div className="bg-surface-alt p-mx-sm rounded-mx-xl border border-border-default shadow-inner group-hover:bg-white transition-all">
                      <Typography variant="caption" className="text-mx-micro mb-1 block opacity-50 uppercase font-black">ENTRADA</Typography>
                      <Typography variant="mono" className="text-xs font-black">{member.started_at ? format(parseISO(member.started_at), 'dd/MM/yy') : '---'}</Typography>
                    </div>
                    <div className="bg-surface-alt p-mx-sm rounded-mx-xl border border-border-default shadow-inner group-hover:bg-white transition-all">
                      <Typography variant="caption" className="text-mx-micro mb-1 block opacity-50 uppercase font-black">SAÍDA</Typography>
                      <Typography variant="mono" className="text-xs font-black">{member.ended_at ? format(parseISO(member.ended_at), 'dd/MM/yy') : 'ATIVA'}</Typography>
                    </div>
                  </div>
                </div>

                <footer className="p-mx-md border-t border-border-default bg-surface-alt/20 flex flex-wrap gap-mx-xs mt-auto relative z-10">
                  <Button variant="outline" size="sm" onClick={() => setEditingMember(member)} className="flex-1 h-mx-xl rounded-mx-lg bg-white shadow-sm border-border-strong hover:border-brand-primary basis-1/2" aria-label="Configurar vigência">
                    <Settings2 size={18} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(`tel:${member.phone}`)} className="flex-1 h-mx-xl rounded-mx-lg text-status-success bg-white hover:bg-status-success-surface border-border-strong hover:border-status-success shadow-sm basis-1/2" aria-label="Ligar para vendedor">
                    <Phone size={18} />
                  </Button>
                  <Button asChild variant="secondary" size="sm" className="w-full h-mx-xl rounded-mx-lg shadow-mx-md font-black uppercase text-xs">
                    <Link to={`/performance?id=${member.id}`}>VER PERFORMANCE</Link>
                  </Button>
                </footer>
              </motion.article>
            )})}
          </div>
        ) : (
          <div className="h-full min-h-mx-section-sm flex flex-col items-center justify-center text-center p-mx-xl bg-white border-2 border-dashed border-border-default rounded-mx-3xl group hover:bg-surface-alt/20 transition-all">
            <div className="w-mx-3xl h-mx-3xl rounded-mx-3xl bg-surface-alt shadow-mx-xl flex items-center justify-center mb-8 border border-border-default group-hover:scale-110 transition-transform" aria-hidden="true">
                <Users size={48} className="text-text-tertiary opacity-20" />
            </div>
            <Typography variant="h2" className="mb-4 uppercase tracking-tighter">Vácuo de Tropa</Typography>
            <Typography variant="caption" tone="muted" className="max-w-xs uppercase tracking-widest font-black text-xs leading-relaxed opacity-40">Nenhum especialista localizado na malha desta unidade operacional.</Typography>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-mx-md bg-mx-black/60 backdrop-blur-md" role="dialog" aria-modal="true">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="w-full max-w-xl">
              <Card className="p-mx-lg md:p-14 border-none shadow-mx-2xl bg-white overflow-hidden relative rounded-mx-3xl">
                <div className="absolute top-mx-0 right-mx-0 w-mx-sidebar-expanded h-mx-64 bg-brand-primary/5 rounded-mx-full blur-3xl -mr-32 -mt-32" />
                
                <form onSubmit={handleUpdateVigencia} className="space-y-mx-xl relative z-10">
                  <header className="flex items-center justify-between border-b border-border-default pb-8">
                    <div className="flex items-center gap-mx-sm">
                      <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-mx-indigo-50 flex items-center justify-center text-brand-primary border border-mx-indigo-100 shadow-inner"><Shield size={28} /></div>
                      <div>
                        <Typography variant="h3" className="font-black uppercase">Vigência Operacional</Typography>
                        <Typography variant="caption" tone="muted" className="mt-1 block uppercase tracking-widest font-black opacity-40">{editingMember.name}</Typography>
                      </div>
                    </div>
                    <Button 
                        variant="ghost" size="sm" 
                        onClick={() => setEditingMember(null)} 
                        className="rounded-mx-full w-mx-xl h-mx-xl bg-surface-alt hover:bg-white shadow-sm transition-all"
                        aria-label="Fechar modal"
                    >
                        <X size={24} />
                    </Button>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg">
                    <div className="space-y-mx-xs">
                      <Typography variant="caption" className="ml-2 font-black uppercase tracking-widest text-text-tertiary">Início Contrato</Typography>
                      <Input type="date" required value={editingMember.started_at || ''} onChange={e => setEditingMember({...editingMember, started_at: e.target.value})} className="!h-14 !px-6 font-bold" />
                    </div>
                    <div className="space-y-mx-xs">
                      <Typography variant="caption" className="ml-2 font-black uppercase tracking-widest text-text-tertiary">Término (Opcional)</Typography>
                      <Input type="date" value={editingMember.ended_at || ''} onChange={e => setEditingMember({...editingMember, ended_at: e.target.value})} className="!h-14 !px-6 font-bold" />
                    </div>
                    
                    <div className="md:col-span-2 p-mx-lg rounded-mx-2xl bg-surface-alt border border-border-default space-y-mx-lg shadow-inner">
                      <label className="flex items-center justify-between cursor-pointer group p-mx-sm rounded-mx-xl hover:bg-white transition-all">
                        <div className="flex items-center gap-mx-md">
                          <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-white border border-border-default flex items-center justify-center text-status-success shadow-mx-sm group-hover:scale-110 transition-transform"><BadgeCheck size={24} /></div>
                          <div className="space-y-mx-tiny">
                            <Typography variant="h3" className="text-base font-black uppercase tracking-tight">Contrato Ativo</Typography>
                            <Typography variant="caption" tone="muted" className="text-mx-micro uppercase tracking-widest font-black opacity-40">Habilitar no sistema operacional</Typography>
                          </div>
                        </div>
                        <input type="checkbox" checked={editingMember.is_active} onChange={e => setEditingMember({...editingMember, is_active: e.target.checked})} className="w-mx-lg h-mx-lg rounded-mx-lg accent-brand-primary cursor-pointer shadow-sm" />
                      </label>
                      
                      <label className="flex items-center justify-between pt-mx-lg border-t border-border-default cursor-pointer group p-mx-sm rounded-mx-xl hover:bg-white transition-all">
                        <div className="flex items-center gap-mx-md">
                          <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-white border border-border-default flex items-center justify-center text-status-warning shadow-mx-sm group-hover:scale-110 transition-transform"><ShieldAlert size={24} /></div>
                          <div className="space-y-mx-tiny">
                            <Typography variant="h3" className="text-base font-black uppercase tracking-tight">Carência MX</Typography>
                            <Typography variant="caption" tone="muted" className="text-mx-micro uppercase tracking-widest font-black opacity-40">Ignorar métricas residuais do mês</Typography>
                          </div>
                        </div>
                        <input type="checkbox" checked={editingMember.closing_month_grace} onChange={e => setEditingMember({...editingMember, closing_month_grace: e.target.checked})} className="w-mx-lg h-mx-lg rounded-mx-lg accent-status-warning cursor-pointer shadow-sm" />
                      </label>
                    </div>
                  </div>

                  <footer className="pt-10 flex justify-end border-t border-border-default">
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto h-mx-2xl px-12 rounded-mx-full shadow-mx-xl bg-brand-secondary font-black uppercase tracking-widest">
                      {saving ? <RefreshCw className="animate-spin mr-3" /> : <ShieldCheck size={20} className="mr-3" />}
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
