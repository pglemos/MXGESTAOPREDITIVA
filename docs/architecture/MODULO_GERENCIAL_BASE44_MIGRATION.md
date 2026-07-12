# Módulo Gerencial — arquitetura de migração Base44 → MX

## Decisão

O Base44 é referência de composição e interação. O MX permanece fonte de verdade para React 19, TypeScript, shell, autenticação, capabilities, Supabase, RLS e tokens. O módulo usa uma única árvore `/gerente/*` dentro de `Layout`/`SellerLayoutShell`; não há segundo router, sidebar ou AuthProvider.

## Rotas canônicas

`/home`, `/gerente/fechamento-diario`, `/gerente/rotina-equipe`, `/gerente/minha-equipe`, `/gerente/meta-loja`, `/gerente/mentor`, `/gerente/feedbacks-pdis`, `/gerente/ranking` e `/gerente/universidade-mx`.

## Boundaries

- Início reutiliza `dashboard-loja` e deve remover qualquer fallback numérico inventado.
- Fechamento reutiliza check-in, regularização e auditoria existentes; gerente não escreve operação do vendedor.
- Rotina deriva de `central_execucao_*`, plano de ataque e CRM, nunca do fechamento.
- Equipe, metas, feedback/PDI, ranking e Universidade reutilizam serviços canônicos atuais.
- Toda query é escopada por membership/RLS; identificadores do cliente não constituem autorização.
- Blocos assíncronos distinguem loading, vazio, erro, sem vínculo e sem permissão.

## Restrições aceitas

Não importar SDK, entidades, autenticação, dados demo, `localStorage` empresarial ou CSS do Base44. Não substituir implementações MX superiores.
