import { Building2, Copy, Link2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { isAdministradorMx } from '@/hooks/useAuth'
import { cn, slugify } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import type { Column } from '@/components/organisms/DataGrid'
import { OPERATIONAL_ACTION_LABELS } from '@/lib/ui/actionLabels'
import type { Store } from '@/types/database'

type StoreStat = {
  sellers: number
  teamMembers: number
  checkedIn: number
  disciplinePct: number
}

interface BuildColumnsParams {
  stats: Record<string, StoreStat>
  role: string | null | undefined
  isOwner: boolean
  copyRegistrationLink: (storeName: string) => void
  getRegistrationLink: (storeName: string) => string
  handleArchiveStore: (store: Store) => void
  toggleStoreStatus: (storeId: string, active: boolean) => Promise<{ error?: string | null }>
}

export function buildStoreColumns({
  stats,
  role,
  isOwner,
  copyRegistrationLink,
  getRegistrationLink,
  handleArchiveStore,
  toggleStoreStatus,
}: BuildColumnsParams): Column<Store>[] {
  return [
    {
      key: 'name',
      header: 'Unidade',
      render: (store) => (
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600"
            aria-hidden="true"
          >
            <Building2 size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <Typography variant="p" className="font-semibold text-gray-800">
              {store.name}
            </Typography>
            <Typography variant="tiny" tone="muted" className="mt-1 block">
              ID {store.id.split('-')[0]}
            </Typography>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      desktopOnly: true,
      render: (store) => {
        const stat = stats[store.id] || {
          sellers: 0,
          teamMembers: 0,
          checkedIn: 0,
          disciplinePct: 0,
        }
        return (
          <Badge variant={store.active ? 'success' : 'outline'}>
            {store.active
              ? stat.teamMembers > 0
                ? 'Operando'
                : 'Sem equipe'
              : 'Inativa'}
          </Badge>
        )
      },
    },
    {
      key: 'metrics',
      header: 'Operacional',
      align: 'center',
      render: (store) => {
        const stat = stats[store.id] || {
          sellers: 0,
          teamMembers: 0,
          checkedIn: 0,
          disciplinePct: 0,
        }
        return (
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <Typography variant="tiny" tone="muted">
                Equipe
              </Typography>
              <Typography variant="p" className="mt-1 font-semibold tabular-nums text-gray-800">
                {stat.teamMembers}
              </Typography>
            </div>
            <span className="h-8 w-px bg-border-subtle" aria-hidden="true" />
            <div className="text-center">
              <Typography variant="tiny" tone="muted">
                Disciplina
              </Typography>
              <Typography
                variant="p"
                tone={stat.disciplinePct < 80 ? 'error' : 'success'}
                className="mt-1 font-semibold tabular-nums"
              >
                {stat.disciplinePct}%
              </Typography>
            </div>
          </div>
        )
      },
    },
    {
      key: 'registration',
      header: 'Pré-cadastro',
      desktopOnly: true,
      render: (store) => (
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Link2
              size={14}
              className={cn(
                'shrink-0',
                isAdministradorMx(role) ? 'text-emerald-600' : 'text-gray-500',
              )}
              aria-hidden="true"
            />
            <Typography variant="tiny" tone="muted" className="truncate">
              {isAdministradorMx(role)
                ? 'Disponível para cópia segura'
                : isOwner
                  ? 'Operado pelo Admin MX'
                  : 'Restrito ao Admin MX'}
            </Typography>
          </div>
          {isAdministradorMx(role) ? (
            <Typography
              variant="tiny"
              className="block max-w-64 truncate rounded-lg bg-gray-50 px-2 py-1 font-mono text-gray-600"
              title={getRegistrationLink(store.name)}
            >
              {getRegistrationLink(store.name)}
            </Typography>
          ) : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (store) => (
        <div
          role="presentation"
          className="flex items-center justify-end gap-2"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {store.active ? (
            <>
              <Button asChild variant="secondary" size="sm">
                <Link to={`/lojas/${slugify(store.name)}?id=${store.id}`}>
                  {isOwner ? 'Abrir unidade' : OPERATIONAL_ACTION_LABELS.openDashboard}
                </Link>
              </Button>
              {!isOwner ? (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/lojas/${slugify(store.name)}?id=${store.id}&tab=equipe`}>
                    {OPERATIONAL_ACTION_LABELS.openTeam}
                  </Link>
                </Button>
              ) : null}
              {isAdministradorMx(role) ? (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyRegistrationLink(store.name)}
                    aria-label={`Copiar link de pré-cadastro de ${store.name}`}
                  >
                    <Copy size={16} aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleArchiveStore(store)}
                    className="text-gray-500 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Desativar ${store.name}`}
                  >
                    <X size={16} aria-hidden="true" />
                  </Button>
                </>
              ) : null}
            </>
          ) : isAdministradorMx(role) ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toggleStoreStatus(store.id, true)}
            >
              Restaurar
            </Button>
          ) : null}
        </div>
      ),
    },
  ]
}
