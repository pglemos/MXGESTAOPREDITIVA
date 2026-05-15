# Wave 3 QA Test Plan

**Status:** Draft para @qa  
**Onda:** 3 - Acompanhamento diario e rotina mobile  
**Stories:** OPS-20, OPS-21, OPS-22, OPS-23

## Objetivo

Validar que o vendedor consegue preencher a rotina diaria com baixa friccao, que o gerente valida corretamente e que disciplina/notificacoes nao violam acesso por papel.

## Matriz de Papeis

| Papel | Deve conseguir | Nao deve conseguir |
|---|---|---|
| Vendedor | Preencher propria rotina e ver propria disciplina. | Validar rotina da loja ou ver disciplina de outro vendedor. |
| Gerente | Ver pendentes, validar rotina e acompanhar disciplina da equipe. | Validar ou ver loja fora do vinculo. |
| Dono/lojista | Ver leitura agregada se produto liberar. | Editar lancamento de vendedor. |
| Admin/admin master MX | Auditar lojas, pendencias e disciplina. | Quebrar regras de RLS por atalhos de UI. |

## Cenarios Funcionais

### OPS-20

- [ ] Vendedor preenche leads, agendamentos, visitas e vendas.
- [ ] Formulario diferencia dia anterior e hoje.
- [ ] Producao zero exige justificativa.
- [ ] Ajuste tecnico segue separado do lancamento diario.
- [ ] Validacoes de funil e limites continuam funcionando.
- [ ] Mobile sem overflow, sobreposicao ou botao inacessivel.

### OPS-21

- [ ] Gerente ve vendedores pendentes.
- [ ] Gerente ve vendedores preenchidos e numeros principais.
- [ ] Gerente registra validacao da rotina.
- [ ] Validacao salva data, loja, gerente, pendentes e observacoes.
- [ ] Validacao nao altera lancamentos dos vendedores.
- [ ] Vendedor nao consegue validar rotina.
- [ ] Admin MX consegue auditar por loja.

### OPS-22

- [ ] Vendedor pendente recebe notificacao in-app/popup.
- [ ] Vendedor nao pendente nao recebe lembrete indevido.
- [ ] Notificacao respeita usuario/data/loja.
- [ ] Notificacao nao duplica indefinidamente.
- [ ] Gerente visualiza pendentes e aciona lembrete manual se aprovado.
- [ ] WhatsApp nao e dependencia do MVP.

### OPS-23

- [ ] Disciplina calcula consistencia de preenchimento.
- [ ] Vendedor ve apenas a propria disciplina.
- [ ] Gerente ve disciplina da equipe.
- [ ] Admin MX ve disciplina por loja.
- [ ] Ausencia de dado nao e exibida como desempenho baixo.
- [ ] Performance comercial nao se mistura com disciplina.

## Testes Tecnicos

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] RLS/access smoke para vendedor, gerente, dono e admin.
- [ ] Teste de formulario com producao zero.
- [ ] Teste de duplicidade de notificacao.
- [ ] Browser smoke mobile para check-in.
- [ ] Browser smoke desktop para rotina do gerente.

## Dados de Teste Sugeridos

- Vendedor com lancamento do dia.
- Vendedor pendente.
- Vendedor com producao zero justificada.
- Gerente com loja vinculada.
- Gerente sem acesso a outra loja.
- Admin MX com visao de auditoria.
- Loja com todos preenchidos.
- Loja com pendencias.

## Criterio de Falha Bloqueadora

- Vendedor consegue validar rotina.
- Gerente acessa loja fora do vinculo.
- Notificacao duplica sem limite para usuario/data.
- Producao zero passa sem justificativa quando a regra exigir.
- Mobile impede preenchimento do vendedor.
