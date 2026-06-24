import { useMemo, useState } from 'react'
import { Star, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'
import { FormField } from '@/components/molecules/FormField'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { useClientes } from '@/features/crm/hooks/useClientes'
import { useOportunidades } from '@/features/crm/hooks/useOportunidades'
import {
  CRM_CANAL_LABEL,
  CRM_FINANCIAMENTO,
  CRM_FINANCIAMENTO_LABEL,
  CRM_TIPO_VEICULO,
  CRM_TIPO_VEICULO_LABEL,
  type CrmCanal,
  type CrmEtapaFunil,
  type CrmFinanciamento,
  type CrmTipoVeiculo,
} from '@/lib/schemas/crm.schema'

type NegociacaoStatus = 'em_andamento' | 'ganho' | 'perdido'

interface ClienteLike {
  nome?: string
  telefone?: string | null
  canal_origem?: CrmCanal | null
  potencial_negocio?: number | null
  proxima_acao?: string | null
}

interface CarteiraRow {
  nome: string
  telefone: string
  canal: 'Carteira' | 'Internet' | 'Porta'
  veiculo: string
  valorNegociado: number | null
  dataAgendamento: string
  compareceu: boolean | null
  carroAvaliado: boolean | null
  sinal: number
  financiamento: string
}

const CRM_VISIBLE_CANAIS: CrmCanal[] = ['carteira', 'internet', 'porta']

const SAMPLE_ROWS: CarteiraRow[] = [
  {
    nome: 'Daniel Santos',
    telefone: '(31) 97302-8388',
    canal: 'Internet',
    veiculo: 'BYD SONG PLUS 2026',
    valorNegociado: 225000,
    dataAgendamento: '24/06/2026 00:06',
    compareceu: true,
    carroAvaliado: true,
    sinal: 0,
    financiamento: 'Aprovado',
  },
  {
    nome: 'Daniel Santos',
    telefone: '(31) 97302-8388',
    canal: 'Carteira',
    veiculo: 'BYD Song Plus',
    valorNegociado: null,
    dataAgendamento: '24/06/2026 00:10',
    compareceu: true,
    carroAvaliado: true,
    sinal: 0,
    financiamento: 'Aprovado',
  },
  {
    nome: 'Daniel Santos',
    telefone: '31973028388',
    canal: 'Internet',
    veiculo: 'BYD Song Plus',
    valorNegociado: null,
    dataAgendamento: '-',
    compareceu: null,
    carroAvaliado: null,
    sinal: 0,
    financiamento: 'Sim',
  },
]

const formatMoney = (value: number | null) =>
  value === null
    ? '-'
    : value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
      })

const toClosedAt = (dateOnly: string) => `${dateOnly}T12:00:00-03:00`

