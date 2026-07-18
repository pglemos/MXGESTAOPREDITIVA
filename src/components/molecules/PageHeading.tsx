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
    <header className="flex min-w-0 shrink-0 flex-col justify-between gap-4 border-b border-gray-100 pb-6 sm:gap-6 sm:pb-8 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-col gap-1 text-center lg:text-left">
        {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
        <div className="flex min-w-0 items-center justify-center gap-4 lg:justify-start">
          <div className="h-8 w-2 shrink-0 rounded-full bg-emerald-600 shadow-sm sm:h-10" aria-hidden="true" />
          <Typography variant="h1" className="min-w-0 break-words text-2xl leading-tight sm:text-3xl md:text-[2rem] xl:text-4xl">{title}</Typography>
        </div>
        {subtitle && (
          <Typography variant="caption" className="px-2 text-[11px] font-bold uppercase leading-snug tracking-normal text-gray-500 sm:pl-6 sm:text-[12px] sm:font-black xl:whitespace-nowrap">
            {subtitle}
          </Typography>
        )}
      </div>
      {actions && (
        <div className="flex w-full min-w-0 flex-col items-center gap-4 sm:flex-row sm:flex-wrap lg:w-auto lg:max-w-[70%] lg:shrink-0 lg:justify-end xl:flex-wrap">
          {actions}
        </div>
      )}
    </header>
  )
}
