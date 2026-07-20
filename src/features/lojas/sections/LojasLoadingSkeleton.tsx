import {
  MxLoadingState,
  MxModuleHeader,
  MxModulePage,
  MxSectionCard,
} from '@/components/module/MxModuleVisualPrimitives'

export function LojasLoadingSkeleton() {
  return (
    <MxModulePage>
      <MxModuleHeader
        eyebrow="Visão da rede"
        title="Carregando lojas"
        description="Preparando vínculos, indicadores e status das unidades."
      />
      <MxSectionCard>
        <MxLoadingState label="Carregando lojas" />
      </MxSectionCard>
    </MxModulePage>
  )
}
