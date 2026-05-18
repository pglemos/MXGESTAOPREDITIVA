export function ProblemSection() {
  return (
    <section id="problema" className="sec-pad problem" aria-labelledby="prob-h">
      <div className="wrap">
        <div className="sec-head">
          <div className="left" data-reveal>
            <h2 id="prob-h" className="sec-title">
              Loja não vende menos<br />
              por falta de cliente.<br />
              Vende menos por <span className="it">falta de método.</span>
            </h2>
            <p className="sec-sub">Os leads chegam. As pessoas entram. Os números até parecem bons. Mas no fim do mês, ninguém sabe explicar com precisão <i>onde</i> a venda foi perdida.</p>
          </div>
        </div>

        <div className="problem-grid">
          <ul className="problem-list" data-reveal>
            <li>
              <span className="num">01</span>
              <div className="body">Os leads chegam, mas nem sempre viram agendamento.
                <s>Sem rastreio, o lead esfria antes da próxima ação.</s>
              </div>
              <span className="tag">leak</span>
            </li>
            <li>
              <span className="num">02</span>
              <div className="body">Os agendamentos acontecem, mas nem sempre viram visita.
                <s>O acompanhamento é manual e cai no esquecimento.</s>
              </div>
              <span className="tag warn">gap</span>
            </li>
            <li>
              <span className="num">03</span>
              <div className="body">As visitas acontecem, mas nem sempre viram venda.
                <s>Nenhum diagnóstico aponta o motivo real da perda.</s>
              </div>
              <span className="tag">leak</span>
            </li>
            <li>
              <span className="num">04</span>
              <div className="body">O gerente cobra, mas não sabe onde está o gargalo.
                <s>Cobrança vira pressão genérica e desgasta a equipe.</s>
              </div>
              <span className="tag warn">noise</span>
            </li>
            <li>
              <span className="num">05</span>
              <div className="body">O dono vê o resultado, mas não enxerga a causa.
                <s>Decisão sem dado é torcida, não gestão.</s>
              </div>
              <span className="tag blind">blind</span>
            </li>
            <li>
              <span className="num">06</span>
              <div className="body">O vendedor recebe pressão, mas não recebe direção.
                <s>Sem feedback estruturado, ninguém evolui de fato.</s>
              </div>
              <span className="tag warn">drift</span>
            </li>
          </ul>

          <aside className="verdict" data-reveal data-reveal-delay="2">
            <div className="verdict-head">
              <span>// VEREDITO DO SISTEMA</span>
              <b>MX-OS</b>
            </div>
            <h3>O problema não é vontade de vender.<br />É <span className="it">falta de medição.</span></h3>
            <p>O MX Performance conecta rotina, funil, metas, ranking, gestão de pessoas, devolutiva, PDI, treinamento e relatórios em um único ambiente. Tudo o que o vendedor faz alimenta o painel do gerente, que alimenta a visão do dono, que alimenta o método da consultoria.</p>
            <p className="lead">Dados reais. Método. Acompanhamento diário.</p>
            <div className="stamp">
              <span><span className="dot" /> assinado · método mx · v.6</span>
              <div className="seal">METHOD<br />MX·OS</div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
