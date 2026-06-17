import { useMemo, useState } from 'react'
import { Edit3, Trash2, UserPlus, X } from 'lucide-react'
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
  tipoVeiculo: string
  etapa: string
  proximaAcao: string
  valor: number
  venda: 'Sim' | 'Nao'
}

const CRM_VISIBLE_CANAIS: CrmCanal[] = ['carteira', 'internet', 'porta']

const SAMPLE_ROWS: CarteiraRow[] = [
  {
    nome: 'Joao Santos',
    telefone: '(11) 98765-4321',
    canal: 'Carteira',
    veiculo: 'HB20 1.0 Comfort',
    tipoVeiculo: 'Carro',
    etapa: 'Qualificacao',
    proximaAcao: 'Ligar 17/06',
    valor: 68900,
    venda: 'Nao',
  },
  {
    nome: 'Maria Oliveira',
    telefone: '(11) 91234-5678',
    canal: 'Internet',
    veiculo: 'T-Cross Comfortline',
    tipoVeiculo: 'Carro',
    etapa: 'Proposta',
    proximaAcao: 'Enviar proposta',
    valor: 120000,
    venda: 'Nao',
  },
  {
    nome: 'Carlos Almeida',
    telefone: '(11) 99876-5432',
    canal: 'Carteira',
    veiculo: 'Compass Longitude',
    tipoVeiculo: 'Carro',
    etapa: 'Negociacao',
    proximaAcao: 'Visita 18/06',
    valor: 145900,
    venda: 'Sim',
  },
]

const BRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const toClosedAt = (dateOnly: string) => `${dateOnly}T12:00:00-03:00`

