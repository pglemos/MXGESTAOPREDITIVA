import { useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface AgendaSearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  placeholder?: string
}

export function AgendaSearchBar({ searchQuery, onSearchChange, placeholder = 'Buscar cliente, consultor ou evento...' }: AgendaSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search input when pressing '/' key outside inputs/textareas
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="relative flex items-center flex-1 max-w-md min-w-[200px]">
      <Search size={16} className="absolute left-3 text-text-tertiary pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Buscar agendamentos"
        className="w-full h-9 pl-9 pr-14 text-xs bg-surface-alt/60 hover:bg-surface-alt border border-border-strong focus:border-brand-primary focus:bg-white focus:outline-none rounded-mx-lg text-text-primary placeholder:text-text-tertiary transition-all"
      />
      {searchQuery ? (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          className="absolute right-2 text-text-tertiary hover:text-text-primary p-1 rounded-mx-md"
          aria-label="Limpar busca"
        >
          <X size={14} />
        </button>
      ) : (
        <kbd className="absolute right-2.5 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-text-tertiary bg-white border border-border-strong rounded shadow-2xs pointer-events-none">
          /
        </kbd>
      )}
    </div>
  )
}
