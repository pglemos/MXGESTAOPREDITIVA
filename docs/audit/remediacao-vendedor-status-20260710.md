# Status da Remediação Integral — Módulo do Vendedor

**Origem:** `auditoria_integral_atualizada_modulo_vendedor_2026-07-10.md` (documento anexado pelo usuário, não versionado no repositório).
**Commit base auditado:** `5d8e1be5`.
**Sessão de remediação:** 2026-07-10, executada por Orion (aiox-master) em modo YOLO.
**Este documento:** status vivo — atualizar a cada sprint concluído, não é um artefato congelado.

---

## 1. Sprints concluídos nesta sessão

### 1.1 Sprint de Bloqueadores (P0) — ✅ CONCLUÍDO

Commit: `732b577c` (push `a882e1c2..732b577c`).

| Item | O que foi encontrado | O que foi feito |
|---|---|---|
| P0-01 — Política de horário | Já corrigido em commit anterior (`7778ebe2`), auditoria estava referenciando SHA antigo | Adicionados 4 testes de regressão travando client + RPC |
| P0-02 — Round-trip por canal | Confirmado real: leads Internet e visitas por canal (Showroom/Carteira/Internet) eram somados e descartados antes do banco, tanto no envio quanto na Regularização | Migrations `20260710180000` + `20260710190000`; client, RPCs (`submit_checkin`, `solicitar/aplicar_regularizacao_fechamento`) e reconstrução de formulário corrigidos |
| P0-05a — Previsão de entrega | Causa raiz real: `updateOportunidade` fazia overwrite completo e apagava `data_entrega_prevista`/`placa_veiculo` em qualquer edição que não os informasse (confirmar venda, confirmar perda, editar outro campo) | Update esparso (só grava campo se caller o enviou explicitamente) |
| P0-05b — Artefato QA com FAIL | Causa raiz real: script E2E usava chave de `upsert` desatualizada (`seller_id,week_reference`) após migration de maio trocar para `store_id,manager_id,seller_id,week_reference`. Não era bug de produto | Script corrigido; gate QA da story reclassificado de `PASS/score 100` para `CONCERNS/score 85` com achados documentados |
| P0-05c — CI incompleto | Achado grave: nenhum dos 10 workflows existentes rodava `tsc --noEmit` nem os testes unitários | Criado `.github/workflows/typecheck-and-unit-tests.yml` |
| P0-06 — Regularização | Fluxo ponta a ponta (vendedor solicita → gerente aprova/rejeita) está implementado e acessível — confirmado por código. Achado extra: toda regularização aprovada zerava `agd_cart_prev_day`/`agd_net_prev_day` | Corrigido junto com P0-02 (migration `20260710190000`) |

Além disso: corrigidos mocks de teste duplicados/desatualizados (`buildOportunidadePayload`) que faziam o teste real rodar contra uma versão obsoleta quando a suíte completa executava — fragilidade de infraestrutura de teste, não bug de produto, mas mascarava um bug real.

### 1.2 Sprint de Universidade e Perfil — fundação — ✅ PARCIALMENTE CONCLUÍDO

Commit: `53950404` (push `732b577c..53950404`).

