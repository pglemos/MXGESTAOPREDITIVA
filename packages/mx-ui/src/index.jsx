import * as React from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Menu, X } from 'lucide-react'

function cx(...values) {
  return values.flat().filter(Boolean).join(' ')
}

function renderIcon(icon, size = 18) {
  if (!icon) return null
  if (React.isValidElement(icon)) return React.cloneElement(icon, { size, 'aria-hidden': true })
  const Icon = icon
  return <Icon size={size} aria-hidden="true" />
}

export function SidebarBrandHeader({ title = 'MX PERFORMANCE', subtitle = 'Gestão Preditiva', collapsed = false }) {
  return (
    <header className="mxds-brand" data-mx-component="sidebar-brand-header">
      <div className="mxds-brand-mark" aria-hidden="true">MX</div>
      {!collapsed ? (
        <div className="mxds-brand-copy">
          <p className="mxds-brand-title">{title}</p>
          <p className="mxds-brand-subtitle">{subtitle}</p>
        </div>
      ) : null}
    </header>
  )
}

export function SidebarAccountMenu({ initials, avatarUrl, name, role, items, collapsed = false }) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef(null)

  React.useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const keydown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', keydown)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', keydown)
    }
  }, [open])

  return (
    <div className="mxds-account-wrap" ref={rootRef} data-mx-component="sidebar-account-menu">
      {open ? (
        <div className="mxds-account-menu" role="menu" aria-label="Menu da conta">
          {items.map((item) => (
            <button
              key={item.key ?? item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                item.onSelect?.()
              }}
            >
              {renderIcon(item.icon, 17)}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        className="mxds-account-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${name}, ${role}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="mxds-account-avatar">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
        </span>
        {!collapsed ? (
          <>
            <span className="mxds-account-copy">
              <span className="mxds-account-name">{name}</span>
              <span className="mxds-account-role">{role}</span>
            </span>
            <span className="mxds-account-chevron" aria-hidden="true">
              {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </>
        ) : null}
      </button>
    </div>
  )
}

function Navigation({ sections, pathname, onNavigate, collapsed }) {
  return (
    <nav className="mxds-nav" aria-label="Navegação principal do módulo interno MX">
      {sections.map((section) => (
        <section className="mxds-nav-section" key={section.key ?? section.label} aria-label={section.label}>
          <p className="mxds-nav-label">{section.label}</p>
          <ul className="mxds-nav-list">
            {section.items.map((item) => {
              const activePaths = item.activePaths?.length ? item.activePaths : [item.path]
              const active = activePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
              return (
                <li key={item.key ?? item.path}>
                  <button
                    type="button"
                    className="mxds-nav-button"
                    data-active={active}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                    onClick={() => onNavigate(item.path)}
                  >
                    <span className="mxds-nav-icon">{renderIcon(item.icon)}</span>
                    <span className="mxds-nav-text">{item.label}</span>
                    {item.badge ? <span className="mxds-nav-badge">{item.badge}</span> : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </nav>
  )
}

export function AppShell({
  sections,
  pathname,
  onNavigate,
  sidebarAccount,
  mobileTitle = 'MX Performance',
  children,
}) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const navigate = (path) => {
    setMobileOpen(false)
    onNavigate(path)
  }

  const renderSidebarContent = ({ compact = collapsed, allowCollapse = true } = {}) => (
    <div className="mxds-sidebar-inner">
      <SidebarBrandHeader collapsed={compact} />
      <Navigation sections={sections} pathname={pathname} onNavigate={navigate} collapsed={compact} />
      {React.isValidElement(sidebarAccount)
        ? React.cloneElement(sidebarAccount, { collapsed: compact })
        : sidebarAccount}
      {allowCollapse ? (
        <div className="mxds-sidebar-footer">
          <button
            type="button"
            className="mxds-collapse-button"
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <ChevronRight size={17} /> : <><ChevronLeft size={17} /><span>Recolher</span></>}
          </button>
        </div>
      ) : null}
    </div>
  )

  return (
    <div className="mxds-app-shell" data-mx-component="app-shell">
      <a className="mxds-skip-link" href="#main-content">Ir para o conteúdo</a>
      <aside className="mxds-sidebar" data-collapsed={collapsed}>{renderSidebarContent()}</aside>
      {mobileOpen ? (
        <>
          <button className="mxds-mobile-overlay" type="button" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} />
          <aside className="mxds-mobile-drawer" aria-label="Menu móvel do módulo interno MX">
            {renderSidebarContent({ compact: false, allowCollapse: false })}
            <button className="mxds-mobile-menu-button" type="button" aria-label="Fechar menu" style={{ position: 'absolute', right: 12, top: 12 }} onClick={() => setMobileOpen(false)}>
              <X size={18} />
            </button>
          </aside>
        </>
      ) : null}
      <div className="mxds-main">
        <header className="mxds-mobile-header">
          <button className="mxds-mobile-menu-button" type="button" aria-label="Abrir menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>
            <Menu size={19} />
          </button>
          <span className="mxds-brand-mark" style={{ width: 36, height: 36, borderRadius: 11, fontSize: 11 }}>MX</span>
          <span className="mxds-mobile-title">{mobileTitle}</span>
        </header>
        <div className="mxds-workspace mx-internal-workspace">{children}</div>
      </div>
    </div>
  )
}

export function MxPanel({ as: Component = 'section', className, children, ...props }) {
  return <Component className={cx('rounded-2xl border border-slate-200 bg-white shadow-sm', className)} {...props}>{children}</Component>
}

export function MxBadge({ children, className, ...props }) {
  return <span className={cx('inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-extrabold text-teal-800', className)} {...props}>{children}</span>
}

export { cx as cn }
