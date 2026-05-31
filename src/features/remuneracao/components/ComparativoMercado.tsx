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
  abaixo: { label: 'Abaixo da média', cls: 'bg-amber-100 text-amber-800' },
  dentro: { label: 'Dentro da média', cls: 'bg-emerald-100 text-emerald-800' },
  acima: { label: 'Acima da média', cls: 'bg-sky-100 text-sky-800' },
  sem_referencia: { label: 'Sem referência', cls: 'bg-slate-100 text-slate-600' },
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
    <div className="space-y-mx-lg">
      <div className="rounded-mx-xl border border-border-default bg-surface-alt p-mx-md">
        <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest">
          Parâmetros de comparação
        </Typography>
        <div className="mt-mx-sm grid gap-mx-sm md:grid-cols-3">
          <Field label="Região">
            <Input value={regiao} onChange={e => setRegiao(e.target.value)} placeholder="Ex.: Sudeste" />
          </Field>
          <Field label="Tamanho da loja">
            <select
              aria-label="Tamanho da loja"
              value={faixaTamanho}
              onChange={e => setFaixaTamanho(e.target.value)}
              className="w-full h-mx-14 px-mx-sm bg-white border border-border-default rounded-mx-xl font-black uppercase text-xs focus:outline-none focus:border-brand-primary appearance-none cursor-pointer"
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
        <p className="text-sm font-bold text-text-tertiary">Calculando comparativo…</p>
      ) : linhas.length === 0 ? (
        <EmptyState title="Sem planos para comparar" description="Cadastre planos de remuneração na aba anterior." />
      ) : (
        <div className="overflow-x-auto rounded-mx-xl border border-border-default">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-text-secondary">
              <tr className="text-left uppercase tracking-widest text-xs font-black">
                <th className="px-mx-md py-mx-sm">Cargo</th>
                <th className="px-mx-md py-mx-sm text-right">Total atual</th>
                <th className="px-mx-md py-mx-sm text-right">Faixa de mercado</th>
                <th className="px-mx-md py-mx-sm">Classificação</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(l => (
                <tr key={l.cargo} className="border-t border-border-default">
                  <td className="px-mx-md py-mx-sm font-black uppercase">{l.cargo}</td>
                  <td className="px-mx-md py-mx-sm text-right font-black">{BRL.format(l.total)}</td>
                  <td className="px-mx-md py-mx-sm text-right text-text-secondary">
                    {l.faixa ? `${BRL.format(l.faixa.min)} – ${BRL.format(l.faixa.max)}` : '—'}
                  </td>
                  <td className="px-mx-md py-mx-sm">
                    <span className={`inline-flex rounded-mx-full px-mx-sm py-1 text-xs font-black uppercase tracking-widest ${BADGE[l.classificacao].cls}`}>
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
    <label className="block space-y-mx-xs">
      <span className="block px-1 text-xs font-black uppercase tracking-widest text-text-tertiary">{label}</span>
      {children}
    </label>
  )
}
