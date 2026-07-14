# Story OPS-20260503 - PDI alinhado aos anexos operacionais

## Status

Ready for Review

## Contexto

O PDI foi revisado contra os anexos enviados pelo usuario:

- `/Users/pedroguilherme/Downloads/Como aplicar o PDI.pdf`
- `/Users/pedroguilherme/Downloads/Rotina gerente de vendas.pdf`
- `/Users/pedroguilherme/Downloads/Nome do Vendedor - Plano_Desenvolvimento_Individual (1).xlsx`
- `/Users/pedroguilherme/Downloads/Acompanhamento diário de venda.xlsx`
- `/Users/pedroguilherme/Downloads/Feedback Estruturado.png`

Os materiais definem que o PDI deve ser aplicado em conversa individual de 45 minutos, com 3 metas por horizonte de 6, 12 e 24 meses, pelo menos uma pessoal e uma profissional em cada horizonte, mapeamento de competencias em escala 6 a 10 para consultor de vendas, cinco acoes de desenvolvimento para os proximos 6 meses, revisao mensal e impressao do bundle final em PDF com Capa, Vendedor 1 e PDI.

## Escopo

- Reconciliar o wizard PDI 360 com as listagens do gerente e vendedor.
- Garantir dados-base de escala, competencias, metas, acoes e impressao conforme o workbook PDI.
- Aplicar validacoes da metodologia descrita no PDF de aplicacao.
- Alinhar o feedback estruturado ao formato operacional da imagem anexada.
- Manter compatibilidade com o PDI legado usado em telas de consultoria.

## Fora de Escopo

- Automatizar a entrega fisica do compromisso simbolico.
- Alterar regras comerciais de meta mensal fora do feedback estruturado.
- Alterar Edge Functions de e-mail/WhatsApp que nao fazem parte do PDI e do feedback estruturado individual.

## Acceptance Criteria

- [x] Wizard exige exatamente 3 metas por horizonte e pelo menos 1 pessoal e 1 profissional em 6, 12 e 24 meses.
- [x] Wizard usa escala ativa do cargo e bloqueia conclusao sem competencias, notas e 5 acoes completas.
- [x] Acoes do PDI ficam limitadas aos proximos 6 meses e exigem revisao mensal.
- [x] Criacao do PDI grava sessao 360 e redireciona para impressao do bundle Capa, Vendedor 1 e PDI.
- [x] Gerente lista os PDIs criados em `pdi_sessoes`, nao a tabela legada `pdis`.
- [x] Vendedor visualiza o proprio PDI 360 com metas, radar, cinco acoes e revisao.
- [x] Banco semeia descritores de escala e valida payloads do RPC de PDI.
- [x] Feedback estruturado para WhatsApp segue Data, Meta individual, Meta Compromisso, Orientacao, Pontos Positivos e Pontos de Atencao.
- [x] Wizard inclui confirmacao operacional de conversa individual, local reservado, revisao mensal, impressao/entrega e compromisso simbolico.
- [x] Gates locais passam.

## Dev Agent Record

### Debug Log

