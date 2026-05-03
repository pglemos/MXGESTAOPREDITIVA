# Story OPS-20260503 - Google Drive central por loja

## Status

Ready for Review

## Contexto

Cada cliente/loja da consultoria precisa ter uma pasta operacional no Google Drive central da conta `gestao@mxconsultoria.com.br`. A pasta deve aparecer no detalhe do cliente em `/consultoria/clientes/:clientSlug`, permitindo que a equipe interna MX guarde arquivos diversos relacionados à operação daquela loja.

O sistema já possui OAuth Google central para Calendar com tokens criptografados em Edge Functions. Esta story estende essa base para Drive sem expor tokens ao frontend.

## Escopo

- Criar uma aba **Arquivos** no detalhe do cliente da consultoria.
- Criar pasta raiz MX no Drive central e subpasta automática por cliente/loja.
- Permitir listar, enviar, abrir e remover arquivos pelo MX.
- Restringir uso da funcionalidade a perfis internos MX.
- Registrar metadados e auditoria mínima no Supabase.

## Fora de Escopo

- Compartilhar pastas automaticamente com usuários externos da loja.
- Usar service account.
- Sincronizar arquivos criados manualmente fora da pasta criada pelo app além da listagem direta do Drive.
- Indexar conteúdo dos arquivos ou aplicar OCR.

## Acceptance Criteria

- [x] OAuth central solicita escopo Drive apenas para conexão central.
- [x] Usuário interno MX consegue criar/recuperar a pasta do cliente.
- [x] Usuário interno MX consegue listar arquivos da pasta.
- [x] Usuário interno MX consegue enviar arquivos de até 25 MB.
- [x] Usuário interno MX consegue abrir arquivos no Google Drive.
- [x] Usuário interno MX consegue remover arquivo pelo app.
- [x] Usuário não interno recebe bloqueio de acesso.
- [x] Token Google nunca é enviado ao navegador.
- [x] UI degrada com mensagem clara quando a conta central precisa ser reconectada com Drive.
- [x] Gates locais passam ou bloqueios ficam registrados no Dev Agent Record.

## Implementation Tasks

1. [x] Criar migration de tabelas `pastas_drive_consultoria` e `arquivos_drive_consultoria`.
2. [x] Criar RLS interno MX para tabelas de Drive.
3. [x] Estender helper Google central para token com escopo Drive.
4. [x] Atualizar OAuth central para solicitar `drive.file`.
5. [x] Criar Edge Function `google-drive-files`.
6. [x] Criar hook `useConsultingDriveFiles`.
7. [x] Criar componente `ConsultingDriveFilesView`.
8. [x] Adicionar aba `files` em `ConsultoriaClienteDetalhe`.
9. [x] Rodar gates e atualizar checklist/File List.

## Dev Agent Record

### Debug Log

- Implementação iniciada a partir do plano aprovado para Google Drive central por loja.
- Criada migration `20260503100000_google_drive_lojas.sql` com tabelas, índices, triggers e RLS interno MX.
- `google-oauth-handler` passou a solicitar `drive.file` somente na conexão central.
- Helper Google compartilhado agora diferencia token central genérico, Calendar e Drive.
- Edge Function `google-drive-files` criada com ações `ensure-folder`, `list`, `upload` e `delete`.
- Upload para Google Drive usa multipart `multipart/related` e limite de 25 MB por arquivo.
- UI adicionada na aba `Arquivos` do detalhe do cliente.
- Gates executados com sucesso: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- `npx supabase db lint --local --fail-on error` não rodou porque o Postgres local em `127.0.0.1:54322` recusou conexão.
- `deno check` não rodou porque `deno` não está instalado nesta máquina.
- Validação live com a conta `gestao@mxconsultoria.com.br` não foi executada neste turno porque depende da migration aplicada no Supabase e reconexão OAuth central com o novo escopo Drive.
- Após push/deploy em produção, a migration remota continuou bloqueada por ausência de `SUPABASE_DB_PASSWORD`. A Edge Function foi endurecida para operar com Drive mesmo antes das tabelas novas existirem, usando busca/criação determinística da pasta e pulando apenas o cache/auditoria até a migration ser aplicada.
- Smoke de navegador em produção identificou mensagem genérica para erro 409 da Edge Function. O hook passou a chamar `google-drive-files` via `fetch` autenticado para preservar o payload e exibir a mensagem real de reconexão do Drive.

### File List

- `.env.example`
- `docs/stories/story-OPS-20260503-google-drive-lojas.md`
- `supabase/migrations/20260503100000_google_drive_lojas.sql`
- `supabase/functions/_shared/google.ts`
- `supabase/functions/google-oauth-handler/index.ts`
- `supabase/functions/google-drive-files/index.ts`
- `src/hooks/useConsultingDriveFiles.ts`
- `src/features/consultoria/components/ConsultingDriveFilesView.tsx`
- `src/pages/ConsultoriaClienteDetalhe.tsx`
