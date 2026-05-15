# Story OPS-22 - Notificacoes da Puxada Diaria

**Status:** Implemented - aguardando validacao final  
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 3 - Acompanhamento diario e rotina mobile  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @architect + @dev  
**Quality Gate:** @qa  
**Prioridade:** High

## Contexto

A reuniao citou pop-up/app/WhatsApp como meios para lembrar o vendedor do preenchimento diario. O projeto ja possui `notificacoes`, preferencias por usuario e broadcast operacional. Para MVP, o foco deve ser notificacao in-app/popup, sem depender de WhatsApp.

## User Story

Como vendedor,  
quero receber um lembrete claro no horario da puxada diaria,  
para nao esquecer meu preenchimento e manter minha disciplina operacional.

## Acceptance Criteria

- [x] Sistema possui contrato de lembrete diario por usuario/loja.
- [x] Lembrete usa o canal `notificacoes` ja existente.
- [x] Vendedor pendente recebe notificacao in-app operacional.
- [x] Gerente visualiza pendentes e pode acionar lembrete manual.
- [x] Admin/admin master MX consegue disparar por loja quando esta atuando no centro de comando.
- [x] WhatsApp fica fora do MVP, salvo link/manual ja existente.
- [x] Notificacao evita duplicidade indefinida na mesma sessao de rotina por usuario/data.

## Regras de Negocio

- Lembrete deve priorizar vendedores sem `lancamentos_diarios` na data de referencia.
- Horario padrao deve ser configuravel futuramente; MVP pode usar horario operacional documentado.
- Notificacao nao substitui validacao do gerente.

## Arquivos Provaveis

- `src/hooks/useData.ts`
- `src/pages/Notificacoes.tsx`
- `src/pages/RotinaGerente.tsx`
- `src/pages/VendedorHome.tsx`
- `supabase/migrations/*`
- `supabase/functions/*`

## Gates

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] Teste de payload/dedupe de notificacao no helper.

## File List

- `docs/stories/story-OPS-22-notificacoes-puxada-diaria.md`
- `src/lib/daily-routine.ts`
- `src/lib/daily-routine.test.ts`
- `src/pages/RotinaGerente.tsx`
