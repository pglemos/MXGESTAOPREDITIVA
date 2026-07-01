import React from "react";

function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : null; }

function FunilLinha({ label, valor, pctProx }) {
  return (
    <div>
      <div className="flex items-center justify-between py-1.5">
        <span className="text-[12px] text-slate-600">{label}</span>
        <span className="text-[14px] font-black tabular-nums text-[#0F172A]">{valor}</span>
      </div>
      {pctProx !== null && pctProx !== undefined && (
        <div className="pl-3 pb-0.5">
          <span className="text-[10px] font-semibold text-slate-400">→ {pctProx}%</span>
        </div>
      )}
    </div>
  );
}

function CanalCard({ titulo, subtitulo, cor, conversaoGeral, linhas }) {
  const COR = {
    orange: { header: "bg-orange-50 border-orange-200", badge: "bg-orange-100 text-orange-700" },
    blue:   { header: "bg-blue-50 border-blue-200",     badge: "bg-blue-100 text-blue-700"   },
    green:  { header: "bg-green-50 border-green-200",   badge: "bg-green-100 text-green-700" },
  };
  const c = COR[cor] || COR.blue;
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className={`px-4 py-2.5 border-b flex items-center justify-between ${c.header}`}>
        <div>
          <p className="text-[12px] font-black text-[#0F172A] uppercase tracking-wide">{titulo}</p>
          <p className="text-[10px] text-slate-500">{subtitulo}</p>
        </div>
        {conversaoGeral !== null ? (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{conversaoGeral}% conv.</span>
        ) : (
          <span className="text-[10px] text-slate-300">—</span>
        )}
      </div>
      <div className="px-4 py-2 divide-y divide-slate-50">
        {linhas.map((l, i) => (
          <FunilLinha key={i} label={l.label} valor={l.valor} pctProx={l.pctProx} />
        ))}
      </div>
    </div>
  );
}

// Detecta o maior gargalo (menor conversão entre etapas)
function calcLimitador(funis) {
  const gargalos = [];

  // Showroom
  const convShowVenda = funis.showroom.atendimento > 0 ? funis.showroom.venda / funis.showroom.atendimento : null;
  if (convShowVenda !== null) gargalos.push({ canal: "Showroom", etapa: "Atendimento Comercial → Venda", conv: convShowVenda });

  // Internet — encontra menor conversão
  const inetPares = [
    { etapa: "Oportunidades → Qualificados",          conv: funis.internet.oportunidades > 0 ? funis.internet.qualificados / funis.internet.oportunidades : null },
    { etapa: "Qualificados → Agendamento",            conv: funis.internet.qualificados > 0  ? funis.internet.agendamento / funis.internet.qualificados  : null },
    { etapa: "Agendamento → Atendimento Comercial",   conv: funis.internet.agendamento > 0   ? funis.internet.atendimento / funis.internet.agendamento   : null },
    { etapa: "Atendimento Comercial → Venda",         conv: funis.internet.atendimento > 0   ? funis.internet.venda / funis.internet.atendimento         : null },
  ].filter(p => p.conv !== null);
  const piorInet = inetPares.sort((a, b) => a.conv - b.conv)[0];
  if (piorInet) gargalos.push({ canal: "Internet", etapa: piorInet.etapa, conv: piorInet.conv });

  // Carteira — encontra menor conversão
  const cartPares = [
    { etapa: "Qualificados → Agendamento",            conv: funis.carteira.qualificados > 0  ? funis.carteira.agendamento / funis.carteira.qualificados  : null },
    { etapa: "Agendamento → Atendimento Comercial",   conv: funis.carteira.agendamento > 0   ? funis.carteira.atendimento / funis.carteira.agendamento   : null },
    { etapa: "Atendimento Comercial → Venda",         conv: funis.carteira.atendimento > 0   ? funis.carteira.venda / funis.carteira.atendimento         : null },
  ].filter(p => p.conv !== null);
  const piorCart = cartPares.sort((a, b) => a.conv - b.conv)[0];
  if (piorCart) gargalos.push({ canal: "Carteira", etapa: piorCart.etapa, conv: piorCart.conv });

  if (gargalos.length === 0) return null;

  // Melhor canal (maior conv geral)
  const melhorShow = funis.showroom.atendimento > 0 ? funis.showroom.venda / funis.showroom.atendimento : 0;
  const melhorInet = funis.internet.oportunidades > 0 ? funis.internet.venda / funis.internet.oportunidades : 0;
  const melhorCart = funis.carteira.qualificados > 0 ? funis.carteira.venda / funis.carteira.qualificados : 0;
  const melhorVal = Math.max(melhorShow, melhorInet, melhorCart);
  const melhorCanal = melhorVal === melhorShow ? "Showroom" : melhorVal === melhorInet ? "Internet" : "Carteira";
  const totalVendas = funis.showroom.venda + funis.internet.venda + funis.carteira.venda;
  if (totalVendas > 0 && melhorVal > 0.5) {
    return `${melhorCanal} é o canal com melhor conversão no período.`;
  }

  const pior = gargalos.sort((a, b) => a.conv - b.conv)[0];
  return `Seu maior limitador está em ${pior.canal}: ${pior.etapa} (${Math.round(pior.conv * 100)}%).`;
}

