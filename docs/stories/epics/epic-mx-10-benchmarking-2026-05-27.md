# EPIC-MX-10 — Benchmarking

**Data:** 2026-05-27
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
**Wave:** 3 — Fundação consultiva

---

## 1. Goal

Implementar benchmarking consultivo para comparar lojas por região, porte, segmento e melhores lojas, contextualizando margem, giro, estoque, conversão, custo e score.

---

## 2. Background

O PRD §4.9 define que o benchmarking deve comparar a loja com recortes equivalentes e melhores práticas, evitando leitura isolada de indicadores.

---

## 3. Acceptance Criteria

| AC | Critério |
|---|---|
| **AC-01** | Benchmarking suporta recortes por região, porte, segmento e melhores lojas |
| **AC-02** | Comparações incluem margem, giro, estoque, conversão, custo e score |
| **AC-03** | Dados de benchmark são versionados ou imutáveis por período |
| **AC-04** | UI diferencia meta interna, média do grupo e melhores lojas |
| **AC-05** | Estados sem dados indicam benchmark pendente |
| **AC-06** | Regras evitam exposição indevida de dados sensíveis de outras lojas |
| **AC-07** | Benchmark alimenta alertas, Central MX e Dashboard Executivo |

---

## 4. Stories Planejadas

| Story | Título | Resumo |
|---|---|---|
| **10.1** | Schema de benchmarking | Tabelas e recortes de comparação |
| **10.2** | Cálculo de peer groups | Definir grupo por região/porte/segmento |
| **10.3** | Indicadores comparáveis | Margem, giro, estoque, conversão, custo e score |
| **10.4** | API/RPC de benchmark | Consulta segura para UI |
| **10.5** | Cards de comparação | Visual simples para Central MX e Dashboard |
| **10.6** | Segurança e anonimização | Evitar vazamento entre lojas |

---

## 5. Dependencies

**Bloqueado por:**
- EPIC-MX-07 — Motor MX Score
- EPIC-MX-02 — Perfis & Permissões

**Bloqueia:**
- EPIC-MX-06 — Central MX
- EPIC-MX-12 — Dashboard Executivo
- EPIC-MX-14 — Consultor IA

---

## 6. Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| Comparações por região/porte/segmento/melhores lojas | PRD §4.9 FR-BENCH ← `.docx` §291–§303 |
| Indicadores comparados | PRD §4.9 FR-BENCH |
| Score como comparação | PRD §4.7 FR-SCORE |

---

## 7. Next Step

@sm `*draft` da story 10.1 (Schema de benchmarking).
