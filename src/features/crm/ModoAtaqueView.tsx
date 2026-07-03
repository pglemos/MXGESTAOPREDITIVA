import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, FileText, MessageCircle, Pause, Phone, Trophy, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import type { Cliente } from '@/lib/schemas/crm.schema'
import type { OportunidadeComCliente } from '@/features/crm/hooks/useOportunidades'
import type { CadenciaResultadoAcao } from '@/features/crm/lib/cadencia'
import { aplicarTom, obterScriptSugerido, TONS, type ScriptTom } from '@/features/crm/lib/scriptTemplates'

const STORAGE_KEY = 'mx_modo_ataque'

type StatsSessao = { executadas: number; visitas: number; propostas: number; recuperacoes: number }

type ResultadoCard = {
  label: string
  emoji: string
  cor: 'green' | 'red' | 'slate' | 'blue' | 'orange' | 'teal' | 'yellow'
  status: CadenciaResultadoAcao
  statBucket?: 'visitas' | 'propostas' | 'recuperacoes'
}

const RESULTADOS_CARDS: ResultadoCard[] = [
  { label: 'Executado', emoji: '✅', cor: 'green', status: 'feito' },
  { label: 'Não atendeu', emoji: '🚫', cor: 'red', status: 'nao_feito' },
  { label: 'Não respondeu', emoji: '🔕', cor: 'slate', status: 'aguardando' },
  { label: 'Visita agendada', emoji: '📅', cor: 'blue', status: 'aguardando', statBucket: 'visitas' },
  { label: 'Proposta enviada', emoji: '📋', cor: 'orange', status: 'aguardando', statBucket: 'propostas' },
  { label: 'Remarcar', emoji: '🔄', cor: 'teal', status: 'aguardando', statBucket: 'recuperacoes' },
  { label: 'Perdeu interesse', emoji: '❌', cor: 'red', status: 'nao_feito' },
  { label: 'Venda realizada', emoji: '🏆', cor: 'yellow', status: 'feito' },
  { label: 'Outro', emoji: '💬', cor: 'slate', status: 'feito' },
]

const COR_MAP: Record<ResultadoCard['cor'], string> = {
  green: 'bg-white border-status-success/20 hover:bg-status-success-surface hover:border-status-success/40',
  red: 'bg-white border-status-error/20 hover:bg-status-error-surface hover:border-status-error/40',
  slate: 'bg-white border-border-subtle hover:bg-surface-alt',
  blue: 'bg-white border-status-info/20 hover:bg-status-info-surface hover:border-status-info/40',
  orange: 'bg-white border-status-warning/20 hover:bg-status-warning-surface hover:border-status-warning/40',
  teal: 'bg-white border-brand-primary/20 hover:bg-brand-primary/5 hover:border-brand-primary/40',
  yellow: 'bg-white border-status-warning/20 hover:bg-status-warning-surface hover:border-status-warning/40',
}

interface ModoAtaqueViewProps {
  clientes: Cliente[]
  oportunidadePorCliente: Map<string, OportunidadeComCliente>
  registrarStatusCadencia: (input: { clienteId: string; status: CadenciaResultadoAcao; observacao?: string | null }) => Promise<{ error: string | null }>
  onSair: () => void
  onAbrirFicha: (clienteId: string) => void
}

function phoneDigits(value: string | null | undefined): string {
  return (value || '').replace(/\D/g, '')
}

function diasAte(dataISO: string | null): number {
  if (!dataISO) return Infinity
  return Math.round((new Date(`${dataISO}T12:00:00`).getTime() - Date.now()) / 86400000)
}

function prioridadeCliente(cliente: Cliente): number {
  let score = diasAte(cliente.proxima_acao_em)
  if (cliente.relacionamento === 'critico') score -= 1000
  else if (cliente.relacionamento === 'ruim') score -= 500
  return score
}

