import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, CalendarCheck, Target, Filter, Users, 
  GraduationCap, MessageSquare, TrendingUp, Trophy, UserCircle,
  ChevronLeft, ChevronRight, Zap
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Fechamento Diário", icon: CalendarCheck, path: "/fechamento" },
  { label: "Central de Execução", icon: Target, path: "/execucao" },
  { label: "Carteira de Clientes", icon: Users, path: "/carteira" },
  { label: "Funil de Vendas", icon: Filter, path: "/funil" },
  { label: "Treinamentos", icon: GraduationCap, path: "/treinamentos" },
  { label: "Feedback", icon: MessageSquare, path: "/feedback" },
  { label: "PDI", icon: TrendingUp, path: "/pdi" },
  { label: "Ranking", icon: Trophy, path: "/ranking" },
  { label: "Meu Perfil", icon: UserCircle, path: "/perfil" },
];

export default function Sidebar() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(true);
  const [feedbackCount, setFeedbackCount] = useState(0);

  useEffect(() => {
    base44.entities.Feedback.filter({ acknowledged: false })
      .then(items => setFeedbackCount(items.length))
      .catch(() => {});
  }, [location.pathname]);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-mx-navy z-50 flex flex-col transition-all duration-300 ease-in-out ${
        expanded ? "w-[260px]" : "w-[72px]"
      }`}
    >
      <div className="flex items-center h-[72px] px-4 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00A89D] to-[#00A89D] flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {expanded && (
            <div className="overflow-hidden">
              <h1 className="text-white font-bold text-lg leading-tight tracking-tight">MX</h1>
              <p className="text-[#E0EBEA] text-[11px] font-medium tracking-wider uppercase">Performance</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/" && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          const showBadge = item.label === "Feedback" && feedbackCount > 0;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? "bg-mx-blue text-white shadow-lg shadow-mx-blue/25"
                  : "text-[#526B7A] hover:text-white hover:bg-white/8"
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-[#526B7A] group-hover:text-white"}`} />
              {expanded && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
              {showBadge && (
                <span className={`${expanded ? "ml-auto" : "absolute -top-1 -right-1"} bg-mx-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center`}>
                  {feedbackCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[#526B7A] hover:text-white hover:bg-white/8 transition-all duration-200"
        >
          {expanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {expanded && <span className="text-xs font-medium">Recolher</span>}
        </button>
      </div>
    </aside>
  );
}