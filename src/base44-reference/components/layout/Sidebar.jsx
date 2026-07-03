import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, CalendarCheck, Target, Filter, Users, 
  GraduationCap, MessageSquare, TrendingUp, Trophy, UserCircle,
  ChevronLeft, ChevronRight, Zap, DollarSign, ChevronDown, Building2, BookOpen
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const menuItems = [
  { label: "Início", icon: LayoutDashboard, path: "/" },
  { label: "Fechamento Diário", icon: CalendarCheck, path: "/fechamento" },
  { label: "Rotina do Dia", icon: Target, path: "/execucao" },
  { label: "Mentor Comercial", icon: Users, path: "/carteira" },
  { label: "Minha Meta", icon: Filter, path: "/funil" },
  { label: "Ranking", icon: Trophy, path: "/vendedor/ranking" },
  { label: "Universidade MX", icon: GraduationCap, path: "/treinamentos" },
  { label: "Desenvolvimento", icon: BookOpen, path: "/desenvolvimento" },
  { label: "Ranking", icon: Trophy, path: "/ranking" },
  { label: "Meu Perfil", icon: UserCircle, path: "/perfil" },
];

const ADMIN_ROLES = ["admin", "dono", "administrador", "rh", "gestor", "gerente"];

export default function Sidebar() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(true);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [rotinaCount, setRotinaCount] = useState(0);
  const [userRole, setUserRole] = useState("");
  const [deptOpen, setDeptOpen] = useState(false);

  useEffect(() => {
    base44.entities.Feedback.filter({ acknowledged: false })
      .then(items => setFeedbackCount(items.length))
      .catch(() => {});
    base44.auth.me().then(async u => {
      setUserRole((u?.role || "").toLowerCase());
      if (u) {
        const atividades = await base44.entities.AtividadeExecucao.filter({ vendedor_id: u.id, status_atividade: "Pendente", ativo: true }).catch(() => []);
        setRotinaCount(atividades.length);
      }
    }).catch(() => {});
  }, [location.pathname]);

  const isAdmin = ADMIN_ROLES.includes(userRole);
  const isDeptActive = location.pathname.startsWith("/departamento");


  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-mx-navy z-50 flex flex-col transition-all duration-300 ease-in-out ${
        expanded ? "w-[260px]" : "w-[72px]"
      }`}
    >
      <div className="flex items-center h-[72px] px-4 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mx-blue to-blue-400 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {expanded && (
            <div className="overflow-hidden">
              <h1 className="text-white font-bold text-lg leading-tight tracking-tight">MX</h1>
              <p className="text-blue-300 text-[11px] font-medium tracking-wider uppercase">Performance</p>
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
          const showRotinaBadge = item.label === "Rotina do Dia" && rotinaCount > 0;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? "bg-mx-blue text-white shadow-lg shadow-mx-blue/25"
                  : "text-slate-400 hover:text-white hover:bg-white/8"
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
              {expanded && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
              {showBadge && (
                <span className={`${expanded ? "ml-auto" : "absolute -top-1 -right-1"} bg-mx-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center`}>
                  {feedbackCount}
                </span>
              )}
              {showRotinaBadge && (
                <span className={`${expanded ? "ml-auto" : "absolute -top-1 -right-1"} bg-mx-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center`}>
                  {rotinaCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Departamento — admin only */}
      {isAdmin && (
        <div className="px-3 pb-2">
          <div className="border-t border-white/10 pt-3 mt-1">
            <button
              onClick={() => setDeptOpen(v => !v)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isDeptActive ? "bg-mx-blue text-white shadow-lg shadow-mx-blue/25" : "text-slate-400 hover:text-white hover:bg-white/8"
              }`}
            >
              <Building2 className={`w-5 h-5 flex-shrink-0 ${isDeptActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
              {expanded && (
                <>
                  <span className="text-sm font-medium flex-1 text-left">Departamento</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${deptOpen ? "rotate-180" : ""}`} />
                </>
              )}
            </button>
            {(deptOpen || isDeptActive) && expanded && (
              <div className="ml-4 mt-1 pl-3 border-l border-white/10 space-y-1">
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-1">RH</p>
                  <Link
                    to="/departamento/rh/remuneracao"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 text-[13px] ${
                      location.pathname === "/departamento/rh/remuneracao"
                        ? "bg-white/15 text-white font-semibold"
                        : "text-slate-400 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    <DollarSign className="w-4 h-4 flex-shrink-0" />
                    <span>Remuneração</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all duration-200"
        >
          {expanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {expanded && <span className="text-xs font-medium">Recolher</span>}
        </button>
      </div>
    </aside>
  );
}