- Auditoria inicial encontrou `pdi_sessoes` como destino do wizard e `pdis` como origem das listagens, causando invisibilidade do PDI criado.
- Auditoria no Supabase remoto encontrou `pdi_descritores_escala` vazio, deixando o template do PDI sem escala.
- `PDIPrint` recebia id da tabela legada quando usado pela listagem do gerente, mas o RPC espera id de `pdi_sessoes`.
- `npm run validate:e2e:live` estava quebrado antes desta historia porque o script referenciado no `package.json` nao existe no repositorio.
- `GerentePDI` foi migrado para `usePDISessions`, que monta os cards a partir de `pdi_sessoes`, `pdi_metas`, `pdi_avaliacoes_competencia` e `pdi_plano_acao`.
- `VendedorPDI` foi migrado para o mesmo modelo 360, exibindo metas agrupadas, radar e cinco acoes.
- `VendedorPDI` foi reorganizado na hierarquia final aprovada: resumo, conquistas, competencias, plano de acao, painel lateral, historico e conteudos recomendados.
- O painel do vendedor agora exibe origem da nota, conquista vinculada, origem da acao, status/progresso, proxima revisao e aviso de que PDI nao impacta automaticamente o Score.
- Fluxos de editar conquistas, nova acao e detalhe da acao foram representados em modais/drawer com campos operacionais.
- Fluxos do vendedor em `VendedorPDI` agora persistem: salvar conquistas, criar/editar acao, concluir/justificar atraso, vincular conteudo e enviar acao para a Central de Execucao.
- Validacao 2026-06-17: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` passaram; teste focado `bun test src/pages/VendedorPDI.test.tsx src/features/crm/CentralExecucao.container.test.tsx src/lib/pdi-vendedor-execution-actions-migration.test.ts` tambem passou.
- Validacao renderizada em browser ficou bloqueada por autenticacao na rota `/pdi`; validacao coberta por testes de componente e gates locais.
- Auditoria de permissoes identificou escrita do vendedor em PDI legado, metas/avaliacoes/acoes do PDI 360, RPCs `SECURITY DEFINER` estruturais e `planos_acao`; a migration `20260714182104_lock_seller_pdi_structural_edits.sql` fecha esses caminhos, mantendo leitura do vendedor e ciencia/comentario de feedback.
- `WizardPDI` agora valida 9 metas, 18 competencias, escala do cargo, cinco lacunas distintas, prazo de 6 meses e revisao mensal.
- `WizardPDI` tambem bloqueia o inicio sem confirmacao de aplicacao individual/local reservado e bloqueia a conclusao sem confirmacao de revisao mensal e impressao/entrega.
- `PDIPrint` passa a exibir nomes enriquecidos quando o RPC retorna `colaborador_nome`, `gerente_nome` e `loja_nome`.
- `formatStructuredWhatsAppFeedback` foi alinhado ao print anexado de feedback estruturado.
- Gates executados: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npx playwright test e2e/visual/pdi-wizard.spec.ts --project=visual-desktop`.
- `npx supabase db lint --local --fail-on error` nao rodou porque o Postgres local em `127.0.0.1:54322` nao esta ativo e `docker` nao esta instalado nesta maquina.
- Dry-run remoto confirmou apenas `20260503060000_pdi_anexos_operacionais.sql` pendente.
- Migracao aplicada no Supabase remoto com `npx supabase db push --yes`.
- Verificacao remota pos-migracao: `pdi_niveis_cargo=5`, `pdi_competencias=18`, `pdi_descritores_escala=25`, `pdi_acoes_sugeridas=21`; template de Consultor retornou `escala=5`, `competencias=18`, `frases=7`.
- `npx supabase db lint --linked --fail-on error` passou apos a migracao.
- Apos incluir as confirmacoes operacionais no wizard, foram reexecutados `npm run typecheck`, `npm test`, `npm run lint` e `npm run build`.

### File List

- `docs/stories/story-OPS-20260503-pdi-anexos-operacionais.md`
- `supabase/migrations/20260503060000_pdi_anexos_operacionais.sql`
- `src/features/pdi/WizardPDI.tsx`
- `src/hooks/usePDI.ts`
- `src/hooks/usePDI_MX.ts`
- `supabase/migrations/20260617006000_pdi_vendedor_execucao_actions.sql`
- `src/lib/pdi-vendedor-execution-actions-migration.test.ts`
- `src/features/crm/hooks/useExecutionActions.ts`
- `src/features/crm/CentralExecucao.container.tsx`
- `src/features/crm/CentralExecucao.container.test.tsx`
- `src/lib/calculations.ts`
- `src/lib/calculations.test.ts`
- `src/pages/GerenteFeedback.tsx`
- `src/pages/GerentePDI.tsx`
- `src/pages/PDIPrint.tsx`
- `src/pages/VendedorPDI.tsx`
- `src/pages/VendedorPDI.test.tsx`
- `supabase/migrations/20260714182104_lock_seller_pdi_structural_edits.sql`
- `src/lib/pdi-structural-edit-lock-migration.test.ts`
