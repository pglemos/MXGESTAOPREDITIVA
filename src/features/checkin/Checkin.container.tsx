import { Calendar, CalendarDays, Edit3, Lock, Plus, Save, Trash2, Users } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'

const clients = [
  ['João Santos', '(11) 98765-4321', 'HB20 1.0 Comfort', 'R$ 68.900,00', '22/05/2025 10:00', 'Carteira', 'Sim', 'Sim', 'R$ 1.000,00', 'Aprovado', 'Sim'],
  ['Maria Oliveira', '(11) 91234-5678', 'T-Cross Comfortline', 'R$ 120.000,00', '22/05/2025 14:00', 'Internet', 'Não', 'Não', 'R$ 0,00', 'Não se aplica', 'Não'],
  ['Carlos Almeida', '(11) 99876-5432', 'Compass Longitude', 'R$ 145.900,00', '22/05/2025 16:00', 'Porta', 'Sim', 'Sim', 'R$ 5.000,00', 'Aprovado', 'Em negociação'],
  ['Fernanda Lima', '(11) 95555-1212', 'Nivus Highline', 'R$ 98.500,00', '22/05/2025 17:30', 'Internet', 'Não', 'Não', 'R$ 0,00', 'Recusado', 'Não'],
]

export function Checkin() {
  return (
    <main className="h-full w-full overflow-y-auto bg-white p-mx-md md:p-mx-lg no-scrollbar">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-mx-lg pb-24">
        <header className="flex items-center justify-between border-b border-border-subtle pb-mx-md">
          <div className="flex items-center gap-mx-sm">
            <Typography variant="h1" className="text-3xl uppercase leading-tight tracking-normal">Fechamento Diário</Typography>
            <span className="hidden items-center gap-mx-xs text-sm font-black md:flex"><Calendar size={17} /> 22/05/2025 (Quinta-feira)</span>
          </div>
          <button className="hidden rounded-mx-md border border-border-subtle px-mx-md py-mx-sm text-sm font-black md:inline-flex">Histórico de Fechamentos</button>
        </header>

        <section className="grid gap-mx-md xl:grid-cols-3">
          <CounterGroup title="1. Leads Recebidos Hoje" items={[['Canal Carteira', '12', <Users size={28} />], ['Canal Internet', '18', <CalendarDays size={28} />]]} />
          <CounterGroup title="2. Atendimentos Hoje" items={[['Showroom', '9', <Users size={28} />], ['Carteira', '14', <Users size={28} />], ['Internet', '21', <CalendarDays size={28} />]]} cols="3" />
          <CounterGroup title="3. Agendamento D+1" items={[['Carteira', '7', <Calendar size={28} />], ['Internet', '11', <CalendarDays size={28} />]]} />
        </section>

        <section>
          <div className="mb-mx-sm flex items-start justify-between gap-mx-md">
            <div>
              <Typography variant="h2" className="text-xl uppercase tracking-normal">5. Cadastrar Novo Cliente <span className="text-brand-primary">(Opcional)</span></Typography>
              <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Preenchimento opcional para aumentar sua pontuação de disciplina e enriquecer o histórico comercial.</Typography>
            </div>
            <Button><Plus size={16} /> Novo Cliente</Button>
          </div>
          <Card className="overflow-hidden rounded-mx-lg border border-border-subtle bg-white p-0 shadow-mx-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-left text-sm">
                <thead className="bg-surface-alt text-xs uppercase text-text-secondary">
                  <tr>
                    {['Nome do Cliente', 'Telefone', 'Veículo de Interesse', 'Valor Negociado', 'Data Agendamento', 'Canal', 'Compareceu', 'Carro Avaliado', 'Sinal (R$)', 'Financiamento', 'Venda Realizada', 'Ações'].map(label => <th key={label} className="px-mx-md py-mx-sm font-black">{label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {clients.map((row, index) => (
                    <tr key={row[0]} className="border-t border-border-subtle">
                      {row.map((cell, cellIndex) => (
                        <td key={`${row[0]}-${cellIndex}`} className="px-mx-md py-mx-sm">
                          {cellIndex >= 5 && cellIndex <= 10 ? <Pill value={String(cell)} /> : <span className="font-semibold text-text-secondary">{cell}</span>}
                        </td>
                      ))}
                      <td className="px-mx-md py-mx-sm">
                        <div className="flex gap-mx-xs"><Edit3 size={18} className="text-brand-primary" /><Trash2 size={18} className="text-status-error" /></div>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-brand-primary/10 bg-brand-primary/5">
                    <td colSpan={12} className="px-mx-md py-mx-sm">
                      <div className="grid gap-mx-md md:grid-cols-[280px_1fr_1.4fr_auto] md:items-center">
                        <Field label="Data do novo agendamento" value="25/05/2025 10:00" />
                        <Field label="Motivo da perda (se não realizou venda)" value="Não selecionado" />
                        <Field label="Observações" value="Cliente ficou de avaliar o usado e retornar." />
                        <Save className="text-brand-primary" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="border-t border-border-subtle px-mx-md py-mx-sm text-sm font-semibold text-text-secondary">
              Clientes cadastrados ajudam a aumentar sua pontuação em Disciplina (30% dos pontos).
            </div>
          </Card>
        </section>

        <section className="grid gap-mx-lg xl:grid-cols-[minmax(0,1fr)_390px_300px]">
          <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
            <Typography variant="h2" className="text-xl uppercase tracking-normal">Resumo do dia</Typography>
            <div className="mt-mx-md grid grid-cols-2 gap-mx-sm md:grid-cols-5">
              {[
                ['30', 'Leads Recebidos'], ['44', 'Atendimentos'], ['18', 'Agendamentos D+1'], ['2', 'Vendas Realizadas'], ['R$ 146.900,00', 'Faturamento'],
              ].map(([value, label]) => <Summary key={label} value={value} label={label} />)}
            </div>
          </Card>
          <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
            <Typography variant="h2" className="text-xl uppercase tracking-normal">Disciplina - Fechamento Diário</Typography>
            <div className="mt-mx-md grid grid-cols-[120px_1fr] items-center gap-mx-md">
              <Circle value={70} />
              <div><Typography variant="p" className="font-black">Você informou apenas as quantidades.</Typography><Typography variant="caption" tone="muted" className="normal-case tracking-normal">Preencha os dados completos de agendamentos e ganhe +30% da pontuação!</Typography><button className="mt-mx-xs text-sm font-black text-brand-primary">Saiba mais</button></div>
            </div>
          </Card>
          <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg text-center shadow-mx-sm">
            <Typography variant="h2" className="text-xl uppercase tracking-normal">Dica do dia</Typography>
            <Typography variant="p" tone="muted" className="mt-mx-md italic">“O sucesso é a soma de pequenos esforços repetidos dia após dia.”</Typography>
          </Card>
        </section>

        <div className="grid gap-mx-md lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <span />
          <button className="flex h-16 items-center justify-center gap-mx-sm rounded-mx-md bg-status-success px-mx-xl text-lg font-black uppercase text-white shadow-mx-sm"><Lock size={22} /> Finalizar fechamento do dia</button>
          <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Após finalizar, as informações serão enviadas para sua liderança e não poderão mais ser editadas.</Typography>
        </div>
      </div>
    </main>
  )
}

function CounterGroup({ title, items, cols = '2' }: { title: string; items: Array<[string, string, React.ReactNode]>; cols?: '2' | '3' }) {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <Typography variant="h2" className="text-lg uppercase tracking-normal">{title}</Typography>
      <div className={`mt-mx-md grid gap-mx-md ${cols === '3' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {items.map(([label, value, icon]) => (
          <div key={label} className="rounded-mx-md border border-border-subtle p-mx-md text-center">
            <Typography variant="p" className="font-black">{label}</Typography>
            <span className="mx-auto mt-mx-md grid h-16 w-16 place-items-center rounded-full bg-brand-primary/10 text-brand-primary">{icon}</span>
            <Typography variant="h1" className="mt-mx-sm text-4xl">{value}</Typography>
            <div className="mx-auto mt-mx-sm grid w-36 grid-cols-[36px_1fr_36px] overflow-hidden rounded-mx-sm border border-border-subtle">
              <button className="h-9 bg-white font-black">−</button><span className="grid place-items-center border-x border-border-subtle font-black">{value}</span><button className="h-9 bg-white font-black">+</button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Pill({ value }: { value: string }) {
  const cls = value === 'Sim' || value === 'Aprovado' ? 'bg-status-success-surface text-status-success' : value === 'Não' || value === 'Recusado' ? 'bg-status-error-surface text-status-error' : value === 'Internet' ? 'bg-status-info-surface text-status-info' : value === 'Porta' || value === 'Em negociação' ? 'bg-status-warning-surface text-status-warning' : 'bg-surface-alt text-text-secondary'
  return <span className={`rounded-mx-sm px-2 py-1 text-xs font-black ${cls}`}>{value}</span>
}

function Field({ label, value }: { label: string; value: string }) {
  return <label className="block"><span className="mb-1 block text-xs font-black text-text-secondary">{label}</span><span className="block rounded-mx-sm border border-border-subtle bg-white px-mx-sm py-mx-xs font-semibold text-text-secondary">{value}</span></label>
}

function Summary({ value, label }: { value: string; label: string }) {
  return <div className="rounded-mx-md border border-border-subtle p-mx-md text-center"><Typography variant="h2" className="text-2xl text-brand-primary">{value}</Typography><Typography variant="caption" tone="muted" className="normal-case tracking-normal">{label}</Typography></div>
}

function Circle({ value }: { value: number }) {
  return <div className="grid h-24 w-24 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-brand-primary) ${value * 3.6}deg, var(--color-border-subtle) 0deg)` }}><div className="grid h-16 w-16 place-items-center rounded-full bg-white"><span className="text-2xl font-black">{value}%</span></div></div>
}

export default Checkin
