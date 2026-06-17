# Gap Analysis — PRD vs Código Implementado
**Data:** 2026-06-16  
**Escopo:** Épicos EV-1 a EV-8, EV-12, EV-14 (status "Ready for Review" no relatório de execução)  
**Conclusão geral:** a base de dados é real (Supabase, sem mocks hardcoded). Os gaps são de funcionalidade de negócio não implementada ou parcialmente conectada.

---

## EV-1: Fechamento Diário e Cadastro Rico

**PRD requer:**
- Layout com cards numerados por canal (Leads, Atendimentos, Agendamentos D+1)
- Cadastro rico: tipo de veículo, sinal, financiamento, carro avaliado
- Cards de Leads/D+1 derivados do CRM (não duplicar digitação)
- Trava de fechamento por ação de feedback obrigatória

**Status do código:**
- `CheckinCrmSection.tsx`: real — consome `useClientes`, `useOportunidades`, `useAgendamentos`, `useAtendimentos` via Supabase. Cards por canal derivados do CRM.
- `useOportunidades`: campo `tipo_veiculo` existe (`CrmTipoVeiculo`), payload salvo em `oportunidades`.
- `useFeedbackActions` + `resolveFeedbackActionCloseLock`: trava implementada; bloqueia `handleSubmit` se há ação obrigatória pendente.
- `useCheckinPage`: faz submit real para `lancamentos_diarios` via `useCheckins.saveCheckin`.
- `useCrmDerivedTotals` + `crm-derived-totals`: Form D-1 agora preenche automaticamente leads, visitas, vendas e agenda D0 a partir de CRM real quando ainda não há lançamento salvo; vendedor pode sobrescrever os valores antes de salvar.

**Gaps identificados:**
- **Resolvido em 2026-06-17:** o Form D-1 não fica mais dependente de digitação manual quando existe dado no CRM. `clientes.created_at` alimenta leads D-1, `atendimentos.data` alimenta visitas D-1, `oportunidades.closed_at` com `etapa='ganho'` alimenta vendas por canal, e `agendamentos.data_hora` de D0 (`referenceDate + 1`) alimenta agenda carteira/internet.
- **Disciplina (% dos últimos 7 dias)** e **Dica do Dia** não estão visíveis na `CheckinCrmSection` — nenhum desses blocos aparece no código do container.
- EV-1.4 AC#3: trava para vendedor autônomo (metas auto-definidas) depende de EV-6.5 estar integrado — não verificado.

---

## EV-2: Carteira de Clientes + Motor de Cadência

**PRD requer:**
- Cadência configurável (tabelas `cadencia_fluxos`, `cadencia_estado_cliente`)
- Status de ação: Feito / Não feito / Aguardando
- Reagendamento automático de tentativas
- Analytics de gargalo por etapa

**Status do código:**
- `useClientes`: `registrarStatusCadencia` → chama RPC `registrar_status_acao_cadencia` — **real**.
- `useClientes.createCliente`: chama RPC `inicializar_cadencia_cliente` ao criar — **real**.
- `useCadenciaAnalytics`: lê `cadencia_estado_cliente` via Supabase — **real**.
- `cadencia.ts`: fluxo hard-coded em constante `ETAPAS` (não vem de `cadencia_fluxos` no banco). EV-2.2 AC#3 diz "configuráveis, não hard-coded".

**Gaps identificados:**
- **Cadência não é lida da tabela `cadencia_fluxos`** — os etapas/scripts estão hard-coded em `cadencia.ts`. A tabela existe? O código não faz `select` de `cadencia_fluxos` em nenhum hook.
- **Reagendamento automático (EV-2.4)**: a RPC `registrar_status_acao_cadencia` provavelmente trata isso no banco — mas não há confirmação no código frontend de que o próximo ciclo é calculado e exibido automaticamente (depende da implementação da RPC).
- **Analytics de gargalo**: `useCadenciaAnalytics` existe, mas a UI de analytics por etapa não foi confirmada numa tela — verificar se `CarteiraClientes.container.tsx` renderiza esses dados.
- Card "Persistência Comercial": calculado em `cadencia.ts:calcularPersistencia`, parece funcional, mas depende de dados reais de tentativas.

