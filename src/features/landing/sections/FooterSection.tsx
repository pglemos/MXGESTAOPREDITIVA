export function FooterSection() {
  return (
        <footer className="mxp-footer" role="contentinfo">
          <div className="wrap">
            <h2 className="foot-mega" aria-hidden="true">MX <span className="it">Performance</span></h2>
            <div className="foot-grid">
              <div>
                <a href="#" className="brand" style={{ marginBottom: 18 }}>
                  <div className="brand-mark"><img src="/landing/logo-mx.png" alt="MX" /></div>
                  <div className="brand-name">MX <span>PERFORMANCE</span></div>
                </a>
                <p style={{ color: 'var(--ink-2)', fontSize: 13.5, lineHeight: 1.6, maxWidth: 340, margin: '14px 0 0' }}>Plataforma de gestão comercial, operacional e consultiva para lojas automotivas. Tirando a operação do improviso desde 2026.</p>
                <div style={{ marginTop: 24 }}>
                  <span className="pill-status"><span className="dot" />Status do sistema · operacional</span>
                </div>
              </div>
              <div>
                <h6>Plataforma</h6>
                <a href="#sistema">Terminal MX</a>
                <a href="#sistema">Painel da Loja</a>
                <a href="#sistema">Ranking</a>
                <a href="#sistema">Devolutivas</a>
                <a href="#sistema">PDI 360</a>
                <a href="#sistema">MX Academy</a>
              </div>
              <div>
                <h6>Consultoria</h6>
                <a href="#consultoria">CRM</a>
                <a href="#consultoria">Agenda MX</a>
                <a href="#consultoria">Visitas PMR</a>
                <a href="#consultoria">DRE Financeiro</a>
                <a href="#consultoria">ROI &amp; Choque</a>
              </div>
              <div>
                <h6>MX</h6>
                <a href="#">Sobre a MX Consultoria</a>
                <a href="/privacy">Privacidade</a>
                <a href="/terms">Termos de uso</a>
                <a href="https://www.instagram.com/mxconsultoriabr">Contato</a>
                <a href="https://www.instagram.com/mxconsultoriabr">Instagram ↗</a>
              </div>
            </div>
            <div className="foot-bottom">
              <div>© MX Consultoria LTDA · 2026 — Todos os direitos reservados</div>
              <div className="right">
                <span>v.2026.04 · build 04.30</span>
                <a href="/privacy">Privacidade</a>
                <a href="/terms">Termos</a>
              </div>
            </div>
          </div>
        </footer>
  )
}
