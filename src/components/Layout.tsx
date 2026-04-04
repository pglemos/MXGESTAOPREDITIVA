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

type SubItem = { label: string; path: string; icon?: React.ReactNode }
type NavCategory = { category: string; icon: React.ReactNode; items: SubItem[] }

const navConfig: Record<string, NavCategory[]> = {
  admin: [
    {
      category: 'Consultoria', icon: <Grid size={22} />,
      items: [
        { label: 'Visão Geral', path: '/painel', icon: <LayoutDashboard size={16} /> },
        { label: 'Lojas', path: '/lojas', icon: <Database size={16} /> },
        { label: 'Equipes', path: '/equipe', icon: <Users size={16} /> },
        { label: 'Metas', path: '/metas', icon: <Target size={16} /> },
      ]
    },
    {
      category: 'Metodologia', icon: <Target size={22} />,
      items: [
        { label: 'Matinal', path: '/relatorio-matinal', icon: <Presentation size={16} /> },
        { label: 'Ranking', path: '/ranking', icon: <Trophy size={16} /> },
      ]
    },
    {
      category: 'Sistema', icon: <Settings size={22} />,
      items: [
        { label: 'Configurações', path: '/configuracoes', icon: <Settings size={16} /> },
      ]
    }
  ],
  gerente: [
    {
      category: 'Minha Loja', icon: <Home size={22} />,
      items: [
        { label: 'Rotina Diária', path: '/rotina', icon: <CheckSquare size={16} /> },
        { label: 'Painel da Loja', path: '/loja', icon: <LayoutDashboard size={16} /> },
        { label: 'Equipe', path: '/equipe', icon: <Users size={16} /> },
        { label: 'Check-ins', path: '/checkin', icon: <CheckSquare size={16} /> },
        { label: 'Ranking', path: '/ranking', icon: <Trophy size={16} /> },
      ]
    }
  ],
  vendedor: [
    {
      category: 'Operação', icon: <Home size={22} />,
      items: [
        { label: 'Lançamento', path: '/checkin', icon: <CheckSquare size={16} /> },
        { label: 'Histórico', path: '/historico', icon: <History size={16} /> },
        { label: 'Ranking', path: '/ranking', icon: <Trophy size={16} /> },
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

      {/* Top Header - Alinhamento Corrigido */}
      <header className="h-20 w-full px-mx-lg flex items-center justify-between z-40 bg-white border-b border-border-default shrink-0">
        <div className="flex items-center gap-mx-md min-w-0">
          <div onClick={() => navigate('/')} className="w-10 h-10 rounded-mx-lg bg-brand-secondary flex items-center justify-center shadow-mx-md cursor-pointer shrink-0">
            <Zap size={20} className="text-white fill-white/10" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-black text-xl tracking-tighter text-text-primary whitespace-nowrap truncate uppercase">
              MX <span className="text-brand-primary">Gestão Preditiva</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-mx-md justify-end">
          <div className="hidden sm:flex items-center gap-2">
            <button className="w-10 h-10 bg-mx-slate-50 rounded-full flex items-center justify-center text-text-tertiary border border-border-default hover:text-text-primary transition-all">
              <Search size={18} />
            </button>
            <button className="relative w-10 h-10 bg-mx-slate-50 rounded-full flex items-center justify-center text-text-tertiary border border-border-default hover:text-text-primary transition-all">
              <Bell size={18} />
              {unreadCount > 0 && <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-brand-primary border-2 border-white flex items-center justify-center text-[8px] font-black text-white">{unreadCount}</span>}
            </button>
          </div>

          <div className="flex items-center gap-mx-sm pl-mx-md border-l border-border-default group cursor-pointer" onClick={() => navigate('/perfil')}>
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[11px] font-black text-text-primary tracking-tight leading-none mb-1">{profile.name}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-text-tertiary">{role} level</span>
            </div>
            <div className="w-10 h-10 rounded-mx-md overflow-hidden shadow-mx-sm border border-border-default bg-mx-slate-50 flex items-center justify-center text-brand-primary font-black uppercase text-sm">
              {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : profile.name?.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden p-mx-md gap-mx-md relative">

        {/* Sidebar Minimalista */}
        <aside className="hidden md:flex w-20 flex-col items-center py-mx-md gap-mx-sm shrink-0 bg-white border border-border-default rounded-mx-3xl shadow-mx-sm">
          {categories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => { setActiveCategory(cat.category); setIsDrawerOpen(true) }}
              className={cn(
                "w-12 h-12 rounded-mx-xl flex items-center justify-center transition-all relative group",
                activeCategory === cat.category ? 'bg-brand-secondary text-white shadow-mx-lg' : 'text-text-tertiary hover:bg-mx-slate-50 hover:text-text-primary'
              )}
            >
              {cat.icon}
              <div className="absolute left-[calc(100%+16px)] px-3 py-1.5 bg-brand-secondary text-white text-[9px] font-black uppercase tracking-widest rounded-mx-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap shadow-mx-lg">
                {cat.category}
              </div>
            </button>
          ))}
          <button onClick={() => signOut()} className="mt-auto w-12 h-12 rounded-mx-xl flex items-center justify-center text-text-tertiary hover:bg-status-error-surface hover:text-status-error transition-all">
            <LogOut size={20} />
          </button>
        </aside>

        {/* Workspace Root - Sem o botão fantasma */}
        <main className="flex-1 h-full bg-white border border-border-default rounded-mx-3xl overflow-hidden relative shadow-mx-sm">
          <Outlet />
        </main>

        {/* Drawer de Sub-módulos (Opcional - Ativado via Botão no Sidebar se necessário) */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.div
              initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
              className="absolute left-24 top-mx-md bottom-mx-md w-64 bg-white border border-border-default rounded-mx-3xl shadow-mx-xl z-50 overflow-hidden flex flex-col"
            >
              <div className="p-mx-lg border-b border-border-subtle flex items-center justify-between bg-mx-slate-50/30">
                <span className="mx-text-caption">{activeCategoryData?.category}</span>
                <button onClick={() => setIsDrawerOpen(false)} className="w-8 h-8 rounded-mx-md hover:bg-mx-slate-100 flex items-center justify-center text-text-tertiary"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-mx-sm space-y-1 no-scrollbar">
                {activeCategoryData?.items.map(item => (
                  <NavLink
                    key={item.path} to={item.path} onClick={() => setIsDrawerOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-mx-md py-3 rounded-mx-lg text-xs font-black uppercase tracking-tight transition-all",
                      isActive ? 'bg-brand-primary-surface text-brand-primary' : 'text-text-secondary hover:bg-mx-slate-50'
                    )}
                  >
                    {item.icon} {item.label}
                  </NavLink>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Bar - Unificada */}
      <nav className="md:hidden fixed bottom-mx-sm left-mx-sm right-mx-sm h-16 bg-brand-secondary/95 backdrop-blur-xl shadow-mx-elite rounded-mx-2xl z-50 flex items-center px-mx-md border border-white/10">
        <div className="flex w-full justify-between items-center">
          <NavLink to="/painel" className="text-white/40 [&.active]:text-white transition-colors"><LayoutDashboard size={24} /></NavLink>
          <NavLink to="/lojas" className="text-white/40 [&.active]:text-white transition-colors"><Database size={24} /></NavLink>
          <button onClick={() => setMobileMenuOpen(true)} className="w-12 h-12 rounded-mx-xl bg-brand-primary text-white flex items-center justify-center shadow-mx-lg"><Menu size={24} /></button>
          <NavLink to="/ranking" className="text-white/40 [&.active]:text-white transition-colors"><Trophy size={24} /></NavLink>
          <NavLink to="/perfil" className="text-white/40 [&.active]:text-white transition-colors"><User size={24} /></NavLink>
        </div>
      </nav>
    </div>
  )
}
