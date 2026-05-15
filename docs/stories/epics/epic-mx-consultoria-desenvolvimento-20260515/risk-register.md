# Risk Register - EPIC-MX-CONS-DEV-20260515

**Status:** Draft operacional  
**Responsavel por manter:** @aiox-master  
**Gate:** @po + @qa

## Riscos Criticos

| ID | Risco | Impacto | Probabilidade | Dono | Mitigacao |
|---|---|---:|---:|---|---|
| R-01 | Visita 8 quebrar PMR 1-7, conclusao legada ou dashboards existentes. | Alto | Media | @architect | Tratar visita 8 como acompanhamento compativel; regressao PMR 1-7 obrigatoria. |
| R-02 | Dono/gerente/vendedor acessarem dados de outra loja. | Alto | Media | @data-engineer | RLS smoke por papel em toda story com dados multi-tenant. |
| R-03 | Relatorio executivo depender de IA e ficar instavel. | Alto | Media | @architect | Builder deterministico no MVP; IA apenas como melhoria futura. |
| R-04 | Tentar implementar os 45 indicadores de uma vez. | Alto | Alta | @pm | Usar `wave-2-indicators-mvp.md` e GO/NO-GO. |
| R-05 | Vendedor rejeitar preenchimento diario por parecer apenas cobranca. | Alto | Media | @ux-design-expert | Mobile simples, beneficio visivel e disciplina separada de punicao. |
| R-06 | Notificacoes duplicadas ou fora de contexto. | Medio | Media | @architect | Contrato unico de notificacao e idempotencia. |
| R-07 | Desenvolvimento virar LMS completo e perder foco comercial. | Medio | Media | @pm | DEV-24 posiciona sistema de desenvolvimento, nao curso/marketplace. |
| R-08 | PDI/feedback expor informacao sensivel. | Alto | Media | @data-engineer | RLS e telas por papel; vendedor so ve o proprio historico. |
| R-09 | Conteudo institucional vazar entre lojas. | Alto | Baixa | @data-engineer | Tenant isolation e teste especifico em APP-28. |
| R-10 | App submetido sem readiness mobile e ser recusado. | Medio | Media | @devops | APP-30 e APP-31 como gate antes de submissao. |
| R-11 | Credenciais/certificados entrarem em docs ou git. | Alto | Baixa | @devops | Checklist proibe segredos; revisar git antes de PR. |
| R-12 | Mudancas em arquivos ja modificados por outro trabalho causarem conflito. | Medio | Alta | @dev | Ler diff antes de editar; nao reverter alteracoes de terceiros. |

## Riscos por Onda

### Wave 1

- PMR 1-7 e visita 8 precisam coexistir.
- Periodo de analise nao deve conflitar com fechamento mensal.
- Relatorio nao deve mudar historico antigo indevidamente.

### Wave 2

- Dados ausentes podem ser interpretados como zero.
- Indicadores financeiros podem expor informacao sensivel.
- Visao do dono pode ficar operacional demais.

### Wave 3

- Rotina diaria pode aumentar friccao do vendedor.
- Validacao do gerente pode virar gargalo se for pesada.
- Notificacoes demais podem reduzir adesao.

### Wave 4

- Biblioteca sem taxonomia vira lista longa e pouco util.
- Trilha obrigatoria sem conteudo minimo perde valor.
- Recomendacao de conteudo sem explicacao perde confianca.

### Wave 5

- Personalizacao por loja pode virar servico manual pesado.
- Conteudo de terceiro exige aprovacao e governanca.
- App readiness depende de fluxos anteriores estaveis.

## Politica de Escalada

Acionar `*correct-course` com @aiox-master quando:

- surgir requisito novo sem origem no escopo;
- story ficar grande demais para uma entrega testavel;
- houver risco de RLS;
- houver mudanca arquitetural sem dono;
- gate de QA falhar duas vezes pelo mesmo motivo.
