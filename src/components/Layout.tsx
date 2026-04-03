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
import { cn } from '@/lib/utils'

// 8pt Grid Scaling applied to Nav Configuration
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
        { label: 'Ranking', path: '/ranking', icon: <Trophy size={16} /> },
      ]
    },
    {
      category: 'Vendas',
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
        { label: 'Matinal', path: '/relatorio-matinal', icon: <Presentation size={16} /> },
      ]
    },
    {
      category: 'Ativos',
      icon: <Briefcase size={22} />,
      items: [
        { label: 'Financeiro', path: '/financeiro', icon: <Wallet size={16} /> },
        { label: 'Estoque', path: '/inventory', icon: <Car size={16} /> },
        { label: 'Produtos', path: '/produtos', icon: <Folder size={16} /> },
        { label: 'Comissões', path: '/configuracoes/comissoes', icon: <FileSignature size={16} /> },
      ]
    },
    {
      category: 'BI',
      icon: <Activity size={22} />,
      items: [
        { label: 'Perf. Vendas', path: '/relatorios/performance-vendas', icon: <Briefcase size={16} /> },
        { label: 'Perf. Vendedores', path: '/relatorios/performance-vendedores', icon: <Medal size={16} /> },
        { label: 'Vendas Cruzadas', path: '/relatorios/vendas-cruzados', icon: <Activity size={16} /> },
        { label: 'IA Diagnostics', path: '/ia-diagnostics', icon: <Bot size={16} /> },
      ]
    },
    {
      category: 'Cultura',
      icon: <Zap size={22} />,
      items: [
        { label: 'Gamification', path: '/gamification', icon: <Zap size={16} /> },
        { label: 'Activities', path: '/activities', icon: <Activity size={16} /> },
        { label: 'Treinamentos', path: '/treinamentos', icon: <GraduationCap size={16} /> },
        { label: 'Broadcast', path: '/communication', icon: <MessageSquare size={16} /> },
        { label: 'Feedback', path: '/feedback', icon: <MessageSquare size={16} /> },
      ]
    }
  ],
  vendedor: [
    {
      category: 'Minha Loja',
      icon: <Home size={22} />,
      items: [
        { label: 'Home', path: '/home' },
        { label: 'Check-in', path: '/checkin' },
        { label: 'Histórico', path: '/historico' },
        { label: 'Ranking', path: '/ranking' },
      ]
    },
    {
      category: 'Evolução',
      icon: <GraduationCap size={22} />,
      items: [
        { label: 'Treinos', path: '/treinamentos' },
        { label: 'Feedback', path: '/feedback' },
      ]
    }
  ]
}

