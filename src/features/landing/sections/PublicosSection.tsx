export function PublicosSection() {
  return (
        <section id="publicos" className="sec-pad" style={{ background: 'linear-gradient(180deg,transparent,#080B09)' }} aria-labelledby="pub-h">
          <div className="wrap">
            <div className="sec-head">              <div className="left" data-reveal>                <h2 id="pub-h" className="sec-title">
                  Três visões da<br />
                  mesma operação.<br />
                  <span className="it">Cada um com sua tela.</span>
                </h2>
                <p className="sec-sub">Mesmos dados. Recortes diferentes. Cada perfil acessa o que faz sentido para sua função — e cada ação reverbera para os outros papéis em tempo real.</p>
              </div>            </div>

            <div className="personas">
              <article className="pcard" data-reveal>
                <div className="pcard-hd">
                  <div className="role">dono</div>
                  <div className="pcard-num">01/03</div>
                </div>
                <h4>Visão executiva.<br /><span className="it">Sem informação espalhada.</span></h4>
                <p>Acompanhe metas, projeções, ranking, relatórios e evolução das suas lojas — sem depender de planilha, mensagem solta ou gerente para entender o resultado.</p>
                <ul className="uses">
                  <li>Painel geral da rede (multi-loja)</li>
                  <li>Comparativo de unidades</li>
                  <li>Relatório matinal · semanal · mensal</li>
                  <li>ROI da consultoria · DRE</li>
                </ul>
              </article>

              <article className="pcard" data-reveal data-reveal-delay="1">
                <div className="pcard-hd">
                  <div className="role">gerente</div>
                  <div className="pcard-num">02/03</div>
                </div>
                <h4>Centro de comando<br />da <span className="it">rotina comercial.</span></h4>
                <p>Conduza a rotina, cobre lançamentos, entenda gargalos, oriente vendedores e transforme dados em ação. Ajustes de lançamento passam por aprovação — sem perder rastreabilidade.</p>
                <ul className="uses">
                  <li>Rotina diária · semanal · mensal</li>
                  <li>Aprovação de correções</li>
                  <li>Devolutivas estruturadas</li>
                  <li>Diagnóstico do funil em tempo real</li>
                </ul>
              </article>

              <article className="pcard" data-reveal data-reveal-delay="2">
                <div className="pcard-hd">
                  <div className="role">vendedor</div>
                  <div className="pcard-num">03/03</div>
                </div>
                <h4>Sua posição,<br />seus dados, <span className="it">sua evolução.</span></h4>
                <p>Acompanhe sua posição no ranking, registre produção, veja feedbacks, evolua com PDI e receba treinamentos conectados à <i>sua</i> performance — não a teorias genéricas.</p>
                <ul className="uses">
                  <li>Home com prescrição tática</li>
                  <li>Devolutivas com ciência</li>
                  <li>PDI &amp; plano de carreira</li>
                  <li>MX Academy direcionado</li>
                </ul>
              </article>
            </div>
          </div>
        </section>
  )
}
