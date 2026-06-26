# EV-1 — Fechamento Diário e Cadastro Rico

**Objetivo do épico:** capturar diariamente os dados que alimentam todo o sistema (score, funil, comissão, ranking) com o menor atrito possível, no layout aprovado pelo Daniel.

**Fase:** Julho · **Status:** ✅ Done (execução técnica pronta para review)

**Telas/arquivos atuais:** `src/features/checkin/` (`Checkin.container.tsx`, `sections/CheckinForm.tsx`, `sections/CheckinCrmSection.tsx`), tabelas `lancamentos_diarios` (D-1 oficial) e CRM (`clientes`, `oportunidades`, `agendamentos`, `atendimentos`).

---

## EV-1.1 — Layout do mock no Fechamento Diário
**Status:** ✅ Done (CheckinCrmSection no visual do mock)

**Como** vendedor, **quero** uma tela de fechamento com cards numerados por canal **para** lançar rápido a produção do dia.

**Critérios de aceitação:**
1. Card "1. Leads Recebidos Hoje" com Carteira e Internet.
2. Card "2. Atendimentos Hoje" com Showroom, Carteira, Internet (+ Porta) e steppers `+/-` funcionais.
3. Card "3. Agendamento D+1" com Carteira e Internet.
4. Resumo do Dia (Leads, Atendimentos, Agendamentos D+1, Vendas, Faturamento).
5. Card Disciplina (% dos últimos 7 dias) + Dica do Dia.
6. Form oficial D-1 (`lancamentos_diarios`) preservado — é o sistema de record.

**Notas técnicas:** manter `CheckinCrmSection` como camada visual do mock e preservar `lancamentos_diarios` como fonte oficial D-1; qualquer leitura auxiliar do CRM deve respeitar RLS por loja/vendedor e R-01.

**Dependências:** nenhuma adicional; fundação já entregue no Fechamento Diário atual.

---

## EV-1.2 — Cadastro rico do cliente alimentando comissão
**Status:** ✅ Done

**Como** vendedor, **quero** registrar venda com sinal, financiamento, carro avaliado e **tipo de veículo** **para** o sistema calcular minha comissão pela regra correta da loja.

**Critérios de aceitação:**
1. Cadastro de venda captura: nome, telefone, veículo, **tipo de veículo (carro/moto/caminhão)**, canal, data, carro na troca, sinal, financiamento (aprovado/reprovado/pendente/não se aplica), venda realizada, motivo da perda.
2. O **valor/faturamento** da venda fica disponível para o motor de remuneração (não só a contagem).
3. Cadastro é **opcional** no Fechamento, mas **concentrado na Carteira** (não duplicar formulário).
4. Campo "tipo de veículo" habilita comissionamento por categoria (ver EV-8).

**Notas técnicas:** adicionar `tipo_veiculo` em `oportunidades`; enum `crm_tipo_veiculo`. Migration + regenerar tipos.

**Dependências:** EV-8 (comissionamento por categoria).

---

## EV-1.3 — Cards de Leads e D+1 derivados do CRM
**Status:** ✅ Done

**Como** vendedor, **quero** que Leads Recebidos e Agendamentos D+1 venham do CRM **para** não digitar duas vezes.

**Critérios de aceitação:**
1. Leads Hoje = clientes criados hoje por `canal_origem`.
2. Agendamentos D+1 = agendamentos reais de amanhã por canal.
3. Atendimentos por canal persistem em `atendimentos` (com remover último).

**Notas técnicas:** derivar contadores de `clientes`, `agendamentos` e `atendimentos` por data/canal; manter empty state honesto quando não houver registros.

**Dependências:** CRM operacional e EV-1.1 preservando o fechamento como tela de entrada.

---

## EV-1.4 — Trava de fechamento por meta de feedback
**Status:** ✅ Done

**Como** gerente, **quero** que o vendedor só feche o dia se cumpriu a ação do feedback (ou justificou) **para** garantir execução.

