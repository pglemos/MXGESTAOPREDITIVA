import { Briefcase, Calendar, Camera, Clock, DollarSign, GraduationCap, History, Mail, MapPin, Phone, ShieldCheck, Target, UserRound } from 'lucide-react'
import { Avatar } from '@/components/atoms/Avatar'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { useAuth } from '@/hooks/useAuth'

export function MeuPerfilVendedor() {
  const { profile } = useAuth()
  const name = profile?.name || 'João Silva'

  return (
    <main className="h-full w-full overflow-y-auto bg-white p-mx-md md:p-mx-lg no-scrollbar">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-mx-lg pb-20">
        <header className="flex items-center justify-between border-b border-border-subtle pb-mx-md">
          <div className="flex items-center gap-mx-sm">
            <UserRound size={36} className="text-text-primary" />
            <div>
              <Typography variant="h1" className="text-3xl uppercase leading-tight tracking-normal">Meu Perfil</Typography>
              <Typography variant="p" tone="muted" className="text-sm">Suas informações, metas e desenvolvimento.</Typography>
            </div>
          </div>
          <div className="hidden items-center gap-mx-sm md:flex">
            <span className="flex items-center gap-mx-xs text-sm font-black"><Calendar size={17} /> 22/05/2025 (Quinta-feira)</span>
            <button className="inline-flex h-11 items-center gap-mx-xs rounded-mx-md border border-border-subtle px-mx-md text-sm font-black"><History size={16} /> Histórico de Alterações</button>
          </div>
        </header>

        <section className="grid gap-mx-lg xl:grid-cols-[minmax(0,2.2fr)_minmax(360px,1fr)]">
          <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-xl shadow-mx-sm">
            <div className="grid gap-mx-xl md:grid-cols-[210px_1fr_1fr] md:items-center">
              <div className="relative w-fit">
                <Avatar src={profile?.avatar_url || undefined} fallback={name} alt={name} className="h-40 w-40 rounded-full" />
                <span className="absolute bottom-2 right-2 grid h-11 w-11 place-items-center rounded-full border border-border-subtle bg-white shadow-mx-sm"><Camera size={18} /></span>
              </div>
              <div>
                <Typography variant="h1" className="text-3xl leading-tight">{name}</Typography>
                <Typography variant="h3" className="mt-1 text-brand-primary">Vendedor</Typography>
                <div className="mt-mx-md space-y-mx-sm">
                  <Info icon={<Mail size={17} />} text={profile?.email || 'joaosilva@email.com'} />
                  <Info icon={<Phone size={17} />} text={profile?.phone || '(11) 98765-4321'} />
                  <Info icon={<MapPin size={17} />} text="Belo Horizonte - MG" />
                  <Info icon={<Calendar size={17} />} text="15/06/1990 (34 anos)" />
                </div>
              </div>
              <div className="space-y-mx-md">
                <Detail label="Empresa:" value="Auto Premium BH" />
                <Detail label="Cargo:" value="Vendedor" />
                <Detail label="Data de admissão:" value="10/03/2022" />
                <Detail label="Gestor:" value="Carlos Almeida" />
              </div>
            </div>
          </Card>

          <Panel icon={<Target size={25} />} title="Minhas Metas" subtitle="Acompanhe suas principais metas.">
            <div className="grid grid-cols-2 gap-mx-md text-center">
              <div><Typography variant="caption" tone="muted">Média de Vendas Ano</Typography><Typography variant="h1" className="mt-2 text-4xl text-brand-primary">120</Typography><Typography variant="caption" tone="muted">veículos</Typography></div>
              <div><Typography variant="caption" tone="muted">Meta de Remuneração</Typography><Typography variant="h1" className="mt-2 text-4xl text-status-success">R$ 120.000</Typography><Typography variant="caption" tone="muted">/ ano</Typography></div>
            </div>
            <button className="mt-mx-lg text-sm font-black text-brand-primary">Ver histórico de metas</button>
          </Panel>
        </section>

        <section className="grid gap-mx-lg xl:grid-cols-3">
          <Panel icon={<Clock size={24} />} title="Minha Rotina" subtitle="Seu horário de trabalho.">
            <div className="space-y-mx-sm">
              <Detail label="Entrada" value="08:00" />
              <Detail label="Almoço" value="12:00 às 13:00" />
              <Detail label="Saída" value="18:00" />
              <Detail label="Dias trabalhados" value="Segunda a Sábado" />
            </div>
            <div className="mt-mx-md rounded-mx-md bg-status-info-surface p-mx-sm text-sm font-black text-brand-primary">
              Esses horários definem sua Rotina do Dia na Central de Execução.
            </div>
          </Panel>

          <Panel icon={<Briefcase size={24} />} title="Meus Objetivos" subtitle="Onde quero chegar.">
            <Objective title="Curto prazo (até 1 ano)" text="Me tornar referência em vendas de semi-novos na minha loja." />
            <Objective title="Médio prazo (até 3 anos)" text="Ser promovido a consultor sênior e liderar um time de vendas." />
            <Objective title="Longo prazo (até 5 anos)" text="Abrir minha própria loja de veículos." />
          </Panel>

          <Panel icon={<GraduationCap size={24} />} title="Minha Formação" subtitle="Treinamentos e certificações.">
            <Detail label="Treinamentos concluídos" value="12" />
            <Detail label="Certificados conquistados" value="3" />
            <Detail label="Cursos externos" value="2" />
            <button className="mt-mx-md w-full rounded-mx-md border border-border-subtle px-mx-md py-mx-sm text-sm font-black text-brand-primary">Ver todos os treinamentos</button>
          </Panel>
        </section>

        <section className="grid gap-mx-lg xl:grid-cols-3">
          <Panel icon={<History size={24} />} title="Meu Histórico" subtitle="Acompanhe sua evolução.">
            <div className="grid grid-cols-3 gap-mx-sm">
              {[
                ['Vendas realizadas', '112', 'Total'], ['Média mensal', '9,3', 'Vendas/mês'], ['Melhor mês', '14', 'Vendas'],
                ['Score médio', '82', 'pontos'], ['Disciplina média', '89%', 'dos dias'], ['Treinamentos concluídos', '75%', 'da meta anual'],
              ].map(([label, value, hint]) => <Mini key={label} label={label} value={value} hint={hint} />)}
            </div>
            <button className="mt-mx-md text-sm font-black text-brand-primary">Ver histórico completo</button>
          </Panel>

          <Panel icon={<DollarSign size={24} />} title="Minha Remuneração" subtitle="Entenda sua composição e evolução.">
            <Detail label="Modelo" value="Comissão + Bônus" />
            <Detail label="Comissão média" value="R$ 6.250,00" />
            <Detail label="Bônus médio" value="R$ 2.200,00" />
            <div className="mt-mx-md flex items-center justify-between rounded-mx-md bg-status-success-surface p-mx-sm">
              <Typography variant="caption" className="font-black normal-case tracking-normal">Média de remuneração (12 meses)</Typography>
              <Typography variant="h2" className="text-2xl">R$ 8.450,00</Typography>
            </div>
            <button className="mt-mx-md text-sm font-black text-brand-primary">Ver detalhes da remuneração</button>
          </Panel>

          <Panel icon={<ShieldCheck size={24} />} title="Oportunidades de Carreira" subtitle="Avance na sua jornada.">
            <div className="rounded-mx-md bg-status-info-surface p-mx-md">
              <Typography variant="p" className="font-black text-brand-primary">Tenho interesse em receber oportunidades?</Typography>
              {['Não tenho interesse', 'Sim, apenas confidencialmente', 'Sim, estou disponível para o mercado'].map((item, index) => (
                <label key={item} className="mt-mx-xs flex items-center gap-mx-xs text-sm font-semibold text-text-secondary">
                  <input type="radio" checked={index === 0} readOnly /> {item}
                </label>
              ))}
            </div>
            <Detail label="Pretensão salarial" value="R$ 4.000 - R$ 6.000" />
            <Detail label="Cargos de interesse" value="Consultor Sênior, Supervisor de Vendas" />
            <Detail label="Cidades de interesse" value="Belo Horizonte - MG, Contagem - MG" />
          </Panel>
        </section>

        <footer className="flex items-center justify-center gap-mx-xs pb-mx-lg text-sm font-semibold text-text-secondary">
          <ShieldCheck size={16} /> Seus dados são protegidos e utilizados apenas dentro da plataforma MX Performance.
        </footer>
      </div>
    </main>
  )
}

