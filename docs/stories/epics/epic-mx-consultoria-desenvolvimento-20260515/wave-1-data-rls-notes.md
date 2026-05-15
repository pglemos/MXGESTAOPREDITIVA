# Wave 1 Data/RLS Notes

**Destino:** @data-engineer  
**Stories:** CONS-13, CONS-15, CONS-16  
**Status:** Preflight

## Tabelas Envolvidas

- `visitas_consultoria`
- `etapas_modelo_visita_consultoria`
- `programas_visita_consultoria`
- `clientes_consultoria`
- `evidencias_visita`
- `logs_auditoria`

## Mudancas Provaveis

### Visita 8

Adicionar modelo de visita 8:

- `visit_number = 8`
- objetivo: Acompanhamento Mensal
- alvo: Proprietario/Gerente
- duracao: 1h a 3h
- evidencia: resumo mensal, plano de acao atualizado e proximas acoes
- checklist: revisar indicadores, pendencias, pontos positivos, pontos a melhorar, proximas acoes, proxima data

### Periodo de analise

Adicionar campos em `visitas_consultoria`:

- `analysis_period_start date`
- `analysis_period_end date`
- `analysis_period_preset text`

Constraints recomendadas:

- `analysis_period_end >= analysis_period_start` quando ambos preenchidos.
- `analysis_period_preset` opcional, sem bloquear valores antigos.

Indices:

- `(client_id, analysis_period_start, analysis_period_end)` se consultas por periodo forem frequentes.

## RLS

Nao criar policy nova se as policies atuais em `visitas_consultoria` ja usam `can_access_consulting_client(client_id)` para SELECT e admin para write.

Validar:

- dono/lojista so acessa visitas do cliente/loja vinculado;
- gerente/vendedor nao recebe permissao nova indevida;
- admin/admin master MX mantem escrita.

## Compatibilidade

- RPC `concluir_visitas_legadas_consultoria` deve continuar bloqueando visita 8.
- Queries de progresso que representam ciclo PMR principal podem continuar 1..7.
- Agenda e detalhe operacional devem passar a aceitar 1..8.

## Testes Recomendados

- schema parse de visita com campos de periodo nulos;
- schema parse de visita com periodo preenchido;
- validacao de visita 8 em listagem/detalhe;
- regressao de conclusao legada recusando `8`;
- RLS smoke para dono/gerente/vendedor quando possivel.

