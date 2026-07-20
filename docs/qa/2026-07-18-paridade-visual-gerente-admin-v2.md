# Evidência QA — Paridade Visual Gerente/Admin V2

**Data:** 18/07/2026  
**Branch:** `fix/paridade-visual-gerente-admin-v2`  
**PR:** #123  
**Referências:** screenshots anexados e código-fonte `mx-gerente (2).zip`

## Escopo validado

A auditoria cobriu os perfis:

- Gerente, usado como referência visual do shell;
- Dono;
- Administrador Geral;
- Administrador MX;
- Consultor MX.

O perfil Vendedor foi mantido fora do escopo gerencial para preservar seu design system e o botão primário rosa existente.

## Causa-raiz confirmada

A implementação anterior compartilhava arquivos, mas não compartilhava a mesma matriz visual concreta. Os componentes comuns ainda produziam:

- sidebar de 264/80 px em vez de 224/64 px;
- item ativo verde-claro com trilho lateral em vez de emerald sólido;
- superfícies `mx-*` com raios globais ampliados;
- `rounded-xl` e `rounded-2xl` calculados como 20/24 px, enquanto a referência Base44 usa 12/16 px;
- botão primário global rosa vazando para páginas de gestão;
- múltiplos links com `aria-current="page"` nas rotas do Dono que compartilham `/lojas` com query string;
- landing do Consultor MX usando uma composição visual separada.

## Correções aplicadas

### Shell e navegação

- Sidebar desktop padronizada em 224 px expandida e 64 px recolhida.
- Fundo branco, borda `gray-100` e sombra leve.
- Item ativo único em `emerald-600`, texto branco e `shadow-sm`.
- Seleção do item ativo por rota exata, query string e maior especificidade.
- `aria-current` emitido somente no item realmente selecionado.
- Drawer mobile preservado com foco contido e sem overflow horizontal.

### Fundação visual

- `MxModuleVisualPrimitives` reconstruído com a anatomia concreta do Gerente:
  - fundo `gray-50`;
  - container `max-w-7xl`;
  - ritmo vertical consistente;
  - cards brancos;
  - borda `gray-100`;
  - sombra leve;
  - tipografia Inter e escala `gray-800/500`;
  - emerald como cor de ação e sucesso.
- Escala de raios Base44 restaurada somente nos perfis de gestão:
  - `rounded-xl` = 12 px;
  - `rounded-2xl` = 16 px.
- Tokens semânticos gerenciais isolados em `.mx-manager-scope`.

### Botões e páginas

- Variantes `managerPrimary`, `managerOutline`, `managerSecondary` e `managerGhost` adicionadas.
- `ButtonVisualProvider` converte variantes genéricas para a matriz gerencial apenas dentro do escopo apropriado.
- O primary rosa global do Vendedor foi preservado.
- `ConsultoriaClientes` foi reconstruído com `MxModulePage`, `MxModuleHeader`, `MxMetricCard`, `MxToolbar`, `MxSectionCard`, `MxStatusBanner`, `MxField` e `MxTableSurface`.
- Admin, Dono e Consultoria agora recebem a mesma fundação sem CSS corretivo por rota.

## Evidências automatizadas

### CI no commit `3beaf746843926548c61e4d51481efe89aa10873`

| Gate | Resultado |
|---|---|
| TypeScript `tsc --noEmit` | PASS |
| Testes unitários `bun test` | PASS |
| ESLint a11y | PASS |
| Module Design System Parity | PASS |
| Module Design System Authenticated Visual | PASS |
| MX Atomic Design Enforcement | PASS |
| Build de produção | PASS |
| Bundle size budget | PASS |
| Gitleaks | PASS |
| CodeRabbit prompt-only | PASS |

O build de produção é executado pelo workflow `bundle-budget` antes da validação dos limites de bundle.

### Matriz visual Playwright

Foram validadas 10 combinações:

- 5 perfis em desktop 1440 × 900;
- 5 perfis em mobile 390 × 844.

Métricas comprovadas em todos os perfis:

| Métrica | Resultado |
|---|---|
| Sidebar desktop | 224 px |
| Drawer mobile | 304 px |
| Topbar mobile | 72 px |
| Fundo do shell | `gray-50` |
| Fonte | Inter |
| Cabeçalho dos módulos alvo | branco, raio 16 px, borda e sombra |
| Item ativo visual | exatamente 1 |
| `aria-current="page"` | exatamente 1 |
| Nós visuais legados | 0 |
| Overflow horizontal | não detectado |

Artefato GitHub Actions: `module-design-system-authenticated-visual`, SHA-256 `5247f0148873ffbd9c00dddadbb9aee1222b6d102c10a553ae795f6b40a630d8`.

## Supabase

Projeto `MX GESTAO PREDITIVA` (`fbhcmzzgwjdgkctlfvbo`) verificado como `ACTIVE_HEALTHY` em `sa-east-1`.

Nenhuma migration, tabela, RPC, trigger, Edge Function, política RLS ou configuração de Auth foi alterada. A correção é exclusivamente de frontend e contratos visuais.

## Vercel

O projeto `mxperformance` continua conectado ao repositório correto. O preview mais recente não iniciou o build porque a conta atingiu o limite diário do plano gratuito:

> Resource is limited - try again in 24 hours (more than 100, code: api-deployments-free-per-day).

Portanto, o PR permanece draft. O bloqueio é de cota externa da Vercel, não de compilação do código. O build de produção já foi validado com sucesso no GitHub Actions.

## Resultado

A matriz visual dos módulos Dono, Administrador Geral, Administrador MX e Consultor MX foi alinhada ao design do Gerente nas áreas compartilhadas, incluindo shell, navegação, superfícies, tipografia, raios, botões, estados e responsividade. Os contratos automatizados agora validam apresentação computada, não apenas imports compartilhados.
