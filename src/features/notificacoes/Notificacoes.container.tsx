import { NotificacoesErrorBoundary } from './components/NotificacoesErrorBoundary'
import { useNotificacoesPage } from './hooks/useNotificacoesPage'
import { NotificacoesHeader } from './sections/NotificacoesHeader'
import { NotificacoesRoleBanners } from './sections/NotificacoesRoleBanners'
import { NotificacoesFiltersBar } from './sections/NotificacoesFiltersBar'
import { NotificacoesListSection } from './sections/NotificacoesListSection'

/**
 * Notificacoes — Container (Story 3.1, ADR-0050).
 * Orquestra hook agregador + seções (Header, RoleBanners, Lista, Filtros).
 * Realtime subscription centralizada no hook, ErrorBoundary local protege a página.
 */
export function Notificacoes() {
  const state = useNotificacoesPage()

  return (
    <NotificacoesErrorBoundary sectionName="Notificacoes">
      <main className="h-full w-full overflow-y-auto bg-surface-alt px-mx-sm py-mx-md no-scrollbar sm:px-mx-md lg:px-mx-lg">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-mx-lg pb-32">
        <NotificacoesHeader
          isRefetching={state.isRefetching}
          handleRefresh={state.handleRefresh}
          markAllAsRead={state.markAllAsRead}
        />

        <NotificacoesRoleBanners
          isOwner={state.isOwner}
        />

        <div className="grid items-start grid-cols-1 gap-mx-lg lg:grid-cols-12">
          <section className="lg:col-span-8 flex flex-col order-2 lg:order-1">
            <NotificacoesErrorBoundary sectionName="Lista de Notificações">
              <NotificacoesListSection
                unreadCount={state.unreadCount}
                grouped={state.grouped}
                isOwner={state.isOwner}
                markRead={state.markRead}
                markUnread={state.markUnread}
                deleteNotification={state.deleteNotification}
                isApprovalNotification={state.isApprovalNotification}
                getApprovalForNotification={state.getApprovalForNotification}
                reviewingPreRegistrationId={state.reviewingPreRegistrationId}
                handleReviewPreRegistration={state.handleReviewPreRegistration}
              />
            </NotificacoesErrorBoundary>
          </section>

          <aside className="lg:col-span-4 flex flex-col gap-mx-lg order-1 lg:order-2">
            <NotificacoesErrorBoundary sectionName="Filtros">
              <NotificacoesFiltersBar
                searchTerm={state.searchTerm}
                setSearchTerm={state.setSearchTerm}
                filterType={state.filterType}
                setFilterType={state.setFilterType}
              />
            </NotificacoesErrorBoundary>
          </aside>
        </div>
        </div>
      </main>
    </NotificacoesErrorBoundary>
  )
}

export default Notificacoes
