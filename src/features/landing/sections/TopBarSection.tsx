import type { RefObject } from 'react'

type Props = { topbarRef: RefObject<HTMLElement | null> }

export function TopBarSection({ topbarRef }: Props) {
  return (
    <header ref={topbarRef} className="topbar" role="banner">
      <div className="topbar-inner">
        <a href="#top" className="brand" aria-label="MX PERFORMANCE - Inicio">
          <div className="brand-mark">
            <img src="/landing/logo-mx.png" alt="Logotipo MX" />
          </div>
          <div className="brand-name">
            MX <span>PERFORMANCE</span>
          </div>
        </a>
        <nav className="nav" aria-label="Principal">
          <a href="#problema">Problema</a>
          <a href="#sistema">O Sistema</a>
          <a href="#modulos">Módulos</a>
          <a href="#publicos">Públicos</a>
          <a href="#consultoria">Consultoria</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="top-cta">
          <a className="btn btn-primary" href="/login">
            Entrar <span className="arrow">→</span>
          </a>
        </div>
      </div>
    </header>
  )
}
