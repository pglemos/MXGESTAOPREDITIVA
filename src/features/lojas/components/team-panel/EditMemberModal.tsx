import type { RefObject } from 'react'
import { Mail, Phone, Power, RefreshCw, Save, ShieldAlert, ShieldCheck, Trash2, TrendingUp, User, X } from 'lucide-react'
import { motion } from 'motion/react'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/molecules/Card'
import type { TeamMember } from '@/hooks/useTeam'
import type { MembershipRole, Store } from '@/types/database'

export type EditableTeamMember = TeamMember & {
  previous_store_id?: string | null
}

export function EditMemberModal({
  editingMember,
  editMemberDialogRef,
  onClose,
  onSubmit,
  onChange,
  editableStoreRoles,
  lojas,
  storeId,
  saving,
  pendingConfirmations,
  getDeleteMemberConfirmationKey,
  onDeleteMember,
}: {
  editingMember: EditableTeamMember
  editMemberDialogRef: RefObject<HTMLDivElement | null>
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onChange: (next: EditableTeamMember) => void
  editableStoreRoles: MembershipRole[]
  lojas: Store[]
  storeId: string | null
  saving: boolean
  pendingConfirmations: Set<string>
  getDeleteMemberConfirmationKey: (member: EditableTeamMember) => string
  onDeleteMember: (member: EditableTeamMember) => void
}) {
  return (
    <div ref={editMemberDialogRef} className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="edit-team-member-title">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-gray-950/60 backdrop-blur-md" />

      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="w-full max-w-2xl relative z-10 my-6">
        <Card className="shadow-xl border-none overflow-hidden">
          <CardHeader className="bg-gray-950 border-none text-white p-8 relative">
              <div className="absolute top-0 left-0 w-full h-px bg-emerald-600 shadow-lg" />
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center shadow-xl">
                          <ShieldCheck size={28} className="text-white" />
                      </div>
                      <div>
                          <CardTitle id="edit-team-member-title" className="text-white text-2xl">Editar integrante</CardTitle>
                          <Typography variant="caption" tone="white" className="opacity-60 block uppercase font-black tracking-widest text-[9px]">Dados de acesso, vínculo e vigência de {editingMember.name}</Typography>
                      </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" aria-label="Fechar edição de integrante" onClick={onClose} className="text-white/40 hover:text-white hover:bg-white/10 rounded-full">
                      <X size={20} />
                  </Button>
              </div>
          </CardHeader>

          <CardContent className="p-8 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="edit-member-name" className="px-2 text-xs font-black uppercase tracking-widest text-gray-500">Nome</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      id="edit-member-name"
                      name="name"
                      required
                      value={editingMember.name || ''}
                      onChange={e => onChange({ ...editingMember, name: e.target.value.toUpperCase() })}
                      className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-black uppercase tracking-tight focus:outline-none focus:border-emerald-600 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="edit-member-email" className="px-2 text-xs font-black uppercase tracking-widest text-gray-500">E-mail</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      id="edit-member-email"
                      name="email"
                      required
                      type="email"
                      value={editingMember.email || ''}
                      onChange={e => onChange({ ...editingMember, email: e.target.value })}
                      className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold focus:outline-none focus:border-emerald-600 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="edit-member-phone" className="px-2 text-xs font-black uppercase tracking-widest text-gray-500">Telefone</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      id="edit-member-phone"
                      name="phone"
                      value={editingMember.phone || ''}
                      onChange={e => onChange({ ...editingMember, phone: e.target.value })}
                      className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold focus:outline-none focus:border-emerald-600 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="edit-member-role" className="px-2 text-xs font-black uppercase tracking-widest text-gray-500">Papel na loja</label>
                  <select aria-label="Papel na loja"
                    id="edit-member-role"
                    name="role"
                    value={editingMember.role || 'vendedor'}
                    onChange={e => onChange({ ...editingMember, role: e.target.value as MembershipRole })}
                    className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-black uppercase focus:outline-none focus:border-emerald-600 transition-all"
                  >
                    {editableStoreRoles.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label htmlFor="edit-member-store" className="px-2 text-xs font-black uppercase tracking-widest text-gray-500">Loja vinculada</label>
                  <select aria-label="Loja vinculada"
                    id="edit-member-store"
                    name="store_id"
                    value={editingMember.store_id || storeId || ''}
                    onChange={e => onChange({ ...editingMember, store_id: e.target.value })}
                    className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-black uppercase focus:outline-none focus:border-emerald-600 transition-all"
                  >
                    <option value="">Selecione a loja</option>
                    {lojas.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="started-at" className="px-2 text-xs font-black uppercase tracking-widest text-gray-500">Início da vigência</label>
                  <input aria-label="Início da vigência"
                    id="started-at"
                    name="started_at"
                    type="date" required
                    value={editingMember.started_at || ''}
                    onChange={e => onChange({ ...editingMember, started_at: e.target.value })}
                    className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold focus:outline-none focus:border-emerald-600 transition-all uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="ended-at" className="px-2 text-xs font-black uppercase tracking-widest text-gray-500">Término (Opcional)</label>
                  <input aria-label="Término (Opcional)"
                    id="ended-at"
                    name="ended_at"
                    type="date"
                    value={editingMember.ended_at || ''}
                    onChange={e => onChange({ ...editingMember, ended_at: e.target.value })}
                    className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-bold focus:outline-none focus:border-emerald-600 transition-all uppercase"
                  />
                </div>

                <div className="col-span-2 space-y-3 pt-4 border-t border-gray-200">
                  <label className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-white hover:shadow-sm transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-600/10"><ShieldCheck size={20} /></div>
                      <div className="space-y-0.5">
                        <Typography variant="h3" className="text-sm font-black uppercase tracking-tight">Usuário ativo</Typography>
                        <Typography variant="caption" tone="muted" className="text-[9px] uppercase font-black">Permite acesso ao sistema</Typography>
                      </div>
                    </div>
                    <input type="checkbox" name="active" checked={editingMember.active ?? true} onChange={e => onChange({ ...editingMember, active: e.target.checked })} className="w-3 h-3 rounded-lg accent-emerald-600 cursor-pointer" />
                  </label>
                  <label className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-white hover:shadow-sm transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-600"><Power size={20} /></div>
                      <div className="space-y-0.5">
                        <Typography variant="h3" className="text-sm font-black uppercase tracking-tight">Vigência ativa</Typography>
                        <Typography variant="caption" tone="muted" className="text-[9px] uppercase font-black">Conta na lista operacional da loja</Typography>
                      </div>
                    </div>
                    <input type="checkbox" name="is_active" checked={editingMember.is_active} onChange={e => onChange({ ...editingMember, is_active: e.target.checked })} className="w-3 h-3 rounded-lg accent-emerald-600 cursor-pointer" />
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-white hover:shadow-sm transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-600"><TrendingUp size={20} /></div>
                      <div className="space-y-0.5">
                        <Typography variant="h3" className="text-sm font-black uppercase tracking-tight">Venda loja</Typography>
                        <Typography variant="caption" tone="muted" className="text-[9px] uppercase font-black">Conta como indicador operacional da unidade</Typography>
                      </div>
                    </div>
                    <input type="checkbox" name="is_venda_loja" checked={editingMember.is_venda_loja ?? false} onChange={e => onChange({ ...editingMember, is_venda_loja: e.target.checked })} className="w-3 h-3 rounded-lg accent-emerald-600 cursor-pointer" />
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-white hover:shadow-sm transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 border border-amber-500/10"><ShieldAlert size={20} /></div>
                      <div className="space-y-0.5">
                        <Typography variant="h3" className="text-sm font-black uppercase tracking-tight">Carência MX</Typography>
                        <Typography variant="caption" tone="muted" className="text-[9px] uppercase font-black">Ignorar metas do mês vigente</Typography>
                      </div>
                    </div>
                    <input type="checkbox" name="closing_month_grace" checked={editingMember.closing_month_grace} onChange={e => onChange({ ...editingMember, closing_month_grace: e.target.checked })} className="w-3 h-3 rounded-lg accent-amber-500 cursor-pointer" />
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="danger"
                  disabled={saving || pendingConfirmations.has(getDeleteMemberConfirmationKey(editingMember))}
                  onClick={() => onDeleteMember(editingMember)}
                  className="h-16 sm:w-40 rounded-2xl font-black uppercase tracking-wide text-xs shadow-lg"
                >
                  <Trash2 size={18} className="mr-2" />
                  ENCERRAR
                </Button>
                <Button
                  type="submit" disabled={saving}
                  className="h-16 flex-1 rounded-2xl font-black uppercase tracking-wide text-xs shadow-lg"
                >
                  {saving ? <RefreshCw className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                  SALVAR INTEGRANTE
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
