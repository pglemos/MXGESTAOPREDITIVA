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
      <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
        <NotificacoesHeader
          isRefetching={state.isRefetching}
          handleRefresh={state.handleRefresh}
          markAllAsRead={state.markAllAsRead}
        />

        <NotificacoesRoleBanners
          isOwner={state.isOwner}
          isSeller={state.isSeller}
          unreadCount={state.unreadCount}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0 pb-32">
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
      </main>
    </NotificacoesErrorBoundary>
  )
}

export default Notificacoes
