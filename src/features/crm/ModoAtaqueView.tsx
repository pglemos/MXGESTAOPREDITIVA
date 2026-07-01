import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Clock, Copy, FileText, MessageCircle, Pause, Phone, Trophy, X, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import type { Cliente } from '@/lib/schemas/crm.schema'
import type { OportunidadeComCliente } from '@/features/crm/hooks/useOportunidades'
import type { CadenciaResultadoAcao } from '@/features/crm/lib/cadencia'
import { obterScriptSugerido } from '@/features/crm/lib/scriptTemplates'

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

  const [indice, setIndice] = useState(0)
  const [concluidos, setConcluidos] = useState(0)
  const [pausarOpen, setPausarOpen] = useState(false)
  const [scriptEditado, setScriptEditado] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const tempo = useCronometro()

  const clienteAtual = fila[indice] || null
  const veiculo = clienteAtual ? oportunidadePorCliente.get(clienteAtual.id)?.veiculo_interesse : null
  const scriptSugerido = clienteAtual ? obterScriptSugerido(clienteAtual.proxima_acao, clienteAtual.nome, veiculo) : ''
  const script = scriptEditado ?? scriptSugerido
  const tel = clienteAtual ? phoneDigits(clienteAtual.telefone) : ''
  const waUrl = tel ? `https://wa.me/55${tel}?text=${encodeURIComponent(script)}` : null

  const avancar = () => {
    setScriptEditado(null)
    if (indice + 1 >= fila.length) {
      setConcluidos(c => c + 1)
      setIndice(fila.length)
    } else {
      setConcluidos(c => c + 1)
      setIndice(i => i + 1)
    }
  }

  const handleCopiar = () => {
    navigator.clipboard.writeText(script)
    toast.success('Script copiado.')
  }

  const handleResultado = async (status: CadenciaResultadoAcao) => {
    if (!clienteAtual) return
    setSalvando(true)
    const { error } = await registrarStatusCadencia({ clienteId: clienteAtual.id, status })
    setSalvando(false)
    if (error) {
      toast.error(error)
      return
    }
    avancar()
  }

  const concluido = fila.length === 0 || indice >= fila.length

  if (concluido) {
    return (
      <div className="fixed inset-0 z-[200] overflow-y-auto bg-surface-alt">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-mx-md px-mx-md py-mx-xl text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-status-success/10 text-status-success">
            <Trophy size={32} />
          </span>
          <Typography variant="h2">
            {fila.length === 0 ? 'Nenhuma oportunidade ativa para atacar agora.' : 'Você concluiu a fila de hoje!'}
          </Typography>
          {fila.length > 0 && (
            <Typography variant="p" tone="muted">{concluidos} clientes trabalhados nessa sessão.</Typography>
          )}
          <Button className="w-full max-w-xs" onClick={onSair}>Voltar para a Carteira</Button>
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
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full">
                    <MessageCircle size={16} /> Abrir WhatsApp
                  </Button>
                </a>
              )}

              <div>
                <Typography variant="caption" tone="muted" className="mb-mx-xs block font-semibold uppercase tracking-widest">Resultado do contato</Typography>
                <div className="grid grid-cols-3 gap-mx-xs">
                  <Button variant="outline" disabled={salvando} onClick={() => handleResultado('feito')} className="border-status-success/30 text-status-success">
                    <Check size={14} /> Feito
                  </Button>
                  <Button variant="outline" disabled={salvando} onClick={() => handleResultado('aguardando')} className="border-status-warning/30 text-status-warning">
                    <Clock size={14} /> Aguardando
                  </Button>
                  <Button variant="outline" disabled={salvando} onClick={() => handleResultado('nao_feito')} className="border-status-error/30 text-status-error">
                    <X size={14} /> Não feito
                  </Button>
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
            <Typography variant="p" tone="muted">Sua posição na fila é perdida ao sair — dá para retomar pela Carteira normalmente.</Typography>
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
