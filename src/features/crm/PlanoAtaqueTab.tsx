import { useMemo, useState } from 'react'
import { ArrowLeft, Car, Plus, Users, X, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { FormField } from '@/components/molecules/FormField'
import type { Cliente } from '@/lib/schemas/crm.schema'
import type { OportunidadeComCliente } from '@/features/crm/hooks/useOportunidades'
import { useVeiculosEstoque, type VeiculoEstoque } from '@/features/crm/hooks/useVeiculosEstoque'

interface PlanoAtaqueTabProps {
  clientes: Cliente[]
  oportunidadePorCliente: Map<string, OportunidadeComCliente>
  onAbrirFicha: (clienteId: string) => void
}

function normalizar(str: string | null | undefined): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .trim()
}

function clientesCompativeis(
  clientes: Cliente[],
  oportunidadePorCliente: Map<string, OportunidadeComCliente>,
  veiculo: VeiculoEstoque,
): Cliente[] {
  const termos = [veiculo.marca, veiculo.modelo, veiculo.versao, veiculo.ano]
    .filter(Boolean)
    .map(normalizar)
  if (termos.length === 0) return []

  return clientes.filter(cliente => {
    const interesse = normalizar(oportunidadePorCliente.get(cliente.id)?.veiculo_interesse)
    if (!interesse) return false
    return termos.some(termo => termo && interesse.includes(termo))
  })
}

function diasDesde(dataISO: string): number {
  return Math.floor((Date.now() - new Date(`${dataISO}T12:00:00`).getTime()) / 86400000)
}

function entradaLabel(dataISO: string): string {
  const dias = diasDesde(dataISO)
  if (dias <= 0) return 'Entrou hoje'
  if (dias === 1) return 'Entrou ontem'
  return `Entrou há ${dias} dias`
}

