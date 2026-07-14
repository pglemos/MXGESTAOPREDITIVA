# ADR-MANAGER-SOURCE-PRECEDENCE — precedência do Módulo Gerencial

- Status: aceito para a auditoria de 2026-07-14
- Escopo: dez telas do Módulo Gerencial

## Decisão

Aplicar a precedência:

```text
Especificação funcional textual > Base44 autenticado e ZIP visual > MX infraestrutura
```

A especificação textual vence fórmulas, pesos, permissões, estados semânticos, critérios de aceite, denominador, não aplicável, base insuficiente, isolamento e auditoria. Base44 vence composição, layout, textos não conflitantes, espaçamento, ícones, cores, estados visuais, formulários, modais e comportamento observável. MX fornece a implementação em React/TypeScript e os controles de autenticação, membership, Supabase, RLS, RPCs e auditoria, sujeitos à validação de segurança, incluindo a auditoria RLS cross-store ainda pendente.

O sidebar escuro MX permanece preservado. As únicas trocas de ícone autorizadas são `CalendarClock` para Rotina do Dia e `BrainCircuit` para Mentor Gerencial.

## Consequências

- Conflitos devem ser registrados na matriz, com fonte vencedora e teste de regressão.
- Números do Base44 não são importados como dados; métricas vêm de fontes MX reais ou estados semânticos.
- A ausência de uma captura Base44 estável bloqueia a aprovação visual daquela tela; spinner não é baseline.
- Migrations novas continuam sujeitas à auditoria de ausência de contrato canônico e à política de não destruição.
