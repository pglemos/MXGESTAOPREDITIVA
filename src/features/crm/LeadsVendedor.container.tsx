import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Sparkles, Phone, UserCheck, Search, ArrowRightCircle } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { PageHeader } from '@/components/molecules/PageHeader'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { EmptyState } from '@/components/atoms/EmptyState'
import { useClientes } from '@/features/crm/hooks/useClientes'
import { CRM_CANAL_LABEL } from '@/lib/schemas/crm.schema'

const fmtData = (s: string | null) => (s ? new Date(s).toLocaleDateString('pt-BR') : '—')

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-md">
      <Typography variant="caption" tone="muted" className="uppercase tracking-wide">{label}</Typography>
      <Typography variant="h2" className="mt-mx-xs text-3xl">{value}</Typography>
      {hint && <Typography variant="caption" tone="muted">{hint}</Typography>}
    </Card>
  )
}

/**
 * Leads — clientes que ainda precisam de primeiro contato/qualificação.
 * Leads = status 'aguardando_contato'. Qualificar move para 'oportunidade'.
 */
export function LeadsVendedor() {
  const { clientes, loading, error, updateCliente } = useClientes()
  const [search, setSearch] = useState('')

  const leads = useMemo(() => clientes.filter(c => c.status === 'aguardando_contato'), [clientes])
  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return leads
    return leads.filter(c => c.nome.toLowerCase().includes(q) || (c.telefone || '').includes(q))
  }, [leads, search])

  const novosSemana = useMemo(() => {
    const limite = new Date(); limite.setDate(limite.getDate() - 7)
    return leads.filter(c => new Date(c.created_at) >= limite).length
  }, [leads])

  async function qualificar(id: string, nome: string) {
    const { error: e } = await updateCliente(id, { status: 'oportunidade' })
    if (e) { toast.error(e); return }
    toast.success(`"${nome}" qualificado como oportunidade.`)
  }

  function ligar(tel: string | null) {
    if (!tel) { toast.error('Lead sem telefone.'); return }
    const num = tel.replace(/\D/g, '')
    window.open(`https://wa.me/${num.length <= 11 ? '55' + num : num}`, '_blank', 'noopener')
  }

  return (
    <main className="w-full h-full overflow-y-auto bg-surface-alt p-mx-md md:p-mx-lg no-scrollbar">
      <div className="flex flex-col gap-mx-lg pb-28">
        <PageHeader title="Leads" description="Novos contatos aguardando qualificação. Aja rápido para aumentar a conversão." />

        {error && <Typography className="text-status-error">{error}</Typography>}

        <section className="grid grid-cols-2 gap-mx-md md:grid-cols-3" aria-label="Indicadores de leads">
          <Metric label="Leads aguardando" value={String(leads.length)} hint="sem primeiro contato" />
          <Metric label="Novos (7 dias)" value={String(novosSemana)} hint="entraram esta semana" />
          <Metric label="Total na carteira" value={String(clientes.length)} hint="clientes + leads" />
        </section>

        <Card className="border-none bg-white p-mx-lg shadow-mx-md">
          <div className="flex items-center gap-mx-sm"><Sparkles size={18} /><Typography variant="h3" className="uppercase tracking-tight">Leads para qualificar</Typography></div>
          <div className="relative mt-mx-md w-full lg:max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar lead..." className="pl-9" />
          </div>

          <div className="mt-mx-lg overflow-x-auto">
            {loading ? (
              <Typography tone="muted">Carregando leads...</Typography>
            ) : filtrados.length === 0 ? (
              <EmptyState
                title={leads.length === 0 ? 'Nenhum lead aguardando' : 'Nenhum lead encontrado'}
                description={leads.length === 0 ? 'Cadastre clientes no Fechamento ou na Carteira; os que ficam como "aguardando contato" aparecem aqui.' : 'Ajuste a busca.'}
              />
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-text-muted">
                    <th className="pb-mx-sm font-semibold">Lead</th>
                    <th className="pb-mx-sm font-semibold">Telefone</th>
                    <th className="pb-mx-sm font-semibold">Origem</th>
                    <th className="pb-mx-sm font-semibold">Entrou em</th>
                    <th className="pb-mx-sm font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(l => (
                    <tr key={l.id} className="border-t border-border-subtle">
                      <td className="py-mx-sm">
                        <Typography variant="p" className="font-semibold">{l.nome}</Typography>
                        {l.empresa && <Typography variant="caption" tone="muted">{l.empresa}</Typography>}
                      </td>
                      <td className="py-mx-sm text-text-secondary">{l.telefone || '—'}</td>
                      <td className="py-mx-sm">{l.canal_origem ? <Badge variant="outline">{CRM_CANAL_LABEL[l.canal_origem]}</Badge> : <span className="text-text-muted">—</span>}</td>
                      <td className="py-mx-sm text-text-secondary">{fmtData(l.created_at)}</td>
                      <td className="py-mx-sm">
                        <div className="flex items-center justify-end gap-mx-xs">
                          <Button variant="ghost" size="sm" onClick={() => ligar(l.telefone)}><Phone size={14} /> Contatar</Button>
                          <Button variant="secondary" size="sm" onClick={() => qualificar(l.id, l.nome)}><UserCheck size={14} /> Qualificar</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <div className="flex items-center gap-mx-sm text-text-muted">
          <ArrowRightCircle size={16} />
          <Typography variant="caption" tone="muted">Ao qualificar, o lead vira oportunidade e aparece na Carteira e no Funil.</Typography>
        </div>
      </div>
    </main>
  )
}

export default LeadsVendedor
