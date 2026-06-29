import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { Search, UserCheck, UserX } from "lucide-react";
import moment from "moment";

const TIPOS = [
  "Retorno",
  "Entrega",
  "Pós-venda",
  "Garantia",
  "Outra atividade comercial",
];

const PRIORIDADES = [
  { label: "Alta", value: 1 },
  { label: "Média", value: 5 },
  { label: "Baixa", value: 9 },
];

function normalizePhone(raw) {
  return (raw || "").replace(/\D/g, "");
}

export default function NovaAtividadeModal({ open, onClose, clients, onCriada, vendedorId }) {
  const { toast } = useToast();
  const [step, setStep] = useState("tipo"); // "tipo" | "form"
  const [tipo, setTipo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [form, setForm] = useState({
    data: moment().format("YYYY-MM-DD"),
    hora: moment().format("HH:mm"),
    prioridade: 5,
    descricao: "",
    veiculo: "",
  });
  const [saving, setSaving] = useState(false);

  const resetar = () => {
    setStep("tipo");
    setTipo("");
    setTelefone("");
    setClienteEncontrado(null);
    setNaoEncontrado(false);
    setForm({ data: moment().format("YYYY-MM-DD"), hora: moment().format("HH:mm"), prioridade: 5, descricao: "", veiculo: "" });
  };

  const handleClose = () => { resetar(); onClose(); };

  const handleEscolherTipo = (t) => {
    setTipo(t);
    setStep("form");
  };

  const buscarCliente = () => {
    const tel = normalizePhone(telefone);
    if (!tel) return;
    const found = clients.find(c => normalizePhone(c.phone) === tel);
    if (found) {
      setClienteEncontrado(found);
      setNaoEncontrado(false);
      setForm(f => ({
        ...f,
        veiculo: found.vehicle_sought || found.veiculo_snapshot || "",
      }));
    } else {
      setClienteEncontrado(null);
      setNaoEncontrado(true);
    }
  };

  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSalvar = async () => {
    setSaving(true);
    try {
      const me = await base44.auth.me();
      const dataHora = `${form.data}T${form.hora}`;
      const nova = await base44.entities.ExecutionOpportunity.create({
        vendedor_id: vendedorId || me.id,
        cliente_id: clienteEncontrado?.id || undefined,
        tipo,
        titulo: tipo,
        descricao: form.descricao || tipo,
        data_hora_execucao: dataHora,
        prioridade: form.prioridade,
        status: "Pendente",
        telefone_snapshot: clienteEncontrado?.phone || telefone,
        nome_cliente_snapshot: clienteEncontrado?.name || "Cliente avulso",
        veiculo_snapshot: form.veiculo || clienteEncontrado?.vehicle_sought || "",
        criado_automaticamente: false,
        ativo: true,
      });
      toast({ title: "Atividade criada com sucesso." });
      onCriada(nova);
      handleClose();
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao criar. Tente novamente." });
    }
    setSaving(false);
  };

  const podesSalvar = tipo && form.data && form.hora && (clienteEncontrado || telefone);

  return (
    <Dialog open={open} onOpenChange={v => { if (!saving) handleClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#071822] font-bold text-[17px]">Nova atividade</DialogTitle>
        </DialogHeader>

        {step === "tipo" && (
          <div className="mt-3 space-y-2">
            <p className="text-[13px] text-[#526B7A] mb-3">Selecione o tipo de atividade comercial:</p>
            {TIPOS.map(t => (
              <button key={t} onClick={() => handleEscolherTipo(t)}
                className="w-full text-left px-4 py-3 rounded-xl border border-[#DFE0E1] hover:border-[#00A89D] hover:bg-[#E8F3F2] text-[13px] font-semibold text-[#071822] transition-colors">
                {t}
              </button>
            ))}
          </div>
        )}

        {step === "form" && (
          <div className="mt-3 space-y-4">
            {/* Tipo selecionado */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#00A89D] bg-[#E8F3F2] px-3 py-1 rounded-full">{tipo}</span>
              <button onClick={() => setStep("tipo")} className="text-[12px] text-[#526B7A] hover:text-[#526B7A] underline">Mudar tipo</button>
            </div>

            {/* Busca de cliente por telefone */}
            <div>
              <label className="text-[11px] font-bold text-[#526B7A] uppercase tracking-wider">Cliente ou Telefone</label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={telefone}
                  onChange={e => { setTelefone(e.target.value); setClienteEncontrado(null); setNaoEncontrado(false); }}
                  placeholder="(11) 98765-4321"
                  className="flex-1"
                />
                <button onClick={buscarCliente}
                  className="px-3 py-2 rounded-xl bg-[#00A89D] text-white hover:bg-[#00A89D] transition-colors">
                  <Search className="w-4 h-4" />
                </button>
              </div>
              {clienteEncontrado && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-[#E8F3F2] border border-[#00A89D] rounded-xl">
                  <UserCheck className="w-4 h-4 text-[#00A89D] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-[#00A89D] truncate">{clienteEncontrado.name}</p>
                    <p className="text-[11px] text-[#00A89D] truncate">{clienteEncontrado.vehicle_sought || "—"}</p>
                  </div>
                </div>
              )}
              {naoEncontrado && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-[#FFF7E6] border border-[#F59F0A] rounded-xl">
                  <UserX className="w-4 h-4 text-[#F59F0A] flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-[#F59F0A]">Cliente não encontrado.</p>
                    <Link to="/carteira" onClick={handleClose} className="text-[11px] text-[#00A89D] underline">
                      Abrir Carteira de Clientes para cadastrar
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Data / Hora */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#526B7A] uppercase tracking-wider">Data</label>
                <Input type="date" value={form.data} onChange={e => setF("data", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#526B7A] uppercase tracking-wider">Hora</label>
                <Input type="time" value={form.hora} onChange={e => setF("hora", e.target.value)} className="mt-1.5" />
              </div>
            </div>

            {/* Veículo */}
            <div>
              <label className="text-[11px] font-bold text-[#526B7A] uppercase tracking-wider">Veículo (opcional)</label>
              <Input value={form.veiculo} onChange={e => setF("veiculo", e.target.value)} className="mt-1.5" placeholder="Ex: HB20 1.0 Comfort" />
            </div>

            {/* Prioridade */}
            <div>
              <label className="text-[11px] font-bold text-[#526B7A] uppercase tracking-wider">Prioridade</label>
              <Select value={String(form.prioridade)} onValueChange={v => setF("prioridade", Number(v))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORIDADES.map(p => <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Observação */}
            <div>
              <label className="text-[11px] font-bold text-[#526B7A] uppercase tracking-wider">Observação</label>
              <Input value={form.descricao} onChange={e => setF("descricao", e.target.value)} className="mt-1.5" placeholder="Descreva o objetivo desta atividade..." />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-[#DFE0E1]">
              <button onClick={handleClose} disabled={saving}
                className="px-5 py-2.5 text-[13px] font-semibold text-[#526B7A] border border-[#DFE0E1] rounded-xl hover:bg-[#F7F8F8] transition-colors">
                Cancelar
              </button>
              <button onClick={handleSalvar} disabled={!podesSalvar || saving}
                className="px-6 py-2.5 text-[13px] font-bold text-white bg-[#00A89D] hover:bg-[#00A89D] disabled:opacity-50 rounded-xl transition-colors">
                {saving ? "Salvando..." : "Salvar atividade"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}