# Story DEV-26 - Trilha de Novo Colaborador

**Status:** Implemented - workflow persistido com bloqueios e notificacao final
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 4 - Desenvolvimento de pessoas  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @architect + @dev  
**Quality Gate:** @qa  
**Prioridade:** High

## Contexto

A reuniao definiu que novos vendedores devem entrar por uma trilha basica antes de serem liberados para venda. O objetivo comercial e tirar trabalho do lojista e padronizar a integracao de novos colaboradores.

## User Story

Como gerente,  
quero acionar uma trilha de entrada para novo vendedor,  
para garantir que ele conclua fundamentos antes da liberacao operacional.

## Acceptance Criteria

- [x] Gerente ou admin/admin master MX consegue atribuir trilha de novo colaborador a um vendedor.
- [x] Trilha possui etapas obrigatorias modeladas no contrato MVP.
- [x] Vendedor visualiza a trilha base e proximas etapas.
- [x] Etapas futuras podem permanecer bloqueadas ate conclusao de requisitos anteriores no contrato MVP.
- [x] Ao concluir a trilha inicial, sistema notifica gerente com orientacao de feedback e liberacao para venda.
- [x] Trilha inicial contempla fundamentos de mercado, rotina diaria, funil, atendimento, CRM/preenchimento diario e cultura/institucional generico.
- [x] Conteudo institucional personalizado por loja fica preparado como extensao, mas nao bloqueia o MVP.

## Regras de Negocio

- Trilha obrigatoria e para novos colaboradores; vendedores existentes podem receber conteudos recomendados sem obrigatoriedade retroativa.
- Liberacao para venda e decisao do gestor, nao automatismo do sistema.
- Personalizacao por loja pertence a Onda 5.

## Arquivos Provaveis

- `src/pages/GerenteTreinamentos.tsx`
- `src/pages/VendedorTreinamentos.tsx`
- `src/hooks/useTrainings.ts`
- `src/hooks/useData.ts`
- `src/pages/Notificacoes.tsx`
- `supabase/migrations`

## Gates

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] Teste de fluxo gerente atribui trilha, vendedor conclui, gerente recebe notificacao.

## File List

- `docs/stories/story-DEV-26-trilha-novo-colaborador.md`
- `src/lib/development-content.ts`
- `src/lib/development-content.test.ts`
- `src/pages/VendedorTreinamentos.tsx`
- `src/pages/GerenteTreinamentos.tsx`
- `src/hooks/useTrainings.ts`
- `scripts/validate_mx_development_full_smoke.ts`
- `supabase/migrations/20260515190000_development_full_completion.sql`
