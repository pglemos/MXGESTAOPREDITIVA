export function ConsultoriaSection() {
  return (
        <section id="consultoria" className="sec-pad consultoria-sec" aria-labelledby="con-h">
          <div className="wrap">
            <div className="consultoria-showcase">
              <div className="sec-head">
                <div className="left" data-reveal>
                  <h2 id="con-h" className="sec-title">
                    Método consultivo<br />
                    com governança<br />
                    e <span className="it">rastreabilidade.</span>
                  </h2>
                  <p className="sec-sub">Uma camada interna conecta clientes, agenda, visitas PMR, DRE, plano de ação e ROI. Cada visita gera registro, cada decisão gera evidência — sem perda de história entre encontros.</p>
                  <div className="consultoria-points" aria-label="Pilares da consultoria MX">
                    <span><b>01</b>Agenda, visita e registro</span>
                    <span><b>02</b>Plano de ação e evidência</span>
                    <span><b>03</b>ROI e histórico preservado</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="modules-grid" data-reveal>
              <article className="mod" data-span="6">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>C1</b>· CRM de Consultoria</div>
                    <div className="mod-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 4h18v16H3z"/><path d="M3 9h18M9 4v16"/></svg></div>
                  </div>
                  <h4>Cliente, contrato, módulos, contatos, <span className="it">ritual.</span></h4>
                  <p>Razão social, CNPJ, produto contratado, módulos ativos, unidades, contatos, responsáveis, visitas, financeiro, plano de ação, agenda. Status, saúde do ritual, última visita, indicadores da carteira.</p>
                </div>
                <div className="mod-foot"><span>governança</span><span>carteira</span><span>ritual</span></div>
              </article>

              <article className="mod" data-span="6">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>C2</b>· Agenda MX</div>
                    <div className="mod-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg></div>
                  </div>
                  <h4>Visitas, aulas, eventos. <span className="it">Sincronizada.</span></h4>
                  <p>Filtre por data, status e consultor. Agende visitas, defina modalidade, responsável, local, duração e objetivo. Integração com Google Calendar — agenda pessoal e agenda central MX.</p>
                </div>
                <div className="mod-foot"><span>google sync</span><span>multi-consultor</span></div>
              </article>

              <article className="mod" data-span="4">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>C3</b>· Visitas PMR</div>
                    <div className="mod-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
                  </div>
                  <h4>Metodologia consultiva, <span className="it">executada.</span></h4>
                  <p>Numeração, checklist, objetivos, evidências, assinatura, conclusão e relatório. Gera plano de ação, diagnóstico, PDI, análise de DRE.</p>
                </div>
                <div className="mod-foot"><span>checklist</span><span>evidência</span></div>
              </article>

              <article className="mod" data-span="4">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>C4</b>· DRE &amp; Financeiro</div>
                    <div className="mod-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-6"/></svg></div>
                  </div>
                  <h4>Performance comercial vira <span className="it">resultado.</span></h4>
                  <p>Receita, deduções, despesas, folha, pró-labore, marketing, investimentos, financiamento. Lucro, ROI, ticket médio, margem por carro, CAC.</p>
                </div>
                <div className="mod-foot"><span>DRE mensal</span><span>indicadores</span></div>
              </article>

              <article className="mod" data-span="4">
                <div>
                  <div className="mod-hd">
                    <div className="mod-id"><b>C5</b>· ROI &amp; Choque</div>
                    <div className="mod-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 2L3 14h7l-2 8 10-12h-7z"/></svg></div>
                  </div>
                  <h4>Antes e depois. <span className="it">Em PDF.</span></h4>
                  <p>Compara cenário inicial e atual: vendas, leads, conversão, margem, estoque. Exporta relatório de impacto da consultoria.</p>
                </div>
                <div className="mod-foot"><span>relatório</span><span>impacto</span></div>
              </article>
            </div>
          </div>
        </section>
  )
}
