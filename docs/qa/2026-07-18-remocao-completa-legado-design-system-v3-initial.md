# Diagnóstico inicial — Remoção completa do legado visual V3

## Evidência confirmada

A auditoria anterior não cobria o sistema completo. O teste visual autenticado verificava somente uma rota por perfil e três padrões de seletor legado.

## Hipótese de causa-raiz

A causa provável é a combinação de:

1. validação centrada no shell e no primeiro header visível;
2. ausência de inventário de rotas por perfil;
3. detector de legado limitado a nomes antigos específicos;
4. páginas reais ainda importando primitives, tokens ou composições anteriores;
5. falta de interação com filtros, modais, drawers, tabelas e estados secundários.

## Próxima evidência necessária

- snapshot integral de `src/`;
- inventário de rotas e lazy imports;
- grafo de imports por página;
- ledger de classes e tokens fora da matriz canônica;
- screenshots das rotas reais em desktop e mobile.

Nenhuma alteração de produção ou Supabase foi aplicada nesta etapa.
