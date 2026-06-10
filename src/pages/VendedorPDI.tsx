import { Award, Calendar, CheckCircle2, Edit3, Star, Target, Users, Wrench } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'

const technical = [
  ['Planejamento', '8,2'], ['Atendimento ao Cliente', '9,1'], ['Agendamento de Visitas', '7,4'], ['Fechamento de Venda', '8,3'],
  ['Carteira de Clientes', '7,8'], ['Mídias Sociais', '6,5'], ['Prospecção', '6,8'], ['Avaliação de Carro', '7,2'], ['Financiamentos', '7,6'], ['Processos', '8,0'],
]

const behavioral = [
  ['Pontualidade', '9,2'], ['Senso de Urgência', '8,6'], ['Iniciativa', '8,1'], ['Organização', '7,9'],
  ['Liderança', '6,8'], ['Relacionamento Interpessoal', '9,0'], ['Persistência', '8,2'], ['Resiliência', '8,4'],
]

const actions = [
  ['Realizar 10 contatos ativos por dia', 'Prospecção', 'Aumentar volume de prospecções diárias.', '30/06/2025', 'Em andamento', 60],
  ['Participar de 2 aulas sobre prospecção ativa', 'Prospecção', 'Aplicar técnicas aprendidas no dia a dia.', '25/05/2025', 'Em andamento', 50],
  ['Treinamento: Técnicas de Agendamento', 'Agendamento de Visitas', 'Melhorar taxa de agendamentos qualificados.', '15/05/2025', 'Concluída', 100],
  ['Aplicar script de atendimento padrão', 'Atendimento ao Cliente', 'Padronizar abordagem e aumentar conversão.', '30/05/2025', 'Em andamento', 40],
]

