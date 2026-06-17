# EV-10 — Ranking

**Objetivo:** ranquear vendedores pelo Score, criando competição saudável e histórico.

**Fase:** Julho · **Status:** 🔧 Parcial (tela de ranking existe; Daniel ainda vai desenhar o mock definitivo).

**Arquivos atuais:** `src/pages/Ranking.tsx`, `useRanking`.

---

## EV-10.1 — Ranking por Score
**Status:** 🔧 Parcial · 📐 aguarda mock do Daniel

**Como** vendedor, **quero** ver minha posição no ranking da loja **para** me motivar.

**Critérios de aceitação:**
1. Ranking por Score consolidado (EV-9), com destaque da própria posição.
2. Comparação justa (PDI fora; autônomo vs loja tratados conforme EV-12).
3. Layout final entra após mock aprovado pelo Daniel; até lá, a tela mantém ranking funcional, claro e sem dado fake.

**Notas técnicas:** `useRanking` deve consumir o score recomposto de EV-9 e aplicar escopo de comparação por loja/persona; layout final fica bloqueado por artefato de design.

**Dependências:** EV-9 (score recomposto).
