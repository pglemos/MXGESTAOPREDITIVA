# Epic 3: Admin Master — Edição de Lojas

**Epic ID:** EPIC-MX-EVOL-03
**Status:** Implementado
**Onda:** A (Imediata)
**Estimativa:** 2-3 dias úteis
**Owner:** @pm (Morgan)
**Implementação:** @dev (Dex) + @ux-design-expert (Uma) + @data-engineer (Dara)
**Origem:** Tarefa original #1

---

## Objetivo

Permitir que usuários com role `admin` (admin master MX) editem dados cadastrais de lojas (`stores`)
diretamente pela UI, sem necessidade de SQL manual ou intervenção de @data-engineer.

---

## Contexto Técnico

A página [src/pages/Lojas.tsx](../../../../src/pages/Lojas.tsx) já existe. O hook [useStores em src/hooks/useTeam.ts:157](../../../../src/hooks/useTeam.ts):

- ✅ Tem `createStore(name, managerEmail)` (linha 185)
- ❌ **Não tem** `updateStore(id, fields)` — precisa ser implementado
- ❌ Modal de edição também não existe

A tabela `stores` deve ser inspecionada para mapear todos os campos editáveis (script de inspeção é a primeira story).

---

## Stories

### Story 3.1: Mapear schema atual de `stores` e definir campos editáveis

**Critérios de Aceitação:**

- [x] Documento `docs/data/stores-schema.md` lista todas as colunas da tabela `stores`, tipos, defaults, constraints
- [x] PO + Architect definem quais campos são **editáveis pelo admin** (whitelist)
  - Sugestão inicial: `name`, `manager_email`, `phone`, `address`, `cnpj`, `active`
  - Campos protegidos (não editáveis via UI): `id`, `created_at`, `code` (se existir)
- [x] RLS policies revisadas: somente role `admin` pode `UPDATE` em `stores`

### Story 3.2: Implementar `updateStore` no hook `useStores`

**Critérios de Aceitação:**

- [x] Função `updateStore(id: string, fields: Partial<Store>): Promise<{ error?: string }>` adicionada a [src/hooks/useTeam.ts](../../../../src/hooks/useTeam.ts)
- [x] Validação Zod no client antes de enviar (nome e formato de email; CNPJ/telefone nao existem no schema atual)
- [x] Refetch automático após sucesso
- [x] Toast de feedback (sucesso/erro) via `sonner`

### Story 3.3: Modal/Drawer de Edição de Loja

**Critérios de Aceitação:**

- [x] Componente `<StoreEditModal />` em `src/features/admin/components/StoreEditModal.tsx`
- [x] Aberto por botão "Editar" em cada card/linha de loja em [src/pages/Lojas.tsx](../../../../src/pages/Lojas.tsx)
- [x] Visível **apenas para role `admin`**
- [x] Form com todos os campos editáveis da whitelist da Story 3.1
- [x] Suporta marcação de loja como inativa (`active = false`) com confirmação
- [x] Segue padrão visual MX (atoms/molecules existentes, design tokens, glassmorphism premium)
- [x] Acessibilidade: focus trap, ESC fecha, ARIA labels

### Story 3.4: Auditoria de mudanças

**Critérios de Aceitação:**

- [x] Migration cria tabela `store_audit_log` (id, store_id, changed_by, changes JSONB, created_at)
- [x] Trigger `AFTER UPDATE` em `stores` registra delta (ANTES vs DEPOIS) na audit log
- [ ] Visualização opcional do histórico no modal (nice-to-have, pode ficar para fase 2)

---

## Definition of Done

- [ ] Todas as ACs das 4 stories marcadas
- [ ] `npm run typecheck` + `npm run lint` + `bun test` passam
- [ ] @ux-design-expert aprova visual
- [ ] @qa aprova (PASS)
- [ ] Teste manual: admin master edita uma loja real em produção e mudança persiste
- [ ] @devops realiza push

---

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Mudar `name` quebra integrações que usam slug derivado | Story 3.1 documenta dependências; Story 3.3 alerta no modal |
| Marcar loja como `active=false` esconde dados de gerentes/vendedores ativos | Confirmação dupla + toast informativo |
| RLS mal configurada permite escalation para `dono` | Story 3.1 tem auditoria explícita de policies |
