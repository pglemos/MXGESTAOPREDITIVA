import React, { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useData'
import { useStores } from '@/hooks/useTeam'
import { motion, AnimatePresence } from 'motion/react'
import {
  Home, CheckSquare, History, Trophy, GraduationCap, MessageSquare,
  Bell, Settings, Users, Target, Grid, LayoutDashboard, Database, Search, User,
  LogOut, Zap, Menu, X, Building2, TrendingUp, Package, ClipboardList, SlidersHorizontal,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Typography } from './atoms/Typography'

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
      <header className="h-20 w-full px-mx-lg flex items-center justify-between z-40 bg-white border-b border-border-default shrink-0 sticky top-0" role="banner">
        <div className="flex items-center gap-mx-md min-w-0">
          <button
            type="button"
            aria-label="Ir para o painel inicial"
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-mx-lg bg-brand-secondary flex items-center justify-center shadow-mx-md shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15 transition-all active:scale-95"
          >
            <Zap size={20} className="text-white fill-white/10" aria-hidden="true" />
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
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-surface-alt rounded-xl border border-border-default shadow-inner group relative">
              <Building2 size={16} className="text-brand-primary opacity-40" aria-hidden="true" />
              <label htmlFor="store-switcher" className="sr-only">Trocar Unidade Operacional</label>
              <select 
                id="store-switcher"
                value={activeStoreId || ''} 
                onChange={(e) => setActiveStoreId(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer pr-6 focus-visible:ring-2 focus-visible:ring-brand-primary/20 rounded-md"
              >
                <option value="">TODAS AS LOJAS</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" aria-hidden="true" />
            </div>
          )}

          <div className="hidden sm:flex items-center gap-2">
            <button type="button" aria-label="Pesquisar no sistema" className="w-10 h-10 bg-surface-alt rounded-full flex items-center justify-center text-text-tertiary border border-border-default hover:text-text-primary transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15">
              <Search size={18} aria-hidden="true" />
            </button>
            <button type="button" aria-label={`Abrir notificações. ${unreadCount} não lidas.`} className="relative w-10 h-10 bg-surface-alt rounded-full flex items-center justify-center text-text-tertiary border border-border-default hover:text-text-primary transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15">
              <Bell size={18} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-brand-primary border-2 border-white flex items-center justify-center text-[8px] font-black text-white" aria-hidden="true">
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
            <div className="w-10 h-10 rounded-mx-md overflow-hidden shadow-mx-sm border border-border-default bg-surface-alt flex items-center justify-center text-brand-primary font-black uppercase text-sm">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                profile.name?.charAt(0)
              )}
            </div>
          </button>
        </div>
      </header>

      <div className="flex flex-1 p-mx-md gap-mx-md relative">

        {/* Sidebar Minimalista - Semantic Nav */}
        <aside className="hidden md:flex w-20 flex-col items-center py-mx-md gap-mx-sm shrink-0 bg-white border border-border-default rounded-mx-3xl shadow-mx-sm sticky top-24 h-[calc(100vh-120px)]" aria-label="Navegação Lateral">
          <nav className="flex flex-col items-center gap-mx-sm w-full" aria-label="Módulos MX">
            {categories.map((cat) => (
              <button
                type="button"
                aria-label={`Módulo: ${cat.category}`}
                aria-expanded={isDrawerOpen && activeCategory === cat.category}
                key={cat.category}
                onClick={() => { setActiveCategory(cat.category); setIsDrawerOpen(true) }}
                className={cn(
                  "w-12 h-12 rounded-mx-xl flex items-center justify-center transition-all relative group focus-visible:ring-4 focus-visible:ring-brand-primary/15 focus-visible:outline-none",
                  activeCategory === cat.category ? 'bg-brand-secondary text-white shadow-mx-lg' : 'text-text-tertiary hover:bg-surface-alt hover:text-text-primary'
                )}
              >
                {cat.icon}
                <div className="absolute left-[calc(100%+16px)] px-3 py-1.5 bg-brand-secondary text-white text-[9px] font-black uppercase tracking-widest rounded-mx-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap shadow-mx-lg" role="tooltip">
                  {cat.category}
                </div>
              </button>
            ))}
          </nav>
          <button 
            type="button" 
            aria-label="Encerrar Sessão" 
            onClick={() => signOut()} 
            className="mt-auto w-12 h-12 rounded-mx-xl flex items-center justify-center text-text-tertiary hover:bg-status-error-surface hover:text-status-error transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-status-error/15"
          >
            <LogOut size={20} aria-hidden="true" />
          </button>
        </aside>

        {/* Workspace Root */}
        <main className="flex-1 bg-white border border-border-default rounded-mx-3xl relative shadow-mx-sm overflow-hidden" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>

        {/* Drawer de Sub-módulos */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.div
              initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
              className="absolute left-24 top-mx-md bottom-mx-md w-64 bg-white border border-border-default rounded-mx-3xl shadow-mx-xl z-50 overflow-hidden flex flex-col"
              role="navigation"
              aria-label={`Menu de ${activeCategoryData?.category}`}
            >
              <div className="p-mx-lg border-b border-border-subtle flex items-center justify-between bg-surface-alt/30">
                <Typography variant="caption" className="font-black uppercase tracking-widest">{activeCategoryData?.category}</Typography>
                <button 
                  type="button" 
                  aria-label="Fechar menu" 
                  onClick={() => setIsDrawerOpen(false)} 
                  className="w-8 h-8 rounded-mx-md hover:bg-surface-alt flex items-center justify-center text-text-tertiary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15 transition-all"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-mx-sm space-y-1 no-scrollbar">
                {activeCategoryData?.items.map(item => (
                  <NavLink
                    key={item.path} to={item.path} onClick={() => setIsDrawerOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-mx-md py-3 rounded-mx-lg text-xs font-black uppercase tracking-tight transition-all focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:outline-none",
                      isActive ? 'bg-mx-indigo-50 text-brand-primary' : 'text-text-secondary hover:bg-surface-alt'
                    )}
                  >
                    <span className="shrink-0">{item.icon}</span>
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
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            role="presentation"
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-mx-xl pb-32 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-label="Menu Mobile Principal"
            >
              <div className="w-12 h-1.5 bg-surface-alt rounded-full mx-auto mb-8" aria-hidden="true" />
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-secondary text-white flex items-center justify-center shadow-lg"><Zap size={24} aria-hidden="true" /></div>
                  <div>
                    <Typography variant="h2" className="text-xl font-black text-text-primary tracking-tighter uppercase">Menu MX</Typography>
                    <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">{role} level</Typography>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="w-12 h-12 rounded-2xl bg-surface-alt flex items-center justify-center text-text-tertiary focus-visible:ring-2 focus-visible:ring-brand-primary/20"><X size={24} aria-label="Fechar" /></button>
              </div>

              <div className="space-y-10">
                {categories.map(cat => (
                  <nav key={cat.category} className="space-y-4" aria-label={cat.category}>
                    <div className="flex items-center gap-3 px-2">
                      <div className="text-brand-primary" aria-hidden="true">{cat.icon}</div>
                      <Typography variant="tiny" className="font-black text-text-tertiary uppercase tracking-[0.2em]">{cat.category}</Typography>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {cat.items.map(item => (
                        <NavLink
                          key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) => cn(
                            "flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-tight transition-all active:scale-[0.98]",
                            isActive ? 'bg-brand-primary text-white shadow-mx-lg' : 'bg-surface-alt text-text-secondary active:bg-border-default'
                          )}
                        >
                          <span aria-hidden="true">{item.icon}</span> {item.label}
                        </NavLink>
                      ))}
                    </div>
                  </nav>
                ))}
                <button onClick={() => signOut()} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-status-error-surface text-status-error text-sm font-black uppercase tracking-tight transition-all active:scale-[0.98]">
                  <LogOut size={20} aria-hidden="true" /> Encerrar Sessão
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bar - Semantic Nav */}
      <nav className="md:hidden fixed bottom-mx-sm left-mx-sm right-mx-sm h-16 bg-slate-950 shadow-2xl rounded-mx-2xl z-50 flex items-center px-mx-md border border-white/10 overflow-hidden" aria-label="Barra de Navegação Rápida">
        <div className="flex w-full justify-between items-center relative z-10">
          <NavLink 
            to={role === 'vendedor' ? '/home' : role === 'admin' ? '/painel' : '/lojas'} 
            aria-label="Início"
            className="w-12 h-12 flex items-center justify-center text-white/40 [&.active]:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-xl"
          >
            {role === 'vendedor' ? <Home size={22} /> : <LayoutDashboard size={22} />}
          </NavLink>
          
          {role === 'vendedor' && (
            <NavLink to="/checkin" aria-label="Fazer Checkin" className="w-12 h-12 flex items-center justify-center text-white/40 [&.active]:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-xl">
              <CheckSquare size={22} />
            </NavLink>
          )}

          {(role === 'gerente' || role === 'admin') && (
            <NavLink to="/equipe" aria-label="Gerir Equipe" className="w-12 h-12 flex items-center justify-center text-white/40 [&.active]:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-xl">
              <Users size={22} />
            </NavLink>
          )}

          <button 
            type="button" 
            aria-label="Abrir menu mobile" 
            onClick={() => setMobileMenuOpen(true)} 
            className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center shadow-mx-lg transform -translate-y-1 active:scale-90 transition-all border-4 border-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/40"
          >
            <Menu size={24} aria-hidden="true" />
          </button>

          <NavLink to="/ranking" aria-label="Ver Ranking" className="w-12 h-12 flex items-center justify-center text-white/40 [&.active]:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-xl">
            <Trophy size={22} />
          </NavLink>

          <NavLink to="/perfil" aria-label="Meu Perfil" className="w-12 h-12 flex items-center justify-center text-white/40 [&.active]:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-xl">
            <User size={22} />
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
