import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useData'
import { useFeedbacks } from '@/hooks/useFeedbacks'

import { motion, AnimatePresence } from 'motion/react'
import {
  Home, CheckSquare, Trophy, GraduationCap, MessageSquare,
  Bell, Settings, Users, Target, Grid, LayoutDashboard, Database, Search, User,
  LogOut, Menu, X, Building2, TrendingUp, Package, ClipboardList, SlidersHorizontal,
  BriefcaseBusiness,
  CalendarDays,
  MonitorPlay,
  BarChart3,
  Bot,
  Library,
  Filter,
  Handshake,
  FileBarChart,
  Activity,
  CalendarCheck,
} from 'lucide-react'
import { cn, slugify } from '@/lib/utils'
import { Typography } from './atoms/Typography'
import { Avatar } from './atoms/Avatar'
import MxLogo from '@/assets/mx-logo.png'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { ForcePasswordChange } from '@/features/auth/components/ForcePasswordChange'
import { canAccessPath } from '@/lib/auth/routeAccess'

type SubItem = { label: string; path: string; icon?: React.ReactNode }
type NavCategory = { category: string; icon: React.ReactNode; items: SubItem[] }
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
const simulacaoItems: NavCategory = {
  category: 'Simulação', icon: <MonitorPlay size={22} />,
  items: [
    { label: 'Vendedor', path: '/simulacao/vendedor', icon: <User size={16} /> },
    { label: 'Gerente', path: '/simulacao/gerente', icon: <ShieldCheckIcon /> },
    { label: 'Dono', path: '/simulacao/dono', icon: <Building2 size={16} /> },
  ]
}

