import React, { useEffect, useMemo, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useData'
import { motion, AnimatePresence } from 'motion/react'
import {
  Home, CheckSquare, History, Trophy, GraduationCap, MessageSquare,
  Bell, Settings, Users, Target, Grid, LayoutDashboard, Database, Search, User,
  LogOut, Zap, CalendarDays, Bot, FileSignature, Wallet, Car, Briefcase, Activity,
  Presentation, Medal, PhoneCall, Menu, X, ChevronRight, Folder
} from 'lucide-react'

// Define the nav config grouping pages into main modules (categories)
type SubItem = { label: string; path: string; icon?: React.ReactNode }
type NavCategory = { category: string; icon: React.ReactNode; items: SubItem[] }

const navConfig: Record<string, NavCategory[]> = {
  admin: [
    {
      category: 'Cockpit',
      icon: <Grid size={22} />,
      items: [
        { label: 'Dashboard', path: '/painel', icon: <LayoutDashboard size={16} /> },
        { label: 'Lojas', path: '/lojas', icon: <Database size={16} /> },
        { label: 'Loja', path: '/loja', icon: <Home size={16} /> },
        { label: 'Ranking', path: '/ranking', icon: <Trophy size={16} /> },
      ]
    },
    {
      category: 'Motor de Vendas',
      icon: <PhoneCall size={22} />,
      items: [
        { label: 'LeadOps', path: '/leadops', icon: <PhoneCall size={16} /> },
        { label: 'Leads', path: '/leads', icon: <Users size={16} /> },
        { label: 'Funil', path: '/funil', icon: <CheckSquare size={16} /> },
        { label: 'Agenda', path: '/agenda', icon: <CalendarDays size={16} /> },
      ]
    },
    {
      category: 'Operação',
      icon: <Target size={22} />,
      items: [
        { label: 'Equipe', path: '/equipe', icon: <Users size={16} /> },
        { label: 'Tarefas', path: '/tarefas', icon: <CheckSquare size={16} /> },
        { label: 'Metas', path: '/metas', icon: <Target size={16} /> },
        { label: 'Check-in', path: '/checkin', icon: <CheckSquare size={16} /> },
        { label: 'Histórico', path: '/historico', icon: <History size={16} /> },
        { label: 'Matinal', path: '/relatorio-matinal', icon: <Presentation size={16} /> },
      ]
    },
    {
      category: 'Negócios',
      icon: <Briefcase size={22} />,
      items: [
        { label: 'Financeiro', path: '/financeiro', icon: <Wallet size={16} /> },
        { label: 'Estoque', path: '/inventory', icon: <Car size={16} /> },
        { label: 'Produtos', path: '/produtos', icon: <Folder size={16} /> },
        { label: 'Comissões', path: '/configuracoes/comissoes', icon: <FileSignature size={16} /> },
      ]
    },
    {
      category: 'Inteligência',
      icon: <Activity size={22} />,
      items: [
        { label: 'Perf. Vendas', path: '/relatorios/performance-vendas', icon: <Briefcase size={16} /> },
        { label: 'Perf. Vendedores', path: '/relatorios/performance-vendedores', icon: <Medal size={16} /> },
        { label: 'Vendas Cruzadas', path: '/relatorios/vendas-cruzados', icon: <Activity size={16} /> },
        { label: 'Reports', path: '/reports/stock', icon: <LayoutDashboard size={16} /> },
        { label: 'IA', path: '/ia-diagnostics', icon: <Bot size={16} /> },
      ]
    },
    {
      category: 'Engajamento',
      icon: <Zap size={22} />,
      items: [
        { label: 'Gamification', path: '/gamification', icon: <Zap size={16} /> },
        { label: 'Activities', path: '/activities', icon: <Activity size={16} /> },
        { label: 'Treinamentos', path: '/treinamentos', icon: <GraduationCap size={16} /> },
        { label: 'Comunicação', path: '/communication', icon: <MessageSquare size={16} /> },
        { label: 'Feedback', path: '/feedback', icon: <MessageSquare size={16} /> },
      ]
    },
    {
      category: 'Sistema',
      icon: <Settings size={22} />,
      items: [
        { label: 'Configurações', path: '/configuracoes', icon: <Settings size={16} /> },
        { label: 'Notificações', path: '/notificacoes', icon: <Bell size={16} /> },
        { label: 'Perfil', path: '/perfil', icon: <User size={16} /> },
      ]
    }
  ],
  consultor: [
    {
      category: 'Principal',
      icon: <Grid size={22} />,
      items: [
        { label: 'Dashboard', path: '/painel' },
        { label: 'Lojas', path: '/lojas' },
      ]
    },
    {
      category: 'Sistema',
      icon: <Settings size={22} />,
      items: [
        { label: 'Treinamentos', path: '/treinamentos' },
        { label: 'Feedback', path: '/feedback' },
        { label: 'Notificações', path: '/notificacoes' },
        { label: 'Produtos', path: '/produtos' },
        { label: 'Configurações', path: '/configuracoes' },
        { label: 'Perfil', path: '/perfil' }
      ]
    }
  ],
  gerente: [
    {
      category: 'Gestão',
      icon: <Target size={22} />,
      items: [
        { label: 'Home', path: '/loja' },
        { label: 'Equipe', path: '/equipe' },
        { label: 'Metas', path: '/metas' },
        { label: 'Funil', path: '/funil' },
        { label: 'PDI', path: '/pdi' },
      ]
    }
  ],
  vendedor: [
    {
      category: 'Vendas',
      icon: <Home size={22} />,
      items: [
        { label: 'Home', path: '/home' },
        { label: 'Check-in', path: '/checkin' },
        { label: 'Histórico', path: '/historico' },
        { label: 'Ranking', path: '/ranking' },
        { label: 'Feedback', path: '/feedback' },
      ]
    }
  ]
}

import { useIsMobile } from '@/hooks/use-mobile'

export default function Layout() {
  const { profile, role, signOut } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Layout states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const isMobile = useIsMobile()

  // Initialization & Role Checks
  const categories = role ? (navConfig[role] || []) : []
  
  // Set initial category based on current route
  useEffect(() => {
    if (!categories.length) return
    for (const cat of categories) {
      if (cat.items.some(item => location.pathname.startsWith(item.path))) {
        setActiveCategory(cat.category)
        break
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  if (!profile || !role) return null

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  // Handle mobile navigation click
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Get active category object for sub-menu rendering
  const activeCategoryData = categories.find(c => c.category === activeCategory) || categories[0]

  return (
    <div className="h-[100dvh] bg-[#F8FAFC] text-[#1A1D20] font-sans flex flex-col overflow-hidden selection:bg-[#1A1D20] selection:text-white">

      {/* Top Header */}
      <header className="h-[72px] md:h-[96px] w-full px-3 sm:px-4 md:px-10 flex items-center justify-between z-40 bg-transparent shrink-0">

        {/* Left: Logo & Context */}
        <div className="flex items-center gap-3 md:gap-5 min-w-0 w-auto">
          <motion.div
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="w-12 h-12 rounded-[1.2rem] bg-[#1A1D20] flex items-center justify-center shadow-xl shadow-black/10 group cursor-pointer shrink-0"
            onClick={() => navigate('/')}
          >
            <Zap size={24} className="text-white fill-white/10 group-hover:fill-white/40 transition-all" />
          </motion.div>
          <div className="flex flex-col min-w-0">
            <span className="font-black text-base sm:text-lg md:text-2xl tracking-tight leading-none text-[#1A1D20] whitespace-nowrap truncate">
              MX <span className="text-gray-400 font-bold hidden sm:inline">Gestão Preditiva</span>
            </span>
            <div className="hidden sm:flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 truncate">Node Cluster 01 • Active</span>
            </div>
          </div>
        </div>

        {/* Center: Module Title (replaces the old huge nav strip) */}
        <div className="hidden lg:flex flex-1 justify-center px-4">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/70 border border-gray-100 px-6 py-2.5 shadow-sm">
            <div className="text-indigo-600 bg-indigo-50 p-1.5 rounded-full">
              {activeCategoryData?.icon}
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-700">
              {activeCategoryData?.category || 'Módulo Principal'}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-5 w-auto justify-end">
          {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-[#1A1D20]"
          >
            <Menu size={18} />
          </button>
          )}
          
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-300 shadow-sm border border-gray-100 hover:text-[#1A1D20] hover:shadow-xl transition-all active:scale-90">
              <Search size={18} strokeWidth={2.5} />
            </button>
            <div className="w-[1px] h-6 bg-gray-100 mx-1" />
            <button className="relative w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm border border-gray-100 hover:text-[#1A1D20] hover:shadow-xl transition-all active:scale-90">
              <Bell size={18} strokeWidth={2.5} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-[8px] font-black text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Profile & Name */}
          <div className="flex items-center gap-2 sm:gap-4 pl-2 sm:pl-4 border-l border-gray-100 lg:pl-6">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[11px] font-black text-[#1A1D20] tracking-tight leading-none mb-1">{profile.name}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#1A1D20]/40 bg-gray-100 px-2 py-0.5 rounded-full">{role} access</span>
            </div>
            <button
              onClick={handleSignOut}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:ring-4 ring-indigo-500/10 transition-all p-1 bg-white border border-gray-100 relative group shrink-0"
            >
              <div className="w-full h-full rounded-xl bg-gradient-to-tr from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-600 font-black uppercase overflow-hidden text-sm">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="User" className="w-full h-full object-cover" />
                ) : (
                  profile.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <LogOut size={20} className="text-white" />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden px-3 sm:px-4 md:px-10 pb-24 md:pb-10 gap-3 md:gap-6 relative">

        {/* Primary Sidebar (Main Modules) */}
        <aside className="hidden md:flex w-[88px] flex-col items-center py-6 gap-4 relative z-30 shrink-0 min-h-0 bg-white/80 backdrop-blur-3xl border border-white/80 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col gap-3 items-center w-full overflow-y-auto no-scrollbar flex-1">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.category
              return (
                <button
                  key={cat.category}
                  onClick={() => {
                    setActiveCategory(cat.category)
                    setIsDrawerOpen(true)
                  }}
                  className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center transition-all relative group ${isActive
                    ? 'bg-[#1A1D20] text-white shadow-2xl shadow-black/20'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-[#1A1D20]'
                    }`}
                >
                  <div className={isActive ? 'scale-110' : 'group-hover:scale-110 transition-transform'}>
                    {cat.icon}
                  </div>
                  {/* Category Tooltip */}
                  <div className="absolute left-[calc(100%+12px)] px-4 py-2 bg-[#1A1D20] text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap shadow-2xl">
                    {cat.category}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#1A1D20] rotate-45" />
                  </div>
                </button>
              )
            })}
          </div>
          
          <div className="mt-auto w-full pt-4 border-t border-gray-100/50">
            <button
              onClick={handleSignOut}
              className="w-14 h-14 mx-auto rounded-[1.2rem] flex items-center justify-center text-rose-300 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all group relative border border-transparent"
            >
              <LogOut size={24} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </aside>

        {/* Secondary Drawer (Sub-modules) */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0, marginLeft: -24 }}
              animate={{ width: 240, opacity: 1, marginLeft: 0 }}
              exit={{ width: 0, opacity: 0, marginLeft: -24 }}
              className="hidden lg:flex flex-col bg-white border border-gray-100 rounded-[2.5rem] shadow-xl shrink-0 overflow-hidden relative z-20"
            >
              <div className="p-6 pb-2 border-b border-gray-50 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">{activeCategoryData?.category}</span>
                <button onClick={() => setIsDrawerOpen(false)} className="text-gray-300 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar">
                {activeCategoryData?.items.map(item => {
                  const isActive = location.pathname === item.path
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                        isActive 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {item.icon && <span className={isActive ? 'text-indigo-500' : 'text-gray-400'}>{item.icon}</span>}
                      {item.label}
                    </NavLink>
                  )
                })}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 h-full rounded-[2.5rem] md:rounded-[3rem] relative z-10 animate-fade-in no-scrollbar flex flex-col overflow-hidden shadow-2xl shadow-black/[0.03] bg-white border border-gray-50">
          {/* Main Module Toggle for desktop if drawer is closed */}
          {!isDrawerOpen && (
             <button 
                onClick={() => setIsDrawerOpen(true)}
                className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 w-6 h-16 bg-white border border-l-0 border-gray-200 rounded-r-xl items-center justify-center text-gray-400 hover:text-indigo-600 shadow-md z-50 transition-all hover:w-8"
              >
                <ChevronRight size={16} />
             </button>
          )}
          <Outlet />
        </main>

      </div>

      {/* Mobile Bottom Tab Bar */}
      {isMobile && (
      <nav className="md:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 min-h-[72px] bg-[#1A1D20]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2rem] z-50 flex items-center px-2 border border-white/10">
        <div className="grid w-full grid-cols-5 gap-1">
          {/* We show top 4 categories from admin as quick links */}
          {categories.slice(0, 4).map((cat) => {
            const isActive = activeCategory === cat.category
            // We link to the first item of the category
            const linkPath = cat.items[0]?.path || '#'
            return (
              <NavLink
                key={cat.category}
                to={linkPath}
                onClick={() => setActiveCategory(cat.category)}
                className={`flex flex-col items-center justify-center gap-1.5 h-[56px] rounded-2xl transition-all ${isActive ? 'text-white bg-white/10' : 'text-gray-500'}`}
              >
                <div className={`transition-all duration-300 ${isActive ? 'scale-110 text-indigo-400' : 'scale-100'}`}>
                  {cat.icon}
                </div>
                <span className={`text-[8px] uppercase tracking-[0.2em] font-black ${isActive ? 'text-white' : 'text-gray-600'} truncate px-1 max-w-full`}>
                  {cat.category}
                </span>
              </NavLink>
            )
          })}
          
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center gap-1.5 h-[56px] rounded-2xl transition-all ${mobileMenuOpen ? 'text-white bg-white/10' : 'text-gray-500'}`}
          >
            <div className={`transition-all duration-300 ${mobileMenuOpen ? 'scale-110 text-indigo-400' : 'scale-100'}`}>
              <Menu size={22} />
            </div>
            <span className={`text-[8px] uppercase tracking-[0.2em] font-black ${mobileMenuOpen ? 'text-white' : 'text-gray-600'}`}>
              Todos
            </span>
          </button>
        </div>
      </nav>
      )}

      {/* Mobile Drawer/Modal (Categorized) */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-[#1A1D20]/55 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="absolute inset-x-0 bottom-0 h-[85vh] rounded-t-[2.25rem] bg-[#F8FAFC] border-t border-white/60 shadow-[0_-20px_60px_rgba(0,0,0,0.2)] flex flex-col">
            <div className="px-5 pt-6 pb-4 border-b border-gray-200 bg-white rounded-t-[2.25rem] shrink-0" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-1">Módulos do Sistema</p>
                  <h2 className="text-2xl font-black tracking-tight text-[#1A1D20]">Navegação</h2>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-12 h-12 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center text-[#1A1D20]"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar space-y-8 pb-32"
              onClick={(e) => e.stopPropagation()}
            >
              {categories.map((cat) => (
                <div key={cat.category} className="space-y-3">
                  <div className="flex items-center gap-2 px-2">
                    <div className="text-indigo-400">{cat.icon}</div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">{cat.category}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {cat.items.map((item) => {
                      const isActive = location.pathname === item.path
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`rounded-[1.25rem] border p-4 min-h-[96px] flex flex-col justify-between transition-all ${
                            isActive
                              ? 'bg-[#1A1D20] text-white border-[#1A1D20] shadow-xl'
                              : 'bg-white text-[#1A1D20] border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isActive ? 'bg-white/10 text-indigo-300' : 'bg-gray-50 text-indigo-500'
                          }`}>
                            {item.icon || <ChevronRight size={18} />}
                          </div>
                          <span className={`text-[11px] font-bold tracking-wide mt-2 ${
                            isActive ? 'text-white' : 'text-gray-600'
                          }`}>
                            {item.label}
                          </span>
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
