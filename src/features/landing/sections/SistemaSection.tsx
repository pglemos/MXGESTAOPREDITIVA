export function SistemaSection() {
  return (
        <section id="sistema" className="sec-pad" aria-labelledby="sis-h">
          <div className="wrap">
            <div className="sec-head">              <div className="left" data-reveal>                <h2 id="sis-h" className="sec-title">
                  Não é mais um<br />
                  dashboard. É um<br />
                  <span className="it">sistema operacional</span><br />
                  para a sua loja.
                </h2>
                <p className="sec-sub">Cada papel da loja tem sua função no sistema — e cada ação alimenta a próxima decisão. O vendedor lança. O gerente corrige. O dono enxerga. A consultoria registra método. E os dados viram devolutiva, PDI, treinamento e plano de ação.</p>
              </div>            </div>

            <div className="modules-grid" data-reveal>
              <article className="mod mod-terminal" data-span="8">
                <div className="inner-pad">
                  <div className="mod-hd">
                    <div className="mod-id"><b>01</b>· Terminal MX</div>
                    <div className="mod-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3"/><path d="M13 15h4"/></svg>
                    </div>
                  </div>
                  <h4>Lançamento diário,<br />com <span className="it">janela operacional.</span></h4>
                  <p>Vendedor registra produção <span className="hl">D-1</span> e agenda <span className="hl">D-0</span>. Leads, agendamentos de carteira, agendamentos digitais, visitas, vendas por canal, observações e justificativa de zero — tudo controlado.</p>
                  <div className="mod-foot">
                    <span>até 09:30 · lançamento</span>
                    <span>até 09:45 · edição</span>
                  </div>
                </div>
                <div className="terminal-mock">
                  <div className="row"><span className="ts">09:14:32</span><span className="lbl">D-1 · leads recebidos</span><span className="val">42</span></div>
                  <div className="row"><span className="ts">09:14:32</span><span className="lbl">D-1 · agendamentos · carteira</span><span className="val">11</span></div>
                  <div className="row"><span className="ts">09:14:33</span><span className="lbl">D-1 · agendamentos · digital</span><span className="val">07</span></div>
                  <div className="row"><span className="ts">09:14:33</span><span className="lbl">D-1 · visitas realizadas</span><span className="val warn">04</span></div>
                  <div className="row"><span className="ts">09:14:34</span><span className="lbl">D-1 · vendas / canal</span><span className="val">02 · loja+digital</span></div>
                  <div className="row"><span className="ts">09:14:34</span><span className="lbl">D-1 · justificativa zero</span><span className="val">—</span></div>
                  <div className="input-line">D-0 ›&nbsp;agenda do dia <span className="blink" /></div>
                </div>
              </article>

              <article className="mod" data-span="4">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>02</b>· Painel da Loja</div>
                    <div className="mod-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                    </div>
                  </div>
                  <h4>Tudo que o gerente precisa, em <span className="it">uma tela só.</span></h4>
                  <p>Vendas, leads, agendamentos, visitas, atingimento, ranking interno, status de lançamento e diagnóstico do funil — atualizado em tempo real conforme novos dados entram.</p>
                </div>
                <div className="mod-foot">
                  <span>realtime</span><span>diagnóstico</span>
                </div>
              </article>

              <article className="mod" data-span="4">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>03</b>· Ranking &amp; Comparativos</div>
                    <div className="mod-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 21V9"/><path d="M12 21V3"/><path d="M18 21v-7"/></svg>
                    </div>
                  </div>
                  <h4>Ranking ao vivo, <span className="it">individual e de rede.</span></h4>
                </div>
                <div className="rank">
                  <div className="rank-row top"><span className="pos">01</span><span className="name">R. Almeida</span><span className="meta">28 vendas</span><span className="v">142%</span></div>
                  <div className="rank-row"><span className="pos">02</span><span className="name">M. Souza</span><span className="meta">25 vendas</span><span className="v">128%</span></div>
                  <div className="rank-row you"><span className="pos">03</span><span className="name">você</span><span className="meta">22 vendas</span><span className="v">112%</span></div>
                  <div className="rank-row"><span className="pos">04</span><span className="name">L. Pereira</span><span className="meta">19 vendas</span><span className="v">98%</span></div>
                  <div className="rank-row" style={{ borderBottom: 'none' }}><span className="pos">05</span><span className="name">F. Costa</span><span className="meta">16 vendas</span><span className="v">82%</span></div>
                </div>
              </article>

              <article className="mod" data-span="4">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>04</b>· Devolutivas</div>
                    <div className="mod-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                  </div>
                  <h4>Feedback genérico não <span className="it">muda resultado.</span></h4>
                  <p>Pontos fortes, atenção, ação recomendada e métricas da semana. Vendedor registra ciência. Exporta para WhatsApp.</p>
                </div>
                <div className="dev-mock">
                  <div className="head"><span>SEMANA 17 · 2026</span><b>R. ALMEIDA</b></div>
                  <div className="body">Conversão Visita→Venda em <b>22%</b>. Manter abordagem de teste-drive ativo e estruturar follow-up D+2.</div>
                  <div className="tags">
                    <span className="chip good">+ teste-drive</span>
                    <span className="chip warn">~ follow-up</span>
                    <span className="chip">→ ação · roteiro</span>
                  </div>
                </div>
              </article>

              <article className="mod" data-span="6">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>05</b>· PDI MX 360</div>
                    <div className="mod-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>
                    </div>
                  </div>
                  <h4>Plano de carreira que <span className="it">sai da gaveta.</span></h4>
                  <p>Sessão guiada por etapas: especialista, metas de 6/12/24 meses, mapeamento de competências, radar, lacunas e plano de ação. O sistema busca modelos por cargo, sugere ações e gera o pacote da sessão.</p>
                </div>
                <div className="pdi-steps">
                  <div className="pdi-step done"><div className="l">Especialista</div><div className="ic">●</div></div>
                  <div className="pdi-step done"><div className="l">Metas</div><div className="ic">●</div></div>
                  <div className="pdi-step done"><div className="l">Comp.</div><div className="ic">●</div></div>
                  <div className="pdi-step active"><div className="l">Radar</div><div className="ic">▷</div></div>
                  <div className="pdi-step"><div className="l">Plano</div><div className="ic">○</div></div>
                </div>
              </article>

              <article className="mod" data-span="6">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>06</b>· MX Academy</div>
                    <div className="mod-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 10L12 4 2 10l10 6 10-6z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>
                    </div>
                  </div>
                  <h4>Treinamento conectado ao <span className="it">gargalo real.</span></h4>
                  <p>Quando o sistema detecta queda de conversão, indica o conteúdo certo para o vendedor certo. Conteúdos por pilar e público-alvo. Vendedor marca conclusão; gerente acompanha progresso.</p>
                </div>
                <div className="tlist">
                  <div className="tlist-row"><span className="name">Abordagem na entrada da loja</span><span className="st done">CONCLUÍDO</span></div>
                  <div className="tlist-row"><span className="name">Quebra de objeção · preço</span><span className="st prog">EM CURSO 60%</span></div>
                  <div className="tprog"><i style={{ width: '60%' }} /></div>
                  <div className="tlist-row"><span className="name dim">Agendamento → visita</span><span className="st todo">RECOMENDADO</span></div>
                </div>
              </article>
            </div>
          </div>
        </section>
  )
}
