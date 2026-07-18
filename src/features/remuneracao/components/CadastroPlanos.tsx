import { useState } from 'react'
import { Save, Trash2, Plus } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Typography } from '@/components/atoms/Typography'
import { EmptyState } from '@/components/atoms/EmptyState'
import { requestToastConfirmation } from '@/lib/ui/confirmAction'
import { usePlanosRemuneracao, totalPlano, type RemuneracaoPlano } from '../hooks/useRemuneracao'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface FormState {
  cargo: string
  salario_fixo: string
  salario_variavel: string
  beneficios: string
}

const EMPTY: FormState = { cargo: '', salario_fixo: '', salario_variavel: '', beneficios: '' }

export function CadastroPlanos({ lojaId }: { lojaId: string }) {
  const { planos, loading, error, salvarPlano, removerPlano } = usePlanosRemuneracao(lojaId)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  const num = (v: string) => Number(String(v).replace(',', '.')) || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cargo.trim()) { toast.error('Informe o cargo.'); return }
    setSaving(true)
    const { error } = await salvarPlano({
      loja_id: lojaId,
      cargo: form.cargo.trim(),
      salario_fixo: num(form.salario_fixo),
      salario_variavel: num(form.salario_variavel),
      beneficios: num(form.beneficios),
    })
    setSaving(false)
    if (error) toast.error(error)
    else { toast.success(`Plano de ${form.cargo} salvo!`); setForm(EMPTY) }
  }

  const handleRemove = (p: RemuneracaoPlano) => {
    requestToastConfirmation({
      key: `rem-plano:${p.id}`,
      title: `Remover plano de ${p.cargo}?`,
      description: 'O registro de remuneração deste cargo será excluído.',
      label: 'Remover',
      onConfirm: async () => {
        const { error } = await removerPlano(p.id)
        if (error) toast.error(error)
        else toast.success('Plano removido.')
      },
    })
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
        <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest">
          Adicionar / atualizar plano por cargo
        </Typography>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Field label="Cargo">
            <Input value={form.cargo} onChange={e => setForm(p => ({ ...p, cargo: e.target.value }))} placeholder="Ex.: Vendedor" />
          </Field>
          <Field label="Fixo (R$)">
            <Input inputMode="decimal" value={form.salario_fixo} onChange={e => setForm(p => ({ ...p, salario_fixo: e.target.value }))} placeholder="0,00" />
          </Field>
          <Field label="Variável (R$)">
            <Input inputMode="decimal" value={form.salario_variavel} onChange={e => setForm(p => ({ ...p, salario_variavel: e.target.value }))} placeholder="0,00" />
          </Field>
          <Field label="Benefícios (R$)">
            <Input inputMode="decimal" value={form.beneficios} onChange={e => setForm(p => ({ ...p, beneficios: e.target.value }))} placeholder="0,00" />
          </Field>
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saving} icon={saving ? undefined : <Plus size={16} />}>
            {saving ? 'Salvando…' : <><Save size={16} className="mr-2" /> Salvar plano</>}
          </Button>
        </div>
      </form>

      {error && <p className="text-sm font-bold text-red-600">Erro ao carregar: {error}</p>}

      {loading ? (
        <p className="text-sm font-bold text-gray-500">Carregando planos…</p>
      ) : planos.length === 0 ? (
        <EmptyState title="Nenhum plano cadastrado" description="Adicione o plano de remuneração de cada cargo desta loja." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr className="text-left uppercase tracking-widest text-xs font-black">
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4 text-right">Fixo</th>
                <th className="px-6 py-4 text-right">Variável</th>
                <th className="px-6 py-4 text-right">Benefícios</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {planos.map(p => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="px-6 py-4 font-black uppercase">{p.cargo}</td>
                  <td className="px-6 py-4 text-right">{BRL.format(Number(p.salario_fixo))}</td>
                  <td className="px-6 py-4 text-right">{BRL.format(Number(p.salario_variavel))}</td>
                  <td className="px-6 py-4 text-right">{BRL.format(Number(p.beneficios))}</td>
                  <td className="px-6 py-4 text-right font-black">{BRL.format(totalPlano(p))}</td>
                  <td className="px-6 py-4 text-right">
                    <Button type="button" variant="ghost" size="icon" aria-label="Remover" onClick={() => handleRemove(p)}>
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
    <label className="block space-y-2">
      <span className="block px-1 text-xs font-black uppercase tracking-widest text-gray-500">{label}</span>
      {children}
    </label>
  )
}