export default function EficienciaCanal({ funis }) {
  const limitador = calcLimitador(funis);

  const showLinhas = [
    { label: "Atendimento Comercial", valor: funis.showroom.atendimento },
    { label: "Venda",                 valor: funis.showroom.venda, pctProx: null },
  ];
  // adiciona pct entre linhas
  showLinhas[0].pctProx = pct(funis.showroom.venda, funis.showroom.atendimento);

  const inetLinhas = [
    { label: "Oportunidades",          valor: funis.internet.oportunidades, pctProx: pct(funis.internet.qualificados, funis.internet.oportunidades) },
    { label: "Qualificados",           valor: funis.internet.qualificados,  pctProx: pct(funis.internet.agendamento,  funis.internet.qualificados)  },
    { label: "Agendamentos",           valor: funis.internet.agendamento,   pctProx: pct(funis.internet.atendimento,  funis.internet.agendamento)   },
    { label: "Atendimento Comercial",  valor: funis.internet.atendimento,   pctProx: pct(funis.internet.venda,        funis.internet.atendimento)   },
    { label: "Venda",                  valor: funis.internet.venda },
  ];

  const cartLinhas = [
    { label: "Qualificados",           valor: funis.carteira.qualificados,  pctProx: pct(funis.carteira.agendamento,  funis.carteira.qualificados)  },
    { label: "Agendamentos",           valor: funis.carteira.agendamento,   pctProx: pct(funis.carteira.atendimento,  funis.carteira.agendamento)   },
    { label: "Atendimento Comercial",  valor: funis.carteira.atendimento,   pctProx: pct(funis.carteira.venda,        funis.carteira.atendimento)   },
    { label: "Venda",                  valor: funis.carteira.venda },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Eficiência por canal</p>
      {limitador && (
        <p className="text-[12px] text-slate-500 mb-4 italic">
          <span className="font-semibold text-slate-600">Principal limitador:</span> {limitador}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CanalCard
          titulo="Showroom"
          subtitulo="Atendimentos presenciais"
          cor="orange"
          conversaoGeral={pct(funis.showroom.venda, funis.showroom.atendimento)}
          linhas={showLinhas}
        />
        <CanalCard
          titulo="Internet"
          subtitulo="Oportunidades digitais"
          cor="blue"
          conversaoGeral={pct(funis.internet.venda, funis.internet.oportunidades)}
          linhas={inetLinhas}
        />
        <CanalCard
          titulo="Carteira"
          subtitulo="Relacionamento e prospecção"
          cor="green"
          conversaoGeral={pct(funis.carteira.venda, funis.carteira.qualificados)}
          linhas={cartLinhas}
        />
      </div>
    </div>
  );
}