# Story OPS-20260503 - Template Feedback Semanal

## Status

Ready for Review

## Contexto

Os PDFs `/Users/pedroguilherme/Downloads/SEMANAL.pdf` e `/Users/pedroguilherme/Downloads/Feedback Semanal - ESPINDOLA AUTOMOVEIS - 16_02 a 22_02.pdf` foram usados como referencia para corrigir o feedback semanal. O primeiro representa o e-mail esperado no Gmail, com sugestoes de mensagem por vendedor. O segundo representa o anexo/relatorio operacional por vendedor.

## Acceptance Criteria

- [x] Subject segue o modelo `Feedback Semanal - <LOJA>`.
- [x] HTML do e-mail usa layout compativel com Gmail, com titulo, periodo, botao verde e blocos de mensagem por vendedor.
- [x] Mensagem por vendedor inclui saudacao, periodo, numeros da semana, analise de oportunidade, comparativo com equipe, diagnostico, acao e criterio.
- [x] Workbook anexo usa nome `Feedback Semanal - <LOJA> - <DD_MM> a <DD_MM>.xlsx`.
- [x] Workbook possui resumo geral e abas individuais com o layout operacional de resumo do vendedor.
- [x] Template legado local fica alinhado ao novo visual.
- [x] Previa visual local gerada e revisada.
- [x] Gates locais passam.

## Dev Agent Record

### Debug Log

- PDFs renderizados via Quick Look porque `ghostscript`, `pdftoppm` e `pdftotext` nao estavam disponiveis.
- Template atual localizado em `supabase/functions/feedback-semanal/index.ts`.
- `SEMANAL.pdf` identificado como referencia do e-mail Gmail com mensagens prontas.
- `Feedback Semanal - ESPINDOLA AUTOMOVEIS - 16_02 a 22_02.pdf` identificado como referencia do anexo operacional por vendedor.
- Previa visual local gerada em `output/email-semanal-template/weekly-feedback-preview.png`.
- Gates executados: `npm run typecheck`, `npm run lint`, `npm test`.
- Edge Function `feedback-semanal` publicada no Supabase live.

### File List

- `docs/stories/story-OPS-20260503-feedback-semanal-template.md`
- `supabase/functions/feedback-semanal/index.ts`
- `src/lib/automation/email/templates/weekly-feedback.ts`
- `output/email-semanal-template/weekly-feedback-preview.html`
- `output/email-semanal-template/weekly-feedback-preview.png`
