import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Bot,
  Boxes,
  CalendarClock,
  CheckSquare2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Home,
  MessageCircle,
  Target,
  X,
} from 'lucide-react'
import { useOwnerContext } from './OwnerContext'
import '@/styles/owner-base44-fixes.css'

const departmentChildren = [
  { label: 'Visão Geral', segment: 'departamentos/visao-geral' },
  { label: 'Comercial', segment: 'departamentos/comercial' },
  { label: 'Marketing', segment: 'departamentos/marketing' },
  { label: 'Produto e Estoque', segment: 'departamentos/produto' },
  { label: 'Pessoas / RH', segment: 'departamentos/rh' },
  { label: 'Financeiro', segment: 'departamentos/financeiro' },
  { label: 'Operações', segment: 'departamentos/operacional' },
]

const groups = [
  {
    label: 'GESTÃO',
    items: [
      { label: 'Início', segment: '', icon: Home, end: true },
      { label: 'Rotina do Dia', segment: 'rotina', icon: CalendarClock, badge: 'Em construção' },
      { label: 'Central de Decisões', segment: 'decisoes', icon: ClipboardList, badge: 'Em construção' },
    ],
  },
  {
    label: 'ESTRATÉGIA',
    items: [
      { label: 'Plano Estratégico', segment: 'plano-estrategico', icon: Target },
      { label: 'Plano de Ação', segment: 'plano-acao', icon: CheckSquare2 },
      { label: 'Consultoria', segment: 'consultoria', icon: MessageCircle },
      { label: 'Consultor', segment: 'consultor', icon: Bot },
    ],
  },
  {
    label: 'NEGÓCIO',
    items: [
      { label: 'Mercado', segment: 'mercado', icon: BarChart3, badge: 'Em construção' },
    ],
    departments: true,
  },
  {
    label: 'DESENVOLVIMENTO',
    items: [{ label: 'Universidade MX', segment: 'universidade', icon: GraduationCap, badge: 'Em construção' }],
  },
]

export default function OwnerSidebar({ storeSlug, open, onClose }) {
  const basePath = `/lojas/${storeSlug}`
  const location = useLocation()
  const { openConsultantModal } = useOwnerContext()
  const [departmentsOpen, setDepartmentsOpen] = useState(true)

  useEffect(() => {
    if (location.pathname.includes('/departamentos')) {
      setDepartmentsOpen(true)
    }
  }, [location.pathname])

  return (
    <>
      <button
        type="button"
        className={`owner-base44-exact__backdrop ${open ? 'is-open' : ''}`}
        aria-label="Fechar menu"
        onClick={onClose}
      />
      <aside className={`owner-base44-exact__sidebar ${open ? 'is-open' : ''}`} aria-label="Menu principal do Dono">
        <div className="owner-base44-exact__brand">
          <div className="owner-base44-exact__brand-mark" aria-hidden="true">MX</div>
          <div>
            <strong>MX PERFORMANCE</strong>
            <span>Gestão Preditiva</span>
          </div>
          <button type="button" className="owner-base44-exact__sidebar-close" onClick={onClose} aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>

        <nav className="owner-base44-exact__nav">
          {groups.map((group) => (
            <section key={group.label} className="owner-base44-exact__nav-group">
              <h2>{group.label}</h2>
              <div>
                {group.items.map((item) => {
                  const Icon = item.icon
                  const path = item.segment ? `${basePath}/${item.segment}` : basePath
                  return (
                    <NavLink
                      key={item.label}
                      to={path}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) => [
                        'owner-base44-exact__nav-item',
                        isActive ? 'is-active' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                      <span>{item.label}</span>
                      {item.badge ? <span className="owner-base44-exact__nav-badge">{item.badge}</span> : null}
                    </NavLink>
                  )
                })}

                {group.departments ? (
                  <>
                    <button
                      type="button"
                      className="owner-base44-exact__nav-toggle"
                      aria-expanded={departmentsOpen}
                      onClick={() => setDepartmentsOpen((current) => !current)}
                    >
                      <Boxes size={18} strokeWidth={1.8} aria-hidden="true" />
                      <span>Departamentos</span>
                      {departmentsOpen ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                    </button>
                    {departmentsOpen ? (
                      <div className="owner-base44-exact__nav-subgroup">
                        {departmentChildren.map((child) => {
                          const isVisaoGeral = child.segment === 'departamentos/visao-geral'
                          const active = isVisaoGeral
                            ? location.pathname === `${basePath}/departamentos` || location.pathname === `${basePath}/${child.segment}`
                            : location.pathname === `${basePath}/${child.segment}`
                          return (
                            <Link
                              key={child.segment}
                              to={`${basePath}/${child.segment}`}
                              onClick={onClose}
                              aria-current={active ? 'page' : undefined}
                              className={[
                                'owner-base44-exact__nav-subitem',
                                active ? 'is-active' : '',
                              ].filter(Boolean).join(' ')}
                            >
                              {child.label}
                            </Link>
                          )
                        })}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            </section>
          ))}
        </nav>

        <div className="owner-base44-exact__sidebar-footer">
          <button
            type="button"
            className="owner-base44-exact__consultant-button"
            onClick={() => {
              onClose?.()
              openConsultantModal()
            }}
          >
            <MessageCircle size={18} aria-hidden="true" />
            Falar com Consultor
          </button>
        </div>
      </aside>
    </>
  )
}
