# 📊 Relatório Executivo de Débito Técnico

**Projeto:** MX Gestão Preditiva
**Data:** 13 de Abril de 2026
**Versão:** 1.0
**Autor:** @analyst (Atlas)

---

## 🎯 Executive Summary

O projeto MX Performance passou por uma profunda refatoração estrutural (Atomic Design) e migração de banco de dados. Este assessment documenta a dívida técnica residual. Embora o núcleo do sistema seja altamente estável (Score de Database: 85/100, Quality Gate: APPROVED), identificamos **16 pontos de atenção**, sendo 2 críticos na camada de Apresentação (UX) e Tipagem.

A resolução imediata desses pontos é vital para garantir a estabilidade em escala (quando as unidades começarem a reportar dados diários) e para apresentar uma estética premium ("Elite") consistente para os diretores das concessionárias.

### Números Chave

| Métrica | Valor |
|---------|-------|
| Total de Débitos | 16 |
| Débitos Críticos | 2 (UX Login e Tipos TS) |
| Débitos de Alta Severidade | 6 |
| Esforço Total Estimado | ~45 horas |
| Custo de Resolução (Estimado) | R$ 6.750,00 |

### Recomendação
Aprovar imediatamente a **Onda 1 e Onda 2** (aprox. 20 horas) para execução na próxima sprint. Estas ondas estabilizam a plataforma, removem o lixo legado que pode onerar a Vercel/Supabase, e blindam a aplicação contra crashes em produção causados por falta de tipos no TypeScript.

---

## 💰 Análise de Custos

### Custo de RESOLVER (Estimado a R$ 150/h)

| Categoria | Horas Estimadas | Custo Estimado |
|-----------|-----------------|----------------|
| Sistema / Arquitetura | 8h | R$ 1.200,00 |
| Database | 24h | R$ 3.600,00 |
| Frontend / UX | 13h | R$ 1.950,00 |
| **TOTAL** | **45h** | **R$ 6.750,00** |

*Nota: As 16 horas do Database incluem um débito baixíssimo (Particionamento) que pode ser removido do escopo imediato, reduzindo o custo real de curto prazo para **R$ 4.350,00**.*

### Custo de NÃO RESOLVER (Risco Acumulado)

| Risco | Probabilidade | Impacto | Custo Potencial |
|-------|---------------|---------|-----------------|
| **Crash em Produção (Tipagem)** | Alta | Alto | R$ 15.000,00 (Perda de dados de check-in) |
| **Degradação de Performance (N+1)** | Alta | Médio | R$ 5.000,00 (Custos extras de Compute Supabase) |
| **Fricção de Usuário (UX/Mobile)** | Alta | Médio | R$ 10.000,00 (Churn ou resistência à adoção) |
| **Exposição de Dados (PII)** | Baixa | Crítico | Incalculável (Multas LGPD / Reputação) |

**Custo potencial de não agir (Curto/Médio Prazo): ~R$ 30.000,00+**

---

## 📈 Impacto no Negócio

### Performance & Escalabilidade
- O Banco de Dados atual aguenta a carga, mas sem os índices propostos (`idx_checkins_store_date`), relatórios mensais para 100+ vendedores começarão a demorar >3s, frustrando os gestores.
- **Impacto da Resolução:** Relatórios carregando em <300ms, garantindo adoção pelo "efeito UAU".

### Segurança & Compliance
- A exposição de e-mails de gerentes e vendedores em texto plano no banco de dados é um risco leve agora, mas um risco de LGPD caso o banco de dados sofra um vazamento.
- **Impacto da Resolução:** Conformidade estrita e proteção contra acessos indevidos via Service Roles não limitadas.

### Experiência do Usuário (UX)
- A tela de Login é a vitrine do produto. Atualmente, ela viola os padrões da marca, passando uma imagem amadora. Modais que não fecham no celular (viewport bounds) impedem os gerentes de realizarem rotinas na rua.
- **Impacto da Resolução:** Experiência "Premium/Elite" 100% responsiva, destravando a operação mobile-first do Gestor.

---

## ⏱️ Timeline Recomendado

### Sprint 1: Critical & Quick Wins (Onda 1 e 2) - 1 Semana
- **Escopo:** Refatorar tela de Login (UX), sincronizar tipos de `store_sellers` (TypeScript), adicionar índices no DB, limpar tabelas fantasmas e corrigir layouts quebrados no mobile.
- **Esforço:** ~15-20 horas.
- **Valor de Negócio:** Sistema blindado contra falhas graves e visualmente premium para o Go-Live.

### Sprint 2: Qualidade & Testes (Onda 3) - 1 a 2 Semanas
- **Escopo:** Escrever testes unitários em `calculations.ts`, resolver regras de Acessibilidade (WCAG), blindar CRON jobs no Supabase e auditar temas de gráficos.
- **Esforço:** ~15-20 horas.
- **Valor de Negócio:** Sustentabilidade do software a longo prazo; garantia de que novos features não quebrarão os cálculos matemáticos da comissão/performance.

---

## 📊 ROI da Resolução

| Investimento | Retorno Esperado |
|--------------|------------------|
| R$ 6.750,00 (Resolução Total) | Evita ~R$ 30.000+ em retrabalho, multas e churn de usuários por bugs na ponta. |
| 15 horas (Sprint 1) | Garante um lançamento sem atritos de layout e sem timeouts no banco de dados. |

**ROI Estimado: 4.4x (O custo de prevenir é quase 5x menor que remediar os crashes mapeados).**

---

## ✅ Próximos Passos (Call to Action)

1. [ ] **APROVAR:** Execução da Onda 1 e 2 (Refatoração do Login, Tipos, Índices e Mobile).
2. [ ] **ALOCAR:** @pm para gerar o Epic e criar as Stories correspondentes.
3. [ ] **EXECUTAR:** @dev para iniciar a implementação da `story-1.1` (Login).

---
## 📎 Anexos
- [Assessment Técnico Completo](technical-debt-assessment.md)
- [Auditoria de Banco de Dados](../../supabase/docs/DB-AUDIT.md)
- [Especificação de Frontend](../frontend/frontend-spec.md)
