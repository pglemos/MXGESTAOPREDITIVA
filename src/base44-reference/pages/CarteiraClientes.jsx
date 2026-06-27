import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import CarteiraAtivaTab from "@/components/carteira/CarteiraAtivaTab";
import PlanoAtaqueTab from "@/components/carteira/PlanoAtaqueTab";
import ExecucaoMissao from "@/components/carteira/ExecucaoMissao";
import NovoClienteModal from "@/components/carteira/NovoClienteModal";
import WhatsAppRoteiro from "@/components/carteira/WhatsAppRoteiro";
import FichaClienteSheet from "@/components/carteira/FichaClienteSheet";
import MxPageHeader from "@/components/ui/MxPageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

export default function CarteiraClientes() {
  const [aba, setAba] = useState("carteira");
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [missaoAtiva, setMissaoAtiva] = useState(null);

  // Modais
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);
  const [whatsAppCliente, setWhatsAppCliente] = useState(null);
  const [whatsAppMissaoId, setWhatsAppMissaoId] = useState(null);
  const [fichaClienteId, setFichaClienteId] = useState(null);

  // Execução de missão
  const [execucaoMissao, setExecucaoMissao] = useState(null);
  const [execucaoClientes, setExecucaoClientes] = useState([]);

  useEffect(() => {
    async function init() {
      const u = await base44.auth.me().catch(() => null);
      setUser(u);
      const [cs, ps] = await Promise.all([
        base44.entities.CarteiraCliente.filter({ ativo: true }, "-updated_date", 200).catch(() => []),
        u ? base44.entities.UserProfile.filter({ created_by_id: u.id }, "-created_date", 1).catch(() => []) : Promise.resolve([]),
      ]);
      setClientes(cs);
      setPerfil(ps[0] || null);

      // Auto-abrir ficha por ?clienteId=
      const params = new URLSearchParams(window.location.search);
      const cid = params.get("clienteId");
      if (cid) setFichaClienteId(cid);

      setLoading(false);
    }
    init();
  }, []);

  const handleClienteCriado = useCallback((c) => {
    setClientes(prev => [c, ...prev]);
  }, []);

  const handleResultadoAtualizado = useCallback((atualizado) => {
    setClientes(prev => prev.map(c => c.id === atualizado.id ? atualizado : c));
  }, []);

  const handleIniciarMissao = useCallback((missao, clientesMissao) => {
    setExecucaoMissao(missao);
    setExecucaoClientes(clientesMissao);
    setAba("execucao");
  }, []);

  const handleVoltarMissao = useCallback(() => {
    setExecucaoMissao(null);
    setExecucaoClientes([]);
    setAba("plano");
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#005BFF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-surface-alt px-mx-sm pb-mx-sm pt-0 sm:px-mx-md sm:pb-mx-md 2xl:px-mx-lg 2xl:pb-mx-lg">
      <MxPageHeader
        className="-mx-mx-sm sm:-mx-mx-md 2xl:-mx-mx-lg sticky top-0 z-30"
        title="Carteira de Clientes"
        subtitle="Desenvolva seus clientes e avance cada relacionamento para o próximo passo."
        chip={
          <>
            <Users size={14} className="text-[#2563eb]" />
            <span>{clientes.length} clientes ativos</span>
          </>
        }
        action={<Button onClick={() => setNovoClienteOpen(true)} className="rounded-xl bg-[#005BFF] hover:bg-blue-700 text-white text-sm gap-2 whitespace-nowrap"><Plus className="w-4 h-4" /> Novo cliente</Button>}
      />
      <div className="max-w-[1280px] mx-auto py-6 space-y-6">

{/* Tabs */}
        {aba !== "execucao" && (
          <div className="flex gap-1 bg-white border border-slate-100 rounded-2xl p-1 w-fit shadow-sm">
            {[
              { id: "carteira", label: "Carteira Ativa" },
              { id: "plano", label: "Plano de Ataque" },
            ].map(t => (
              <button key={t.id} onClick={() => setAba(t.id)}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${aba === t.id ? "bg-[#005BFF] text-white shadow-sm" : "text-slate-500 hover:text-[#031B3D]"}`}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Conteúdo */}
        {aba === "carteira" && (
          <CarteiraAtivaTab
            clientes={clientes}
            onNovoCliente={() => setNovoClienteOpen(true)}
            onWhatsApp={(c, mid) => { setWhatsAppCliente(c); setWhatsAppMissaoId(mid || null); }}
            onFicha={(id) => setFichaClienteId(id)}
            onResultadoAtualizado={handleResultadoAtualizado}
          />
        )}

        {aba === "plano" && (
          <PlanoAtaqueTab
            clientes={clientes}
            perfil={perfil || user}
            onIniciarMissao={handleIniciarMissao}
            missaoAtiva={missaoAtiva}
          />
        )}

        {aba === "execucao" && execucaoMissao && (
          <ExecucaoMissao
            missao={execucaoMissao}
            clientes={execucaoClientes}
            onVoltar={handleVoltarMissao}
            onConcluida={handleVoltarMissao}
          />
        )}

        {/* Modais globais */}
        <NovoClienteModal
          open={novoClienteOpen}
          onClose={() => setNovoClienteOpen(false)}
          onCriado={handleClienteCriado}
          vendedorId={user?.id}
        />

        <WhatsAppRoteiro
          open={!!whatsAppCliente}
          onClose={() => { setWhatsAppCliente(null); setWhatsAppMissaoId(null); }}
          cliente={whatsAppCliente}
          missaoId={whatsAppMissaoId}
          onResultadoRegistrado={handleResultadoAtualizado}
        />

        <FichaClienteSheet
          open={!!fichaClienteId}
          clienteId={fichaClienteId}
          onClose={() => setFichaClienteId(null)}
          onAtualizado={handleResultadoAtualizado}
        />
      </div>
    </div>
  );
}
