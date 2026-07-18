import { useMemo, useState } from 'react'
import { Input } from '@/components/atoms/Input'
import { Typography } from '@/components/atoms/Typography'
import { EmptyState } from '@/components/atoms/EmptyState'
import {
  usePlanosRemuneracao,
  useBenchmark,
  montarComparativo,
  type Classificacao,
} from '../hooks/useRemuneracao'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const TAMANHOS = [
  { value: '', label: 'Selecione…' },
  { value: 'pequena', label: 'Pequena' },
  { value: 'media', label: 'Média' },
  { value: 'grande', label: 'Grande' },
]

const BADGE: Record<Classificacao, { label: string; cls: string }> = {
  abaixo: { label: 'Abaixo da média', cls: 'bg-amber-50 text-amber-600' },
  dentro: { label: 'Dentro da média', cls: 'bg-secondary text-emerald-600' },
  acima: { label: 'Acima da média', cls: 'bg-accent text-accent-foreground' },
  sem_referencia: { label: 'Sem referência', cls: 'bg-muted text-muted-foreground' },
}

export function ComparativoMercado({ lojaId }: { lojaId: string }) {
  const [regiao, setRegiao] = useState('')
  const [faixaTamanho, setFaixaTamanho] = useState('')
  const [meta, setMeta] = useState('')

  const { planos, loading: loadingPlanos } = usePlanosRemuneracao(lojaId)
  const { benchmark, loading: loadingBench } = useBenchmark({ regiao, faixaTamanho, meta })

  const linhas = useMemo(() => montarComparativo(planos, benchmark), [planos, benchmark])
  const paramsOk = Boolean(regiao && faixaTamanho)

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
        <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest">
          Parâmetros de comparação
        </Typography>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="Região">
            <Input value={regiao} onChange={e => setRegiao(e.target.value)} placeholder="Ex.: Sudeste" />
          </Field>
          <Field label="Tamanho da loja">
            <select
              aria-label="Tamanho da loja"
              value={faixaTamanho}
              onChange={e => setFaixaTamanho(e.target.value)}
              className="w-full h-14 px-4 bg-white border border-gray-100 rounded-2xl font-black uppercase text-xs focus:outline-none focus:border-emerald-600 appearance-none cursor-pointer"
            >
              {TAMANHOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Meta (opcional)">
            <Input value={meta} onChange={e => setMeta(e.target.value)} placeholder="Ex.: agressiva" />
          </Field>
        </div>
      </div>

      {!paramsOk ? (
        <EmptyState title="Defina os parâmetros" description="Informe região e tamanho da loja para comparar contra o mercado." />
      ) : loadingPlanos || loadingBench ? (
        <p className="text-sm font-bold text-gray-500">Calculando comparativo…</p>
      ) : linhas.length === 0 ? (
        <EmptyState title="Sem planos para comparar" description="Cadastre planos de remuneração na aba anterior." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr className="text-left uppercase tracking-widest text-xs font-black">
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4 text-right">Total atual</th>
                <th className="px-6 py-4 text-right">Faixa de mercado</th>
                <th className="px-6 py-4">Classificação</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(l => (
                <tr key={l.cargo} className="border-t border-gray-100">
                  <td className="px-6 py-4 font-black uppercase">{l.cargo}</td>
                  <td className="px-6 py-4 text-right font-black">{BRL.format(l.total)}</td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {l.faixa ? `${BRL.format(l.faixa.min)} – ${BRL.format(l.faixa.max)}` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest ${BADGE[l.classificacao].cls}`}>
                      {BADGE[l.classificacao].label}
                    </span>
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
