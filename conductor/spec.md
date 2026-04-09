# Especificação Técnica: Comprehensive Fix Plan (A11y & Performance)

**Status:** Rascunho Finalizado (Aguardando Aprovação)
**Track:** `comprehensive-fix`
**Propósito:** Transformar o MX Performance em um sistema de "Zero Atrito" para acessibilidade e carregamento instantâneo, com 100% de conformidade Lighthouse e ausência total de logs de erro (Hydration/Auth).

---

## 🛡️ Critérios de Aceite (AIOX Rigor)

### 1. Acessibilidade (WCAG 2.1 AA)
- **Landmarks:** Todas as páginas devem ter exatamente um `<main>` root (ou dentro de um Layout consistente).
- **Interactive Elements:**
    - Botões icon-only devem possuir `aria-label` descritivo.
    - Ícones decorativos (Lucide) devem ter `aria-hidden="true"`.
    - `focus-visible:ring-2` obrigatório em todo elemento clicável.
- **Formulários:**
    - Todo `Input`, `Select` e `Textarea` deve possuir um `id` único e um `<label htmlFor={id}>`.
    - Erros de validação devem usar `aria-invalid` e `aria-describedby`.
- **Tabelas:**
    - Uso obrigatório de `<caption>` (podendo ser `sr-only`).
    - `scope="col"` em `<th>` e `scope="row"` no identificador da linha.
- **Hierarquia:**
    - Exatamente um `<h1>` por página.
    - Sequência lógica de `<h2>`, `<h3>` sem pular níveis.

### 2. Performance (Core Web Vitals)
- **Skeletons:** Carregamento de dados (loading states) deve usar Skeletons proporcionais ao conteúdo final.
- **Hydration:** Zero avisos de "Extra attributes from the server" ou "Hydration failed".
- **Auth Client:** Singleton do `supabase.auth` (evitar múltiplas instâncias de `GoTrueClient`).
- **Memoization:** Uso de `useMemo` e `useCallback` em cálculos pesados de funil e projeção.

### 3. UI/UX Hardening
- **Contrast:** `text-gray-400` proibido em fundos claros (mínimo `text-gray-600` ou tokens `text-secondary`).
- **Touch Targets:** Mínimo de 44x44px para botões mobile.

---

## 🛠️ Stack de Validação
- **Lighthouse:** Mínimo 95+ em Acessibilidade e Performance.
- **Axe DevTools:** Zero violações automáticas.
- **Console Audit:** Zero avisos de `aria-*` inválidos ou `unique key prop`.

---

**Assinatura:** — Orion, orquestrando o sistema 🎯
