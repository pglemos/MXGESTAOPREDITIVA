import type { ReactNode } from 'react'
import { Typography } from '../atoms/Typography'

type PageHeadingProps = {
  title: ReactNode
  /** Subtítulo curto em caps (padrão da tela de Ranking). */
  subtitle?: ReactNode
  /** Slot de ações/filtros à direita. */
  actions?: ReactNode
}

/**
 * Cabeçalho de página canônico do sistema — espelha o padrão da tela /classificacao:
 * barra de acento + título h1 + subtítulo em caps. Usar em todas as telas de conteúdo.
 */
export function PageHeading({ title, subtitle, actions }: PageHeadingProps) {
  return (
    <header className="flex shrink-0 flex-col justify-between gap-mx-lg border-b border-border-default pb-mx-lg lg:flex-row lg:items-center">
      <div className="flex flex-col gap-mx-tiny text-center lg:text-left">
        <div className="flex items-center justify-center gap-mx-sm lg:justify-start">
          <div className="h-mx-10 w-mx-xs shrink-0 rounded-mx-full bg-brand-primary shadow-mx-md" aria-hidden="true" />
          <Typography variant="h1">{title}</Typography>
        </div>
        {subtitle && (
          <Typography variant="caption" className="pl-mx-md font-black uppercase tracking-mx-wide text-text-label">
            {subtitle}
          </Typography>
        )}
      </div>
      {actions && (
        <div className="flex w-full shrink-0 flex-col items-center gap-mx-sm sm:flex-row lg:w-auto lg:justify-end">
          {actions}
        </div>
      )}
    </header>
  )
}