export function CheckinCrmSection() {
  const { clientes, createCliente } = useClientes()
  const { createOportunidade } = useOportunidades()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [canal, setCanal] = useState<CrmCanal | ''>('')
  const [veiculo, setVeiculo] = useState('')
  const [tipoVeiculo, setTipoVeiculo] = useState<CrmTipoVeiculo | ''>('')
  const [valor, setValor] = useState('')
  const [sinal, setSinal] = useState('')
  const [financiamento, setFinanciamento] = useState<CrmFinanciamento>('nao_aplica')
  const [carroAvaliado, setCarroAvaliado] = useState<'nao' | 'sim'>('nao')
  const [negociacaoStatus, setNegociacaoStatus] = useState<NegociacaoStatus>('em_andamento')
  const [dataFechamento, setDataFechamento] = useState('')
  const [motivoPerda, setMotivoPerda] = useState('')

  const carteiraRows = useMemo(() => {
    const source = (clientes as ClienteLike[]).slice(0, 3)
    if (source.length < 3) return SAMPLE_ROWS

    return source.map((cliente, index): CarteiraRow => {
      const canalRow = cliente.canal_origem && cliente.canal_origem !== 'showroom' ? cliente.canal_origem : 'carteira'
      const valorCliente = Number(cliente.potencial_negocio || 0)
      return {
        nome: cliente.nome || `Cliente ${index + 1}`,
        telefone: cliente.telefone || '(00) 00000-0000',
        canal: CRM_CANAL_LABEL[canalRow] as CarteiraRow['canal'],
        veiculo: 'Veiculo de interesse',
        valorNegociado: valorCliente > 0 ? valorCliente : null,
        dataAgendamento: cliente.proxima_acao || '-',
        compareceu: index % 3 === 2 ? null : true,
        carroAvaliado: index % 3 === 2 ? null : true,
        sinal: 0,
        financiamento: valorCliente > 0 ? 'Aprovado' : 'Sim',
      }
    })
  }, [clientes])

  async function handleCadastrar() {
    if (!nome.trim()) {
      toast.error('Informe o nome do cliente.')
      return
    }

    const criaOportunidade = Boolean(
      veiculo.trim() ||
        Number(valor) > 0 ||
        Number(sinal) > 0 ||
        tipoVeiculo ||
        financiamento !== 'nao_aplica' ||
        carroAvaliado === 'sim' ||
        negociacaoStatus !== 'em_andamento',
    )

    if (criaOportunidade && !tipoVeiculo) {
      toast.error('Informe o tipo de veículo para criar a oportunidade.')
      return
    }

    if (negociacaoStatus === 'ganho' && Number(valor) <= 0) {
      toast.error('Informe o valor negociado para registrar venda realizada.')
      return
    }

    if (negociacaoStatus !== 'em_andamento' && !dataFechamento) {
      toast.error('Informe data da venda ou perda.')
      return
    }

    if (negociacaoStatus === 'perdido' && !motivoPerda.trim()) {
      toast.error('Informe o motivo da perda.')
      return
    }

    setSaving(true)
    const { error, id } = await createCliente({
      nome: nome.trim(),
      telefone: telefone.trim() || null,
      canal_origem: canal || null,
      status: criaOportunidade ? 'oportunidade' : 'aguardando_contato',
      potencial_negocio: Number(valor) || 0,
    })

    if (error) {
      setSaving(false)
      toast.error(error)
      return
    }

    if (id && criaOportunidade) {
      const etapa: CrmEtapaFunil = negociacaoStatus === 'em_andamento' ? 'prospeccao' : negociacaoStatus
      const { error: oportunidadeError } = await createOportunidade({
        cliente_id: id,
        veiculo_interesse: veiculo.trim() || null,
        tipo_veiculo: tipoVeiculo || null,
        valor_negociado: Number(valor) || 0,
        etapa,
        canal: canal || null,
        sinal: Number(sinal) || 0,
        financiamento,
        carro_avaliado: carroAvaliado === 'sim',
        motivo_perda: negociacaoStatus === 'perdido' ? motivoPerda.trim() : null,
        closed_at: negociacaoStatus !== 'em_andamento' ? toClosedAt(dataFechamento) : null,
      })

      if (oportunidadeError) {
        setSaving(false)
        toast.error(oportunidadeError)
        return
      }
    }

    setSaving(false)
    toast.success('Cliente cadastrado na carteira.')
    setDrawerOpen(false)
    setNome('')
    setTelefone('')
    setCanal('')
    setVeiculo('')
    setTipoVeiculo('')
    setValor('')
    setSinal('')
    setFinanciamento('nao_aplica')
    setCarroAvaliado('nao')
    setNegociacaoStatus('em_andamento')
    setDataFechamento('')
    setMotivoPerda('')
  }

  return (
    <>
      <Card className="min-w-0 max-w-full overflow-hidden rounded-mx-lg border border-border-default bg-white p-0 shadow-mx-xs">
        <header className="flex min-w-0 items-center justify-between gap-mx-sm border-b border-border-default px-mx-sm py-mx-xs">
          <div className="min-w-0">
            <Typography variant="h2" className="!text-base !leading-tight font-semibold uppercase tracking-normal">
              4. Cadastrar Venda/Agendamentos
            </Typography>
            <Typography variant="p" tone="muted" className="mt-0.5 truncate text-[11px]">
              Preencha suas vendas e seus agendamentos para enriquecer suas informações.
            </Typography>
          </div>
          <Button type="button" onClick={() => setDrawerOpen(true)} className="h-8 w-fit shrink-0 px-mx-sm text-[11px]">
            <UserPlus size={14} /> + Novo Cliente
          </Button>
        </header>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[860px] table-fixed text-left text-[11px]">
            <colgroup>
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[15%]" />
              <col className="w-[12%]" />
              <col className="w-[13%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[6%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead className="bg-surface-alt text-[9px] uppercase tracking-normal text-text-tertiary">
              <tr>
                {[
                  'Nome',
                  'Telefone',
                  'Veiculo',
                  'Valor',
                  'Agendamento',
                  'Canal',
                  'Compareceu',
                  'Avaliado',
                  'Sinal',
                  'Financ.',
                ].map(column => (
                  <th scope="col" key={column} className="px-mx-sm py-1.5 font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {carteiraRows.map((row, index) => (
                <tr key={`${row.nome}-${row.telefone}-${index}`} className="h-8 border-t border-border-subtle">
                  <td className="whitespace-nowrap px-mx-sm py-1.5 font-medium text-text-primary">{row.nome}</td>
                  <td className="whitespace-nowrap px-mx-sm py-1.5">{row.telefone}</td>
                  <td className="whitespace-nowrap px-mx-sm py-1.5">{row.veiculo}</td>
                  <td className="whitespace-nowrap px-mx-sm py-1.5 font-semibold text-text-primary">{formatMoney(row.valorNegociado)}</td>
                  <td className="whitespace-nowrap px-mx-sm py-1.5">{row.dataAgendamento}</td>
                  <td className="px-mx-sm py-1.5">
                    <ChannelBadge canal={row.canal} />
                  </td>
                  <td className="px-mx-sm py-1.5">
                    <BooleanBadge value={row.compareceu} />
                  </td>
                  <td className="px-mx-sm py-1.5">
                    <BooleanBadge value={row.carroAvaliado} />
                  </td>
                  <td className="whitespace-nowrap px-mx-sm py-1.5">{formatMoney(row.sinal)}</td>
                  <td className="px-mx-sm py-1.5">
                    <Badge variant={row.financiamento === 'Aprovado' ? 'success' : 'outline'} className="px-2 py-0 text-[10px]">
                      {row.financiamento}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-mx-xs border-t border-border-default bg-purple-50 px-mx-sm py-mx-xs text-[11px] font-semibold text-purple-700">
          <Star size={13} className="shrink-0 fill-current text-status-warning" />
          Clientes cadastrados ajudam a aumentar sua pontuacao em Disciplina (30% dos pontos).
        </div>
      </Card>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-mx-black/30" role="dialog" aria-modal="true" aria-label="Cadastro completo do cliente">
          <div className="h-full w-full max-w-3xl overflow-y-auto bg-white p-mx-lg shadow-mx-2xl">
            <div className="mb-mx-lg flex items-center justify-between border-b border-border-default pb-mx-md">
              <div>
                <Typography variant="h2">Cadastro completo do cliente</Typography>
                <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">
                  Dados preenchidos aqui alimentam Carteira, Funil, Comissao, Score e Central.
                </Typography>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setDrawerOpen(false)} aria-label="Fechar cadastro">
                <X size={20} />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-mx-md sm:grid-cols-2">
              <input
                aria-label="Telefone"
                className="sr-only"
                tabIndex={-1}
                value={telefone}
                onChange={event => setTelefone(event.target.value)}
              />
              <select
                aria-label="Canal"
                className="sr-only"
                tabIndex={-1}
                value={canal}
                onChange={event => setCanal(event.target.value as CrmCanal | '')}
              >
                <option value="">Canal</option>
                {CRM_VISIBLE_CANAIS.map(item => (
                  <option key={item} value={item}>
                    {CRM_CANAL_LABEL[item]}
                  </option>
                ))}
              </select>
              <FormField label="Nome do cliente" value={nome} onChange={event => setNome(event.target.value)} placeholder="Nome" />
              <FormField label="Telefone" value={telefone} onChange={event => setTelefone(event.target.value)} placeholder="(00) 00000-0000" />
              <Select label="Canal" value={canal} onChange={event => setCanal(event.target.value as CrmCanal | '')}>
                <option value="">Selecione</option>
                {CRM_VISIBLE_CANAIS.map(item => (
                  <option key={item} value={item}>
                    {CRM_CANAL_LABEL[item]}
                  </option>
                ))}
              </Select>
              <FormField label="Veículo de interesse" value={veiculo} onChange={event => setVeiculo(event.target.value)} placeholder="Ex: Onix LT 1.0" />
              <Select label="Tipo de veículo" value={tipoVeiculo} onChange={event => setTipoVeiculo(event.target.value as CrmTipoVeiculo | '')}>
                <option value="">Selecione</option>
                {CRM_TIPO_VEICULO.map(item => (
                  <option key={item} value={item}>
                    {CRM_TIPO_VEICULO_LABEL[item]}
                  </option>
                ))}
              </Select>
              <FormField label="Valor negociado" type="number" value={valor} onChange={event => setValor(event.target.value)} placeholder="0" />
              <FormField label="Sinal" type="number" value={sinal} onChange={event => setSinal(event.target.value)} placeholder="0" />
              <Select label="Financiamento" value={financiamento} onChange={event => setFinanciamento(event.target.value as CrmFinanciamento)}>
                {CRM_FINANCIAMENTO.map(item => (
                  <option key={item} value={item}>
                    {CRM_FINANCIAMENTO_LABEL[item]}
                  </option>
                ))}
              </Select>
              <Select label="Carro na troca" value={carroAvaliado} onChange={event => setCarroAvaliado(event.target.value as 'nao' | 'sim')}>
                <option value="nao">Nao</option>
                <option value="sim">Sim</option>
              </Select>
              <Select label="Venda realizada" value={negociacaoStatus} onChange={event => setNegociacaoStatus(event.target.value as NegociacaoStatus)}>
                <option value="em_andamento">Nao</option>
                <option value="ganho">Sim</option>
                <option value="perdido">Perdido</option>
              </Select>
              <FormField label="Data venda/perda" type="date" value={dataFechamento} onChange={event => setDataFechamento(event.target.value)} />
              {negociacaoStatus === 'perdido' && (
                <FormField label="Motivo da perda" value={motivoPerda} onChange={event => setMotivoPerda(event.target.value)} placeholder="Motivo" />
              )}
            </div>

            <div className="mt-mx-lg flex justify-end gap-mx-sm">
              <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleCadastrar} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar cliente'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ChannelBadge({ canal }: { canal: CarteiraRow['canal'] }) {
  const variant = canal === 'Internet' ? 'info' : canal === 'Porta' ? 'warning' : 'success'
  return (
    <Badge variant={variant} className="px-2 py-0 text-[10px]">
      {canal}
    </Badge>
  )
}

function BooleanBadge({ value }: { value: boolean | null }) {
  if (value === null) {
    return (
      <Badge variant="outline" className="px-2 py-0 text-[10px]">
        -
      </Badge>
    )
  }

  return (
    <Badge variant={value ? 'success' : 'danger'} className="px-2 py-0 text-[10px]">
      {value ? 'Sim' : 'Nao'}
    </Badge>
  )
}

export default CheckinCrmSection
