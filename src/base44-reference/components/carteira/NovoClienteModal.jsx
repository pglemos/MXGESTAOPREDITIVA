import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { calcularProximaAcao } from "./carteiraUtils";
import { toast } from "@/components/ui/use-toast";

const MOMENTOS_CADASTRO = [
  { value: "Novo contato", label: "Só demonstrou interesse" },
  { value: "Cliente morno em aquecimento", label: "Está comparando opções" },
  { value: "Cliente quente sem visita", label: "Quer comprar em breve" },
  { value: "Visita agendada", label: "Já tem visita agendada" },
  { value: "Proposta enviada", label: "Já recebeu proposta" },
  { value: "Em negociação", label: "Está negociando" },
  { value: "Venda realizada", label: "Comprou" },
  { value: "Perda registrada", label: "Perdi a venda" },
  { value: "Pós-venda ativo", label: "É pós-venda" },
  { value: "Garantia em acompanhamento", label: "É garantia" },
  { value: "Oportunidade futura de troca", label: "É oportunidade futura" },
];

const TEMP_AUTO = {
  "Novo contato": "Morno",
  "Cliente morno em aquecimento": "Morno",
  "Cliente quente sem visita": "Quente",
  "Visita agendada": "Quente",
  "Proposta enviada": "Quente",
  "Em negociação": "Quente",
  "Venda realizada": "Frio",
  "Perda registrada": "Frio",
  "Pós-venda ativo": "Frio",
  "Garantia em acompanhamento": "Frio",
  "Oportunidade futura de troca": "Morno",
};

export default function NovoClienteModal({ open, onClose, onCriado, vendedorId }) {
  const [form, setForm] = useState({
    nome: "", whatsapp: "", canal_comercial: "Internet", canal_origem: "Internet",
    veiculo_interesse: "", momento: "Novo contato", situacao_atual: "Lead sem resposta",
    visita_agendada_em: "", proposta_enviada: false,
    interesse_troca: false, interesse_financiamento: false, observacoes: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSalvar() {
    if (!form.nome || !form.whatsapp) return;
    setSaving(true);
    const temperatura = TEMP_AUTO[form.momento] || "Morno";
    const payload = {
      ...form,
      canal_comercial: form.canal_comercial || "Internet",
      canal_origem: form.canal_comercial || form.canal_origem || "Internet",
      temperatura,
      vendedor_id: vendedorId || "",
      ativo: true,
      ultimo_contato: new Date().toISOString(),
    };
    payload.proxima_acao = calcularProximaAcao(payload);
    const criado = await base44.entities.CarteiraCliente.create(payload);
    await base44.entities.CarteiraHistorico.create({
      cliente_id: criado.id, vendedor_id: vendedorId || "",
      tipo: "Cadastro", descricao: "Cliente cadastrado na carteira.",
      momento_novo: form.momento,
    });
    setSaving(false);
    onCriado(criado);
    onClose();
    setForm({ nome: "", whatsapp: "", canal_comercial: "Internet", canal_origem: "Internet", veiculo_interesse: "", momento: "Novo contato", situacao_atual: "Lead sem resposta", visita_agendada_em: "", proposta_enviada: false, interesse_troca: false, interesse_financiamento: false, observacoes: "" });
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#031B3D] text-lg font-black">Novo Cliente</DialogTitle>
          <p className="text-sm text-slate-400">Adicione um cliente à sua carteira de desenvolvimento.</p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Nome *</label>
              <Input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Nome completo" className="rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">WhatsApp *</label>
              <Input value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="(11) 99999-9999" className="rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Canal</label>
              <select value={form.canal_comercial} onChange={e => setForm(p => ({ ...p, canal_comercial: e.target.value, canal_origem: e.target.value }))} className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
                {["Internet", "Carteira", "Porta"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Veículo de Interesse</label>
              <Input value={form.veiculo_interesse} onChange={e => set("veiculo_interesse", e.target.value)} placeholder="Ex: Corolla XEI 2023" className="rounded-xl" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Em que momento esse cliente está?</label>
            <div className="grid grid-cols-1 gap-1.5">
              {MOMENTOS_CADASTRO.map(m => (
                <button key={m.value} onClick={() => set("momento", m.value)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${form.momento === m.value ? "border-[#005BFF] bg-blue-50 text-[#005BFF] font-semibold" : "border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50"}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {form.momento === "Visita agendada" && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Data e hora da visita</label>
              <Input type="datetime-local" value={form.visita_agendada_em} onChange={e => set("visita_agendada_em", e.target.value)} className="rounded-xl" />
            </div>
          )}

          <div className="flex gap-4">
            {[{ k: "interesse_troca", l: "Interesse em troca?" }, { k: "proposta_enviada", l: "Proposta enviada?" }, { k: "interesse_financiamento", l: "Interesse em financiamento?" }].map(({ k, l }) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} className="rounded" />
                {l}
              </label>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Observação inicial</label>
            <textarea value={form.observacoes} onChange={e => set("observacoes", e.target.value)} placeholder="Contexto do primeiro contato..." rows={2} className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
            <Button onClick={handleSalvar} disabled={saving || !form.nome || !form.whatsapp} className="flex-1 rounded-xl bg-[#005BFF] hover:bg-blue-700 text-white">
              {saving ? "Salvando..." : "Adicionar cliente"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}