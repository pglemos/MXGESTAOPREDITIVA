# Story OPS-20260514 - Conclusao legada de visitas PMR

## Status

Ready for Review

## Contexto

Algumas lojas parceiras ja passaram por visitas PMR antes da conclusao do fluxo operacional no sistema. Para migrar essas lojas sem retrabalho, a equipe MX precisa concluir varias visitas de uma vez, anexar documentos na pasta geral do cliente e registrar um resumo unico da migracao.

## Escopo

- Criar um fluxo administrativo para concluir visitas PMR 1 a 7 ja realizadas.
- Permitir selecao das visitas no detalhe do cliente da consultoria.
- Exigir resumo geral e replicar esse resumo no cliente e nas visitas marcadas.
- Reaproveitar a aba/pasta geral de arquivos do Google Drive do cliente.
- Bypassar evidencia obrigatoria por visita apenas neste fluxo legado e apenas para administradores MX.

## Checklist

- [x] Criar migration com campos de resumo legado e RPC administrativa.
- [x] Expor campos e acao no hook de detalhe do cliente.
- [x] Adicionar modal de conclusao legada na aba de visitas.
- [x] Adicionar anexos gerais do Drive no modal.
- [x] Criar testes de validacao e schema.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm test`.

## Dev Agent Record

### Debug Log

- Implementacao iniciada a partir do plano aprovado para conclusao legada de visitas PMR.
- Criada migration `20260514130000_legacy_pmr_visit_completion.sql` com campos de resumo legado e RPC `concluir_visitas_legadas_consultoria`.
- A RPC valida admin MX, cliente, resumo e visitas 1..7; cria visita ausente, marca visita existente como concluida e preenche checklist do template como concluido.
- Adicionado modal na aba `Agenda/Visitas` com selecao V1..V7, atalho V1,V2,V3,V5,V6,V7, resumo geral obrigatorio e anexos gerais via Google Drive.
- Smoke local autenticado em `http://localhost:3001/consultoria/clientes/acertt?tab=visits`: modal abriu, V1,V2,V3,V5,V6,V7 vieram marcadas, area de anexos gerais renderizou e console nao apresentou warnings/errors novos apos abertura.
- Gates executados com sucesso: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

### File List

- `docs/stories/story-OPS-20260514-legacy-pmr-visit-completion.md`
- `supabase/migrations/20260514130000_legacy_pmr_visit_completion.sql`
- `src/features/consultoria/types.ts`
- `src/hooks/useConsultingClientBySlug.ts`
- `src/lib/consultoria/legacy-visit-completion.ts`
- `src/lib/consultoria/legacy-visit-completion.test.ts`
- `src/lib/schemas/consulting-client.schema.ts`
- `src/pages/ConsultoriaClienteDetalhe.tsx`
- `src/test/schemas/schemas.test.ts`
