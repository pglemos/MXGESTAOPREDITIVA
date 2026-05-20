import { format } from 'date-fns'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { usePDIs } from '@/hooks/useData'

type Props = { storeId: string }

export function PDIsSection({ storeId }: Props) {
  const { profile, role } = useAuth()
  const { pdis, loading, acknowledge } = usePDIs(storeId)

  if (loading) return <div className="p-mx-lg opacity-50">Carregando planos de carreira...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg animate-in fade-in slide-in-from-bottom-4 duration-500 pb-mx-xl">
      {pdis.length === 0 && (
        <Card className="p-mx-lg border-dashed text-center opacity-50 md:col-span-2 rounded-mx-2xl">
          <Typography variant="p">Nenhum PDI registrado para esta loja.</Typography>
        </Card>
      )}
      {pdis.map((pdi) => {
        const canSellerSign = profile?.id === pdi.seller_id && !pdi.seller_acknowledged_at
        const canManagerSign = (isPerfilInternoMx(role) || role === 'gerente') && !pdi.manager_acknowledged_at

        return (
          <Card key={pdi.id} className="p-mx-lg bg-white border border-border-default shadow-mx-md hover:border-brand-primary/30 transition-all group rounded-mx-2xl">
            <div className="flex justify-between items-start mb-mx-md">
              <div>
                <Typography variant="h3" className="text-lg group-hover:text-brand-primary transition-colors">{pdi.seller_name || 'Vendedor'}</Typography>
                <Typography variant="tiny" tone="muted">Plano criado em {format(new Date(pdi.created_at), 'dd/MM/yyyy')}</Typography>
              </div>
              <Badge variant={pdi.status === 'ativo' ? 'success' : 'outline'}>{pdi.status.toUpperCase()}</Badge>
            </div>

            <div className="space-y-mx-md mb-mx-md">
              <div className="p-mx-md bg-surface-alt/30 rounded-mx-xl">
                <Typography variant="tiny" className="font-bold text-text-tertiary uppercase mb-1 block">Objetivo 6 Meses</Typography>
                <Typography variant="p" className="text-sm font-bold italic">"{pdi.meta_6m}"</Typography>
              </div>
              <div className="grid grid-cols-2 gap-mx-md">
                <div>
                  <Typography variant="tiny" className="font-bold text-text-tertiary uppercase">Meta 1 Ano</Typography>
                  <Typography variant="p" className="text-xs">{pdi.meta_12m || '-'}</Typography>
                </div>
                <div>
                  <Typography variant="tiny" className="font-bold text-text-tertiary uppercase">Meta 2 Anos</Typography>
                  <Typography variant="p" className="text-xs">{pdi.meta_24m || '-'}</Typography>
                </div>
              </div>
            </div>

            <div className="pt-mx-md border-t border-border-subtle grid grid-cols-2 gap-mx-md">
              <div className="space-y-mx-xs">
                {pdi.seller_acknowledged_at ? (
                  <div className="flex items-center gap-mx-xs text-status-success">
                    <ShieldCheck className="w-mx-4 h-mx-4" />
                    <Typography variant="tiny" className="font-black uppercase tracking-widest text-mx-micro">Vendedor OK</Typography>
                  </div>
                ) : canSellerSign ? (
                  <Button variant="primary" size="sm" className="w-full font-black text-mx-micro" onClick={() => acknowledge(pdi.id, 'seller')}>ASSINAR VENDEDOR</Button>
                ) : (
                  <Typography variant="tiny" className="uppercase font-bold text-mx-micro opacity-30">Pendente Vendedor</Typography>
                )}
              </div>

              <div className="space-y-mx-xs">
                {pdi.manager_acknowledged_at ? (
                  <div className="flex items-center gap-mx-xs text-status-success">
                    <ShieldCheck className="w-mx-4 h-mx-4" />
                    <Typography variant="tiny" className="font-black uppercase tracking-widest text-mx-micro">Gestor OK</Typography>
                  </div>
                ) : canManagerSign ? (
                  <Button variant="outline" size="sm" className="w-full font-black text-mx-micro border-brand-primary text-brand-primary" onClick={() => acknowledge(pdi.id, 'manager')}>ASSINAR GESTOR</Button>
                ) : (
                  <Typography variant="tiny" className="uppercase font-bold text-mx-micro opacity-30">Pendente Gestor</Typography>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

export default PDIsSection
