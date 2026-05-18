export function CTASection() {
  return (
        <section id="cta" className="sec-pad" style={{ paddingTop: 60 }} aria-labelledby="cta-h">
          <div className="wrap">
            <div className="cta-mega" data-reveal>
              <div className="cta-grid">
                <div>                  <h2 id="cta-h">Pare de gerir a loja<br />no <span className="it">improviso.</span></h2>
                  <p>MX Performance é o sistema operacional para lojas automotivas que conecta lançamento diário, metas, classificação, funil, devolutivas, PDI, treinamentos, relatórios, agenda e consultoria — em uma única plataforma.</p>
                  <div className="hero-ctas">
                    <a className="btn btn-primary" href="/login">Ver o MX Performance em ação <span className="arrow">→</span></a>
                    <a className="btn btn-ghost" href="https://www.instagram.com/mxconsultoriabr" target="_blank" rel="noreferrer">Falar com a MX <span className="arrow">↗</span></a>
                  </div>
                </div>
                <ul className="cta-list">
                  <li>Quero organizar minha operação comercial<span className="arr">→</span></li>
                  <li>Quero acompanhar minha loja com dados reais<span className="arr">→</span></li>
                  <li>Quero melhorar a performance dos vendedores<span className="arr">→</span></li>
                  <li>Quero implantar a rotina MX na minha loja<span className="arr">→</span></li>
                  <li>Quero ver o MX Performance em ação<span className="arr">→</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
  )
}
