# Story OPS-20260430 - Ajuste visual da secao de consultoria MX Performance

## Status
Ready for Review

## Contexto
O site MX Performance precisava trocar a foto dos tres socios na secao de consultoria e usar a imagem somente como marca d'agua no fundo.

## Acceptance Criteria
- [x] Substituir a imagem `public/landing/team-mx.png` pelo arquivo anexado pelo usuario.
- [x] Aplicar a mesma imagem como marca d'agua de fundo na secao de consultoria.
- [x] Remover a imagem repetida em primeiro plano e as legendas de socios.
- [x] Reorganizar o layout da secao para destacar texto e pilares operacionais sem quebrar responsividade.
- [x] Preservar a identidade visual escura/verde da landing.

## Tasks
- [x] Copiar o asset anexado para `public/landing/team-mx.png`.
- [x] Atualizar CSS e markup da secao `consultoria`.
- [x] Remover o card frontal de imagem da secao `consultoria`.
- [x] Rodar quality gates disponiveis.

## File List
- `public/landing/team-mx.png`
- `src/pages/MXPerformanceLanding.tsx`
- `docs/stories/story-OPS-20260430-consultoria-landing-image.md`
