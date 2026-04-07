import React, { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useData'
import { motion, AnimatePresence } from 'motion/react'
import {
  Home, CheckSquare, History, Trophy, GraduationCap, MessageSquare,
  Bell, Settings, Users, Target, Grid, LayoutDashboard, Database, Search, User,
  LogOut, Zap, Menu, X, Building2, TrendingUp, Package, ClipboardList, SlidersHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'

type SubItem = { label: string; path: string; icon?: React.ReactNode }
type NavCategory = { category: string; icon: React.ReactNode; items: SubItem[] }

const navConfig: Record<string, NavCategory[]> = {
  admin: [
    {
      category: 'Governança MX', icon: <Grid size={22} />,
      items: [
        { label: 'Painel Geral', path: '/painel', icon: <LayoutDashboard size={16} /> },
        { label: 'Lojas', path: '/lojas', icon: <Building2 size={16} /> },
        { label: 'Usuários', path: '/equipe', icon: <Users size={16} /> },
        { label: 'Metas', path: '/metas', icon: <Target size={16} /> },
        { label: 'Benchmarks', path: '/metas', icon: <TrendingUp size={16} /> },
      ]
    },
    {
      category: 'Rituais MX', icon: <Target size={22} />,
      items: [
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
        { label: 'Reprocessamento', path: '/configuracoes/reprocessamento', icon: <Database size={16} /> },
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
          <button
            type="button"
            aria-label="Ir para o painel inicial"
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-mx-lg bg-brand-secondary flex items-center justify-center shadow-mx-md shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15"
          >
            <Zap size={20} className="text-white fill-white/10" aria-hidden="true" />
          </button>
          <div className="flex flex-col min-w-0">
            <span className="font-black text-xl tracking-tighter text-text-primary whitespace-nowrap truncate uppercase">
              MX <span className="text-brand-primary">PERFORMANCE</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-mx-md justify-end">
          <div className="hidden sm:flex items-center gap-2">
            <button type="button" aria-label="Pesquisar" className="w-10 h-10 bg-mx-slate-50 rounded-full flex items-center justify-center text-text-tertiary border border-border-default hover:text-text-primary transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15">
              <Search size={18} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Abrir notificações" className="relative w-10 h-10 bg-mx-slate-50 rounded-full flex items-center justify-center text-text-tertiary border border-border-default hover:text-text-primary transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15">
              <Bell size={18} aria-hidden="true" />
              {unreadCount > 0 && <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-brand-primary border-2 border-white flex items-center justify-center text-[8px] font-black text-white">{unreadCount}</span>}
            </button>
          </div>

          <button
            type="button"
            aria-label="Abrir perfil"
            className="flex items-center gap-mx-sm pl-mx-md border-l border-border-default group text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15 rounded-mx-lg"
            onClick={() => navigate('/perfil')}
          >
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[11px] font-black text-text-primary tracking-tight leading-none mb-1">{profile.name}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-text-tertiary">{role} level</span>
            </div>
            <div className="w-10 h-10 rounded-mx-md overflow-hidden shadow-mx-sm border border-border-default bg-mx-slate-50 flex items-center justify-center text-brand-primary font-black uppercase text-sm">
              {profile.avatar_url ? <img src={profile.avatar_url} alt={`Avatar de ${profile.name || 'usuário'}`} className="w-full h-full object-cover" /> : profile.name?.charAt(0)}
            </div>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden p-mx-md gap-mx-md relative">

        {/* Sidebar Minimalista */}
        <aside className="hidden md:flex w-20 flex-col items-center py-mx-md gap-mx-sm shrink-0 bg-white border border-border-default rounded-mx-3xl shadow-mx-sm">
          {categories.map((cat) => (
            <button
              type="button"
              aria-label={`Abrir categoria ${cat.category}`}
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
          <button type="button" aria-label="Sair da conta" onClick={() => signOut()} className="mt-auto w-12 h-12 rounded-mx-xl flex items-center justify-center text-text-tertiary hover:bg-status-error-surface hover:text-status-error transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-status-error/15">
            <LogOut size={20} aria-hidden="true" />
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
                <button type="button" aria-label="Fechar menu de módulos" onClick={() => setIsDrawerOpen(false)} className="w-8 h-8 rounded-mx-md hover:bg-mx-slate-100 flex items-center justify-center text-text-tertiary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15"><X size={16} aria-hidden="true" /></button>
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
          <NavLink to="/painel" aria-label="Abrir painel" className="text-white/40 [&.active]:text-white transition-colors"><LayoutDashboard size={24} aria-hidden="true" /></NavLink>
          <NavLink to="/lojas" aria-label="Abrir lojas" className="text-white/40 [&.active]:text-white transition-colors"><Database size={24} aria-hidden="true" /></NavLink>
          <button type="button" aria-label="Abrir menu mobile" onClick={() => setMobileMenuOpen(true)} className="w-12 h-12 rounded-mx-xl bg-brand-primary text-white flex items-center justify-center shadow-mx-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"><Menu size={24} aria-hidden="true" /></button>
          <NavLink to="/ranking" aria-label="Abrir ranking" className="text-white/40 [&.active]:text-white transition-colors"><Trophy size={24} aria-hidden="true" /></NavLink>
          <NavLink to="/perfil" aria-label="Abrir perfil" className="text-white/40 [&.active]:text-white transition-colors"><User size={24} aria-hidden="true" /></NavLink>
        </div>
      </nav>
    </div>
  )
}
