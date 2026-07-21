import { useMemo, useState } from 'react'
import { Bell, Building2, LogOut, Menu, RefreshCw, ShieldCheck } from 'lucide-react'
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { useOwnerContext } from './OwnerContext'

const PERIOD_PRESETS = [
  { value: 'current', label: 'Mês atual' },
  { value: 'previous', label: 'Mês anterior' },
  { value: 'custom', label: 'Personalizado' },
]

function isCurrentMonthRange(startDate, endDate) {
  const today = new Date()
  return startDate === format(startOfMonth(today), 'yyyy-MM-dd') && endDate === format(today, 'yyyy-MM-dd')
}

function isPreviousMonthRange(startDate, endDate) {
  const previous = subMonths(new Date(), 1)
  return startDate === format(startOfMonth(previous), 'yyyy-MM-dd') && endDate === format(endOfMonth(previous), 'yyyy-MM-dd')
}

export default function OwnerTopbar({ onOpenMenu }) {
  const {
    profile,
    data,
    selectedStoreId,
    selectableStores,
    changeStore,
    signOut,
  } = useOwnerContext()

  const [customOpen, setCustomOpen] = useState(false)

  const activePreset = useMemo(() => {
    if (customOpen) return 'custom'
    if (isCurrentMonthRange(data.startDate, data.endDate)) return 'current'
    if (isPreviousMonthRange(data.startDate, data.endDate)) return 'previous'
    return 'custom'
  }, [customOpen, data.startDate, data.endDate])

  const applyPreset = (preset) => {
    if (preset === 'custom') {
      setCustomOpen(true)
      return
    }
    setCustomOpen(false)
    const today = new Date()
    if (preset === 'current') {
      data.setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'))
      data.setEndDate(format(today, 'yyyy-MM-dd'))
      return
    }
    const previous = subMonths(today, 1)
    data.setStartDate(format(startOfMonth(previous), 'yyyy-MM-dd'))
    data.setEndDate(format(endOfMonth(previous), 'yyyy-MM-dd'))
  }

  return (
    <header className="owner-base44-exact__topbar">
      <div className="owner-base44-exact__topbar-start">
        <button type="button" className="owner-base44-exact__menu-button" onClick={onOpenMenu} aria-label="Abrir menu">
          <Menu size={22} />
        </button>
        <span className="owner-base44-exact__mode-pill">
          <ShieldCheck size={14} aria-hidden="true" />
          Visão do Dono
        </span>
        <div className="owner-base44-exact__store-control">
          <label htmlFor="owner-store-select">
            <Building2 size={12} aria-hidden="true" /> Unidade
          </label>
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
        <div className="owner-base44-exact__store-control">
          <label htmlFor="owner-period-preset">Período</label>
          <select
            id="owner-period-preset"
            value={activePreset}
            onChange={(event) => applyPreset(event.target.value)}
          >
            {PERIOD_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>{preset.label}</option>
            ))}
          </select>
        </div>

        {customOpen ? (
          <>
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
          </>
        ) : null}

        <span className="owner-base44-exact__sync-label">{data.lastSyncLabel}</span>

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
