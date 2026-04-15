import { ChevronRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'

interface BreadcrumbItem {
  label: string
  to?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="mb-mx-md">
      <ol className="flex items-center gap-mx-xs text-sm text-text-secondary">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-mx-xs">
            {index > 0 && <ChevronRight size={14} className="text-text-tertiary" aria-hidden="true" />}
            {item.to && index < items.length - 1 ? (
              <NavLink to={item.to} className="hover:text-text-primary transition-colors">
                {item.label}
              </NavLink>
            ) : (
              <span aria-current={index === items.length - 1 ? 'page' : undefined} className="text-text-primary font-medium">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
