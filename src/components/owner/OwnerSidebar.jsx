import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  CalendarClock,
  CheckSquare2,
  ClipboardList,
  GraduationCap,
  Home,
  Megaphone,
  MessageSquare,
  PackageSearch,
  Settings2,
  Target,
  Users,
  X,
} from 'lucide-react'

const groups = [
  {
    label: 'GESTÃO',
    items: [
      { label: 'Início', segment: '', icon: Home, end: true },
      { label: 'Rotina do Dia', segment: 'rotina', icon: CalendarClock },
      { label: 'Central de Decisões', segment: 'decisoes', icon: ClipboardList },
    ],
  },
  {
    label: 'ESTRATÉGIA',
    items: [
      { label: 'Plano Estratégico', segment: 'plano-estrategico', icon: Target },
      { label: 'Plano de Ação', segment: 'plano-acao', icon: CheckSquare2 },
      { label: 'Consultoria', segment: 'consultoria', icon: MessageSquare },
    ],
  },
  {
    label: 'NEGÓCIO',
    items: [
      { label: 'Departamentos', segment: 'departamentos', icon: Boxes, end: true },
      { label: 'Visão Geral', segment: 'departamentos/visao-geral', icon: BarChart3 },
      { label: 'Comercial', segment: 'departamentos/comercial', icon: BriefcaseBusiness },
      { label: 'Marketing', segment: 'departamentos/marketing', icon: Megaphone },
      { label: 'Produto e Estoque', segment: 'departamentos/produto', icon: PackageSearch },
      { label: 'Pessoas / RH', segment: 'departamentos/rh', icon: Users },
      { label: 'Financeiro', segment: 'departamentos/financeiro', icon: BriefcaseBusiness },
      { label: 'Operações', segment: 'departamentos/operacional', icon: Settings2 },
      { label: 'Mercado', segment: 'mercado', icon: BarChart3 },
    ],
  },
  {
    label: 'DESENVOLVIMENTO',
    items: [{ label: 'Universidade MX', segment: 'universidade', icon: GraduationCap }],
  },
  {
    label: 'AÇÃO GLOBAL',
    items: [{ label: 'Falar com Consultor', segment: 'consultor', icon: BookOpen, special: true }],
  },
]

export default function OwnerSidebar({ storeSlug, open, onClose }) {
  const basePath = `/lojas/${storeSlug}`

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
                        item.special ? 'is-special' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </section>
          ))}
        </nav>
      </aside>
    </>
  )
}
