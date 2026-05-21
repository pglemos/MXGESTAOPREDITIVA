import { useMemo } from 'react'
import { useLojasPage } from './hooks/useLojasPage'
import { buildStoreColumns } from './data/storeColumns'
import { LojasErrorBoundary } from './components/LojasErrorBoundary'
import { LojasLoadingSkeleton } from './sections/LojasLoadingSkeleton'
import { LojasHeader } from './sections/LojasHeader'
import { OwnerExecutiveSection } from './sections/OwnerExecutiveSection'
import { CorporateMetricsSection } from './sections/CorporateMetricsSection'
import { StoresGridSection } from './sections/StoresGridSection'
import { CreateStoreModal } from './modals/CreateStoreModal'

/**
 * Lojas — container raiz.
 *
 * Decomposição da page monolítica `src/pages/Lojas.tsx` (Story 3.5 reconciliada, ADR-0050).
 * Comportamento e visual idênticos ao original. Estado e handlers centralizados em
 * `useLojasPage`; renderização dividida em sections puras + modal extraído.
 */
export function Lojas() {
  const page = useLojasPage()

  const columns = useMemo(
    () =>
      buildStoreColumns({
        stats: page.stats,
        role: page.role,
        isOwner: page.isOwner,
        copyRegistrationLink: page.copyRegistrationLink,
        getRegistrationLink: page.getRegistrationLink,
        handleArchiveStore: page.handleArchiveStore,
        toggleStoreStatus: page.toggleStoreStatus,
      }),
    [
      page.stats,
      page.role,
      page.isOwner,
      page.copyRegistrationLink,
      page.getRegistrationLink,
      page.handleArchiveStore,
      page.toggleStoreStatus,
    ]
  )

  if (page.loading && !page.isRefetching) {
    return <LojasLoadingSkeleton />
  }

  return (
    <LojasErrorBoundary sectionName="Lojas">
      <main
        className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt"
        id="main-content"
      >
        <LojasErrorBoundary sectionName="LojasHeader">
          <LojasHeader
            isOwner={page.isOwner}
            isAdminMx={page.isAdminMx}
            searchTerm={page.searchTerm}
            onSearchChange={page.setSearchTerm}
            filterActive={page.filterActive}
            onFilterChange={page.setFilterActive}
            storeStatusCounts={page.storeStatusCounts}
            isRefetching={page.isRefetching}
            lastUpdatedAt={page.lastUpdatedAt}
            onRefresh={page.handleRefresh}
            onOpenCreate={() => page.setIsCreateModalOpen(true)}
          />
        </LojasErrorBoundary>

        {page.copyError && (
          <div
            role="alert"
            className="rounded-mx-xl border border-status-warning/20 bg-status-warning-surface px-mx-md py-mx-sm text-sm font-bold text-status-warning"
          >
            {page.copyError}
          </div>
        )}

        {page.isOwner && (
          <LojasErrorBoundary sectionName="OwnerExecutive">
            <OwnerExecutiveSection
              ownerActiveStores={page.ownerActiveStores}
              ownerAttentionStores={page.ownerAttentionStores}
              stats={page.stats}
            />
          </LojasErrorBoundary>
        )}

        <LojasErrorBoundary sectionName="CorporateMetrics">
          <CorporateMetricsSection isOwner={page.isOwner} metrics={page.corporateMetrics} />
        </LojasErrorBoundary>

        <LojasErrorBoundary sectionName="StoresGrid">
          <StoresGridSection
            isOwner={page.isOwner}
            columns={columns}
            data={page.filteredStores}
          />
        </LojasErrorBoundary>

        <CreateStoreModal
          isOpen={page.isCreateModalOpen}
          modalRef={page.createModalRef}
          newStore={page.newStore}
          setNewStore={page.setNewStore}
          creating={page.creating}
          onSubmit={page.handleCreateStore}
          onClose={() => page.setIsCreateModalOpen(false)}
        />
      </main>
    </LojasErrorBoundary>
  )
}

export default Lojas
