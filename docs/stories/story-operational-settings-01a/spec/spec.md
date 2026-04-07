# STORY-01A — Configuracao Operacional Por Loja

Status: Ready for Review

## Contexto

O EPIC-01A do backlog `v1.2` pede superficie operacional para o schema canonico criado em `STORY-01.1`. Sem essa tela, destinatarios, benchmark, meta, modo de fonte e vigencia de equipe continuam dependentes de edicao direta no banco.

## Escopo

- Criar tela admin de configuracao operacional por loja.
- Permitir editar `stores.source_mode`, `stores.active` e `stores.manager_email`.
- Permitir editar destinatarios em `store_delivery_rules`.
- Permitir editar benchmarks em `store_benchmarks`.
- Permitir editar regras de meta em `store_meta_rules`.
- Permitir vincular vendedor existente a `store_sellers` com vigencia e regra de fechamento do mes.
- Permitir encerrar vigencia ativa de vendedor.
- Expor rota e navegacao no menu de sustentacao do admin.

## Fora De Escopo

- Criar usuarios novos no Supabase Auth.
- Permitir gerente editar vigencia sem regra explicita de autorizacao.
- Backfill historico externo via arquivo.
- Reprocessamento de base.

## Criterios De Aceite

- [x] Admin acessa a tela por `/configuracoes/operacional`.
- [x] Admin seleciona uma loja e carrega configuracoes canonicas.
- [x] Admin salva destinatarios do matinal, semanal, mensal e referencia WhatsApp.
- [x] Admin salva benchmark 20/60/33 com override por loja.
- [x] Admin salva meta mensal, modo de meta individual e regras de VENDA LOJA.
- [x] Admin vincula vendedor existente a vigencia operacional.
- [x] Admin encerra vigencia ativa.
- [x] Gates locais passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Validacao

- Escritas admin em `stores`, `store_delivery_rules`, `store_benchmarks`, `store_meta_rules` e `store_sellers` validadas no Supabase live em transacao com rollback.
- Queries do hook validadas via Supabase JS, incluindo join `store_sellers -> users`.
- Nenhum dado persistente foi criado na validacao de escrita.

## Gates

- `npm run lint`: passou.
- `npm run typecheck`: passou.
- `npm test`: passou, 22 testes.
- `npm run build`: passou.
- `git diff --check`: passou.

## File List

- `docs/stories/story-operational-settings-01a/spec/spec.md`
- `docs/stories/story-operational-settings-01a/plan/implementation.yaml`
- `src/hooks/useOperationalSettings.ts`
- `src/pages/OperationalSettings.tsx`
- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/types/database.ts`
