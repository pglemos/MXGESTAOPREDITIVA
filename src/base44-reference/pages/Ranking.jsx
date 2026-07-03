import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy, Info } from "lucide-react";
import moment from "moment/min/moment-with-locales";
import PodioRanking from "@/components/ranking/PodioRanking";
import SuaPosicao from "@/components/ranking/SuaPosicao";
import CorridaPeriodo from "@/components/ranking/CorridaPeriodo";
import BonificacaoPeriodo from "@/components/ranking/BonificacaoPeriodo";
import TabelaRanking from "@/components/ranking/TabelaRanking";

moment.locale("pt-br");

const ABAS = ["Mensal", "Trimestral", "Semestral", "Anual"];

function getPeriodo(aba) {
  const hoje = moment();
  switch (aba) {
    case "Mensal":      return { inicio: hoje.clone().startOf("month").format("YYYY-MM-DD"), fim: hoje.clone().endOf("month").format("YYYY-MM-DD") };
    case "Trimestral":  return { inicio: hoje.clone().startOf("quarter").format("YYYY-MM-DD"), fim: hoje.clone().endOf("quarter").format("YYYY-MM-DD") };
    case "Semestral": {
      const s = hoje.month() < 6 ? 0 : 6;
      return { inicio: hoje.clone().month(s).startOf("month").format("YYYY-MM-DD"), fim: hoje.clone().month(s + 5).endOf("month").format("YYYY-MM-DD") };
    }
    case "Anual":       return { inicio: hoje.clone().startOf("year").format("YYYY-MM-DD"), fim: hoje.clone().endOf("year").format("YYYY-MM-DD") };
    default:            return { inicio: hoje.clone().startOf("month").format("YYYY-MM-DD"), fim: hoje.clone().endOf("month").format("YYYY-MM-DD") };
  }
}

// Agrega vendas de CarteiraCliente por vendedor dentro do período
function agregaVendas(clientes, inicio, fim) {
  const map = {};
  clientes.forEach(c => {
    const isVenda = c.vendido === true || c.status_comercial === "Vendido" || c.situacao_atual === "Venda realizada";
    if (!isVenda) return;
    const dateRef = c.data_venda || c._data_competencia_fechamento || c.updated_date || c.created_date;
    if (!dateRef || dateRef.slice(0, 10) < inicio || dateRef.slice(0, 10) > fim) return;
    const vid = c.vendedor_id || "sem_id";
    if (!map[vid]) map[vid] = { vendas: 0, faturamento: 0 };
    map[vid].vendas += 1;
    const val = parseFloat((c.valor_venda || c.valor_negociado || "0").replace(/[R$\s.]/g, "").replace(",", "."));
    map[vid].faturamento += isNaN(val) ? 0 : val;
  });
  return map;
}

