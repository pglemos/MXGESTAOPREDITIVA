import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Filter, Target, Tag, DollarSign, Trophy, Plus, Trash2, ChevronRight } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { PageHeader } from '@/components/molecules/PageHeader'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'
import { EmptyState } from '@/components/atoms/EmptyState'
import { FormField } from '@/components/molecules/FormField'
import { Modal } from '@/components/organisms/Modal'
import { useOportunidades, type OportunidadeInput } from '@/features/crm/hooks/useOportunidades'
import { useClientes } from '@/features/crm/hooks/useClientes'
import {
  CRM_ETAPAS_FUNIL, CRM_ETAPA_LABEL,
  CRM_CANAIS, CRM_CANAL_LABEL,
  CRM_FINANCIAMENTO,
  type CrmEtapaFunil,
} from '@/lib/schemas/crm.schema'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const ETAPA_BAR: Record<CrmEtapaFunil, string> = {
  prospeccao: 'bg-blue-600',
  qualificacao: 'bg-blue-400',
  apresentacao: 'bg-amber-400',
  negociacao: 'bg-orange-500',
  fechamento: 'bg-emerald-500',
  ganho: 'bg-emerald-700',
  perdido: 'bg-rose-500',
}

const FINANCIAMENTO_LABEL: Record<string, string> = {
  aprovado: 'Aprovado', reprovado: 'Reprovado', nao_aplica: 'Não se aplica', pendente: 'Pendente',
}

const EMPTY: OportunidadeInput = {
  cliente_id: '', veiculo_interesse: '', valor_negociado: 0, etapa: 'prospeccao',
  canal: null, sinal: 0, financiamento: 'nao_aplica', carro_avaliado: false,
}

function SummaryCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-md">
      <div className="flex items-center gap-mx-sm text-text-secondary">{icon}<Typography variant="caption" tone="muted" className="uppercase tracking-wide">{label}</Typography></div>
      <Typography variant="h2" className="mt-mx-sm text-2xl">{value}</Typography>
      {hint && <Typography variant="caption" tone="muted">{hint}</Typography>}
    </Card>
  )
}

