import React from "react";

export default function ProjecaoMes({ indicadores, filtro }) {
  const { meta, realizado, diasRestantes } = indicadores;

  const diasPassados = indicadores.diasPassados ?? 0;
  const mediaDia = diasPassados > 0 ? realizado / diasPassados : 0;
  const projetadas = realizado + mediaDia * (diasRestantes || 0);
  const prevArred = Math.round(projetadas);

  const semBase = diasPassados === 0 && realizado === 0;

  let status, statusCor, diff;
  if (semBase) {
    status = "Sem base suficiente";
    statusCor = "text-slate-400";
    diff = null;
  } else if (!meta) {
    status = "Meta não configurada";
    statusCor = "text-slate-400";
    diff = null;
  } else {
    diff = prevArred - meta;
    if (prevArred >= meta) {
      status = prevArred > meta * 1.05 ? "Acima do ritmo da meta" : "No limite da meta";
      statusCor = "text-green-600";
    } else {
      status = "Abaixo do ritmo necessário";
      statusCor = "text-red-500";
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Projeção do mês</p>
      <div className="flex flex-wrap gap-6 items-end">
        <div>
          <p className="text-[11px] text-slate-400 mb-0.5">Previsão no ritmo atual</p>
          <p className="text-[32px] font-black text-[#0F172A] tabular-nums leading-none">
            {semBase ? "—" : prevArred}
          </p>
          {!semBase && <p className="text-[12px] text-slate-400 mt-0.5">vendas</p>}
        </div>
        {meta && (
          <>
            <div className="h-10 w-px bg-slate-100 hidden sm:block" />
            <div>
              <p className="text-[11px] text-slate-400 mb-0.5">Meta</p>
              <p className="text-[32px] font-black text-slate-300 tabular-nums leading-none">{meta}</p>
              <p className="text-[12px] text-slate-400 mt-0.5">vendas</p>
            </div>
            {diff !== null && (
              <>
                <div className="h-10 w-px bg-slate-100 hidden sm:block" />
                <div>
                  <p className="text-[11px] text-slate-400 mb-0.5">Diferença</p>
                  <p className={`text-[32px] font-black tabular-nums leading-none ${diff >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {diff >= 0 ? `+${diff}` : diff}
                  </p>
                  <p className="text-[12px] text-slate-400 mt-0.5">vendas</p>
                </div>
              </>
            )}
          </>
        )}
        <div className="sm:ml-auto self-center">
          <span className={`text-[13px] font-bold ${statusCor}`}>{status}</span>
        </div>
      </div>
    </div>
  );
}