function Panel({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="mb-mx-md flex items-start gap-mx-sm">
        <span className="text-brand-primary">{icon}</span>
        <div><Typography variant="h2" className="text-xl uppercase tracking-normal">{title}</Typography>{subtitle && <Typography variant="caption" tone="muted" className="normal-case tracking-normal">{subtitle}</Typography>}</div>
      </div>
      {children}
    </Card>
  )
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-center gap-mx-sm text-sm font-semibold text-text-secondary"><span className="text-text-primary">{icon}</span>{text}</div>
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-mx-md border-b border-border-subtle py-mx-xs last:border-b-0">
      <Typography variant="p" tone="muted" className="text-sm font-bold">{label}</Typography>
      <Typography variant="p" className="text-right text-sm font-black">{value}</Typography>
    </div>
  )
}

function Objective({ title, text }: { title: string; text: string }) {
  return <div className="border-b border-border-subtle py-mx-sm last:border-b-0"><Typography variant="p" className="font-black">{title}</Typography><Typography variant="caption" tone="muted" className="normal-case tracking-normal">{text}</Typography></div>
}

function Mini({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-mx-md border border-border-subtle bg-white p-mx-sm text-center">
      <Typography variant="tiny" className="font-black normal-case tracking-normal text-text-secondary">{label}</Typography>
      <Typography variant="h2" className="mt-2 text-2xl">{value}</Typography>
      <Typography variant="caption" tone="muted" className="normal-case tracking-normal">{hint}</Typography>
    </div>
  )
}

export default MeuPerfilVendedor
