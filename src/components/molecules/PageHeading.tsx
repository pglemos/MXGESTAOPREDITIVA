import type { ReactNode } from 'react'
import { Typography } from '../atoms/Typography'

type PageHeadingProps = {
  title: ReactNode
  /** Subtítulo curto em caps (padrão da tela de Ranking). */
  subtitle?: ReactNode
  /** Slot de ações/filtros à direita. */
  actions?: ReactNode
  /** Breadcrumb opcional renderizado acima do título. */
  breadcrumb?: ReactNode
}

/**
 * Cabeçalho de página canônico do sistema — espelha o padrão da tela /classificacao:
 * barra de acento + título h1 + subtítulo em caps. Usar em todas as telas de conteúdo.
 */
export function PageHeading({ title, subtitle, actions, breadcrumb }: PageHeadingProps) {
  return (
    <header className="flex min-w-0 shrink-0 flex-col justify-between gap-mx-md border-b border-border-default pb-mx-lg lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-col gap-mx-tiny text-center lg:text-left">
        {breadcrumb && <div className="mb-mx-xs">{breadcrumb}</div>}
        <div className="flex min-w-0 items-center justify-center gap-mx-sm lg:justify-start">
          <div className="h-mx-10 w-mx-xs shrink-0 rounded-mx-full bg-brand-primary shadow-mx-md" aria-hidden="true" />
          <Typography variant="h1" className="min-w-0 break-words text-3xl leading-tight md:text-[2rem] xl:text-4xl">{title}</Typography>
        </div>
        {subtitle && (
          <Typography variant="caption" className="pl-mx-md font-black uppercase tracking-mx-wide text-text-label">
            {subtitle}
          </Typography>
        )}
      </div>
      {actions && (
        <div className="flex w-full min-w-0 flex-col items-center gap-mx-sm sm:flex-row sm:flex-wrap lg:w-auto lg:max-w-[58%] lg:justify-end">
          {actions}
        </div>
      )}
    </header>
  )
}
