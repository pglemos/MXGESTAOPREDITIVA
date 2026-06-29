import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { MessageCircle, Phone, Clock, Edit2, Check, X } from "lucide-react";
import moment from "moment";
import { MOMENTOS, TEMPERATURAS, calcularProximaAcao, tempColor } from "./carteiraUtils";

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-[#526B7A] font-semibold uppercase tracking-wide">{label}</span>
      <span className="text-[13px] text-[#071822] font-medium">{value}</span>
    </div>
  );
}

export default function FichaClienteSheet({ clienteId, open, onClose, onAtualizado }) {
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historico, setHistorico] = useState([]);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open || !clienteId) return;
    setLoading(true);
    Promise.all([
      base44.entities.CarteiraCliente.get(clienteId),
      base44.entities.CarteiraHistorico.filter({ cliente_id: clienteId }, "-created_date", 20),
    ]).then(([c, h]) => {
      setCliente(c);
      setForm(c);
      setHistorico(h);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open, clienteId]);

  const tel = (cliente?.whatsapp || "").replace(/\D/g, "");
  const waUrl = tel ? `https://wa.me/55${tel}` : null;

  async function salvarEdicao() {
    setSalvando(true);
    const atualizado = { ...form, proxima_acao: calcularProximaAcao(form) };
    await base44.entities.CarteiraCliente.update(clienteId, atualizado);
    setCliente(atualizado);
    setEditando(false);
    setSalvando(false);
    if (onAtualizado) onAtualizado(atualizado);
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-4 border-[#DFE0E1] border-t-[#00A89D] rounded-full animate-spin" />
          </div>
        ) : cliente ? (
          <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-start gap-3 pt-2">
              <div className="w-12 h-12 rounded-full bg-[#E8F3F2] flex items-center justify-center text-base font-black text-[#00A89D] shrink-0">
                {(cliente.nome || "?").split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[17px] font-black text-[#071822] leading-tight">{cliente.nome}</h3>
                <p className="text-xs text-[#526B7A] mt-0.5">{cliente.canal_origem} · Cadastrado {moment(cliente.created_date).format("DD/MM/YYYY")}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${tempColor(cliente.temperatura)}`}>{cliente.temperatura}</span>
                  <span className="text-[11px] text-[#526B7A]">{cliente.momento}</span>
                </div>
              </div>
              <button onClick={() => setEditando(e => !e)} className="p-2 rounded-xl hover:bg-[#DFE0E1] transition-colors">
                <Edit2 className="w-4 h-4 text-[#526B7A]" />
              </button>
            </div>

            {/* Próxima ação destaque */}
            <div className="bg-[#E8F3F2] border border-[#E8F3F2] rounded-2xl p-4">
              <p className="text-[11px] font-black text-[#00A89D] uppercase tracking-wide mb-1">Próxima Ação</p>
              <p className="text-sm font-semibold text-[#102C37]">{cliente.proxima_acao || calcularProximaAcao(cliente)}</p>
            </div>

            {/* Ações rápidas */}
            <div className="flex gap-2">
              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button className="w-full rounded-xl bg-[#00A89D] hover:bg-[#00A89D] text-white gap-2 text-sm">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </Button>
                </a>
              )}
              {tel && (
                <a href={`tel:${tel}`} className="flex-1">
                  <Button variant="outline" className="w-full rounded-xl gap-2 text-sm">
                    <Phone className="w-4 h-4" /> Ligar
                  </Button>
                </a>
              )}
            </div>

            {/* Dados editáveis ou exibição */}
            {editando ? (
              <div className="space-y-3 bg-[#F7F8F8] rounded-2xl p-4">
                <p className="text-xs font-black text-[#526B7A] uppercase tracking-wider">Editar dados</p>
                {[{ k: "veiculo_interesse", l: "Veículo de Interesse" }, { k: "email", l: "E-mail" }, { k: "valor_negociado", l: "Valor Negociado" }].map(({ k, l }) => (
                  <div key={k}>
                    <label className="text-xs font-semibold text-[#526B7A] uppercase tracking-wide mb-1 block">{l}</label>
                    <Input value={form[k] || ""} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} className="rounded-xl" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-semibold text-[#526B7A] uppercase tracking-wide mb-1 block">Temperatura</label>
                  <select value={form.temperatura || "Morno"} onChange={e => setForm(p => ({ ...p, temperatura: e.target.value }))} className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
                    {TEMPERATURAS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#526B7A] uppercase tracking-wide mb-1 block">Momento do Cliente</label>
                  <select value={form.momento || ""} onChange={e => setForm(p => ({ ...p, momento: e.target.value }))} className="w-full h-9 rounded-xl border border-input bg-white px-3 text-sm">
                    {MOMENTOS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#526B7A] uppercase tracking-wide mb-1 block">Observações</label>
                  <textarea value={form.observacoes || ""} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} rows={2} className="w-full rounded-xl border border-input bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                {form.momento === "Visita agendada" && (
                  <div>
                    <label className="text-xs font-semibold text-[#526B7A] uppercase tracking-wide mb-1 block">Visita Agendada</label>
                    <Input type="datetime-local" value={form.visita_agendada_em ? form.visita_agendada_em.slice(0, 16) : ""} onChange={e => setForm(p => ({ ...p, visita_agendada_em: e.target.value }))} className="rounded-xl" />
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" onClick={() => setEditando(false)} className="flex-1 rounded-xl" disabled={salvando}>Cancelar</Button>
                  <Button onClick={salvarEdicao} className="flex-1 rounded-xl bg-[#00A89D] hover:bg-[#00A89D] text-white" disabled={salvando}>
                    {salvando ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-[#F7F8F8] rounded-2xl p-4 space-y-4">
                <p className="text-xs font-black text-[#526B7A] uppercase tracking-wider">Informações</p>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="WhatsApp" value={cliente.whatsapp} />
                  <InfoRow label="E-mail" value={cliente.email} />
                  <InfoRow label="Canal" value={cliente.canal_origem} />
                  <InfoRow label="Veículo de Interesse" value={cliente.veiculo_interesse} />
                  <InfoRow label="Veículo Comprado" value={cliente.veiculo_comprado} />
                  <InfoRow label="Valor Negociado" value={cliente.valor_negociado} />
                  <InfoRow label="Aniversário" value={cliente.data_nascimento ? moment(cliente.data_nascimento).format("DD/MM/YYYY") : null} />
                  {cliente.visita_agendada_em && (
                    <InfoRow label="Visita Agendada" value={moment(cliente.visita_agendada_em).format("DD/MM [às] HH:mm")} />
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {cliente.proposta_enviada && <span className="text-xs bg-[#E8F3F2] text-[#00A89D] px-2 py-0.5 rounded-full">Proposta enviada</span>}
                  {cliente.interesse_troca && <span className="text-xs bg-[#FFF7E6] text-[#F59F0A] px-2 py-0.5 rounded-full">Interesse em troca</span>}
                  {cliente.interesse_financiamento && <span className="text-xs bg-[#F15BBA] text-[#F15BBA] px-2 py-0.5 rounded-full">Interesse em financiamento</span>}
                </div>
                {cliente.observacoes && (
                  <div>
                    <p className="text-[11px] text-[#526B7A] font-semibold uppercase tracking-wide">Observações</p>
                    <p className="text-sm text-[#526B7A] mt-0.5">{cliente.observacoes}</p>
                  </div>
                )}
                {cliente.motivo_perda && (
                  <div className="bg-[#FEECEC] rounded-xl p-3">
                    <p className="text-[11px] text-[#EF4343] font-semibold uppercase tracking-wide">Motivo de Perda</p>
                    <p className="text-sm text-[#EF4343] mt-0.5">{cliente.motivo_perda}</p>
                  </div>
                )}
              </div>
            )}

            {/* Histórico */}
            {historico.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-black text-[#526B7A] uppercase tracking-wider">Histórico</p>
                <div className="space-y-2">
                  {historico.map(h => (
                    <div key={h.id} className="flex items-start gap-2.5 py-2 border-b border-[#F7F8F8] last:border-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00A89D] mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#526B7A]">{h.tipo}</p>
                        <p className="text-xs text-[#526B7A]">{h.descricao}</p>
                        {h.momento_novo && h.momento_novo !== h.momento_anterior && (
                          <p className="text-xs text-[#00A89D] mt-0.5">{h.momento_anterior} → {h.momento_novo}</p>
                        )}
                      </div>
                      <span className="text-[11px] text-[#E0EBEA] shrink-0">{moment(h.created_date).format("DD/MM HH:mm")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-[#526B7A]">Cliente não encontrado.</div>
        )}
      </SheetContent>
    </Sheet>
  );
}