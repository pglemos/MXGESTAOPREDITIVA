import React, { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { Avatar } from './atoms/Avatar'
import { NotificationBellButton } from './NotificationBellButton'
import MxLogo from '@/assets/mx-logo.png'

export type MxSidebarNavItem = {
  key?: string
  label: string
  path: string
  icon?: React.ElementType | React.ReactElement | React.ReactNode
  badge?: string
  activePaths?: string[]
  special?: boolean
}

export type MxSidebarNavSection = {
  key?: string
  label: string
  items: MxSidebarNavItem[]
}

export type MxSidebarShellProps = {
  children: React.ReactNode
  profileName?: string | null
  profileRoleLabel?: string | null
  moduleLabel: string
  avatarUrl?: string | null
  navSections: MxSidebarNavSection[]
  onSignOut: () => Promise<void> | void
  profilePath?: string
  settingsPath?: string
  notificationsPath?: string
  sidebarLabel?: string
  isSimulating?: boolean
  simulationLabel?: string
  simulationBase?: string
  simulationStore?: string
  onStopSimulation?: () => void
}

function isNavItemActive(
  item: MxSidebarNavItem,
  location: { pathname: string; search: string },
) {
  const paths = item.activePaths ?? [item.path]
  return paths.some((rawPath) => {
    const [path, query = ''] = rawPath.split('?')
    const pathMatches =
      location.pathname === path ||
      (!query && location.pathname.startsWith(`${path}/`))

    if (!pathMatches) return false
    return query ? location.search === `?${query}` : true
  })
}

function NavItemIcon({
  icon,
  size,
  className,
}: {
  icon: MxSidebarNavItem['icon']
  size: number
  className?: string
}) {
  if (
    typeof icon === 'function' ||
    (typeof icon === 'object' && icon !== null && 'render' in icon)
  ) {
    const Icon = icon as LucideIcon
    return (
      <Icon
        size={size}
        strokeWidth={1.8}
        className={className}
        aria-hidden="true"
      />
    )
  }

  if (React.isValidElement(icon)) {
    return React.cloneElement(
      icon as React.ReactElement<Record<string, unknown>>,
      {
        size,
        strokeWidth: 1.8,
        className: cn(
          (icon.props as { className?: string }).className,
          className,
        ),
        'aria-hidden': true,
      },
    )
  }

  return (
    <span className={className} aria-hidden="true">
      {icon}
    </span>
  )
}

function CollapsedTooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-[150] -translate-y-1/2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  )
}

