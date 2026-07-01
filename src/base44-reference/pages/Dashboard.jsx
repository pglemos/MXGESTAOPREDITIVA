import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { 
  CalendarCheck, Target, Users, TrendingUp, Trophy, 
  ArrowRight, BarChart3, Clock, Zap, CheckCircle2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import moment from "moment";

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dailyCloses, setDailyCloses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.UserProfile.list().catch(() => []),
      base44.entities.Client.list('-created_date', 50).catch(() => []),
      base44.entities.Appointment.filter({ date: moment().format("YYYY-MM-DD") }).catch(() => []),
      base44.entities.DailyClose.list('-date', 30).catch(() => []),
    ]).then(([profiles, cls, apts, dcs]) => {
      setProfile(profiles[0] || null);
      setClients(cls);
      setAppointments(apts);
      setDailyCloses(dcs);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-mx-blue rounded-full animate-spin" />
      </div>
    );
  }

  const todaySales = clients.filter(c => c.sale_completed && moment(c.created_date).isSame(moment(), 'day')).length;
  const monthSales = clients.filter(c => c.sale_completed && moment(c.created_date).isSame(moment(), 'month')).length;
  const goal = profile?.monthly_goal || 10;
  const todayAppointments = appointments.length;
  const activeClients = clients.filter(c => c.status === "Em Andamento").length;
  const progressPct = Math.min(Math.round((monthSales / goal) * 100), 100);

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const day = moment().subtract(6 - i, 'days');
    const dc = dailyCloses.find(d => d.date === day.format("YYYY-MM-DD"));
    return {
      name: day.format("ddd"),
      leads: dc ? (dc.leads_carteira + dc.leads_internet) : 0,
      atendimentos: dc ? (dc.atendimentos_showroom + dc.atendimentos_carteira + dc.atendimentos_internet) : 0,
    };
  });

  const userName = profile?.full_name?.split(" ")[0] || "Vendedor";

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-mx-navy to-mx-blue rounded-2xl p-6 lg:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Olá, {userName}! 👋</h1>
            <p className="text-blue-200 mt-2 text-sm lg:text-base">
              Você tem {todayAppointments} agendamento{todayAppointments !== 1 ? "s" : ""} hoje e {activeClients} cliente{activeClients !== 1 ? "s" : ""} em andamento.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/15 rounded-2xl px-5 py-3 backdrop-blur-sm">
              <p className="text-xs text-blue-200">Meta do mês</p>
              <p className="text-2xl font-bold">{monthSales}/{goal}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Vendas do Mês" value={monthSales} sublabel={`Meta: ${goal}`} icon={Trophy} color="green">
          <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
            <div className="bg-mx-green h-2 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </StatCard>
        <StatCard label="Agendamentos Hoje" value={todayAppointments} icon={CalendarCheck} color="blue" />
        <StatCard label="Clientes Ativos" value={activeClients} icon={Users} color="amber" />
        <StatCard label="Vendas Hoje" value={todaySales} icon={Zap} color="green" />
      </div>

      {/* Charts + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-base font-semibold text-mx-navy mb-4">Atividade da Semana</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="leads" fill="#005BFF" radius={[6, 6, 0, 0]} name="Leads" />
              <Bar dataKey="atendimentos" fill="#22C55E" radius={[6, 6, 0, 0]} name="Atendimentos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-base font-semibold text-mx-navy mb-4">Ações Rápidas</h3>
          <div className="space-y-3">
            {[
              { label: "Fechamento Diário", path: "/fechamento", icon: CalendarCheck, color: "text-mx-blue" },
              { label: "Central de Execução", path: "/execucao", icon: Target, color: "text-mx-green" },
              { label: "Funil de Vendas", path: "/funil", icon: BarChart3, color: "text-mx-amber" },
              { label: "Carteira de Clientes", path: "/carteira", icon: Users, color: "text-purple-500" },
              { label: "Meu Perfil", path: "/perfil", icon: TrendingUp, color: "text-mx-navy" },
            ].map(item => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-sm font-medium text-slate-700 flex-1">{item.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-mx-blue transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}