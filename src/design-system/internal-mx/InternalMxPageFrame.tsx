import type { ReactNode } from 'react'
import { Bell, CalendarDays, ChevronRight } from 'lucide-react'
import { getInternalMxPageMeta } from './internalMxPageRegistry'

export type InternalMxPageFrameProps = {
  pathname: string
  roleLabel: string
  unreadNotifications?: number
  onOpenNotifications?: () => void
  children: ReactNode
}

function currentDateLabel() {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date())
}

export default function InternalMxPageFrame({
  pathname,
  roleLabel,
  unreadNotifications = 0,
  onOpenNotifications,
  children,
}: InternalMxPageFrameProps) {
  const page = getInternalMxPageMeta(pathname)

  return (
    <div className="mxds-page-frame" data-mx-internal-page={page.key}>
      <div className="mxds-route-bar" aria-label="Contexto da página">
        <div className="mxds-route-breadcrumb">
          <span>MX Performance</span><ChevronRight size={13} aria-hidden="true" />
          <span>{page.group}</span><ChevronRight size={13} aria-hidden="true" />
          <strong>{page.title}</strong>
        </div>
        <div className="mxds-route-meta">
          <span className="mxds-route-date"><CalendarDays size={14} />{currentDateLabel()}</span>
          <button type="button" className="mxds-route-notifications" aria-label={`Notificações: ${unreadNotifications} não lidas`} onClick={onOpenNotifications}>
            <Bell size={17} />{unreadNotifications > 0 ? <span>{unreadNotifications > 99 ? '99+' : unreadNotifications}</span> : null}
          </button>
          <span className="mxds-route-role">{roleLabel}</span>
        </div>
      </div>
      <div className="mxds-page-content" id="mx-internal-content">{children}</div>
    </div>
  )
}
