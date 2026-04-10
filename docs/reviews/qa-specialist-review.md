# QA & Risk Specialist Review (@qa)

## 🛡️ Análise de Riscos de Regressão
- **Baixa Cobertura de Testes**: Identifiquei que o diretório `src/test/` contém apenas testes para o componente `Button`. Com 86 arquivos modificados na refatoração universal, o risco de quebras silenciosas em fluxos de negócio (Check-in, PDI, Feedback) é **CRÍTICO**.
- **Refatoração Sem Redes de Proteção**: A mudança massiva de classes Tailwind e a introdução de novos `Atoms` podem ter alterado comportamentos de eventos (onClick, onBlur) ou acessibilidade que não são capturados sem testes E2E.

---

## 🔍 Validação de Débitos Técnicos

### DS-01: Componentes Duplicados (Impacto QA)
- **Risco**: Ter duas implementações de `Button` ou `Badge` no código aumenta a probabilidade de um bug ser corrigido em uma versão e permanecer na outra, gerando inconsistência de comportamento.
- **Ação QA**: Validar via `grep` se algum fluxo crítico ainda consome a pasta `ui/` e priorizar a migração.

### DB-01: Permissividade RLS (Impacto Segurança)
- **Validação**: Concordo com a @data-engineer. Este débito é uma vulnerabilidade de segurança. 
- **Plano de Teste**: Criar um script Playwright que tenta acessar o endpoint da Loja B usando o token de um Vendedor da Loja A. Se o script retornar dados, o bug está confirmado.

### FE-01: Dashboards Monolíticos (Impacto Testabilidade)
- **Risco**: Páginas com mais de 1000 linhas são impossíveis de testar unitariamente. 
- **Recomendação**: Sharding imediato de lógica para hooks facilita a criação de mocks e testes de unidade com Bun.

---

## 📈 Priorização Quinn (Especialista QA)
1. **Infraestrutura de Testes E2E (Playwright)**: Crítica (Para validar a refatoração universal).
2. **Fix DB-01 (Segurança)**: Crítica.
3. **Refatoração de Dashboards p/ Testabilidade**: Alta.

Salve em: docs/reviews/qa-specialist-review.md
