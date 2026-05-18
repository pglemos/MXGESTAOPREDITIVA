export function JourneySection() {
  return (
        <section className="sec-pad journey" aria-labelledby="jor-h">
          <div className="wrap">
            <div className="sec-head">              <div className="left" data-reveal>                <h2 id="jor-h" className="sec-title">
                  Da rotina do vendedor<br />
                  ao plano de ação<br />
                  do <span className="it">conselho de loja.</span>
                </h2>
                <p className="sec-sub">Um único ciclo, oito atos. O dado entra na ponta e sobe até virar decisão estratégica — sem reescrita, sem perda de contexto.</p>
              </div>            </div>

            <div className="flow" data-reveal>
              <div className="step-card">
                <div className="num">01</div>
                <span className="arrow">→</span>
                <div>
                  <div className="who">vendedor</div>
                  <h5>Lança D-1 e D-0 no Terminal.</h5>
                  <p>Produção do dia anterior + agenda do dia atual, dentro da janela operacional.</p>
                </div>
              </div>
              <div className="step-card">
                <div className="num">02</div>
                <span className="arrow">→</span>
                <div>
                  <div className="who">gerente</div>
                  <h5>Valida agenda e monitora funil.</h5>
                  <p>Acompanha pendências, aprova correções, vê o painel da unidade ao vivo.</p>
                </div>
              </div>
              <div className="step-card">
                <div className="num">03</div>
                <span className="arrow">→</span>
                <div>
                  <div className="who">sistema</div>
                  <h5>Calcula ranking, meta, projeção.</h5>
                  <p>Diagnóstico automático identifica gargalos do funil — lead, agend., visita, venda.</p>
                </div>
              </div>
              <div className="step-card">
                <div className="num">04</div>
                <span className="arrow">↳</span>
                <div>
                  <div className="who">gerente</div>
                  <h5>Gera devolutiva, PDI e treino.</h5>
                  <p>Ação direcionada à pessoa certa, no gargalo certo, com a métrica de referência.</p>
                </div>
              </div>
              <div className="step-card">
                <div className="num">05</div>
                <span className="arrow">→</span>
                <div>
                  <div className="who">vendedor</div>
                  <h5>Recebe direcionamento e evolui.</h5>
                  <p>Ciência da devolutiva, treinamento liberado, plano de carreira ativo.</p>
                </div>
              </div>
              <div className="step-card">
                <div className="num">06</div>
                <span className="arrow">→</span>
                <div>
                  <div className="who">dono</div>
                  <h5>Acompanha relatórios.</h5>
                  <p>Matinal, semanal, mensal · projeção · ROI da consultoria.</p>
                </div>
              </div>
              <div className="step-card">
                <div className="num">07</div>
                <span className="arrow">→</span>
                <div>
                  <div className="who">consultoria</div>
                  <h5>Registra visitas e plano de ação.</h5>
                  <p>PMR, DRE, planejamento estratégico, financeiro e evolução da loja.</p>
                </div>
              </div>
              <div className="step-card">
                <div className="num">08</div>
                <span className="arrow">∞</span>
                <div>
                  <div className="who">rede</div>
                  <h5>Histórico, rastreio e gestão real.</h5>
                  <p>Cada decisão fica documentada. Cada ciclo melhora o próximo.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
  )
}
