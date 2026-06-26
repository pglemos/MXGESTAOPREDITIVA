# QA Gate Report — EV-1.5 a EV-1.9 (Fechamento Diário)

**Data:** 2026-06-26
**Executor:** @aiox-master (Orion) em modo YOLO, hat @qa (Quinn)
**Escopo:** 5 stories `Ready for Review` derivadas da Especificação Funcional — Tela Fechamento Diário
**Modo:** Revisão real de código + migrations + execução de gates. Não é dry-run — leitura completa das duas migrations SQL aplicadas em produção, leitura das RLS policies envolvidas, e verificação cruzada com as constraints reais de `usuarios.role`/`vinculos_loja.role`.

---

## 1. Resumo Executivo

| Métrica | Resultado |
|---|---|
| Stories avaliadas | 5 (EV-1.5, EV-1.6, EV-1.7, EV-1.8, EV-1.9) |
| Veredicto agregado | **PASS** |
| Bloqueadores (FAIL) | 0 |
| Concerns (não-bloqueantes) | 2 |
| Achado positivo adicional (não documentado no Dev Agent Record original) | 1 |
| Testes do projeto | 654 pass / 0 fail / 2371 expectations |
| Typecheck | clean |
| Lint | 0 errors |
| Build | OK |
| Migrations em produção | 2 aplicadas (`20260626120000`, `20260626130000`), verificadas linha a linha |

---

## 2. Quality Checks Globais

### 2.1 Typecheck (`npm run typecheck`)
✅ PASS — `tsc --noEmit` sem diagnósticos.

### 2.2 Lint (`npm run lint`)
✅ PASS — 0 errors (inclui `lint-tokens-ast.mjs`, sem hex hardcoded).

### 2.3 Unit Tests (`npm test`)
✅ PASS — 654 testes / 128 arquivos / 2371 expectations / 0 falhas.
Inclui as novas suítes desta leva: `disciplina.test.ts` (7), `lock-stage.test.ts` (7), `clientes-list-from-crm.test.ts` (6), `confirm-finalize.test.ts` (4), `regularizacao-lock.test.ts` (5).

### 2.4 Build (`npm run build`)
✅ PASS — build de produção sem erros.

### 2.5 Migrations Supabase (produção, projeto `fbhcmzzgwjdgkctlfvbo`)
✅ Ambas aplicadas e revisadas linha a linha:
- `20260626120000_ev1_5_disciplina_persistida.sql`
- `20260626130000_ev1_6_janela_atraso_liberacao.sql`

`npm run gen:db-types` confirmado: `fechamento_liberacoes`, `pontuacao_disciplina_final` e demais colunas novas presentes em `src/types/database.generated.ts`.

---

## 3. Achado Positivo Adicional (não estava no Dev Agent Record original de EV-1.6)

Comparando `checkin_validation_kit` original (`20260518120000`) com a versão reescrita em EV-1.6: o bloqueio de janela 09:45 **só existia para `p_scope = 'daily'`** na versão original — `scope = 'historical'` (usado pelo fluxo de regularização de pendência no Histórico) **nunca teve nenhum gate de horário**, em nenhuma versão anterior. A reescrita de EV-1.6 mudou a condição para `IF p_scope IN ('daily', 'historical') AND NOT p_liberado`, o que **fecha uma lacuna real de produção**: antes de EV-1.6, um vendedor podia criar o `lancamentos_diarios` placeholder de uma pendência (`submit_checkin` com `scope='historical'`) a qualquer hora, sem nenhuma liberação, e o único gate que existia era a aprovação manual do gerente na fila de correção (`solicitacoes_correcao_lancamento`) — que é uma etapa totalmente separada, sem relação com `fechamento_liberacoes`. Agora o servidor também exige liberação real para esse scope. Isso é o que dá "dente" de verdade à trava de UI implementada em EV-1.9 — sem essa expansão (que aconteceu como efeito colateral da correção do AC-0 de EV-1.6, não foi um objetivo declarado à parte), a trava client-side seria só estética.

**Ação:** adicionado como nota no Dev Agent Record de EV-1.6 (ver story file).

---

## 4. Concerns (não-bloqueantes)

### C1 — Strings de role mortas em `consultar_liberacao_por_token`/`liberar_fechamento_por_token`
Ambas as funções checam `v_caller_role NOT IN ('gerente', 'supervisor', 'administrador', 'dono', 'administrador_geral', 'administrador_mx')`. A constraint real (`usuarios_role_check`, `20260430190000_fundacao_portugues_permissoes_evidencias.sql:33-34`) só permite `administrador_geral | administrador_mx | consultor_mx | dono | gerente | vendedor` — **`'supervisor'` e `'administrador'` nunca existem como valor de `usuarios.role`**, então essas duas entradas são código morto. Não é falha de segurança (strings extras que nunca correspondem a um valor real não ampliam acesso, só ficam inertes), mas é desalinhamento com a redação literal do §5 da spec ("Gerente; Supervisor; Administrador; Dono") — o sistema atual não tem papel de "Supervisor" nem "Administrador" (tem `administrador_geral`/`administrador_mx`). Recomendação: ou remover as duas strings mortas num cleanup futuro, ou abrir uma story de produto se "Supervisor" precisar existir como papel real.

