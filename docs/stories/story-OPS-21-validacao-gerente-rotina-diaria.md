# Story OPS-21 - Validacao do Gerente na Rotina Diaria

**Status:** Implemented - aguardando validacao final  
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 3 - Acompanhamento diario e rotina mobile  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @dev + @data-engineer  
**Quality Gate:** @qa  
**Prioridade:** High

## Contexto

`RotinaGerente.tsx` ja centraliza a rotina da loja, pendencias, ajustes e disparo do matinal. A reuniao reforcou que o sistema precisa ter um processo claro de validacao pelo gerente, porque o dono/gerente precisa cobrar e comprar a ideia.

## User Story

Como gerente,  
quero validar a rotina diaria da equipe em uma tela unica,  
para garantir que os dados usados pela consultoria estao completos e confiaveis.

## Acceptance Criteria

- [x] Gerente visualiza vendedores pendentes de preenchimento.
- [x] Gerente visualiza quem preencheu e principais numeros do dia.
- [x] Gerente consegue registrar que a rotina diaria foi conferida.
- [x] Registro de rotina salva data, loja, gerente, pendentes, snapshot e observacoes.
- [x] Solicitações de correcao continuam no fluxo de ajustes.
- [x] Admin/admin master MX consegue auditar por loja.
- [x] Vendedor nao consegue validar rotina da loja.
- [x] Tela deixa claro quando o matinal ainda nao pode ser disparado.

## Regras de Negocio

- Rotina diaria so deve ser considerada validada quando gerente confirmar.
- Pendencias devem continuar visiveis mesmo apos validacao.
- Validacao nao deve alterar os lancamentos dos vendedores.

## Arquivos Provaveis

- `src/pages/RotinaGerente.tsx`
- `src/hooks/useManagerRoutine.ts`
- `src/hooks/useCheckins.ts`
- `src/hooks/useCheckinAuditor.ts`
- `src/types/database.ts`
- `supabase/migrations/*`

## Gates

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [ ] RLS/access smoke para gerente, vendedor e admin MX.

## File List

- `docs/stories/story-OPS-21-validacao-gerente-rotina-diaria.md`
- `src/pages/RotinaGerente.tsx`
- `src/hooks/useManagerRoutine.ts`
- `src/lib/daily-routine.ts`
