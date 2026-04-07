# STORY-06 — Mensagem Padrao De WhatsApp

Status: Ready for Review

## Contexto

O EPIC-06 exige mensagem oficial de grupo a partir do matinal, com resumo do mes, projecao, ranking, registros do dia, sem registro e CTA que o gerente compartilha sem editar. O uso do CTA tambem deve gerar evento de uso.

## Escopo

- Gerar texto WhatsApp a partir dos mesmos dados exibidos no matinal.
- Incluir bom dia, referencia da data, falta pouco/meta, resumo do mes, registros, ranking, sem registro e assinatura MX.
- Abrir fluxo de compartilhamento com Web Share API quando disponivel e fallback para WhatsApp Web/app.
- Registrar evento em `whatsapp_share_logs`.

## Fora De Escopo

- Automacao direta de envio no grupo.
- Integracao com API oficial do WhatsApp.
- Edicao manual de template por loja.

## Criterios De Aceite

- [x] Mensagem gerada e legivel sem edicao manual.
- [x] Conteudo bate com o matinal local.
- [x] CTA funciona em mobile/desktop via share nativo ou WhatsApp.
- [x] Evento de uso e gravado em `whatsapp_share_logs`.
- [x] RLS impede vendedor/dono de operar o CTA como gerente.
- [x] Gates locais passam.

## Validacao

- Migration `20260407005000_whatsapp_share_logs.sql` aplicada no Supabase live e reparada com `supabase migration repair --status applied 20260407005000`.
- Tabela live `whatsapp_share_logs` validada com colunas esperadas e politicas RLS `role_matrix_whatsapp_share_logs_*`.
- Insert via RLS simulando usuario real `admin@autogestao.com.br` validado com `BEGIN ... ROLLBACK`; nenhum dado de teste ficou persistido.

## Gates

- `npm run lint`: passou.
- `npm run typecheck`: passou.
- `npm test`: passou, 26 testes.
- `npm run build`: passou.
- `git diff --check`: passou.

## File List

- `docs/stories/story-whatsapp-message-06/spec/spec.md`
- `docs/stories/story-whatsapp-message-06/plan/implementation.yaml`
- `supabase/migrations/20260407005000_whatsapp_share_logs.sql`
- `src/pages/MorningReport.tsx`
- `src/types/database.ts`
