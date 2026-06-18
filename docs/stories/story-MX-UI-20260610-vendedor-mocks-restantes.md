# Story MX-UI-20260610 - Telas restantes do vendedor alinhadas aos mocks

## Status

Ready for Review

## Contexto

O usuario anexou novos mocks de vendedor em 2026-06-10 e pediu alinhamento das telas restantes sem alterar o design da sidebar.

## Escopo

- Dashboard / Meu Dia
- Funil de Vendas
- Fechamento Diario
- PDI
- Feedback
- Meu Perfil
- Validacao de Central de Execucao existente

## Fora de Escopo

- Alterar `src/components/Layout.tsx`
- Redesenhar ou reorganizar sidebar
- Criar novas migrations ou alterar regras de acesso

## Checklist

- [x] Manter sidebar/layout global intactos.
- [x] Alinhar Dashboard / Meu Dia ao mock com cards, agenda, ranking, evolucao e preview mobile.
- [x] Alinhar Funil de Vendas ao mock de meta, comissao, ritmo e plano por canal.
- [x] Alinhar Fechamento Diario ao mock com contadores, cadastro opcional, resumo e disciplina.
- [x] Alinhar PDI ao mock com conquistas, competencias e plano de acao.
- [x] Alinhar Feedback ao mock com indicadores, pendencias e historico.
- [x] Alinhar Meu Perfil ao mock com perfil, metas, rotina, objetivos, formacao, historico, remuneracao e carreira.
- [x] Ajustar Meu Perfil para a hierarquia final aprovada: identidade + resumo, rotina + objetivos, mix + produtos, remuneracao, formacao + maturidade, historico + curriculo, oportunidades bloqueadas por vinculo e rodape de seguranca.
- [x] Validar render das rotas de vendedor com bypass local.

## Evidencias

- `npm run lint`
- `npm run build`
- `npm test`
- Smoke Playwright local em `/home`, `/meu-funil`, `/lancamento-diario`, `/pdi`, `/devolutivas`, `/perfil` e `/central-execucao`.
- `npm run typecheck` - 2026-06-17 pass.
- `bun test src/features/crm/MeuPerfilVendedor.container.test.tsx` - 2026-06-17, 2 pass.
- `npm run lint` - 2026-06-17 pass.
- `npm test` - 2026-06-17 pass.
- `npm run build` - 2026-06-17 pass.
- Playwright smoke em `http://127.0.0.1:3003/perfil` com dev auth bypass - 2026-06-17 pass para render, Historico de alteracoes, rotina, PDI, rodape, ausencia de Minhas Metas e ausencia de Ajuste Tecnico.

## File List

- `src/features/vendedor-home/VendedorHome.container.tsx`
- `src/features/crm/FunilVendedor.container.tsx`
- `src/features/checkin/Checkin.container.tsx`
- `src/pages/VendedorPDI.tsx`
- `src/pages/VendedorFeedback.tsx`
- `src/features/crm/MeuPerfilVendedor.container.tsx`
- `src/features/crm/MeuPerfilVendedor.container.test.tsx`
- `docs/stories/story-MX-UI-20260610-vendedor-mocks-restantes.md`
