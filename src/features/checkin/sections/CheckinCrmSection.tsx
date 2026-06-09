import { useState } from 'react'
import { toast } from 'sonner'
import { Store, Users, Globe, UserPlus, ClipboardList } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'
import { FormField } from '@/components/molecules/FormField'
import { useAtendimentos } from '@/features/crm/hooks/useAtendimentos'
import { useClientes } from '@/features/crm/hooks/useClientes'
import { useOportunidades } from '@/features/crm/hooks/useOportunidades'
import { useAgendamentos } from '@/features/crm/hooks/useAgendamentos'
import {
  CRM_CANAIS, CRM_CANAL_LABEL,
  type CrmCanal,
} from '@/lib/schemas/crm.schema'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

function ChannelCounter({ icon, label, value, onAdd }: { icon: React.ReactNode; label: string; value: number; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-mx-xs rounded-mx-lg border border-border-subtle bg-white p-mx-md text-center">
      <div className="text-brand-secondary">{icon}</div>
      <Typography variant="caption" tone="muted" className="uppercase tracking-wide">{label}</Typography>
      <Typography variant="h2" className="text-2xl">{value}</Typography>
      <Button variant="secondary" size="sm" onClick={onAdd}>+ Registrar</Button>
    </div>
  )
}

export function CheckinCrmSection() {
  const { porCanal, registrarAtendimento } = useAtendimentos()
  const { clientes, metrics: clienteMetrics, createCliente } = useClientes()
  const { funil, createOportunidade } = useOportunidades()
  const { metrics: agendaMetrics } = useAgendamentos()

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [canal, setCanal] = useState<CrmCanal | ''>('')
  const [veiculo, setVeiculo] = useState('')
  const [valor, setValor] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleRegistrar(c: CrmCanal) {
    const { error } = await registrarAtendimento(c)
    if (error) { toast.error(error); return }
    toast.success(`Atendimento (${CRM_CANAL_LABEL[c]}) registrado.`)
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
      <Card className="border-none bg-white p-mx-lg shadow-mx-md">
        <div className="flex items-center gap-mx-sm"><ClipboardList size={18} /><Typography variant="h3" className="uppercase tracking-tight">Atendimentos de Hoje</Typography></div>
        <Typography variant="caption" tone="muted">Registre cada atendimento por canal — alimenta seu funil e o histórico real.</Typography>
        <div className="mt-mx-md grid grid-cols-2 gap-mx-md sm:grid-cols-4">
          <ChannelCounter icon={<Store size={22} />} label="Showroom" value={porCanal.showroom} onAdd={() => handleRegistrar('showroom')} />
          <ChannelCounter icon={<Users size={22} />} label="Carteira" value={porCanal.carteira} onAdd={() => handleRegistrar('carteira')} />
          <ChannelCounter icon={<Globe size={22} />} label="Internet" value={porCanal.internet} onAdd={() => handleRegistrar('internet')} />
          <ChannelCounter icon={<Users size={22} />} label="Porta" value={porCanal.porta} onAdd={() => handleRegistrar('porta')} />
        </div>
      </Card>

      <Card className="border-none bg-white p-mx-lg shadow-mx-md">
        <div className="flex items-center gap-mx-sm"><UserPlus size={18} /><Typography variant="h3" className="uppercase tracking-tight">Cadastrar Novo Cliente</Typography></div>
        <Typography variant="caption" tone="muted">Cadastro opcional — enriquece a carteira e o funil. Se informar veículo/valor, já cria a oportunidade.</Typography>
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
            <Button onClick={handleCadastrar} disabled={saving} className="w-full">{saving ? 'Salvando...' : 'Cadastrar cliente'}</Button>
          </div>
        </div>
      </Card>

      <Card className="border-none bg-white p-mx-lg shadow-mx-md">
        <Typography variant="h3" className="uppercase tracking-tight">Resumo do Dia</Typography>
        <div className="mt-mx-md grid grid-cols-2 gap-mx-md sm:grid-cols-3 xl:grid-cols-5">
          <ResumoItem label="Atendimentos" value={String(porCanal.total)} />
          <ResumoItem label="Clientes na carteira" value={String(clienteMetrics.total)} />
          <ResumoItem label="Agendamentos hoje" value={String(agendaMetrics.agendamentosHoje)} />
          <ResumoItem label="Vendas realizadas" value={String(funil.ganhos.quantidade)} />
          <ResumoItem label="Faturamento" value={BRL(funil.ganhos.valor)} highlight />
        </div>
        {clientes.length === 0 && (
          <Typography variant="caption" tone="muted" className="mt-mx-md block">Cadastre clientes para acompanhar carteira, funil e faturamento reais.</Typography>
        )}
      </Card>
    </div>
  )
}

function ResumoItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-mx-lg p-mx-md text-center ${highlight ? 'bg-status-success-surface' : 'bg-surface-alt'}`}>
      <Typography variant="h2" className="text-xl">{value}</Typography>
      <Typography variant="caption" tone="muted" className="uppercase tracking-wide">{label}</Typography>
    </div>
  )
}

export default CheckinCrmSection
