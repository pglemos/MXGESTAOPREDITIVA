import React, { useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useData'
import { useFeedbacks } from '@/hooks/useFeedbacks'
import {
  Home, CheckSquare, Trophy, GraduationCap, MessageSquare,
  Bell, Settings, Users, Target, Grid, LayoutDashboard, User,
  Building2, TrendingUp, ClipboardList,
  BriefcaseBusiness, CalendarDays, BarChart3, Bot, Library,
  Filter, FileBarChart, Activity, BookOpen, CalendarCheck, CalendarClock,
  BrainCircuit,
} from 'lucide-react'
import { slugify } from '@/lib/utils'
import MxSidebarShell, {
  type MxSidebarNavItem,
  type MxSidebarNavSection,
} from './MxSidebarShell'
import { ForcePasswordChange } from '@/features/auth/components/ForcePasswordChange'
import { canAccessPath } from '@/lib/auth/routeAccess'
import { MotionPage } from '@/design/motion'
import { buildInternalMxNavigation } from '@/design-system/internal-mx/internalMxNavigation'
import InternalMxPageFrame from '@/design-system/internal-mx/InternalMxPageFrame'

type SubItem = {
  label: string
  path: string
  icon?: React.ReactNode
  activePaths?: string[]
}

type NavCategory = {
  category: string
  icon: React.ReactNode
  items: SubItem[]
}

const STORE_DASHBOARD_PATH = '__STORE_DASHBOARD__'
const STORE_TEAM_PATH = '__STORE_TEAM__'
const STORE_CONSULTOR_IA_PATH = '__STORE_CONSULTOR_IA__'
const OWNER_PLANEJAMENTO_PATH = '__OWNER_PLANEJAMENTO__'
const OWNER_RESULTADOS_PATH = '__OWNER_RESULTADOS__'
const OWNER_PLANO_ACAO_PATH = '__OWNER_PLANO_ACAO__'
const OWNER_ALERTAS_PATH = '__OWNER_ALERTAS__'
const OWNER_BENCHMARKING_PATH = '__OWNER_BENCHMARKING__'
const OWNER_AGENDA_PATH = '__OWNER_AGENDA__'
const OWNER_VISITAS_PATH = '__OWNER_VISITAS__'
const OWNER_DEPARTAMENTOS_PATH = '__OWNER_DEPARTAMENTOS__'
const OWNER_BIBLIOTECA_PATH = '__OWNER_BIBLIOTECA__'

function appendQueryParam(path: string, key: string, value: string) {
  const [pathname, search = ''] = path.split('?')
  const params = new URLSearchParams(search)
  params.set(key, value)
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

const rotulosPerfil: Record<string, string> = {
  administrador_geral: 'Administrador geral',
  administrador_mx: 'Administrador MX',
  consultor_mx: 'Consultor MX',
  dono: 'Dono',
  gerente: 'Gerente',
  vendedor: 'Vendedor',
}

const rotulosModulo: Record<string, string> = {
  administrador_geral: 'Módulo Administrativo',
  administrador_mx: 'Módulo Admin MX',
  consultor_mx: 'Módulo Consultoria',
  dono: 'Módulo Executivo',
  gerente: 'Módulo Gerencial',
  vendedor: 'Módulo Comercial',
}

const navConfig: Record<string, NavCategory[]> = {
  dono: [
    {
      category: 'Home',
      icon: <Home size={22} />,
      items: [{ label: 'Home', path: STORE_DASHBOARD_PATH, icon: <Home size={16} /> }],
    },
    {
      category: 'CENTRAL MX',
      icon: <BriefcaseBusiness size={22} />,
      items: [
        { label: 'Planejamento Estratégico', path: OWNER_PLANEJAMENTO_PATH, icon: <BarChart3 size={16} /> },
        { label: 'Plano de Ação', path: OWNER_PLANO_ACAO_PATH, icon: <ClipboardList size={16} /> },
        { label: 'Alertas Inteligentes', path: OWNER_ALERTAS_PATH, icon: <Bell size={16} /> },
        { label: 'Benchmarking', path: OWNER_BENCHMARKING_PATH, icon: <TrendingUp size={16} /> },
        { label: 'Agenda Executiva', path: OWNER_AGENDA_PATH, icon: <CalendarDays size={16} /> },
        { label: 'Consultor IA', path: STORE_CONSULTOR_IA_PATH, icon: <Bot size={16} /> },
      ],
    },
    {
      category: 'GESTÃO',
      icon: <Grid size={22} />,
      items: [
        { label: 'Resultados', path: OWNER_RESULTADOS_PATH, icon: <LayoutDashboard size={16} /> },
        { label: 'Visitas', path: OWNER_VISITAS_PATH, icon: <Activity size={16} /> },
        { label: 'Departamentos', path: OWNER_DEPARTAMENTOS_PATH, icon: <Grid size={16} /> },
        { label: 'Treinamentos', path: '/treinamentos', icon: <GraduationCap size={16} /> },
        { label: 'Biblioteca', path: OWNER_BIBLIOTECA_PATH, icon: <Library size={16} /> },
      ],
    },
    {
      category: 'SUPORTE',
      icon: <MessageSquare size={22} />,
      items: [
        { label: 'Falar com Consultor', path: '/falar-consultor', icon: <MessageSquare size={16} /> },
        { label: 'Relatórios', path: '/relatorio-matinal', icon: <FileBarChart size={16} /> },
        { label: 'Configurações', path: '/configuracoes', icon: <Settings size={16} /> },
      ],
    },
  ],
  gerente: [
    {
      category: 'MENU',
      icon: <Home size={22} />,
      items: [
        { label: 'Início', path: '/home', icon: <Home size={16} /> },
        { label: 'Rotina do Dia', path: '/rotina', icon: <CalendarClock size={16} /> },
        { label: 'Fechamento Diário', path: '/fechamento-diario', icon: <CheckSquare size={16} /> },
        { label: 'Rotina da Equipe', path: '/gerente/rotina-equipe', icon: <CalendarCheck size={16} /> },
        { label: 'Minha Equipe', path: '/gerente/minha-equipe', icon: <Users size={16} /> },
        { label: 'Meta da Loja', path: '/gerente/meta-loja', icon: <Target size={16} /> },
        { label: 'Mentor Gerencial', path: '/gerente/mentor', icon: <BrainCircuit size={16} /> },
        { label: 'Desenvolvimento', path: '/gerente/feedbacks-pdis', icon: <BookOpen size={16} /> },
        { label: 'Ranking', path: '/gerente/ranking', icon: <Trophy size={16} /> },
        { label: 'Universidade MX', path: '/gerente/universidade-mx', icon: <GraduationCap size={16} /> },
      ],
    },
  ],
  vendedor: [
    {
      category: 'OPERAÇÃO',
      icon: <Home size={22} />,
      items: [
        { label: 'Meu Dia', path: '/home', icon: <Home size={16} /> },
        { label: 'Fechamento Diário', path: '/fechamento-diario', icon: <CheckSquare size={16} /> },
        { label: 'Central de Execução', path: '/central-execucao', icon: <CalendarCheck size={16} /> },
        { label: 'Carteira de Clientes', path: '/carteira-clientes', icon: <Users size={16} /> },
        { label: 'Funil de Vendas', path: '/meu-funil', icon: <Filter size={16} /> },
        { label: 'Relatórios', path: '/relatorios-vendedor', icon: <FileBarChart size={16} /> },
      ],
    },
    {
      category: 'EVOLUÇÃO',
      icon: <TrendingUp size={22} />,
      items: [
        { label: 'Feedback', path: '/devolutivas', icon: <MessageSquare size={16} /> },
        { label: 'PDI', path: '/pdi', icon: <TrendingUp size={16} /> },
        { label: 'Universidade MX', path: '/universidade-mx', icon: <GraduationCap size={16} /> },
        { label: 'Ranking', path: '/classificacao', icon: <Trophy size={16} /> },
      ],
    },
    {
      category: 'FERRAMENTAS',
      icon: <Bot size={22} />,
      items: [{ label: 'Consultor IA', path: STORE_CONSULTOR_IA_PATH, icon: <Bot size={16} /> }],
    },
    {
      category: 'CONTA',
      icon: <User size={22} />,
      items: [
        { label: 'Meu Perfil', path: '/perfil', icon: <User size={16} /> },
        { label: 'Configurações', path: '/configuracoes', icon: <Settings size={16} /> },
      ],
    },
  ],
}

export default function Layout() {
  const {
    profile,
    role,
    signOut,
    membership,
    isSimulating,
    simulationRole,
    stopSimulation,
    baseProfile,
  } = useAuth()
  const { unreadCount } = useNotifications()
  const { devolutivas } = useFeedbacks()
  const pendingFeedbackCount = role === 'vendedor'
    ? devolutivas.filter((feedback) => !feedback.acknowledged).length
    : 0
  const navigate = useNavigate()
  const location = useLocation()

  const storeDashboardPath = membership?.store?.name
    ? `/lojas/${slugify(membership.store.name)}`
    : role === 'gerente' ? '/classificacao' : '/lojas'
  const storeTeamPath = role === 'gerente'
    ? '/equipe'
    : storeDashboardPath === '/lojas'
      ? '/lojas'
      : `${storeDashboardPath}${storeDashboardPath.includes('?') ? '&' : '?'}tab=equipe`
  const storeConsultorIaPath = storeDashboardPath.startsWith('/lojas/')
    ? `${storeDashboardPath}/consultor-ia`
    : '/lojas'
  const ownerSectionPath = useCallback(
    (section: string) => appendQueryParam(storeDashboardPath, 'ownerSection', section),
    [storeDashboardPath],
  )

  const categories = React.useMemo(() => {
    const baseCategories = role ? (navConfig[role] || []) : []
    return baseCategories
      .map((category) => {
        const items = category.items
          .map((item) => {
            if (item.path === STORE_DASHBOARD_PATH) return { ...item, path: storeDashboardPath }
            if (item.path === STORE_TEAM_PATH) return { ...item, path: storeTeamPath }
            if (item.path === STORE_CONSULTOR_IA_PATH) return { ...item, path: storeConsultorIaPath }
            if (item.path === OWNER_PLANEJAMENTO_PATH) return { ...item, path: ownerSectionPath('planejamento') }
            if (item.path === OWNER_RESULTADOS_PATH) return { ...item, path: ownerSectionPath('resultados') }
            if (item.path === OWNER_PLANO_ACAO_PATH) return { ...item, path: ownerSectionPath('plano-acao') }
            if (item.path === OWNER_ALERTAS_PATH) return { ...item, path: ownerSectionPath('alertas') }
            if (item.path === OWNER_BENCHMARKING_PATH) return { ...item, path: ownerSectionPath('benchmarking') }
            if (item.path === OWNER_AGENDA_PATH) return { ...item, path: ownerSectionPath('agenda') }
            if (item.path === OWNER_VISITAS_PATH) return { ...item, path: ownerSectionPath('visitas') }
            if (item.path === OWNER_DEPARTAMENTOS_PATH) return { ...item, path: ownerSectionPath('departamentos') }
            if (item.path === OWNER_BIBLIOTECA_PATH) return { ...item, path: ownerSectionPath('biblioteca') }
            return item
          })
          .filter((item) => canAccessPath(item.path, role))
        return { ...category, items }
      })
      .filter((category) => category.items.length > 0)
  }, [ownerSectionPath, role, storeConsultorIaPath, storeDashboardPath, storeTeamPath])

  const perfilVisivel = role
    ? rotulosPerfil[role] || 'Perfil autorizado'
    : 'Perfil autorizado'
  const moduloVisivel = role
    ? rotulosModulo[role] || 'Módulo MX'
    : 'Módulo MX'
  const perfilBaseVisivel = baseProfile?.name || 'Admin MX'

  const sidebarSections = React.useMemo<MxSidebarNavSection[]>(() => {
    if (role && isPerfilInternoMx(role)) {
      return buildInternalMxNavigation(role, { unreadNotifications: unreadCount })
    }

    const badgeForPath = (path: string) => {
      const pathname = path.split('?')[0]
      const count = pathname === '/devolutivas' || pathname === '/feedbacks'
        ? pendingFeedbackCount
        : pathname === '/notificacoes' ? unreadCount : 0
      if (count <= 0) return undefined
      return count > 99 ? '99+' : String(count)
    }

    return categories.map((category): MxSidebarNavSection => ({
      label: category.category,
      items: category.items.map((item): MxSidebarNavItem => {
        const label = item.label.toLowerCase()
        return {
          label: item.label,
          path: item.path,
          icon: item.icon,
          badge: badgeForPath(item.path),
          activePaths: item.activePaths ?? [item.path],
          special: item.path.includes('/consultor-ia') ||
            label.includes('consultor ia') ||
            label.includes('consultor mx ia'),
        }
      }),
    }))
  }, [categories, pendingFeedbackCount, role, unreadCount])

  if (!profile || !role) return null

  if (profile.must_change_password) {
    return (
      <div className="min-h-screen bg-mx-black flex items-center justify-center p-mx-lg">
        <ForcePasswordChange />
      </div>
    )
  }

  const pageContent = (
    <MotionPage key={location.pathname} className="h-full">
      <Outlet />
    </MotionPage>
  )
  const stopCurrentSimulation = () => {
    stopSimulation()
    navigate('/painel', { replace: true })
  }

  const shellContent = isPerfilInternoMx(role) ? (
    <div className="mx-internal-workspace h-full min-h-0">
      <InternalMxPageFrame
        pathname={location.pathname}
        roleLabel={perfilVisivel}
        unreadNotifications={unreadCount}
        onOpenNotifications={() => navigate('/notificacoes')}
      >
        {pageContent}
      </InternalMxPageFrame>
    </div>
  ) : pageContent

  return (
    <MxSidebarShell
      profileName={profile.name}
      profileRoleLabel={perfilVisivel}
      moduleLabel={moduloVisivel}
      avatarUrl={profile.avatar_url}
      navSections={sidebarSections}
      onSignOut={signOut}
      profilePath="/perfil"
      settingsPath="/configuracoes"
      notificationsPath="/notificacoes"
      sidebarLabel={`Menu principal do ${perfilVisivel}`}
      isSimulating={isSimulating}
      simulationLabel={simulationRole ? rotulosPerfil[simulationRole] : 'MX'}
      simulationBase={perfilBaseVisivel}
      simulationStore={membership?.store?.name || 'Sandbox MX'}
      onStopSimulation={stopCurrentSimulation}
    >
      {shellContent}
    </MxSidebarShell>
  )
}
