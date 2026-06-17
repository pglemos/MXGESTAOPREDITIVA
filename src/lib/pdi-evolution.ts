import type { PDISessionSummary } from '@/hooks/usePDI_MX'

export type PDIEvolutionStatus = 'evoluindo' | 'estagnado' | 'queda'

export interface PDIEvolutionPoint {
  sessaoId: string
  date: string
  dateLabel: string
  nota: number
  alvo: number
}

export interface PDIEvolutionItem {
  competenciaId: string
  competencia: string
  tipo?: string
  status: PDIEvolutionStatus
  delta: number
  notaAnterior: number
  notaAtual: number
  alvoAtual: number
  percentualAtual: number
  pontos: PDIEvolutionPoint[]
}

export interface PDIEvolutionResult {
  comparavel: boolean
  totalSessoes: number
  items: PDIEvolutionItem[]
  highlights: {
    evoluindo: PDIEvolutionItem[]
    estagnadas: PDIEvolutionItem[]
    quedas: PDIEvolutionItem[]
  }
}

type CompetenciaBucket = {
  competenciaId: string
  competencia: string
  tipo?: string
  pontos: PDIEvolutionPoint[]
}

const STATUS_PRIORITY: Record<PDIEvolutionStatus, number> = {
  evoluindo: 0,
  estagnado: 1,
  queda: 2,
}

export function buildPDIEvolution(pdis: PDISessionSummary[] = []): PDIEvolutionResult {
  const sessoes = [...pdis]
    .filter(sessao => (sessao.avaliacoes || []).length > 0)
    .sort((a, b) => sessionTime(a) - sessionTime(b))

  const buckets = new Map<string, CompetenciaBucket>()

  sessoes.forEach(sessao => {
    const sessionDate = resolveSessionDate(sessao)

    ;(sessao.avaliacoes || []).forEach(avaliacao => {
      const nota = Number(avaliacao.nota)
      if (!Number.isFinite(nota)) return

      const competenciaId = avaliacao.competencia_id || normalizarCompetencia(avaliacao.competencia)
      if (!competenciaId) return

      const bucket = buckets.get(competenciaId) || {
        competenciaId,
        competencia: avaliacao.competencia || 'Competencia',
        tipo: avaliacao.tipo,
        pontos: [],
      }

      const ponto = {
        sessaoId: sessao.id,
        date: sessionDate.raw,
        dateLabel: sessionDate.label,
        nota,
        alvo: avaliacao.alvo || 10,
      }

      const existingIndex = bucket.pontos.findIndex(point => point.sessaoId === sessao.id)
      if (existingIndex >= 0) {
        bucket.pontos[existingIndex] = ponto
      } else {
        bucket.pontos.push(ponto)
      }

      buckets.set(competenciaId, bucket)
    })
  })

  const items = Array.from(buckets.values())
    .map(bucket => buildEvolutionItem(bucket))
    .filter((item): item is PDIEvolutionItem => Boolean(item))
    .sort((a, b) => {
      const priority = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
      if (priority !== 0) return priority
      const delta = Math.abs(b.delta) - Math.abs(a.delta)
      if (delta !== 0) return delta
      return a.competencia.localeCompare(b.competencia, 'pt-BR')
    })

  return {
    comparavel: sessoes.length >= 2 && items.length > 0,
    totalSessoes: sessoes.length,
    items,
    highlights: {
      evoluindo: items.filter(item => item.status === 'evoluindo').slice(0, 3),
      estagnadas: items.filter(item => item.status === 'estagnado').slice(0, 3),
      quedas: items.filter(item => item.status === 'queda').slice(0, 3),
    },
  }
}

function buildEvolutionItem(bucket: CompetenciaBucket): PDIEvolutionItem | null {
  const pontos = [...bucket.pontos].sort((a, b) => pointTime(a) - pointTime(b))
  if (pontos.length < 2) return null

  const previous = pontos[pontos.length - 2]
  const current = pontos[pontos.length - 1]
  const delta = arredondar(current.nota - previous.nota)
  const status: PDIEvolutionStatus = delta > 0 ? 'evoluindo' : delta < 0 ? 'queda' : 'estagnado'
  const alvoAtual = Math.max(current.alvo || 10, 1)

  return {
    competenciaId: bucket.competenciaId,
    competencia: bucket.competencia,
    tipo: bucket.tipo,
    status,
    delta,
    notaAnterior: previous.nota,
    notaAtual: current.nota,
    alvoAtual,
    percentualAtual: Math.min((current.nota / alvoAtual) * 100, 100),
    pontos,
  }
}

function sessionTime(sessao: PDISessionSummary) {
  return parseDateTime(resolveSessionDate(sessao).raw)
}

function pointTime(point: PDIEvolutionPoint) {
  return parseDateTime(point.date)
}

function resolveSessionDate(sessao: PDISessionSummary) {
  const raw = sessao.data_realizacao || sessao.created_at || ''
  return {
    raw,
    label: formatDateLabel(raw),
  }
}

function parseDateTime(raw: string) {
  if (!raw) return 0
  const parsed = new Date(raw.length === 10 ? `${raw}T12:00:00` : raw).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

function formatDateLabel(raw: string) {
  if (!raw) return '--/--'
  const date = new Date(raw.length === 10 ? `${raw}T12:00:00` : raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function normalizarCompetencia(value?: string) {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function arredondar(value: number) {
  return Math.round(value * 10) / 10
}
