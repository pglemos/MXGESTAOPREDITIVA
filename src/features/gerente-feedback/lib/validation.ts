export type FeedbackObrigatorioInput = {
  seller_id?: string | null
  caso_motivo?: string | null
  positives?: string | null
  attention_points?: string | null
  action?: string | null
}

export type FeedbackObrigatorioResult =
  | { ok: true }
  | { ok: false; message: string }

export function validarFeedbackObrigatorio(input: FeedbackObrigatorioInput): FeedbackObrigatorioResult {
  if (!input.seller_id?.trim()) return { ok: false, message: 'Selecione o especialista.' }
  if (!input.caso_motivo?.trim()) return { ok: false, message: 'Informe o caso ou motivo da devolutiva.' }
  if (!input.positives?.trim()) return { ok: false, message: 'Preencha os pontos fortes.' }
  if (!input.attention_points?.trim()) return { ok: false, message: 'Preencha os pontos de atenção.' }
  if (!input.action?.trim()) return { ok: false, message: 'Preencha a ação combinada.' }
  return { ok: true }
}
