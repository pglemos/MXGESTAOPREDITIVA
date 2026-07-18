import { DataGrid, type Column } from '@/components/organisms/DataGrid'
import {
  MxSectionCard,
} from '@/components/module/MxModuleVisualPrimitives'
import type { Store } from '@/types/database'

interface StoresGridSectionProps {
  isOwner: boolean
  columns: Column<Store>[]
  data: Store[]
}

export function StoresGridSection({
  isOwner,
  columns,
  data,
}: StoresGridSectionProps) {
  return (
    <MxSectionCard className="pb-mx-20" aria-live="polite">
      <DataGrid
        columns={columns}
        data={data}
        emptyMessage={
          isOwner
            ? 'Nenhuma loja encontrada na visão executiva.'
            : 'Nenhuma loja encontrada na rede MX.'
        }
        emptyDescription={
          isOwner
            ? 'Ajuste a busca ou solicite ao Admin MX a revisão dos vínculos do perfil.'
            : 'Ajuste a busca, altere o filtro de status ou cadastre uma nova unidade.'
        }
      />
    </MxSectionCard>
  )
}
