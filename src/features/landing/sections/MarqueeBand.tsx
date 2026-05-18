/**
 * Marquee bands usadas como divisores entre sections.
 * `variant="main"` = a marquee gigante após o Hero.
 * `variant="micro"` = a faixa fina após a Problem section.
 */
type Props = { variant?: 'main' | 'micro' }

const MAIN_ITEMS = [
  ['Lançamento diário', false],
  ['Funil MX', false],
  ['Ranking ao vivo', true],
  ['Devolutivas', false],
  ['PDI 360', false],
  ['MX Academy', true],
  ['Visitas PMR', false],
  ['DRE', false],
  ['ROI', true],
] as const

function MainTrackContent() {
  return (
    <>
      {MAIN_ITEMS.map(([label, italic], i) => (
        <span key={i}>
          <span className={italic ? 'it' : undefined}>{label}</span>
          <span className="star">✦</span>
        </span>
      ))}
    </>
  )
}

export function MarqueeBand({ variant = 'main' }: Props) {
  if (variant === 'micro') {
    return (
      <div className="micro-mq" aria-hidden="true">
        <div className="micro-mq-row">
          <span>
            Rotina <span className="it">vira</span> rastro <span className="star">✦</span> Rastro{' '}
            <span className="it">vira</span> dado <span className="star">✦</span> Dado{' '}
            <span className="it">vira</span> decisão <span className="star">✦</span>
          </span>
          <span>
            Rotina <span className="it">vira</span> rastro <span className="star">✦</span> Rastro{' '}
            <span className="it">vira</span> dado <span className="star">✦</span> Dado{' '}
            <span className="it">vira</span> decisão <span className="star">✦</span>
          </span>
        </div>
      </div>
    )
  }
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        <span>
          <MainTrackContent />
        </span>
        <span>
          <MainTrackContent />
        </span>
      </div>
    </div>
  )
}
