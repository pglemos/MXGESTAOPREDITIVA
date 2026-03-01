import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useData'
import { motion, AnimatePresence } from 'motion/react'
import {
  Home, CheckSquare, History, Trophy, GraduationCap, MessageSquare,
  Bell, User, Settings, Users, Target, Grid, LayoutDashboard, Database, Search, Mail,
  LogOut, Menu, X, Sparkles, Shield, ChevronRight, Zap
} from 'lucide-react'

// Define the nav config based on user role with actual icons
const navConfig: Record<string, { label: string; path: string; icon: React.ReactNode }[]> = {
  consultor: [
    { label: 'Dashboard', path: '/painel', icon: <Grid size={22} /> },
    { label: 'Lojas', path: '/lojas', icon: <Database size={22} /> },
    { label: 'Treinamentos', path: '/treinamentos', icon: <GraduationCap size={22} /> },
    { label: 'Produtos', path: '/produtos', icon: <LayoutDashboard size={22} /> },
    { label: 'Configurações', path: '/configuracoes', icon: <Settings size={22} /> }
  ],
  gerente: [
    { label: 'Home', path: '/loja', icon: <Home size={22} /> },
    { label: 'Equipe', path: '/equipe', icon: <Users size={22} /> },
    { label: 'Metas', path: '/metas', icon: <Target size={22} /> },
    { label: 'Funil', path: '/funil', icon: <CheckSquare size={22} /> },
    { label: 'Feedback', path: '/feedback', icon: <MessageSquare size={22} /> },
    { label: 'PDI', path: '/pdi', icon: <LayoutDashboard size={22} /> },
  ],
  vendedor: [
    { label: 'Home', path: '/home', icon: <Home size={22} /> },
    { label: 'Check-in', path: '/checkin', icon: <CheckSquare size={22} /> },
    { label: 'Histórico', path: '/historico', icon: <History size={22} /> },
    { label: 'Ranking', path: '/ranking', icon: <Trophy size={22} /> },
    { label: 'Feedback', path: '/feedback', icon: <MessageSquare size={22} /> },
  ],
}

export default function Layout() {
  const { profile, role, signOut } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!profile || !role) return null

  const navItems = navConfig[role] || []

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="h-screen bg-[#F8FAFC] text-[#1A1D20] font-sans flex flex-col overflow-hidden selection:bg-[#1A1D20] selection:text-white">

      {/* Top Header */}
      <header className="h-[72px] md:h-[96px] w-full px-4 md:px-10 flex items-center justify-between z-40 bg-transparent shrink-0">

        {/* Left: Logo & Context */}
        <div className="flex items-center gap-5 w-auto md:w-[320px]">
          <motion.div
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="w-12 h-12 rounded-[1.2rem] bg-[#1A1D20] flex items-center justify-center shadow-xl shadow-black/10 group cursor-pointer"
            onClick={() => navigate('/')}
          >
            <Zap size={24} className="text-white fill-white/10 group-hover:fill-white/40 transition-all" />
          </motion.div>
          <div className="flex flex-col">
            <span className="font-black text-xl md:text-2xl tracking-tighter leading-none text-[#1A1D20] whitespace-nowrap">
              MX <span className="text-gray-400 font-bold">Gestão Preditiva</span>
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Node Cluster 01 • Active</span>
            </div>
          </div>
        </div>

        {/* Center: Top Navigation (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 flex-1 justify-center px-4">
          <AnimatePresence>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`relative text-[11px] font-black uppercase tracking-widest transition-all duration-300 px-6 py-3 rounded-full flex items-center gap-3 ${isActive
                    ? 'text-[#1A1D20]'
                    : 'text-gray-400 hover:text-[#1A1D20] hover:bg-white/50'
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-white shadow-xl shadow-black/[0.03] border border-gray-100 rounded-full z-0"
                      transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </NavLink>
              )
            })}
          </AnimatePresence>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 md:gap-5 w-auto md:w-[320px] justify-end">
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
          <div className="flex items-center gap-4 pl-4 border-l border-gray-100 lg:pl-6">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[11px] font-black text-[#1A1D20] tracking-tight leading-none mb-1">{profile.name}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#1A1D20]/40 bg-gray-100 px-2 py-0.5 rounded-full">{role} access</span>
            </div>
            <button
              onClick={handleSignOut}
              className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:ring-4 ring-indigo-500/10 transition-all p-1 bg-white border border-gray-100 relative group"
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
      <div className="flex flex-1 overflow-hidden px-4 md:px-10 pb-24 md:pb-10 gap-4 md:gap-10 relative">

        {/* Sidebar Mini (Desktop) */}
        <aside className="hidden md:flex w-20 flex-col items-center py-6 gap-4 relative z-20 shrink-0">
          <div className="flex flex-col gap-4 items-center w-full bg-white/50 backdrop-blur-3xl border border-white/50 rounded-[2.5rem] py-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.03)]">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center transition-all relative group ${isActive
                    ? 'bg-[#1A1D20] text-white shadow-2xl shadow-black/20'
                    : 'text-gray-300 hover:bg-white hover:text-[#1A1D20] hover:shadow-xl border border-transparent'
                    }`}
                >
                  <div className={isActive ? 'scale-110' : 'group-hover:scale-110 transition-transform'}>
                    {item.icon}
                  </div>
                  {/* Tooltip */}
                  <div className="absolute left-[calc(100%+12px)] px-4 py-2 bg-[#1A1D20] text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap shadow-2xl">
                    {item.label}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#1A1D20] rotate-45" />
                  </div>
                </NavLink>
              )
            })}
          </div>

          <div className="mt-auto w-full">
            <button
              onClick={handleSignOut}
              className="w-14 h-14 mx-auto rounded-[1.2rem] flex items-center justify-center text-rose-300 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all group relative border border-transparent"
            >
              <LogOut size={24} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 h-full rounded-[2.5rem] md:rounded-[4rem] relative z-10 animate-fade-in no-scrollbar flex flex-col overflow-hidden shadow-2xl shadow-black/[0.03] bg-transparent">
          <Outlet />
        </main>

      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-[76px] bg-[#1A1D20]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2.5rem] z-50 flex items-center justify-around px-4 border border-white/10">
        {navItems.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-[56px] rounded-2xl transition-all ${isActive ? 'text-white' : 'text-gray-500'}`}
            >
              <div className={`transition-all duration-300 ${isActive ? 'scale-110 text-indigo-400' : 'scale-100'}`}>
                {item.icon}
              </div>
              <span className={`text-[8px] uppercase tracking-[0.2em] font-black ${isActive ? 'text-white' : 'text-gray-600'}`}>
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </nav>

    </div>
  )
}
