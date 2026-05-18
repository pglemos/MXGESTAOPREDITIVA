import { FAQ_ITEMS } from '../data/faq-items'
import { onFaqClick } from '../hooks/useLandingEffects'

export function FAQSection() {
  return (
    <section id="faq" className="sec-pad" aria-labelledby="faq-h">
      <div className="wrap">
        <div className="sec-head">
          <div className="left" data-reveal>
            <h2 id="faq-h" className="sec-title">
              Antes de implantar.<br />
              <span className="it">As perguntas reais.</span>
            </h2>
          </div>
        </div>

        <div className="faq" data-reveal>
          <div>
            <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.6, maxWidth: 340 }}>
              Tudo que dono, gerente e vendedor perguntam antes de adotar uma rotina nova. Sem rodeio.
            </p>
            <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span className="chip">implantação</span>
              <span className="chip">equipe</span>
              <span className="chip">dados</span>
              <span className="chip">consultoria</span>
            </div>
          </div>
          <div className="faq-list">
            {FAQ_ITEMS.map((item) => (
              <div className="faq-item" key={item.ix}>
                <button className="faq-q" type="button" onClick={onFaqClick}>
                  <span className="ix">{item.ix}</span>
                  <span>{item.question}</span>
                  <span className="plus" />
                </button>
                <div className="faq-a">
                  <div className="faq-a-inner">{item.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
