import type { ReactNode } from 'react'
import { getInternalMxPageMeta } from './internalMxPageRegistry'

export type InternalMxPageFrameProps = {
  pathname: string
  roleLabel: string
  children: ReactNode
}

export default function InternalMxPageFrame({ pathname, roleLabel, children }: InternalMxPageFrameProps) {
  const page = getInternalMxPageMeta(pathname)

  return (
    <div className="mxds-page-frame" data-mx-internal-page={page.key}>
      <header className="mxds-page-context" aria-label="Contexto da página">
        <div className="mxds-page-context-copy">
          <p className="mxds-page-eyebrow">{page.group}</p>
          <h2 className="mxds-page-title">{page.title}</h2>
          <p className="mxds-page-description">{page.description}</p>
        </div>
        <span className="mxds-page-chip">{roleLabel}</span>
      </header>
      <div className="mxds-page-content">{children}</div>
    </div>
  )
}
