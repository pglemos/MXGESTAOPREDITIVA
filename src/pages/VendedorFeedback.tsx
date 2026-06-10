import { AlertCircle, Bell, Calendar, CheckCircle2, MessageSquare, ThumbsUp, TrendingUp } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'

const pending = [
  ['15', 'MAI', '2025', 'Desenvolvimento', 'Prospecção', 'Você possui bom relacionamento com os clientes, porém está realizando poucas prospecções ativas. Sua meta é realizar 5 contatos por dia e registrar no CRM.'],
  ['10', 'MAI', '2025', 'Desenvolvimento', 'Agendamento de Visitas', 'Sua taxa de agendamento está abaixo da média da equipe. Foque em qualificar melhor os leads e sugerir horários alternativos para aumentar as chances de visita.'],
  ['07', 'MAI', '2025', 'Positivo', 'Atendimento ao Cliente', 'Parabéns pelo excelente atendimento! Você demonstra empatia, escuta ativa e consegue gerar conexão com o cliente de forma natural. Continue assim!'],
]

const history = [
  ['03/05/2025', 'Positivo', 'Relacionamento Interpessoal', 'Excelente parceria com a equipe e troca de informações. Você colabora e ajuda os colegas.', 'Pedro Almeida', '03/05/2025 às 16:45', 'Obrigado! Fico feliz com o reconhecimento.'],
  ['28/04/2025', 'Desenvolvimento', 'Fechamento de Venda', 'Você tem conduzido bem as negociações, mas ainda pode trabalhar melhor os fechamentos, criando mais urgência e senso de oportunidade.', 'Pedro Almeida', '28/04/2025 às 11:32', 'Entendi! Vou aplicar mais gatilhos de urgência.'],
  ['20/04/2025', 'Positivo', 'Carteira de Clientes', 'Parabéns pela organização da sua carteira! Clientes ativos e bem acompanhados.', 'Pedro Almeida', '20/04/2025 às 09:18', '—'],
  ['12/04/2025', 'Desenvolvimento', 'Mídias Sociais', 'Precisamos aumentar sua frequência de publicações e interações para gerar mais autoridade e leads.', 'Pedro Almeida', '12/04/2025 às 14:20', 'Vou criar um cronograma de postagens.'],
]

