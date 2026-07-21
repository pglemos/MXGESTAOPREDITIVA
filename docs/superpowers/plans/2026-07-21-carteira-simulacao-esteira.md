# Correção da Esteira em Simulação de Vendedor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que administradores MX em simulação de vendedor executem e persistam transições da carteira no vendedor simulado, sem ampliar permissões de vendedores reais e com auditoria do administrador responsável.

**Architecture:** A identidade de simulação será persistida no `sessionStorage` por um módulo de contexto autenticado e consumida pelo adapter da Carteira. O adapter continuará usando a sessão real para autenticação, mas enviará o vendedor/loja alvo à RPC; o Postgres só aceitará atuação delegada quando o chamador for da área interna MX e o alvo possuir vínculo ativo de vendedor na loja informada. Leituras, mutações e auditoria usarão o mesmo contexto efetivo.

**Tech Stack:** React 19, TypeScript, Bun Test, Supabase JS, PostgreSQL/PLpgSQL, GitHub Actions, Vercel.

## Global Constraints

- Não conceder vínculo artificial de vendedor ao administrador.
- Não confiar em IDs de vendedor ou loja enviados pelo navegador sem validação no banco.
- Preservar o fluxo existente para vendedor autenticado normalmente.
- Registrar `simulated_by`, `acting_seller_user_id` e `acting_store_id` nos metadados do evento quando houver simulação.
- Manter idempotência e locks transacionais existentes.
- Implementar em ciclo TDD e validar typecheck, lint, testes, build e deploy.

---

### Task 1: Contrato do contexto de simulação

**Files:**
- Create: `src/lib/auth/simulationContext.ts`
- Create: `src/lib/auth/simulationContext.test.ts`

**Interfaces:**
- Produces: `readSimulationContext()`, `writeSimulationContext(context)`, `clearSimulationContext()` e `SELLER_SIMULATION_CONTEXT_KEY`.

- [ ] **Step 1: Write the failing test**

Cobrir leitura válida, rejeição de JSON inválido/incompleto e limpeza da chave.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/lib/auth/simulationContext.test.ts`
Expected: FAIL porque o módulo ainda não existe.

- [ ] **Step 3: Write minimal implementation**

Validar `role === 'vendedor'`, UUIDs não vazios para `userId` e `storeId`, e retornar `null` para conteúdo inválido.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/lib/auth/simulationContext.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `test(auth): definir contrato do contexto de simulação`.

### Task 2: Publicar identidade efetiva da simulação

**Files:**
- Modify: `src/hooks/auth/useAuthRBAC.ts`
- Test: `src/hooks/auth/useAuthRBAC.test.tsx`

**Interfaces:**
- Consumes: `writeSimulationContext()` e `clearSimulationContext()`.
- Produces: contexto gravado após resolver perfil e vínculo simulados.

- [ ] **Step 1: Write the failing test**

Verificar que iniciar simulação de vendedor grava `{ role, userId, storeId }` e que parar/errar limpa o contexto.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/hooks/auth/useAuthRBAC.test.tsx`
Expected: FAIL porque o hook ainda não publica a identidade.

- [ ] **Step 3: Write minimal implementation**

Gravar somente após perfil e vínculo válidos; limpar em `stopSimulation`, ausência de simulação e erro.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/hooks/auth/useAuthRBAC.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `fix(auth): publicar identidade da simulação de vendedor`.

### Task 3: Adapter usar o vendedor simulado em leitura e mutação

**Files:**
- Modify: `src/features/carteira-clientes/lib/installCarteiraBase44Adapter.js`
- Modify: `src/features/carteira-clientes/lib/carteira-adapter-contract.test.ts`

**Interfaces:**
- Consumes: `readSimulationContext()`.
- Produces: payload com `acting_seller_user_id` e `acting_store_id` apenas em simulação válida.

- [ ] **Step 1: Write the failing test**

Simular sessão de administrador e contexto de vendedor; verificar que a listagem filtra pelo vendedor/loja simulados e que a RPC recebe os campos de atuação delegada.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/features/carteira-clientes/lib/carteira-adapter-contract.test.ts`
Expected: FAIL mostrando uso do `auth.uid()` real.

- [ ] **Step 3: Write minimal implementation**

Resolver contexto efetivo por operação, sem cachear o alvo simulado; manter cache somente do usuário autenticado. Aplicar vendedor e loja simulados nas consultas e no payload da RPC.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/features/carteira-clientes/lib/carteira-adapter-contract.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `fix(carteira): usar identidade simulada no adapter`.

### Task 4: Autorizar atuação delegada no Postgres

**Files:**
- Create: `supabase/migrations/20260721110000_carteira_simulacao_vendedor.sql`
- Create: `supabase/rollbacks/20260721110000_carteira_simulacao_vendedor.sql`
- Modify: `src/lib/carteira-base44-hardening-migration.test.ts`

**Interfaces:**
- Consumes: `acting_seller_user_id` e `acting_store_id` no JSON da RPC.
- Produces: validação segura do chamador interno, escopo do vendedor/loja e metadados de auditoria.

- [ ] **Step 1: Write the failing migration contract test**

Exigir validação por `eh_area_interna_mx`, vínculo ativo de vendedor, escopo de ownership e metadados de auditoria.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/lib/carteira-base44-hardening-migration.test.ts`
Expected: FAIL porque a migration ainda não existe.

- [ ] **Step 3: Write minimal migration and rollback**

Atualizar `carteira_salvar_cliente_v2` e `carteira_salvar_cliente` para separar `v_caller` de `v_user`, validar atuação delegada, manter o caminho normal intacto e mesclar auditoria em `evento_metadata`.

- [ ] **Step 4: Run migration tests**

Run: `bun test --isolate src/lib/carteira-base44-migration.test.ts src/lib/carteira-base44-hardening-migration.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `fix(db): autorizar simulação auditada na carteira`.

### Task 5: Verificação integrada e produção

**Files:**
- No additional source files unless verification exposes a defect.

- [ ] **Step 1: Run focused tests**

Run: `bun test src/lib/auth/simulationContext.test.ts src/hooks/auth/useAuthRBAC.test.tsx src/features/carteira-clientes/lib/carteira-adapter-contract.test.ts src/features/carteira-clientes/lib/carteira-mappers.test.ts`
Expected: PASS.

- [ ] **Step 2: Run quality gates**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: exit code 0.

- [ ] **Step 3: Validate database behavior transactionally**

Executar cenário com administrador interno atuando como vendedor válido, confirmar mudança de etapa e auditoria, e encerrar com `ROLLBACK`.

- [ ] **Step 4: Apply migration and inspect advisors**

Aplicar a migration no projeto `fbhcmzzgwjdgkctlfvbo`; consultar advisors de segurança e performance.

- [ ] **Step 5: Open PR, wait for CI, merge and verify Vercel**

Confirmar checks verdes, mergear, aguardar deployment `READY` e verificar que o alias `mxperformance.vercel.app` aponta para o novo SHA.

- [ ] **Step 6: Verify original symptom**

Na simulação de vendedor, registrar um resultado para cliente de teste e confirmar: oportunidade criada/atualizada, etapa alterada, evento auditado e ausência de novo erro `Vendedor sem vínculo ativo com loja.` nos logs.