### C2 — Gate de horário do `historical` é por relógio atual, não por idade da pendência
A expansão do item 3 acima gate por `now() > 09:45` no momento da chamada, não pela distância entre a data pendente e hoje. Na prática: um vendedor que abrir o Histórico **antes das 09:45 de hoje** consegue regularizar uma pendência de vários dias atrás sem liberação alguma (o placeholder passa pelo `checkin_validation_kit` sem cair no bloqueio, porque o relógio ainda não passou de 09:45). Comportamento pré-existente no desenho original do gate diário (mesma lógica já valia para `scope='daily'`), não introduzido por EV-1.9 — só fica mais visível agora que `historical` também passa pelo mesmo crivo. Não bloqueante porque a spec não define explicitamente esse cenário, mas vale registrar para decisão de produto futura.

---

## 5. Verdicts Por Story

### EV-1.5 — Disciplina do Fechamento persistida
| Critério | Status |
|---|---|
| Colunas novas em `lancamentos_diarios` (9 colunas) | ✅ |
| `submit_checkin` persiste disciplina/penalidade derivadas no servidor | ✅ (correção de cast enum confirmada na versão final, vigente via EV-1.6) |
| `compute_individual_score_mvp` usa média 7d de `pontuacao_disciplina_final` com fallback | ✅ |
| Client (`disciplina.ts`) bate com fórmula §17 | ✅ (7 testes) |
| Defesa em profundidade (servidor deriva penalidade do seu próprio relógio) | ✅ |
| Gates | ✅ |

**Verdict:** ✅ **PASS**

---

### EV-1.6 — Janela de atraso 3 estágios e liberação real
| Critério | Status |
|---|---|
| Tabela `fechamento_liberacoes` + RLS (SELECT-only, escrita via RPC) | ✅ |
| `avisarGerenteWhatsapp` resolve gerente real via `vendedores_loja`+`vinculos_loja` | ✅ |
| Token opaco + hash sha256 + expiração 24h | ✅ |
| 3 estágios de horário (`lock-stage.ts`, 7 testes) | ✅ |
| AC-0 crítico: `checkin_validation_kit` bypassa `time_window_closed` quando liberado | ✅ — e também passou a cobrir `historical` (achado da seção 3) |
| Regressão de produção (enum cast) autodetectada e corrigida | ✅ confirmado na leitura da migration final |
| Gates | ✅ |

**Verdict:** ✅ **PASS** (concern C1 documentado, não bloqueante)

---

### EV-1.7 — Fonte única para Cadastrar Venda/Agendamentos
| Critério | Status |
|---|---|
| `clientesList` derivado de `oportunidades`+`agendamentos` reais | ✅ |
| Sem localStorage como fonte | ✅ |
| Create/update de oportunidade (bug de duplicação ao editar corrigido) | ✅ |
| Agendamento vinculado via `oportunidade_id` (create/update/delete) | ✅ |
| RLS de `oportunidades`/`agendamentos` permite os fluxos de escrita do vendedor (`FOR ALL` seller policy) | ✅ confirmado |
| Testes do seletor (6 casos, 5 classificações) | ✅ |
| Gates | ✅ |

**Verdict:** ✅ **PASS**

---

### EV-1.8 — Modal "Deseja finalizar mesmo assim?"
| Critério | Status |
|---|---|
| Modal abre quando `totalAgendamentosD1 > creditosValidos` | ✅ |
| X/Y/Z% exibidos corretamente | ✅ |
| "Voltar e cadastrar" não finaliza, rola até o card CRM | ✅ |
| "Finalizar mesmo assim" finaliza normalmente | ✅ |
| D+1 zerado ou 100% detalhado não abre modal | ✅ |
| Nenhum termo "incompleto"/"obrigatório" no texto | ✅ |
| Lógica extraída e testada (`confirm-finalize.ts`, 4 testes) | ✅ |
| Gates | ✅ |

**Verdict:** ✅ **PASS**

---

### EV-1.9 — Trava de edição na regularização do Histórico
| Critério | Status |
|---|---|
| Campos bloqueados quando Pendente sem liberação | ✅ (10 inputs + select + textarea) |
| Botão vermelho/desabilitado + mensagem de prazo | ✅ |
| Liberado → campos habilitam + aviso de penalização 10% | ✅ |
| Lógica extraída e testada (`regularizacao-lock.ts`, 5 testes) | ✅ |
| Reforço server-side real (não só UI) | ✅ — graças ao achado da seção 3, a trava de UI agora reflete um gate que também existe no `submit_checkin`/`checkin_validation_kit` |
| Gates | ✅ |

**Verdict:** ✅ **PASS** (concern C2 documentado, não bloqueante)

---

## 6. Decisão Final

**Veredicto agregado: PASS.** Nenhum bloqueador. 2 concerns documentados (C1, C2) para follow-up de produto/cleanup, não impedem merge. Liberado para @devops aplicar `git commit` (push fica a critério do usuário, conforme Agent Authority Matrix).
