import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/atoms/Button'
import { EmptyState } from '@/components/atoms/EmptyState'
import { Input } from '@/components/atoms/Input'
import { Typography } from '@/components/atoms/Typography'
import { requestToastConfirmation } from '@/lib/ui/confirmAction'
import { useRegrasRemuneracao, type RemuneracaoRegra, type RemuneracaoRegraTipo } from '../hooks/useRemuneracao'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

type FormState = {
  cargo: string
  tipo: RemuneracaoRegraTipo
  valor: string
  percentual_meta_min: string
}

const EMPTY: FormState = {
  cargo: 'Vendedor',
  tipo: 'comissao_por_venda',
  valor: '',
  percentual_meta_min: '',
}

const TIPO_LABEL: Record<RemuneracaoRegraTipo, string> = {
  comissao_por_venda: 'Comissão por venda',
  bonus_meta: 'Bônus por meta',
}

export function CadastroRegras({ lojaId }: { lojaId: string }) {
  const { regras, loading, error, salvarRegra, removerRegra } = useRegrasRemuneracao(lojaId)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  const num = (v: string) => Number(String(v).replace(',', '.')) || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cargo.trim()) { toast.error('Informe o cargo.'); return }
    if (num(form.valor) <= 0) { toast.error('Informe um valor maior que zero.'); return }
    if (form.tipo === 'bonus_meta' && num(form.percentual_meta_min) <= 0) {
      toast.error('Informe o percentual mínimo da meta.')
      return
    }

    setSaving(true)
    const { error } = await salvarRegra({
      loja_id: lojaId,
      cargo: form.cargo.trim(),
      tipo: form.tipo,
      valor: num(form.valor),
      percentual_meta_min: form.tipo === 'bonus_meta' ? num(form.percentual_meta_min) : null,
      ativo: true,
    })
    setSaving(false)

    if (error) toast.error(error)
    else {
      toast.success('Regra de remuneração salva.')
      setForm(EMPTY)
    }
  }

  const handleRemove = (regra: RemuneracaoRegra) => {
    requestToastConfirmation({
      key: `rem-regra:${regra.id}`,
      title: `Remover ${TIPO_LABEL[regra.tipo]}?`,
      description: 'Esta regra deixa de compor o salário estimado do cargo.',
      label: 'Remover',
      onConfirm: async () => {
        const { error } = await removerRegra(regra.id)
        if (error) toast.error(error)
        else toast.success('Regra removida.')
      },
    })
  }

  return (
    <div className="space-y-mx-lg">
      <form onSubmit={handleSubmit} className="rounded-mx-xl border border-border-default bg-surface-alt p-mx-md">
        <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest">
          Regras de comissão e bônus
        </Typography>
        <div className="mt-mx-sm grid gap-mx-sm md:grid-cols-[1fr_1fr_1fr_1fr]">
          <Field label="Cargo">
            <Input value={form.cargo} onChange={e => setForm(p => ({ ...p, cargo: e.target.value }))} placeholder="Ex.: Vendedor" />
          </Field>
          <Field label="Tipo">
            <select
              value={form.tipo}
              onChange={e => setForm(p => ({ ...p, tipo: e.target.value as RemuneracaoRegraTipo }))}
              className="w-full h-mx-14 px-mx-sm bg-white border border-border-default rounded-mx-xl font-black uppercase text-xs focus:outline-none focus:border-brand-primary appearance-none cursor-pointer"
            >
              <option value="comissao_por_venda">Comissão por venda</option>
              <option value="bonus_meta">Bônus por meta</option>
            </select>
          </Field>
          <Field label={form.tipo === 'bonus_meta' ? 'Bônus (R$)' : 'Valor por venda (R$)'}>
            <Input inputMode="decimal" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} placeholder="0,00" />
          </Field>
          <Field label="Meta mínima (%)">
            <Input
              inputMode="decimal"
              value={form.percentual_meta_min}
              onChange={e => setForm(p => ({ ...p, percentual_meta_min: e.target.value }))}
              placeholder={form.tipo === 'bonus_meta' ? '100' : 'Não se aplica'}
              disabled={form.tipo !== 'bonus_meta'}
            />
          </Field>
        </div>
        <div className="mt-mx-md flex justify-end">
          <Button type="submit" disabled={saving} icon={<Plus size={16} />}>
            {saving ? 'Salvando…' : 'Salvar regra'}
          </Button>
        </div>
      </form>

      {error && <p className="text-sm font-bold text-rose-600">Erro ao carregar: {error}</p>}

      {loading ? (
        <p className="text-sm font-bold text-text-tertiary">Carregando regras…</p>
      ) : regras.length === 0 ? (
        <EmptyState title="Nenhuma regra cadastrada" description="Adicione comissão por venda e bônus por meta para ativar o salário estimado." />
      ) : (
        <div className="overflow-x-auto rounded-mx-xl border border-border-default">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-text-secondary">
              <tr className="text-left uppercase tracking-widest text-xs font-black">
                <th className="px-mx-md py-mx-sm">Cargo</th>
                <th className="px-mx-md py-mx-sm">Tipo</th>
                <th className="px-mx-md py-mx-sm text-right">Valor</th>
                <th className="px-mx-md py-mx-sm text-right">Meta mínima</th>
                <th className="px-mx-md py-mx-sm" />
              </tr>
            </thead>
            <tbody>
              {regras.map(regra => (
                <tr key={regra.id} className="border-t border-border-default">
                  <td className="px-mx-md py-mx-sm font-black uppercase">{regra.cargo}</td>
                  <td className="px-mx-md py-mx-sm">{TIPO_LABEL[regra.tipo]}</td>
                  <td className="px-mx-md py-mx-sm text-right font-black">{BRL.format(Number(regra.valor))}</td>
                  <td className="px-mx-md py-mx-sm text-right">
                    {regra.tipo === 'bonus_meta' ? `${Number(regra.percentual_meta_min || 0)}%` : '—'}
                  </td>
                  <td className="px-mx-md py-mx-sm text-right">
                    <Button type="button" variant="ghost" size="icon" aria-label="Remover" onClick={() => handleRemove(regra)}>
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-mx-xs">
      <span className="block px-1 text-xs font-black uppercase tracking-widest text-text-tertiary">{label}</span>
      {children}
    </label>
  )
}