function useCronometro() {
  const inicio = useRef(Date.now())
  const [texto, setTexto] = useState('00:00')
  useEffect(() => {
    const tick = () => {
      const diff = Math.floor((Date.now() - inicio.current) / 1000)
      setTexto(`${String(Math.floor(diff / 60)).padStart(2, '0')}:${String(diff % 60).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return texto
}

export function ModoAtaqueView({ clientes, oportunidadePorCliente, registrarStatusCadencia, onSair, onAbrirFicha }: ModoAtaqueViewProps) {
  const fila = useMemo(
    () => clientes
      .filter(cliente => ['oportunidade', 'ativo'].includes(cliente.status))
      .slice()
      .sort((a, b) => prioridadeCliente(a) - prioridadeCliente(b)),
    [clientes],
  )

  const [indice, setIndice] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (!saved) return 0
    try {
      const { indice: i } = JSON.parse(saved) as { indice: number }
      return typeof i === 'number' ? i : 0
    } catch {
      return 0
    }
  })
  const [concluidos, setConcluidos] = useState(0)
  const [pausarOpen, setPausarOpen] = useState(false)
  const [scriptEditado, setScriptEditado] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [stats, setStats] = useState<StatsSessao>({ executadas: 0, visitas: 0, propostas: 0, recuperacoes: 0 })
  const [voltouDoWhatsApp, setVoltouDoWhatsApp] = useState(false)
  const [tom, setTom] = useState<ScriptTom>('consultivo')
  const tempo = useCronometro()

  const clienteAtual = fila[indice] || null
  const veiculo = clienteAtual ? oportunidadePorCliente.get(clienteAtual.id)?.veiculo_interesse : null
  const scriptSugerido = clienteAtual ? obterScriptSugerido(clienteAtual.proxima_acao, clienteAtual.nome, veiculo) : ''
  const scriptComTom = clienteAtual ? aplicarTom(scriptSugerido, tom, clienteAtual.nome, veiculo) : ''
  const script = scriptEditado ?? scriptComTom
  const tel = clienteAtual ? phoneDigits(clienteAtual.telefone) : ''
  const waUrl = tel ? `https://wa.me/55${tel}?text=${encodeURIComponent(script)}` : null

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ indice }))
  }, [indice])

  const avancar = () => {
    setScriptEditado(null)
    setVoltouDoWhatsApp(false)
    setTom('consultivo')
    setConcluidos(c => c + 1)
    setIndice(i => (i + 1 >= fila.length ? fila.length : i + 1))
  }

  const handleCopiar = () => {
    navigator.clipboard.writeText(script)
    toast.success('Script copiado.')
  }

  const handleAbrirWhatsApp = () => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        setVoltouDoWhatsApp(true)
        document.removeEventListener('visibilitychange', onVisible)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
  }

  const handleResultado = async (card: ResultadoCard) => {
    if (!clienteAtual) return
    setSalvando(true)
    const { error } = await registrarStatusCadencia({ clienteId: clienteAtual.id, status: card.status })
    setSalvando(false)
    if (error) {
      toast.error(error)
      return
    }
    setStats(prev => ({
      executadas: prev.executadas + 1,
      visitas: prev.visitas + (card.statBucket === 'visitas' ? 1 : 0),
      propostas: prev.propostas + (card.statBucket === 'propostas' ? 1 : 0),
      recuperacoes: prev.recuperacoes + (card.statBucket === 'recuperacoes' ? 1 : 0),
    }))
    avancar()
  }

  const concluido = fila.length === 0 || indice >= fila.length

  if (concluido) {
    sessionStorage.removeItem(STORAGE_KEY)
    return (
      <div className="fixed inset-0 z-[200] overflow-y-auto bg-surface-alt">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-mx-md px-mx-md py-mx-xl text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-status-success/10 text-status-success">
            <Trophy size={32} />
          </span>
          <Typography variant="h2">
            {fila.length === 0 ? 'Nenhuma oportunidade ativa para atacar agora.' : 'Excelente! Você concluiu todas as oportunidades prioritárias de hoje.'}
          </Typography>
          {fila.length > 0 && (
            <div className="grid w-full max-w-lg grid-cols-2 gap-mx-sm sm:grid-cols-4">
              {[
                { label: 'Executadas', value: stats.executadas, tone: 'bg-status-info-surface text-status-info' },
                { label: 'Visitas geradas', value: stats.visitas, tone: 'bg-status-success-surface text-status-success' },
                { label: 'Propostas enviadas', value: stats.propostas, tone: 'bg-status-warning-surface text-status-warning' },
                { label: 'Remarcações', value: stats.recuperacoes, tone: 'bg-brand-primary/10 text-brand-primary' },
              ].map(s => (
                <div key={s.label} className={`rounded-mx-2xl p-mx-md ${s.tone}`}>
                  <p className="text-2xl font-black">{s.value}</p>
                  <p className="mt-1 text-[11px] font-semibold leading-snug">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex w-full max-w-sm flex-col gap-mx-xs">
            <Button className="w-full" onClick={onSair}>Voltar para a Carteira</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-[#0B1B2B]/95 backdrop-blur-sm">
      <div className="sticky top-0 z-10 bg-[#102C37] px-mx-md py-mx-sm text-white shadow-lg">
        <div className="mx-auto flex max-w-xl items-center gap-mx-sm">
          <span className="flex shrink-0 items-center gap-mx-xs text-sm font-black tracking-wide">
            <Zap size={16} className="text-brand-primary" /> MODO ATAQUE
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between text-[11px] text-white/70">
              <span>{indice + 1} de {fila.length} oportunidades</span>
              <span className="font-mono">{tempo}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${Math.round((indice / fila.length) * 100)}%` }} />
            </div>
          </div>
          <Button variant="ghost" className="shrink-0 text-white hover:bg-white/10" onClick={() => setPausarOpen(true)}>
            <Pause size={16} /> Pausar
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-mx-md py-mx-lg">
        {clienteAtual && (
          <Card className="overflow-hidden rounded-mx-2xl p-0">
            <div className="bg-gradient-to-br from-brand-primary to-brand-primary/80 p-mx-lg text-white">
              <div className="flex items-center gap-mx-sm">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-xl font-black">
                  {(clienteAtual.nome || '?').split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()}
                </span>
                <div className="min-w-0">
                  <Typography variant="h2" className="text-white">{clienteAtual.nome}</Typography>
                  <Typography variant="p" className="text-white/80">{veiculo || 'Veículo não informado'}</Typography>
                </div>
              </div>
            </div>

            <div className="space-y-mx-md p-mx-lg">
              <div className="rounded-mx-lg border border-status-warning/20 bg-status-warning-surface p-mx-sm">
                <Typography variant="caption" className="font-bold uppercase tracking-widest text-status-warning">Próxima ação</Typography>
                <Typography variant="p" className="mt-1 font-semibold text-text-primary">{clienteAtual.proxima_acao || 'Definir próximo passo'}</Typography>
              </div>

              <div>
                <Typography variant="caption" tone="muted" className="mb-mx-xs block font-semibold uppercase tracking-widest">Tom da mensagem</Typography>
                <div className="mb-mx-sm flex flex-wrap gap-1.5">
                  {TONS.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      title={t.desc}
                      onClick={() => { setTom(t.id); setScriptEditado(null) }}
                      className={`rounded-mx-lg border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                        tom === t.id
                          ? 'border-brand-primary bg-brand-primary text-white'
                          : 'border-border-subtle bg-white text-text-secondary hover:border-brand-primary/40 hover:text-brand-primary'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <Typography variant="caption" tone="muted" className="mb-mx-xs block font-semibold uppercase tracking-widest">Script sugerido</Typography>
                <textarea
                  value={script}
                  onChange={event => setScriptEditado(event.target.value)}
                  rows={5}
                  className="w-full resize-none rounded-mx-lg border border-border-subtle bg-surface-alt p-mx-sm text-sm text-text-primary outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                />
              </div>

              <div className="grid grid-cols-3 gap-mx-xs">
                {tel && (
                  <a href={`tel:+55${tel}`} className="flex flex-col items-center gap-1.5 rounded-mx-lg border border-border-subtle bg-white py-mx-sm hover:bg-surface-alt">
                    <Phone size={16} className="text-text-secondary" />
                    <Typography variant="caption" className="font-semibold">Ligar</Typography>
                  </a>
                )}
                <button type="button" onClick={handleCopiar} className="flex flex-col items-center gap-1.5 rounded-mx-lg border border-border-subtle bg-white py-mx-sm hover:bg-surface-alt">
                  <Copy size={16} className="text-text-secondary" />
                  <Typography variant="caption" className="font-semibold">Copiar</Typography>
                </button>
                <button type="button" onClick={() => onAbrirFicha(clienteAtual.id)} className="flex flex-col items-center gap-1.5 rounded-mx-lg border border-border-subtle bg-white py-mx-sm hover:bg-surface-alt">
                  <FileText size={16} className="text-text-secondary" />
                  <Typography variant="caption" className="font-semibold">Ficha</Typography>
                </button>
              </div>

              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block" onClick={handleAbrirWhatsApp}>
                  <Button variant="whatsapp" className="w-full">
                    <MessageCircle size={16} /> Abrir WhatsApp
                  </Button>
                </a>
              )}

              <div className={voltouDoWhatsApp ? 'rounded-mx-lg ring-4 ring-brand-primary/20 transition-shadow' : ''}>
                <Typography variant="caption" tone="muted" className="mb-mx-xs block font-semibold uppercase tracking-widest">
                  {voltouDoWhatsApp ? 'Como terminou esse contato?' : 'Resultado do contato'}
                </Typography>
                <div className="grid grid-cols-3 gap-mx-xs">
                  {RESULTADOS_CARDS.map(card => (
                    <button
                      key={card.label}
                      type="button"
                      disabled={salvando}
                      onClick={() => handleResultado(card)}
                      className={`flex flex-col items-center gap-1 rounded-mx-lg border-2 px-2 py-3 transition-all disabled:opacity-50 ${COR_MAP[card.cor]}`}
                    >
                      <span className="text-2xl leading-none">{card.emoji}</span>
                      <span className="text-center text-[10px] font-semibold leading-tight">{card.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={avancar} className="w-full text-center text-xs font-semibold text-text-tertiary hover:underline">
                Pular sem registrar resultado
              </button>
            </div>
          </Card>
        )}
      </div>

      {pausarOpen && (
        <div className="fixed inset-0 z-[210] grid place-items-center bg-black/50 p-4">
          <Card className="w-full max-w-xs space-y-mx-sm rounded-mx-2xl p-mx-lg text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-status-warning/10 text-status-warning">
              <Pause size={20} />
            </span>
            <Typography variant="h3">Pausar o Modo Ataque?</Typography>
            <Typography variant="p" tone="muted">Sua posição na fila é salva. Você continua de onde parou.</Typography>
            <div className="flex flex-col gap-mx-xs pt-mx-xs">
              <Button onClick={() => setPausarOpen(false)}>Continuar atacando</Button>
              <Button variant="outline" onClick={onSair}>Sair do Modo Ataque</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