| Item do backlog original | Status |
|---|---|
| UNIV-1 — Migrar tarefas de localStorage para Supabase | ✅ Feito. Tabelas `treinamento_tarefas`/`treinamento_tarefa_respostas` (migration `20260710200000`), seed do conteúdo existente casado por título real |
| UNIV-2 — Remover "Impacto no Score +12" hardcoded | ✅ Feito. Removidas também as métricas fabricadas `quiz_score:100`/`hours_studied:0.5`/`attended_live:true` do shim `base44Client` — nenhuma delas tinha coluna real no banco |
| UNIV-3 — Maturidade por regra configurável | ✅ Feito. Reaproveitada a função canônica `derivarNivelMaturidadeVendedor` (tempo de mercado + experiência + cargo) que já existia em `src/features/crm/lib/maturidade.ts`, usada em Meu Perfil — não foi preciso criar do zero |
| UNIV-7 — Migrar página para feature real, retirar shell legado | ✅ Feito **só para Treinamentos/Universidade** (`src/features/vendedor-treinamentos/`). Rota `/treinamentos` do vendedor não usa mais `withLegacyShell` nem `base44-reference`. **`MeuPerfilVendedor` continua no protótipo Base44** — não migrado nesta rodada |
| UNIV-4 — Motor de recomendação (Funil/Feedback/PDI) | ⬜ Não iniciado |
| UNIV-5 — Consolidar acesso a dados em serviço único tipado | ✅ Feito. `universidade-service` centraliza conteúdo, progresso e tarefas; `useVendedorTreinamentos` e `useTrainings` delegam a ele, sem alteração de RLS/schema. |
| UNIV-6 — Quiz oficial (5–10 questões, nota mínima 70%, tentativas, presença, auditoria) | ⬜ Não iniciado |
| UNIV-8 — Rota canônica `/universidade-mx` | 🟡 Parcial. Título da página já é "Universidade MX"; a URL continua em `/treinamentos` (redirect de `/universidade-mx` → `/treinamentos` já existia e segue funcionando) |

Verificado ao vivo no ambiente real (login `jose.vendedor@...`): página carrega, 4 stats reais (sem dado fabricado), tarefa marcada como concluída sobrevive a reload de página, zero erros de console/rede.

**Achado não previsto pela auditoria original:** existe um **segundo sistema de treinamentos**, paralelo e desconectado — `universidade_trilhas`/`universidade_aulas`/`universidade_certificacoes` (schema + `src/features/universidade/*`), usado hoje pelas telas de **gerente/dono/consultor** (`GerenteTreinamentos.tsx`, `ConsultorTreinamentos.tsx`, widget em `OwnerExecutiveCockpit.tsx`). O vendedor usa o schema `treinamentos`/`progresso_treinamentos`. São dois sistemas de conteúdo de treinamento diferentes, sem ligação entre si. Isso é uma decisão de arquitetura (qual sistema vira o canônico, como migrar o outro) — não foi resolvido, só documentado aqui para não ser esquecido.

**Decisão de arquitetura (2026-07-10):** `treinamentos`/`progresso_treinamentos` é a fonte canônica de conteúdo e progresso. É o único modelo já integrado com segmentação, publicação, avaliações, recomendações de Funil/Feedback/PDI e trilhas de desenvolvimento. `universidade_*` ficará em compatibilidade enquanto seu catálogo é importado de modo idempotente e rastreável; não haverá remoção nem conversão automática de certificados sem regra auditável. Detalhes e critérios em `docs/adr/ADR-MX-004-universidade-fonte-canonica.md`.

---

## 2. Ainda pendente — cronograma original do backlog (seção 9 do documento de auditoria)

### 2.1 Sprint de Universidade e Perfil — o que falta

1. UNIV-4 — Motor de recomendação explicável (lacuna no funil, feedback pendente, competência do PDI, maturidade e cargo).
2. ✅ UNIV-5 — Consolidar list/progresso de treinamentos em um único serviço Supabase tipado.
3. UNIV-6 — Quiz oficial: 5–10 questões, nota mínima 70%, tentativas, presença, auditoria.
4. Migrar `MeuPerfilVendedor` para fora de `base44-reference` (mesmo padrão aplicado em Treinamentos).
5. UNIV-8 completo — decidir se a URL migra para `/universidade-mx` como canônica (hoje é o inverso: `/universidade-mx` redireciona para `/treinamentos`).
6. ✅ Decisão de arquitetura sobre os dois sistemas de treinamento paralelos: `treinamentos` é canônico; executar a migração faseada prevista no ADR-MX-004.

### 2.2 Sprint de CRM e execução — não iniciado