export function PlanoAtaqueTab({ clientes, oportunidadePorCliente, onAbrirFicha }: PlanoAtaqueTabProps) {
  const { veiculos, loading, createVeiculo } = useVeiculosEstoque()
  const [modalOpen, setModalOpen] = useState(false)
  const [veiculoAtaque, setVeiculoAtaque] = useState<VeiculoEstoque | null>(null)

  const listaCompativeis = useMemo(
    () => (veiculoAtaque ? clientesCompativeis(clientes, oportunidadePorCliente, veiculoAtaque) : []),
    [clientes, oportunidadePorCliente, veiculoAtaque],
  )

  if (veiculoAtaque) {
    return (
      <div className="space-y-mx-md">
        <button
          type="button"
          onClick={() => setVeiculoAtaque(null)}
          className="flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:underline"
        >
          <ArrowLeft size={16} /> Voltar aos veículos
        </button>

        <Card className="rounded-mx-xl bg-gradient-to-r from-brand-primary to-brand-primary/80 p-mx-lg text-white">
          <Typography variant="caption" className="uppercase tracking-widest text-white/70">Veículo que chegou</Typography>
          <Typography variant="h2" className="mt-1 text-white">{veiculoAtaque.marca} {veiculoAtaque.modelo} {veiculoAtaque.versao}</Typography>
          <Typography variant="p" className="text-white/80">
            {veiculoAtaque.ano}{veiculoAtaque.preco ? ` · ${veiculoAtaque.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
          </Typography>
        </Card>

        {listaCompativeis.length === 0 ? (
          <Card className="rounded-mx-xl p-mx-xl text-center">
            <Typography variant="p" className="font-semibold text-text-secondary">Nenhum cliente compatível encontrado.</Typography>
            <Typography variant="caption" tone="muted">Verifique os veículos de interesse registrados na carteira.</Typography>
          </Card>
        ) : (
          <div className="space-y-mx-xs">
            <Typography variant="caption" tone="muted" className="uppercase tracking-widest">
              {listaCompativeis.length} cliente{listaCompativeis.length !== 1 ? 's' : ''} compatível{listaCompativeis.length !== 1 ? 'eis' : ''}
            </Typography>
            {listaCompativeis.map(cliente => (
              <Card key={cliente.id} className="flex items-center gap-mx-sm rounded-mx-lg p-mx-sm">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-primary/10 text-xs font-black text-brand-primary">
                  {(cliente.nome || '?').split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <Typography variant="p" className="truncate font-semibold">{cliente.nome}</Typography>
                  <Typography variant="caption" tone="muted" className="truncate">
                    {oportunidadePorCliente.get(cliente.id)?.veiculo_interesse || '—'}
                  </Typography>
                </div>
                <Button variant="outline" onClick={() => onAbrirFicha(cliente.id)}>Ficha</Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-mx-md">
      <div className="flex items-start justify-between gap-mx-sm">
        <div>
          <Typography variant="h2">Veículos que chegaram</Typography>
          <Typography variant="p" tone="muted">Encontre clientes da carteira interessados nos veículos recém-entrados.</Typography>
        </div>
        <Button variant="outline" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Registrar veículo
        </Button>
      </div>

      {loading ? (
        <Typography variant="p" tone="muted">Carregando veículos...</Typography>
      ) : veiculos.length === 0 ? (
        <Card className="rounded-mx-xl p-mx-xl text-center">
          <Car size={28} className="mx-auto text-text-tertiary" />
          <Typography variant="p" className="mt-mx-xs font-semibold text-text-secondary">Nenhum veículo recém-chegado registrado no momento.</Typography>
          <Button className="mt-mx-sm" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Registrar veículo que chegou
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-mx-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {veiculos.map(veiculo => {
            const compat = clientesCompativeis(clientes, oportunidadePorCliente, veiculo).length
            return (
              <Card key={veiculo.id} className="space-y-mx-sm rounded-mx-xl p-mx-sm">
                <div className="flex items-start gap-mx-xs">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-mx-md bg-brand-primary/10 text-brand-primary">
                    <Car size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Typography variant="p" className="truncate font-black">{veiculo.marca} {veiculo.modelo} {veiculo.versao}</Typography>
                    <Typography variant="caption" tone="muted">
                      {veiculo.ano}{veiculo.preco ? ` · ${veiculo.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
                    </Typography>
                    <Typography variant="caption" className="font-semibold text-brand-primary">{entradaLabel(veiculo.data_entrada)}</Typography>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-text-tertiary" />
                  <Typography variant="caption" className={compat > 0 ? 'font-bold text-text-primary' : 'text-text-tertiary'}>
                    {compat} cliente{compat !== 1 ? 's' : ''} compatível{compat !== 1 ? 'eis' : ''}
                  </Typography>
                </div>
                <Button className="w-full" disabled={compat === 0} onClick={() => setVeiculoAtaque(veiculo)}>
                  <Zap size={16} /> Iniciar ataque
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <ModalRegistrarVeiculo
          onClose={() => setModalOpen(false)}
          onSalvar={async input => {
            const { error } = await createVeiculo(input)
            if (error) { toast.error(error); return false }
            toast.success('Veículo registrado.')
            return true
          }}
        />
      )}
    </div>
  )
}

function ModalRegistrarVeiculo({ onClose, onSalvar }: { onClose: () => void; onSalvar: (input: { marca: string; modelo: string; versao: string; ano: string; preco: number | null; data_entrada: string; observacao: string }) => Promise<boolean> }) {
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [versao, setVersao] = useState('')
  const [ano, setAno] = useState(String(new Date().getFullYear()))
  const [preco, setPreco] = useState('')
  const [dataEntrada, setDataEntrada] = useState(new Date().toISOString().slice(0, 10))
  const [observacao, setObservacao] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSalvar = async () => {
    if (!marca.trim() || !modelo.trim()) return
    setSaving(true)
    const ok = await onSalvar({
      marca, modelo, versao, ano,
      preco: preco ? Number(preco) : null,
      data_entrada: dataEntrada,
      observacao,
    })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-[3px]" role="dialog" aria-modal="true" aria-label="Registrar veículo que chegou">
      <div className="w-full max-w-[440px] space-y-mx-sm rounded-[18px] border border-border-subtle bg-white p-mx-lg shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <div className="flex items-center justify-between">
          <Typography variant="h3">Registrar veículo que chegou</Typography>
          <button type="button" onClick={onClose} aria-label="Fechar"><X size={18} className="text-text-tertiary" /></button>
        </div>
        <div className="grid grid-cols-2 gap-mx-xs">
          <FormField label="Marca *" value={marca} onChange={e => setMarca(e.target.value)} placeholder="Honda" />
          <FormField label="Modelo *" value={modelo} onChange={e => setModelo(e.target.value)} placeholder="HR-V" />
          <FormField label="Versão" value={versao} onChange={e => setVersao(e.target.value)} placeholder="EXL" />
          <FormField label="Ano" value={ano} onChange={e => setAno(e.target.value)} placeholder="2024" />
        </div>
        <div className="grid grid-cols-2 gap-mx-xs">
          <FormField label="Preço (opcional)" type="number" value={preco} onChange={e => setPreco(e.target.value)} placeholder="120000" />
          <FormField label="Data de entrada" type="date" value={dataEntrada} onChange={e => setDataEntrada(e.target.value)} />
        </div>
        <FormField label="Observação (opcional)" value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Baixo km, único dono..." />
        <div className="flex gap-mx-xs pt-mx-xs">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" disabled={!marca.trim() || !modelo.trim() || saving} onClick={handleSalvar}>
            {saving ? 'Salvando...' : 'Salvar veículo'}
          </Button>
        </div>
      </div>
    </div>
  )
}
