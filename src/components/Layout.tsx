import React, { useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useData'
import { useFeedbacks } from '@/hooks/useFeedbacks'
import {
  Home, CheckSquare, Trophy, GraduationCap, MessageSquare,
  Bell, Settings, Users, Target, Grid, LayoutDashboard, User,
  TrendingUp, ClipboardList, CalendarClock, BarChart3, Bot,
  Filter, FileBarChart, Activity, BookOpen, CalendarCheck,
  BrainCircuit, BriefcaseBusiness,
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
import { MxRoleVisualScope } from '@/components/module/MxRoleVisualScope'

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
const OWNER_SECTION_PREFIX = '__OWNER_SECTION__:'

function ownerSectionPlaceholder(section: string) {
  return `${OWNER_SECTION_PREFIX}${section}`
}

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
      category: 'GESTÃO',
      icon: <Home size={22} />,
      items: [
        { label: 'Início', path: STORE_DASHBOARD_PATH, icon: <Home size={16} /> },
        { label: 'Rotina do Dia', path: ownerSectionPlaceholder('rotina'), icon: <CalendarClock size={16} /> },
        { label: 'Central de Decisões', path: ownerSectionPlaceholder('decisoes'), icon: <ClipboardList size={16} /> },
      ],
    },
    {
      category: 'ESTRATÉGIA',
      icon: <Target size={22} />,
      items: [
        { label: 'Plano Estratégico', path: ownerSectionPlaceholder('planejamento'), icon: <BarChart3 size={16} /> },
        { label: 'Plano de Ação', path: ownerSectionPlaceholder('plano-acao'), icon: <CheckSquare size={16} /> },
        { label: 'Consultoria', path: ownerSectionPlaceholder('consultoria'), icon: <MessageSquare size={16} /> },
      ],
    },
    {
      category: 'NEGÓCIO',
      icon: <Grid size={22} />,
      items: [
        { label: 'Departamentos', path: ownerSectionPlaceholder('departamentos'), icon: <Grid size={16} /> },
        { label: 'Visão Geral', path: ownerSectionPlaceholder('departamentos'), icon: <LayoutDashboard size={16} /> },
        { label: 'Comercial', path: ownerSectionPlaceholder('departamentos-comercial'), icon: <TrendingUp size={16} /> },
        { label: 'Marketing', path: ownerSectionPlaceholder('departamentos-marketing'), icon: <Activity size={16} /> },
        { label: 'Produto e Estoque', path: ownerSectionPlaceholder('departamentos-produto'), icon: <Grid size={16} /> },
        { label: 'Pessoas — RH', path: ownerSectionPlaceholder('departamentos-rh'), icon: <Users size={16} /> },
        { label: 'Financeiro', path: ownerSectionPlaceholder('departamentos-financeiro'), icon: <BriefcaseBusiness size={16} /> },
        { label: 'Operações', path: ownerSectionPlaceholder('departamentos-operacional'), icon: <Settings size={16} /> },
        { label: 'Mercado', path: ownerSectionPlaceholder('mercado'), icon: <BarChart3 size={16} /> },
      ],
    },
    {
      category: 'DESENVOLVIMENTO',
      icon: <GraduationCap size={22} />,
      items: [
        { label: 'Universidade MX', path: ownerSectionPlaceholder('universidade'), icon: <GraduationCap size={16} /> },
      ],
    },
    {
      category: 'AÇÃO GLOBAL',
      icon: <MessageSquare size={22} />,
      items: [
        { label: 'Falar com Consultor', path: '/falar-consultor', icon: <MessageSquare size={16} /> },
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
            if (item.path === STORE_CONSULTOR_IA_PATH) {
              if (!storeDashboardPath.startsWith('/lojas/')) return null
              return { ...item, path: storeConsultorIaPath }
            }
            if (item.path.startsWith(OWNER_SECTION_PREFIX)) {
              return { ...item, path: ownerSectionPath(item.path.slice(OWNER_SECTION_PREFIX.length)) }
            }
            return item
          })
          .filter((item): item is SubItem => item !== null && canAccessPath(item.path, role))
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
    <MxRoleVisualScope manager={role !== 'vendedor'}>
      <MotionPage key={location.pathname} className="h-full">
        <Outlet />
      </MotionPage>
    </MxRoleVisualScope>
  )
  const stopCurrentSimulation = () => {
    stopSimulation()
    navigate('/painel', { replace: true })
  }

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
      {pageContent}
    </MxSidebarShell>
  )
}