export default function Layout() {
  const { profile, role, signOut } = useAuth()
  const { unreadCount } = useNotifications()
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
    <div className="h-[100dvh] bg-surface-alt flex flex-col overflow-hidden">

      {/* Top Header - Tokenized Spacing (mx-lg) */}
      <header className="h-[72px] md:h-24 w-full px-mx-md md:px-mx-xl flex items-center justify-between z-40 bg-transparent shrink-0">
        <div className="flex items-center gap-mx-md min-w-0">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-12 h-12 rounded-mx-lg bg-brand-secondary flex items-center justify-center shadow-mx-lg group cursor-pointer shrink-0"
            onClick={() => navigate('/')}
          >
            <Zap size={24} className="text-white fill-white/10" />
          </motion.div>
          <div className="flex flex-col min-w-0">
            <span className="font-black text-lg md:text-2xl tracking-tighter text-text-primary whitespace-nowrap truncate">
              MX <span className="text-text-tertiary font-bold hidden sm:inline">GESTÃO PREDITIVA</span>
            </span>
            <div className="hidden sm:flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-status-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="mx-text-caption truncate uppercase">System Core • Online</span>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-mx-sm md:gap-mx-md w-auto justify-end">
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden w-10 h-10 rounded-mx-md bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-primary">
            <Menu size={18} />
          </button>
          
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-text-tertiary shadow-mx-sm border border-border-default hover:text-text-primary hover:shadow-mx-md transition-all active:scale-90">
              <Search size={18} strokeWidth={2.5} />
            </button>
            <button className="relative w-10 h-10 bg-white rounded-full flex items-center justify-center text-text-tertiary shadow-mx-sm border border-border-default hover:text-text-primary hover:shadow-mx-md transition-all active:scale-90">
              <Bell size={18} strokeWidth={2.5} />
              {unreadCount > 0 && <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-brand-primary border-2 border-white flex items-center justify-center text-[8px] font-black text-white">{unreadCount}</span>}
            </button>
          </div>

          <div className="flex items-center gap-mx-sm pl-mx-md border-l border-border-default">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[11px] font-black text-text-primary tracking-tight leading-none mb-1">{profile.name}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-text-tertiary bg-mx-slate-100 px-2 py-0.5 rounded-full">{role} tier</span>
            </div>
            <button onClick={() => signOut().then(() => navigate('/login'))} className="w-10 h-10 sm:w-12 sm:h-12 rounded-mx-lg overflow-hidden shadow-mx-md hover:shadow-mx-lg transition-all p-1 bg-white border border-border-default relative group shrink-0">
              <div className="w-full h-full rounded-mx-md bg-brand-primary-surface flex items-center justify-center text-brand-primary font-black uppercase text-sm">
                {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : profile.name?.charAt(0)}
              </div>
              <div className="absolute inset-0 bg-status-error opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><LogOut size={20} className="text-white" /></div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Tokenized Spacing (mx-lg) */}
      <div className="flex flex-1 overflow-hidden px-mx-sm sm:px-mx-md md:px-mx-xl pb-mx-2xl md:pb-mx-md gap-mx-sm md:gap-mx-lg relative">

        {/* Sidebar (Main Modules Only) */}
        <aside className="hidden md:flex w-[80px] flex-col items-center py-mx-md gap-mx-sm relative z-30 shrink-0 bg-white/80 backdrop-blur-3xl border border-white/80 rounded-mx-3xl shadow-mx-md">
          <div className="flex flex-col gap-mx-xs items-center w-full overflow-y-auto no-scrollbar flex-1">
            {categories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => { setActiveCategory(cat.category); setIsDrawerOpen(true) }}
                className={cn(
                  "w-14 h-14 rounded-mx-lg flex items-center justify-center transition-all relative group",
                  activeCategory === cat.category ? 'bg-brand-secondary text-white shadow-mx-elite' : 'text-text-tertiary hover:bg-mx-slate-100 hover:text-text-primary'
                )}
              >
                <div className={activeCategory === cat.category ? 'scale-110' : 'group-hover:scale-110 transition-transform'}>{cat.icon}</div>
                <div className="absolute left-[calc(100%+16px)] px-4 py-2 bg-brand-secondary text-white text-[10px] font-black uppercase tracking-widest rounded-mx-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap shadow-mx-elite">
                  {cat.category}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-brand-secondary rotate-45" />
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Sub-module Drawer (Categorized Content) */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0, marginLeft: -24 }}
              animate={{ width: 240, opacity: 1, marginLeft: 0 }}
              exit={{ width: 0, opacity: 0, marginLeft: -24 }}
              className="hidden lg:flex flex-col bg-white border border-border-default rounded-mx-3xl shadow-mx-lg shrink-0 overflow-hidden relative z-20"
            >
              <div className="p-mx-md pb-mx-xs border-b border-border-subtle flex items-center justify-between">
                <span className="mx-text-caption">{activeCategoryData?.category}</span>
                <button onClick={() => setIsDrawerOpen(false)} className="text-text-tertiary hover:text-text-primary"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-mx-sm space-y-mx-xs no-scrollbar">
                {activeCategoryData?.items.map(item => (
                  <NavLink
                    key={item.path} to={item.path}
                    className={({ isActive }) => cn(
                      "flex items-center gap-mx-sm px-mx-md py-mx-sm rounded-mx-lg text-sm font-bold transition-all",
                      isActive ? 'bg-brand-primary-surface text-brand-primary shadow-inner' : 'text-text-secondary hover:bg-mx-slate-50 hover:text-text-primary'
                    )}
                  >
                    {item.icon && <span className="opacity-60">{item.icon}</span>}
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Workspace Root */}
        <main className="flex-1 h-full rounded-mx-3xl md:rounded-[3rem] relative z-10 animate-fade-in no-scrollbar flex flex-col overflow-hidden shadow-mx-md bg-white border border-border-subtle">
          {!isDrawerOpen && (
             <button onClick={() => setIsDrawerOpen(true)} className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 w-6 h-16 bg-white border border-l-0 border-border-strong rounded-r-mx-md items-center justify-center text-text-tertiary hover:text-brand-primary shadow-mx-md z-50 transition-all hover:w-8">
                <ChevronRight size={16} />
             </button>
          )}
          <Outlet />
        </main>
      </div>

      {/* Mobile Bar - Replaced repeated items with Intelligent Modal */}
      <nav className="md:hidden fixed bottom-mx-sm left-mx-sm right-mx-sm min-h-[72px] bg-brand-secondary/95 backdrop-blur-2xl shadow-mx-elite rounded-mx-3xl z-50 flex items-center px-mx-xs border border-white/10">
        <div className="grid w-full grid-cols-5 gap-1">
          {categories.slice(0, 4).map((cat) => (
            <NavLink
              key={cat.category} to={cat.items[0]?.path || '#'}
              onClick={() => setActiveCategory(cat.category)}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center gap-1.5 h-[56px] rounded-mx-lg transition-all",
                isActive ? 'text-white bg-white/10' : 'text-text-tertiary'
              )}
            >
              <div className="scale-100">{cat.icon}</div>
              <span className="text-[8px] uppercase tracking-[0.2em] font-black truncate px-1"> {cat.category}</span>
            </NavLink>
          ))}
          <button onClick={() => setMobileMenuOpen(true)} className={cn("flex flex-col items-center justify-center gap-1.5 h-[56px] rounded-mx-lg transition-all text-text-tertiary")}>
            <Menu size={22} />
            <span className="text-[8px] uppercase tracking-[0.2em] font-black">Menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile Semantic Menu (Hidden Navigation fix) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-surface-overlay backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-x-0 bottom-0 h-[85vh] rounded-t-[2.5rem] bg-surface-alt flex flex-col shadow-mx-elite">
            <div className="px-mx-md pt-mx-lg pb-mx-md border-b border-border-strong bg-white rounded-t-[2.5rem] shrink-0" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-brand-primary mx-text-caption mb-1">Módulos Estratégicos</p>
                  <h2 className="text-2xl font-black text-text-primary tracking-tighter">Navegação Hub</h2>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="w-12 h-12 rounded-mx-lg bg-mx-slate-50 flex items-center justify-center text-text-primary"><X size={20} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-mx-md py-mx-lg no-scrollbar space-y-mx-2xl pb-32" onClick={e => e.stopPropagation()}>
              {categories.map(cat => (
                <div key={cat.category} className="space-y-mx-md">
                  <div className="flex items-center gap-2 px-2 text-brand-primary">
                    {cat.icon} <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">{cat.category}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-mx-sm">
                    {cat.items.map(item => (
                      <NavLink key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className={({isActive}) => cn(
                        "rounded-mx-lg border p-mx-md min-h-[96px] flex flex-col justify-between transition-all shadow-mx-sm",
                        isActive ? 'bg-brand-secondary text-white border-brand-secondary shadow-mx-lg' : 'bg-white text-text-primary border-border-default'
                      )}>
                        <div className={cn("w-10 h-10 rounded-mx-md flex items-center justify-center shadow-inner", isActive ? 'bg-white/10' : 'bg-mx-slate-50 text-brand-primary')}>
                          {item.icon || <ChevronRight size={18} />}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide mt-2">{item.label}</span>
                      </NavLink>
                    ))}
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
