# Fechamento Diário Gerencial Base44 Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir a tela `/fechamento-diario` e seus estados/modais para reproduzir a anatomia visual e os fluxos observáveis do Base44, preservando Supabase, RLS, RPCs e auditoria do MX.

**Architecture:** A correção será local ao módulo gerencial. O shell modal `referenceStyle` será alinhado ao `ModalShell.jsx` Base44; os fluxos de Agenda D+1 e regularização ganharão a estrutura correta sem copiar SDK ou dados demo. Dados permanecem nos contratos canônicos MX.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Radix Dialog, Supabase, Bun Test, Testing Library, Playwright.

## Global Constraints

- A especificação funcional textual vence em regras, fórmulas, segurança e permissões.
- Base44 vence em composição visual e comportamento observável não conflitante.
- O sidebar MX atual não entra no escopo.
- Não importar SDK Base44, mocks ou `localStorage` empresarial.
- Não alterar RLS nem schema sem prova de necessidade.
- Não declarar pixel perfect sem navegador e diff visual.

---

### Task 1: Testes de contrato visual e de regularização

**Files:**
- Modify: `src/features/manager/daily-closing/ManagerDailyClosing.test.tsx`
- Create: `src/features/manager/daily-closing/RegularizationsListModal.test.tsx`
- Create: `src/components/organisms/Modal.reference.test.tsx`

- [ ] Escrever testes que exijam título/subtítulo Base44, overlay sem blur, raio de 16px e botão de fechar compacto.
- [ ] Escrever teste que exija confirmação antes de aprovar ou recusar regularização.
- [ ] Escrever teste que exija comentário e checkbox para aprovação.
- [ ] Executar testes e confirmar RED no código atual.
- [ ] Commitar somente os testes.

### Task 2: Shell modal Base44 exato

**Files:**
- Modify: `src/components/organisms/Modal.tsx`

- [ ] Implementar `referenceStyle` com overlay `bg-black/30`, sem blur.
- [ ] Usar título `text-lg font-semibold text-gray-800`, descrição `text-sm text-gray-500` e X de 18px.
- [ ] Usar `rounded-2xl`, `shadow-xl`, header/body/footer com `p-5` e bordas `gray-100`.
- [ ] Preservar focus trap, Escape, portal e restauração do foco do Radix.
- [ ] Executar testes focados e confirmar GREEN.
- [ ] Commitar.

### Task 3: Fluxo de regularização e aprovação

**Files:**
- Modify: `src/features/manager/daily-closing/RegularizationsListModal.tsx`
- Create: `src/features/manager/daily-closing/RegularizationDecisionModal.tsx`

- [ ] Abrir modal de confirmação ao clicar Aprovar/Recusar.
- [ ] Aprovação exige checkbox; comentário permanece opcional.
- [ ] Recusa exige motivo não vazio.
- [ ] Exibir vendedor e data de competência no subtítulo.
- [ ] Executar callback somente após confirmação.
- [ ] Manter o modal de lista abaixo do modal decisório.
- [ ] Executar testes e commit.

### Task 4: Agenda D+1 com menu de confirmação Base44

**Files:**
- Modify: `src/features/manager/daily-closing/AgendaD1Panel.tsx`
- Modify: `src/features/manager/daily-closing/agenda-d1.ts`
- Add/modify tests in `src/features/manager/daily-closing/agenda-d1.test.ts`

- [ ] Remover o botão visual de copiar da coluna principal.
- [ ] Transformar `Confirmar` em menu flutuante com Confirmado, Sem resposta, Solicitou reagendamento, Cancelou e Outro.
- [ ] Abrir painel/modal de observação somente após escolher um resultado.
- [ ] Manter WhatsApp e Telefone auditados.
- [ ] Não alterar o agendamento original; notificar vendedor em reagendamento/cancelamento.
- [ ] Ajustar tabela, filtros e classes ao Base44.
- [ ] Executar testes e commit.

### Task 5: Página, cards e tabela principal

**Files:**
- Create: `src/features/manager/daily-closing/manager-daily-closing-reference.css`
- Modify: `src/components/organisms/Modal.tsx` para importar o CSS local.
- Modify tests in `src/features/manager/daily-closing/ManagerDailyClosing.test.tsx`

- [ ] Escopar CSS por `main:has(#manager-closing-movement)`.
- [ ] Alinhar header, cards, tabela, badges, circulares, botões e espaços ao Base44.
- [ ] Garantir `max-w-7xl`, raio 16px, sombras, fontes e densidade da captura.
- [ ] Ocultar efeitos globais incompatíveis, como `active:scale`, somente dentro do escopo.
- [ ] Preservar responsividade e overflow horizontal da tabela.
- [ ] Executar testes e commit.

### Task 6: Evidência e regressão visual

**Files:**
- Modify: `src/test/manager-module.playwright.ts`
- Create: `docs/qa/evidence/manager-daily-closing/README.md`
- Modify: `docs/qa/MODULO_GERENCIAL_PARITY_MATRIX.md`

- [ ] Adicionar screenshots determinísticos da página e dos modais em 1440×900, 768×1024 e 390×844.
- [ ] Cobrir Conferência de Leads, histórico, Regularizações, decisão, Agenda D+1, menu Confirmar, Detalhes e Cobrança.
- [ ] Registrar que screenshots fornecidos são a baseline visual externa.
- [ ] Executar lint, typecheck, testes, build e E2E quando o ambiente possuir navegador.
- [ ] Não marcar APROVADO sem diff visual executado.
- [ ] Abrir PR com riscos e bloqueios explícitos.