---

## EV-3: Central de Execução (rotina automática)

**PRD requer:**
- Cards: Agendamentos, Compareceram, Não Compareceram, Em Negociação, Vendas, Score da Rotina
- Rotina do Dia com auto-preenchimento (check automático)
- Ações sugeridas da cadência por horário
- Feedback do gestor com alerta vermelho

**Status do código:**
- `CentralExecucao.container.tsx`: consome `useAgendamentos`, `useAtendimentos`, `useClientes`, `useCadenciaAgenda`, `useFeedbackActions` — tudo real.
- `deriveDailyRoutineSlots` / `resolveCloseDayReminderSchedule` em `daily-routine.ts` — auto-preenchimento implementado.
- `mapFeedbackActionToAgendaItem`: ações de feedback aparecem na Central — integrado.

**Gaps identificados:**
- **Score da Rotina**: `useMeuScore` retorna score calculado no banco (`score_calculations`). `CentralExecucao` usa `deriveDailyRoutineSlots` para check visual do dia — mas não há confirmação se o "Score da Rotina" card exibe o MX Score real ou apenas o percentual local de disciplina diária. São dois conceitos distintos no PRD (EV-3.2 = disciplina intra-dia; EV-9 = MX Score). O código mistura `Score da Rotina` (daily) com `useMeuScore` (calculado no período).
- Horários da rotina ajustados pela **jornada do Meu Perfil**: `deriveDailyRoutineSlots` recebe `perfil` de `useVendedorPerfil` — parece integrado, mas precisa confirmar se os horários do perfil (hora_entrada, hora_almoco_inicio) efetivamente ajustam os slots exibidos.

---

## EV-4: Funil de Vendas

**PRD requer:**
- Cards: Meta, Comissão, Ritmo Atual, Conversão Geral
- "O que falta por canal" ponderado pela distribuição real de vendas
- Ocultar canais sem operação (0% por 3 meses)

**Status do código:**
- `FunilVendedor.container.tsx`: usa `useOportunidades`, `useStoreMetaRules`, `useVendedorHomePage` — dados reais.
- `calcularPlanoFunilPonderado` em `funil.ts`: calcula mix por canal via oportunidades ganhas — funcional.
- Ritmo real calculado com dias decorridos vs meta — funcional.

