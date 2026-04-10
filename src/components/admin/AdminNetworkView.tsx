import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, Users, Zap, Clock, ShieldCheck, Building2, Trash2, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { Button } from '@/components/atoms/Button'
import { useNetworkHierarchy } from '@/hooks/useNetworkHierarchy'
import { toast } from 'sonner'

export function AdminNetworkView() {
  const { networkData, loading, refetch, updateRole, removeMember } = useNetworkHierarchy()
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  if (loading) return <Typography>Carregando rede...</Typography>

  const handleRoleChange = async (userId: string, storeId: string, currentRole: string) => {
    const nextRole = currentRole === 'vendedor' ? 'gerente' : 'vendedor'
    setProcessing(`${userId}-${storeId}`)
    const { error } = await updateRole(userId, storeId, nextRole)
    if (error) toast.error('Erro ao alterar cargo')
    else toast.success('Cargo atualizado!')
    setProcessing(null)
  }

  const handleRemove = async (userId: string, storeId: string) => {
    if (!confirm('Tem certeza que deseja remover este membro da unidade?')) return
    setProcessing(`${userId}-${storeId}`)
    const { error } = await removeMember(userId, storeId)
    if (error) toast.error('Erro ao remover')
    else toast.success('Membro removido')
    setProcessing(null)
  }

  return (
    <div className="space-y-6">
      {networkData.map((store) => {
        const isExpanded = expandedStoreId === store.store_id
        const operacionais = store.members.filter((m: any) => m.checkin_today).length
        const total = store.members.length

        return (
          <Card key={store.store_id} className="overflow-hidden shadow-mx-sm border-border-default">
            <div 
              className="p-6 flex items-center justify-between cursor-pointer hover:bg-surface-alt transition-colors"
              onClick={() => setExpandedStoreId(isExpanded ? null : store.store_id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-mx-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <Building2 size={24} />
                </div>
                <div>
                  <Typography variant="h3" className="text-lg">{store.store_name}</Typography>
                  <Typography variant="tiny" tone="muted" className="uppercase tracking-widest">{total} Especialistas na unidade</Typography>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2 text-status-success">
                  <Zap size={18} />
                  <Typography variant="mono" className="font-bold">{operacionais}/{total} Operacionais</Typography>
                </div>
                <ChevronDown className={cn("transition-transform", isExpanded && "rotate-180")} />
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border-default bg-surface-alt/30"
                >
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {store.members.map((member: any) => (
                      <div key={member.id} className="bg-white p-4 rounded-mx-lg border border-border-default flex flex-col gap-4 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center border border-border-default overflow-hidden">
                            {member.avatar_url ? <img src={member.avatar_url} alt="" /> : <Users size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Typography className="font-bold truncate">{member.name}</Typography>
                            <Typography variant="tiny" tone="muted" className="uppercase">{member.role}</Typography>
                          </div>
                          {member.checkin_today ? <Zap size={16} className="text-status-success" /> : <Clock size={16} className="text-text-tertiary" />}
                        </div>
                        
                        <div className="flex gap-2 border-t pt-3">
                          <Button 
                            variant="outline" size="sm" className="flex-1 text-[10px]"
                            disabled={!!processing}
                            onClick={() => handleRoleChange(member.id, store.store_id, member.role)}
                          >
                            {member.role === 'vendedor' ? 'Promover' : 'Rebaixar'}
                          </Button>
                          <Button 
                            variant="danger" size="sm" className="px-2"
                            disabled={!!processing}
                            onClick={() => handleRemove(member.id, store.store_id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )
      })}
    </div>
  )
}
