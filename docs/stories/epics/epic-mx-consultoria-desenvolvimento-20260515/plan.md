# Plano Operacional AIOX

**Plano:** EPIC-MX-CONS-DEV-20260515  
**Status:** Ready for PO/PM validation  
**Workflow base:** `brownfield-fullstack` + `spec-pipeline` + `epic-orchestration`  
**Orquestrador:** @aiox-master

## Estado Atual

- [x] Escopo da reuniao documentado.
- [x] Papeis corrigidos: consultor = admin/admin master MX; cliente = lojista/dono.
- [x] Epic set criado.
- [x] Execution brief criado.
- [x] Action board criado.
- [x] Package manifest criado.
- [x] Validation report criado.
- [x] Roteamento por agentes criado.
- [x] Plano de ondas criado.
- [x] Indice de stories criado.
- [x] Rastreabilidade de requisitos criada.
- [x] Registro de riscos criado.
- [x] Log de decisoes criado.
- [x] Matriz de dependencias criada.
- [x] Checklist GO/NO-GO criado.
- [x] PM transformar em PRD final/epics aprovados.
- [x] Preflight tecnico da Onda 1 criado.
- [x] Kickoff e plano QA da Onda 1 criados.
- [x] Readiness review da Onda 1 criado.
- [x] Stories e plano da Onda 2 criados.
- [x] Kickoff e plano QA da Onda 2 criados.
- [x] Stories e plano da Onda 3 criados.
- [x] Kickoff e plano QA da Onda 3 criados.
- [x] Stories e plano da Onda 4 criados.
- [x] Kickoff e plano QA da Onda 4 criados.
- [x] Stories e plano da Onda 5 criados.
- [x] Kickoff e plano QA da Onda 5 criados.
- [ ] PO validar prioridades e bloqueadores.
- [ ] SM criar primeira leva de stories.

## Comandos de Partida

### 1. Validar o plano com AIOX Master

```text
@aiox-master
*status
*workflow brownfield-fullstack --mode=guided
*plan status EPIC-MX-CONS-DEV-20260515
```

### 2. Consolidar PRD e requisitos

```text
@pm
*create-brownfield-prd
```

Entradas:

- `docs/prd/escopo-reuniao-daniel-sistema-2026-05-15.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/README.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/execution-plan.yaml`

Saida esperada:

- PRD brownfield atualizado ou novo shard em `docs/prd/`.

### 3. Validar com PO

```text
@po
*execute-checklist
```

Foco:

- requisitos rastreados;
- sem feature inventada;
- fases priorizadas;
- bloqueadores claros;
- papel de admin/dono/gerente/vendedor correto.

### 4. Preparar arquitetura

```text
@architect
*task architect-analyze-impact
*plan create CONS-13
```

Foco:

- impacto nas tabelas `consulting_*`;
- compatibilidade com PMR 1-7;
- RLS por admin/dono/gerente/vendedor;
- relatorio executivo;
- notificacoes;
- PDI/treinamentos existentes.

### 5. Criar stories da Onda 1

```text
@sm
*create-story
```

Primeiras stories candidatas:

1. `CONS-13` - Visita 8 de acompanhamento mensal.
2. `CONS-14` - Fluxo sequencial e limpo da visita PMR.
3. `CONS-15` - Filtro de periodo para visita e relatorio.
4. `CONS-16` - Relatorio executivo e resumo em tempo real.

### 6. Executar Onda 1

```text
@aiox-master
*workflow epic-orchestration --mode=guided
```

Plano:

- @po valida stories.
- @architect cria plano tecnico.
- @data-engineer valida banco/RLS.
- @ux-design-expert valida UX.
- @dev implementa.
- @qa roda gate.
- @devops faz push/PR/deploy somente apos aprovacao.

## Checkpoints por Onda

### Checkpoint 0 - Requisitos

Responsavel: @po  
Status esperado: GO para Onda 1

Perguntas:

- O escopo esta fiel a reuniao?
- A primeira entrega realmente fecha consultoria PMR?
- Alguma decisao impede desenvolvimento?

### Checkpoint 1 - Consultoria PMR

Responsavel: @qa + @po  
Status esperado: PMR usable

Evidencias:

- admin/admin master MX inicia visita pela agenda;
- visita tem objetivo, metodologia e checklist;
- visita 8 existe;
- periodo de analise selecionavel;
- relatorio/resumo gerado;
- dono recebe leitura apropriada;
- RLS nao vaza dados.

### Checkpoint 2 - Dono e Planejamento

Responsavel: @po  
Status esperado: valor claro para lojista/dono

Evidencias:

- visao dono separada da visao admin MX;
- indicadores MVP aprovados;
- planejado x realizado funcionando;
- comparativos funcionando.

### Checkpoint 3 - Rotina Diaria