**Gaps identificados:**
- **Ocultar canais sem operação (EV-4.3)**: o código filtra `canais` que têm `ganhos > 0` para "melhor canal" mas a lista de canais no funil (`CRM_CANAIS`) é sempre renderizada completa. Não há lógica de ocultar canal com 0% por 3 meses da view principal.
- **Benchmark de conversão da loja** (EV-4.1 AC#2): "via benchmarks de conversão da loja" — `useStoreMetaRules` fornece metas, mas benchmarks de taxa de conversão (lead→agd, agd→visita etc.) não estão confirmados como vindos da loja vs defaults.

---

## EV-5: Treinamentos

**PRD requer:**
- Trilha automática por maturidade (N1–N4) derivada de tempo de mercado + experiência
- Aulas ao vivo com prova de presença (RPC server-side, gabarito oculto)
- Conteúdo recomendado por Funil/Feedback/PDI
- Biblioteca com busca por tema/nível/duração

**Status do código:**
- `useUniversidadeMx`: lê `trilhas_desenvolvimento` + `aulas` + `certificacoes` do Supabase — **real**.
- `AulasAoVivoSection.tsx`: existe — usa `useAulasAoVivo` (hook não lido completamente, mas o padrão sugere Supabase).
- `VendedorTreinamentos` calcula o nível N1-N4 pelo Meu Perfil e chama `atribuir_trilha_maturidade_vendedor` quando ainda não há trilha de maturidade ativa.

**Gaps identificados:**
- **Resolvido em 2026-06-17:** a trilha automática por maturidade está implementada no frontend e banco: `maturidade.ts` deriva N1-N4, a migration cria/semeia as trilhas e a tela de Treinamentos autoatribui via RPC idempotente.
- **Conteúdo recomendado por Funil/Feedback/PDI (EV-5.5)**: não há código de recomendação cruzando funil + feedback + PDI no frontend. Pode ser apenas uma seção estática ou estar em outro arquivo não lido.
- **Busca por tema/nível/duração na Biblioteca**: `useUniversidadeMx` tem `filtros` por `publico_alvo` apenas. Não há busca por tema ou duração visível.
- EV-5.4 (1 trilha/6 meses) marcado como Futuro — não bloqueador.

---

## EV-6: Feedback

**PRD requer:**
- Cards: Feedbacks Recebidos, Positivos, Desenvolvimento, Pendentes (badge vermelho)
- Botão "Li e compreendi" com campo de comentário opcional
- Caso/motivo obrigatório no registro do gerente
- Ação de feedback → item recorrente na Central
- Banco de ações selecionáveis (catálogo)
- Feedback autônomo (gerado pelo sistema)

**Status do código:**
- `useStoreFeedback`: lê `devolutivas` + `weekly_feedback_reports` — **real**.
- `StoreFeedbackModal`: tem `FEEDBACK_ACTIONS_CATALOG` e `applyFeedbackActionTemplate` — catálogo existe.
- `mapFeedbackActionToAgendaItem`: ações de feedback integradas à Central.
- Campo `caso_motivo` em `FeedbackFormData` — obrigatoriedade depende da validação em `validarFeedbackObrigatorio`.

**Gaps identificados:**
- **Badge vermelho de pendentes no menu**: existe no AC mas não confirmado se o menu principal exibe badge dinâmico com contagem. Dependeria de um provider global de `devolutivas`.
- **Confirmação "Li e compreendi" + comentário do vendedor (EV-6.1)**: migration `20260612120000_devolutivas_seller_comment.sql` existe (mencionado no PRD), mas a UI de confirmação e campo de comentário na tela do **vendedor** não foi verificada — `VendedorFeedback.tsx` não foi lido.
- **Feedback autônomo (EV-6.5)**: não há código visível de geração automática de feedback pelo sistema para autônomos.

---

## EV-7: PDI

**PRD requer:**
- Conquistas por prazo (curto/médio/longo)
- Competências técnicas e comportamentais com notas 6–10
- Plano de ação vinculado a competências
- Gráfico de evolução por sessão
- Autoavaliação para autônomo (origem registrada)

**Status do código:**
- `WizardPDI.tsx`: usa `usePDI_MX` com `saveSessionBundle`, `fetchCargos`, `fetchTemplate`, `fetchSuggestedActions` — Supabase real.
- Formulário tem `metas` por prazo (6_meses, 12_meses, 24_meses) e radar chart de competências.
- `PDI_ORIGEM_NOTA` importado de `pdi-self-assessment` — origem da nota implementada.

**Gaps identificados:**
- **Competências comportamentais**: o `form` tem `metas` mas não há campos explícitos de competências comportamentais visíveis no head do arquivo. O PRD lista 8 competências comportamentais — verificar se o template do banco as inclui.
- **Gráfico de evolução entre sessões (EV-7.2)**: radar chart existe no wizard, mas é de uma sessão. Evolução temporal (comparação entre sessões) não foi confirmada.
- **Autoavaliação autônomo vs gerente**: `PDI_ORIGEM_NOTA` sugere que a distinção existe, mas a lógica de bloquear autoavaliação para vendedor de loja não foi confirmada.

---

## EV-8: Meu Perfil + Comissionamento

**PRD requer:**
- Horário de trabalho persistido alimentando Central (jornada)
- Campos de maturidade (tempo de mercado, experiência, cargo)
- Comissionamento: fixo/percentual/categoria/patamar/equipe
- Ocultar "Oportunidades de Carreira" para vendedor de loja

**Status do código:**
- `useVendedorPerfil`: persiste horários, maturidade, vínculo, mix de canal — **tudo real em `vendedor_perfil`**.
- `usePlanosRemuneracao` + `useRegrasRemuneracao`: lê `remuneracao_planos` e `remuneracao_regras` — **real**.
- `calcularResumoRemuneracaoVendedor` em `comparativo.ts`: suporta fixo/percentual/patamar/equipe.

**Gaps identificados:**
- **Comissionamento por categoria de veículo (EV-8.3 AC#1c)**: `tipo_veiculo` existe em `oportunidades` e o enum `CrmTipoVeiculo` existe, mas `calcularResumoRemuneracaoVendedor` (não lido completamente) — verificar se há tratamento de regra por categoria.
- **Herança loja→vendedor (EV-8.3 AC#2)**: o vendedor de loja NÃO deve configurar — depende de EV-12 para flag de vínculo. `useVendedorPerfil.vinculoTipo` existe mas UI de bloqueio da configuração de remuneração para loja-vinculado não confirmada.
- **"Oportunidades de Carreira" oculto (EV-8.4)**: PRD diz "hoje oculto para todos até EV-12" — verificar se `MeuPerfilVendedor.container.tsx` implementa o guard.

---

## EV-12: Multi-tenancy

**PRD requer:**
- Distinção loja vs autônomo como fonte canônica
- Governa visibilidade de EV-6, 7, 8, 9, 11

**Status do código:**
- `useVendedorPerfil.vinculoTipo`: `resolverVinculoTipoVendedor` em `vinculo-vendedor.ts` — determina vínculo baseado em `perfil.vinculo_tipo` + `activeStoreId` + `vinculos_loja.length`.
- `VENDEDOR_VINCULO_TIPO` enum existe.

**Gaps identificados:**
- **Fonte canônica não explicitada**: EV-12.1 pede "definir fonte canônica" — o código usa `vendedor_perfil.vinculo_tipo` ou deriva do auth. Não há documentação de qual prevalece.
- **Visibilidade governada**: cada épico que depende do vínculo (6, 7, 8, 11) precisa consumir `vinculoTipo` do hook. Nem todos foram confirmados fazendo isso.
- EV-12.2 (migração por CPF) e EV-12.3 (assinatura) marcados como Futuro.

---

## EV-14: Design System / Tipografia

**PRD requer:**
- Reduzir `font-black`, usar pesos médios
- Aproximar telas dos mocks do Daniel
- Validação da Mariane

**Status do código:**
- `Typography.tsx`, `Button.tsx`, `Badge.tsx` modificados (em git status).
- `DAILY_ROUTINE_MVP_FIELDS` importado em `CheckinForm` — nomenclaturas atualizadas.

**Gaps identificados:**
- **Validação da Mariane (EV-14.1/14.2)**: PRD e relatório de execução indicam que a validação visual é **bloqueio externo** — não é gap de código.
- `font-black` ainda aparece em `FeedbackList.tsx` (linha de avatar e nome do vendedor) — a remoção não foi completa.
- Nomenclaturas nos mocks do Daniel não foram verificadas tela a tela.

---

## Resumo dos Gaps Críticos (requerem código)

| # | Gap | Épico | Risco |
|---|-----|-------|-------|
| G1 | Cadência hard-coded em `cadencia.ts` — não lê `cadencia_fluxos` do banco | EV-2.2 | Alto |
| G2 | Canais sem operação não ocultados na view do Funil | EV-4.3 | Médio |
| G3 | Busca por tema/nível/duração ausente na Biblioteca | EV-5.1 | Médio |
| G4 | ✅ Fechado: trilha automática N1-N4 confirmada em `VendedorTreinamentos`, `maturidade.ts` e RPC de autoatribuição | EV-5.3 | Alto |
| G5 | Badge de pendentes no menu (contagem de devolutivas não confirmada globalmente) | EV-6.1 | Baixo |
| G6 | Confirmação "Li e compreendi" na tela do vendedor não lida | EV-6.1 | Médio |
| G7 | Feedback autônomo (gerado pelo sistema) ausente | EV-6.5 | Alto |
| G8 | Gráfico de evolução entre sessões PDI não confirmado | EV-7.2 | Médio |
| G9 | Comissionamento por categoria de veículo não confirmado no motor | EV-8.3 | Médio |
| G10 | `font-black` residual em FeedbackList (tipografia) | EV-14 | Baixo |
| G11 | ✅ Fechado: Form D-1 deriva CRM automaticamente via `useCrmDerivedTotals` e helper testado | EV-1.1 | Alto |
