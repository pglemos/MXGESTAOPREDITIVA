import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import OwnerConsultantModal from './OwnerConsultantModal'
import OwnerSidebar from './OwnerSidebar'
import OwnerTopbar from './OwnerTopbar'
import { useOwnerContext } from './OwnerContext'

export default function OwnerLayout({ children }) {
  const { storeSlug } = useOwnerContext()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  return (
    <div className="owner-base44-exact">
      <OwnerSidebar storeSlug={storeSlug} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="owner-base44-exact__workspace">
        <OwnerTopbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="owner-base44-exact__content" id="owner-main-content">
          {children}
        </main>
      </div>
      <OwnerConsultantModal />
    </div>
  )
}
