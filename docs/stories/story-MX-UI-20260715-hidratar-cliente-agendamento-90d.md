# Story MX-UI-20260715 - Hidratar cliente e evitar agendamento duplicado em 90 dias

## Status

Ready for Review

## Story

**Como** vendedor,
**quero** que o cadastro do Fechamento Diário reutilize a ficha do cliente encontrado pelo telefone,
**para** manter os dados comerciais e não criar agendamentos duplicados durante o acompanhamento.

## Acceptance Criteria

1. Ao encontrar um cliente pelo telefone, o formulário carrega nome, veículo, negociação, financiamento, troca, observações e o último agendamento disponíveis no CRM.
2. Ao tentar cadastrar um agendamento para cliente com agendamento nos últimos 90 dias, o sistema não grava novo registro, exibe `Cliente já teve agendamento nos últimos 90 dias. Abrir Carteira` e abre a Carteira diretamente na ficha do cliente.
3. Agendamento fora da janela de 90 dias permite o cadastro normalmente; a data de referência é a data do fechamento em regularização ou a data atual no fechamento corrente.
4. Datas inválidas não bloqueiam o cadastro por falso positivo.

## Tasks / Subtasks

- [x] Cobrir hidratação, último agendamento e janela de 90 dias em testes puros.
- [x] Carregar a ficha completa do cliente e preencher o modal com os dados CRM.
- [x] Bloquear agendamento recente e abrir a ficha correspondente na Carteira.
- [x] Atualizar testes, gates e File List.

## Dev Agent Record

### Agent Model Used

Dex (AIOX dev)

### Debug Log References

- Reprodução informada pelo usuário em 15/07/2026 na rota `/fechamento-diario`: telefone identifica cliente, mas não hidrata a ficha nem impede agendamento recente.

### Completion Notes List

- O lookup detalhado consulta a ficha completa do cliente e hidrata os campos comerciais existentes, preservando a data do novo agendamento.
- Agendamento dentro da janela inclusiva de 90 dias é bloqueado com mensagem literal e navegação para a ficha na Carteira.
- Gates locais: lint, typecheck, suíte completa (1.054 pass), build e `git diff --check` aprovados.
- A URL publicada foi inspecionada antes da publicação e ainda exibe a versão anterior; deploy/push permanecem fora deste fluxo.

### File List

- `docs/stories/story-MX-UI-20260715-hidratar-cliente-agendamento-90d.md`
- `src/features/checkin/lib/existing-client-lookup.ts`
- `src/features/checkin/lib/existing-client-lookup.test.ts`
- `src/features/checkin/sections/NovoRegistroModal.tsx`
- `src/features/checkin/sections/NovoRegistroModal.test.ts`
- `src/features/crm/hooks/useClientes.ts`
- `src/features/crm/CarteiraClientes.container.tsx`
- `src/features/crm/CarteiraClientes.container.test.tsx`

### Change Log

| Data | Versão | Alteração | Autor |
|---|---:|---|---|
| 2026-07-15 | 1.0 | Story criada a partir da reprodução do cadastro de cliente/agendamento no Fechamento Diário. | Codex / Dex |
| 2026-07-15 | 1.1 | Hidratação da ficha CRM, bloqueio de agendamento em 90 dias e abertura direta da Carteira. | Codex / Dex |