**Critérios de aceitação:**
1. Se há ação de feedback pendente do dia (ex.: "cadastrar 2 clientes/dia"), o botão "Finalizar fechamento" exige **observação obrigatória** com o motivo de não-cumprimento.
2. A trava só vale quando a loja/gerente configurou aquela ação como obrigatória.
3. Vendedor autônomo: a trava usa metas auto-definidas (feedback autônomo — ver EV-6.5).

**Notas técnicas:** validar a finalização contra ações obrigatórias pendentes em `devolutivas`/ações de feedback; persistir justificativa vinculada ao fechamento do dia.

**Dependências:** EV-6 (ação de feedback vinculada).

---

## EV-1.5 — Disciplina do Fechamento persistida e oficial
**Status:** ✅ QA PASS — InReview (implementado 2026-06-26 — `docs/stories/story-MX-EV1-20260626-disciplina-persistida.md`; QA: `docs/reports/qa-gate-ev1-fechamento-stories-20260626.md`)

**Como** vendedor, gerente e motor de ranking, **quero** que a pontuação de Disciplina do Fechamento (70% base + até 30% por detalhamento de Agendamento D+1, −10pp se atraso liberado) seja calculada e **gravada** no lançamento do dia **para** que ranking, comissão e relatórios usem o número real, não um valor calculado só na tela do vendedor.

**Problema atual confirmado em código:**
1. `disciplinePercent` em `useCheckinPage.ts:438-444` calcula a fórmula corretamente (70+30, -10 se atraso), mas só existe em memória + é espelhado em `localStorage` (`mx-checkin-score:*`, `mx-checkin-finalizado:*`) — não persiste em `lancamentos_diarios`.
2. `lancamentos_diarios` já tem `submitted_late` e `edit_locked_at` (ver `submit_checkin_rpc.sql:197-227`), mas o client nunca preenche esses campos no payload de `saveCheckin`.
3. A dimensão "disciplina" que de fato alimenta `score_calculations` (MX Score, ranking) vem de `compute_individual_score_mvp` (`20260609140000_mx_score_individual_mvp_rpc.sql:44-50`) — fórmula **diferente**: "% de dias com fechamento nos últimos 7 dias". Ou seja, hoje existem **duas disciplinas divergentes**: a que o vendedor vê na tela (fórmula da spec) e a que o sistema usa para ranking/comissão (frequência de 7 dias).

**Critérios de aceitação:**
1. `lancamentos_diarios` ganha colunas: `pontuacao_disciplina_base numeric`, `pontuacao_disciplina_final numeric`, `finalizado_apos_prazo boolean default false`, `penalizacao_atraso_aplicada boolean default false`, `percentual_penalizacao_atraso numeric default 0`, `fechamento_liberado boolean default false`, `liberado_por_id uuid references usuarios(id)`, `liberado_por_nome text`, `data_hora_liberacao timestamptz`.
2. `submit_checkin_rpc` (ou nova RPC) grava essas colunas a partir do payload existente de `useCheckinPage.ts` (`disciplinePercent`, `finalizadoAposPrazo`, `creditosValidos`, `totalAgendamentosD1`) — sem duplicar a lógica de cálculo no SQL; o client calcula, a RPC só persiste e valida limites (clamp 0–100, penalidade fixa de 10pp).
3. `compute_individual_score_mvp` passa a derivar `v_disciplina` da média de `pontuacao_disciplina_final` dos lançamentos dos últimos 7 dias (fallback para a fórmula de frequência atual quando não houver `pontuacao_disciplina_final` preenchida — compatibilidade com lançamentos antigos).
4. Histórico de Fechamentos (`CheckinHeader.tsx`) lê a pontuação de `lancamentos_diarios.pontuacao_disciplina_final`, não mais de `localStorage['mx-checkin-score:*']`.
5. Testes: snapshot da fórmula (casos da spec §18, exemplos 1–5) batendo entre client e o que é persistido; teste de regressão para `compute_individual_score_mvp` com e sem dado novo.

