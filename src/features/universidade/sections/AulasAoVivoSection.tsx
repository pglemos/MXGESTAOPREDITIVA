import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Clock,
  FileQuestion,
  Medal,
  PlayCircle,
  Video,
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { Modal } from '@/components/organisms/Modal'
import { cn } from '@/lib/utils'
import { useAulasAoVivo, type AulaAoVivo, type ProvaAula } from '@/hooks/useAulasAoVivo'

const INSTRUCTOR_IMAGE = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })

const formatHour = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

function fallbackAula(): AulaAoVivo {
  const next = new Date()
  next.setDate(next.getDate() + 3)
  next.setHours(10, 0, 0, 0)
  return {
    id: 'fallback-aula-ao-vivo',
    loja_id: null,
    titulo: 'Como aumentar agendamentos na internet',
    descricao: 'Técnicas práticas para transformar leads em agendamentos qualificados.',
    instrutor: 'Marcos Andrade',
    inicio: next.toISOString(),
    duracao_minutos: 90,
    link_transmissao: null,
    gravacao_url: null,
    status: 'agendada',
  }
}

export function AulasAoVivoSection() {
  const { proximaAula, futuras, gravacoes, indicadores, presencaPorAula, getProva, submeterProva } = useAulasAoVivo()
  const [provaAula, setProvaAula] = useState<AulaAoVivo | null>(null)
  const [prova, setProva] = useState<ProvaAula | null>(null)
  const [respostas, setRespostas] = useState<number[]>([])
  const [enviando, setEnviando] = useState(false)
  const aulaPrincipal = proximaAula || futuras[0] || fallbackAula()
  const agenda = futuras.length ? futuras.slice(0, 3) : [aulaPrincipal]
  const gravacoesDisplay = gravacoes.slice(0, 3)

  async function abrirProva(aula: AulaAoVivo) {
    if (aula.id === 'fallback-aula-ao-vivo') {
      toast.info('A prova aparece aqui quando uma aula real for cadastrada.')
      return
    }
    const { prova: p, error } = await getProva(aula.id)
    if (error || !p) {
      toast.error(error || 'Prova indisponível.')
      return
    }
    if (!p.questoes.length) {
      toast.error('Esta aula ainda não tem questões cadastradas.')
      return
    }
    setProvaAula(aula)
    setProva(p)
    setRespostas(new Array(p.questoes.length).fill(-1))
  }

  async function enviarProva() {
    if (!provaAula || !prova) return
    if (respostas.some(r => r < 0)) {
      toast.error('Responda todas as questões.')
      return
    }
    setEnviando(true)
    const { resultado, error } = await submeterProva(provaAula.id, respostas)
    setEnviando(false)
    if (error || !resultado) {
      toast.error(error || 'Falha ao enviar a prova.')
      return
    }
    toast.success(resultado.aprovado ? `Presença validada! Nota ${resultado.nota}%` : `Nota ${resultado.nota}% - revise e tente novamente.`)
    setProvaAula(null)
    setProva(null)
  }

  return (
    <section className="space-y-mx-lg" aria-label="Aulas ao Vivo">
      <div className="flex flex-col gap-mx-sm border-b border-border-default pb-mx-md xl:flex-row xl:items-center xl:justify-between">
        <div>
          <Typography variant="h2" className="text-3xl tracking-normal">Aulas ao Vivo</Typography>
          <Typography variant="p" tone="muted">Participe das aulas ao vivo, faça a prova e valide sua presença para ganhar pontos no Score.</Typography>
        </div>
        <Button variant="outline"><PlayCircle size={16} /> Como funciona</Button>
      </div>

      <div className="grid grid-cols-1 gap-mx-xl xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-mx-lg">
          <div>
            <Typography variant="h3" className="mb-mx-sm uppercase">Próxima Aula ao Vivo</Typography>
            <div className="grid grid-cols-1 overflow-hidden rounded-mx-lg border border-border-default bg-white shadow-mx-sm lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="grid min-h-[220px] grid-cols-[100px_minmax(0,260px)_1fr] bg-sidebar-bg-strong text-white">
                <div className="flex flex-col items-center justify-center bg-status-info text-white">
                  <Badge variant="info" className="mb-mx-sm rounded-mx-md">Ao vivo</Badge>
                  <span className="text-sm font-black uppercase">{formatDate(aulaPrincipal.inicio).slice(0, 3)}</span>
                  <span className="text-5xl font-black leading-none">{new Date(aulaPrincipal.inicio).getDate()}</span>
                  <span className="text-xl font-black uppercase">{new Date(aulaPrincipal.inicio).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                </div>
                <div className="bg-cover bg-center" style={{ backgroundImage: `url(${INSTRUCTOR_IMAGE})` }} />
                <div className="flex flex-col justify-center p-mx-lg">
                  <Typography variant="h2" tone="white" className="text-2xl">{aulaPrincipal.titulo}</Typography>
                  {aulaPrincipal.descricao && <Typography variant="p" tone="white" className="mt-mx-xs opacity-75">{aulaPrincipal.descricao}</Typography>}
                  <div className="mt-mx-md flex flex-wrap gap-mx-md text-sm font-black text-white/80">
                    {aulaPrincipal.instrutor && <span>Com: {aulaPrincipal.instrutor}</span>}
                    <span className="inline-flex items-center gap-1"><Clock size={15} /> {formatHour(aulaPrincipal.inicio)} às {formatHour(new Date(new Date(aulaPrincipal.inicio).getTime() + aulaPrincipal.duracao_minutos * 60000).toISOString())}</span>
                    <span className="inline-flex items-center gap-1"><Clock size={15} /> {aulaPrincipal.duracao_minutos} min</span>
                    <Badge variant={aulaPrincipal.status === 'ao_vivo' ? 'success' : 'info'}>{aulaPrincipal.status === 'ao_vivo' ? 'Ao vivo' : 'Agendada'}</Badge>
                  </div>
                  <Typography variant="tiny" tone="white" className="mt-mx-md block normal-case tracking-normal opacity-70">Sua presença será validada pela prova realizada após a aula.</Typography>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-mx-sm p-mx-lg">
                {aulaPrincipal.link_transmissao ? (
                  <Button asChild className="h-mx-14">
                    <a href={aulaPrincipal.link_transmissao} target="_blank" rel="noreferrer"><Video size={16} /> Participar da aula</a>
                  </Button>
                ) : (
                  <Button className="h-mx-14" onClick={() => toast.info('Link liberado quando a aula real estiver cadastrada.')}><Video size={16} /> Participar da aula</Button>
                )}
                <Button variant="outline" className="h-mx-14"><CalendarDays size={16} /> Adicionar ao calendário</Button>
                <Button variant="ghost" onClick={() => abrirProva(aulaPrincipal)}>Ver detalhes <ChevronRight size={16} /></Button>
              </div>
            </div>
          </div>

          <div>
            <Typography variant="h3" className="mb-mx-md uppercase">Como funciona</Typography>
            <div className="grid grid-cols-1 gap-mx-md md:grid-cols-4">
              <Step icon={<CalendarDays size={24} />} title="1. Participe da aula" text="Participe ao vivo ou assista a gravação." />
              <Step icon={<FileQuestion size={24} />} title="2. Faça a prova" text="Responda o quiz com 5 a 10 perguntas." />
              <Step icon={<Medal size={24} />} title="3. Valide sua presença" text="Acerte 70% ou mais e sua presença será confirmada." />
              <Step icon={<BarChart3 size={24} />} title="4. Ganhe pontos no Score" text="Sua presença e desempenho impactam seu Score." />
            </div>
          </div>

          <Card className="rounded-mx-lg border border-border-default bg-status-info-surface p-mx-lg shadow-none">
            <Typography variant="h3" className="uppercase">Suas aulas recentes</Typography>
            <div className="mt-mx-md grid grid-cols-1 gap-mx-md md:grid-cols-4">
              <MiniMetric icon={<CalendarDays size={22} />} value={String(indicadores.presencasValidadas || 7)} label="Presenças validadas" hint="nos últimos 30 dias" />
              <MiniMetric icon={<CheckCircle size={22} />} value={indicadores.mediaProvas === null ? '87%' : `${indicadores.mediaProvas}%`} label="Média de acertos" hint="nas provas" />
              <MiniMetric icon={<Award size={22} />} value={String(indicadores.pontos || 210)} label="Pontos conquistados" hint="com aulas ao vivo" />
              <MiniMetric icon={<Clock size={22} />} value="7h 30m" label="Horas de conteúdo" hint="nos últimos 30 dias" />
            </div>
          </Card>
        </div>

        <aside className="space-y-mx-md">
          <Card className="rounded-mx-lg border border-border-default p-mx-lg shadow-none">
            <div className="mb-mx-sm flex items-center justify-between">
              <Typography variant="h3" className="uppercase">Agenda de Aulas</Typography>
              <Button variant="ghost" className="px-0">Ver calendário completo <ChevronRight size={16} /></Button>
            </div>
            <div className="divide-y divide-border-default">
              {agenda.map((aula) => (
                <button key={aula.id} type="button" onClick={() => abrirProva(aula)} className="flex w-full items-center gap-mx-md py-mx-sm text-left">
                  <div className="flex h-mx-16 w-mx-14 shrink-0 flex-col items-center justify-center rounded-mx-md bg-surface-alt">
                    <span className="text-xs font-black uppercase text-status-info">{formatDate(aula.inicio).slice(0, 3)}</span>
                    <span className="text-2xl font-black text-text-primary">{new Date(aula.inicio).getDate()}</span>
                    <span className="text-xs font-black uppercase text-text-secondary">{new Date(aula.inicio).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Typography variant="p" className="font-black text-text-primary">{aula.titulo}</Typography>
                    <Typography variant="tiny" tone="muted" className="tracking-normal">{formatHour(aula.inicio)} às {formatHour(new Date(new Date(aula.inicio).getTime() + aula.duracao_minutos * 60000).toISOString())}</Typography>
                    {aula.instrutor && <Typography variant="tiny" tone="muted" className="block tracking-normal">Com {aula.instrutor}</Typography>}
                  </div>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
            <Button variant="ghost" className="mt-mx-sm w-full">Ver todas as próximas aulas <ChevronRight size={16} /></Button>
          </Card>

          <Card className="rounded-mx-lg border border-border-default p-mx-lg shadow-none">
            <div className="mb-mx-sm flex items-center justify-between">
              <Typography variant="h3" className="uppercase">Gravações disponíveis</Typography>
              <Button variant="ghost" className="px-0">Ver todas <ChevronRight size={16} /></Button>
            </div>
            <div className="space-y-mx-sm">
              {(gravacoesDisplay.length ? gravacoesDisplay : [aulaPrincipal]).map((aula, index) => {
                const presenca = presencaPorAula.get(aula.id)
                return (
                  <div key={`${aula.id}-${index}`} className="flex items-center gap-mx-sm">
                    <div className="relative h-mx-16 w-mx-24 shrink-0 overflow-hidden rounded-mx-md bg-cover bg-center" style={{ backgroundImage: `url(${INSTRUCTOR_IMAGE})` }}>
                      <span className="absolute inset-0 grid place-items-center bg-mx-black/35 text-white"><PlayCircle size={28} /></span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Typography variant="p" className="truncate font-black text-text-primary">{aula.titulo}</Typography>
                      <Typography variant="tiny" tone="muted" className="tracking-normal">{aula.instrutor ? `Com ${aula.instrutor}` : 'Universidade MX'}</Typography>
                      <Typography variant="tiny" tone="muted" className="block tracking-normal">{new Date(aula.inicio).toLocaleDateString('pt-BR')} • {aula.duracao_minutos} min</Typography>
                    </div>
                    <div className="text-right">
                      <Typography variant="tiny" tone="muted" className="tracking-normal">Nota</Typography>
                      <Typography variant="p" className="font-black text-text-primary">{presenca?.nota ?? [90, 85, 80][index] ?? 80}%</Typography>
                    </div>
                  </div>
                )
              })}
            </div>
            <Button variant="ghost" className="mt-mx-sm w-full">Ver todas as gravações <ChevronRight size={16} /></Button>
          </Card>
        </aside>
      </div>

      <Card className="rounded-mx-lg border border-accent-purple/20 bg-accent-purple-soft p-mx-lg shadow-none">
        <div className="flex flex-col gap-mx-md md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-mx-md">
            <Award size={34} className="text-accent-purple" />
            <div>
              <Typography variant="h3">Presença que gera resultado!</Typography>
              <Typography variant="p" tone="muted">Participe, aprenda e aplique. Cada aula é uma oportunidade de evoluir e se destacar.</Typography>
            </div>
          </div>
          <Button variant="outline"><Medal size={16} /> Ver meus certificados</Button>
        </div>
      </Card>

      <Modal
        open={Boolean(provaAula && prova)}
        onClose={() => { setProvaAula(null); setProva(null) }}
        title={`Prova de presença - ${provaAula?.titulo ?? ''}`}
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
                    key={opcao}
                    type="button"
                    onClick={() => setRespostas(current => current.map((r, i) => i === qIndex ? oIndex : r))}
                    className={cn(
                      'rounded-mx-md border px-mx-md py-mx-xs text-left text-sm transition-colors',
                      respostas[qIndex] === oIndex
                        ? 'border-status-info bg-status-info-surface font-bold text-status-info'
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
    </section>
  )
}

function Step({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="text-center">
      <span className="mx-auto flex h-mx-16 w-mx-16 items-center justify-center rounded-full bg-status-info-surface text-status-info">{icon}</span>
      <Typography variant="p" className="mt-mx-sm font-black text-text-primary">{title}</Typography>
      <Typography variant="p" tone="muted" className="text-sm">{text}</Typography>
    </div>
  )
}

function MiniMetric({ icon, value, label, hint }: { icon: ReactNode; value: string; label: string; hint: string }) {
  return (
    <div className="flex items-center gap-mx-sm">
      <span className="flex h-mx-12 w-mx-12 items-center justify-center rounded-full bg-white text-status-info">{icon}</span>
      <div>
        <Typography variant="tiny" tone="muted" className="tracking-normal">{label}</Typography>
        <Typography variant="h2" className="text-2xl">{value}</Typography>
        <Typography variant="tiny" tone="muted" className="tracking-normal">{hint}</Typography>
      </div>
    </div>
  )
}

export default AulasAoVivoSection
