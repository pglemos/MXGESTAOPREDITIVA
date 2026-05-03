# Story OPS-20260503 - Template Feedback Semanal

## Status

Ready for Review

## Contexto

Os PDFs `/Users/pedroguilherme/Downloads/SEMANAL.pdf` e `/Users/pedroguilherme/Downloads/Feedback Semanal - ESPINDOLA AUTOMOVEIS - 16_02 a 22_02.pdf` foram usados como referencia operacional inicial. A revisao final deve seguir a identidade publica da MX em `https://mxperformance.vercel.app`: fundo escuro, verde MX, paineis tipo console e marca `MX Performance`.

## Acceptance Criteria

- [x] Subject segue a marca MX: `MX Performance | Feedback semanal <LOJA>`.
- [x] HTML do e-mail usa layout compativel com Gmail por tabelas, com fundo `#070A08`, paineis `#0A100C/#0B100C`, bordas `#243227` e destaque `#1FCB6E`.
- [x] Mensagem por vendedor inclui saudacao, periodo, numeros da semana, analise de oportunidade, comparativo com equipe, diagnostico, acao e criterio.
- [x] Workbook anexo usa nome `Feedback Semanal - <LOJA> - <DD_MM> a <DD_MM>.xlsx`.
- [x] Workbook possui resumo geral e abas individuais com o layout operacional de resumo do vendedor.
- [x] Workbook usa cores alinhadas ao padrao MX no cabecalho e secoes.
- [x] Template legado local fica alinhado ao novo visual.
- [x] Previa visual local MX gerada e revisada.
- [x] Gates locais passam apos redesign MX.
- [x] Deploy da Edge Function `feedback-semanal` publicado apos redesign MX.

## Dev Agent Record

### Debug Log

- PDFs renderizados via Quick Look porque `ghostscript`, `pdftoppm` e `pdftotext` nao estavam disponiveis.
- Template atual localizado em `supabase/functions/feedback-semanal/index.ts`.
- `SEMANAL.pdf` identificado como referencia do e-mail Gmail com mensagens prontas.
- `Feedback Semanal - ESPINDOLA AUTOMOVEIS - 16_02 a 22_02.pdf` identificado como referencia do anexo operacional por vendedor.
- Previa visual local gerada em `output/email-semanal-template/weekly-feedback-preview.png`.
- Gates executados: `npm run typecheck`, `npm run lint`, `npm test`.
- Edge Function `feedback-semanal` publicada no Supabase live.
- Redesign MX aplicado usando referencia visual de `https://mxperformance.vercel.app` e screenshot em `output/mx-brand-reference-home.png`.
- Previa MX gerada em `output/email-mx-redesign/weekly-feedback-mx-preview.png`.
- Gates do redesign MX: `npm run typecheck`, `npm run lint`, `npm test` com 196 testes passando.
- Edge Function `feedback-semanal` publicada novamente no Supabase live apos redesign MX.

### File List

- `docs/stories/story-OPS-20260503-feedback-semanal-template.md`
- `supabase/functions/feedback-semanal/index.ts`
- `src/lib/automation/email/templates/weekly-feedback.ts`
- `output/mx-brand-reference-home.png`
- `output/email-mx-redesign/weekly-feedback-mx-preview.html`
- `output/email-mx-redesign/weekly-feedback-mx-preview.png`
- `output/email-semanal-template/weekly-feedback-preview.html`
- `output/email-semanal-template/weekly-feedback-preview.png`
