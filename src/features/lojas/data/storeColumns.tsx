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

type StoreStat = { sellers: number; teamMembers: number; checkedIn: number; disciplinePct: number }

interface BuildColumnsParams {
  stats: Record<string, StoreStat>
  role: string | null | undefined
  isOwner: boolean
  copyRegistrationLink: (storeName: string) => void
  getRegistrationLink: (storeName: string) => string
  handleArchiveStore: (store: Store) => void
  toggleStoreStatus: (storeId: string, active: boolean) => Promise<{ error?: string | null }>
}

/**
 * Constrói as colunas do DataGrid de Lojas.
 *
 * Extraído de `src/pages/Lojas.tsx` (Story 3.5 reconciliada, ADR-0050).
 */
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
      header: 'UNIDADE',
      render: store => (
        <div className="flex items-center gap-mx-sm relative z-10 min-w-0">
          <div
            className="w-mx-8 h-mx-8 sm:w-mx-14 sm:h-mx-14 rounded-mx-lg sm:rounded-mx-xl bg-white border border-border-default flex items-center justify-center text-brand-primary shadow-mx-sm group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-white transition-all transform group-hover:rotate-3 shrink-0"
            aria-hidden="true"
          >
            <Building2 size={18} className="sm:size-mx-md" />
          </div>
          <div className="min-w-0 flex-1">
            <Typography
              variant="h3"
              className="text-sm sm:text-base uppercase tracking-tight group-hover:text-brand-primary transition-colors font-black leading-tight whitespace-normal break-words"
            >
              {store.name}
            </Typography>
            <Typography variant="tiny" tone="muted" className="text-mx-nano sm:text-mx-tiny font-black uppercase mt-0.5">
              ID: {store.id.split('-')[0]}
            </Typography>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      desktopOnly: true,
      render: store => {
        const sStat = stats[store.id] || { sellers: 0, teamMembers: 0, checkedIn: 0, disciplinePct: 0 }
        return (
          <Badge
            variant={store.active ? 'success' : 'outline'}
            className="px-3 py-1 rounded-mx-full text-mx-tiny font-black shadow-sm uppercase border-none"
          >
            {store.active ? (sStat.teamMembers > 0 ? 'OPERANDO' : 'SEM EQUIPE') : 'INATIVA'}
          </Badge>
        )
      },
    },
    {
      key: 'metrics',
      header: 'OPERACIONAL',
      align: 'center',
      render: store => {
        const sStat = stats[store.id] || { sellers: 0, teamMembers: 0, checkedIn: 0, disciplinePct: 0 }
        return (
          <div className="flex items-center justify-center gap-mx-xs sm:gap-mx-md">
            <div className="text-center">
              <Typography
                variant="tiny"
                className="font-black text-text-label uppercase text-mx-nano sm:text-mx-tiny"
              >
                Equipe
              </Typography>
              <Typography variant="h3" className="text-xs sm:text-base tabular-nums">
                {sStat.teamMembers}
              </Typography>
            </div>
            <div className="w-px h-mx-sm sm:h-mx-md bg-border-default mx-1 sm:mx-2" aria-hidden="true" />
            <div className="text-center">
              <Typography
                variant="tiny"
                className="font-black text-text-label uppercase text-mx-nano sm:text-mx-tiny"
              >
                Disciplina
              </Typography>
              <Typography
                variant="h3"
                tone={sStat.disciplinePct < 80 ? 'error' : 'success'}
                className="text-xs sm:text-base tabular-nums"
              >
                {sStat.disciplinePct}%
              </Typography>
            </div>
          </div>
        )
      },
    },
    {
      key: 'registration',
      header: 'PRÉ-CADASTRO',
      desktopOnly: true,
      render: store => (
        <div className="flex min-w-0 flex-col gap-mx-tiny">
          <div className="flex items-center gap-mx-xs min-w-0">
            <Link2
              size={14}
              className={cn('shrink-0', isAdministradorMx(role) ? 'text-brand-primary' : 'text-text-tertiary')}
              aria-hidden="true"
            />
            <Typography variant="tiny" tone="muted" className="font-bold truncate max-w-mx-48">
              {isAdministradorMx(role)
                ? 'Disponível por cópia segura'
                : isOwner
                ? 'Admin MX opera este link'
                : 'Restrito ao Admin MX'}
            </Typography>
          </div>
          {isAdministradorMx(role) && (
            <Typography
              variant="tiny"
              className="block max-w-mx-64 truncate rounded-mx-md bg-surface-alt px-mx-xs py-mx-tiny font-mono text-text-secondary"
              title={getRegistrationLink(store.name)}
            >
              {getRegistrationLink(store.name)}
            </Typography>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'AÇÕES',
      align: 'right',
      render: store => (
        <div
          role="presentation"
          className="flex items-center justify-end gap-mx-tiny sm:gap-mx-xs relative z-10"
          onClick={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
        >
          {store.active ? (
            <>
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="h-mx-lg sm:h-mx-xl px-3 sm:px-4 rounded-mx-lg shadow-mx-md font-black text-mx-nano sm:text-mx-tiny"
              >
                <Link to={`/lojas/${slugify(store.name)}?id=${store.id}`}>
                  {isOwner ? 'Abrir unidade' : OPERATIONAL_ACTION_LABELS.openDashboard}
                </Link>
              </Button>
              {!isOwner && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-mx-lg sm:h-mx-xl px-3 sm:px-4 rounded-mx-lg shadow-mx-md font-black text-mx-nano sm:text-mx-tiny border-border-strong bg-white"
                >
                  <Link to={`/lojas/${slugify(store.name)}?id=${store.id}&tab=equipe`}>
                    {OPERATIONAL_ACTION_LABELS.openTeam}
                  </Link>
                </Button>
              )}
              {isAdministradorMx(role) && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyRegistrationLink(store.name)}
                    className="h-mx-lg w-mx-lg sm:h-mx-xl sm:w-mx-xl rounded-mx-lg shadow-mx-md bg-white border-border-strong"
                    aria-label={`Copiar link de pré-cadastro de ${store.name}`}
                  >
                    <Copy size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleArchiveStore(store)}
                    className="h-mx-lg w-mx-lg sm:h-mx-xl sm:w-mx-xl rounded-mx-lg text-text-tertiary hover:text-status-error hover:bg-status-error-surface"
                    aria-label={`Desativar ${store.name}`}
                  >
                    <X size={16} />
                  </Button>
                </>
              )}
            </>
          ) : isAdministradorMx(role) ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toggleStoreStatus(store.id, true)}
              className="h-mx-lg sm:h-mx-xl px-4 rounded-mx-lg shadow-mx-md font-black text-mx-nano sm:text-mx-tiny bg-status-success hover:opacity-90 text-white"
            >
              Restaurar
            </Button>
          ) : null}
        </div>
      ),
    },
  ]
}
