import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import MxPageHeader from "@/components/ui/MxPageHeader";
import {
  ArrowRight,
  CalendarDays,
  DollarSign,
  DoorOpen,
  Gauge,
  Globe,
  Lightbulb,
  Target,
  Users,
} from "lucide-react";
import moment from "moment";

export default function FunilVendas() {
  const [profile, setProfile] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.UserProfile.list().catch(() => []),
      base44.entities.Client.list("-created_date", 50).catch(() => []),
    ]).then(([profiles, cls]) => {
      setProfile(profiles[0] || null);
      setClients(cls);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#DFE0E1] border-t-mx-blue" />
      </div>
    );
  }

  const goal = profile?.monthly_goal || 10;
  const commission = profile?.commission_per_unit || 500;
  const monthSales = clients.filter(
    (client) => client.sale_completed && moment(client.created_date).isSame(moment(), "month"),
  ).length;
  const remaining = Math.max(0, goal - monthSales);
  const projectedCommission = monthSales * commission;
  const goalCommission = goal * commission;
  const remainingCommission = Math.max(0, goalCommission - projectedCommission);

  const daysInMonth = moment().daysInMonth();
  const currentDay = moment().date();
  const daysLeft = daysInMonth - currentDay;
  const salesDays = monthSales > 0 ? Math.round(currentDay / monthSales) : 0;
  const rhythmText =
    monthSales > 0 ? `Você vende 1 carro a cada ${salesDays} dias.` : "Registre suas vendas para ver seu ritmo.";

  const internetClients = clients.filter((client) => client.channel === "Internet");
  const carteiraClients = clients.filter((client) => client.channel === "Carteira");
  const portaClients = clients.filter((client) => client.channel === "Porta");

  const internetSales = internetClients.filter((client) => client.sale_completed).length;
  const carteiraSales = carteiraClients.filter((client) => client.sale_completed).length;
  const portaSales = portaClients.filter((client) => client.sale_completed).length;

  const bestChannel = [
    { name: "Internet", sales: internetSales },
    { name: "Carteira", sales: carteiraSales },
    { name: "Porta", sales: portaSales },
  ].sort((a, b) => b.sales - a.sales)[0];

  const leadsPerDay = daysLeft > 0 ? Math.ceil((remaining * 3) / daysLeft) : 0;
  const agendPerDay = daysLeft > 0 ? Math.ceil((remaining * 2) / daysLeft) : 0;
  const atendPerDay = daysLeft > 0 ? Math.ceil((remaining * 1.5) / daysLeft) : 0;

  const insights = [
    remaining > 0 && `Você precisa gerar ${leadsPerDay} leads por dia para bater meta.`,
    bestChannel && bestChannel.sales > 0 && `Seu melhor canal é ${bestChannel.name} com ${bestChannel.sales} vendas.`,
    carteiraClients.filter((client) => client.stage === "Agendamento" || client.stage === "Lead").length > 3 &&
      "Sua carteira possui muitos clientes sem agendamento.",
    remaining <= 2 && remaining > 0 && "Você está muito perto da meta! Foque nos clientes em negociação.",
    remaining === 0 && "Parabéns! Você bateu sua meta! Continue vendendo!",
  ].filter(Boolean);

  const FunnelStep = ({ label, value, isLast }) => (
    <div className="flex items-center gap-2">
      <div className="min-w-[100px] rounded-lg bg-mx-blue-light px-3 py-1.5 text-center text-xs font-semibold text-mx-blue">
        {label}
        <span className="mt-0.5 block text-lg font-bold">{value}</span>
      </div>
      {!isLast && <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#E0EBEA]" />}
    </div>
  );

  return (
    <div className="min-h-full w-full bg-surface-alt px-mx-sm pb-mx-sm pt-0 sm:px-mx-md sm:pb-mx-md 2xl:px-mx-lg 2xl:pb-mx-lg">
      <MxPageHeader
        className="sticky top-0 z-30 -mx-mx-sm sm:-mx-mx-md 2xl:-mx-mx-lg"
        title="Funil de Vendas"
        chip={
          <>
            <CalendarDays size={14} className="text-[#00A89D]" />
            <span>{daysLeft} dias restantes no mês</span>
          </>
        }
      />

      <div className="space-y-6 py-6 lg:space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-[#DFE0E1] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mx-blue-light">
                <Target className="h-5 w-5 text-mx-blue" />
              </div>
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#526B7A]">Minha Meta</h3>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[#526B7A]">Meta</span>
                <span className="text-sm font-bold text-mx-navy">{goal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#526B7A]">Realizado</span>
                <span className="text-sm font-bold text-mx-green">{monthSales}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#526B7A]">Faltam</span>
                <span className="text-sm font-bold text-mx-red">{remaining}</span>
              </div>
              <div className="mt-2 h-3 w-full rounded-full bg-[#DFE0E1]">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-[#00A89D] to-[#00A89D] transition-all duration-500"
                  style={{ width: `${Math.min(100, (monthSales / goal) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#DFE0E1] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mx-green-light">
                <DollarSign className="h-5 w-5 text-mx-green" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#526B7A]">Minha Comissão</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[#526B7A]">Projetada</span>
                <span className="text-sm font-bold text-mx-navy">R$ {projectedCommission.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#526B7A]">Meta</span>
                <span className="text-sm font-bold text-mx-navy">R$ {goalCommission.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#526B7A]">Faltam</span>
                <span className="text-sm font-bold text-mx-amber">R$ {remainingCommission.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#DFE0E1] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mx-amber-light">
                <Gauge className="h-5 w-5 text-mx-amber" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#526B7A]">Ritmo Atual</h3>
            </div>
            <p className="mt-2 text-lg font-bold text-mx-navy">{rhythmText}</p>
            <p className="mt-2 text-xs text-[#526B7A]">{daysLeft} dias restantes no mês</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#DFE0E1] bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-bold text-mx-navy">O Que Você Precisa Fazer Para Bater Sua Meta</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-[#DFE0E1] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-mx-blue" />
                <h3 className="text-sm font-semibold text-mx-navy">Canal Internet</h3>
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <FunnelStep label="Leads" value={leadsPerDay * daysLeft} />
                <FunnelStep label="Agend." value={Math.ceil(leadsPerDay * daysLeft * 0.5)} />
                <FunnelStep label="Visita" value={Math.ceil(leadsPerDay * daysLeft * 0.3)} />
                <FunnelStep label="Venda" value={remaining} isLast />
              </div>
              <p className="text-xs text-[#526B7A]">
                Faltam aproximadamente <strong>{leadsPerDay * daysLeft}</strong> leads para converter.
              </p>
            </div>

            <div className="rounded-xl border border-[#DFE0E1] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-mx-green" />
                <h3 className="text-sm font-semibold text-mx-navy">Canal Carteira</h3>
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <FunnelStep label="Agend." value={agendPerDay * daysLeft} />
                <FunnelStep label="Visita" value={Math.ceil(agendPerDay * daysLeft * 0.6)} />
                <FunnelStep label="Venda" value={remaining} isLast />
              </div>
              <p className="text-xs text-[#526B7A]">
                Faltam aproximadamente <strong>{agendPerDay * daysLeft}</strong> agendamentos.
              </p>
            </div>

            <div className="rounded-xl border border-[#DFE0E1] p-5">
              <div className="mb-4 flex items-center gap-2">
                <DoorOpen className="h-5 w-5 text-mx-amber" />
                <h3 className="text-sm font-semibold text-mx-navy">Canal Porta</h3>
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <FunnelStep label="Atend." value={atendPerDay * daysLeft} />
                <FunnelStep label="Venda" value={remaining} isLast />
              </div>
              <p className="text-xs text-[#526B7A]">
                Faltam aproximadamente <strong>{atendPerDay * daysLeft}</strong> atendimentos.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-mx-navy to-mx-blue p-6 text-white">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-300" />
            <h3 className="text-base font-semibold">Assistente Comercial</h3>
          </div>
          <div className="space-y-3">
            {insights.length > 0 ? (
              insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                    <span className="text-xs font-bold">{index + 1}</span>
                  </div>
                  <p className="text-sm text-[#E0EBEA]">{insight}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#E0EBEA]">
                Cadastre clientes e registre vendas para receber insights personalizados.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
