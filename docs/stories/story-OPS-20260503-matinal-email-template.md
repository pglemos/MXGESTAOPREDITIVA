# Story OPS-20260503 - Template Email Relatorio Matinal

## Status

Ready for Live Email Confirmation

## Contexto

O PDF `/Users/pedroguilherme/Downloads/EMAIL MODELO QUE CHEGA.pdf` foi usado como referencia visual do relatorio matinal esperado no Gmail. O template live atual do `relatorio-matinal` divergia do modelo em assunto, estrutura dos cards por vendedor, resumo executivo, nome do anexo e separacao entre venda de ontem e total do mes.

## Acceptance Criteria

- [x] Subject do e-mail segue o modelo: `Matinal: <LOJA> - Tendencia: <projecao> carros`.
- [x] HTML do e-mail usa layout compativel com Gmail por tabelas, com header azul, bloco de ritmo, cards por vendedor, resumo executivo escuro, nota do anexo e botao WhatsApp verde.
- [x] Cada vendedor exibe `LEADS`, `AGD (HOJE)`, `VND (ONTEM)` e `TOTAL (MES)`.
- [x] `VND (ONTEM)` usa apenas o lancamento da data de referencia, sem confundir com o acumulado mensal.
- [x] Anexo do matinal passa a usar nome `Relatorio_<LOJA>.xlsx`.
- [x] Workbook possui abas `Painel Visual` e `Lista de Vendas Detalhada`.
- [x] Template legado local fica alinhado ao novo visual para evitar divergencia.
- [x] Gates locais passam.
- [ ] Disparo live real confirmado pelo usuario e validado.

## Dev Agent Record

### Debug Log

- PDF de referencia renderizado via Quick Look porque `pdftoppm`/`pdftotext` nao estavam instalados.
- Template atual localizado em `supabase/functions/relatorio-matinal/index.ts`.
- Previa visual local gerada em `output/email-matinal-template/matinal-template-preview.png`.
- Edge Function `relatorio-matinal` publicada no Supabase live.
- Gates: `npm run typecheck`, `npm run lint`, `npm test`.
- Teste dry-run remoto exige sessao de admin ou secret cron; chamada com service role retorna `Invalid session` por contrato de seguranca.
- Proxima etapa bloqueada por confirmacao: disparo live real envia e-mail para destinatarios configurados da loja.

### File List

- `docs/stories/story-OPS-20260503-matinal-email-template.md`
- `supabase/functions/relatorio-matinal/index.ts`
- `src/lib/automation/email/templates/matinal.ts`
- `output/email-matinal-template/matinal-template-preview.html`
- `output/email-matinal-template/matinal-template-preview.png`