function ShieldCheckIcon() {
  return <CheckSquare size={16} />
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

const categoryDescriptions: Record<string, string> = {
  'Rede e Gestão': 'Lojas, CRM de consultoria, agenda e visão executiva da rede.',
  Simulação: 'Entrar como vendedor, gerente ou dono sem trocar de conta.',
  'Rotina e Conteúdo': 'Ranking, devolutivas, PDI, treinamentos, produtos e notificações.',
  'Relatórios e Diagnóstico': 'Relatórios oficiais, benchmarks e diagnóstico operacional.',
  Configurações: 'Parâmetros, integrações, sistema e governança técnica.',
  'Visão Executiva': 'Lojas, performance e equipe do proprietário.',
  Acompanhamento: 'Relatórios, devolutivas e conteúdos liberados para gestão.',
  Home: 'Cockpit executivo com o que realmente importa hoje.',
  Consultoria: 'Painel, agenda do diretor, biblioteca e contexto consultivo.',
  'Central MX': 'Planejamento, alertas, plano de ação, benchmarking e agenda executiva.',
  Resultados: 'Metas, realizado, ano anterior e indicadores em drill-down.',
  'Plano de Ação': 'Pendências, responsáveis, evidências e evolução das ações.',
  Alertas: 'Riscos, desvios e oportunidades que exigem atenção.',
  Benchmarking: 'Comparação com metas, benchmarks e melhores práticas.',
  Agenda: 'Rotina executiva, compromissos e lembretes do diretor.',
  Visitas: 'Acompanhamento PMR, PMR Plus e PPA.',
  Departamentos: 'Comercial, marketing, produto, financeiro, operacional e RH.',
  Treinamentos: 'Agenda ao vivo, trilhas e biblioteca de conteúdo.',
  Biblioteca: 'Conteúdos, playbooks e materiais da Universidade MX.',
  'Falar com Consultor': 'Suporte consultivo, chamados e orientações da MX.',
  'Operação Loja': 'Painel, equipe, rotina e ranking da unidade.',
  'Central Operacional': 'Meta, realizado, projeção, funil, alertas e ranking da equipe.',
  'Rotina Comercial': 'Agenda operacional, equipe, ranking e cobranças do dia.',
  'Gestão de Gente': 'Devolutivas, PDI, treinamentos e produtos da equipe.',
  COMERCIAL: 'Home, equipe, agenda, funil, negociações, metas e relatórios.',
  PESSOAS: 'Feedbacks e desenvolvimento da equipe.',
  FERRAMENTAS: 'Universidade MX, biblioteca e consultor inteligente.',
  'Meu Dia': 'Agenda, funil, meta, fechamento diário e performance pessoal.',
  'MEU DIA': 'Meu dia, terminal, central, carteira, funil e relatórios.',
  'EVOLUÇÃO': 'Feedbacks, PDI, treinamentos e ranking.',
  CONTA: 'Meu perfil e configurações.',
}

const navegacaoInternaMx: NavCategory[] = [
    {
      category: 'Rede e Gestão', icon: <Grid size={22} />,
      items: [
        { label: 'Painel Geral', path: '/painel', icon: <LayoutDashboard size={16} /> },
        { label: 'Lojas', path: '/lojas', icon: <Building2 size={16} /> },
        { label: 'Consultoria', path: '/consultoria/clientes', icon: <BriefcaseBusiness size={16} /> },
        { label: 'Agenda', path: '/agenda', icon: <CalendarDays size={16} /> },
      ]
    },
    simulacaoItems,
    {
      category: 'Rotina e Conteúdo', icon: <Target size={22} />,
      items: [
        { label: 'Ranking', path: '/classificacao', icon: <Trophy size={16} /> },
        { label: 'Devolutivas/PDI', path: '/devolutivas', icon: <MessageSquare size={16} /> },
        { label: 'Desenvolvimento', path: '/treinamentos', icon: <GraduationCap size={16} /> },
        { label: 'Produtos Digitais', path: '/produtos', icon: <Package size={16} /> },
        { label: 'Notificações', path: '/notificacoes', icon: <Bell size={16} /> },
      ]
    },
    {
      category: 'Relatórios e Diagnóstico', icon: <TrendingUp size={22} />,
      items: [
        { label: 'Relatório Matinal', path: '/relatorio-matinal', icon: <ClipboardList size={16} /> },
        { label: 'Performance de Vendas', path: '/relatorios/performance-vendas', icon: <TrendingUp size={16} /> },
        { label: 'Diagnóstico Operacional', path: '/auditoria', icon: <Database size={16} /> },
      ]
    },
    {
      category: 'Configurações', icon: <Settings size={22} />,
      items: [
        { label: 'Configuração Operacional', path: '/configuracoes/operacional', icon: <SlidersHorizontal size={16} /> },
        { label: 'Parâmetros PMR', path: '/configuracoes/consultoria-pmr', icon: <Database size={16} /> },
        { label: 'Configurações', path: '/configuracoes', icon: <Settings size={16} /> },
      ]
    }
  ]

const navConfig: Record<string, NavCategory[]> = {
  administrador_geral: navegacaoInternaMx,
  administrador_mx: navegacaoInternaMx,
  consultor_mx: navegacaoInternaMx,
  dono: [
    // 15 itens diretos na sidebar (sem agrupamento por categoria visual,
    // mas mantemos secoes para separadores no flat-render).
    {
      category: 'Home', icon: <Home size={22} />,
      items: [
        { label: 'Home', path: STORE_DASHBOARD_PATH, icon: <Home size={16} /> },
      ]
    },
    {
      category: 'CENTRAL MX', icon: <BriefcaseBusiness size={22} />,
      items: [
        { label: 'Planejamento Estratégico', path: OWNER_PLANEJAMENTO_PATH, icon: <BarChart3 size={16} /> },
        { label: 'Plano de Ação', path: OWNER_PLANO_ACAO_PATH, icon: <ClipboardList size={16} /> },
        { label: 'Alertas Inteligentes', path: OWNER_ALERTAS_PATH, icon: <Bell size={16} /> },
        { label: 'Benchmarking', path: OWNER_BENCHMARKING_PATH, icon: <TrendingUp size={16} /> },
        { label: 'Agenda Executiva', path: OWNER_AGENDA_PATH, icon: <CalendarDays size={16} /> },
        { label: 'Consultor IA', path: STORE_CONSULTOR_IA_PATH, icon: <Bot size={16} /> },
      ]
    },
    {
      category: 'GESTÃO', icon: <Grid size={22} />,
      items: [
        { label: 'Resultados', path: OWNER_RESULTADOS_PATH, icon: <LayoutDashboard size={16} /> },
        { label: 'Visitas', path: OWNER_VISITAS_PATH, icon: <Activity size={16} /> },
        { label: 'Departamentos', path: OWNER_DEPARTAMENTOS_PATH, icon: <Grid size={16} /> },
        { label: 'Treinamentos', path: '/treinamentos', icon: <GraduationCap size={16} /> },
        { label: 'Biblioteca', path: OWNER_BIBLIOTECA_PATH, icon: <Library size={16} /> },
      ]
    },
    {
      category: 'SUPORTE', icon: <MessageSquare size={22} />,
      items: [
        { label: 'Falar com Consultor', path: '/falar-consultor', icon: <MessageSquare size={16} /> },
        { label: 'Relatórios', path: '/relatorio-matinal', icon: <FileBarChart size={16} /> },
        { label: 'Configurações', path: '/configuracoes', icon: <Settings size={16} /> },
      ]
    }
  ],
  gerente: [
    {
      category: 'COMERCIAL', icon: <Home size={22} />,
      items: [
        // Cada item tem icone unico dentro do papel para identificacao intuitiva
        { label: 'Home', path: '/home', icon: <Home size={16} /> },
        { label: 'Equipe', path: STORE_TEAM_PATH, icon: <Users size={16} /> },
        { label: 'Agenda', path: '/rotina', icon: <CalendarDays size={16} /> },
        { label: 'Funil de Vendas', path: '/funil-vendas', icon: <Filter size={16} /> },
        { label: 'Negociações', path: '/relatorios/performance-vendedor', icon: <Handshake size={16} /> },
        { label: 'Metas', path: '/metas', icon: <Target size={16} /> },
        { label: 'Relatórios', path: '/relatorio-matinal', icon: <FileBarChart size={16} /> },
      ]
    },
    {
      category: 'PESSOAS', icon: <Users size={22} />,
      items: [
        { label: 'Feedbacks', path: '/devolutivas', icon: <MessageSquare size={16} /> },
        { label: 'PDI', path: '/pdi', icon: <TrendingUp size={16} /> },
      ]
    },
    {
      category: 'FERRAMENTAS', icon: <BriefcaseBusiness size={22} />,
      items: [
        { label: 'Universidade MX', path: '/treinamentos', icon: <GraduationCap size={16} /> },
        { label: 'Biblioteca', path: '/produtos', icon: <Library size={16} /> },
        { label: 'Consultor MX IA', path: STORE_CONSULTOR_IA_PATH, icon: <Bot size={16} /> },
      ]
    }
  ],
  vendedor: [
    {
      // Agrupado por domínio (espelha o padrão Gerente/Admin) para evitar stack plano de 13 itens.
      category: 'MEU DIA', icon: <Home size={22} />,
      items: [
        { label: 'Meu Dia', path: '/home', icon: <Home size={16} /> },
        { label: 'Terminal MX', path: '/vendedor/terminal-mx', icon: <CheckSquare size={16} /> },
        { label: 'Central de Execução', path: '/central-execucao', icon: <CalendarCheck size={16} /> },
        { label: 'Carteira', path: '/carteira-clientes', icon: <Users size={16} /> },
        { label: 'Funil', path: '/meu-funil', icon: <Filter size={16} /> },
        { label: 'Relatórios', path: '/relatorios-vendedor', icon: <FileBarChart size={16} /> },
      ]
    },
    {
      category: 'EVOLUÇÃO', icon: <TrendingUp size={22} />,
      items: [
        { label: 'Feedbacks', path: '/devolutivas', icon: <MessageSquare size={16} /> },
        { label: 'PDI', path: '/pdi', icon: <TrendingUp size={16} /> },
        { label: 'Treinamentos', path: '/treinamentos', icon: <GraduationCap size={16} /> },
        { label: 'Ranking', path: '/classificacao', icon: <Trophy size={16} /> },
      ]
    },
    {
      category: 'FERRAMENTAS', icon: <Bot size={22} />,
      items: [
        { label: 'Consultor IA', path: STORE_CONSULTOR_IA_PATH, icon: <Bot size={16} /> },
      ]
    },
    {
      category: 'CONTA', icon: <User size={22} />,
      items: [
        { label: 'Meu Perfil', path: '/perfil', icon: <User size={16} /> },
        { label: 'Configurações', path: '/vendedor/configuracoes', icon: <Settings size={16} /> },
      ]
    }
  ]
}

export default function Layout() {
  const { profile, role, signOut, membership, isSimulating, simulationRole, stopSimulation, baseProfile } = useAuth()
  const { unreadCount } = useNotifications()
  const { devolutivas } = useFeedbacks()
  // Spec Módulo Vendedor §12: contador vermelho de feedbacks pendentes no menu.
  const pendingFeedbackCount = role === 'vendedor' ? devolutivas.filter(f => !f.acknowledged).length : 0
  const navBadges: Record<string, number> = { '/devolutivas': pendingFeedbackCount }
const navigate = useNavigate()
const location = useLocation()
  const isCheckinRoute = location.pathname === '/lancamento-diario' || location.pathname === '/vendedor/terminal-mx'
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [navigationSearch, setNavigationSearch] = useState('')
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const navigationSearchRef = useRef<HTMLInputElement>(null)
  useFocusTrap(mobileMenuRef, mobileMenuOpen)

  useEffect(() => {
    if (!mobileMenuOpen && !isDrawerOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
        setIsDrawerOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen, isDrawerOpen])

  const storeDashboardPath = membership?.store?.name ? `/lojas/${slugify(membership.store.name)}` : role === 'gerente' ? '/classificacao' : '/lojas'
  const storeTeamPath = role === 'gerente' ? '/equipe' : storeDashboardPath === '/lojas' ? '/lojas' : `${storeDashboardPath}${storeDashboardPath.includes('?') ? '&' : '?'}tab=equipe`
  const storeConsultorIaPath = storeDashboardPath.startsWith('/lojas/')
    ? `${storeDashboardPath}/consultor-ia`
    : '/lojas'
  const ownerSectionPath = useCallback((section: string) => appendQueryParam(storeDashboardPath, 'ownerSection', section), [storeDashboardPath])
  const categories = React.useMemo(() => {
    const baseCategories = role ? (navConfig[role] || []) : []
    return baseCategories.map(category => {
      const items = category.items.map(item => {
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
      }).filter(item => canAccessPath(item.path, role))
      return { ...category, items }
    }).filter(category => category.items.length > 0)
  }, [ownerSectionPath, role, storeConsultorIaPath, storeDashboardPath, storeTeamPath])
  const filteredCategories = React.useMemo(() => {
    const term = navigationSearch.trim().toLowerCase()
    if (!term) return categories
    return categories.map(category => ({
      ...category,
      items: category.items.filter(item => {
        const searchable = `${category.category} ${item.label} ${item.path}`.toLowerCase()
        return searchable.includes(term)
      }),
    })).filter(category => category.items.length > 0)
  }, [categories, navigationSearch])
  const activeCategoryData = navigationSearch.trim()
    ? {
        category: 'Resultados',
        icon: <Search size={22} />,
        items: filteredCategories.flatMap(category => category.items),
      }
    : categories.find(c => c.category === activeCategory) || categories[0]
  const perfilVisivel = role ? rotulosPerfil[role] || 'Perfil autorizado' : 'Perfil autorizado'
  const perfilBaseVisivel = baseProfile?.name || 'Admin MX'

  useEffect(() => {
    if (!categories.length) return
    const matches = categories.flatMap(category =>
      category.items
        .filter(item => {
          const [path, query] = item.path.split('?')
          if (location.pathname !== path && !location.pathname.startsWith(`${path}/`)) return false
          if (!query) return true
          return location.search === `?${query}`
        })
        .map(item => ({ category: category.category, path: item.path.split('?')[0] || item.path })),
    )
    const bestMatch = matches.sort((a, b) => b.path.length - a.path.length)[0]
    if (bestMatch) setActiveCategory(bestMatch.category)
  }, [location.pathname, categories])

  if (!profile || !role) return null

  if (profile.must_change_password) {
    return (
      <div className="min-h-screen bg-mx-black flex items-center justify-center p-mx-lg">
        <ForcePasswordChange />
      </div>
    )
  }

  const handleGlobalSearch = () => {
    setNavigationSearch('')
    if (categories[0]) setActiveCategory(categories[0].category)
    if (window.matchMedia('(max-width: 767px)').matches) {
      setMobileMenuOpen(true)
    } else {
      setIsDrawerOpen(true)
    }
    window.setTimeout(() => {
      navigationSearchRef.current?.focus()
    }, 0)
  }

  const roleSidebarCta = role === 'gerente'
    ? {
          label: 'Consultor MX IA',
          description: 'Pergunte algo para o Consultor MX',
          buttonLabel: 'Perguntar',
          icon: <Bot size={18} aria-hidden="true" />,
          onClick: () => {
            setIsDrawerOpen(false)
            setMobileMenuOpen(false)
            navigate(storeConsultorIaPath)
          },
        }
    : role === 'vendedor'
      ? {
          label: 'Consultor IA',
          description: 'Mesma orientação consultiva da loja',
          buttonLabel: 'Perguntar',
          icon: <Bot size={18} aria-hidden="true" />,
          onClick: () => {
            setIsDrawerOpen(false)
            setMobileMenuOpen(false)
            navigate(storeConsultorIaPath)
          },
        }
      : null

  return (
    <div className="min-h-screen bg-surface-alt flex flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-mx-xl focus:shadow-mx-xl">
        Pular para conteúdo principal
      </a>

      {/* Top Header - Accessibility Hardening */}
<header
className={cn(
  'w-full flex items-center justify-between z-60 bg-white border-b border-border-default shrink-0 sticky top-mx-0 h-16 px-mx-lg',
)}
role="banner"
>
        <div className="flex items-center gap-mx-md min-w-0">
          <button
            type="button"
            aria-label="Ir para o painel inicial"
            onClick={() => navigate('/')}
            className="h-mx-10 shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15 transition-all active:scale-95"
          >
            <img src={MxLogo} alt="MX Performance" className="h-full w-auto object-contain" />
          </button>
          <div className="flex flex-col min-w-0">
            <Typography as="span" variant="h3" className="text-xl tracking-tighter text-text-primary whitespace-nowrap truncate uppercase font-black">
              MX <span className="text-mx-green-700">PERFORMANCE</span>
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-mx-md justify-end">
          <div className="hidden sm:flex items-center gap-mx-xs">
            <button type="button" aria-label="Pesquisar no sistema" onClick={handleGlobalSearch} className="w-mx-10 h-mx-10 bg-surface-alt rounded-mx-full flex items-center justify-center text-text-tertiary border border-border-default hover:text-text-primary transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15">
              <Search size={18} aria-hidden="true" />
            </button>
            <button type="button" aria-label={`Abrir notificações. ${unreadCount} não lidas.`} onClick={() => navigate('/notificacoes')} className="flex items-center gap-mx-xs h-mx-10 px-mx-xs bg-surface-alt rounded-mx-full text-text-tertiary border border-border-default hover:text-text-primary transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15">
              <Bell size={18} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="min-w-mx-10 h-mx-6 px-mx-xs rounded-mx-full bg-brand-primary border border-white flex items-center justify-center text-mx-micro font-black text-white leading-none" aria-hidden="true">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            aria-label={`Ver perfil de ${profile.name}`}
            className="flex items-center gap-mx-sm pl-mx-md border-l border-border-default group text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15 rounded-mx-lg transition-all"
            onClick={() => navigate('/perfil')}
          >
            <div className="hidden lg:flex flex-col items-end">
              <Typography variant="tiny" className="font-black text-text-primary tracking-tight leading-none mb-1">{profile.name}</Typography>
              <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest opacity-60">{perfilVisivel}</Typography>
            </div>
            <Avatar
              src={profile.avatar_url || undefined}
              alt={`Avatar de ${profile.name}`}
              fallback={profile.name}
              size="md"
              className="rounded-mx-md shadow-mx-sm"
            />
          </button>
        </div>
      </header>

      {isSimulating && (
        <section className="bg-mx-black text-white px-mx-md sm:px-mx-lg py-3 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-mx-sm max-w-full overflow-hidden" aria-label="Simulação ativa">
          <div className="flex items-center gap-mx-sm min-w-0">
            <div className="w-mx-9 h-mx-9 rounded-mx-lg bg-brand-primary flex items-center justify-center shrink-0">
              <MonitorPlay size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <Typography variant="tiny" tone="white" className="font-black uppercase tracking-mx-widest leading-none">
                Simulação {simulationRole ? rotulosPerfil[simulationRole] : 'MX'} ativa
              </Typography>
              <Typography variant="tiny" tone="white" className="block max-w-full min-w-0 opacity-60 font-bold truncate">
                Base: {perfilBaseVisivel} • Loja: {membership?.store?.name || 'Sandbox MX'}
              </Typography>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopSimulation()
              navigate('/painel', { replace: true })
            }}
            className="h-mx-10 px-5 rounded-mx-xl bg-white text-mx-black text-mx-tiny font-black uppercase tracking-mx-widest hover:bg-surface-alt transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
          >
            Voltar Admin MX
          </button>
        </section>
      )}

<div
className={cn(
  'flex flex-1 relative gap-mx-sm p-mx-sm pb-mx-12 md:p-mx-sm',
)}
>

        {/* Sidebar Minimalista - Semantic Nav */}
        <aside
className={cn(
  'hidden md:flex flex-col items-center shrink-0 bg-white border border-border-default shadow-mx-sm sticky mx-layout-sticky-offset z-[60] w-mx-20 rounded-mx-3xl py-mx-sm gap-mx-xs',
)}
          aria-label="Menu Lateral Principal"
        >
          <nav className="flex flex-col items-center gap-mx-sm w-full" aria-label="Módulos de Gestão">
            {categories.map((cat) => {
              const categoryBadgeCount = cat.items.reduce((total, item) => total + (navBadges[item.path] || 0), 0)
              return (
                <button
                  type="button"
                  aria-label={`Abrir módulo: ${cat.category}`}
                  aria-expanded={isDrawerOpen && activeCategory === cat.category}
                  aria-controls="drawer-navigation"
                  key={cat.category}
                  onClick={() => {
                    if (activeCategory === cat.category && isDrawerOpen) {
                      setIsDrawerOpen(false);
                    } else {
                      setActiveCategory(cat.category);
                      setIsDrawerOpen(true);
                    }
                  }}
                  className={cn(
                    "w-mx-xl h-mx-xl rounded-mx-xl flex items-center justify-center transition-all relative group focus-visible:ring-4 focus-visible:ring-brand-primary/15 focus-visible:outline-none",
                    activeCategory === cat.category ? 'bg-brand-secondary text-white shadow-mx-lg' : 'text-text-tertiary hover:bg-surface-alt hover:text-text-primary'
                  )}
                >
                  {cat.icon}
                  {categoryBadgeCount > 0 && (
                    <span
                      aria-label={`${categoryBadgeCount} pendente(s)`}
                      className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-status-error px-1 text-[10px] font-black text-white"
                    >
                      {categoryBadgeCount}
                    </span>
                  )}
                  <div className="absolute mx-layout-tooltip-offset px-3 py-1.5 bg-brand-secondary text-white text-mx-micro font-black uppercase tracking-widest rounded-mx-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[70] whitespace-nowrap shadow-mx-lg" role="tooltip">
                    {cat.category}
                  </div>
                </button>
              )
            })}
          </nav>
          {roleSidebarCta && (
            <button
              type="button"
              aria-label={`${roleSidebarCta.label} - ${roleSidebarCta.buttonLabel}`}
              onClick={roleSidebarCta.onClick}
              className="mt-auto w-mx-xl h-mx-xl rounded-mx-xl flex items-center justify-center text-brand-primary bg-brand-primary/10 border border-brand-primary/15 hover:bg-brand-primary hover:text-white transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15"
            >
              {roleSidebarCta.icon}
            </button>
          )}
          <button
            type="button"
            aria-label="Encerrar Sessão do Sistema"
            onClick={() => signOut()}
            className={cn(
              "w-mx-xl h-mx-xl rounded-mx-xl flex items-center justify-center text-text-tertiary hover:bg-status-error-surface hover:text-status-error transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-status-error/15",
              !roleSidebarCta && 'mt-auto',
            )}
          >
            <LogOut size={20} aria-hidden="true" />
          </button>
        </aside>

        {/* Workspace Root */}
        <main className="flex-1 bg-white border border-border-default rounded-mx-3xl relative shadow-mx-sm overflow-hidden" id="main-content" role="main" tabIndex={-1}>
          <Outlet />
        </main>

        {/* Drawer de Sub-módulos */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.div
              id="drawer-navigation"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="hidden md:flex fixed left-mx-layout-drawer-left top-mx-layout-offset-top w-mx-sidebar-expanded h-mx-layout-viewport bg-white border border-border-default rounded-mx-3xl shadow-mx-xl z-50 overflow-hidden flex flex-col"
              role="navigation"
              aria-label={`Opções do módulo ${activeCategoryData?.category}`}
            >
              <div className="p-mx-lg border-b border-border-subtle flex items-center justify-between bg-surface-alt/30">
                <div className="min-w-0">
                  <Typography variant="caption" className="font-black uppercase tracking-widest">{activeCategoryData?.category}</Typography>
                  <Typography variant="tiny" tone="muted" className="mt-mx-tiny block normal-case tracking-normal">
                    {activeCategoryData?.category ? categoryDescriptions[activeCategoryData.category] : 'Módulos disponíveis para seu perfil.'}
                  </Typography>
                </div>
                <button 
                  type="button" 
                  aria-label="Fechar painel de opções" 
                  onClick={() => setIsDrawerOpen(false)} 
                  className="w-mx-lg h-mx-lg rounded-mx-md hover:bg-surface-alt flex items-center justify-center text-text-tertiary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15 transition-all"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="border-b border-border-subtle p-mx-sm">
                <label className="relative block">
                  <span className="sr-only">Buscar módulo</span>
                  <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
                  <input
                    ref={navigationSearchRef}
                    type="search"
                    value={navigationSearch}
                    onChange={(event) => setNavigationSearch(event.target.value)}
                    placeholder="Buscar módulo"
                    className="h-mx-11 w-full rounded-mx-lg border border-border-default bg-white pl-mx-xl pr-mx-sm text-sm font-bold text-text-primary outline-none transition-all placeholder:text-text-tertiary focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                  />
                </label>
              </div>
              <div className="flex-1 overflow-y-auto p-mx-sm space-y-mx-tiny no-scrollbar">
                {activeCategoryData?.items.length ? activeCategoryData.items.map(item => {
                  const itemBadgeCount = navBadges[item.path] || 0
                  return (
                    <NavLink
                      key={`${item.label}-${item.path}`} to={item.path} onClick={() => setIsDrawerOpen(false)}
                      aria-current={location.pathname === item.path ? 'page' : undefined}
                      className={({ isActive }) => cn(
                        "flex items-center justify-between gap-mx-xs px-mx-md py-3 rounded-mx-lg text-xs font-black uppercase tracking-tight transition-all focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:outline-none",
                        isActive ? 'bg-mx-indigo-50 text-brand-primary' : 'text-text-secondary hover:bg-surface-alt'
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-mx-xs">
                        <span className="shrink-0" aria-hidden="true">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </span>
                      {itemBadgeCount > 0 && (
                        <span
                          aria-label={`${itemBadgeCount} pendente(s)`}
                          className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-status-error px-1 text-[10px] font-black text-white"
                        >
                          {itemBadgeCount}
                        </span>
                      )}
                    </NavLink>
                  )
                }) : (
                  <div className="rounded-mx-xl border border-dashed border-border-default bg-surface-alt p-mx-md text-center">
                    <Typography variant="p" tone="muted">Nenhum módulo encontrado para a busca atual.</Typography>
                  </div>
                )}
              </div>
              {roleSidebarCta && (
                <div className="border-t border-border-subtle p-mx-sm">
                  <button
                    type="button"
                    onClick={roleSidebarCta.onClick}
                    className="w-full rounded-mx-2xl border border-border-subtle bg-mx-black p-mx-md text-left text-white shadow-mx-sm transition-all hover:bg-brand-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20"
                  >
                    <div className="flex items-center gap-mx-sm">
                      <span className="flex h-mx-10 w-mx-10 shrink-0 items-center justify-center rounded-mx-xl bg-brand-primary/15 text-brand-primary" aria-hidden="true">
                        {roleSidebarCta.icon}
                      </span>
                      <span className="min-w-0">
                        <Typography variant="tiny" tone="white" className="block font-black uppercase tracking-widest">{roleSidebarCta.label}</Typography>
                        <Typography variant="tiny" tone="white" className="block truncate normal-case tracking-normal opacity-70">{roleSidebarCta.description}</Typography>
                      </span>
                    </div>
                    <span className="mt-mx-sm flex h-mx-9 items-center justify-center rounded-mx-xl bg-brand-primary text-sm font-black text-white">
                      {roleSidebarCta.buttonLabel}
                    </span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-mx-black/60 backdrop-blur-md z-[100] md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            role="presentation"
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-mx-0 left-mx-0 right-mx-0 bg-white rounded-t-mx-4xl p-mx-lg overflow-y-auto"
              style={{ maxHeight: 'calc(100dvh - 1rem)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6rem)' }}
              onClick={e => e.stopPropagation()}
              ref={mobileMenuRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-menu-title"
            >
              <div className="w-mx-xl h-1.5 bg-surface-alt rounded-mx-full mx-auto mb-6" aria-hidden="true" />
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-mx-sm">
                  <div className="h-mx-xl overflow-hidden"><img src={MxLogo} alt="MX Performance" className="h-full w-auto object-contain" /></div>
                  <div>
                    <Typography id="mobile-menu-title" variant="h2" className="text-xl font-black text-text-primary tracking-tighter uppercase">MX PERFORMANCE</Typography>
                    <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">{perfilVisivel}</Typography>
                  </div>
                </div>
                <button type="button" aria-label="Fechar menu mobile" onClick={() => setMobileMenuOpen(false)} className="w-mx-xl h-mx-xl rounded-mx-2xl bg-surface-alt flex items-center justify-center text-text-tertiary focus-visible:ring-2 focus-visible:ring-brand-primary/20"><X size={24} aria-hidden="true" /></button>
              </div>

              <div className="space-y-mx-md">
                <label className="relative block">
                  <span className="sr-only">Buscar módulo</span>
                  <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
                  <input
                    ref={navigationSearchRef}
                    type="search"
                    value={navigationSearch}
                    onChange={(event) => setNavigationSearch(event.target.value)}
                    placeholder="Buscar módulo"
                    className="h-mx-12 w-full rounded-mx-xl border border-border-default bg-surface-alt pl-mx-xl pr-mx-sm text-sm font-bold text-text-primary outline-none transition-all placeholder:text-text-tertiary focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                  />
                </label>
                {filteredCategories.map(cat => (
                  <nav key={cat.category} className="space-y-mx-sm" aria-label={cat.category}>
                    <div className="flex items-center gap-mx-xs px-2">
                      <div className="text-brand-primary" aria-hidden="true">{cat.icon}</div>
                      <div className="min-w-0">
                        <Typography variant="tiny" className="font-black text-text-tertiary uppercase tracking-mx-wide">{cat.category}</Typography>
                        {categoryDescriptions[cat.category] && (
                          <Typography variant="tiny" tone="muted" className="block truncate normal-case tracking-normal">{categoryDescriptions[cat.category]}</Typography>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-mx-xs">
                      {cat.items.map(item => (
                        <NavLink
                          key={`${cat.category}-${item.label}-${item.path}`} to={item.path} onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) => cn(
                            "flex items-center gap-mx-sm px-5 py-3 rounded-mx-xl text-sm font-black uppercase tracking-tight transition-all active:scale-[0.98]",
                            isActive ? 'bg-brand-primary text-white shadow-mx-lg' : 'bg-surface-alt text-text-secondary active:bg-border-default'
                          )}
                        >
                          <span aria-hidden="true">{item.icon}</span> {item.label}
                        </NavLink>
                      ))}
                    </div>
                  </nav>
                ))}
                {filteredCategories.length === 0 && (
                  <div className="rounded-mx-xl border border-dashed border-border-default bg-surface-alt p-mx-md text-center">
                    <Typography variant="p" tone="muted">Nenhum módulo encontrado para a busca atual.</Typography>
                  </div>
                )}
                {roleSidebarCta && (
                  <button
                    type="button"
                    onClick={roleSidebarCta.onClick}
                    className="w-full rounded-mx-2xl border border-border-subtle bg-mx-black p-mx-md text-left text-white shadow-mx-sm transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20"
                  >
                    <div className="flex items-center gap-mx-sm">
                      <span className="flex h-mx-11 w-mx-11 shrink-0 items-center justify-center rounded-mx-xl bg-brand-primary/15 text-brand-primary" aria-hidden="true">
                        {roleSidebarCta.icon}
                      </span>
                      <span className="min-w-0">
                        <Typography variant="tiny" tone="white" className="block font-black uppercase tracking-widest">{roleSidebarCta.label}</Typography>
                        <Typography variant="tiny" tone="white" className="block truncate normal-case tracking-normal opacity-70">{roleSidebarCta.description}</Typography>
                      </span>
                    </div>
                    <span className="mt-mx-sm flex h-mx-10 items-center justify-center rounded-mx-xl bg-brand-primary text-sm font-black text-white">
                      {roleSidebarCta.buttonLabel}
                    </span>
                  </button>
                )}
                <button type="button" onClick={() => signOut()} className="w-full flex items-center gap-mx-sm px-5 py-3 rounded-mx-xl bg-status-error-surface text-status-error text-sm font-black uppercase tracking-tight transition-all active:scale-[0.98]">
                  <LogOut size={20} aria-hidden="true" /> Encerrar Sessão
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bar - Semantic Nav */}
      <nav className="md:hidden fixed left-mx-sm right-mx-sm h-mx-16 bg-mx-black shadow-2xl rounded-mx-2xl z-50 flex items-center px-mx-sm py-mx-tiny border border-white/10 overflow-hidden" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }} aria-label="Barra de Navegação Rápida">
        <div className="grid w-full grid-cols-5 items-center gap-mx-tiny relative z-10">
          <NavLink
            to={role === 'vendedor' ? '/home' : isPerfilInternoMx(role) ? '/painel' : role === 'gerente' || role === 'dono' ? storeDashboardPath : '/lojas'}
            aria-label="Início"
            aria-current={location.pathname === (role === 'vendedor' ? '/home' : isPerfilInternoMx(role) ? '/painel' : role === 'gerente' || role === 'dono' ? storeDashboardPath : '/lojas') ? 'page' : undefined}
            className="min-w-0 h-mx-12 flex flex-col items-center justify-center gap-mx-tiny text-white/70 [&.active]:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-mx-xl"
          >
            {role === 'vendedor' ? <Home size={20} /> : <LayoutDashboard size={20} />}
            <span className="max-w-full truncate text-mx-micro font-black uppercase leading-none">Início</span>
          </NavLink>
          
          {role === 'vendedor' && (
            <NavLink
              to="/vendedor/terminal-mx"
              aria-label="Abrir Terminal MX"
              aria-current={isCheckinRoute ? 'page' : undefined}
              className="min-w-0 h-mx-12 flex flex-col items-center justify-center gap-mx-tiny text-white/70 [&.active]:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-mx-xl"
            >
              <CheckSquare size={20} />
              <span className="max-w-full truncate text-mx-micro font-black uppercase leading-none">Lançar</span>
            </NavLink>
          )}

          {(role === 'gerente' || role === 'dono' || isPerfilInternoMx(role)) && (
            <NavLink 
              to={role === 'dono' ? ownerSectionPath('plano-acao') : isPerfilInternoMx(role) ? '/lojas' : storeTeamPath}
              aria-label={role === 'dono' ? 'Abrir plano de ação' : 'Gerir Equipe'}
              aria-current={location.pathname === storeDashboardPath && new URLSearchParams(location.search).get('tab') === 'equipe' ? 'page' : undefined}
              className="min-w-0 h-mx-12 flex flex-col items-center justify-center gap-mx-tiny text-white/70 [&.active]:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-mx-xl"
            >
              {role === 'dono' ? <ClipboardList size={20} /> : <Users size={20} />}
              <span className="max-w-full truncate text-mx-micro font-black uppercase leading-none">{role === 'dono' ? 'Ações' : isPerfilInternoMx(role) ? 'Lojas' : 'Equipe'}</span>
            </NavLink>
          )}

          <button 
            type="button" 
            aria-label="Abrir menu mobile" 
            onClick={() => setMobileMenuOpen(true)} 
            className="min-w-0 h-mx-12 rounded-mx-xl bg-brand-primary text-white flex flex-col items-center justify-center gap-mx-tiny shadow-mx-lg transform -translate-y-1 active:scale-90 transition-all border-4 border-pure-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/40"
          >
            <Menu size={20} aria-hidden="true" />
            <span className="max-w-full truncate text-mx-micro font-black uppercase leading-none">Menu</span>
          </button>

            <NavLink
              to="/classificacao"
            aria-label="Ver ranking"
            aria-current={location.pathname === '/classificacao' ? 'page' : undefined}
            className="min-w-0 h-mx-12 flex flex-col items-center justify-center gap-mx-tiny text-white/70 [&.active]:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-mx-xl"
          >
            <Trophy size={20} />
            <span className="max-w-full truncate text-mx-micro font-black uppercase leading-none">Rank</span>
          </NavLink>

          <NavLink 
            to="/perfil" 
            aria-label="Meu Perfil" 
            aria-current={location.pathname === '/perfil' ? 'page' : undefined}
            className="min-w-0 h-mx-12 flex flex-col items-center justify-center gap-mx-tiny text-white/70 [&.active]:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-mx-xl"
          >
            <User size={20} />
            <span className="max-w-full truncate text-mx-micro font-black uppercase leading-none">Perfil</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
