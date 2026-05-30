import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { PageHeader } from '@/components/molecules/PageHeader'
import { TabNav, type TabNavItem } from '@/components/molecules/TabNav'
import { EmptyState } from '@/components/atoms/EmptyState'
import { CadastroPlanos } from './components/CadastroPlanos'
import { ComparativoMercado } from './components/ComparativoMercado'
import { useLojasDoUsuario } from './hooks/useRemuneracao'

type TabKey = 'cadastro' | 'comparativo'

const TABS: TabNavItem<TabKey>[] = [
  { key: 'cadastro', label: 'Plano atual' },
  { key: 'comparativo', label: 'Comparativo de mercado' },
]

export default function RemuneracaoPage() {
  const { lojas, loading } = useLojasDoUsuario()
  const [lojaId, setLojaId] = useState<string>('')
  const [tab, setTab] = useState<TabKey>('cadastro')

  const lojaSelecionada = lojaId || (lojas.length === 1 ? lojas[0].id : '')

  return (
    <main className="mx-auto w-full max-w-6xl px-mx-md py-mx-lg space-y-mx-lg">
      <PageHeader
        title="Remuneração Inteligente"
        description="Cadastre o plano de remuneração por cargo e compare com a média de mercado."
        actions={
          <label className="flex items-center gap-mx-sm">
            <span className="text-xs font-black uppercase tracking-widest text-text-tertiary">Loja</span>
            <select
              value={lojaSelecionada}
              onChange={e => setLojaId(e.target.value)}
              disabled={loading || lojas.length === 0}
              className="h-mx-12 px-mx-sm bg-surface-alt border border-border-default rounded-mx-xl font-black uppercase text-xs focus:outline-none focus:border-brand-primary appearance-none cursor-pointer"
            >
              <option value="">Selecione…</option>
              {lojas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
        }
      />

      {!lojaSelecionada ? (
        <EmptyState
          icon={<Wallet size={28} />}
          title={loading ? 'Carregando lojas…' : 'Selecione uma loja'}
          description="Escolha a loja para gerenciar a remuneração dos cargos."
        />
      ) : (
        <>
          <TabNav tabs={TABS} activeTab={tab} onTabChange={setTab} />
          {tab === 'cadastro'
            ? <CadastroPlanos lojaId={lojaSelecionada} />
            : <ComparativoMercado lojaId={lojaSelecionada} />}
        </>
      )}
    </main>
  )
}