**Notas técnicas:** migration aditiva (sem dropar `submitted_late`/`edit_locked_at`, só passar a popular). RLS: vendedor só escreve a própria linha (já existe); gerente/dono leem (já existe via política de `lancamentos_diarios`).

**Dependências:** nenhuma — pode ir primeiro, é a base para EV-1.6 a EV-1.8 (todas gravam nas mesmas colunas).

---

## EV-1.6 — Janela de atraso em 3 estágios e liberação real
**Status:** ✅ QA PASS (1 concern) — InReview (implementado 2026-06-26 — `docs/stories/story-MX-EV1-20260626-janela-atraso-liberacao.md`. Inclui correção de regressão crítica de produção introduzida pela EV-1.5 — ver Dev Agent Record da story. QA: `docs/reports/qa-gate-ev1-fechamento-stories-20260626.md`)

**Como** vendedor e gerente, **quero** que o fechamento atrasado siga 3 estágios claros (no prazo / bloqueado pedindo liberação / regularização discreta no histórico) com liberação registrada de forma auditável **para** ter rastro real de quem liberou o quê e quando, hoje perdido em `localStorage`.

**Problema atual confirmado em código:**
1. `isPastDeadline` em `useCheckinPage.ts:311-317` é binário (antes/depois de 09h30); não existe o estágio intermediário 09h31–12h00 vs. "após 12h01 volta para o fechamento do dia atual" da spec §3.2/§3.3 — porque `referenceDate` (`calculateReferenceDate` em `src/hooks/checkins/types.ts:46-51`) é sempre D-1 em relação ao "agora", nunca migra para "hoje" durante o dia.
2. O banner discreto "Existe um fechamento anterior pendente" (`CheckinForm.tsx:152-156,200-215`) está implementado mas é código morto na prática: só dispara quando `selectedDate === todaySP`, condição que o fluxo diário normal nunca atinge (o formulário diário sempre mostra D-1, nunca "hoje").
3. Toda a liberação vive em `localStorage`: `avisarGerenteWhatsapp` (`useCheckinPage.ts:330-363`) grava `mx-fechamento-solicitacoes` no browser e usa `gerenteId: 'gerente-id'` / `gerenteNome: 'Gerente Comercial'` **hardcoded** — não resolve o gerente real da loja nem o telefone dele; o link do WhatsApp abre sem número de destino (`wa.me/?text=...`, sem o telefone).
4. `LiberacaoFechamento.tsx` lê/grava tudo em `localStorage` (`mx-fechamento-solicitacoes`, `mx-fechamento-liberados:*`, `mx-fechamento-liberacao-logs`) — sem persistência real, sem expiração de link, qualquer um com o `id` UUID na URL acessa a página (a trava de role existe, mas não a de posse/expiração do link).

**Critérios de aceitação:**
1. Nova tabela `fechamento_liberacoes` (id, lancamento_id, vendedor_id, gerente_solicitado_id nullable, data_fechamento, data_hora_solicitacao, status ['pendente','liberado'], liberado_por_id, liberado_por_nome, data_hora_liberacao, motivo_liberacao, token_hash, token_expira_em).
2. `avisarGerenteWhatsapp` resolve o gerente real: busca em `usuarios` por `loja_id = vendedor.loja_id AND role = 'gerente'` (ou `role_id` → `roles.code = 'sales_manager'`), usa o `phone` real da tabela `usuarios` para montar o link `https://wa.me/<telefone>?text=...`. Se a loja tiver mais de um gerente, notifica todos (ou o primeiro ativo — decisão de produto a confirmar com @po na validação da story).
3. Token de liberação: assinado (HMAC com segredo de servidor) + expiração (ex.: 24h), validado em Edge Function/RPC antes de `LiberacaoFechamento.tsx` mostrar os dados — UUID sozinho na URL deixa de ser suficiente.
4. Janela de horário em 3 estágios reais:
   - até 09h30 (D+1 da competência): normal, sem penalidade;
   - 09h31–12h00: botão vermelho/desabilitado + "Avisar gerente no WhatsApp", exatamente como já existe hoje;
   - após 12h01: a tela principal deixa de exibir o bloqueio em destaque (vira o banner discreto, agora efetivamente alcançável) e o fechamento pendente migra para "Pendente de Fechamento" no Histórico.