export default function Ranking() {
  const [aba, setAba] = useState("Mensal");
  const [unidade, setUnidade] = useState("todas");
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [rankingConfig, setRankingConfig] = useState(null);
  const [bonificacoes, setBonificacoes] = useState([]);
  const [metas, setMetas] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.User.list().catch(() => []),
      base44.entities.CarteiraCliente.filter({ ativo: true }, "-created_date", 500).catch(() => []),
      base44.entities.RankingConfig.list().catch(() => []),
      base44.entities.BonificacaoRanking.list().catch(() => []),
      base44.entities.MetaVendedor.list().catch(() => []),
    ]).then(([usuario, users, clis, configs, bons, mets]) => {
      setMe(usuario);
      setUsuarios(users);
      setClientes(clis);
      setRankingConfig(configs.find(c => c.ativo !== false) || null);
      setBonificacoes(bons);
      setMetas(mets);
      setLoading(false);
    });
  }, []);

  const { inicio, fim } = getPeriodo(aba);
  const isVolume = !rankingConfig || rankingConfig.tipo_meta_ranking !== "Faturamento";
  const metaPadrao = isVolume ? (rankingConfig?.meta_padrao_volume || 60) : (rankingConfig?.meta_padrao_faturamento || 100000);

  const vendasMap = useMemo(() => agregaVendas(clientes, inicio, fim), [clientes, inicio, fim]);

  // Unidades únicas
  const unidades = useMemo(() => {
    const set = new Set(usuarios.map(u => u.dealership || u.unidade_nome || "").filter(Boolean));
    return [...set];
  }, [usuarios]);

  // Constrói vendedores rankeados
  const vendedores = useMemo(() => {
    return usuarios
      .filter(u => {
        if (unidade !== "todas" && (u.dealership || u.unidade_nome || "") !== unidade) return false;
        return true;
      })
      .map(u => {
        const v = vendasMap[u.id] || { vendas: 0, faturamento: 0 };
        const metaVend = metas.find(m => m.vendedor_id === u.id && m.periodo === aba);
        const metaIndiv = isVolume ? (metaVend?.meta_volume || metaPadrao) : (metaVend?.meta_faturamento || metaPadrao);
        return {
          id: u.id,
          nome: u.full_name || u.nome || u.email || "Vendedor",
          foto: u.avatar_url || u.foto || null,
          unidade: u.dealership || u.unidade_nome || "—",
          vendas: v.vendas,
          faturamento: v.faturamento,
          meta: metaIndiv,
        };
      })
      .sort((a, b) => {
        const va = isVolume ? a.vendas : a.faturamento;
        const vb = isVolume ? b.vendas : b.faturamento;
        if (vb !== va) return vb - va;
        // desempate
        if (!isVolume && b.vendas !== a.vendas) return b.vendas - a.vendas;
        return (a.nome || "").localeCompare(b.nome || "");
      });
  }, [usuarios, vendasMap, unidade, isVolume, metaPadrao, metas, aba]);

  const top3 = vendedores.slice(0, 3);
  const meuIndex = vendedores.findIndex(v => v.id === me?.id);
  const euVendedor = meuIndex >= 0 ? vendedores[meuIndex] : null;
  const posicao = meuIndex + 1;
  const atingimento = euVendedor ? Math.round((isVolume ? euVendedor.vendas : euVendedor.faturamento) / (euVendedor.meta || metaPadrao) * 100) : 0;

  // Faltam para próximo lugar
  let faltamValor = null;
  if (posicao > 1 && euVendedor) {
    const acima = vendedores[posicao - 2];
    faltamValor = isVolume
      ? Math.max(0, acima.vendas - euVendedor.vendas)
      : Math.max(0, acima.faturamento - euVendedor.faturamento);
  }

  const bonificacaoAtiva = bonificacoes.find(b => b.periodo === aba && b.ativo !== false) || null;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-green-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body">
      {/* Topbar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 h-[64px] flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-green-600" fill="currentColor" />
          <div>
            <h1 className="text-[18px] sm:text-[20px] font-black text-slate-900 leading-tight">Ranking</h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">Acompanhe sua posição, a corrida do período e as bonificações da loja.</p>
          </div>
        </div>
        {/* Avatar do usuário */}
        {me && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-[13px] font-bold">
              {(me.full_name || "U").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-[12px] font-semibold text-slate-800 leading-tight">{me.full_name || me.email}</p>
              <p className="text-[10px] text-slate-400">Vendedor</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Abas + Filtros */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Abas */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1 flex-wrap">
            {ABAS.map(a => (
              <button
                key={a}
                onClick={() => setAba(a)}
                className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  aba === a
                    ? "bg-white text-green-700 shadow-sm border border-green-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          {/* Filtro Unidade */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-slate-500">Unidade</label>
            <select
              value={unidade}
              onChange={e => setUnidade(e.target.value)}
              className="text-[12px] border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <option value="todas">Todas as unidades</option>
              {unidades.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Aviso tipo de meta */}
        {rankingConfig && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2">
            <Info className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-[12px] text-green-800">
              <strong>Critério configurado pela loja:</strong> {rankingConfig.tipo_meta_ranking}.{" "}
              <span className="text-green-600">O dono da loja pode definir Meta por volume ou faturamento.</span>
            </p>
          </div>
        )}

        {/* Pódio + Sua Posição */}
        <div className="flex flex-col sm:flex-row gap-4">
          <PodioRanking top3={top3} isVolume={isVolume} />
          {euVendedor && (
            <SuaPosicao
              posicao={posicao}
              total={vendedores.length}
              atingimento={atingimento}
              faltamValor={faltamValor}
              isVolume={isVolume}
            />
          )}
        </div>

        {/* Corrida + Bonificação */}
        <div className="flex flex-col sm:flex-row gap-4">
          <CorridaPeriodo
            vendedores={vendedores.slice(0, 8)}
            meta={metaPadrao}
            isVolume={isVolume}
            meuId={me?.id}
          />
          <BonificacaoPeriodo bonificacao={bonificacaoAtiva} />
        </div>

        {/* Tabela */}
        <TabelaRanking
          vendedores={vendedores}
          meta={metaPadrao}
          isVolume={isVolume}
          meuId={me?.id}
        />
      </div>
    </div>
  );
}