export default function MxSidebarShell({
  children,
  profileName,
  profileRoleLabel = 'Perfil MX',
  moduleLabel,
  avatarUrl,
  navSections,
  onSignOut,
  profilePath = '/perfil',
  settingsPath = '/configuracoes',
  notificationsPath = '/notificacoes',
  sidebarLabel = 'Menu principal MX',
  isSimulating = false,
  simulationLabel = 'Perfil',
  simulationBase = 'Admin MX',
  simulationStore = 'Sandbox MX',
  onStopSimulation,
}: MxSidebarShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const drawerRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useFocusTrap(drawerRef, mobileOpen)

  const displayName = profileName?.trim() || 'Usuário MX'
  const displayRole = profileRoleLabel?.trim() || 'Perfil MX'
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'MX'

  const mobileTitle = useMemo(() => {
    const activeItem = navSections
      .flatMap((section) => section.items)
      .find((item) => isNavItemActive(item, location))

    return activeItem?.label || 'MX Performance'
  }, [location, navSections])

  useEffect(() => {
    if (!mobileOpen && !userMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMobileOpen(false)
      setUserMenuOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen, userMenuOpen])

  useEffect(() => {
    if (!userMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (userMenuRef.current?.contains(event.target as Node)) return
      setUserMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [userMenuOpen])

  const goTo = (path: string) => {
    setUserMenuOpen(false)
    setMobileOpen(false)
    navigate(path)
  }

  const signOut = () => {
    setUserMenuOpen(false)
    setMobileOpen(false)
    void onSignOut()
  }

  const renderNavItem = (item: MxSidebarNavItem, isCollapsed: boolean) => {
    const active = isNavItemActive(item, location)

    return (
      <NavLink
        key={item.key ?? item.path}
        to={item.path}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'group relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/35',
          active
            ? 'bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-100'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
          isCollapsed && 'justify-center px-0',
        )}
      >
        {active ? (
          <span
            className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-primary"
            aria-hidden="true"
          />
        ) : null}
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200',
            active
              ? 'bg-white text-primary shadow-sm'
              : 'bg-slate-50 text-slate-500 group-hover:text-slate-800',
          )}
        >
          <NavItemIcon icon={item.icon} size={18} />
        </span>
        {!isCollapsed ? (
          <>
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
              {item.label}
            </span>
            {item.badge ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-100 px-1.5 text-[10px] font-bold text-emerald-800">
                {item.badge}
              </span>
            ) : null}
          </>
        ) : null}
        {isCollapsed ? <CollapsedTooltip label={item.label} /> : null}
      </NavLink>
    )
  }

  const renderUserMenu = (isCollapsed: boolean) => {
    const menuItems = [
      { label: 'Meu Perfil', icon: UserRound, action: () => goTo(profilePath) },
      { label: 'Preferências', icon: Settings, action: () => goTo(settingsPath) },
      { label: 'Notificações', icon: Bell, action: () => goTo(notificationsPath) },
      { label: 'Sair', icon: LogOut, action: signOut, destructive: true },
    ]

    return (
      <div
        role="menu"
        aria-label="Opções do perfil"
        className={cn(
          'absolute z-[160] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl',
          isCollapsed
            ? 'bottom-0 left-[calc(100%+12px)] w-64'
            : 'bottom-[calc(100%+12px)] left-0 right-0',
        )}
      >
        {menuItems.map(({ label, icon: Icon, action, destructive }) => (
          <button
            key={label}
            type="button"
            role="menuitem"
            onClick={action}
            className={cn(
              'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/35',
              destructive
                ? 'text-rose-600 hover:bg-rose-50'
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950',
            )}
          >
            <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    )
  }

  const renderProfileCard = (isCollapsed: boolean) => (
    <div ref={userMenuRef} className="relative">
      {userMenuOpen ? renderUserMenu(isCollapsed) : null}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={userMenuOpen}
        aria-label={`Abrir menu de usuário de ${displayName}`}
        onClick={() => setUserMenuOpen((open) => !open)}
        className={cn(
          'group flex min-h-[72px] w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left outline-none transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50/60 focus-visible:ring-2 focus-visible:ring-primary/35',
          isCollapsed && 'h-14 min-h-14 justify-center rounded-2xl px-0 py-0',
        )}
      >
        <span className="relative shrink-0">
          <Avatar
            src={avatarUrl || undefined}
            alt={`Avatar de ${displayName}`}
            fallback={initials}
            size="md"
            className="border-emerald-100 bg-emerald-50 font-bold text-primary"
          />
        </span>
        {!isCollapsed ? (
          <>
            <span className="min-w-0 flex-1 overflow-hidden">
              <span
                className="block whitespace-normal break-words text-[12px] font-bold leading-tight text-slate-900"
                title={displayName}
              >
                {displayName}
              </span>
              <span
                className="mt-1 block truncate text-[11px] font-semibold leading-tight text-slate-500"
                title={displayRole}
              >
                {displayRole}
              </span>
            </span>
            <ChevronDown
              size={18}
              strokeWidth={2}
              className={cn(
                'shrink-0 text-slate-500 transition-transform duration-200',
                userMenuOpen && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </>
        ) : null}
        {isCollapsed ? <CollapsedTooltip label={displayName} /> : null}
      </button>
    </div>
  )

  const renderSidebarContent = (
    isCollapsed: boolean,
    canCollapse = false,
  ) => (
    <>
      <div
        className={cn(
          'flex items-center gap-2',
          isCollapsed ? 'flex-col justify-center' : 'justify-between',
        )}
      >
        <div
          className={cn(
            'flex min-w-0 items-center gap-2.5',
            isCollapsed && 'justify-center',
          )}
        >
          <img
            src={MxLogo}
            alt="MX"
            className="h-9 w-9 shrink-0 object-contain"
          />
          {!isCollapsed ? (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-black tracking-tight text-slate-950">
                MX PERFORMANCE
              </p>
              <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                {moduleLabel}
              </p>
            </div>
          ) : null}
        </div>
        {canCollapse ? (
          <button
            type="button"
            aria-label={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
            onClick={() => setCollapsed((value) => !value)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 outline-none transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            {isCollapsed ? (
              <PanelLeftOpen size={18} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={18} aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>

      <nav
        className="no-scrollbar mt-5 flex-1 space-y-4 overflow-y-auto pr-0.5"
        aria-label={sidebarLabel}
      >
        {navSections.map((section) => (
          <section key={section.key ?? section.label} className="space-y-1.5">
            {!isCollapsed && section.label !== 'MENU' ? (
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {section.label}
              </p>
            ) : null}
            <div className="space-y-1">
              {section.items.map((item) => renderNavItem(item, isCollapsed))}
            </div>
          </section>
        ))}
      </nav>

      <div className="mt-4 border-t border-slate-200 pt-4">
        {renderProfileCard(isCollapsed)}
      </div>
    </>
  )

  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-50 font-display text-foreground">
      <header className="fixed left-0 right-0 top-0 z-[90] flex h-[calc(82px+env(safe-area-inset-top))] items-center justify-between border-b border-slate-200 bg-white px-5 pt-[env(safe-area-inset-top)] shadow-sm md:hidden">
        <button
          type="button"
          aria-label="Abrir menu principal"
          onClick={() => setMobileOpen(true)}
          className="flex min-w-0 items-center gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          <img src={MxLogo} alt="MX" className="h-10 w-10 shrink-0 object-contain" />
          <span className="hidden min-w-0 leading-tight min-[430px]:block">
            <span className="block text-[16px] font-black tracking-tight text-slate-950">
              MX PERFORMANCE
            </span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-700">
              {moduleLabel}
            </span>
          </span>
        </button>
        <div className="pointer-events-none absolute left-1/2 top-[calc(50%+env(safe-area-inset-top)/2)] max-w-[46vw] -translate-x-1/2 -translate-y-1/2 truncate text-center text-[17px] font-black tracking-tight text-slate-950">
          {mobileTitle}
        </div>
        <div className="flex items-center gap-3">
          <NotificationBellButton variant="light" />
          <button
            type="button"
            aria-label={`Abrir perfil de ${displayName}`}
            onClick={() => goTo(profilePath)}
            className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-[12px] font-black uppercase text-primary ring-1 ring-emerald-100 outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            {initials}
          </button>
        </div>
      </header>

      <aside
        className={cn(
          'fixed left-0 top-0 z-[80] hidden h-screen flex-col border-r border-slate-200 bg-white shadow-lg transition-all duration-300 ease-in-out md:flex',
          collapsed ? 'w-[80px] px-3 py-4' : 'w-[264px] p-4',
        )}
        aria-label={sidebarLabel}
      >
        {renderSidebarContent(collapsed, true)}
      </aside>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/30 backdrop-blur-sm md:hidden"
          role="presentation"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setMobileOpen(false)
          }}
        >
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={sidebarLabel}
            className="h-full w-[min(328px,calc(100vw-1.25rem))] border-r border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                aria-label="Fechar menu principal"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 outline-none transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-primary/35"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <div className="flex h-[calc(100%-3.25rem)] flex-col">
              {renderSidebarContent(false)}
            </div>
          </div>
        </div>
      ) : null}

      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        className={cn(
          'h-[100dvh] overflow-hidden bg-slate-50 px-0 outline-none transition-[padding] duration-200 md:h-screen md:p-0',
          'pt-[calc(82px+env(safe-area-inset-top))] md:pt-0',
          collapsed ? 'md:pl-[80px]' : 'md:pl-[264px]',
        )}
      >
        {isSimulating ? (
          <section
            className="m-3 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 md:flex-row md:items-center md:justify-between"
            aria-label="Simulação ativa"
          >
            <div className="min-w-0">
              <p className="text-sm font-bold">
                Simulação {simulationLabel} ativa
              </p>
              <p className="mt-1 truncate text-xs font-semibold text-emerald-800">
                Base: {simulationBase} • Loja: {simulationStore}
              </p>
            </div>
            {onStopSimulation ? (
              <button
                type="button"
                onClick={onStopSimulation}
                className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary/35"
              >
                Voltar Admin MX
              </button>
            ) : null}
          </section>
        ) : null}
        <section className="h-full min-h-0 w-full min-w-0 overflow-y-auto overflow-x-hidden bg-slate-50 text-foreground">
          {children}
        </section>
      </main>
    </div>
  )
}