export default function VendedorPDI() {
  return (
    <main className="h-full w-full overflow-y-auto bg-white p-mx-md md:p-mx-lg no-scrollbar">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-mx-lg pb-20">
        <header className="flex items-center justify-between border-b border-border-subtle pb-mx-md">
          <div className="flex items-center gap-mx-sm">
            <Star size={34} className="text-text-primary" />
            <div>
              <Typography variant="h1" className="text-3xl uppercase leading-tight tracking-normal">PDI</Typography>
              <Typography variant="p" tone="muted" className="text-sm">Seu Plano de Desenvolvimento Individual</Typography>
            </div>
          </div>
          <div className="hidden items-center gap-mx-sm text-sm font-black text-text-primary md:flex">
            <Calendar size={17} /> 22/05/2025 (Quinta-feira)
          </div>
        </header>

        <section>
          <SectionHeading step="1" title="Conquistas" />
          <div className="mt-mx-sm grid gap-mx-md xl:grid-cols-3">
            <GoalCard tone="green" label="Curto prazo" value="1 ano" subtitle="Onde quero chegar nos próximos 12 meses." items={['Ser o vendedor número 1 da loja', 'Atingir R$ 1.200.000 em vendas', 'Ter 100% de satisfação dos clientes', 'Masterizar prospecção ativa']} />
            <GoalCard tone="orange" label="Médio prazo" value="2 anos" subtitle="Onde quero chegar nos próximos 2 anos." items={['Ser Gerente de Vendas', 'Atingir R$ 2.000.000 em vendas/ano', 'Formar e desenvolver minha equipe', 'Construir carteira com 300+ clientes']} />
            <GoalCard tone="purple" label="Longo prazo" value="3 anos" subtitle="Onde quero chegar nos próximos 3 anos." items={['Ser Diretor Comercial', 'Atingir R$ 3.000.000 em vendas/ano', 'Ser referência em gestão e liderança', 'Ter uma equipe de alta performance']} />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <SectionHeading step="2" title="Competências e Desenvolvimento" subtitle="Avaliação baseada nos feedbacks e desempenho atual. Seu alvo é atingir 10 em todas as competências." />
            <div className="hidden items-center gap-mx-md text-sm font-black md:flex">
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-status-success" /> Nota atual (6 - 10)</span>
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-brand-primary" /> Alvo</span>
            </div>
          </div>
          <div className="mt-mx-sm grid gap-mx-md xl:grid-cols-2">
            <CompetencyPanel icon={<Wrench size={18} />} title="Competências técnicas" rows={technical} />
            <CompetencyPanel icon={<Users size={18} />} title="Competências comportamentais" rows={behavioral} />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <SectionHeading step="3" title="Plano de Ação" subtitle="Ações práticas para desenvolver suas competências e alcançar suas conquistas." />
            <Button><Target size={16} /> Nova ação</Button>
          </div>
          <Card className="mt-mx-sm overflow-hidden rounded-mx-lg border border-border-subtle bg-white p-0 shadow-mx-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-surface-alt text-xs uppercase text-text-secondary">
                  <tr>
                    {['Ação', 'Competência', 'Descrição', 'Prazo', 'Status', 'Progresso'].map(label => <th key={label} className="px-mx-md py-mx-sm font-black">{label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {actions.map(([action, skill, desc, due, status, progress]) => (
                    <tr key={String(action)} className="border-t border-border-subtle">
                      <td className="px-mx-md py-mx-sm font-black text-text-primary">{action}</td>
                      <td className="px-mx-md py-mx-sm font-bold text-text-secondary">{skill}</td>
                      <td className="px-mx-md py-mx-sm text-text-secondary">{desc}</td>
                      <td className="px-mx-md py-mx-sm font-bold">{due}</td>
                      <td className="px-mx-md py-mx-sm"><span className="rounded-mx-sm bg-status-info-surface px-2 py-1 text-xs font-black text-status-info">{status}</span></td>
                      <td className="px-mx-md py-mx-sm">
                        <div className="flex items-center gap-mx-xs">
                          <span className="w-10 text-xs font-black">{progress}%</span>
                          <Progress value={Number(progress)} />
                        </div>
                      </td>
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

function SectionHeading({ step, title, subtitle }: { step: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-mx-sm">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-black text-white">{step}</span>
      <div>
        <Typography variant="h2" className="text-xl uppercase leading-tight tracking-normal">{title}</Typography>
        {subtitle && <Typography variant="caption" tone="muted" className="normal-case tracking-normal">{subtitle}</Typography>}
      </div>
    </div>
  )
}

function GoalCard({ tone, label, value, subtitle, items }: { tone: 'green' | 'orange' | 'purple'; label: string; value: string; subtitle: string; items: string[] }) {
  const toneClass = tone === 'green' ? 'bg-status-success-surface text-status-success' : tone === 'orange' ? 'bg-status-warning-surface text-status-warning' : 'bg-brand-primary/10 text-brand-primary'
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="grid gap-mx-md lg:grid-cols-[80px_1fr]">
        <span className={`flex h-16 w-16 items-center justify-center rounded-full ${toneClass}`}><Target size={32} /></span>
        <div className="grid gap-mx-sm md:grid-cols-[160px_1fr]">
          <div>
            <Typography variant="h3" className="text-sm uppercase tracking-normal">{label}</Typography>
            <Typography variant="h2" className={`mt-1 text-2xl uppercase ${tone === 'green' ? 'text-status-success' : tone === 'orange' ? 'text-status-warning' : 'text-brand-primary'}`}>{value}</Typography>
            <Typography variant="caption" tone="muted" className="mt-1 block normal-case tracking-normal">{subtitle}</Typography>
            <button className="mt-mx-md inline-flex items-center gap-mx-xs text-sm font-black text-brand-primary"><Edit3 size={15} /> Editar conquistas</button>
          </div>
          <ul className="space-y-mx-xs">
            {items.map(item => (
              <li key={item} className="flex items-center gap-mx-xs text-sm font-bold text-text-secondary">
                <CheckCircle2 size={16} className="text-status-success" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}

function CompetencyPanel({ icon, title, rows }: { icon: React.ReactNode; title: string; rows: string[][] }) {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="mb-mx-md flex items-center gap-mx-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-mx-md bg-status-success-surface text-status-success">{icon}</span>
        <Typography variant="h3" className="text-sm uppercase tracking-normal">{title}</Typography>
      </div>
      <div className="grid gap-x-mx-xl gap-y-mx-sm md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[1fr_42px_120px_28px] items-center gap-mx-xs">
            <Typography variant="caption" className="font-bold normal-case tracking-normal text-text-secondary">{label}</Typography>
            <span className="text-right text-sm font-black text-status-success">{value}</span>
            <Progress value={Number(value.replace(',', '.')) * 10} />
            <span className="text-right text-sm font-black text-brand-primary">10</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-surface-alt">
      <div className="h-2 rounded-full bg-status-success" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}
