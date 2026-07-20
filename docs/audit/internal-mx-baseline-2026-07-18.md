# Baseline técnico do módulo interno MX

Data: 18/07/2026
Base GitHub: `main@908aaaa7f80e46cdc02f027310e502db62c485d4`
Branch planejada: `feat/internal-mx-design-system`

## Escopo preservado

- Perfis: `administrador_geral`, `administrador_mx`, `consultor_mx`.
- Rotas, query strings, redirects e parâmetros existentes.
- `canAccessPath`, capabilities, Supabase RLS e contratos de hooks.
- Módulos de Vendedor, Gerente e Dono.

## Estratégia aplicada

A migração usa um shell único, registro canônico de páginas, navegação filtrada pela autorização existente e CSS escopado em `.mx-internal-workspace`. As páginas de domínio permanecem intactas para reduzir risco funcional. O design system não importa Supabase.

## Limitação do ambiente executor

O ambiente de execução não disponibilizou clone Git por rede. A alteração foi montada por objetos Git e validada por contratos estáticos locais; build completo e E2E são gates obrigatórios do Preview Vercel antes do merge.
