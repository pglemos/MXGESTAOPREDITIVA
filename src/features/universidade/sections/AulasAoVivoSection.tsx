import { useState } from 'react'
import { toast } from 'sonner'
import { Video, CalendarDays, PlayCircle, Award, Clock, CheckCircle, FileQuestion, ExternalLink } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { EmptyState } from '@/components/atoms/EmptyState'
import { Modal } from '@/components/organisms/Modal'
import { cn } from '@/lib/utils'
import { useAulasAoVivo, type AulaAoVivo, type ProvaAula } from '@/hooks/useAulasAoVivo'

const dataHora = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

function Indicador({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <Card className="border-none bg-white p-mx-md shadow-mx-sm">
      <div className="flex items-center gap-mx-sm text-text-secondary">
        {icon}
        <Typography variant="caption" tone="muted" className="uppercase tracking-wide">{label}</Typography>
      </div>
      <Typography variant="h2" className="mt-mx-sm text-2xl">{value}</Typography>
      <Typography variant="caption" tone="muted">{hint}</Typography>
    </Card>
  )
}

export function AulasAoVivoSection() {
  const { proximaAula, futuras, gravacoes, indicadores, presencaPorAula, loading, error, getProva, submeterProva } = useAulasAoVivo()
  const [provaAula, setProvaAula] = useState<AulaAoVivo | null>(null)
  const [prova, setProva] = useState<ProvaAula | null>(null)
  const [respostas, setRespostas] = useState<number[]>([])
  const [enviando, setEnviando] = useState(false)

  async function abrirProva(aula: AulaAoVivo) {
    const { prova: p, error: e } = await getProva(aula.id)
    if (e || !p) { toast.error(e || 'Prova indisponível.'); return }
    if (p.questoes.length === 0) { toast.error('Esta aula ainda não tem questões cadastradas.'); return }
    setProvaAula(aula)
    setProva(p)
    setRespostas(new Array(p.questoes.length).fill(-1))
  }

  async function enviarProva() {
    if (!provaAula || !prova) return
    if (respostas.some(r => r < 0)) { toast.error('Responda todas as questões.'); return }
    setEnviando(true)
    const { resultado, error: e } = await submeterProva(provaAula.id, respostas)
    setEnviando(false)
    if (e || !resultado) { toast.error(e || 'Falha ao enviar a prova.'); return }
    if (resultado.aprovado) {
      toast.success(`Presença validada! Nota ${resultado.nota}% · +${resultado.pontos} pontos no Score.`)
    } else {
      toast.warning(`Nota ${resultado.nota}% — abaixo de ${prova.nota_minima}%. Revise o conteúdo e tente novamente.`)
    }
    setProvaAula(null)
    setProva(null)
  }

  return (
    <div className="flex flex-col gap-mx-lg">
      <section className="grid grid-cols-1 gap-mx-md sm:grid-cols-3" aria-label="Indicadores de aulas ao vivo">
        <Indicador icon={<CheckCircle size={18} />} label="Presenças validadas" value={String(indicadores.presencasValidadas)} hint="provas aprovadas" />
        <Indicador icon={<Award size={18} />} label="Média nas provas" value={indicadores.mediaProvas === null ? '—' : `${indicadores.mediaProvas}%`} hint={indicadores.mediaProvas === null ? 'nenhuma prova feita' : 'aproveitamento geral'} />
        <Indicador icon={<Video size={18} />} label="Pontos conquistados" value={String(indicadores.pontos)} hint="com aulas ao vivo" />
      </section>

      {error && <Typography className="text-status-error">{error}</Typography>}

      <Card className="border-none bg-white p-mx-lg shadow-mx-md">
        <div className="flex items-center gap-mx-sm"><Video size={18} /><Typography variant="h3" className="uppercase tracking-tight">Próxima Aula ao Vivo</Typography></div>
        {loading ? (
          <Typography tone="muted" className="mt-mx-md">Carregando aulas...</Typography>
        ) : proximaAula ? (
          <div className="mt-mx-md flex flex-col gap-mx-md rounded-mx-xl bg-sidebar-bg-strong p-mx-lg text-white md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <Badge variant={proximaAula.status === 'ao_vivo' ? 'success' : 'info'}>{proximaAula.status === 'ao_vivo' ? 'AO VIVO' : 'Agendada'}</Badge>
              <Typography variant="h3" tone="white" className="mt-mx-sm text-xl">{proximaAula.titulo}</Typography>
              {proximaAula.descricao && <Typography variant="caption" tone="white" className="mt-mx-tiny block normal-case opacity-80">{proximaAula.descricao}</Typography>}
              <span className="mt-mx-sm flex flex-wrap items-center gap-mx-md text-sm opacity-90">
                {proximaAula.instrutor && <span>Com {proximaAula.instrutor}</span>}
                <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> {dataHora(proximaAula.inicio)}</span>
                <span className="inline-flex items-center gap-1"><Clock size={14} /> {proximaAula.duracao_minutos} min</span>
              </span>
              <Typography variant="tiny" tone="white" className="mt-mx-sm block normal-case opacity-70">Sua presença será validada pela prova realizada após a aula.</Typography>
            </div>
            <div className="flex shrink-0 flex-col gap-mx-sm">
              {proximaAula.link_transmissao && (
                <Button asChild>
                  <a href={proximaAula.link_transmissao} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Participar da aula</a>
                </Button>
              )}
              <Button variant="outline" className="border-white/40 text-white hover:bg-white/10" onClick={() => abrirProva(proximaAula)}>
                <FileQuestion size={15} /> Fazer a prova
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Nenhuma aula ao vivo agendada"
            description="Quando sua loja ou a MX agendar uma aula, ela aparece aqui com link, prova e validação de presença."
          />
        )}
      </Card>

      <div className="grid grid-cols-1 gap-mx-lg xl:grid-cols-2">
        <Card className="border-none bg-white p-mx-lg shadow-mx-md">
          <div className="flex items-center gap-mx-sm"><CalendarDays size={18} /><Typography variant="h3" className="uppercase tracking-tight">Agenda de Aulas</Typography></div>
          <div className="mt-mx-md flex flex-col gap-mx-sm">
            {futuras.length === 0 && !loading && <Typography tone="muted" variant="caption">Sem próximas aulas na agenda.</Typography>}
            {futuras.map(aula => {
              const presenca = presencaPorAula.get(aula.id)
              return (
                <div key={aula.id} className="flex items-center gap-mx-sm rounded-mx-lg border border-border-subtle p-mx-sm">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-mx-lg bg-brand-primary/10 text-brand-primary">
                    <span className="text-base font-black leading-none">{new Date(aula.inicio).getDate()}</span>
                    <span className="text-[9px] font-black uppercase">{new Date(aula.inicio).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Typography variant="p" className="truncate font-bold">{aula.titulo}</Typography>
                    <Typography variant="caption" tone="muted" className="normal-case">
                      {dataHora(aula.inicio)}{aula.instrutor ? ` · Com ${aula.instrutor}` : ''}
                    </Typography>
                  </div>
                  {presenca?.aprovado && <Badge variant="success">Presença OK</Badge>}
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="border-none bg-white p-mx-lg shadow-mx-md">
          <div className="flex items-center gap-mx-sm"><PlayCircle size={18} /><Typography variant="h3" className="uppercase tracking-tight">Gravações Disponíveis</Typography></div>
          <div className="mt-mx-md flex flex-col gap-mx-sm">
            {gravacoes.length === 0 && !loading && <Typography tone="muted" variant="caption">Nenhuma gravação disponível ainda.</Typography>}
            {gravacoes.map(aula => {
              const presenca = presencaPorAula.get(aula.id)
              return (
                <div key={aula.id} className="flex items-center gap-mx-sm rounded-mx-lg border border-border-subtle p-mx-sm">
                  <PlayCircle size={22} className="shrink-0 text-brand-primary" />
                  <div className="min-w-0 flex-1">
                    <Typography variant="p" className="truncate font-bold">{aula.titulo}</Typography>
                    <Typography variant="caption" tone="muted" className="normal-case">
                      {new Date(aula.inicio).toLocaleDateString('pt-BR')}{aula.instrutor ? ` · ${aula.instrutor}` : ''} · {aula.duracao_minutos} min
                      {presenca?.nota !== null && presenca?.nota !== undefined ? ` · Nota ${presenca.nota}%` : ''}
                    </Typography>
                  </div>
                  <div className="flex shrink-0 items-center gap-mx-xs">
                    {presenca?.aprovado ? (
                      <Badge variant="success">Assistido</Badge>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => abrirProva(aula)}><FileQuestion size={14} /> Prova</Button>
                    )}
                    {aula.gravacao_url && (
                      <Button asChild variant="outline" size="sm">
                        <a href={aula.gravacao_url} target="_blank" rel="noreferrer">Assistir</a>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <Modal
        open={Boolean(provaAula && prova)}
        onClose={() => { setProvaAula(null); setProva(null) }}
        title={`Prova de presença — ${provaAula?.titulo ?? ''}`}
        description={prova ? `Acerte ${prova.nota_minima}% ou mais para validar sua presença e ganhar ${prova.pontos_score} pontos.` : undefined}
        footer={
          <div className="flex justify-end gap-mx-sm">
            <Button variant="ghost" onClick={() => { setProvaAula(null); setProva(null) }}>Cancelar</Button>
            <Button onClick={enviarProva} disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar respostas'}</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-mx-md">
          {prova?.questoes.map((questao, qIndex) => (
            <div key={qIndex}>
              <Typography variant="p" className="font-bold">{qIndex + 1}. {questao.pergunta}</Typography>
              <div className="mt-mx-xs flex flex-col gap-mx-tiny">
                {questao.opcoes.map((opcao, oIndex) => (
                  <button
                    key={oIndex}
                    type="button"
                    onClick={() => setRespostas(current => current.map((r, i) => i === qIndex ? oIndex : r))}
                    className={cn(
                      'rounded-mx-md border px-mx-md py-mx-xs text-left text-sm transition-colors',
                      respostas[qIndex] === oIndex
                        ? 'border-brand-primary bg-brand-primary/10 font-bold text-brand-primary'
                        : 'border-border-subtle text-text-secondary hover:bg-surface-alt',
                    )}
                  >
                    {opcao}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

export default AulasAoVivoSection