Responsavel: @qa  
Status esperado: input diario confiavel

Evidencias:

- vendedor preenche no mobile;
- gerente valida;
- notificacoes aparecem;
- disciplina/insights aparecem;
- dados alimentam visao gerente/dono/admin.

### Checkpoint 4 - Desenvolvimento

Responsavel: @po + @qa  
Status esperado: produto de entrada demonstravel

Evidencias:

- area reposicionada;
- biblioteca pesquisavel;
- trilha de novo colaborador;
- PDI e feedback conectados;
- avaliacao/sugestao de conteudo.

### Checkpoint 5 - App Readiness

Responsavel: @devops + @qa  
Status esperado: pronto para preparacao de loja/app

Evidencias:

- fluxos principais testados;
- checklist Apple/Google criado;
- dados sensiveis protegidos;
- ambiente revisado.

## Proximas Decisoes do PO

1. Nome final da area: Desenvolvimento, Evolucao ou Meu Plano de Carreira.
2. Lista dos indicadores MVP do planejamento.
3. Campos obrigatorios do preenchimento diario.
4. Padrao final do relatorio executivo.
5. Primeiro pacote de conteudos da biblioteca.
6. Modelo inicial de incentivo do vendedor.

## Ordem Recomendada Agora

1. Ler `execution-brief.md`.
2. Ler `package-manifest.md`.
3. Conferir `validation-report.md`.
4. Executar fila `action-board.md`.
5. Validar `go-no-go-checklist.md` com @po.
6. Validar `requirements-traceability.md` com @po.
7. Validar `risk-register.md` com @qa.
8. Validar `decision-log.md` e fechar pendencias P-01 a P-04 para Onda 1.
9. Validar `dependency-matrix.md` com @architect, @data-engineer e @qa.
10. Validar `wave-1-po-validation.md` com @po.
11. Validar `wave-1-readiness-review.md` com @po.
12. Validar `wave-1-kickoff.md` com @architect, @data-engineer, @ux-design-expert e @qa.
13. @architect decidir estrategia `pmr_7 + visita 8` vs `pmr_8`.
14. @data-engineer preparar migrations de visita 8 e periodo.
15. @ux-design-expert orientar ou aplicar o fluxo sequencial.
16. @qa usar `wave-1-qa-test-plan.md` como gate.
17. Executar Onda 1 com `epic-orchestration`.

## Ordem Recomendada Depois da Onda 1

1. Validar `wave-2-kickoff.md` com @pm/@po.
2. Validar `wave-2-indicators-mvp.md` com @pm/@po.
3. @data-engineer classificar fontes existentes, derivadas e ausentes.
4. @architect definir view model de planejado x realizado.
5. @ux-design-expert desenhar leitura do dono.
6. @qa usar `wave-2-qa-test-plan.md` como gate.
7. Executar stories CONS-17 a CONS-19.

## Ordem Recomendada Depois da Onda 2

1. Validar `wave-3-kickoff.md` com @pm/@po.
2. Validar `wave-3-routine-notes.md` com @pm/@po.
3. @ux-design-expert ajustar fluxo mobile do vendedor.
4. @dev consolidar validacao de rotina do gerente.
5. @architect definir contrato de notificacoes da puxada diaria.
6. @data-engineer classificar fonte de disciplina.
7. @qa usar `wave-3-qa-test-plan.md` como gate.
8. Executar stories OPS-20 a OPS-23.

## Ordem Recomendada Depois da Onda 3

1. Validar `wave-4-kickoff.md` com @pm/@po.
2. Validar `wave-4-development-notes.md` com @pm/@po.
3. @pm decidir nome final da area e temas MVP da biblioteca.
4. @ux-design-expert seguir `wave-4-ux-brief.md` e reorganizar arquitetura de informacao de Treinamentos para Desenvolvimento.
5. @data-engineer seguir `wave-4-data-rls-notes.md` e definir metadados de conteudo, avaliacoes, sugestoes e RLS.
6. @architect seguir `wave-4-architecture-notes.md` e definir contrato da trilha de novo colaborador e recomendacoes de feedback/PDI.
7. @qa usar `wave-4-qa-test-plan.md` como gate.
8. Executar stories DEV-24 a DEV-27.

## Ordem Recomendada Depois da Onda 4

1. Validar `wave-5-kickoff.md` com @pm/@po.
2. Validar `wave-5-app-readiness-notes.md` com @pm/@po.
3. @pm definir pacote comercial de personalizacao institucional por loja.
4. @data-engineer garantir isolamento multi-tenant de conteudos personalizados.
5. @qa validar `wave-5-qa-test-plan.md` e matriz mobile/PWA dos fluxos criticos.
6. @devops revisar `docs/app-readiness/apple-google-submission-checklist.md` sem credenciais no repositorio.
7. Executar stories APP-28 a APP-31.
