# Story OPS-20260503 - Template Email Relatorio Matinal

## Status

Ready for Review

## Contexto

O PDF `/Users/pedroguilherme/Downloads/EMAIL MODELO QUE CHEGA.pdf` foi usado como referencia inicial do relatorio matinal no Gmail. A revisao final deve seguir a identidade publica da MX em `https://mxperformance.vercel.app`: fundo escuro, verde MX, paineis tipo console e marca `MX Performance`.

## Acceptance Criteria

- [x] Subject do e-mail segue a marca MX: `MX Performance | Matinal <LOJA> | Tendencia <projecao> carros`.
- [x] HTML do e-mail usa layout compativel com Gmail por tabelas, com fundo `#070A08`, paineis `#0A100C/#0B100C`, bordas `#243227` e destaque `#1FCB6E`.
- [x] Cada vendedor exibe `LEADS`, `AGD (HOJE)`, `VND (ONTEM)` e `TOTAL (MES)`.
- [x] `VND (ONTEM)` usa apenas o lancamento da data de referencia, sem confundir com o acumulado mensal.
- [x] Anexo do matinal usa Excel XML valido com nome `Relatorio_<LOJA>.xls` e MIME `application/vnd.ms-excel`.
- [x] Workbook possui abas `Painel Visual` e `Lista de Vendas Detalhada`.
- [x] Template legado local fica alinhado ao novo visual para evitar divergencia.
- [x] Gates locais passam apos redesign MX.
- [x] Deploy da Edge Function `relatorio-matinal` publicado apos redesign MX.
- [ ] Disparo live real confirmado pelo usuario e validado, sem disparo nao autorizado.

## Dev Agent Record

### Debug Log

- PDF de referencia renderizado via Quick Look porque `pdftoppm`/`pdftotext` nao estavam instalados.
- Template atual localizado em `supabase/functions/relatorio-matinal/index.ts`.
- Previa visual local gerada em `output/email-matinal-template/matinal-template-preview.png`.
- Edge Function `relatorio-matinal` publicada no Supabase live.
- Gates: `npm run typecheck`, `npm run lint`, `npm test`.
- Teste dry-run remoto exige sessao de admin ou secret cron; chamada com service role retorna `Invalid session` por contrato de seguranca.
- Proxima etapa bloqueada por confirmacao: disparo live real envia e-mail para destinatarios configurados da loja.
- Redesign MX aplicado usando referencia visual de `https://mxperformance.vercel.app` e screenshot em `output/mx-brand-reference-home.png`.
- Previa MX gerada em `output/email-mx-redesign/matinal-mx-preview.png`.
- Gates do redesign MX: `npm run typecheck`, `npm run lint`, `npm test` com 196 testes passando.
- Edge Function `relatorio-matinal` publicada novamente no Supabase live apos redesign MX.
- Anexo do matinal alinhado ao padrao MX: cabecalhos escuros, destaque verde, dados de loja/data/meta/projecao/atingimento e MIME Excel correto.

### File List

- `docs/stories/story-OPS-20260503-matinal-email-template.md`
- `supabase/functions/relatorio-matinal/index.ts`
- `src/lib/automation/email/templates/matinal.ts`
- `output/mx-brand-reference-home.png`
- `output/email-mx-redesign/matinal-mx-preview.html`
- `output/email-mx-redesign/matinal-mx-preview.png`
- `output/email-matinal-template/matinal-template-preview.html`
- `output/email-matinal-template/matinal-template-preview.png`
