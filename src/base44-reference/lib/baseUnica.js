/**
 * baseUnica.js — Utilitário de Base Única MX Performance
 *
 * Centraliza as regras de:
 * - Deduplicação de clientes (CarteiraCliente é a base oficial)
 * - Criação de EventoComercial
 * - Atualização de status de venda no cliente
 *
 * REGRA: CarteiraCliente é a ÚNICA base oficial de clientes/oportunidades.
 * Todos os módulos (Fechamento, Carteira, Central, Funil) devem usar esta base.
 */

import { base44 } from "@/api/base44Client";

// ── Normalização de telefone ──────────────────────────────────────────────────

export function normalizarTelefone(tel) {
  if (!tel) return "";
  return tel.replace(/\D/g, "");
}

// ── Buscar cliente existente pelo telefone (deduplicação) ─────────────────────

/**
 * Retorna o cliente existente na CarteiraCliente pelo telefone normalizado.
 * Critério: mesmo telefone + mesmo vendedor_id.
 * Se encontrar, retorna o registro. Se não, retorna null.
 */
export async function buscarClientePorTelefone(telefone, vendedorId) {
  if (!telefone || !vendedorId) return null;
  const tel = normalizarTelefone(telefone);
  if (!tel) return null;

  const todos = await base44.entities.CarteiraCliente.filter({
    vendedor_id: vendedorId,
    ativo: true,
  }).catch(() => []);

  return todos.find(c => {
    const tw = normalizarTelefone(c.whatsapp || c.telefone || "");
    return tw === tel;
  }) || null;
}

// ── Criar ou atualizar cliente (base única, sem duplicação) ───────────────────

/**
 * Cria novo cliente ou atualiza existente com base no telefone.
 *
 * @param {object} dados - Campos do cliente (nome, whatsapp, canal_comercial, ...)
 * @param {string} vendedorId - ID do vendedor autenticado
 * @param {object} [opcoes] - { forcarNovo: bool } — usa forcarNovo apenas quando se sabe que é cliente novo sem telefone
 * @returns {object} cliente criado ou atualizado
 */
export async function criarOuAtualizarCliente(dados, vendedorId, opcoes = {}) {
  const { forcarNovo = false } = opcoes;

  // Tentar encontrar existente pelo telefone
  let clienteExistente = null;
  if (!forcarNovo && dados.whatsapp) {
    clienteExistente = await buscarClientePorTelefone(dados.whatsapp, vendedorId);
  }

  const agora = new Date().toISOString();
  const payload = {
    ...dados,
    vendedor_id: vendedorId,
    ultimo_contato: agora,
    ultima_acao_em: agora,
  };

  if (clienteExistente) {
    // Atualizar cliente existente — preservar campos que não devem ser sobrescritos
    const update = { ...payload };
    // Não sobrescrever data_cadastro_mx original
    delete update.data_cadastro_mx;
    const atualizado = await base44.entities.CarteiraCliente.update(clienteExistente.id, update);
    return { cliente: atualizado, isNovo: false };
  }

  // Criar novo cliente
  const criado = await base44.entities.CarteiraCliente.create({
    ...payload,
    canal_entrada: payload.canal_comercial,
    status_oportunidade: "Ativa",
    situacao_oportunidade: "Nova",
    vendido: false,
    ativo: true,
    data_cadastro_mx: agora,
  });

  return { cliente: criado, isNovo: true };
}

// ── Registrar evento comercial ────────────────────────────────────────────────

/**
 * Cria um EventoComercial vinculado ao cliente.
 *
 * @param {object} params
 * @param {string} params.clienteId - ID do cliente em CarteiraCliente
 * @param {string} params.vendedorId
 * @param {string} params.tipoEvento - um dos tipos definidos no schema EventoComercial
 * @param {string} params.canalMx - "Showroom" | "Internet" | "Carteira"
 * @param {string} [params.modalidade] - obrigatório para agendamento e atendimento
 * @param {string} [params.origemModulo] - módulo de origem
 * @param {string} [params.fechamentoId]
 * @param {string} [params.atividadeId]
 * @param {string} [params.observacao]
 * @param {string} [params.nomeClienteSnapshot]
 * @param {string} [params.createdBy]
 */
export async function registrarEventoComercial(params) {
  const {
    clienteId, vendedorId, tipoEvento, canalMx,
    modalidade = "", origemModulo = "Sistema",
    fechamentoId = "", atividadeId = "", observacao = "",
    nomeClienteSnapshot = "", createdBy = "",
  } = params;

  const agora = new Date().toISOString();

  await base44.entities.EventoComercial.create({
    cliente_id: clienteId || "",
    vendedor_id: vendedorId || "",
    tipo_evento: tipoEvento,
    canal_mx: canalMx,
    modalidade,
    status_evento: "Realizado",
    origem_modulo: origemModulo,
    fechamento_id: fechamentoId,
    atividade_id: atividadeId,
    observacao,
    nome_cliente_snapshot: nomeClienteSnapshot,
    canal_snapshot: canalMx,
    created_by: createdBy,
    data_evento: agora.slice(0, 10),
    data_hora_evento: agora,
  }).catch(err => {
    console.warn("[baseUnica] Falha ao registrar EventoComercial:", err?.message);
  });
}

// ── Registrar venda (atualiza cliente + cria evento) ─────────────────────────

/**
 * Marca o cliente como vendido e registra o evento venda_realizada.
 */
export async function registrarVenda(clienteId, vendedorId, canalMx, opcoes = {}) {
  const { valorVenda = "", veiculoComprado = "", fechamentoId = "", origemModulo = "Sistema" } = opcoes;
  const hoje = new Date().toISOString().slice(0, 10);

  // Atualizar cliente
  await base44.entities.CarteiraCliente.update(clienteId, {
    vendido: true,
    status_oportunidade: "Vendida",
    status_comercial: "Vendido",
    situacao_atual: "Venda realizada",
    data_venda: hoje,
    valor_venda: valorVenda,
    veiculo_comprado: veiculoComprado,
    ultima_evolucao_em: new Date().toISOString(),
  }).catch(() => {});

  // Registrar evento
  await registrarEventoComercial({
    clienteId,
    vendedorId,
    tipoEvento: "venda_realizada",
    canalMx,
    origemModulo,
    fechamentoId,
  });
}

// ── Canal MX normalizado ──────────────────────────────────────────────────────

/**
 * Normaliza o canal para os 3 canais MX oficiais.
 * "Porta" e legados mapeiam para "Showroom".
 */
export function normalizarCanalMx(canal) {
  if (!canal) return "Carteira";
  if (canal === "Internet") return "Internet";
  if (canal === "Carteira") return "Carteira";
  // Showroom, Porta e outros presenciais → Showroom
  return "Showroom";
}