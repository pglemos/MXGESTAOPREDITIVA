import { ArrowRight, BookOpen, CheckSquare, MessageSquare, Sparkles, Target, Users } from 'lucide-react'
import { SellerPageHeader } from '@/components/seller/SellerPageHeader'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'

const guidance = [
  { title: 'Reunião matinal', description: 'Alinhe a prioridade do dia, os clientes críticos e o ritmo necessário da loja.', icon: Users },
  { title: 'Cobrança de fechamento', description: 'Confirme a pendência, combine um horário e registre a orientação sem lançar pelo vendedor.', icon: CheckSquare },
  { title: 'Feedback individual', description: 'Descreva o comportamento observado, seu impacto e o compromisso acordado.', icon: MessageSquare },
  { title: 'Recuperação de meta', description: 'Converta o gap em ritmo diário e priorize os canais com melhor conversão real.', icon: Target },
]

export default function ManagerMentor() {
  return (
    <main className="min-h-full bg-surface-alt p-mx-md sm:p-mx-lg" id="main-content"><div className="mx-auto flex w-full max-w-[1680px] flex-col gap-mx-lg pb-20">
      <SellerPageHeader icon={BookOpen} title="Mentor Gerencial" subtitle="Orientações objetivas para conduzir a operação comercial" />
      <Card className="overflow-hidden rounded-mx-2xl border border-brand-primary/20 bg-brand-secondary p-mx-lg text-white shadow-mx-lg sm:p-mx-xl">
        <div className="flex flex-col justify-between gap-mx-lg md:flex-row md:items-end">
          <div className="max-w-3xl"><div className="mb-mx-md inline-flex items-center gap-mx-xs rounded-mx-full bg-brand-primary/15 px-mx-sm py-mx-xs text-xs font-bold uppercase text-brand-primary"><Sparkles size={15}/> orientação do dia</div><Typography variant="h2" className="text-2xl text-white sm:text-3xl">Conduza a equipe com clareza e ação</Typography><Typography variant="p" className="mt-mx-sm max-w-2xl text-sidebar-text">Use os rituais abaixo para transformar sinais da operação em conversas objetivas, compromissos e acompanhamento.</Typography></div>
          <div className="grid h-mx-20 w-mx-20 shrink-0 place-items-center rounded-mx-2xl bg-brand-primary text-white shadow-mx-md"><BookOpen size={34} aria-hidden="true" /></div>
        </div>
      </Card>
      <section aria-labelledby="mentor-library-title"><div className="mb-mx-md flex items-end justify-between gap-mx-md"><div><Typography id="mentor-library-title" variant="h3">Biblioteca de orientações</Typography><Typography variant="caption" tone="muted">Rituais práticos, baseados em regras e dados reais.</Typography></div><span className="hidden rounded-mx-full bg-status-success-surface px-mx-sm py-mx-xs text-xs font-bold text-status-success sm:inline">4 roteiros disponíveis</span></div>
        <div className="grid grid-cols-1 gap-mx-md md:grid-cols-2">
        {guidance.map(({ title, description, icon: Icon }, index) => (
          <Card key={title} className="group flex min-h-mx-40 flex-col justify-between rounded-mx-xl border border-border-subtle bg-white p-mx-lg shadow-mx-sm transition-shadow hover:shadow-mx-md">
            <div><div className="flex items-start justify-between"><span className="grid h-mx-12 w-mx-12 place-items-center rounded-mx-xl bg-accent-blue-soft text-brand-primary"><Icon aria-hidden="true" /></span><span className="text-xs font-black text-text-tertiary">0{index + 1}</span></div><Typography variant="h3" className="mt-mx-md">{title}</Typography><Typography variant="p" tone="muted" className="mt-mx-xs">{description}</Typography></div>
            <div className="mt-mx-md flex items-center gap-mx-xs text-xs font-bold text-brand-primary">Aplicar na próxima conversa <ArrowRight size={15} aria-hidden="true" /></div>
          </Card>
        ))}
        </div>
      </section>
    </div></main>
  )
}
