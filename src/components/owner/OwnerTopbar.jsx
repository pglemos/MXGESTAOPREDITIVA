import { Bell, LogOut, Menu, RefreshCw } from 'lucide-react'
import { useOwnerContext } from './OwnerContext'

export default function OwnerTopbar({ onOpenMenu }) {
  const {
    profile,
    data,
    selectedStoreId,
    selectableStores,
    changeStore,
    signOut,
  } = useOwnerContext()

  return (
    <header className="owner-base44-exact__topbar">
      <div className="owner-base44-exact__topbar-start">
        <button type="button" className="owner-base44-exact__menu-button" onClick={onOpenMenu} aria-label="Abrir menu">
          <Menu size={22} />
        </button>
        <div className="owner-base44-exact__store-control">
          <label htmlFor="owner-store-select">Unidade</label>
          <select
            id="owner-store-select"
            value={selectedStoreId || ''}
            onChange={(event) => changeStore(event.target.value)}
          >
            {selectableStores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="owner-base44-exact__period-controls" aria-label="Período de análise">
        <label>
          <span>Início</span>
          <input
            type="date"
            value={data.startDate || ''}
            onChange={(event) => data.setStartDate(event.target.value)}
          />
        </label>
        <label>
          <span>Fim</span>
          <input
            type="date"
            value={data.endDate || ''}
            onChange={(event) => data.setEndDate(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="owner-base44-exact__icon-button"
          onClick={data.handleRefresh}
          disabled={data.isRefetching}
          aria-label="Atualizar dados"
        >
          <RefreshCw size={18} className={data.isRefetching ? 'is-spinning' : ''} />
        </button>
      </div>

      <div className="owner-base44-exact__topbar-actions">
        <button type="button" className="owner-base44-exact__icon-button" aria-label="Notificações">
          <Bell size={19} />
        </button>
        <div className="owner-base44-exact__profile">
          <div className="owner-base44-exact__avatar" aria-hidden="true">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : (profile?.name || 'D').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <strong>{profile?.name || 'Dono da Loja'}</strong>
            <span>Dono</span>
          </div>
        </div>
        <button type="button" className="owner-base44-exact__icon-button" onClick={signOut} aria-label="Sair">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
