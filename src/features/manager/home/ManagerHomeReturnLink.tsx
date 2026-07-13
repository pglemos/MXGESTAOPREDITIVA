import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const MANAGER_NAVIGATION_CONTEXT_KEY = 'mx_contexto_navegacao'

export function ManagerHomeReturnLink() {
  const navigate = useNavigate()
  const context = readManagerDashboardContext()

  if (!context) return null

  return (
    <button
      type="button"
      onClick={() => {
        sessionStorage.removeItem(MANAGER_NAVIGATION_CONTEXT_KEY)
        navigate('/home')
      }}
      className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
    >
      <ArrowLeft size={16} /> Voltar para o Início
    </button>
  )
}

function readManagerDashboardContext() {
  if (typeof sessionStorage === 'undefined') return null
  const rawContext = sessionStorage.getItem(MANAGER_NAVIGATION_CONTEXT_KEY)
  if (!rawContext) return null

  try {
    const context = JSON.parse(rawContext) as { origemNavegacao?: unknown }
    return context.origemNavegacao === 'DASHBOARD_GERENCIAL' ? context : null
  } catch {
    return null
  }
}

export default ManagerHomeReturnLink
