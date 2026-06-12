import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Store, Users, Globe, UserPlus, CalendarClock, Lightbulb, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'
import { FormField } from '@/components/molecules/FormField'
import { useAuth } from '@/hooks/useAuth'
import { useAtendimentos } from '@/features/crm/hooks/useAtendimentos'
import { useClientes } from '@/features/crm/hooks/useClientes'
import { useOportunidades } from '@/features/crm/hooks/useOportunidades'
import { useAgendamentos } from '@/features/crm/hooks/useAgendamentos'
import { useMyCheckins, calculateReferenceDate } from '@/hooks/checkins'
import { calculateDailyRoutineDiscipline } from '@/lib/daily-routine'
import {
  CRM_CANAIS, CRM_CANAL_LABEL,
  toDateOnlyBR,
  type CrmCanal,
} from '@/lib/schemas/crm.schema'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

function SectionTitle({ numero, titulo, extra }: { numero: string; titulo: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="mb-mx-sm flex items-center justify-between gap-mx-md">
      <Typography variant="h2" className="text-lg uppercase tracking-normal">{numero}. {titulo}</Typography>
      {extra}
    </div>
  )
}

function ChannelCounter({ icon, label, value, tone, onAdd, onRemove, hint }: {
  icon: React.ReactNode
  label: string
  value: number
  tone: 'green' | 'blue' | 'orange'
  onAdd?: () => void
  onRemove?: () => void
  hint?: string
}) {
  const toneClass = {
    green: 'bg-status-success-surface text-status-success',
    blue: 'bg-status-info-surface text-status-info',
    orange: 'bg-status-warning-surface text-status-warning',
  }[tone]
  return (
    <div className="rounded-mx-md border border-border-subtle bg-white p-mx-md text-center">
      <Typography variant="p" className="font-black">{label}</Typography>
      <span className={`mx-auto mt-mx-sm grid h-14 w-14 place-items-center rounded-full ${toneClass}`}>{icon}</span>
      <Typography variant="h1" className="mt-mx-sm text-4xl">{value}</Typography>
      {onAdd && onRemove ? (
        <div className="mx-auto mt-mx-sm grid w-32 grid-cols-[36px_1fr_36px] overflow-hidden rounded-mx-sm border border-border-subtle">
          <button type="button" aria-label={`Remover ${label}`} onClick={onRemove} className="h-9 bg-white font-black hover:bg-status-error-surface">−</button>
          <span className="grid place-items-center border-x border-border-subtle font-black">{value}</span>
          <button type="button" aria-label={`Adicionar ${label}`} onClick={onAdd} className="h-9 bg-white font-black hover:bg-status-success-surface">+</button>
        </div>
      ) : (
        hint && <Typography variant="tiny" tone="muted" className="mt-mx-sm block normal-case tracking-normal">{hint}</Typography>
      )}
    </div>
  )
}

