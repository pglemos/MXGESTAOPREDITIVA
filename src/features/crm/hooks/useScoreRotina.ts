import { useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toDateOnlyBR } from '@/lib/schemas/crm.schema'

// Score da Rotina (Central de Execução §4) — NÃO é o Score de Disciplina do
// Fechamento Diário. Fórmula: 10 (abriu a Central) + 20 (fez o Fechamento) +
// 0/40/60/70 (0/1/2/3+ clientes novos cadastrados hoje), capado em 100.
export type ScoreRotinaItem = {
  label: string
  compactLabel?: string
  value: string
  done: boolean
  tone?: 'green' | 'orange' | 'red' | 'muted'
}

function pontosNovosClientes(clientesCriadosHoje: number): number {
  if (clientesCriadosHoje >= 3) return 70
  if (clientesCriadosHoje === 2) return 60
  if (clientesCriadosHoje === 1) return 40
  return 0
}

export function calcularScoreRotina(input: {
  clientesCriadosHoje: number
  fechamentoFeito: boolean
}): { score: number; items: ScoreRotinaItem[] } {
  const pontosAbertura = 10
  const pontosFechamento = input.fechamentoFeito ? 20 : 0
  const pontosClientes = pontosNovosClientes(input.clientesCriadosHoje)
  const score = Math.min(100, pontosAbertura + pontosFechamento + pontosClientes)

  const items: ScoreRotinaItem[] = [
    { label: 'Abriu a Central de Execução', compactLabel: 'Abriu central', value: `${pontosAbertura}pts`, done: true, tone: 'green' },
    { label: 'Executou o Fechamento Diário', compactLabel: 'Fechamento feito', value: `${pontosFechamento}pts`, done: input.fechamentoFeito, tone: 'orange' },
    { label: 'Cadastrou novos clientes hoje', compactLabel: 'Novos clientes', value: `${pontosClientes}pts`, done: input.clientesCriadosHoje > 0, tone: 'muted' },
  ]

  return { score, items }
}

export function useScoreRotina(input: {
  clientesCriadosHoje: number
  fechamentoFeito: boolean
}) {
  const { supabaseUser } = useAuth()

  useEffect(() => {
    if (!supabaseUser) return
    const hoje = toDateOnlyBR()
    void supabase
      .from('central_execucao_aberturas')
      .upsert({ seller_user_id: supabaseUser.id, data: hoje }, { onConflict: 'seller_user_id,data', ignoreDuplicates: true })
  }, [supabaseUser])

  return useMemo(
    () => calcularScoreRotina(input),
    [input.clientesCriadosHoje, input.fechamentoFeito],
  )
}
