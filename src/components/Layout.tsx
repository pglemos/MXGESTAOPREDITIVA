import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useData'
import { motion, AnimatePresence } from 'motion/react'
import {
  Home, CheckSquare, History, Trophy, GraduationCap, MessageSquare,
  Bell, User, Settings, Users, Target, Grid, LayoutDashboard, Database, Search, Mail,
  LogOut, Menu, X
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!profile || !role) return null

  const navItems = navConfig[role] || []

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="h-screen bg-[#E8ECEF] text-[#1A1D20] font-sans flex flex-col overflow-hidden">

      {/* Top Header */}
      <header className="h-[72px] md:h-[88px] w-full px-4 md:px-8 flex items-center justify-between z-40 bg-transparent shrink-0">

        {/* Left: Logo */}
        <div className="flex items-center gap-3 w-auto md:w-[260px]">
          <div className="w-10 h-10 rounded-xl bg-[#1A1D20] flex items-center justify-center">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <span className="font-extrabold text-xl md:text-2xl tracking-tighter hidden sm:block text-[#1A1D20]">
            MX Gestão
          </span>
        </div>

        {/* Center: Top Navigation (Desktop) */}
        <nav className="hidden lg:flex items-center gap-2 xl:gap-6 flex-1 justify-center px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `text-[15px] font-bold transition-all duration-300 px-6 py-2.5 rounded-full ${isActive
                  ? 'bg-white text-[#1A1D20] shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100'
                  : 'text-gray-500 hover:text-[#1A1D20] hover:bg-white/50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4 w-auto lg:w-[260px] justify-end">
          <button className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 bg-white rounded-full items-center justify-center text-gray-500 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <Search size={20} strokeWidth={2.5} />
          </button>
          <button className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 bg-white rounded-full items-center justify-center text-gray-500 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <Mail size={20} strokeWidth={2.5} />
          </button>
          <button className="relative w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center text-gray-500 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <Bell size={20} strokeWidth={2.5} />
            {unreadCount > 0 && <span className="absolute top-2 right-2 md:top-3 md:right-3 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />}
          </button>

          {/* Profile Dropdown Placeholder (just click to logout for now) */}
          <button onClick={handleSignOut} title="Sair" className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden shadow-sm hover:shadow-md hover:ring-2 ring-[#1A1D20]/10 transition-all relative bg-white flex items-center justify-center p-1 cursor-pointer border border-gray-100">
            <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-extrabold uppercase overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="User" className="w-full h-full object-cover" />
              ) : (
                profile.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      {/* Mobile adds padding-bottom for bottom bar */}
      <div className="flex flex-1 overflow-hidden px-4 md:pl-4 md:pr-8 pb-20 md:pb-8 gap-4 md:gap-8 relative">

        {/* Left Floating Sidebar (Desktop) */}
        <aside className="hidden md:flex w-[72px] bg-white/60 backdrop-blur-md border border-white rounded-[2.5rem] flex-col items-center py-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] h-full overflow-y-auto no-scrollbar relative z-20 shrink-0">
          <div className="flex flex-col gap-3 items-center w-full">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative group ${isActive
                    ? 'bg-[#1A1D20] text-white shadow-lg'
                    : 'text-gray-400 hover:bg-white hover:text-[#1A1D20] hover:shadow-sm border border-transparent hover:border-gray-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={isActive ? 'scale-110 transition-transform' : 'scale-100 transition-transform group-hover:scale-110'}>
                      {item.icon}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute left-[calc(100%+8px)] px-3 py-1.5 bg-[#1A1D20] text-white text-[11px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap shadow-xl">
                      {item.label}
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-4 items-center w-full pt-8">
            <button
              onClick={handleSignOut}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-500 transition-all group relative border border-transparent hover:border-red-100"
            >
              <LogOut size={22} className="group-hover:scale-110 transition-transform" />
              <div className="absolute left-[calc(100%+8px)] px-3 py-1.5 bg-red-500 text-white text-[11px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap shadow-xl">
                Sair do sistema
              </div>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        {/* Note: the Outlet renders pages which should use h-full and overflow-y-auto no-scrollbar natively */}
        <main className="flex-1 h-full rounded-3xl md:rounded-[2.5rem] relative z-10 animate-fade-in no-scrollbar flex flex-col overflow-hidden shadow-sm">
          <Outlet />
        </main>

      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 h-[72px] bg-white/90 backdrop-blur-xl border border-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-3xl z-50 flex items-center justify-around px-2">
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-2xl transition-all ${isActive ? 'text-[#1A1D20]' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#F8FAFC]' : ''}`}>
                  {item.icon}
                </div>
                <span className={`text-[9px] uppercase tracking-wider font-extrabold ${isActive ? 'text-[#1A1D20]' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

    </div>
  )
}