1. Consolidar taxonomia comercial fragmentada (etapa do funil, situação da oportunidade, status/tipo de atividade, resultado de interação, motivo de perda, próxima ação — hoje misturados em conceitos sobrepostos).
2. Resolver modal sobre modal (clicar no cliente abre modal que trava outro modal).
3. Permitir escolha do canal de contato em "Executar Próximo Passo" (WhatsApp/ligação/presencial) — hoje força WhatsApp.
4. Provar as transições da Rotina e Mentor com teste automatizado (contador de pendências, atividade vencida sai da lista, reagendamento não duplica competência, venda encerra a atividade certa, garantia não reabre venda).
5. Garantir que a previsão de entrega (corrigida no Sprint P0) também aparece corretamente na Rotina como atividade `entrega`.
6. Testar idempotência da venda direta (`registrar_venda_direta`).

### 2.3 Sprint de metas e performance — não iniciado

1. Implementar metas `custom` e `proportional` (hoje caem no valor cheio da meta da loja — vendedor pode receber meta individual errada).
2. Migrar diagnóstico detalhado de Minha Meta (hoje lê `eventos_comerciais`/`clientes_oportunidades`/`regras_metas_loja` direto) para RPC analítica escopada, mantendo a RPC oficial para os KPIs do topo.
3. Testar paridade entre Home × Minha Meta × Ranking × Relatórios (mesma venda deve aparecer igual nas 4 superfícies).
4. Criar `docs/domain/metricas-vendedor.md` — dicionário oficial de score/disciplina/ranking/performance (definição, fórmula, fonte, granularidade, competência, arredondamento, responsável, consumidores, testes).

### 2.4 Sprint de acabamento — não iniciado

1. Reduzir duração dos toasts (`Toaster` global hoje em 8s; meta: sucesso 2,5–3s, info 4s, warning 6s, erro crítico 8s/persistente).
2. Consolidar rotas e nomenclaturas (aliases antigos vs novos coexistindo).
3. Remover arquitetura Base44 ativa remanescente (Perfil, e qualquer outro ponto ainda não migrado).
4. Consolidar design tokens (tokens MX vs Tailwind cru vs cores hex diretas vs componentes Base44 antigos — remover `LegacyModuleShell` quando não houver mais consumidor).
5. Executar a matriz responsiva completa (1366×768 em 100/125/150%, 1440×900, 1536×864, 1920×1080, 390×844, 430×932, teclado mobile, modal com conteúdo longo, tabela com scroll horizontal, navegação por teclado).

### 2.5 Itens da planilha de 9 problemas — status conhecido antes desta sessão

| # | Problema | Estado (conforme auditoria original) |
|---:|---|---|
| 1 | Modal sem rolagem / salvar invisível | Parcial — falta regressão visual em zoom 125/150% |
| 2 | Duas opções "Em andamento" | Estrutura mudou, taxonomia ainda fragmentada (ver 2.2.1) |
| 3 | Telefone aceita dígitos demais | Corrigido |
| 4 | Valor sem máscara monetária | Corrigido |
| 5 | Definir ação trava com ficha aberta | Não comprovado como encerrado |
| 6 | Sino não clicável | Corrigido |
| 7 | Progresso inicia em 70% sem ação | Corrigido |
| 8 | Regularização deveria ser preenchida antes da aprovação | Implementado; E2E completo ainda não provado |
| 9 | Próximo passo força WhatsApp | Não comprovado como encerrado (ver 2.2.3) |

---

## 3. Estado técnico atual

- **Testes:** 734 pass / 0 fail (`npm test`), typecheck limpo (`npm run typecheck`).
- **Migrations aplicadas em produção nesta sessão:** `20260710180000`, `20260710190000`, `20260710200000` — todas confirmadas via `supabase migration list` e `database.generated.ts` regenerado.
- **Commits enviados ao `main`:** `732b577c` (Sprint P0), `53950404` (Sprint Universidade — fundação).
- **CI:** ainda faltam jobs de Playwright E2E e smoke pós-deploy autenticado (dependem de secrets de ambiente live não configurados nesta sessão).

## 4. Pendência de segurança em aberto

O usuário colou em texto puro, no início desta sessão, token GitHub, token Supabase, token Vercel e login/senha de um usuário real (`jose.vendedor@...`). Recomendação permanece: **rotacionar os três tokens e trocar a senha** assim que possível — nenhum deles foi usado além do estritamente necessário (Supabase, para aplicar as migrations desta sessão, com confirmação explícita do usuário a cada rodada).