export function FunilVendedor() {
  const { oportunidades, funil, loading, error, createOportunidade, updateEtapa, deleteOportunidade } = useOportunidades()
  const { clientes } = useClientes()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<OportunidadeInput>(EMPTY)
  const [saving, setSaving] = useState(false)

  const maxQtd = useMemo(() => Math.max(1, ...funil.stagesComConversao.map(s => s.quantidade)), [funil])

  async function handleCreate() {
    if (!form.cliente_id) { toast.error('Selecione o cliente.'); return }
    setSaving(true)
    const { error: createError } = await createOportunidade(form)
    setSaving(false)
    if (createError) { toast.error(createError); return }
    toast.success('Oportunidade adicionada ao funil.')
    setForm(EMPTY); setModalOpen(false)
  }

  async function handleEtapa(id: string, etapa: CrmEtapaFunil) {
    let motivo: string | undefined
    if (etapa === 'perdido') { motivo = prompt('Motivo da perda (opcional):') || undefined }
    const { error: e } = await updateEtapa(id, etapa, motivo)
    if (e) { toast.error(e); return }
    toast.success(`Movido para "${CRM_ETAPA_LABEL[etapa]}".`)
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir a oportunidade de "${nome}"?`)) return
    const { error: e } = await deleteOportunidade(id)
    if (e) { toast.error(e); return }
    toast.success('Oportunidade excluída.')
  }

  return (
    <main className="w-full h-full overflow-y-auto bg-surface-alt p-mx-md md:p-mx-lg no-scrollbar">
      <div className="flex flex-col gap-mx-lg pb-28">
        <PageHeader
          title="Funil de Vendas"
          description="Acompanhe suas oportunidades e avance mais negociações para o fechamento."
          actions={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> Nova oportunidade</Button>}
        />

        {error && <Typography className="text-status-error">{error}</Typography>}

        <section className="grid grid-cols-2 gap-mx-md md:grid-cols-4" aria-label="Resumo do funil">
          <SummaryCard icon={<Target size={18} />} label="Taxa de Conversão" value={`${funil.taxaConversaoGeral}%`} hint="oportunidades → vendas" />
          <SummaryCard icon={<Tag size={18} />} label="Ticket Médio" value={BRL(funil.ticketMedio)} hint="por venda realizada" />
          <SummaryCard icon={<DollarSign size={18} />} label="Valor do Funil" value={BRL(funil.valorTotalFunil)} hint="em negociação" />
          <SummaryCard icon={<Trophy size={18} />} label="Vendas Realizadas" value={String(funil.ganhos.quantidade)} hint={BRL(funil.ganhos.valor)} />
        </section>

        <Card className="border-none bg-white p-mx-lg shadow-mx-md">
          <div className="flex items-center gap-mx-sm"><Filter size={18} /><Typography variant="h3" className="uppercase tracking-tight">Seu Funil de Vendas</Typography></div>
          <div className="mt-mx-lg flex flex-col gap-mx-sm">
            {funil.stagesComConversao.map(stage => (
              <div key={stage.etapa} className="flex items-center gap-mx-md">
                <div className="w-full">
                  <div className={`flex items-center justify-between rounded-mx-md px-mx-md py-mx-sm text-white ${ETAPA_BAR[stage.etapa]}`} style={{ width: `${Math.max(30, (stage.quantidade / maxQtd) * 100)}%` }}>
                    <Typography variant="p" className="font-bold text-white">{CRM_ETAPA_LABEL[stage.etapa]}</Typography>
                    <Typography variant="p" className="font-black text-white">{stage.quantidade}</Typography>
                  </div>
                </div>
                <div className="flex w-40 shrink-0 items-center justify-between text-sm">
                  <span className="text-text-muted">{stage.conversao}%</span>
                  <span className="font-semibold">{BRL(stage.valor)}</span>
                </div>
              </div>
            ))}
            <div className="mt-mx-sm flex items-center gap-mx-md">
              <div className="w-full">
                <div className="flex items-center justify-between rounded-mx-md bg-emerald-700 px-mx-md py-mx-sm text-white" style={{ width: `${Math.max(30, (funil.ganhos.quantidade / maxQtd) * 100)}%` }}>
                  <Typography variant="p" className="font-bold text-white">Vendas Realizadas</Typography>
                  <Typography variant="p" className="font-black text-white">{funil.ganhos.quantidade}</Typography>
                </div>
              </div>
              <div className="flex w-40 shrink-0 items-center justify-end text-sm">
                <span className="font-semibold">{BRL(funil.ganhos.valor)}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-none bg-white p-mx-lg shadow-mx-md">
          <Typography variant="h3" className="uppercase tracking-tight">Oportunidades</Typography>
          <div className="mt-mx-md overflow-x-auto">
            {loading ? (
              <Typography tone="muted">Carregando funil...</Typography>
            ) : oportunidades.length === 0 ? (
              <EmptyState title="Nenhuma oportunidade ainda" description="Adicione uma oportunidade para começar a acompanhar seu funil." />
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-text-muted">
                    <th className="pb-mx-sm font-semibold">Cliente</th>
                    <th className="pb-mx-sm font-semibold">Veículo</th>
                    <th className="pb-mx-sm font-semibold text-right">Valor</th>
                    <th className="pb-mx-sm font-semibold">Financiamento</th>
                    <th className="pb-mx-sm font-semibold">Etapa</th>
                    <th className="pb-mx-sm font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {oportunidades.map(o => (
                    <tr key={o.id} className="border-t border-border-subtle">
                      <td className="py-mx-sm font-semibold">{o.cliente?.nome || '—'}</td>
                      <td className="py-mx-sm text-text-secondary">{o.veiculo_interesse || '—'}</td>
                      <td className="py-mx-sm text-right font-semibold">{o.valor_negociado ? BRL(o.valor_negociado) : '—'}</td>
                      <td className="py-mx-sm text-text-secondary">{FINANCIAMENTO_LABEL[o.financiamento]}</td>
                      <td className="py-mx-sm">
                        <Select aria-label="Etapa" value={o.etapa} onChange={e => handleEtapa(o.id, e.target.value as CrmEtapaFunil)}>
                          {CRM_ETAPAS_FUNIL.map(et => <option key={et} value={et}>{CRM_ETAPA_LABEL[et]}</option>)}
                        </Select>
                      </td>
                      <td className="py-mx-sm text-right">
                        <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => handleDelete(o.id, o.cliente?.nome || 'cliente')}><Trash2 size={16} /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova oportunidade"
        description="Vincule a um cliente da sua carteira."
        footer={
          <div className="flex justify-end gap-mx-sm">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Salvando...' : 'Salvar oportunidade'}</Button>
          </div>
        }
      >
        {clientes.length === 0 ? (
          <div className="flex items-center gap-mx-sm rounded-mx-md bg-status-warning-surface p-mx-md">
            <ChevronRight size={16} />
            <Typography variant="p">Cadastre um cliente na Carteira antes de criar uma oportunidade.</Typography>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-mx-md sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Select label="Cliente *" value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
                <option value="">Selecione o cliente</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}{c.empresa ? ` · ${c.empresa}` : ''}</option>)}
              </Select>
            </div>
            <FormField label="Veículo de interesse" value={form.veiculo_interesse || ''} onChange={e => setForm(f => ({ ...f, veiculo_interesse: e.target.value }))} placeholder="Ex: Onix LT 1.0" />
            <FormField type="number" label="Valor negociado (R$)" value={String(form.valor_negociado ?? 0)} onChange={e => setForm(f => ({ ...f, valor_negociado: Number(e.target.value) || 0 }))} />
            <Select label="Etapa" value={form.etapa} onChange={e => setForm(f => ({ ...f, etapa: e.target.value as CrmEtapaFunil }))}>
              {CRM_ETAPAS_FUNIL.map(et => <option key={et} value={et}>{CRM_ETAPA_LABEL[et]}</option>)}
            </Select>
            <Select label="Canal" value={form.canal || ''} onChange={e => setForm(f => ({ ...f, canal: (e.target.value || null) as OportunidadeInput['canal'] }))}>
              <option value="">Selecione</option>
              {CRM_CANAIS.map(c => <option key={c} value={c}>{CRM_CANAL_LABEL[c]}</option>)}
            </Select>
            <FormField type="number" label="Sinal (R$)" value={String(form.sinal ?? 0)} onChange={e => setForm(f => ({ ...f, sinal: Number(e.target.value) || 0 }))} />
            <Select label="Financiamento" value={form.financiamento} onChange={e => setForm(f => ({ ...f, financiamento: e.target.value as OportunidadeInput['financiamento'] }))}>
              {CRM_FINANCIAMENTO.map(fin => <option key={fin} value={fin}>{FINANCIAMENTO_LABEL[fin]}</option>)}
            </Select>
          </div>
        )}
      </Modal>
    </main>
  )
}

export default FunilVendedor
