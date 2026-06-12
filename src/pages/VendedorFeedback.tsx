import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AlertCircle, Bell, Calendar, CheckCircle2, MessageSquare, ThumbsUp, TrendingUp } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { useFeedbacks } from '@/hooks/useData'
import type { Feedback as Devolutiva } from '@/types/database'

type DevolutivaComNomes = Devolutiva & { manager?: { name: string } | null }

const MES_CURTO = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']

const textoPrincipal = (f: Devolutiva) => f.action || f.attention_points || f.positives || 'Sem comentário registrado.'

export default function VendedorFeedback() {
  const { devolutivas, loading, acknowledge } = useFeedbacks()
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)
  const [comentarioAbertoId, setComentarioAbertoId] = useState<string | null>(null)
  const [comentarios, setComentarios] = useState<Record<string, string>>({})
  const [filtro, setFiltro] = useState<'todos' | 'pendentes' | 'confirmados'>('todos')

  const lista = devolutivas as DevolutivaComNomes[]
  const pendentes = useMemo(() => lista.filter(f => !f.acknowledged), [lista])
  const positivos = useMemo(() => lista.filter(f => Boolean(f.positives?.trim())).length, [lista])
  const desenvolvimento = useMemo(() => lista.filter(f => Boolean(f.attention_points?.trim())).length, [lista])
  const engajamento = lista.length > 0 ? Math.round(((lista.length - pendentes.length) / lista.length) * 100) : null
  const historico = useMemo(() => {
    if (filtro === 'pendentes') return lista.filter(f => !f.acknowledged)
    if (filtro === 'confirmados') return lista.filter(f => f.acknowledged)
    return lista
  }, [filtro, lista])

  const hojeLabel = `${new Date().toLocaleDateString('pt-BR')} (${new Date().toLocaleDateString('pt-BR', { weekday: 'long' })})`

  async function confirmar(id: string) {
    setConfirmandoId(id)
    try {
      const { error } = await acknowledge({ id, sellerComment: comentarios[id] })
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Leitura confirmada. Seu líder será notificado.')
      setComentarioAbertoId(current => (current === id ? null : current))
    } catch {
      toast.error('Não foi possível confirmar agora. Tente novamente.')
    } finally {
      setConfirmandoId(null)
    }
  }

  return (
    <main className="h-full w-full overflow-y-auto bg-white p-mx-md md:p-mx-lg no-scrollbar">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-mx-lg pb-20">
        <header className="flex items-center justify-between border-b border-border-subtle pb-mx-md">
          <div className="flex items-center gap-mx-sm">
            <MessageSquare size={34} className="text-text-primary" />
            <div>
              <Typography variant="h1" className="text-3xl uppercase leading-tight tracking-normal">Feedback</Typography>
              <Typography variant="p" tone="muted" className="text-sm">Receba feedbacks, leia com atenção e confirme para que possamos acompanhar seu desenvolvimento.</Typography>
            </div>
          </div>
          <div className="hidden items-center gap-mx-lg md:flex">
            <span className="flex items-center gap-mx-xs text-sm font-black"><Calendar size={17} /> {hojeLabel}</span>
            <span className="relative">
              <Bell size={21} />
              {pendentes.length > 0 && <b className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-status-error text-[10px] text-white">{pendentes.length}</b>}
            </span>
          </div>
        </header>

        <section className="grid gap-mx-sm md:grid-cols-2 xl:grid-cols-5">
          <Metric icon={<MessageSquare size={22} />} label="Feedbacks recebidos" value={String(lista.length)} detail="devolutivas do seu líder" tone="blue" />
          <Metric icon={<ThumbsUp size={22} />} label="Com pontos positivos" value={String(positivos)} detail={lista.length > 0 ? `${Math.round((positivos / lista.length) * 100)}% do total` : 'sem feedbacks ainda'} tone="green" />
          <Metric icon={<TrendingUp size={22} />} label="Com pontos de desenvolvimento" value={String(desenvolvimento)} detail={lista.length > 0 ? `${Math.round((desenvolvimento / lista.length) * 100)}% do total` : 'sem feedbacks ainda'} tone="orange" />
          <Metric icon={<AlertCircle size={22} />} label="Pendentes" value={String(pendentes.length)} detail="aguardando sua confirmação" tone="red" />
          <Metric icon={<CheckCircle2 size={22} />} label="Engajamento com feedback" value={engajamento === null ? '—' : `${engajamento}%`} detail={engajamento === null ? 'sem base de cálculo' : 'dos feedbacks confirmados'} tone="purple" />
        </section>

        <div className="grid gap-mx-lg xl:grid-cols-[minmax(0,1fr)_330px]">
          <section>
            <div className="mb-mx-sm flex items-center justify-between">
              <div>
                <Typography variant="h2" className="text-xl uppercase tracking-normal">
                  Feedbacks pendentes
                  {pendentes.length > 0 && <span className="ml-2 rounded-full bg-status-error px-2 py-0.5 text-xs text-white">{pendentes.length}</span>}
                </Typography>
                <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Leia os feedbacks abaixo e confirme que você leu e compreendeu.</Typography>
              </div>
            </div>
            <Card className="overflow-hidden rounded-mx-lg border border-border-subtle bg-white p-0 shadow-mx-sm">
              {loading && lista.length === 0 && (
                <Typography tone="muted" className="p-mx-md">Carregando feedbacks...</Typography>
              )}
              {!loading && pendentes.length === 0 && (
                <div className="p-mx-lg text-center">
                  <CheckCircle2 size={28} className="mx-auto text-status-success" />
                  <Typography variant="p" className="mt-mx-sm font-black">Tudo confirmado!</Typography>
                  <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Nenhum feedback aguardando sua leitura.</Typography>
                </div>
              )}
              {pendentes.map(item => {
                const data = new Date(item.created_at)
                return (
                  <div key={item.id} className="grid gap-mx-md border-b border-border-subtle p-mx-md last:border-b-0 lg:grid-cols-[70px_170px_1fr_180px_190px] lg:items-center">
                    <div className="text-center">
                      <Typography variant="h2" className="text-2xl leading-none">{String(data.getDate()).padStart(2, '0')}</Typography>
                      <Typography variant="tiny" className="block font-black uppercase tracking-normal">{MES_CURTO[data.getMonth()]}</Typography>
                      <Typography variant="tiny" tone="muted" className="block font-black tracking-normal">{data.getFullYear()}</Typography>
                    </div>
                    <div>
                      <span className={`rounded-mx-sm px-2 py-1 text-xs font-black ${item.attention_points?.trim() ? 'bg-status-warning-surface text-status-warning' : 'bg-status-success-surface text-status-success'}`}>
                        {item.attention_points?.trim() ? 'Desenvolvimento' : 'Positivo'}
                      </span>
                      <Typography variant="caption" tone="muted" className="mt-mx-sm block normal-case tracking-normal">Referência</Typography>
                      <Typography variant="p" className="font-black">Semana {item.week_reference}</Typography>
                    </div>
                    <div>
                      <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Comentário do seu líder</Typography>
                      <Typography variant="p" className="mt-1 text-sm font-semibold leading-relaxed text-text-secondary">{textoPrincipal(item)}</Typography>
                    </div>
                    <div>
                      <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Responsável</Typography>
                      <div className="mt-1 flex items-center gap-mx-sm">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-primary/10 font-black text-brand-primary">
                          {(item.manager?.name || 'G').split(' ').map(p => p[0]).slice(0, 2).join('')}
                        </span>
                        <div>
                          <Typography variant="p" className="font-black">{item.manager?.name || 'Seu gestor'}</Typography>
                          <Typography variant="tiny" tone="muted">Gestão</Typography>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-mx-xs">
                      <Button onClick={() => confirmar(item.id)} disabled={confirmandoId === item.id}>
                        <CheckCircle2 size={16} /> {confirmandoId === item.id ? 'Confirmando...' : 'Li e compreendi'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setComentarioAbertoId(current => (current === item.id ? null : item.id))}
                        className="text-sm font-black text-brand-primary"
                      >
                        {comentarioAbertoId === item.id ? 'Ocultar comentário' : 'Deixar comentário'}
                      </button>
                      {comentarioAbertoId === item.id && (
                        <textarea
                          aria-label="Meu comentário (opcional)"
                          value={comentarios[item.id] || ''}
                          onChange={e => setComentarios(current => ({ ...current, [item.id]: e.target.value }))}
                          placeholder="Meu comentário (opcional) — enviado junto com a confirmação."
                          rows={3}
                          className="w-full rounded-mx-md border border-border-subtle p-mx-sm text-sm"
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </Card>
          </section>

          <aside>
            <Card className="rounded-mx-lg border border-brand-primary/10 bg-brand-primary/5 p-mx-lg shadow-mx-sm">
              <div className="mb-mx-md flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary"><CheckCircle2 size={30} /></div>
              <Typography variant="h2" className="text-xl leading-tight">Por que é importante confirmar seus feedbacks?</Typography>
              <ul className="mt-mx-md space-y-mx-sm text-sm font-semibold text-text-secondary">
                {['Garante que você está alinhado com as expectativas.', 'Ajuda a direcionar seu plano de desenvolvimento.', 'Fortalece a comunicação com seu líder.', 'Impacta diretamente na sua evolução e resultados.'].map(text => (
                  <li key={text} className="flex gap-mx-xs"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-status-success" /> {text}</li>
                ))}
              </ul>
              <div className="mt-mx-lg rounded-mx-md bg-status-info-surface p-mx-sm text-sm font-black text-brand-primary">
                Ao confirmar, o feedback será registrado e seu líder saberá que você leu e compreendeu.
              </div>
            </Card>
          </aside>
        </div>

        <section>
          <div className="mb-mx-sm flex items-center justify-between">
            <div>
              <Typography variant="h2" className="text-xl uppercase tracking-normal">Histórico de Feedbacks</Typography>
              <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Acompanhe todos os feedbacks que você já recebeu.</Typography>
            </div>
            <select
              aria-label="Filtrar feedbacks"
              value={filtro}
              onChange={e => setFiltro(e.target.value as typeof filtro)}
              className="h-10 rounded-mx-md border border-border-subtle bg-white px-mx-sm text-sm font-bold"
            >
              <option value="todos">Todos</option>
              <option value="pendentes">Pendentes</option>
              <option value="confirmados">Confirmados</option>
            </select>
          </div>
          <Card className="overflow-hidden rounded-mx-lg border border-border-subtle bg-white p-0 shadow-mx-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-surface-alt text-xs uppercase text-text-secondary">
                  <tr>{['Data', 'Tipo', 'Referência', 'Feedback', 'Responsável', 'Confirmação', 'Meu comentário'].map(label => <th key={label} className="px-mx-md py-mx-sm font-black">{label}</th>)}</tr>
                </thead>
                <tbody>
                  {historico.length === 0 && (
                    <tr><td colSpan={7} className="px-mx-md py-mx-lg text-center text-text-tertiary">Nenhum feedback neste filtro.</td></tr>
                  )}
                  {historico.map(row => (
                    <tr key={row.id} className="border-t border-border-subtle">
                      <td className="px-mx-md py-mx-sm font-bold">{new Date(row.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="px-mx-md py-mx-sm">
                        <span className={`rounded-mx-sm px-2 py-1 text-xs font-black ${row.attention_points?.trim() ? 'bg-status-warning-surface text-status-warning' : 'bg-status-success-surface text-status-success'}`}>
                          {row.attention_points?.trim() ? 'Desenvolvimento' : 'Positivo'}
                        </span>
                      </td>
                      <td className="px-mx-md py-mx-sm font-black">Semana {row.week_reference}</td>
                      <td className="px-mx-md py-mx-sm text-text-secondary">{textoPrincipal(row)}</td>
                      <td className="px-mx-md py-mx-sm font-bold">{row.manager?.name || 'Seu gestor'}</td>
                      <td className="px-mx-md py-mx-sm">
                        {row.acknowledged && row.acknowledged_at ? (
                          <span className="inline-flex items-center gap-mx-xs font-bold text-status-success"><CheckCircle2 size={15} /> {new Date(row.acknowledged_at).toLocaleDateString('pt-BR')}</span>
                        ) : (
                          <span className="font-bold text-status-warning">Pendente</span>
                        )}
                      </td>
                      <td className="px-mx-md py-mx-sm text-text-secondary">{row.seller_comment || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </div>
    </main>
  )
}

function Metric({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: 'blue' | 'green' | 'orange' | 'red' | 'purple' }) {
  const toneClass = {
    blue: 'bg-brand-primary/10 text-brand-primary',
    green: 'bg-status-success-surface text-status-success',
    orange: 'bg-status-warning-surface text-status-warning',
    red: 'bg-status-error-surface text-status-error',
    purple: 'bg-brand-primary/10 text-brand-primary',
  }[tone]
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="flex items-start gap-mx-sm">
        <span className={`flex h-12 w-12 items-center justify-center rounded-full ${toneClass}`}>{icon}</span>
        <div>
          <Typography variant="tiny" className="font-black uppercase tracking-normal text-text-secondary">{label}</Typography>
          <Typography variant="h2" className={`mt-1 text-3xl ${tone === 'red' ? 'text-status-error' : ''}`}>{value}</Typography>
          <Typography variant="caption" tone="muted" className="normal-case tracking-normal">{detail}</Typography>
        </div>
      </div>
    </Card>
  )
}
