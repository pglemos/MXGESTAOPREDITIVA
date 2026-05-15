# Wave 2 QA Test Plan

**Status:** Draft para @qa  
**Onda:** 2 - Visao do dono e planejamento estrategico  
**Stories:** CONS-17, CONS-18, CONS-19

## Objetivo

Validar que a leitura de planejamento e dono apresenta indicadores corretos, estados vazios seguros e isolamento de acesso por papel.

## Matriz de Papeis

| Papel | Deve conseguir | Nao deve conseguir |
|---|---|---|
| Admin/admin master MX | Ver indicadores operacionais completos e detalhes por cliente/loja. | Tratar dado ausente como resultado real. |
| Dono/lojista | Ver performance, alertas e prioridades das lojas vinculadas. | Ver loja de outro dono ou controles admin MX. |
| Gerente | Ver dados permitidos da equipe/loja se produto liberar. | Ver dados de outra loja. |
| Vendedor | Nao deve acessar planejamento estrategico administrativo. | Ver indicadores sensiveis da loja. |

## Cenarios Funcionais

### CONS-17

- [ ] Lista MVP possui fonte documentada para cada indicador.
- [ ] Indicadores missing/deferred estao fora da UI principal.
- [ ] Backlog dos indicadores fora do MVP esta documentado.
- [ ] PO aprovou recorte antes de CONS-18/19.

### CONS-18

- [ ] Tela mostra planejado/meta quando fonte existe.
- [ ] Tela mostra realizado quando fonte existe.
- [ ] Percentual de realizacao calcula corretamente.
- [ ] Ano anterior aparece apenas quando existe fonte.
- [ ] Volume de carros de troca aparece apenas com fonte confiavel.
- [ ] Dados ausentes aparecem como "sem dados" ou estado equivalente.
- [ ] Periodo selecionado pela visita e respeitado quando integrado.

### CONS-19

- [ ] Dono visualiza apenas lojas vinculadas.
- [ ] Indicadores exibem status simples.
- [ ] Alertas explicam motivo.
- [ ] Proximas acoes/pendencias aparecem quando existem.
- [ ] Controles administrativos nao aparecem para dono.
- [ ] Admin MX preserva visao operacional completa.
- [ ] Mobile nao apresenta overflow ou texto cortado.

## Testes Tecnicos

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] Teste de calculo para percentual de realizacao.
- [ ] Teste de dado ausente.
- [ ] RLS/access smoke para dono, gerente, vendedor e admin.
- [ ] Browser smoke desktop.
- [ ] Browser smoke mobile.

## Dados de Teste Sugeridos

- Loja com meta e realizado.
- Loja com meta sem realizado.
- Loja com realizado sem meta.
- Loja com ano anterior.
- Loja sem ano anterior.
- Dono com uma loja vinculada.
- Dono sem acesso a outra loja.
- Admin MX com acesso operacional.

## Criterio de Falha Bloqueadora

- Dono ve loja de outro cliente.
- Indicador sem fonte aparece como zero real.
- Calculo de realizacao divide por zero sem fallback.
- Financeiro sensivel aparece sem aprovacao.
- Mobile impede leitura dos indicadores principais.
