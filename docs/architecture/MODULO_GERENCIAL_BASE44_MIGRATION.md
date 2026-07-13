# Módulo Gerencial — arquitetura de reconstrução Base44 1:1 no MX

> Decisão revisada em 2026-07-13 após aprovação explícita do usuário. Esta revisão
> substitui a regra anterior que preservava comportamentos ou fórmulas MX quando
> eles divergiam da referência Base44.

## Decisão

O código-fonte de `/Users/pedroguilherme/Downloads/mx-gerente.zip` e o comportamento autenticado de `https://mx-gerente.base44.app` formam o contrato normativo do módulo gerencial: composição, conteúdo, cálculos, estados, formulários, modais, gráficos, ações e fluxos devem produzir o mesmo resultado observável.

O MX permanece fonte de verdade apenas para a plataforma de execução: React 19, TypeScript, shell, autenticação, capabilities, Supabase, RLS, auditoria e design tokens. As entidades Base44 são implementadas por adaptadores sobre os contratos Supabase existentes; não há segundo router, sidebar, AuthProvider, SDK Base44 nem armazenamento empresarial no navegador.

Quando a implementação MX atual divergir do contrato Base44, o contrato Base44 vence. A única exceção visual autorizada é o sidebar escuro atual, preservado integralmente salvo pelos ícones de Rotina do Dia (`CalendarClock`) e Mentor Gerencial (`BrainCircuit`). Requisitos de segurança, autorização, isolamento por loja e auditoria permanecem inegociáveis e devem ser satisfeitos pelo adaptador sem alterar a experiência observável.

## Rotas canônicas

`/home`, `/rotina`, `/fechamento-diario`, `/gerente/rotina-equipe`, `/gerente/minha-equipe`, `/gerente/meta-loja`, `/gerente/mentor`, `/gerente/feedbacks-pdis`, `/gerente/ranking` e `/gerente/universidade-mx`.

Aliases legados podem continuar existindo, mas navegação, links internos, restauração de contexto e E2E devem usar as rotas canônicas acima.

## Boundaries

- Início reproduz o cockpit de previsibilidade do Base44 e alimenta suas fórmulas com dados canônicos MX; ausência de dados usa exatamente o estado vazio correspondente, nunca fallback numérico inventado.
- Rotina do Dia porta o gerador Base44 de tarefas automáticas e manuais, com seus horários, urgência, filtros, conclusão e restauração de contexto; cada entidade de entrada é resolvida por adaptador Supabase.
- Fechamento reproduz composição e fluxos Base44 reutilizando check-in, regularização e auditoria existentes; o gerente não pode adulterar a operação do vendedor fora das ações autorizadas.
- Rotina da Equipe reproduz cálculos e estados Base44 sobre `central_execucao_*`, plano de ataque, `execution_actions` e CRM.
- Minha Equipe, Meta da Loja, Mentor, Desenvolvimento, Ranking e Universidade reproduzem o contrato Base44 completo usando os serviços canônicos atuais somente como fonte/persistência.
- Toda query é escopada por membership/RLS; identificadores do cliente não constituem autorização.
- Blocos assíncronos distinguem loading, vazio, erro, sem vínculo e sem permissão.

## Padrão de adaptação

Cada tela é entregue como recorte vertical independente:

1. inventário do ZIP e inspeção do fluxo autenticado no Chrome;
2. contrato de apresentação e domínio isolado do JSX;
3. adaptador Base44 → Supabase com tipos explícitos;
4. testes unitários de fórmulas, testes de componente e E2E de ações;
5. comparação em `1440×900`, `768×1024` e `390×844` contra a referência estabilizada;
6. validação pós-deploy na rota pública antes de iniciar a próxima tela.

O adaptador pode compor múltiplas tabelas/RPCs canônicas, mas não pode alterar fórmulas, limiares, labels, ordenação, habilitação de ações ou transições observáveis definidas pelo Base44. Migração nova só é permitida quando a auditoria comprovar ausência de contrato persistente equivalente.

## Restrições aceitas

Não importar SDK, autenticação, dados demo, `localStorage` empresarial ou CSS global do Base44. Componentes, fórmulas e catálogos de domínio do ZIP devem ser portados para TypeScript e tokens MX sem reinterpretar o comportamento. Credenciais e tokens operacionais nunca são persistidos, impressos ou enviados ao bundle.
