import React, { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useData'
import { useStores } from '@/hooks/useTeam'
import { motion, AnimatePresence } from 'motion/react'
import {
  Home, CheckSquare, History, Trophy, GraduationCap, MessageSquare,
  Bell, Settings, Users, Target, Grid, LayoutDashboard, Database, Search, User,
  LogOut, Menu, X, Building2, TrendingUp, Package, ClipboardList, SlidersHorizontal,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Typography } from './atoms/Typography'
import MxLogo from '@/assets/mx-logo.png'

type SubItem = { label: string; path: string; icon?: React.ReactNode }
type NavCategory = { category: string; icon: React.ReactNode; items: SubItem[] }

const navConfig: Record<string, NavCategory[]> = {
  admin: [
    {
      category: 'Governança MX', icon: <Grid size={22} />,
      items: [
        { label: 'Painel Geral', path: '/painel', icon: <LayoutDashboard size={16} /> },
        { label: 'Lojas', path: '/lojas', icon: <Building2 size={16} /> },
        { label: 'Metas', path: '/metas', icon: <Target size={16} /> },
        { label: 'Benchmarks', path: '/relatorios/performance-vendas', icon: <TrendingUp size={16} /> },
        { label: 'Funil', path: '/funil', icon: <TrendingUp size={16} /> },
      ]
    },
    {
      category: 'Rituais MX', icon: <Target size={22} />,
      items: [
        { label: 'Checkin', path: '/checkin', icon: <CheckSquare size={16} /> },
        { label: 'Ranking', path: '/ranking', icon: <Trophy size={16} /> },
        { label: 'Matinal Oficial', path: '/relatorio-matinal', icon: <ClipboardList size={16} /> },
        { label: 'Feedback/PDI', path: '/feedback', icon: <MessageSquare size={16} /> },
        { label: 'Treinamentos', path: '/treinamentos', icon: <GraduationCap size={16} /> },
        { label: 'Produtos Digitais', path: '/produtos', icon: <Package size={16} /> },
        { label: 'Notificações', path: '/notificacoes', icon: <Bell size={16} /> },
      ]
    },
    {
      category: 'Sustentação', icon: <Settings size={22} />,
      items: [
        { label: 'Configuração Operacional', path: '/configuracoes/operacional', icon: <SlidersHorizontal size={16} /> },
        { label: 'Configurações', path: '/configuracoes', icon: <Settings size={16} /> },
      ]
    }
  ],
  dono: [
    {
      category: 'Visão Executiva', icon: <Building2 size={22} />,
      items: [
        { label: 'Minhas Lojas', path: '/lojas', icon: <Building2 size={16} /> },
        { label: 'Performance', path: '/loja', icon: <LayoutDashboard size={16} /> },
        { label: 'Metas', path: '/metas', icon: <Target size={16} /> },
        { label: 'Funil', path: '/funil', icon: <TrendingUp size={16} /> },
      ]
    },
    {
      category: 'Acompanhamento', icon: <User size={22} />,
      items: [
        { label: 'Matinal Oficial', path: '/relatorio-matinal', icon: <ClipboardList size={16} /> },
        { label: 'Feedback/PDI', path: '/feedback', icon: <MessageSquare size={16} /> },
      ]
    }
  ],
  gerente: [
    {
      category: 'Operação Loja', icon: <Home size={22} />,
      items: [
        { label: 'Painel da Loja', path: '/loja', icon: <LayoutDashboard size={16} /> },
        { label: 'Equipe', path: '/equipe', icon: <Users size={16} /> },
        { label: 'Rotina Diária', path: '/rotina', icon: <CheckSquare size={16} /> },
        { label: 'Ranking', path: '/ranking', icon: <Trophy size={16} /> },
      ]
    },
    {
      category: 'Gestão de Gente', icon: <User size={22} />,
      items: [
        { label: 'Feedback Estruturado', path: '/feedback', icon: <MessageSquare size={16} /> },
        { label: 'PDI', path: '/pdi', icon: <TrendingUp size={16} /> },
        { label: 'Treinamentos', path: '/treinamentos', icon: <GraduationCap size={16} /> },
      ]
    }
  ],
  vendedor: [
    {
      category: 'Meu Ritual', icon: <Home size={22} />,
      items: [
        { label: 'Home', path: '/home', icon: <Home size={16} /> },
        { label: 'Lançamento Diário', path: '/checkin', icon: <CheckSquare size={16} /> },
        { label: 'Histórico', path: '/historico', icon: <History size={16} /> },
        { label: 'Ranking', path: '/ranking', icon: <Trophy size={16} /> },
      ]
    },
    {
      category: 'Evolução', icon: <TrendingUp size={22} />,
      items: [
        { label: 'Feedback', path: '/feedback', icon: <MessageSquare size={16} /> },
        { label: 'PDI', path: '/pdi', icon: <TrendingUp size={16} /> },
        { label: 'Treinamentos', path: '/treinamentos', icon: <GraduationCap size={16} /> },
      ]
    }
  ]
}

export default function Layout() {
  const { profile, role, storeId: activeStoreId, setActiveStoreId, signOut } = useAuth()
  const { unreadCount } = useNotifications()
  const { stores } = useStores()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const categories = role ? (navConfig[role] || []) : []
  const activeCategoryData = categories.find(c => c.category === activeCategory) || categories[0]

  useEffect(() => {
    if (!categories.length) return
    for (const cat of categories) {
      if (cat.items.some(item => location.pathname.startsWith(item.path))) {
        setActiveCategory(cat.category)
        break
      }
    }
  }, [location.pathname, categories])

  if (!profile || !role) return null

  return (
    <div className="min-h-screen bg-surface-alt flex flex-col">

      {/* Top Header - Accessibility Hardening */}
      <header className="h-mx-header w-full px-mx-lg flex items-center justify-between z-60 bg-white border-b border-border-default shrink-0 sticky top-mx-0" role="banner">
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
              MX <span className="text-brand-primary">PERFORMANCE</span>
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-mx-md justify-end">
          {/* Store Switcher - Accessible Select */}
          {(role === 'dono' || role === 'admin') && (stores?.length ?? 0) > 1 && (
            <div className="hidden md:flex items-center gap-mx-xs px-4 py-2 bg-surface-alt rounded-mx-xl border border-border-default shadow-inner group relative">
              <Building2 size={16} className="text-brand-primary opacity-40" aria-hidden="true" />
              <label htmlFor="store-switcher" className="sr-only">Trocar Unidade Operacional</label>
              <select 
                id="store-switcher"
                value={activeStoreId || ''} 
                onChange={(e) => setActiveStoreId(e.target.value)}
                className="bg-transparent border-none text-mx-tiny font-black uppercase tracking-widest outline-none appearance-none cursor-pointer pr-6 focus-visible:ring-2 focus-visible:ring-brand-primary/20 rounded-mx-md"
              >
                <option value="">TODAS AS LOJAS</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-mx-xs top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" aria-hidden="true" />
            </div>
          )}

          <div className="hidden sm:flex items-center gap-mx-xs">
            <button type="button" aria-label="Pesquisar no sistema" className="w-mx-10 h-mx-10 bg-surface-alt rounded-mx-full flex items-center justify-center text-text-tertiary border border-border-default hover:text-text-primary transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15">
              <Search size={18} aria-hidden="true" />
            </button>
            <button type="button" aria-label={`Abrir notificações. ${unreadCount} não lidas.`} className="relative w-mx-10 h-mx-10 bg-surface-alt rounded-mx-full flex items-center justify-center text-text-tertiary border border-border-default hover:text-text-primary transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15">
              <Bell size={18} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-mx-0 right-mx-0 w-3.5 h-3.5 rounded-mx-full bg-brand-primary border-2 border-white flex items-center justify-center text-mx-micro font-black text-white" aria-hidden="true">
                  {unreadCount}
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
              <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest opacity-60">{role} level</Typography>
            </div>
            <div className="w-mx-10 h-mx-10 rounded-mx-md overflow-hidden shadow-mx-sm border border-border-default bg-surface-alt flex items-center justify-center text-brand-primary font-black uppercase text-sm">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                profile.name?.charAt(0)
              )}
            </div>
          </button>
        </div>
      </header>

      <div className="flex flex-1 p-mx-sm md:p-mx-md gap-mx-md relative">

        {/* Sidebar Minimalista - Semantic Nav */}
        <aside 
          className="hidden md:flex w-mx-20 flex-col items-center py-mx-md gap-mx-sm shrink-0 bg-white border border-border-default rounded-mx-3xl shadow-mx-sm sticky mx-layout-sticky-offset z-[60]" 
          aria-label="Menu Lateral Principal"
          onMouseLeave={() => setIsDrawerOpen(false)}
        >
          <nav className="flex flex-col items-center gap-mx-sm w-full" aria-label="Módulos de Gestão">
            {categories.map((cat) => (
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
                <div className="absolute mx-layout-tooltip-offset px-3 py-1.5 bg-brand-secondary text-white text-mx-micro font-black uppercase tracking-widest rounded-mx-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[70] whitespace-nowrap shadow-mx-lg" role="tooltip">
                  {cat.category}
                </div>
              </button>
            ))}
          </nav>
          <button 
            type="button" 
            aria-label="Encerrar Sessão do Sistema" 
            onClick={() => signOut()} 
            className="mt-auto w-mx-xl h-mx-xl rounded-mx-xl flex items-center justify-center text-text-tertiary hover:bg-status-error-surface hover:text-status-error transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-status-error/15"
          >
            <LogOut size={20} aria-hidden="true" />
          </button>
        </aside>

        {/* Workspace Root */}
        <main className="flex-1 bg-white border border-border-default rounded-mx-3xl relative shadow-mx-sm overflow-hidden" id="main-content" role="main">
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
              onMouseEnter={() => setIsDrawerOpen(true)}
              onMouseLeave={() => setIsDrawerOpen(false)}
            >
              <div className="p-mx-lg border-b border-border-subtle flex items-center justify-between bg-surface-alt/30">
                <Typography variant="caption" className="font-black uppercase tracking-widest">{activeCategoryData?.category}</Typography>
                <button 
                  type="button" 
                  aria-label="Fechar painel de opções" 
                  onClick={() => setIsDrawerOpen(false)} 
                  className="w-mx-lg h-mx-lg rounded-mx-md hover:bg-surface-alt flex items-center justify-center text-text-tertiary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15 transition-all"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-mx-sm space-y-mx-tiny no-scrollbar">
                {activeCategoryData?.items.map(item => (
                  <NavLink
                    key={item.path} to={item.path} onClick={() => setIsDrawerOpen(false)}
                    aria-current={location.pathname === item.path ? 'page' : undefined}
                    className={({ isActive }) => cn(
                      "flex items-center gap-mx-xs px-mx-md py-3 rounded-mx-lg text-xs font-black uppercase tracking-tight transition-all focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:outline-none",
                      isActive ? 'bg-mx-indigo-50 text-brand-primary' : 'text-text-secondary hover:bg-surface-alt'
                    )}
                  >
                    <span className="shrink-0" aria-hidden="true">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
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
              className="absolute bottom-mx-0 left-mx-0 right-mx-0 bg-white rounded-t-mx-4xl p-mx-xl pb-32 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-label="Menu Mobile Principal"
            >
              <div className="w-mx-xl h-1.5 bg-surface-alt rounded-mx-full mx-auto mb-8" aria-hidden="true" />
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-mx-sm">
                  <div className="h-mx-xl overflow-hidden"><img src={MxLogo} alt="MX Performance" className="h-full w-auto object-contain" /></div>
                  <div>
                    <Typography variant="h2" className="text-xl font-black text-text-primary tracking-tighter uppercase">MX PERFORMANCE</Typography>
                    <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">{role} level</Typography>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="w-mx-xl h-mx-xl rounded-mx-2xl bg-surface-alt flex items-center justify-center text-text-tertiary focus-visible:ring-2 focus-visible:ring-brand-primary/20"><X size={24} aria-label="Fechar" /></button>
              </div>

              <div className="space-y-mx-10">
                {categories.map(cat => (
                  <nav key={cat.category} className="space-y-mx-sm" aria-label={cat.category}>
                    <div className="flex items-center gap-mx-xs px-2">
                      <div className="text-brand-primary" aria-hidden="true">{cat.icon}</div>
                      <Typography variant="tiny" className="font-black text-text-tertiary uppercase tracking-mx-wide">{cat.category}</Typography>
                    </div>
                    <div className="grid grid-cols-1 gap-mx-xs">
                      {cat.items.map(item => (
                        <NavLink
                          key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) => cn(
                            "flex items-center gap-mx-sm px-6 py-4 rounded-mx-2xl text-sm font-black uppercase tracking-tight transition-all active:scale-[0.98]",
                            isActive ? 'bg-brand-primary text-white shadow-mx-lg' : 'bg-surface-alt text-text-secondary active:bg-border-default'
                          )}
                        >
                          <span aria-hidden="true">{item.icon}</span> {item.label}
                        </NavLink>
                      ))}
                    </div>
                  </nav>
                ))}
                <button onClick={() => signOut()} className="w-full flex items-center gap-mx-sm px-6 py-4 rounded-mx-2xl bg-status-error-surface text-status-error text-sm font-black uppercase tracking-tight transition-all active:scale-[0.98]">
                  <LogOut size={20} aria-hidden="true" /> Encerrar Sessão
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bar - Semantic Nav */}
      <nav className="md:hidden fixed bottom-mx-sm left-mx-sm right-mx-sm h-mx-2xl bg-mx-black shadow-2xl rounded-mx-2xl z-50 flex items-center px-mx-md border border-white/10 overflow-hidden" aria-label="Barra de Navegação Rápida">
        <div className="flex w-full justify-between items-center relative z-10">
          <NavLink
            to={role === 'vendedor' ? '/home' : role === 'admin' ? '/painel' : role === 'gerente' ? '/loja' : '/lojas'}
            aria-label="Início"
            aria-current={location.pathname === (role === 'vendedor' ? '/home' : role === 'admin' ? '/painel' : role === 'gerente' ? '/loja' : '/lojas') ? 'page' : undefined}
            className="w-mx-xl h-mx-xl flex items-center justify-center text-white/40 [&.active]:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-mx-xl"
          >
            {role === 'vendedor' ? <Home size={22} /> : <LayoutDashboard size={22} />}
          </NavLink>
          
          {role === 'vendedor' && (
            <NavLink 
              to="/checkin" 
              aria-label="Fazer Checkin" 
              aria-current={location.pathname === '/checkin' ? 'page' : undefined}
              className="w-mx-xl h-mx-xl flex items-center justify-center text-white/40 [&.active]:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-mx-xl"
            >
              <CheckSquare size={22} />
            </NavLink>
          )}

          {(role === 'gerente' || role === 'admin') && (
            <NavLink 
              to="/equipe" 
              aria-label="Gerir Equipe" 
              aria-current={location.pathname === '/equipe' ? 'page' : undefined}
              className="w-mx-xl h-mx-xl flex items-center justify-center text-white/40 [&.active]:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-mx-xl"
            >
              <Users size={22} />
            </NavLink>
          )}

          <button 
            type="button" 
            aria-label="Abrir menu mobile" 
            onClick={() => setMobileMenuOpen(true)} 
            className="w-mx-xl h-mx-xl rounded-mx-2xl bg-brand-primary text-white flex items-center justify-center shadow-mx-lg transform -translate-y-1 active:scale-90 transition-all border-4 border-pure-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/40"
          >
            <Menu size={24} aria-hidden="true" />
          </button>

          <NavLink 
            to="/ranking" 
            aria-label="Ver Ranking" 
            aria-current={location.pathname === '/ranking' ? 'page' : undefined}
            className="w-mx-xl h-mx-xl flex items-center justify-center text-white/40 [&.active]:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-mx-xl"
          >
            <Trophy size={22} />
          </NavLink>

          <NavLink 
            to="/perfil" 
            aria-label="Meu Perfil" 
            aria-current={location.pathname === '/perfil' ? 'page' : undefined}
            className="w-mx-xl h-mx-xl flex items-center justify-center text-white/40 [&.active]:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-mx-xl"
          >
            <User size={22} />
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
