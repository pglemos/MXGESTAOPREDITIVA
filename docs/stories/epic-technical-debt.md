# Epic: MX Performance Hardening & Scale
## Ref: Brownfield Discovery Phase (April 2026)

**Owner**: @architect (Aria)
**Status**: ACTIVE
**Priority**: 🔥 HIGH

## 1. Context & Objective
O sistema MX Performance passou por uma refatoração visual massiva. Agora, esta épica visa fortalecer os pilares de **Segurança**, **Confiabilidade** e **Performance** para garantir que a base de código suporte o crescimento da rede sem riscos de vazamento de dados ou regressões de negócio.

---

## 2. User Stories (Backlog)

### [SEC-01] RLS Protection Hardening [DONE]
**Como** Administrador de Segurança,
**Eu quero** que o acesso à tabela `daily_checkins` seja restrito apenas aos membros da respectiva loja ou admins,
**Para que** um vendedor não consiga consultar a produção de lojas concorrentes via console do browser.
- **AC1**: Policy `daily_checkins_select` deve usar `(is_admin()) OR (is_member_of(store_id))`.
- **AC2**: Validação via script de intrusão comprovando que o acesso cruzado foi bloqueado.

### [QA-01] Core Flow Smoke Tests [IN PROGRESS]
**Como** Especialista em QA,
**Eu quero** uma suite de testes E2E básicos (Smoke Tests),
**Para que** eu possa validar que a refatoração universal de UI não quebrou os botões de Check-in, PDI e Feedback.
- **AC1**: Playwright configurado com 3 personas (Admin, Gerente, Vendedor).
- **AC2**: Testes cobrindo: Login, Envio de Check-in, Visualização de Ranking.

### [PERF-01] Atomic Skeleton Implementation [DONE]
**Como** Usuário Final,
**Eu quero** ver um estado de carregamento elegante enquanto as métricas são baixadas,
**Para que** eu não sofra com o layout shift da página (CLS).
- **AC1**: Novo Atom `src/components/atoms/Skeleton.tsx` seguindo tokens de radius MX.
- **AC2**: Aplicação de skeletons em `MXScoreCard` e `Card` de Ranking.

### [ARCH-01] VendedorHome Logic Sharding [DONE]
**Como** Arquiteto,
**Eu quero** extrair a lógica de cálculos e prescrição da página `VendedorHome.tsx` para hooks especializados,
**Para que** o componente de UI seja focado apenas em rendering e tenha menos de 300 linhas.
- **AC1**: Criação do hook `useTacticalPrescription.ts`.
- **AC2**: Extração de cálculos de atingimento para `useSellerMetrics.ts`.

---

## 3. Technical Constraints & Decisions
- **Estratégia de Testes**: Priorizar Playwright (E2E) sobre Unitários neste momento, devido à volatilidade da UI.
- **Padrão de Migração**: Seguir a estratégia de "Ondas" proposta pela @uma (UX).
- **Segurança**: Funções `SECURITY DEFINER` do Supabase devem ser auditadas para evitar loops infinitos.

---

## 4. Acceptance Criteria (Epic Level)
- [x] RLS vulnerabilidade (SEC-01) resolvida e validada.
- [x] Suite Playwright rodando com sucesso no CI ou local.
- [x] Dashboards principais com 0% de layout shift visível (usando skeletons).
- [x] Limpeza física da pasta `src/components/ui/` (Legacy) identificada e pronta para deleção (0 refs).