export function CheckinCrmSection() {
  const { clientes, createCliente } = useClientes()
  const { createOportunidade } = useOportunidades()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [quickNome, setQuickNome] = useState('')
  const [quickTelefone, setQuickTelefone] = useState('')
  const [quickCanal, setQuickCanal] = useState<CrmCanal | ''>('')
  const [quickVeiculo, setQuickVeiculo] = useState('')

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
      return {
        nome: cliente.nome || `Cliente ${index + 1}`,
        telefone: cliente.telefone || '(00) 00000-0000',
        canal: CRM_CANAL_LABEL[canalRow] as CarteiraRow['canal'],
        veiculo: 'Veiculo de interesse',
        tipoVeiculo: 'Carro',
        etapa: 'Qualificacao',
        proximaAcao: cliente.proxima_acao || 'Retorno pendente',
        valor: Number(cliente.potencial_negocio || 0),
        venda: Number(cliente.potencial_negocio || 0) > 0 ? 'Sim' : 'Nao',
      }
    })
  }, [clientes])

  function openDrawerFromQuick() {
    setNome(quickNome)
    setTelefone(quickTelefone)
    setCanal(quickCanal)
    setVeiculo(quickVeiculo)
    setDrawerOpen(true)
  }

  async function handleQuickAdd() {
    if (!quickNome.trim()) {
      toast.error('Informe o nome do cliente.')
      return
    }

    setSaving(true)
    const { error } = await createCliente({
      nome: quickNome.trim(),
      telefone: quickTelefone.trim() || null,
      canal_origem: quickCanal || null,
      status: 'aguardando_contato',
      potencial_negocio: 0,
    })
    setSaving(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('Cliente adicionado a carteira.')
    setQuickNome('')
    setQuickTelefone('')
    setQuickCanal('')
    setQuickVeiculo('')
  }

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
      <Card className="rounded-mx-xl border border-border-default bg-white p-mx-md shadow-mx-sm">
        <header className="mb-mx-md flex flex-col gap-mx-sm sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Typography variant="h2" className="text-base font-semibold uppercase tracking-normal">
              5. Enriquecer Carteira <span className="text-status-success">(Opcional)</span>
            </Typography>
            <Typography variant="p" tone="muted" className="mt-mx-xs text-xs">
              Enriqueça sua carteira com novos clientes e mantenha seu funil sempre ativo.
            </Typography>
          </div>
          <Button type="button" onClick={() => setDrawerOpen(true)} className="w-fit">
            <UserPlus size={16} /> + Novo Cliente
          </Button>
        </header>

        <div className="overflow-x-auto rounded-mx-lg border border-border-default">
          <table className="w-full min-w-[920px] text-left text-[10px]">
            <thead className="bg-surface-alt text-[10px] uppercase tracking-mx-wider text-text-tertiary">
              <tr>
                {[
                  'Nome',
                  'Telefone',
                  'Canal',
                  'Veiculo de Interesse',
                  'Etapa do Funil',
                  'Proxima Acao',
                  'Valor Negociado',
                  'Venda Realizada',
                  'Acoes',
                ].map(column => (
                  <th key={column} className="px-mx-sm py-mx-sm font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {carteiraRows.map(row => (
                <tr key={`${row.nome}-${row.telefone}`} className="border-t border-border-subtle">
                  <td className="whitespace-nowrap px-mx-sm py-1.5 font-medium text-text-primary">{row.nome}</td>
                  <td className="whitespace-nowrap px-mx-sm py-1.5">{row.telefone}</td>
                  <td className="px-mx-sm py-1.5">
                    <ChannelBadge canal={row.canal} />
                  </td>
                  <td className="whitespace-nowrap px-mx-sm py-1.5">{row.veiculo}</td>
                  <td className="px-mx-sm py-1.5">
                    <Badge variant="outline" className="px-2 py-0.5 text-[10px]">
                      {row.etapa}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-mx-sm py-1.5">{row.proximaAcao}</td>
                  <td className="whitespace-nowrap px-mx-sm py-1.5">{BRL(row.valor)}</td>
                  <td className="px-mx-sm py-1.5">
                    <Badge variant={row.venda === 'Sim' ? 'success' : 'danger'} className="px-2 py-0.5 text-[10px]">
                      {row.venda}
                    </Badge>
                  </td>
                  <td className="px-mx-sm py-1.5">
                    <div className="flex items-center gap-mx-xs">
                      <Button type="button" variant="ghost" size="icon" onClick={() => setDrawerOpen(true)} aria-label="Editar cliente">
                        <Edit3 size={15} />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" aria-label="Remover cliente">
                        <Trash2 size={15} className="text-status-error" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-mx-sm rounded-mx-lg border border-border-subtle bg-surface-alt p-mx-sm">
          <Typography variant="caption" className="text-[10px] font-semibold normal-case tracking-normal">
            Adicionar novo cliente rapidamente
          </Typography>
          <div className="mt-mx-xs grid gap-mx-sm lg:grid-cols-[1.1fr_0.9fr_0.9fr_1fr_120px]">
            <input
              aria-label="Cliente rapido"
              value={quickNome}
              onChange={event => setQuickNome(event.target.value)}
              placeholder="Nome do cliente"
              className="h-mx-10 rounded-mx-md border border-border-default bg-white px-mx-sm text-xs outline-none focus:border-brand-primary"
            />
            <input
              aria-label="Contato rapido"
              value={quickTelefone}
              onChange={event => setQuickTelefone(event.target.value)}
              placeholder="(00) 00000-0000"
              className="h-mx-10 rounded-mx-md border border-border-default bg-white px-mx-sm text-xs outline-none focus:border-brand-primary"
            />
            <select
              aria-label="Origem rapida"
              value={quickCanal}
              onChange={event => setQuickCanal(event.target.value as CrmCanal | '')}
              className="h-mx-10 rounded-mx-md border border-border-default bg-white px-mx-sm text-xs outline-none focus:border-brand-primary"
            >
              <option value="">Selecione o canal</option>
              {CRM_VISIBLE_CANAIS.map(item => (
                <option key={item} value={item}>
                  {CRM_CANAL_LABEL[item]}
                </option>
              ))}
            </select>
            <input
              aria-label="Veiculo de interesse rapido"
              value={quickVeiculo}
              onChange={event => setQuickVeiculo(event.target.value)}
              placeholder="Veiculo de interesse"
              className="h-mx-10 rounded-mx-md border border-border-default bg-white px-mx-sm text-xs outline-none focus:border-brand-primary"
            />
            <Button type="button" onClick={handleQuickAdd} disabled={saving} className="h-mx-10">
              Adicionar
            </Button>
          </div>
          <button type="button" onClick={openDrawerFromQuick} className="mt-mx-xs text-xs font-semibold text-brand-primary">
            Completar cadastro
          </button>
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
    <Badge variant={variant} className="px-2 py-0.5 text-[10px]">
      {canal}
    </Badge>
  )
}

export default CheckinCrmSection