5. Liberação grava nas colunas de `lancamentos_diarios` criadas em EV-1.5 (`fechamento_liberado`, `liberado_por_id`, `liberado_por_nome`, `data_hora_liberacao`) em vez de `localStorage`.

**Notas técnicas:** reaproveitar `MX_TIMEZONE`/`getSPHoursMinutes` já existentes; não reescrever o cálculo de horário, só estender os estágios. RLS de `fechamento_liberacoes`: vendedor lê a própria; gerente/dono da loja leem e atualizam (liberam); admin_mx/master leem tudo.

**Dependências:** EV-1.5 (colunas de liberação em `lancamentos_diarios`).

---

## EV-1.7 — Fonte única de verdade para Cadastrar Venda/Agendamentos
**Status:** ✅ QA PASS — InReview (implementado 2026-06-26 — ver `docs/stories/story-MX-EV1-20260626-fonte-unica-cadastro.md`; QA: `docs/reports/qa-gate-ev1-fechamento-stories-20260626.md`)

**Correção pós-implementação:** a premissa "a escrita já está certa desde EV-1.2" estava incompleta — só `clientes`/`oportunidades` eram persistidos; a "Data Agendamento" nunca foi gravada em lugar nenhum do banco (só localStorage). Resolvido usando a tabela `agendamentos` já existente (FK `oportunidade_id`) em vez de criar coluna nova em `oportunidades` — mesma fonte que `agd_cart`/`agd_net` já usam em `crm-derived-totals.ts`. `clientesList` agora é um `useMemo` puro sobre `oportunidades`+`agendamentos` (sem cache otimista em localStorage — a latência do refetch local não justificou a complexidade).

**Como** vendedor, **quero** que meus cadastros de venda/agendamento do Fechamento sobrevivam à troca de navegador/dispositivo **para** não perder histórico de disciplina e funil se limpar o cache.

**Problema atual confirmado em código:**
- `CheckinCrmSection.tsx` já grava corretamente em `clientes` e `oportunidades` (Supabase, EV-1.2 — `useClientes`/`useOportunidades`). Porém o objeto `ClienteRow` exibido na tabela do Fechamento (com `tipoRegistroCalculado`, `dataCompetenciaFechamento`, `fechamentoId`) é **só** espelhado em `localStorage['mx-checkin-clientes:*']` (`useCheckinPage.ts:191-232`) — não é reconstruído a partir de `clientes`+`oportunidades`. Se o `localStorage` for limpo, a oportunidade continua no banco, mas a linha "rica" da tabela do Fechamento (e os contadores de disciplina que dependem de `tipoRegistroCalculado`) desaparecem.

**Critérios de aceitação:**
1. `clientesList` passa a ser derivado de uma consulta real (`oportunidades` join `clientes`, filtrando por `seller_user_id` e pela janela de competência do fechamento), recalculando `tipoRegistroCalculado`/`contaParaDisciplina` no client a partir de `calcularTipoRegistro` (já existe e está correto) em vez de ler do `localStorage`.
2. `localStorage` pode continuar como cache otimista de UI (resposta instantânea ao salvar), mas nunca como única fonte — refetch reconcilia.
3. Campos hoje só na linha local e ausentes no banco (`motivoPerda`, `observacoes`, `dataNovoAgendamento`) precisam existir em `oportunidades` (`motivo_perda` já existe; `observacoes` e `data_novo_agendamento`/replanejamento precisam de confirmação de schema).
4. Migração de dados: nenhuma (dados antigos em `localStorage` não têm valor de produção a recuperar; basta a query passar a ser a fonte daqui para frente).

