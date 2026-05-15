# Wave 3 - Rotina Diaria e Engajamento

**Status:** Preflight para @pm/@ux-design-expert/@data-engineer  
**Objetivo:** evoluir acompanhamento diario sem reescrever check-in.

## Base Existente

- `src/pages/Checkin.tsx`: terminal de lancamento do vendedor, com mobile, data, ajuste tecnico, validacao de funil e justificativa de zero.
- `src/pages/RotinaGerente.tsx`: centro de comando do gerente, pendencias, ajustes, matinal e rotina.
- `src/pages/MorningReport.tsx`: matinal para loja e rede.
- `src/hooks/useCheckins.ts`: persistencia de `lancamentos_diarios`.
- `src/hooks/useManagerRoutine.ts`: registro da rotina do gerente.
- `notificacoes` e preferencias de notificacao ja existem em migrations.
- RLS de `lancamentos_diarios` foi endurecida em migrations recentes.

## Corte MVP

1. Confirmar campos do check-in e deixar UX mobile mais obvia.
2. Garantir validacao diaria pelo gerente.
3. Criar ou organizar lembretes in-app da puxada diaria.
4. Exibir disciplina simples do vendedor.

## Nao Fazer Agora

- WhatsApp automatico.
- Gamificacao completa.
- Reescrever ranking.
- Nova tabela paralela de check-in.
- IA para insights.

## Decisoes Pendentes

- Horario padrao da puxada diaria.
- Formato visual inicial da disciplina: percentual, estrelas ou status.
- Se gerente pode disparar lembrete manual na Onda 3 ou se fica para Onda posterior.

## Recomendacao

Implementar primeiro OPS-20 e OPS-21, porque notificacoes e disciplina dependem de clareza no preenchimento e na validacao.

