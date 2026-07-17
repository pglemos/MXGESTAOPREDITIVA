# Módulo Gerencial PDF-first + Base44 1:1 — Design

## Autoridade funcional

1. A especificação funcional de 63 páginas é a autoridade para regras, fórmulas, permissões, eventos, auditoria e critérios de aceite.
2. O Base44 Gerencial (`6a4a76ee4dd842ccd2b4ac24`) é referência de composição visual, UX, estados, modais e fluxos.
3. O Módulo Vendedor Base44 (`6a3b2a814401f8c6bf1653df`) e o Módulo Vendedor já existente no MX são usados apenas para validar contratos compartilhados. O design do Vendedor não será copiado.
4. O repositório `pglemos/MXGESTAOPREDITIVA`, o Supabase e a Vercel são a arquitetura definitiva.

## Restrições aprovadas

- Alterações de código somente na branch `main`.
- Deploy de produção pela integração GitHub → Vercel.
- Migrations forward-only, idempotentes e não destrutivas.
- Nenhum dado operacional persistido em `localStorage`.
- Nenhuma base paralela de cliente, venda, fechamento, rotina, feedback, PDI, meta ou treinamento.
- Falha técnica não penaliza vendedor ou gerente.
- Registros históricos são versionados; não são reescritos silenciosamente.
- Fuso oficial: `America/Sao_Paulo`.
- Sidebar clara exclusiva do Gerente, mantendo Vendedor, Dono e Admin em seus shells atuais.

## Arquitetura por domínio

### Fechamento e Agenda D+1

- `lancamentos_diarios` permanece como fechamento canônico.
- `agendamentos`, `clientes` e `oportunidades` permanecem como base única operacional.
- Novo snapshot oficial D+1 será persistido em lote + itens, versionado por fechamento e data de agenda.
- A consolidação ocorre às 09:31 de São Paulo.
- Alterações tardias permanecem permitidas na origem, mas geram auditoria com estado anterior e posterior; o snapshot oficial não é sobrescrito.
- A Disciplina usa o fechamento oficial e o detalhamento válido do D+1.

### Rotina do Dia do Gerente

- Tarefas automáticas deixam de depender de uma tabela legada e passam a usar fontes canônicas.
- As cinco ações fixas são geradas somente quando existe pendência real.
- A origem resolvida encerra automaticamente a tarefa e preserva histórico.
- Tarefas manuais pessoais não alteram a pontuação oficial.
- Snapshot diário do gerente persiste os cinco blocos, denominadores, erros técnicos e versão.

### Rotina da Equipe

- A pontuação oficial é calculada uma vez e persistida em `seller_routine_snapshots`.
- O Gerencial apenas consome o score do Vendedor.
- Zero legítimo exige base confiável e snapshot.
- Folga, férias, afastamento, loja fechada e treinamento aprovado são `não_aplicável`.

### Dashboard e Meta da Loja

- O Plano de Sustentação é persistido em `store_target_plans` por horizonte e versão.
- Dashboard e Meta da Loja consomem a mesma versão do plano.
- A razão inicial é 3 agendamentos por venda, sem inventar valor quando não houver configuração válida.

### Desenvolvimento

- Feedback, PDI, ações, evidências e reuniões usam entidades canônicas do Supabase.
- A máquina de estados do PDI possui os dez estados da especificação.
- Objetivos privados não são visíveis ao gerente.
- A biblioteca do Base44 será migrada somente após validação editorial; itens genéricos não entram como conteúdo oficial.

## Segurança

- RLS por usuário, loja, equipe e perfil.
- Gerente consulta sua unidade e altera apenas cobranças, regularizações, confirmações, leads oficiais, feedbacks, PDI da equipe e tarefas atribuídas.
- Vendedor altera apenas seus registros permitidos.
- Dono/Admin configura metas, regras financeiras, ranking, permissões e PDI do gerente.
- RPCs `SECURITY DEFINER` validam `auth.uid()`, escopo de loja e papel antes de qualquer mutação.

## Ondas de execução

1. **P0 Dados canônicos:** D+1, tarefas/snapshots gerenciais, snapshots do vendedor e plano de meta.
2. **P0 Rotina/Fechamento:** trocar fontes legadas, integrar snapshot D+1, corrigir taxonomia e auditoria.
3. **P0 Dashboard/Meta:** consumir plano persistido e reconciliar fórmulas.
4. **P1 Minha Equipe/Rotina da Equipe:** consumir snapshots oficiais e concluir navegação contextual.
5. **P1 Desenvolvimento:** estados, privacidade, biblioteca validada e eventos.
6. **P2 Menus preliminares:** Mentor, Ranking e Universidade sem ultrapassar o escopo aprovado.
7. **Homologação:** testes por ID do PDF, regressão visual Base44, RLS, build, smoke test e runtime.

## Critério de conclusão

Uma onda só é considerada concluída quando possui migration versionada, teste de contrato, teste funcional aplicável, build aprovado, RLS validado, deploy `READY` e evidência de smoke test. O projeto completo só pode ser chamado de homologado após todos os critérios `DASH`, `ROT-G`, `FEC`, `ROT-E`, `EQP`, `META`, `DEV` e `GER-001` a `GER-020` estarem comprovados.