**Notas técnicas:** reaproveitar `useClientes`/`useOportunidades` já existentes; este slice é principalmente troca da fonte de leitura, a escrita já está certa desde EV-1.2.

**Dependências:** nenhuma técnica; recomendado depois de EV-1.5 para já nascer compatível com o `lancamento_id` oficial.

---

## EV-1.8 — Modal "Deseja finalizar mesmo assim?"
**Status:** ✅ QA PASS — InReview (implementado 2026-06-26 — ver `docs/stories/story-MX-EV1-20260626-modal-finalizar-mesmo-assim.md`; QA: `docs/reports/qa-gate-ev1-fechamento-stories-20260626.md`)

**Como** vendedor, **quero** ver, antes de finalizar, quantos Agendamentos D+1 informei vs. detalhei e a pontuação estimada, **para** decidir se cadastro o restante ou finalizo assim mesmo — sem o termo "obrigatório", a etapa continua opcional.

**Problema atual confirmado em código:** `submitCheckin` (`useCheckinPage.ts:592-686`) finaliza direto sem esse aviso; a única sinalização hoje é textual no card de disciplina (`disciplineMessage`), não um modal de confirmação antes do submit.

**Critérios de aceitação:**
1. Se `totalAgendamentosD1 > creditosValidos` no momento do clique em "Finalizar Fechamento do Dia", abrir modal com título "Deseja finalizar mesmo assim?", mostrando X informados, Y detalhados, Z% estimado (reaproveitar `disciplinePercent` já calculado).
2. Botão "Voltar e cadastrar" fecha o modal e rola/foca o card `CheckinCrmSection`.
3. Botão "Finalizar mesmo assim" segue o fluxo normal de `submitCheckin`.
4. Não usar os termos "incompleto"/"obrigatório" em nenhum texto do modal (regra explícita da spec §19).
5. Teste cobrindo: D+1 zerado não abre modal (vai direto); D+1 parcial abre modal; "voltar" não finaliza; "finalizar mesmo assim" finaliza.

**Notas técnicas:** estado local (`useState`) no próprio `CheckinForm.tsx`, sem necessidade de mudança de schema — é puramente UX/confirmação no client.

**Dependências:** nenhuma.

---

## EV-1.9 — Trava de edição na regularização do Histórico
**Status:** ✅ QA PASS (1 concern) — InReview (implementado 2026-06-26 — ver `docs/stories/story-MX-EV1-20260626-trava-regularizacao-historico.md`; QA: `docs/reports/qa-gate-ev1-fechamento-stories-20260626.md`)

**Como** gerente, **quero** que um fechamento "Pendente de Fechamento" só possa ser preenchido pelo vendedor depois que eu libero **para** a liberação ter efeito real, não só visual.

**Problema atual confirmado em código:** `CheckinHeader.tsx` (`handleSelectRow`/`handleSubmitCorrection`, linhas 143-292) permite preencher e enviar a regularização de qualquer dia "Pendente de Fechamento" sem checar `fechamentoLiberado`/liberação alguma — a trava descrita na spec §22 ("se ainda não houver liberação: campos bloqueados, botão vermelho desabilitado") não existe nesse fluxo; só existe no formulário principal (`CheckinForm.tsx:765-779`).

**Critérios de aceitação:**
1. Ao abrir um item "Pendente de Fechamento" no Histórico sem liberação registrada (EV-1.6/EV-1.5), os campos do formulário de regularização ficam desabilitados e o botão de envio fica vermelho/desabilitado com a mesma mensagem do fluxo principal.
2. Com liberação registrada, os campos habilitam e o aviso de penalização de 10% aparece antes do envio.
3. Teste cobrindo os dois estados (sem liberação / com liberação) no componente de Histórico.

**Notas técnicas:** consumir o mesmo dado de liberação por `lancamento_id`/data que EV-1.6 grava — sem lógica nova de liberação, só leitura+trava de UI no Histórico.

**Dependências:** EV-1.5 e EV-1.6 (fonte do dado de liberação).
