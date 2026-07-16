import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import PlanoAtaqueTabBase44 from "@/base44-reference/components/carteira/PlanoAtaqueTab.jsx";

const RESUMABLE_STATUSES = [
  "Preparando",
  "Enviando mensagens",
  "Respondendo clientes",
  "Pausada",
];

const BLOCKING_STATUSES = [
  ...RESUMABLE_STATUSES,
  "Aguardando respostas",
];

/**
 * Preserva o componente visual original do Base44 e adiciona somente a
 * persistência que faltava na referência: uma missão interrompida reaparece
 * com a mesma fila, métricas e posição depois de atualizar ou trocar de tela.
 */
export default function PlanoAtaqueTab(props) {
  const { clientes = [], missaoAtiva, onIniciarMissao } = props;
  const [missaoRecuperada, setMissaoRecuperada] = useState(null);
  const recuperacaoExecutadaRef = useRef(false);

  useEffect(() => {
    if (missaoAtiva || recuperacaoExecutadaRef.current) return;
    recuperacaoExecutadaRef.current = true;

    let cancelled = false;

    async function restaurarMissao() {
      const missoes = await base44.entities.CarteiraMissao.filter(
        { status: { $in: BLOCKING_STATUSES } },
        "-updated_at",
        1,
      ).catch(() => []);

      if (cancelled) return;
      const missao = missoes?.[0] || null;
      if (!missao) return;

      setMissaoRecuperada(missao);

      if (!RESUMABLE_STATUSES.includes(missao.status)) return;

      const ids = new Set(missao.clientes_ids || []);
      const fila = clientes.filter(cliente => ids.has(cliente.id));
      if (fila.length > 0) onIniciarMissao(missao, fila);
    }

    restaurarMissao();
    return () => { cancelled = true; };
  }, [clientes, missaoAtiva, onIniciarMissao]);

  return (
    <PlanoAtaqueTabBase44
      {...props}
      missaoAtiva={missaoAtiva || missaoRecuperada}
    />
  );
}
