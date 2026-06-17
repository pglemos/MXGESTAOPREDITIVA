export type VendedorExperienciaDeclarada = 'sem_experiencia' | 'iniciante' | 'intermediario' | 'experiente' | 'especialista'
export type NivelMaturidadeVendedor = 'N1' | 'N2' | 'N3' | 'N4'
export type TrackTypeMaturidade = 'maturidade_n1' | 'maturidade_n2' | 'maturidade_n3' | 'maturidade_n4'

export const VENDEDOR_EXPERIENCIA_DECLARADA = ['sem_experiencia', 'iniciante', 'intermediario', 'experiente', 'especialista'] as const

export const VENDEDOR_EXPERIENCIA_LABEL: Record<VendedorExperienciaDeclarada, string> = {
  sem_experiencia: 'Sem experiência',
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  experiente: 'Experiente',
  especialista: 'Especialista',
}

export const MATURIDADE_VENDEDOR_LABEL: Record<NivelMaturidadeVendedor, string> = {
  N1: 'N1 — Iniciante',
  N2: 'N2 — Intermediário',
  N3: 'N3 — Performance',
  N4: 'N4 — Alta Performance',
}

export const MATURIDADE_TRACK_TYPE: Record<NivelMaturidadeVendedor, TrackTypeMaturidade> = {
  N1: 'maturidade_n1',
  N2: 'maturidade_n2',
  N3: 'maturidade_n3',
  N4: 'maturidade_n4',
}

export type MaturidadePerfilInput = {
  tempo_mercado_anos: number | null
  experiencia_declarada: VendedorExperienciaDeclarada | null
  cargo_atual: string | null
}

export function derivarNivelMaturidadeVendedor(perfil: MaturidadePerfilInput): NivelMaturidadeVendedor {
  const anos = Math.max(0, Number(perfil.tempo_mercado_anos ?? 0))
  const experienciaScore: Record<VendedorExperienciaDeclarada, number> = {
    sem_experiencia: 1,
    iniciante: 1,
    intermediario: 2,
    experiente: 3,
    especialista: 4,
  }
  const tempoScore = anos >= 5 ? 4 : anos >= 3 ? 3 : anos >= 1 ? 2 : 1
  const cargo = perfil.cargo_atual?.trim().toLowerCase() || ''
  const cargoScore = /\b(gerente|supervisor|coordenador|lider|líder)\b/.test(cargo) ? 3 : 1
  const score = Math.max(tempoScore, perfil.experiencia_declarada ? experienciaScore[perfil.experiencia_declarada] : 1, cargoScore)
  if (score >= 4) return 'N4'
  if (score >= 3) return 'N3'
  if (score >= 2) return 'N2'
  return 'N1'
}

export function trackTypeParaMaturidade(perfil: MaturidadePerfilInput): TrackTypeMaturidade {
  return MATURIDADE_TRACK_TYPE[derivarNivelMaturidadeVendedor(perfil)]
}