export function CheckinCrmSection() {
  const { profile } = useAuth()
  const { porCanal, registrarAtendimento, removerUltimoAtendimento } = useAtendimentos()
  const { clientes, createCliente } = useClientes()
  const { funil, createOportunidade } = useOportunidades()
  const { agendamentos } = useAgendamentos()
  const { checkins } = useMyCheckins()

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [canal, setCanal] = useState<CrmCanal | ''>('')
  const [veiculo, setVeiculo] = useState('')
  const [valor, setValor] = useState('')
  const [saving, setSaving] = useState(false)

  const hojeStr = toDateOnlyBR()
  const amanhaStr = toDateOnlyBR(new Date(Date.now() + 86400000))
  const leadsHoje = (c: CrmCanal) =>
    clientes.filter(cliente => cliente.canal_origem === c && cliente.created_at && toDateOnlyBR(new Date(cliente.created_at)) === hojeStr).length
  const agendamentosAmanha = (c: CrmCanal) =>
    agendamentos.filter(a => a.canal === c && toDateOnlyBR(new Date(a.data_hora)) === amanhaStr).length
  const leadsHojeTotal = leadsHoje('carteira') + leadsHoje('internet')
  const agendamentosAmanhaTotal = agendamentosAmanha('carteira') + agendamentosAmanha('internet')

  // Disciplina real: fechamentos feitos nos últimos 7 dias de rotina.
  const disciplina = useMemo(() => {
    if (!profile?.id) return null
    const base = calculateReferenceDate()
    const end = new Date(`${base}T12:00:00`)
    const referenceDates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(end)
      date.setDate(end.getDate() - (6 - index))
      return date.toISOString().slice(0, 10)
    })
    return calculateDailyRoutineDiscipline({ referenceDates, checkins, sellerId: profile.id })
  }, [checkins, profile?.id])

  async function handleRegistrar(c: CrmCanal) {
    const { error } = await registrarAtendimento(c)
    if (error) { toast.error(error); return }
    toast.success(`Atendimento (${CRM_CANAL_LABEL[c]}) registrado.`)
  }

  async function handleRemover(c: CrmCanal) {
    const { error } = await removerUltimoAtendimento(c)
    if (error) { toast.error(error); return }
    toast.success(`Atendimento (${CRM_CANAL_LABEL[c]}) removido.`)
  }

  async function handleCadastrar() {
    if (!nome.trim()) { toast.error('Informe o nome do cliente.'); return }
    setSaving(true)
    const { error, id } = await createCliente({
      nome,
      telefone,
      canal_origem: canal || null,
      status: veiculo || valor ? 'oportunidade' : 'aguardando_contato',
      potencial_negocio: Number(valor) || 0,
    })
    if (error) { setSaving(false); toast.error(error); return }
    // Se informou veículo/valor, já cria a oportunidade vinculada
    if (id && (veiculo.trim() || Number(valor) > 0)) {
      const { error: oppErr } = await createOportunidade({
        cliente_id: id,
        veiculo_interesse: veiculo,
        valor_negociado: Number(valor) || 0,
        etapa: 'prospeccao',
        canal: canal || null,
      })
      if (oppErr) toast.error(`Cliente criado, mas a oportunidade falhou: ${oppErr}`)
    }
    setSaving(false)
    toast.success('Cliente cadastrado na carteira.')
    setNome(''); setTelefone(''); setCanal(''); setVeiculo(''); setValor('')
  }

  return (
    <div className="flex flex-col gap-mx-lg">
      <section className="grid gap-mx-md xl:grid-cols-[2fr_3fr_2fr]" aria-label="Indicadores do dia por canal">
        <div>
          <SectionTitle numero="1" titulo="Leads Recebidos Hoje" />
          <Card className="border-none bg-white p-mx-md shadow-mx-md">
            <div className="grid grid-cols-2 gap-mx-md">
              <ChannelCounter icon={<Users size={24} />} label="Canal Carteira" value={leadsHoje('carteira')} tone="green" hint="clientes cadastrados hoje" />
              <ChannelCounter icon={<Globe size={24} />} label="Canal Internet" value={leadsHoje('internet')} tone="blue" hint="clientes cadastrados hoje" />
            </div>
          </Card>
        </div>
        <div>
          <SectionTitle numero="2" titulo="Atendimentos Hoje" />
          <Card className="border-none bg-white p-mx-md shadow-mx-md">
            <div className="grid grid-cols-3 gap-mx-md">
              <ChannelCounter icon={<Store size={24} />} label="Showroom" value={porCanal.showroom} tone="orange" onAdd={() => handleRegistrar('showroom')} onRemove={() => handleRemover('showroom')} />
              <ChannelCounter icon={<Users size={24} />} label="Carteira" value={porCanal.carteira} tone="green" onAdd={() => handleRegistrar('carteira')} onRemove={() => handleRemover('carteira')} />
              <ChannelCounter icon={<Globe size={24} />} label="Internet" value={porCanal.internet} tone="blue" onAdd={() => handleRegistrar('internet')} onRemove={() => handleRemover('internet')} />
            </div>
            <Typography variant="tiny" tone="muted" className="mt-mx-sm block text-center normal-case tracking-normal">
              Porta: {porCanal.porta} <button type="button" className="font-black text-brand-primary" onClick={() => handleRegistrar('porta')}>+ registrar</button>
            </Typography>
          </Card>
        </div>
        <div>
          <SectionTitle numero="3" titulo="Agendamento D+1" />
          <Card className="border-none bg-white p-mx-md shadow-mx-md">
            <div className="grid grid-cols-2 gap-mx-md">
              <ChannelCounter icon={<CalendarClock size={24} />} label="Carteira" value={agendamentosAmanha('carteira')} tone="green" hint="agendados para amanhã" />
              <ChannelCounter icon={<CalendarClock size={24} />} label="Internet" value={agendamentosAmanha('internet')} tone="blue" hint="agendados para amanhã" />
            </div>
            <Typography variant="tiny" tone="muted" className="mt-mx-sm block text-center normal-case tracking-normal">
              Crie agendamentos na <Link to="/central-execucao" className="font-black text-brand-primary">Central de Execução</Link>.
            </Typography>
          </Card>
        </div>
      </section>

      <section aria-label="Cadastrar novo cliente">
        <SectionTitle
          numero="5"
          titulo={<>Cadastrar Novo Cliente <span className="text-brand-primary">(Opcional)</span></>}
        />
        <Card className="border-none bg-white p-mx-lg shadow-mx-md">
          <div className="flex items-center gap-mx-sm"><UserPlus size={18} /><Typography variant="caption" tone="muted" className="normal-case tracking-normal">Preenchimento opcional para enriquecer sua carteira, seu funil e o histórico comercial.</Typography></div>
          <div className="mt-mx-md grid grid-cols-1 gap-mx-md sm:grid-cols-2 xl:grid-cols-3">
            <FormField label="Nome do cliente" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome" />
            <FormField label="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            <Select label="Canal" value={canal} onChange={e => setCanal(e.target.value as CrmCanal | '')}>
              <option value="">Selecione</option>
              {CRM_CANAIS.map(c => <option key={c} value={c}>{CRM_CANAL_LABEL[c]}</option>)}
            </Select>
            <FormField label="Veículo de interesse" value={veiculo} onChange={e => setVeiculo(e.target.value)} placeholder="Ex: Onix LT 1.0" />
            <FormField type="number" label="Valor negociado (R$)" value={valor} onChange={e => setValor(e.target.value)} placeholder="0" />
            <div className="flex items-end">
              <Button onClick={handleCadastrar} disabled={saving} className="w-full">{saving ? 'Salvando...' : '+ Novo Cliente'}</Button>
            </div>
          </div>
          <Typography variant="tiny" tone="muted" className="mt-mx-md block normal-case tracking-normal">
            ★ Clientes cadastrados alimentam a Carteira, o Funil e contam no seu Score da Rotina.
          </Typography>
        </Card>
      </section>

      <section className="grid gap-mx-lg xl:grid-cols-[minmax(0,1fr)_380px_280px]" aria-label="Resumo e disciplina">
        <Card className="border-none bg-white p-mx-lg shadow-mx-md">
          <Typography variant="h2" className="text-lg uppercase tracking-normal">Resumo do Dia</Typography>
          <div className="mt-mx-md grid grid-cols-2 gap-mx-sm md:grid-cols-5">
            <ResumoItem label="Leads Recebidos" value={String(leadsHojeTotal)} />
            <ResumoItem label="Atendimentos" value={String(porCanal.total)} />
            <ResumoItem label="Agendamentos D+1" value={String(agendamentosAmanhaTotal)} />
            <ResumoItem label="Vendas Realizadas" value={String(funil.ganhos.quantidade)} />
            <ResumoItem label="Faturamento" value={BRL(funil.ganhos.valor)} highlight />
          </div>
        </Card>

        <Card className="border-none bg-white p-mx-lg shadow-mx-md">
          <Typography variant="h2" className="text-lg uppercase tracking-normal">Disciplina — Fechamento Diário</Typography>
          <div className="mt-mx-md grid grid-cols-[110px_1fr] items-center gap-mx-md">
            <div className="grid h-24 w-24 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-brand-primary) ${(disciplina?.percentage ?? 0) * 3.6}deg, var(--color-border-subtle) 0deg)` }}>
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white"><span className="text-2xl font-black">{disciplina?.percentage ?? 0}%</span></div>
            </div>
            <div>
              <Typography variant="p" className="font-black">
                {disciplina && disciplina.percentage >= 90 ? 'Rotina consistente!' : 'Mantenha o fechamento em dia.'}
              </Typography>
              <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
                Fechamentos realizados nos últimos 7 dias de rotina. Clientes cadastrados aumentam seu Score da Rotina.
              </Typography>
            </div>
          </div>
        </Card>

        <Card className="border-none bg-white p-mx-lg text-center shadow-mx-md">
          <span className="mx-auto mb-mx-sm grid h-10 w-10 place-items-center rounded-full bg-status-warning-surface text-status-warning"><Lightbulb size={20} /></span>
          <Typography variant="h2" className="text-lg uppercase tracking-normal">Dica do Dia</Typography>
          <Typography variant="p" tone="muted" className="mt-mx-sm italic">“O sucesso é a soma de pequenos esforços repetidos dia após dia.”</Typography>
        </Card>
      </section>

      <div className="flex items-center justify-center gap-mx-sm rounded-mx-lg border border-border-subtle bg-white px-mx-lg py-mx-sm">
        <ShieldCheck size={16} className="shrink-0 text-status-success" />
        <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
          O lançamento oficial do dia (referência D-1) é feito no formulário acima — após salvar, ele alimenta seu Score e os painéis da liderança.
        </Typography>
      </div>
    </div>
  )
}

function ResumoItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-mx-md border border-border-subtle p-mx-md text-center ${highlight ? 'bg-status-success-surface' : 'bg-white'}`}>
      <Typography variant="h2" className="text-xl text-brand-primary">{value}</Typography>
      <Typography variant="caption" tone="muted" className="normal-case tracking-wide">{label}</Typography>
    </div>
  )
}

export default CheckinCrmSection
