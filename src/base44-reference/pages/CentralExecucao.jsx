import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Target } from "lucide-react";
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
      base44.auth.me().catch(() => null),
      base44.entities.UserProfile.list().catch(() => []),
      base44.entities.DailyClose.filter({ date: today }).catch(() => []),
      base44.entities.PDI.list().catch(() => []),
    ]).then(async ([me, profiles, closes, pdis]) => {
      setProfile(profiles[0] || null);
      setDailyClose(closes[0] || null);
      setPdi(pdis[0] || null);
      if (me) {
        // Base única: consulta CarteiraCliente com agendamento para hoje
        const carteira = await base44.entities.CarteiraCliente.filter({ vendedor_id: me.id, ativo: true }).catch(() => []);
        // Normaliza para o formato que AbaHoje espera
        const normalized = carteira.map(c => ({
          id: c.id,
          name: c.nome,
          phone: c.whatsapp || c.telefone,
          vehicle_sought: c.veiculo_interesse,
          birth_date: c.data_nascimento,
          appointment_datetime: c.visita_agendada_em,
          channel: c.canal_comercial || "Carteira",
          sale_status: c.status_comercial === "Vendido" ? "Sim" : c.status_comercial === "Perdido" ? "Não" : "Em Negociação",
          situacao_atual: c.situacao_atual,
          _carteiraObj: c,
        }));
        setClients(normalized);
        const perdas = normalized.filter(c =>
          c.sale_status === "Não" && (c._carteiraObj?.updated_date || c._carteiraObj?.created_date || "") >= trintaDiasAtras
        );
        setPerdasRecentes(perdas);
      }
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
  // (clients já normalizados da CarteiraCliente)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#005BFF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Topbar */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 h-[64px] flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#005BFF] to-blue-400 flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-[20px] font-black text-[#0F172A] tracking-tight leading-none">Rotina do Dia</h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Organize e execute seu dia com foco</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[13px] font-bold text-[#0F172A] capitalize">{moment().format("dddd")}</p>
          <p className="text-[12px] text-slate-400">{moment().format("DD [de] MMMM [de] YYYY")}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 sticky top-[64px] z-20">
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
      <div className="p-5 lg:p-6">
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