import type { RefObject } from 'react'

type Props = { particleStageRef: RefObject<HTMLDivElement | null> }

export function ParticleBandSection({ particleStageRef }: Props) {
  return (
        <section className="particle-band" aria-label="Manifesto MX em movimento">
          <div className="particle-band-grid">
            <div className="particle-band-meta"><b>● </b>&nbsp;Manifesto · em movimento</div>
            <div className="particle-stage" id="particle-stage" ref={particleStageRef} aria-hidden="true" />
            <div className="particle-caption"><b>Em movimento</b>O método não é estático. A operação respira todo dia.</div>
          </div>
        </section>
  )
}
