import React, { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
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

type SellerNavItem = {
  label: string
  path: string
  icon: LucideIcon
  badge?: string
  subtitle?: string
  activePaths?: string[]
  special?: boolean
}

type SellerNavSection = {
  label: string
  items: SellerNavItem[]
}

type SellerLayoutShellProps = {
  children: React.ReactNode
  profileName?: string | null
  avatarUrl?: string | null
  onSignOut: () => Promise<void> | void
  isSimulating?: boolean
  simulationLabel?: string
  simulationBase?: string
  simulationStore?: string
  onStopSimulation?: () => void
}

const sellerSections: SellerNavSection[] = [
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

function isNavItemActive(item: SellerNavItem, pathname: string) {
  if (item.path === '/consultor-ia' && pathname.includes('/consultor-ia')) return true
  const paths = item.activePaths ?? [item.path]
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

function SellerBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full border border-[rgb(var(--mx-seller-primary-rgb)/0.22)] bg-[rgb(var(--mx-seller-primary-rgb)/0.12)] px-2 text-[11px] font-semibold leading-none text-[var(--mx-seller-primary)]">
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
  avatarUrl,
  onSignOut,
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

  const displayName = 'Lucas Mendes'

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

  const renderNavItem = (item: SellerNavItem, isCollapsed: boolean) => {
    const Icon = item.icon
    const active = isNavItemActive(item, location.pathname)

    if (item.special) {
      return (
        <NavLink
          key={item.path}
          to={item.path}
          aria-label={item.label}
          aria-current={active ? 'page' : undefined}
          onClick={closeMobile}
          className={cn(
          'group relative flex min-h-[66px] items-center gap-3 rounded-[16px] border border-[rgb(var(--mx-seller-primary-rgb)/0.18)] bg-[rgba(255,255,255,0.035)] px-4 py-2 text-left outline-none transition-all duration-200 hover:bg-[rgb(var(--mx-seller-primary-rgb)/0.08)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--mx-seller-primary-rgb)/0.45)]',
            active && 'bg-[linear-gradient(90deg,rgb(var(--mx-seller-primary-rgb)/0.16),rgb(var(--mx-seller-primary-rgb)/0.07))] shadow-[0_0_18px_rgb(var(--mx-seller-primary-rgb)/0.08)]',
            isCollapsed && 'min-h-12 justify-center rounded-[14px] px-0 py-0'
          )}
        >
          {active && <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-[var(--mx-seller-primary)]" aria-hidden="true" />}
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[rgb(var(--mx-seller-primary-rgb)/0.10)] text-[var(--mx-seller-primary)]">
            <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
            {!isCollapsed && <Sparkles size={13} strokeWidth={1.8} className="absolute -right-1 -top-1 text-[var(--mx-seller-primary)]" aria-hidden="true" />}
          </span>
          {!isCollapsed && (
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-[15px] font-semibold text-white">{item.label}</span>
                {item.badge && <SellerBadge>{item.badge}</SellerBadge>}
              </span>
              <span className="mt-1 block text-[10px] font-medium leading-tight text-[var(--mx-seller-text-secondary)]">{item.subtitle}</span>
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
          'group relative flex h-10 items-center gap-3 rounded-[14px] px-4 text-[15px] font-medium text-[rgb(var(--mx-seller-text-primary-rgb)/0.90)] outline-none transition-all duration-200 hover:bg-[rgb(var(--mx-seller-primary-rgb)/0.08)] hover:text-white focus-visible:ring-2 focus-visible:ring-[rgb(var(--mx-seller-primary-rgb)/0.45)]',
          active && 'border border-[rgb(var(--mx-seller-primary-rgb)/0.18)] bg-[linear-gradient(90deg,rgb(var(--mx-seller-primary-rgb)/0.18),rgb(var(--mx-seller-primary-rgb)/0.08))] text-white shadow-[0_0_18px_rgb(var(--mx-seller-primary-rgb)/0.08)]',
          isCollapsed && 'justify-center px-0'
        )}
      >
        {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[var(--mx-seller-primary)]" aria-hidden="true" />}
        <Icon
          size={21}
          strokeWidth={1.8}
          className={cn('shrink-0 text-[rgb(var(--mx-seller-text-primary-rgb)/0.70)] transition-colors duration-200 group-hover:text-[var(--mx-seller-primary)]', active && 'text-[var(--mx-seller-primary)]')}
          aria-hidden="true"
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
        'absolute z-[130] rounded-2xl border border-white/[0.08] bg-[var(--mx-seller-surface)] p-2 shadow-[0_20px_44px_rgba(0,0,0,0.34)]',
        isCollapsed ? 'bottom-0 left-[calc(100%+12px)] w-56' : 'bottom-[calc(100%+10px)] left-0 right-0'
      )}
    >
      <button type="button" onClick={() => goTo('/perfil')} className="flex h-10 w-full items-center rounded-xl px-3 text-left text-sm font-medium text-[rgb(var(--mx-seller-text-primary-rgb)/0.85)] transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--mx-seller-primary-rgb)/0.45)]">
        Meu Perfil
      </button>
      <button type="button" onClick={() => goTo('/configuracoes')} className="flex h-10 w-full items-center rounded-xl px-3 text-left text-sm font-medium text-[rgb(var(--mx-seller-text-primary-rgb)/0.85)] transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--mx-seller-primary-rgb)/0.45)]">
        Preferências
      </button>
      <button type="button" onClick={() => goTo('/notificacoes')} className="flex h-10 w-full items-center rounded-xl px-3 text-left text-sm font-medium text-[rgb(var(--mx-seller-text-primary-rgb)/0.85)] transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--mx-seller-primary-rgb)/0.45)]">
        Notificações
      </button>
      <button type="button" onClick={signOut} className="flex h-10 w-full items-center rounded-xl px-3 text-left text-sm font-medium text-[rgb(var(--mx-seller-text-primary-rgb)/0.85)] transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--mx-seller-primary-rgb)/0.45)]">
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
          'group flex h-[62px] w-full items-center gap-3 rounded-[22px] border border-white/[0.06] bg-white/[0.035] px-3 text-left outline-none transition-all duration-200 hover:bg-white/[0.055] focus-visible:ring-2 focus-visible:ring-[rgb(var(--mx-seller-primary-rgb)/0.45)]',
          isCollapsed && 'h-14 justify-center rounded-[18px] px-0'
        )}
      >
        <span className="relative shrink-0">
          <Avatar src={avatarUrl || undefined} alt={`Avatar de ${displayName}`} fallback={displayName} size={isCollapsed ? 'md' : 'lg'} className="border-white/[0.08] bg-[var(--mx-seller-surface)]" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--mx-seller-surface)] bg-[var(--mx-seller-primary)]" aria-hidden="true" />
        </span>
        {!isCollapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-white">{displayName}</span>
              <span className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-[var(--mx-seller-text-secondary)]">
                Administrador
                <span aria-hidden="true">•</span>
                <span className="inline-flex items-center gap-1 text-[var(--mx-seller-primary)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--mx-seller-primary)]" aria-hidden="true" />
                  Online
                </span>
              </span>
            </span>
            <ChevronDown size={18} strokeWidth={1.8} className={cn('text-[rgb(var(--mx-seller-text-primary-rgb)/0.65)] transition-transform duration-200', userMenuOpen && 'rotate-180')} aria-hidden="true" />
          </>
        )}
        {isCollapsed && <Tooltip label={displayName} />}
      </button>
    </div>
  )

  const renderSidebarContent = (isCollapsed: boolean, canCollapse = false) => (
    <>
      <div className={cn('flex items-center gap-3', isCollapsed ? 'flex-col justify-center' : 'justify-between')}>
        <div className={cn('flex min-w-0 items-center gap-3', isCollapsed && 'justify-center')}>
          <img src={MxLogo} alt="MX" className={cn('h-10 w-10 shrink-0 object-contain', isCollapsed && 'h-10 w-10')} />
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold leading-tight text-[var(--mx-seller-text-primary)]">MX PERFORMANCE</p>
              <p className="mt-1 truncate text-[13px] font-medium leading-tight text-[var(--mx-seller-text-secondary)]">Gestão Preditiva</p>
            </div>
          )}
        </div>
        {canCollapse && (
          <button
            type="button"
            aria-label={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
            onClick={() => setCollapsed((value) => !value)}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-white/[0.06] bg-white/[0.03] text-[rgb(var(--mx-seller-text-primary-rgb)/0.75)] outline-none transition-all duration-200 hover:bg-[rgb(var(--mx-seller-primary-rgb)/0.08)] hover:text-white focus-visible:ring-2 focus-visible:ring-[rgb(var(--mx-seller-primary-rgb)/0.45)]',
              isCollapsed && 'h-9 w-9'
            )}
          >
            {isCollapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
          </button>
        )}
      </div>

