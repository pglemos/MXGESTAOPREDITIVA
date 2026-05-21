import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'

type Props = {
  isOwner: boolean
  isSeller: boolean
  unreadCount: number
}

export function NotificacoesRoleBanners({ isOwner, isSeller, unreadCount }: Props) {
  return (
    <>
      {isOwner && (
        <Card className="border border-status-info/20 bg-status-info-surface p-mx-lg shadow-mx-sm">
          <Typography variant="h3" className="uppercase tracking-tight text-status-info">
            Notificações filtradas para Dono
          </Typography>
          <Typography variant="p" className="mt-mx-xs text-sm text-status-info">
            Você recebe sinais de decisão, aprovações que exigem ciência e alertas de governança da rede. Ações técnicas de pré-cadastro, permissões e operação diária ficam com Admin MX ou gerente.
          </Typography>
        </Card>
      )}
      {isSeller && (
        <Card className="border border-brand-primary/15 bg-white p-mx-md shadow-mx-sm">
          <div className="flex flex-col gap-mx-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Typography variant="h3" className="uppercase tracking-tight">
                Parte do ritual diário
              </Typography>
              <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">
                Revise alertas depois do lançamento: pendências, feedbacks e avisos podem exigir ação antes de seguir para ranking ou treinamentos.
              </Typography>
            </div>
            <Badge
              variant={unreadCount > 0 ? 'danger' : 'success'}
              className="w-fit rounded-mx-full px-4 py-1"
            >
              {unreadCount > 0 ? `${unreadCount} pendente(s)` : 'Tudo lido'}
            </Badge>
          </div>
        </Card>
      )}
    </>
  )
}

export default NotificacoesRoleBanners
