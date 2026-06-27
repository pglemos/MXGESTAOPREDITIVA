import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import MxPageHeader from "@/components/ui/MxPageHeader";
import StatCard from "@/components/ui/StatCard";
import { Target, DollarSign, Gauge, ArrowRight, Lightbulb, Globe, Users, DoorOpen, CalendarDays } from "lucide-react";
import moment from "moment";

export default function FunilVendas() {
  const [profile, setProfile] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.UserProfile.list().catch(() => []),
      base44.entities.Client.list('-created_date', 50).catch(() => []),
    ]).then(([profiles, cls]) => {
      setProfile(profiles[0] || null);
      setClients(cls);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-slate-200 border-t-mx-blue rounded-full animate-spin" /></div>;
  }

  const goal = profile?.monthly_goal || 10;
  const commission = profile?.commission_per_unit || 500;
  const monthSales = clients.filter(c => c.sale_completed && moment(c.created_date).isSame(moment(), 'month')).length;
  const remaining = Math.max(0, goal - monthSales);
  const projectedCommission = monthSales * commission;
  const goalCommission = goal * commission;
  const remainingCommission = Math.max(0, goalCommission - projectedCommission);

  const daysInMonth = moment().daysInMonth();
  const currentDay = moment().date();
  const daysLeft = daysInMonth - currentDay;
  const salesDays = monthSales > 0 ? Math.round(currentDay / monthSales) : 0;
  const rhythmText = monthSales > 0 
    ? `Você vende 1 carro a cada ${salesDays} dias.`
    : "Registre suas vendas para ver seu ritmo.";

  // Channel breakdowns
  const internetClients = clients.filter(c => c.channel === "Internet");
  const carteiraClients = clients.filter(c => c.channel === "Carteira");
  const portaClients = clients.filter(c => c.channel === "Porta");

  const internetSales = internetClients.filter(c => c.sale_completed).length;
  const carteiraSales = carteiraClients.filter(c => c.sale_completed).length;
  const portaSales = portaClients.filter(c => c.sale_completed).length;

  const bestChannel = [
    { name: "Internet", sales: internetSales },
    { name: "Carteira", sales: carteiraSales },
    { name: "Porta", sales: portaSales },
  ].sort((a, b) => b.sales - a.sales)[0];

  const leadsPerDay = daysLeft > 0 ? Math.ceil((remaining * 3) / daysLeft) : 0;
  const agendPerDay = daysLeft > 0 ? Math.ceil((remaining * 2) / daysLeft) : 0;
  const atendPerDay = daysLeft > 0 ? Math.ceil((remaining * 1.5) / daysLeft) : 0;

  const FunnelStep = ({ label, value, isLast }) => (
    <div className="flex items-center gap-2">
      <div className="bg-mx-blue-light text-mx-blue text-xs font-semibold px-3 py-1.5 rounded-lg text-center min-w-[100px]">
        {label}
        <span className="block text-lg font-bold mt-0.5">{value}</span>
      </div>
      {!isLast && <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />}
    </div>
  );

  const insights = [
    remaining > 0 && `Você precisa gerar ${leadsPerDay} leads por dia para bater a meta.`,
    bestChannel && bestChannel.sales > 0 && `Seu melhor canal é ${bestChannel.name} com ${bestChannel.sales} vendas.`,
    carteiraClients.filter(c => c.stage === "Agendamento" || c.stage === "Lead").length > 3 && "Sua carteira possui muitos clientes sem agendamento.",
    remaining <= 2 && remaining > 0 && "Você está muito perto da meta! Foque nos clientes em negociação.",
    remaining === 0 && "Parabéns! Você bateu sua meta! Continue vendendo!",
  ].filter(Boolean);

  return (
    <div className="w-full min-h-full bg-surface-alt px-mx-sm pb-mx-sm pt-0 sm:px-mx-md sm:pb-mx-md 2xl:px-mx-lg 2xl:pb-mx-lg">
      <MxPageHeader
        className="-mx-mx-sm sm:-mx-mx-md 2xl:-mx-mx-lg sticky top-0 z-30"
        title="Funil de Vendas"
        subtitle="O que você precisa fazer para atingir sua meta"
        chip={
          <>
            <CalendarDays size={14} className="text-[#2563eb]" />
            <span>{daysLeft} dias restantes no mês</span>
          </>
        }
      />
      <div className="max-w-[1280px] mx-auto py-6 space-y-6 lg:space-y-8">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-mx-blue-light flex items-center justify-center">
              <Target className="w-5 h-5 text-mx-blue" />
</div>
</div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Minha Meta</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-sm text-slate-500">Meta</span><span className="text-sm font-bold text-mx-navy">{goal}</span></div>
            <div className="flex justify-between"><span className="text-sm text-slate-500">Realizado</span><span className="text-sm font-bold text-mx-green">{monthSales}</span></div>
            <div className="flex justify-between"><span className="text-sm text-slate-500">Faltam</span><span className="text-sm font-bold text-mx-red">{remaining}</span></div>
            <div className="w-full bg-slate-100 rounded-full h-3 mt-2">
              <div className="bg-gradient-to-r from-mx-blue to-blue-400 h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (monthSales / goal) * 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-mx-green-light flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-mx-green" />
            </div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Minha Comissão</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-sm text-slate-500">Projetada</span><span className="text-sm font-bold text-mx-navy">R$ {projectedCommission.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-sm text-slate-500">Meta</span><span className="text-sm font-bold text-mx-navy">R$ {goalCommission.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-sm text-slate-500">Faltam</span><span className="text-sm font-bold text-mx-amber">R$ {remainingCommission.toLocaleString()}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-mx-amber-light flex items-center justify-center">
              <Gauge className="w-5 h-5 text-mx-amber" />
            </div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Ritmo Atual</h3>
          </div>
          <p className="text-lg font-bold text-mx-navy mt-2">{rhythmText}</p>
          <p className="text-xs text-slate-400 mt-2">{daysLeft} dias restantes no mês</p>
        </div>
      </div>

      {/* What you need to do */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-mx-navy mb-6">O Que Você Precisa Fazer Para Bater Sua Meta</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Internet */}
          <div className="border border-slate-100 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-mx-blue" />
              <h3 className="text-sm font-semibold text-mx-navy">Canal Internet</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <FunnelStep label="Leads" value={leadsPerDay * daysLeft} />
              <FunnelStep label="Agend." value={Math.ceil(leadsPerDay * daysLeft * 0.5)} />
              <FunnelStep label="Visita" value={Math.ceil(leadsPerDay * daysLeft * 0.3)} />
              <FunnelStep label="Venda" value={remaining} isLast />
            </div>
            <p className="text-xs text-slate-500">Faltam aproximadamente <strong>{leadsPerDay * daysLeft}</strong> leads para converter.</p>
          </div>

          {/* Carteira */}
          <div className="border border-slate-100 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-mx-green" />
              <h3 className="text-sm font-semibold text-mx-navy">Canal Carteira</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <FunnelStep label="Agend." value={agendPerDay * daysLeft} />
              <FunnelStep label="Visita" value={Math.ceil(agendPerDay * daysLeft * 0.6)} />
              <FunnelStep label="Venda" value={remaining} isLast />
            </div>
            <p className="text-xs text-slate-500">Faltam aproximadamente <strong>{agendPerDay * daysLeft}</strong> agendamentos.</p>
          </div>

          {/* Porta */}
          <div className="border border-slate-100 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <DoorOpen className="w-5 h-5 text-mx-amber" />
              <h3 className="text-sm font-semibold text-mx-navy">Canal Porta</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <FunnelStep label="Atend." value={atendPerDay * daysLeft} />
              <FunnelStep label="Venda" value={remaining} isLast />
            </div>
            <p className="text-xs text-slate-500">Faltam aproximadamente <strong>{atendPerDay * daysLeft}</strong> atendimentos.</p>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-mx-navy to-mx-blue rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-300" />
          <h3 className="text-base font-semibold">Assistente Comercial</h3>
        </div>
        <div className="space-y-3">
          {insights.length > 0 ? insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">{idx + 1}</span>
              </div>
              <p className="text-sm text-blue-100">{insight}</p>
            </div>
          )) : (
            <p className="text-sm text-blue-200">Cadastre clientes e registre vendas para receber insights personalizados.</p>
          )}
        </div>
      </div>
    </div>
  );
}