<nav className="mt-3 flex-1 space-y-1.5 overflow-y-auto pr-1" aria-label="Menu principal do vendedor">
{sellerSections.filter((section) => !['INTELIGÊNCIA', 'SISTEMA'].includes(section.label)).map((section, sectionIndex) => (
<section key={section.label} className={cn('space-y-1', sectionIndex > 0 && 'border-t border-white/[0.06] pt-1.5')} aria-label={section.label}>
{!isCollapsed && <p className="px-3 text-[11px] font-semibold uppercase text-[rgba(244,255,249,0.45)]">{section.label}</p>}
<div className="space-y-0.5">{section.items.map((item) => renderNavItem(item, isCollapsed))}</div>
</section>
))}
</nav>

{sellerSections
.filter((section) => ['INTELIGÊNCIA', 'SISTEMA'].includes(section.label))
.map((section) => (
<section key={section.label} className="mt-1.5 space-y-1 border-t border-white/[0.06] pt-1.5" aria-label={section.label}>
{!isCollapsed && <p className="px-3 text-[11px] font-semibold uppercase text-[rgba(244,255,249,0.45)]">{section.label}</p>}
<div className="space-y-0.5">{section.items.map((item) => renderNavItem(item, isCollapsed))}</div>
</section>
))}

<div className="mt-1.5">
{renderProfileCard(isCollapsed)}
</div>
    </>
  )

  return (
    <div className="min-h-screen bg-[var(--mx-seller-bg-page)] font-display text-[var(--mx-seller-text-primary)]">
      <header className="fixed left-3 right-3 top-3 z-[90] flex h-14 items-center justify-between rounded-2xl border border-[rgb(var(--mx-seller-primary-rgb)/0.14)] bg-[rgb(var(--mx-seller-sidebar-rgb)/0.95)] px-3 shadow-[0_18px_38px_rgba(0,0,0,0.28)] backdrop-blur md:hidden">
        <button type="button" aria-label="Abrir menu principal" onClick={() => setMobileOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--mx-seller-text-primary)] outline-none transition-colors hover:bg-[rgb(var(--mx-seller-primary-rgb)/0.08)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--mx-seller-primary-rgb)/0.45)]">
          <Menu size={22} aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2">
          <img src={MxLogo} alt="MX" className="h-9 w-9 object-contain" />
          <span className="text-sm font-bold text-white">MX PERFORMANCE</span>
        </div>
        <button type="button" aria-label="Abrir notificações" onClick={() => navigate('/notificacoes')} className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--mx-seller-text-primary)] outline-none transition-colors hover:bg-[rgb(var(--mx-seller-primary-rgb)/0.08)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--mx-seller-primary-rgb)/0.45)]">
          <MessageCircle size={20} aria-hidden="true" />
        </button>
      </header>

      <aside
        className={cn(
          'fixed left-2 top-2 z-[80] hidden h-[calc(100vh-1rem)] flex-col rounded-[32px] border border-[rgb(var(--mx-seller-primary-rgb)/0.16)] bg-[var(--mx-seller-sidebar)] shadow-[0_24px_70px_rgba(0,0,0,0.34),0_0_28px_rgb(var(--mx-seller-primary-rgb)/0.08)] transition-[width,padding] duration-200 md:flex',
          collapsed ? 'w-[84px] px-[14px] py-5' : 'w-[312px] p-4'
        )}
        aria-label="Sidebar principal do vendedor"
      >
        {renderSidebarContent(collapsed, true)}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[100] bg-[rgb(var(--mx-seller-bg-page-rgb)/0.80)] backdrop-blur-sm md:hidden"
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
            aria-label="Menu principal do vendedor"
            className="h-full w-[min(320px,calc(100vw-1.5rem))] rounded-r-[30px] border-r border-[rgb(var(--mx-seller-primary-rgb)/0.16)] bg-[var(--mx-seller-sidebar)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.42)]"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex justify-end">
              <button type="button" aria-label="Fechar menu principal" onClick={() => setMobileOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl text-[rgb(var(--mx-seller-text-primary-rgb)/0.75)] outline-none transition-colors hover:bg-[rgb(var(--mx-seller-primary-rgb)/0.08)] hover:text-white focus-visible:ring-2 focus-visible:ring-[rgb(var(--mx-seller-primary-rgb)/0.45)]">
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
          'min-h-screen p-3 pt-[76px] outline-none transition-[padding] duration-200 md:p-4',
          collapsed ? 'md:pl-[112px]' : 'md:pl-[336px]'
        )}
      >
        {isSimulating && (
          <section className="mb-3 flex flex-col gap-3 rounded-2xl border border-[rgb(var(--mx-seller-primary-rgb)/0.14)] bg-[var(--mx-seller-sidebar)] p-4 text-[var(--mx-seller-text-primary)] md:flex-row md:items-center md:justify-between" aria-label="Simulação ativa">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Simulação {simulationLabel} ativa</p>
              <p className="mt-1 truncate text-xs font-medium text-[var(--mx-seller-text-secondary)]">Base: {simulationBase} • Loja: {simulationStore}</p>
            </div>
            {onStopSimulation && (
              <button type="button" onClick={onStopSimulation} className="h-10 rounded-xl bg-[var(--mx-seller-primary)] px-4 text-sm font-semibold text-[var(--mx-seller-bg-page)] outline-none transition-colors hover:bg-[var(--mx-seller-primary-hover)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--mx-seller-primary-rgb)/0.45)]">
                Voltar Admin MX
              </button>
            )}
          </section>
        )}
        <section className="min-h-[calc(100vh-100px)] overflow-hidden rounded-[28px] border border-white/[0.08] bg-white text-slate-950 shadow-[0_24px_70px_rgba(0,0,0,0.22)] md:min-h-[calc(100vh-2rem)]">
          {children}
        </section>
      </main>
    </div>
  )
}
