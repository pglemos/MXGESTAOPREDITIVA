# Story OPS-20 - Campos do Preenchimento Diario do Vendedor

**Status:** Implemented - aguardando validacao final  
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 3 - Acompanhamento diario e rotina mobile  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @ux-design-expert + @dev  
**Quality Gate:** @qa  
**Prioridade:** High

## Contexto

O sistema ja possui `Checkin.tsx` e tabela canonica `lancamentos_diarios` para o registro diario do vendedor. A reuniao reforcou que esse preenchimento e um dos principais inputs da consultoria, mas precisa ser simples e vender valor ao vendedor.

Esta story nao cria um novo check-in. Ela define e ajusta o MVP dos campos obrigatorios e da experiencia mobile.

## User Story

Como vendedor,  
quero preencher minha rotina diaria de forma rapida no celular,  
para registrar minha producao sem sentir que estou apenas cumprindo burocracia.

## Acceptance Criteria

- [x] Confirmar campos obrigatorios do MVP de preenchimento diario.
- [x] Campos atuais de leads, agendamentos, visitas e vendas continuam suportados.
- [x] O formulario mobile deixa claro o que se refere ao dia anterior e ao dia atual.
- [x] Producao zero exige justificativa, mantendo regra atual.
- [x] Ajuste tecnico continua separado de registro diario.
- [x] Tela comunica beneficio operacional ao vendedor sem texto explicativo excessivo.
- [x] Dados continuam gravando em `lancamentos_diarios` com `metric_scope`.
- [x] Validacoes de funil e limites continuam ativas.

## Campos MVP

- Leads do dia anterior.
- Agendamentos carteira do dia anterior.
- Agendamentos internet do dia anterior.
- Agendamentos carteira para hoje.
- Agendamentos internet para hoje.
- Visitas/comparecimentos do dia anterior.
- Vendas porta do dia anterior.
- Vendas carteira do dia anterior.
- Vendas internet do dia anterior.
- Observacao.
- Justificativa de zero quando aplicavel.

## Fora de Escopo

- Novo banco de check-in.
- IA para preencher dados automaticamente.
- Gamificacao completa.

## Arquivos Provaveis

- `src/pages/Checkin.tsx`
- `src/hooks/useCheckins.ts`
- `src/lib/calculations.ts`
- `src/types/database.ts`
- `src/test/*.test.ts`

## Gates

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [ ] Smoke mobile quando houver alteracao de UI.

## File List

- `docs/stories/story-OPS-20-campos-preenchimento-diario-vendedor.md`
- `src/lib/daily-routine.ts`
- `src/lib/daily-routine.test.ts`
- `src/pages/Checkin.tsx`
