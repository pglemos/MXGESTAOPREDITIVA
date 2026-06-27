import React, { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  Brain,
  CalendarCheck,
  ChevronDown,
  Funnel,
  GraduationCap,
  Home,
  Layers,
  LogOut,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  Target,
  Trophy,
  User,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { Avatar } from './atoms/Avatar'
import MxLogo from '@/assets/mx-logo.png'

export type SellerLayoutNavItem = {
  label: string
  path: string
  icon: LucideIcon | React.ReactNode
  badge?: string
  subtitle?: string
  activePaths?: string[]
  special?: boolean
}

export type SellerLayoutNavSection = {
  label: string
  items: SellerLayoutNavItem[]
}

type SellerLayoutShellProps = {
  children: React.ReactNode
  profileName?: string | null
  profileRoleLabel?: string | null
  avatarUrl?: string | null
  navSections?: SellerLayoutNavSection[]
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

const sellerSections: SellerLayoutNavSection[] = [
  {
    label: 'OPERAÇÃO',
    items: [
      { label: 'Meu Dia', path: '/home', icon: Home, activePaths: ['/home', '/meu-dia'] },
      { label: 'Fechamento Diário', path: '/terminal-mx', icon: CalendarCheck, activePaths: ['/terminal-mx', '/vendedor/terminal-mx', '/lancamento-diario', '/fechamento-diario'] },
      { label: 'Central de Execução', path: '/central-de-execucao', icon: Layers, activePaths: ['/central-de-execucao', '/central-execucao'] },
    ],
  },
  {
    label: 'COMERCIAL',
    items: [
      { label: 'Carteira de Clientes', path: '/carteira-clientes', icon: Wallet },
      { label: 'Funil de Vendas', path: '/funil-comercial', icon: Funnel, activePaths: ['/funil-comercial', '/meu-funil'] },
      { label: 'Relatórios', path: '/relatorios', icon: BarChart3, badge: '2', activePaths: ['/relatorios', '/relatorios-vendedor'] },
    ],
  },
  {
    label: 'DESENVOLVIMENTO',
    items: [
      { label: 'Feedback', path: '/feedbacks', icon: MessageCircle, badge: '4', activePaths: ['/feedbacks', '/devolutivas'] },
      { label: 'PDI', path: '/pdi', icon: Target },
      { label: 'Treinamento', path: '/treinamentos', icon: GraduationCap, badge: 'Novo' },
      { label: 'Ranking', path: '/ranking', icon: Trophy, activePaths: ['/ranking', '/classificacao'] },
    ],
  },
  {
    label: 'INTELIGÊNCIA',
    items: [
      {
        label: 'Consultor IA',
        path: '/consultor-ia',
        icon: Brain,
        badge: 'Beta',
        subtitle: 'Recomenda ações e próximos passos',
        activePaths: ['/consultor-ia'],
        special: true,
      },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { label: 'Configurações', path: '/configuracoes', icon: Settings, activePaths: ['/configuracoes', '/vendedor/configuracoes'] },
    ],
  },
]

function isNavItemActive(item: SellerLayoutNavItem, location: { pathname: string; search: string }) {
  if (item.path === '/consultor-ia' && location.pathname.includes('/consultor-ia')) return true
  const paths = item.activePaths ?? [item.path]
  return paths.some((rawPath) => {
    const [path, query = ''] = rawPath.split('?')
    const pathMatches = location.pathname === path || (!query && location.pathname.startsWith(`${path}/`))
    if (!pathMatches) return false
    return query ? location.search === `?${query}` : true
  })
}

function NavItemIcon({
  icon,
  size,
  className,
}: {
  icon: SellerLayoutNavItem['icon']
  size: number
  className?: string
}) {
  if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && 'render' in icon)) {
    const Icon = icon as LucideIcon
    return <Icon size={size} strokeWidth={1.8} className={className} aria-hidden="true" />
  }

  if (React.isValidElement(icon)) {
    return React.cloneElement(icon as React.ReactElement<Record<string, unknown>>, {
      size,
      strokeWidth: 1.8,
      className: cn((icon.props as { className?: string }).className, className),
      'aria-hidden': true,
    })
  }

  return <span className={className} aria-hidden="true">{icon}</span>
}

function SellerBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full border border-[rgb(var(--mx-seller-primary-rgb)/0.22)] bg-[rgb(var(--mx-seller-primary-rgb)/0.12)] px-1.5 text-[10px] font-semibold leading-none text-[var(--mx-seller-primary)]">
      {children}
    </span>
  )
}

function Tooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-[120] -translate-y-1/2 whitespace-nowrap rounded-xl border border-[rgb(var(--mx-seller-primary-rgb)/0.16)] bg-[var(--mx-seller-surface)] px-3 py-2 text-xs font-semibold text-[var(--mx-seller-text-primary)] opacity-0 shadow-[0_16px_30px_rgba(0,0,0,0.28)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  )
}

export default function SellerLayoutShell({
  children,
  profileName,
  profileRoleLabel = 'Vendedor',
  avatarUrl,
  navSections = sellerSections,
  onSignOut,
  profilePath = '/perfil',
  settingsPath = '/configuracoes',
  notificationsPath = '/notificacoes',
  sidebarLabel = 'Menu principal',
  isSimulating = false,
  simulationLabel = 'Vendedor',
  simulationBase = 'Admin MX',
  simulationStore = 'Sandbox MX',
  onStopSimulation,
}: SellerLayoutShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const drawerRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useFocusTrap(drawerRef, mobileOpen)

  const displayName = profileName?.trim() || 'Usuário MX'
  const displayRole = profileRoleLabel?.trim() || 'Perfil autorizado'

  useEffect(() => {
    if (!mobileOpen && !userMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        setUserMenuOpen(false)
      }
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

  const closeMobile = () => setMobileOpen(false)

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

const mobileNavItems: SellerLayoutNavItem[] = [
{ label: 'Dashboard', path: '/home', icon: Home, activePaths: ['/home', '/meu-dia'] },
{ label: 'Fechamento', path: '/terminal-mx', icon: CalendarCheck, activePaths: ['/terminal-mx', '/vendedor/terminal-mx', '/lancamento-diario', '/fechamento-diario'] },
{ label: 'Execução', path: '/central-de-execucao', icon: Layers, activePaths: ['/central-de-execucao', '/central-execucao'] },
{ label: 'Funil', path: '/funil-comercial', icon: Funnel, activePaths: ['/funil-comercial', '/meu-funil'] },
{ label: 'Perfil', path: profilePath, icon: User, activePaths: [profilePath, '/meu-perfil-vendedor', '/vendedor/perfil'] },
]

const mobileTitle = isNavItemActive(mobileNavItems[1], location) ? 'Fechamento Diário' : 'MX Performance'

const renderNavItem = (item: SellerLayoutNavItem, isCollapsed: boolean) => {
    const active = isNavItemActive(item, location)

    if (item.special) {
      return (
        <NavLink
          key={item.path}
          to={item.path}
          aria-label={item.label}
          aria-current={active ? 'page' : undefined}
          onClick={closeMobile}
          className={cn(
            'group relative flex min-h-[52px] items-center gap-2 rounded-[13px] border border-blue-500/20 bg-white/5 px-2.5 py-2 text-left outline-none transition-all duration-200 hover:bg-blue-500/10 focus-visible:ring-2 focus-visible:ring-blue-500/45',
            active && 'bg-blue-600/15 border-blue-500/30 shadow-[0_0_18px_rgba(37,99,235,0.12)]',
            isCollapsed && 'min-h-12 justify-center rounded-[14px] px-0 py-0'
          )}
        >
          {active && <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-blue-600" aria-hidden="true" />}
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] bg-blue-600/10 text-blue-500">
            <NavItemIcon icon={item.icon} size={18} />
            {!isCollapsed && <Sparkles size={13} strokeWidth={1.8} className="absolute -right-1 -top-1 text-blue-500" aria-hidden="true" />}
          </span>
          {!isCollapsed && (
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-[13px] font-semibold text-[#dbeafe]">{item.label}</span>
                {item.badge && <SellerBadge>{item.badge}</SellerBadge>}
              </span>
              <span className="mt-0.5 block truncate text-[10px] font-medium leading-tight text-[#8ea4c4]">{item.subtitle}</span>
            </span>
          )}
          {isCollapsed && <Tooltip label={item.label} />}
        </NavLink>
      )
    }

    return (
      <NavLink
        key={item.path}
        to={item.path}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        onClick={closeMobile}
        className={cn(
          'group relative flex h-8 items-center gap-2 rounded-[11px] px-2.5 text-[13px] font-medium text-[#8ea4c4] outline-none transition-all duration-200 hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-500/45',
          active && 'border border-blue-500/20 bg-blue-600/15 text-white shadow-[0_0_18px_rgba(37,99,235,0.12)]',
          isCollapsed && 'justify-center px-0'
        )}
      >
        {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-600" aria-hidden="true" />}
        <NavItemIcon
          icon={item.icon}
          size={18}
          className={cn('shrink-0 text-[#8ea4c4] transition-colors duration-200 group-hover:text-blue-500', active && 'text-blue-500')}
        />
        {!isCollapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
        {!isCollapsed && item.badge && <SellerBadge>{item.badge}</SellerBadge>}
        {isCollapsed && <Tooltip label={item.label} />}
      </NavLink>
    )
  }

  const renderUserMenu = (isCollapsed: boolean) => (
    <div
      className={cn(
        'absolute z-[130] rounded-2xl border border-white/[0.08] bg-[#031225] p-2 shadow-[0_20px_44px_rgba(0,0,0,0.34)]',
        isCollapsed ? 'bottom-0 left-[calc(100%+12px)] w-56' : 'bottom-[calc(100%+10px)] left-0 right-0'
      )}
    >
      <button type="button" onClick={() => goTo(profilePath)} className="flex h-10 w-full items-center rounded-xl px-3 text-left text-sm font-medium text-[#dbeafe] transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45">
        Meu Perfil
      </button>
      <button type="button" onClick={() => goTo(settingsPath)} className="flex h-10 w-full items-center rounded-xl px-3 text-left text-sm font-medium text-[#dbeafe] transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45">
        Preferências
      </button>
      <button type="button" onClick={() => goTo(notificationsPath)} className="flex h-10 w-full items-center rounded-xl px-3 text-left text-sm font-medium text-[#dbeafe] transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45">
        Notificações
      </button>
      <button type="button" onClick={signOut} className="flex h-10 w-full items-center rounded-xl px-3 text-left text-sm font-medium text-[#dbeafe] transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45">
        Sair
      </button>
    </div>
  )

  const renderProfileCard = (isCollapsed: boolean) => (
    <div ref={userMenuRef} className="relative">
      {userMenuOpen && renderUserMenu(isCollapsed)}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={userMenuOpen}
        aria-label={`Abrir menu de usuário de ${displayName}`}
        onClick={() => setUserMenuOpen((open) => !open)}
        className={cn(
          'group flex min-h-[56px] w-full items-center gap-2 rounded-[16px] border border-white/[0.06] bg-white/[0.035] px-2 py-1.5 text-left outline-none transition-all duration-200 hover:bg-white/[0.055] focus-visible:ring-2 focus-visible:ring-blue-500/45',
          isCollapsed && 'h-14 justify-center rounded-[18px] px-0'
        )}
      >
        <span className="relative shrink-0">
          <Avatar src={avatarUrl || undefined} alt={`Avatar de ${displayName}`} fallback={displayName} size="md" className="border-white/[0.08] bg-[#031225]" />
        </span>
        {!isCollapsed && (
          <>
            <span className="min-w-0 flex-1 overflow-hidden">
              <span className="block whitespace-normal break-words text-[11px] font-semibold leading-tight text-white" title={displayName}>{displayName}</span>
              <span className="mt-0.5 block truncate text-[11px] font-medium leading-tight text-[#8ea4c4]" title={displayRole}>
                {displayRole}
              </span>
            </span>
            <ChevronDown size={18} strokeWidth={1.8} className={cn('text-[#8ea4c4] transition-transform duration-200', userMenuOpen && 'rotate-180')} aria-hidden="true" />
          </>
        )}
        {isCollapsed && <Tooltip label={displayName} />}
      </button>
    </div>
  )

  const renderSidebarContent = (isCollapsed: boolean, canCollapse = false) => {
    const hiddenSections = new Set(['CONTA'])
    const bottomSectionLabels = new Set(['INTELIGÊNCIA', 'FERRAMENTAS', 'SISTEMA'])
    const visibleSections = navSections.filter((section) => !hiddenSections.has(section.label))
    const bottomSections = visibleSections.filter((section) => bottomSectionLabels.has(section.label))
    const mainSections = visibleSections.filter((section) => !bottomSectionLabels.has(section.label))

    return (
      <>
        <div className={cn('flex items-center gap-2', isCollapsed ? 'flex-col justify-center' : 'justify-between')}>
          <div className={cn('flex min-w-0 items-center gap-2', isCollapsed && 'justify-center')}>
            <img src={MxLogo} alt="MX" className={cn('h-8 w-8 shrink-0 object-contain', isCollapsed && 'h-8 w-8')} />
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold leading-tight text-white">MX PERFORMANCE</p>
                <p className="mt-0.5 truncate text-[11px] font-medium leading-tight text-[#8ea4c4]">Gestão Preditiva</p>
              </div>
            )}
          </div>
          {canCollapse && (
            <button
              type="button"
              aria-label={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
              onClick={() => setCollapsed((value) => !value)}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-white/[0.06] bg-white/[0.03] text-[#8ea4c4] outline-none transition-all duration-200 hover:bg-blue-500/10 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-500/45',
                isCollapsed && 'h-9 w-9'
              )}
            >
              {isCollapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
            </button>
          )}
        </div>

        <nav className="no-scrollbar mt-2 flex-1 space-y-1 overflow-y-auto pr-0.5" aria-label={sidebarLabel}>
          {mainSections.map((section, sectionIndex) => (
            <section key={section.label} className={cn('space-y-1', sectionIndex > 0 && 'border-t border-white/[0.06] pt-1.5')} aria-label={section.label}>
              {!isCollapsed && <p className="px-2.5 text-[10px] font-semibold uppercase text-[#8ea4c4]/50">{section.label}</p>}
              <div className="space-y-0.5">{section.items.map((item) => renderNavItem(item, isCollapsed))}</div>
            </section>
          ))}
        </nav>

        {bottomSections.map((section) => (
          <section key={section.label} className="mt-1.5 space-y-1 border-t border-white/[0.06] pt-1.5" aria-label={section.label}>
            {!isCollapsed && <p className="px-2.5 text-[10px] font-semibold uppercase text-[#8ea4c4]/50">{section.label}</p>}
            <div className="space-y-0.5">{section.items.map((item) => renderNavItem(item, isCollapsed))}</div>
          </section>
        ))}

        <div className="mt-1.5">
          {renderProfileCard(isCollapsed)}
        </div>
      </>
    )
  }

  return (
<div className="mx-app-scrollbarless h-[100dvh] overflow-hidden bg-[#f7f9fc] font-display text-[#111827]">
<header className="fixed left-0 right-0 top-0 z-[90] flex h-[calc(82px+env(safe-area-inset-top))] items-center justify-between border-b border-[#e5eaf2] bg-white px-5 pt-[env(safe-area-inset-top)] shadow-[0_8px_26px_rgba(15,23,42,0.05)] md:hidden">
<button type="button" aria-label="Abrir menu principal" onClick={() => setMobileOpen(true)} className="flex min-w-0 items-center gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45">
<img src={MxLogo} alt="MX" className="h-10 w-10 shrink-0 object-contain" />
<span className="hidden min-w-0 leading-tight min-[430px]:block">
<span className="block text-[17px] font-black tracking-tight text-[#111827]">MX</span>
<span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#334155]">Performance</span>
</span>
</button>
<div className="pointer-events-none absolute left-1/2 top-[calc(50%+env(safe-area-inset-top)/2)] max-w-[48vw] -translate-x-1/2 -translate-y-1/2 truncate text-center text-[17px] font-black tracking-tight text-[#111827] min-[430px]:max-w-[42vw] min-[430px]:text-[18px]">
{mobileTitle}
</div>
<div className="flex items-center gap-3">
<button type="button" aria-label="Abrir notificações" onClick={() => navigate(notificationsPath)} className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#64748b] outline-none transition-colors hover:bg-[#f1f5f9] focus-visible:ring-2 focus-visible:ring-blue-500/45">
<Bell size={22} aria-hidden="true" />
<span className="absolute right-1 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-[#ef4444] px-1 text-[10px] font-black leading-none text-white">3</span>
</button>
<button type="button" aria-label={`Abrir perfil de ${displayName}`} onClick={() => goTo(profilePath)} className="grid h-10 w-10 place-items-center rounded-full bg-[#0b63f6] text-[13px] font-black uppercase text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45">
{displayName
.split(/\s+/)
.filter(Boolean)
.slice(0, 2)
.map((part) => part[0])
.join('') || 'MX'}
</button>
</div>
</header>

      <aside
        className={cn(
          'fixed left-2 top-2 z-[80] hidden h-[calc(100vh-1rem)] flex-col rounded-[24px] border border-white/[0.08] bg-[#061a33] shadow-[0_24px_70px_rgba(0,0,0,0.34),0_0_28px_rgba(37,99,235,0.08)] transition-[width,padding] duration-200 md:flex',
          collapsed ? 'w-[72px] px-2.5 py-3' : 'w-[236px] p-2.5'
        )}
        aria-label={sidebarLabel}
      >
        {renderSidebarContent(collapsed, true)}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm md:hidden"
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
            className="h-full w-[min(320px,calc(100vw-1.5rem))] rounded-r-[30px] border-r border-white/[0.08] bg-[#061a33] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.42)]"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex justify-end">
              <button type="button" aria-label="Fechar menu principal" onClick={() => setMobileOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#8ea4c4] outline-none transition-colors hover:bg-blue-500/10 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-500/45">
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <div className="flex h-[calc(100%-3.25rem)] flex-col">{renderSidebarContent(false)}</div>
          </div>
        </div>
      )}

      <main
        id="main-content"
        role="main"
        tabIndex={-1}
className={cn(
'h-[100dvh] overflow-hidden px-0 pb-[calc(82px+env(safe-area-inset-bottom))] pt-[calc(82px+env(safe-area-inset-top))] outline-none transition-[padding] duration-200 md:h-screen md:p-2',
collapsed ? 'md:pl-[88px]' : 'md:pl-[252px]'
)}
      >
        {isSimulating && (
          <section className="mb-3 flex flex-col gap-3 rounded-2xl border border-blue-500/20 bg-[#061a33] p-4 text-[#dbeafe] md:flex-row md:items-center md:justify-between" aria-label="Simulação ativa">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Simulação {simulationLabel} ativa</p>
              <p className="mt-1 truncate text-xs font-medium text-[#8ea4c4]">Base: {simulationBase} • Loja: {simulationStore}</p>
            </div>
            {onStopSimulation && (
              <button type="button" onClick={onStopSimulation} className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500/45">
                Voltar Admin MX
              </button>
            )}
          </section>
        )}
<section className="h-full w-full min-w-0 overflow-hidden rounded-none border-0 bg-[#f7f9fc] text-slate-950 shadow-none md:h-[calc(100vh-2rem)] md:rounded-[24px] md:border md:border-[#e5eaf2] md:shadow-[0_24px_70px_rgba(15,23,42,0.04)]">
{children}
</section>
</main>
<nav className="fixed bottom-0 left-0 right-0 z-[90] flex h-[calc(82px+env(safe-area-inset-bottom))] items-start justify-around border-t border-[#e5eaf2] bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] md:hidden" aria-label="Navegação principal mobile">
{mobileNavItems.map((item) => {
const active = isNavItemActive(item, location)
return (
<NavLink
key={item.path}
to={item.path}
aria-label={item.label}
aria-current={active ? 'page' : undefined}
className={cn(
'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1 text-[11px] font-semibold text-[#94a3b8] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/45',
active && 'text-[#0b63f6]'
)}
>
<NavItemIcon icon={item.icon} size={25} className={cn('shrink-0', active ? 'text-[#0b63f6]' : 'text-[#94a3b8]')} />
<span className="max-w-full truncate">{item.label}</span>
</NavLink>
)
})}
</nav>
</div>
  )
}
