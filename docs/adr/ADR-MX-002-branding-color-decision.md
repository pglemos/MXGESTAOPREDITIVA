# ADR-MX-002 — Branding: Cor Primária (Verde vs Azul)

**Data:** 2026-05-27
**Status:** ✅ **Decided — Opção B (manter verde, atualizar PRD)** em 2026-05-27 pelo stakeholder
**Decisor:** Stakeholder humano (Daniel / José / Mariane / Pedro) + @ux-design-expert
**Stakeholders:** @pm, @dev, @aiox-master
**Origem:** Story MX-1.1 (Tokens de cor) — auditoria identificou conflito

---

## 1. Contexto

**Documento fonte (`.docx MX PERFORMANCE - DESENVOLVIMENTO`, §357–§366):**

> *Referência aprovada: fundo branco, cards arredondados, design clean, **azul como cor principal**, visual moderno SaaS, alta legibilidade, poucos gráficos, foco em cards e status.*

Este requisito foi codificado como **NFR-V4** no PRD-mestre §5.2.

**Código atual (`src/index.css`, 1570 linhas):**

```css
/* Palette Core — MX Brand (Green Identity) */
--color-mx-black: #0A0A0B;
--color-pure-black: #000000;
--color-brand-primary: #22C55E;   /* VERDE */
--color-brand-secondary: #0D3B2E; /* VERDE-ESCURO */
```

O Design System Tailwind 4 atual está **maduro**, com:
- ~50 tokens de cor (brand, status, chart, surface, border, text)
- Marca identificada como "MX Brand — Green Identity" em comentário CSS
- Consumido por todos os componentes em produção (`MXScoreCard`, `KpisSection`, `OwnerExecutiveCockpit`, etc.)

## 2. Conflito

| Dimensão | `.docx` / PRD | Código atual |
|---|---|---|
| Cor primária | Azul | Verde (`#22C55E`) |
| Cor secundária | (não especificada) | Verde-escuro (`#0D3B2E`) |
| Maturidade | Documento de visão | DS implementado + em produção |
| Custo de mudança | — | Alto (rebrand visual) |

## 3. Opções

### Opção A — Adotar azul (rebrand)

**Pros:**
- Cumpre PRD/`.docx` literal (NFR-V4)
- Identidade SaaS moderna clássica (Slack, Linear, Notion)

**Contras:**
- Requer rebrand visual completo (logo, marketing, mockups existentes)
- Inicia EPIC-MX-01 com escopo maior (não só tokens — toda a UI)
- Conflita com componentes já aprovados em reuniões anteriores (ver `docs/prd/modulo-visao-dono-cockpit-executivo-2026-05-26.md` — verificar mockups)
- Acumula ~50 tokens existentes para depreciar/renomear

**Estimate:** L → XL (story 1.1 deixa de ser S e vira M; mais 1 story de rebrand visual)

### Opção B — Manter verde (atualizar PRD)

**Pros:**
- Zero retrabalho de implementação atual
- Marca verde já estabelecida visualmente (componentes em uso)
- `.docx` é resumo executivo; pode ter usado "azul" como referência genérica SaaS

**Contras:**
- Viola NFR-V4 literal do PRD
- Requer atualização do PRD-mestre + reconciliação de docs
- Pode contradizer expectativa de stakeholders (Daniel, José)

**Estimate:** S (apenas docs)

### Opção C — Híbrido: verde marca + azul secundário/destaque

**Pros:**
- Preserva identidade verde estabelecida
- Introduz azul para CTAs, links, destaques (alinhado parcialmente com `.docx`)
- Permite paleta dual coerente

**Contras:**
- Solução de compromisso pode não satisfazer ninguém
- Aumenta complexidade do DS (2 brand colors)

**Estimate:** M

## 4. Recomendação técnica (não-decisão)

Como **agente arquitetural**, sem autoridade sobre branding, esta ADR **escala a decisão**. Posição técnica:

- **Opção B é a mais barata e baixa-risco.** O verde está consolidado. Atualizar PRD para refletir realidade é honesto.
- **Opção A é defensável** se houver alinhamento explícito com stakeholders de produto.
- **Opção C é compromisso** — só faz sentido se houver razão estratégica para introduzir azul.

## 5. Decisão tomada — Opção B (2026-05-27)

**Stakeholder aprovou: manter marca verde existente e atualizar PRD para refletir realidade.**

### Consequências aplicadas nesta mesma data:

- ✅ PRD §5.2 NFR-V4 atualizado: "azul" → "verde (`#22C55E`)" com referência a este ADR
- ✅ Story MX-1.1 **desbloqueada** com escopo redefinido: estender DS verde existente (não rebrand)
- ✅ Componentes em produção (`MXScoreCard`, `KpisSection`, etc.) preservados — zero rebrand
- ℹ️ `.docx` MX PERFORMANCE - DESENVOLVIMENTO permanece com "azul como cor principal" (§362) — divergência documentada aqui é canônica; uma futura revisão do `.docx` pode realinhar texto
- ℹ️ Aplicar marca verde em quaisquer mockups novos / comunicação de produto

## 6. Bloqueios resolvidos

| Item | Antes | Depois |
|---|---|---|
| Story MX-1.1 | 🛑 Blocked | ✅ Unblocked — escopo aditivo (tokens score.* + alert.consultive faltantes) |
| EPIC-MX-01 (Design System) | Pausado | Pode prosseguir |
| Stories 1.3–1.7 (componentes) | Aguardando | Pode prosseguir após MX-1.1 |

---

**Rastreabilidade Article IV:**
- NFR-V4 azul → PRD §5.2 ← `.docx` §362
- Marca verde atual → `src/index.css` linha 11–12 + identificação "MX Brand — Green Identity"
- Componentes consumidores → `MXScoreCard.tsx`, `KpisSection.tsx`, etc.
