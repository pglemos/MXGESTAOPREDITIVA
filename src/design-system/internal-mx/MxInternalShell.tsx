import { useMemo, type ReactNode } from 'react'
import { Bell, LogOut, Settings, User } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppShell, SidebarAccountMenu } from '../../../packages/mx-ui/src'
import type { UserRole } from '@/types/database'
import { buildInternalMxNavigation } from './internalMxNavigation'
import { getInternalMxPageMeta } from './internalMxPageRegistry'
import InternalMxPageFrame from './InternalMxPageFrame'

export type MxInternalShellProps = {
  role: UserRole
  profileName: string
  profileRoleLabel: string
  avatarUrl?: string | null
  unreadNotifications?: number
  isSimulating?: boolean
  simulationLabel?: string
  simulationBase?: string
  simulationStore?: string
  onStopSimulation?: () => void
  onSignOut: () => Promise<void> | void
  children: ReactNode
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length ? parts.slice(0, 2).map(part => part[0]?.toUpperCase()).join('') : 'MX'
}

export default function MxInternalShell({
  role, profileName, profileRoleLabel, avatarUrl, unreadNotifications = 0,
  isSimulating = false, simulationLabel = 'Perfil', simulationBase = 'Admin MX',
  simulationStore = 'Sandbox MX', onStopSimulation, onSignOut, children,
}: MxInternalShellProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const sections = useMemo(() => buildInternalMxNavigation(role, { unreadNotifications }), [role, unreadNotifications])
  const page = getInternalMxPageMeta(location.pathname)
  const account = (
    <SidebarAccountMenu initials={initialsFor(profileName)} avatarUrl={avatarUrl} name={profileName} role={profileRoleLabel} items={[
      { key: 'profile', label: 'Meu Perfil', icon: User, onSelect: () => navigate('/perfil') },
      { key: 'preferences', label: 'Preferências', icon: Settings, onSelect: () => navigate('/configuracoes') },
      { key: 'notifications', label: 'Notificações', icon: Bell, onSelect: () => navigate('/notificacoes') },
      { key: 'logout', label: 'Sair', icon: LogOut, onSelect: () => void onSignOut() },
    ]} />
  )

  return (
    <AppShell sections={sections} pathname={location.pathname} onNavigate={navigate} sidebarAccount={account} mobileTitle={page.title}>
      {isSimulating ? <div className="mxds-simulation-banner" role="status"><span>Simulação: {simulationLabel} · Base: {simulationBase} · Loja: {simulationStore}</span><button type="button" onClick={onStopSimulation}>Encerrar simulação</button></div> : null}
      <InternalMxPageFrame pathname={location.pathname} roleLabel={profileRoleLabel} unreadNotifications={unreadNotifications} onOpenNotifications={() => navigate('/notificacoes')}>
        {children}
      </InternalMxPageFrame>
    </AppShell>
  )
}
