import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CalendarDays } from "lucide-react";
import MxPageHeader from "@/components/ui/MxPageHeader";
import AbaHoje from "@/components/execucao/AbaHoje";
import AbaRotina from "@/components/execucao/AbaRotina";
import moment from "moment/min/moment-with-locales";

moment.locale("pt-br");

const TABS = [
  { id: "hoje", label: "Hoje" },
  { id: "rotina", label: "Rotina do Dia" },
];

export default function CentralExecucao() {
  const [tab, setTab] = useState("hoje");
  const [clients, setClients] = useState([]);
  const [profile, setProfile] = useState(null);
  const [dailyClose, setDailyClose] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [pdi, setPdi] = useState(null);
  const [perdasRecentes, setPerdasRecentes] = useState([]);

  useEffect(() => {
    const today = moment().format("YYYY-MM-DD");
    const trintaDiasAtras = moment().subtract(30, "days").format("YYYY-MM-DD");
    Promise.all([
      base44.entities.Client.filter({}).catch(() => []),
      base44.entities.UserProfile.list().catch(() => []),
      base44.entities.DailyClose.filter({ date: today }).catch(() => []),
      base44.entities.PDI.list().catch(() => []),
      base44.entities.Client.filter({ sale_status: "Não" }).catch(() => []),
    ]).then(([cls, profiles, closes, pdis, perdas]) => {
      setClients(cls);
      setProfile(profiles[0] || null);
      setDailyClose(closes[0] || null);
      setPdi(pdis[0] || null);
      // Apenas perdas dos últimos 30 dias
      setPerdasRecentes(perdas.filter(p => (p.updated_date || p.created_date || "") >= trintaDiasAtras));
      setLoading(false);
    });
  }, []);

  // clients today with appointment for the rotina conflict check
  const hoje = moment().format("YYYY-MM-DD");
  const clientesHoje = clients.filter(c =>
    c.sale_status === "Em Negociação" &&
    c.appointment_datetime &&
    moment(c.appointment_datetime).format("YYYY-MM-DD") === hoje
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#005BFF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-surface-alt px-mx-sm pb-mx-sm pt-0 sm:px-mx-md sm:pb-mx-md 2xl:px-mx-lg 2xl:pb-mx-lg">
      {/* Topbar */}
      <MxPageHeader
        className="-mx-mx-sm sm:-mx-mx-md 2xl:-mx-mx-lg sticky top-0 z-30"
        title="Central de Execução"
        subtitle="Organize e execute seu dia com foco"
        chip={
          <>
            <CalendarDays size={14} className="text-[#2563eb]" />
            <span className="capitalize">{moment().format("dddd")}</span>
            <span className="text-[#94a3b8] font-bold">•</span>
            <span className="text-[#64748B]">{moment().format("DD [de] MMMM [de] YYYY")}</span>
          </>
        }
      />

      {/* Tabs */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-[60px] md:top-[80px] z-20 -mx-mx-sm sm:-mx-mx-md 2xl:-mx-mx-lg px-mx-sm sm:px-mx-md 2xl:px-mx-lg">
        <div className="flex gap-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3.5 text-[13px] font-bold transition-all border-b-2 ${
                tab === t.id
                  ? "text-[#005BFF] border-[#005BFF] bg-white"
                  : "text-slate-400 border-transparent hover:text-slate-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1280px] mx-auto py-6">
        {tab === "hoje" ? (
          <AbaHoje
            clients={clients}
            dailyClose={dailyClose}
            onClientsChange={setClients}
            isMobile={isMobile}
            profile={profile}
            onGoToRotina={() => setTab("rotina")}
          />
        ) : (
          <AbaRotina
            profile={profile}
            clients={clients}
            clientesHoje={clientesHoje}
            pdi={pdi}
            perdasRecentes={perdasRecentes}
          />
        )}
      </div>
    </div>
  );
}
