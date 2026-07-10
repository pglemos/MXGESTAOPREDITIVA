import { Card } from '@/components/molecules/Card'
import { DataGrid, type Column } from '@/components/organisms/DataGrid'
import type { Store } from '@/types/database'

interface StoresGridSectionProps {
  isOwner: boolean
  columns: Column<Store>[]
  data: Store[]
}

/**
 * Seção principal: DataGrid com todas as lojas filtradas.
 *
 * Extraído de `src/pages/Lojas.tsx` (Story 3.5 reconciliada, ADR-0050).
 */
export function StoresGridSection({ isOwner, columns, data }: StoresGridSectionProps) {
  return (
    <div className="flex-1 min-h-0 pb-32" aria-live="polite">
      <Card className="rounded-mx-lg border border-border-subtle shadow-mx-sm bg-white overflow-hidden p-mx-0">
        <DataGrid
          columns={columns}
          data={data}
          emptyMessage={
            isOwner
              ? 'Nenhuma loja encontrada na sua visão executiva.'
              : 'Nenhuma unidade localizada na rede MX.'
          }
          emptyDescription={
            isOwner
              ? 'Limpe a busca ou solicite ao Admin MX revisar seus vínculos de Dono.'
              : 'Ajuste a busca, alterne o filtro de status ou cadastre uma nova unidade para iniciar a operação.'
          }
        />
      </Card>
    </div>
  )
}
