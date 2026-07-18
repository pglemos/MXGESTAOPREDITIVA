import { Phone, Mail, RefreshCw, Settings2, ShieldAlert, Trash2, TrendingUp, UserPlus, Users } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Avatar } from '@/components/atoms/Avatar'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import type { TeamMember } from '@/hooks/useTeam'

export function TeamListSection({
  teamError,
  onRetry,
  filteredTeam,
  getVigenciaStatus,
  storeId,
  canManageTeamMembers,
  onEditMember,
  onDeleteMember,
  pendingConfirmations,
  getDeleteMemberConfirmationKey,
  canCreateMembers,
  onCreateMember,
}: {
  teamError: string | null
  onRetry: () => void
  filteredTeam: TeamMember[]
  getVigenciaStatus: (m: TeamMember) => { label: string; variant: 'outline' | 'danger' | 'success'; color: string }
  storeId: string | null
  canManageTeamMembers: boolean
  onEditMember: (member: TeamMember) => void
  onDeleteMember: (member: TeamMember) => void
  pendingConfirmations: Set<string>
  getDeleteMemberConfirmationKey: (member: TeamMember) => string
  canCreateMembers: boolean
  onCreateMember: () => void
}) {
  return (
    <section className="order-1 min-w-0 pb-24">
      {teamError ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[40vh] space-y-6 text-center border-2 border-dashed border-red-600/20 rounded-2xl bg-red-50/40 p-8">
          <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-red-600 shadow-lg border border-red-600/10">
            <ShieldAlert size={34} />
          </div>
          <div className="space-y-3 max-w-lg">
            <Typography variant="h1" className="text-3xl font-black uppercase tracking-tight">Falha ao carregar equipe</Typography>
            <Typography variant="p" tone="muted" className="uppercase tracking-widest font-black text-xs leading-relaxed">{teamError}</Typography>
          </div>
          <Button type="button" variant="outline" onClick={onRetry} className="h-12 rounded-xl font-black uppercase tracking-widest">
            <RefreshCw size={16} className="mr-2" />
            Tentar novamente
          </Button>
        </motion.div>
      ) : filteredTeam.length > 0 ? (
        <Card className="border-none shadow-lg bg-white overflow-hidden">
          <CardHeader className="border-b border-gray-200 bg-white p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Integrantes vinculados</CardTitle>
                <CardDescription>Equipe operacional ativa no sistema de performance da loja.</CardDescription>
              </div>
              <Badge variant="outline" className="w-fit font-black uppercase">{filteredTeam.length} registros</Badge>
            </div>
          </CardHeader>
          <div className="hidden lg:grid store-team-grid gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-[9px] font-black uppercase tracking-widest text-gray-500">
            <span>Integrante</span>
            <span>Papel</span>
            <span>Status</span>
            <span>Vigência</span>
            <span className="text-right">Ações</span>
          </div>
          <div className="divide-y divide-border-default">
            {filteredTeam.map((member, i) => {
              const vigencia = getVigenciaStatus(member)
              return (
                <motion.div
                  key={`${member.id}-${member.store_id || storeId || 'sem-loja'}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="grid grid-cols-1 lg:store-team-grid gap-4 p-6 items-center hover:bg-gray-50/60 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={member.avatar_url || undefined}
                        alt={`Avatar de ${member.name || 'integrante'}`}
                        fallback={member.name || '?'}
                        size="lg"
                        className="rounded-xl bg-emerald-600/10 text-emerald-600 border-emerald-600/10"
                      />
                      <div className="min-w-0 flex-1">
                        <Typography variant="caption" className="block max-w-full font-black uppercase tracking-tight truncate">{member.name}</Typography>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-gray-500">
                          <span className="inline-flex items-center gap-1 min-w-0"><Mail size={11} />{member.email || 'sem e-mail'}</span>
                          <span className="inline-flex items-center gap-1"><Phone size={11} />{member.phone || 'sem telefone'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={member.role === 'vendedor' ? 'outline' : 'warning'} className="font-black uppercase">
                      {member.role || 'vendedor'}
                    </Badge>
                    {member.is_venda_loja && <Badge variant="brand" className="font-black uppercase">Venda loja</Badge>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={vigencia.variant} className="font-black uppercase">{vigencia.label}</Badge>
                    <Badge variant={member.checkin_today ? 'success' : 'outline'} className="font-black uppercase">
                      {member.checkin_today ? 'Check-in hoje' : 'Sem check-in'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-black uppercase">
                    <div>
                      <span className="block text-[9px] text-gray-500 tracking-widest">Início</span>
                      {member.started_at ? format(parseISO(member.started_at), 'dd/MM/yyyy') : '--'}
                    </div>
                    <div>
                      <span className="block text-[9px] text-gray-500 tracking-widest">Fim</span>
                      {member.ended_at ? format(parseISO(member.ended_at), 'dd/MM/yyyy') : '--'}
                    </div>
                  </div>

                  <div className="flex items-center justify-start lg:justify-end gap-2">
                    {canManageTeamMembers && (
                      <Button variant="outline" size="icon" onClick={() => onEditMember(member)} className="h-10 w-10 rounded-xl" aria-label={`Editar ${member.name}`}>
                        <Settings2 size={16} />
                      </Button>
                    )}
                    {canManageTeamMembers && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onDeleteMember(member)}
                        disabled={pendingConfirmations.has(getDeleteMemberConfirmationKey(member))}
                        className="h-10 w-10 rounded-xl text-red-600 hover:bg-red-50"
                        aria-label={`Encerrar vínculo de ${member.name}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                    <Button variant="outline" size="icon" onClick={() => member.phone && window.open(`tel:${member.phone}`)} disabled={!member.phone} className="h-10 w-10 rounded-xl" aria-label={member.phone ? `Ligar para ${member.name}` : `Telefone não informado para ${member.name}`}>
                      <Phone size={16} />
                    </Button>
                    <Button variant="outline" size="icon" asChild className="h-10 w-10 rounded-xl bg-gray-950 text-white border-none hover:bg-emerald-600" aria-label={`Ver performance de ${member.name}`}>
                      <Link to={`/relatorios/performance-vendedor?id=${member.id}`}>
                        <TrendingUp size={16} />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </Card>
      ) : (
        <Card className="border-none shadow-lg bg-white overflow-hidden">
          <CardHeader className="border-b border-gray-200 bg-white p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Integrantes vinculados</CardTitle>
                <CardDescription>Equipe operacional ativa no sistema de performance da loja.</CardDescription>
              </div>
              <Badge variant="outline" className="w-fit font-black uppercase">0 registros</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center space-y-4 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-gray-200">
                <Users size={28} strokeWidth={1.8} />
              </div>
              <div className="space-y-2 max-w-sm">
                <Typography variant="h3" className="font-black uppercase tracking-tight">Nenhum integrante vinculado</Typography>
                <Typography variant="p" tone="muted" className="block text-sm font-bold leading-relaxed">
                  Esta loja ainda não possui equipe operacional cadastrada no sistema. Use o cadastro direto ou compartilhe o link de pré-cadastro.
                </Typography>
              </div>
              {canCreateMembers && (
                <Button
                  onClick={onCreateMember}
                  className="h-12 rounded-xl px-6 font-black uppercase tracking-widest text-xs shadow-lg"
                >
                  <UserPlus size={18} className="mr-2" /> Novo integrante
                </Button>
              )}
            </motion.div>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