export default function VendedorFeedback() {
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
            <span className="flex items-center gap-mx-xs text-sm font-black"><Calendar size={17} /> 22/05/2025 (Quinta-feira)</span>
            <span className="relative"><Bell size={21} /><b className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-status-error text-[10px] text-white">3</b></span>
          </div>
        </header>

        <section className="grid gap-mx-sm md:grid-cols-2 xl:grid-cols-5">
          <Metric icon={<MessageSquare size={22} />} label="Feedbacks recebidos" value="18" detail="nos últimos 90 dias" tone="blue" action="Ver todos" />
          <Metric icon={<ThumbsUp size={22} />} label="Positivos" value="12" detail="67% do total" tone="green" action="Ver detalhes" />
          <Metric icon={<TrendingUp size={22} />} label="Desenvolvimento" value="6" detail="33% do total" tone="orange" action="Ver detalhes" />
          <Metric icon={<AlertCircle size={22} />} label="Pendentes" value="3" detail="aguardando sua confirmação" tone="red" action="Ver pendentes" />
          <Metric icon={<CheckCircle2 size={22} />} label="Engajamento com feedback" value="95%" detail="dos feedbacks confirmados" tone="purple" action="Entenda o cálculo" />
        </section>

        <div className="grid gap-mx-lg xl:grid-cols-[minmax(0,1fr)_330px]">
          <section>
            <div className="mb-mx-sm flex items-center justify-between">
              <div>
                <Typography variant="h2" className="text-xl uppercase tracking-normal">Feedbacks pendentes <span className="ml-2 rounded-full bg-status-error px-2 py-0.5 text-xs text-white">3</span></Typography>
                <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Leia os feedbacks abaixo e confirme que você leu e compreendeu.</Typography>
              </div>
              <button className="hidden text-sm font-black text-brand-primary md:inline">Ver todos os feedbacks pendentes</button>
            </div>
            <Card className="overflow-hidden rounded-mx-lg border border-border-subtle bg-white p-0 shadow-mx-sm">
              {pending.map(item => (
                <div key={`${item[0]}-${item[4]}`} className="grid gap-mx-md border-b border-border-subtle p-mx-md last:border-b-0 lg:grid-cols-[70px_170px_1fr_180px_190px] lg:items-center">
                  <div className="text-center">
                    <Typography variant="h2" className="text-2xl leading-none">{item[0]}</Typography>
                    <Typography variant="tiny" className="block font-black uppercase tracking-normal">{item[1]}</Typography>
                    <Typography variant="tiny" tone="muted" className="block font-black tracking-normal">{item[2]}</Typography>
                  </div>
                  <div>
                    <span className={`rounded-mx-sm px-2 py-1 text-xs font-black ${item[3] === 'Positivo' ? 'bg-status-success-surface text-status-success' : 'bg-status-warning-surface text-status-warning'}`}>{item[3]}</span>
                    <Typography variant="caption" tone="muted" className="mt-mx-sm block normal-case tracking-normal">Competência</Typography>
                    <Typography variant="p" className="font-black">{item[4]}</Typography>
                  </div>
                  <div>
                    <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Comentário do seu líder</Typography>
                    <Typography variant="p" className="mt-1 text-sm font-semibold leading-relaxed text-text-secondary">{item[5]}</Typography>
                  </div>
                  <div>
                    <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Responsável</Typography>
                    <div className="mt-1 flex items-center gap-mx-sm">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-primary/10 font-black text-brand-primary">PA</span>
                      <div><Typography variant="p" className="font-black">Pedro Almeida</Typography><Typography variant="tiny" tone="muted">Gerente Comercial</Typography></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-mx-xs">
                    <Button><CheckCircle2 size={16} /> Li e compreendi</Button>
                    <button className="text-sm font-black text-brand-primary">Deixar comentário</button>
                  </div>
                </div>
              ))}
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
            <select className="h-10 rounded-mx-md border border-border-subtle bg-white px-mx-sm text-sm font-bold">
              <option>Todos os tipos</option>
            </select>
          </div>
          <Card className="overflow-hidden rounded-mx-lg border border-border-subtle bg-white p-0 shadow-mx-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-surface-alt text-xs uppercase text-text-secondary">
                  <tr>{['Data', 'Tipo', 'Competência', 'Feedback', 'Responsável', 'Confirmado em', 'Meu comentário'].map(label => <th key={label} className="px-mx-md py-mx-sm font-black">{label}</th>)}</tr>
                </thead>
                <tbody>
                  {history.map(row => (
                    <tr key={`${row[0]}-${row[2]}`} className="border-t border-border-subtle">
                      <td className="px-mx-md py-mx-sm font-bold">{row[0]}</td>
                      <td className="px-mx-md py-mx-sm"><span className={`rounded-mx-sm px-2 py-1 text-xs font-black ${row[1] === 'Positivo' ? 'bg-status-success-surface text-status-success' : 'bg-status-warning-surface text-status-warning'}`}>{row[1]}</span></td>
                      <td className="px-mx-md py-mx-sm font-black">{row[2]}</td>
                      <td className="px-mx-md py-mx-sm text-text-secondary">{row[3]}</td>
                      <td className="px-mx-md py-mx-sm font-bold">{row[4]}</td>
                      <td className="px-mx-md py-mx-sm"><span className="inline-flex items-center gap-mx-xs font-bold text-status-success"><CheckCircle2 size={15} /> {row[5]}</span></td>
                      <td className="px-mx-md py-mx-sm text-text-secondary">{row[6]}</td>
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

function Metric({ icon, label, value, detail, tone, action }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: 'blue' | 'green' | 'orange' | 'red' | 'purple'; action: string }) {
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
          <button className="mt-mx-sm block text-sm font-black text-brand-primary">{action}</button>
        </div>
      </div>
    </Card>
  )
}
