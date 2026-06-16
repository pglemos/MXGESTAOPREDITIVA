# EV-14 — Design System / Tipografia

**Objetivo:** entregar um layout "bonitinho" para clientes, com tipografia mais leve. **Mariane valida todo layout.**

**Fase:** Julho (transversal) · **Status:** 🆕 Novo.

---

## EV-14.1 — Aliviar a tipografia (menos `font-black`)
**Status:** 🆕 Novo

**Como** Daniel/Mariane, **quero** uma tipografia menos carregada **para** o layout ficar leve e agradável.

**Critérios de aceitação:**
1. Reduzir o uso de negrito pesado (`font-black`) → pesos médios ("mais Arial", menos "Black").
2. Aplicar de forma consistente nas telas do vendedor (títulos, cards, labels).
3. Manter a hierarquia da spec (Título 32/700, Subtítulo 20/600, Card 16/600, Texto 14/400) sem o excesso de uppercase + black.
4. **Mariane valida** cada tela ajustada.

**Notas técnicas:** revisar `Typography` e classes utilitárias; possível ajuste do design token de peso padrão.

---

## EV-14.2 — Aproximar telas do mock do Daniel + nomenclaturas
**Status:** 🔧 Parcial

**Como** produto, **quero** as telas próximas dos mocks com as nomenclaturas certas **para** alinhar com o que foi apresentado.

**Critérios de aceitação:**
1. Telas seguem o layout sugerido pelo Daniel (Fechamento, Funil, etc.).
2. Nomenclaturas batem com as dos mocks (ex.: "Central de Execução", não "Agenda").
3. Validação de layout pela Mariane no fluxo print+áudio.

---

## EV-Op — Operação de Rollout (processo, não código)

- Reunião fixa **semanal (terça)** de alinhamento; atualização diária da equipe.
- Piloto em **grupo pequeno** (José + mentoria) → expandir ~20-30 lojas / ~100 vendedores.
- **Canal de erros:** print da tela + áudio → Mariane valida com Pedro.
- Possível **dia presencial** de teste (demonstração + "o que você acha que falta?").
- Daniel marca **evento ao vivo** para apresentar o produto aos interessados.
