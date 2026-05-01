# Historia OPS-20260430 — Logo MX correta

## Contexto

Remover a logo antiga em SVG/base64 do sistema e padronizar a marca visual com o arquivo oficial `logo-mx.png` fornecido pelo usuario.

## Checklist

- [x] Substituir imports da logo antiga por `src/assets/mx-logo.png`.
- [x] Atualizar assets publicos usados por favicon, landing page e relatorios.
- [x] Remover arquivos SVG antigos da logo MX.
- [x] Validar que nao existe mais logo antiga em SVG/base64 no codigo funcional.
- [x] Validar banco live por REST/Admin API em colunas de texto.
- [x] Validar buckets live de Storage para objetos SVG antigos da marca.
- [x] Validar build e testes principais.
- [x] Fazer commit na `main`.

## Criterios de aceite

- O login, layout autenticado, pagina OAuth, landing e relatorios usam a logo PNG oficial.
- A imagem antiga em SVG/base64 nao aparece no codigo funcional nem nos assets ativos.
- O favicon aponta para `public/mx-logo.png`.
- Banco live nao contem a string base64 da logo antiga em dados funcionais verificados.
- Storage live nao contem objetos antigos de logo/favicons SVG.

## Evidencias de validacao

- Codigo/assets: varredura sem ocorrencias para SVG/base64 antigo em `src`, `public`, `index.html`, `supabase/functions`, `scripts` e `docs`.
- Banco live: 90 tabelas e 665 colunas de texto verificadas via PostgREST com service role, sem ocorrencias.
- Storage live: 4 buckets verificados, nenhum objeto SVG antigo encontrado.

## Rollback

Reverter o commit desta historia caso a logo oficial quebre renderizacao, build ou exibicao em producao.

## File list

- `src/assets/mx-logo.png`
- `public/mx-logo.png`
- `public/landing/logo-mx.png`
- `src/pages/Login.tsx`
- `src/components/Layout.tsx`
- `src/pages/OAuthHome.tsx`
- Assets SVG antigos da marca removidos
- `index.html`
- `docs/design-system/02-pattern-library.md`
- `docs/stories/historia-OPS-20260430-logo-mx-correta.md`
