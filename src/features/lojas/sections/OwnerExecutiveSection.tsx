import { ArrowRight, Building2, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { slugify } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { EmptyState } from '@/components/atoms/EmptyState'
import type { Store } from '@/types/database'

type StoreStat = { sellers: number; teamMembers: number; checkedIn: number; disciplinePct: number }

interface OwnerExecutiveSectionProps {
  ownerActiveStores: Store[]
  ownerAttentionStores: Array<{ store: Store; stat: StoreStat }>
  stats: Record<string, StoreStat>
}

/**
 * Painéis executivos exibidos apenas para o perfil Dono:
 * - "O que decidir hoje" (atenção + pré-cadastro)
 * - "Comparativo direto entre lojas"
 *
 * Extraído de `src/pages/Lojas.tsx` (Story 3.5 reconciliada, ADR-0050).
 */
export function OwnerExecutiveSection({
  ownerActiveStores,
  ownerAttentionStores,
  stats,
}: OwnerExecutiveSectionProps) {
  if (ownerActiveStores.length === 0) {
    return (
      <Card className="rounded-mx-lg border border-border-subtle bg-white shadow-mx-sm p-mx-md">
        <EmptyState
          size="lg"
          icon={<Building2 />}
          title="Nenhuma loja ativa vinculada"
          description="Seu perfil de Dono ainda não possui uma unidade ativa para acompanhamento executivo."
          nextStep="Solicite ao Admin MX vincular ou ativar a primeira loja da rede. Depois disso, esta tela passa a mostrar comparação, decisões e acompanhamento por unidade."
        />
      </Card>
    )
  }

  return (
    <section className="grid grid-cols-1 gap-mx-md xl:grid-cols-12">
      <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm xl:col-span-5">
        <div className="mb-mx-md flex items-start justify-between gap-mx-md">
          <div>
            <Typography variant="h3" className="uppercase tracking-tight">
              O que decidir hoje
            </Typography>
            <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">
              Prioridades executivas geradas pela disciplina e estrutura das lojas.
            </Typography>
          </div>
          <Compass size={24} className="shrink-0 text-brand-primary" aria-hidden="true" />
        </div>
        <div className="space-y-mx-sm">
          <div className="rounded-mx-lg border border-border-subtle bg-surface-alt p-mx-md">
            <Typography variant="tiny" className="font-black uppercase tracking-widest text-text-secondary">
              Unidades com atenção
            </Typography>
            <Typography
              variant="h2"
              tone={ownerAttentionStores.length ? 'warning' : 'success'}
              className="mt-mx-tiny tabular-nums"
            >
              {ownerAttentionStores.length}
            </Typography>
            <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">
              {ownerAttentionStores.length
                ? 'Revise loja sem equipe ou com disciplina abaixo de 80% antes da próxima reunião.'
                : 'Todas as lojas ativas têm estrutura e disciplina dentro do mínimo esperado.'}
            </Typography>
          </div>
          <div className="rounded-mx-lg border border-status-info/20 bg-status-info-surface p-mx-md">
            <Typography variant="tiny" className="font-black uppercase tracking-widest text-status-info">
              Pré-cadastro
            </Typography>
            <Typography variant="p" className="mt-mx-xs text-sm text-status-info">
              Links de pré-cadastro são operados pelo Admin MX para preservar governança de acesso.
            </Typography>
          </div>
        </div>
      </Card>

      <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm xl:col-span-7">
        <div className="mb-mx-md">
          <Typography variant="h3" className="uppercase tracking-tight">
            Comparativo direto entre lojas
          </Typography>
          <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">
            Use esta visão para decidir onde cobrar plano de ação e onde apenas acompanhar execução.
          </Typography>
        </div>
        <div className="grid grid-cols-1 gap-mx-sm md:grid-cols-2">
          {ownerActiveStores.map(store => {
            const sStat = stats[store.id] || { sellers: 0, teamMembers: 0, checkedIn: 0, disciplinePct: 0 }
            const needsAttention = sStat.teamMembers === 0 || sStat.sellers === 0 || sStat.disciplinePct < 80
            return (
              <Link
                key={store.id}
                to={`/lojas/${slugify(store.name)}?id=${store.id}`}
                className="group rounded-mx-lg border border-border-subtle bg-surface-alt p-mx-md transition-all hover:border-brand-primary hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15"
              >
                <div className="flex items-start justify-between gap-mx-sm">
                  <div className="min-w-0">
                    <Typography
                      variant="p"
                      className="font-black uppercase leading-tight group-hover:text-brand-primary"
                    >
                      {store.name}
                    </Typography>
                    <Typography
                      variant="tiny"
                      tone="muted"
                      className="mt-mx-tiny block font-bold uppercase"
                    >
                      {sStat.teamMembers} na equipe · {sStat.checkedIn}/{sStat.sellers} vendedores com registro
                    </Typography>
                  </div>
                  <Badge variant={needsAttention ? 'warning' : 'success'} className="shrink-0 rounded-mx-full">
                    {needsAttention ? 'DECIDIR' : 'ACOMPANHAR'}
                  </Badge>
                </div>
                <div className="mt-mx-md flex items-center justify-between">
                  <div>
                    <Typography
                      variant="tiny"
                      tone="muted"
                      className="font-black uppercase tracking-widest"
                    >
                      Disciplina
                    </Typography>
                    <Typography
                      variant="h2"
                      tone={sStat.disciplinePct < 80 ? 'error' : 'success'}
                      className="tabular-nums"
                    >
                      {sStat.disciplinePct}%
                    </Typography>
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-text-tertiary transition-transform group-hover:translate-x-1 group-hover:text-brand-primary"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            )
          })}
        </div>
      </Card>
    </section>
  )
}
