import { Ban, BriefcaseBusiness, Check, ClipboardList, Copy, Link2, Mail, Phone, ShieldCheck, User } from 'lucide-react'
import { Typography } from '@/components/atoms/Typography'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import type { StorePreRegistration } from '@/types/database'

const getPreRegistrationConfirmationKey = (item: StorePreRegistration) => `pre-registration:${item.id}`

export function PreRegistrationQueue({
  canSharePreRegistrationLink,
  registrationLink,
  onCopyLink,
  canApprovePreRegistrations,
  loadingPreRegistrations,
  preRegistrations,
  expandedPreRegistrations,
  onToggleDetails,
  redactEmail,
  redactPhone,
  onReview,
  reviewingPreRegistrationId,
  pendingConfirmations,
}: {
  canSharePreRegistrationLink: boolean
  registrationLink: string
  onCopyLink: () => void
  canApprovePreRegistrations: boolean
  loadingPreRegistrations: boolean
  preRegistrations: StorePreRegistration[]
  expandedPreRegistrations: Set<string>
  onToggleDetails: (id: string) => void
  redactEmail: (email: string) => string
  redactPhone: (phone?: string | null) => string
  onReview: (item: StorePreRegistration, action: 'approve' | 'reject') => void
  reviewingPreRegistrationId: string | null
  pendingConfirmations: Set<string>
}) {
  if (!canSharePreRegistrationLink) return null

  return (
    <aside className="order-2 min-w-0 xl:sticky xl:top-6">
      <Card className="border border-gray-200 bg-white shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-gray-200 bg-gray-50/60 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-600/10 text-emerald-600 flex items-center justify-center shrink-0">
                <ClipboardList size={22} />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg">Pré-cadastros</CardTitle>
                <CardDescription>Fila de entrada e histórico de solicitações da loja.</CardDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => onCopyLink()}
              className="h-12 rounded-xl bg-white w-full"
              disabled={!registrationLink}
            >
              <Copy size={16} className="mr-2" />
              COPIAR LINK
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-600 min-w-0">
            <Link2 size={14} className="text-emerald-600 shrink-0" />
            <span className="truncate">{registrationLink || 'Link indisponível até a loja ser identificada'}</span>
          </div>
        </CardHeader>

        <CardContent className="p-4 mx-pre-registration-scroll">
          {!canApprovePreRegistrations ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <ShieldCheck size={24} className="mx-auto text-emerald-600" />
              <Typography variant="caption" className="mt-3 block font-black uppercase tracking-widest">Aprovação restrita ao Admin MX</Typography>
              <Typography variant="tiny" tone="muted" className="mt-2 block font-bold">A loja pode compartilhar o link; a fila de validação fica visível apenas para Admin MX e MX Master.</Typography>
            </div>
          ) : loadingPreRegistrations ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
          ) : preRegistrations.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {preRegistrations.map(item => {
                const detailsExpanded = expandedPreRegistrations.has(item.id)
                return (
                <div key={item.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-14 w-14 overflow-hidden rounded-2xl border border-gray-200 bg-white shrink-0">
                        {item.avatar_url ? (
                          <img src={item.avatar_url} alt={item.full_name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-emerald-600"><User size={20} /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Typography variant="caption" className="block max-w-full font-black uppercase tracking-tight truncate">{item.full_name}</Typography>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-gray-500">
                          <span className="inline-flex items-center gap-1"><Mail size={11} aria-hidden="true" />{detailsExpanded ? item.email : redactEmail(item.email)}</span>
                          <span className="inline-flex items-center gap-1"><Phone size={11} aria-hidden="true" />{detailsExpanded ? item.phone : redactPhone(item.phone)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={item.status === 'pending' ? 'warning' : item.status === 'synced' ? 'success' : 'outline'} className="font-black uppercase shrink-0">
                      {item.status}
                    </Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-black uppercase">
                    <div>
                      <span className="block text-[9px] text-gray-500 tracking-widest">Papel</span>
                      {item.role}
                    </div>
                    <div>
                      <span className="block text-[9px] text-gray-500 tracking-widest">Na loja</span>
                      {item.store_tenure}
                    </div>
                    <div>
                      <span className="block text-[9px] text-gray-500 tracking-widest">Mercado</span>
                      {item.market_experience}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs font-bold text-gray-600">
                    <BriefcaseBusiness size={13} className="text-emerald-600" />
                    <span>{item.segment}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onToggleDetails(item.id)}
                    className="mt-3 h-9 rounded-xl px-3 text-[9px] font-black uppercase tracking-widest text-emerald-600"
                    aria-expanded={detailsExpanded}
                  >
                    {detailsExpanded ? 'Ocultar dados sensíveis' : 'Ver dados sensíveis'}
                  </Button>
                  {item.role === 'dono' && detailsExpanded && (
                    <div className="mt-3 rounded-xl border border-emerald-600/15 bg-white p-3">
                      <Typography variant="tiny" tone="brand" className="mb-2 block font-black uppercase tracking-widest">
                        Dados administrativos
                      </Typography>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-bold text-gray-600">
                        <span><b>Razão:</b> {item.company_legal_name || 'não informado'}</span>
                        <span><b>CNPJ:</b> {item.company_cnpj || 'não informado'}</span>
                        <span><b>Telefone:</b> {item.company_administrative_phone || 'não informado'}</span>
                        <span><b>Endereço:</b> {item.company_address || 'não informado'}</span>
                      </div>
                    </div>
                  )}
                  {item.notes && detailsExpanded && (
                    <Typography variant="tiny" tone="muted" className="mt-3 block font-bold leading-relaxed">
                      {item.notes}
                    </Typography>
                  )}
                  {item.status === 'pending' && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        onClick={() => onReview(item, 'approve')}
                        disabled={reviewingPreRegistrationId === item.id || pendingConfirmations.has(getPreRegistrationConfirmationKey(item))}
                        className="h-11 rounded-xl font-black uppercase tracking-widest text-[9px]"
                      >
                        <Check size={15} className="mr-2" />
                        Aprovar login
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onReview(item, 'reject')}
                        disabled={reviewingPreRegistrationId === item.id || pendingConfirmations.has(getPreRegistrationConfirmationKey(item))}
                        className="h-11 rounded-xl font-black uppercase tracking-widest text-[9px] text-red-600 hover:bg-red-50"
                      >
                        <Ban size={15} className="mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              )})}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
              <Typography variant="h4" className="font-black uppercase tracking-tight">Nenhum pré-cadastro recebido</Typography>
              <Typography variant="p" tone="muted" className="mt-2 block text-sm font-bold">Assim que alguém preencher o link da loja, os dados aparecem aqui.</Typography>
            </div>
          )}
        </CardContent>
      </Card>
    </aside>
  )
}
