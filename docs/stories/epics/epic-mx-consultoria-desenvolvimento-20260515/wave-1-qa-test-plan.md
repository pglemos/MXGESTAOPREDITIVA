# Wave 1 QA Test Plan

**Status:** Draft para @qa  
**Onda:** 1 - Consultoria PMR pronta para uso  
**Stories:** CONS-13, CONS-14, CONS-15, CONS-16

## Objetivo

Validar que a consultoria PMR continua estavel para visitas 1 a 7 e passa a suportar acompanhamento mensal, periodo de analise, fluxo guiado e relatorio executivo.

## Matriz de Papeis

| Papel | Deve conseguir | Nao deve conseguir |
|---|---|---|
| Admin/admin master MX | Criar, editar, iniciar e concluir visitas permitidas; gerar resumo/relatorio. | Acessar dados fora das regras internas aprovadas. |
| Dono/lojista | Visualizar resultado permitido da propria loja/cliente. | Criar/editar visita; acessar outra loja/cliente. |
| Gerente | Visualizar apenas o que for permitido pela loja. | Gerar relatorio administrativo sem permissao. |
| Vendedor | Nao participa do fluxo administrativo da visita. | Acessar relatorio de cliente ou dados de outra loja. |

## Cenarios Funcionais

### CONS-13

- [ ] PMR 1 a 7 segue listando visitas existentes.
- [ ] Visita 8 pode ser criada/agendada.
- [ ] Visita 8 possui objetivo, publico, duracao, checklist e evidencia esperada.
- [ ] Conclusao legada continua limitada a 1 a 7.
- [ ] Relatorio/template nao quebra com `visit_number = 8`.

### CONS-15

- [ ] Periodo mes atual salva corretamente.
- [ ] Periodo mes anterior salva corretamente.
- [ ] Periodo trimestre atual salva corretamente.
- [ ] Periodo customizado valida inicio e fim.
- [ ] Periodo invalido mostra erro claro.
- [ ] Visita sem periodo usa fallback definido.

### CONS-14

- [ ] Admin inicia visita pela agenda e cai no fluxo correto.
- [ ] Tela mostra objetivo/metodologia antes dos campos.
- [ ] Checklist muda conforme visita.
- [ ] Estados de loading, vazio, erro e concluido estao claros.
- [ ] Mobile nao tem overflow horizontal nem sobreposicao.

### CONS-16

- [ ] Resumo executivo pode ser gerado/atualizado.
- [ ] Resumo fica persistido no historico.
- [ ] Relatorio segue ordem padrao MX.
- [ ] Relatorio inclui periodo quando preenchido.
- [ ] Dados incompletos nao quebram o relatorio.
- [ ] Admin revisa antes de compartilhar.
- [ ] Dono ve somente o que o papel permite.

## Testes Tecnicos

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] Teste de schema para `visit_number = 8`.
- [ ] Teste de schema para periodo nulo e preenchido.
- [ ] RLS smoke para dono/gerente/vendedor/admin quando houver migration/policy.
- [ ] Browser smoke desktop.
- [ ] Browser smoke mobile.

## Dados de Teste Sugeridos

- Cliente com visitas 1 a 7 completas.
- Cliente com visita 8 agendada.
- Cliente sem periodo de analise.
- Cliente com periodo mes anterior.
- Cliente com anexo.
- Usuario dono vinculado a uma loja.
- Usuario dono sem vinculo com outra loja.

## Criterio de Falha Bloqueadora

- PMR 1 a 7 deixa de funcionar.
- RLS vaza dados entre lojas/clientes.
- Relatorio quebra tela com dados incompletos.
- Admin nao consegue finalizar fluxo principal.
- Mobile impede uso do fluxo de visita.
