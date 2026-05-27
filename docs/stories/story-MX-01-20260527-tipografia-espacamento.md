# Story MX-1.2 - Tokens de Tipografia e Espaçamento

## Status

Draft (Wave-2)

## Story

**As a** desenvolvedor de UI do MX Performance,
**I want** tokens canônicos de tipografia (família, escala, pesos) e espaçamento publicados como contrato único,
**so that** componentes consumam consistência visual conforme NFR-V3 (design clean) e NFR-V6 (alta legibilidade).

## Executor Assignment

executor: "dev"
quality_gate: "dev"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build"]

## Epic Reference

- **Épico:** EPIC-MX-01 — Fundação Visual & Design System
- **PRD:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md` §5.2 NFR-V3, NFR-V6
- **Aguarda:** ADR-MX-002 não bloqueia (esta story é sobre tipografia/espaçamento, não cor)

## Acceptance Criteria

- [ ] Tokens de família declarados (atual: Plus Jakarta Sans + JetBrains Mono — já presentes em `src/index.css`)
- [ ] Escala tipográfica codificada (xs, sm, base, md, lg, xl, 2xl, 3xl) com line-height e letter-spacing
- [ ] Tokens de peso (regular 400, medium 500, semibold 600, bold 700, black 800)
- [ ] Tokens de espaçamento numéricos (0, 1=4px, 2=8px, 3=12px, 4=16px, ... seguindo escala 4px)
- [ ] Tokens de raio (radius: sm=4px, md=8px, lg=12px, xl=16px, 2xl=24px, full=9999px — cards arredondados NFR-V2)
- [ ] Tokens de elevation (shadow-sm, shadow-md, shadow-lg consistentes com tema claro)
- [ ] Auditoria de uso atual: identificar quais valores hardcoded em `src/features/*` substituir
- [ ] Zero regressão de lint/typecheck/build

## Tasks / Subtasks

- [ ] Inventariar tokens existentes em `src/index.css` (linha por linha após l.20)
- [ ] Identificar gaps e duplicações
- [ ] Consolidar em namespace coerente
- [ ] Documentar em comentário CSS + (opcional) espelho TS
- [ ] Migrar 1-2 componentes piloto para usar novos tokens

## Dev Notes

`src/index.css` já tem ~50 tokens — esta story **consolida** e **documenta**, não recria. Posicionada após ADR-MX-002 para alinhar com decisão final de tipografia/cor.

## Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| Design clean | PRD §5.2 NFR-V3 ← `.docx` §361 |
| Alta legibilidade | PRD §5.2 NFR-V6 ← `.docx` §364 |
| Cards arredondados | PRD §5.2 NFR-V2 ← `.docx` §360 |

## Estimate

M (medium) — inventário + consolidação + 1-2 migrações piloto.
