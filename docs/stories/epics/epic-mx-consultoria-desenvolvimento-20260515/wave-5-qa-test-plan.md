# Wave 5 QA Test Plan

**Status:** Draft para @qa  
**Onda:** 5 - Personalizacao por loja e app readiness  
**Stories:** APP-28, APP-29, APP-30, APP-31

## Objetivo

Validar que personalizacao por loja respeita multi-tenant e que app readiness cobre os fluxos principais antes de qualquer submissao Apple/Google.

## Matriz de Papeis

| Papel | Deve conseguir | Nao deve conseguir |
|---|---|---|
| Vendedor | Ver conteudo institucional da propria loja e fluxos mobile principais. | Ver conteudo de outra loja. |
| Gerente | Ver/acompanhar conteudos da propria loja e trilhas da equipe. | Gerenciar conteudo de outra loja. |
| Dono/lojista | Ver conteudos institucionais da propria loja, se produto liberar. | Acessar area editorial MX. |
| Admin/admin master MX | Administrar conteudos, readiness e auditoria. | Salvar credenciais em docs/git. |
| DevOps | Validar checklist de publicacao. | Submeter app sem QA gate. |

## Cenarios Funcionais

### APP-28

- [ ] Admin MX cadastra conteudo institucional vinculado a uma loja.
- [ ] Gerente/dono ve somente conteudo da propria loja.
- [ ] Vendedor ve somente conteudo da propria loja.
- [ ] Trilha de novo colaborador inclui conteudo institucional quando disponivel.
- [ ] Trilha padrao funciona mesmo sem personalizacao.
- [ ] Conteudo personalizado e distinguido de conteudo padrao MX.

### APP-29

- [ ] Admin MX marca conteudo como interno, especialista ou fornecedor.
- [ ] Conteudo possui tema, publico, fonte, status e data de revisao.
- [ ] Conteudo pausado nao apaga progresso historico.
- [ ] Conteudo substituido preserva historico.
- [ ] Vendedor nao ve metadados administrativos sensiveis da fonte.

### APP-30

- [ ] Login/logout mobile validado.
- [ ] Check-in diario mobile validado.
- [ ] Notificacoes mobile validadas.
- [ ] Desenvolvimento/Treinamentos mobile validado.
- [ ] Agenda/visita admin validada.
- [ ] Dashboard dono mobile validado.
- [ ] Manifest/PWA revisado.
- [ ] Instalabilidade PWA validada quando aplicavel.

### APP-31

- [ ] Checklist Apple/Google possui itens de conta, bundle/package, icones, screenshots, privacidade e suporte.
- [ ] Checklist lista contas demo por papel.
- [ ] Checklist aponta evidencias obrigatorias de QA.
- [ ] Checklist nao contem credenciais, certificados, tokens ou segredos.
- [ ] @qa, @pm e @devops revisaram o checklist.

## Testes Tecnicos

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] RLS/access smoke para conteudo por loja.
- [ ] Browser smoke mobile para vendedor.
- [ ] Browser smoke mobile para dono.
- [ ] Browser smoke desktop para admin MX.
- [ ] PWA installability check.
- [ ] Secret scan manual em docs alterados.

## Dados de Teste Sugeridos

- Loja A com conteudo institucional.
- Loja B sem conteudo institucional.
- Vendedor da Loja A.
- Vendedor da Loja B.
- Gerente da Loja A.
- Dono da Loja A.
- Admin MX.
- Conteudo fornecedor ativo.
- Conteudo fornecedor pausado.

## Criterio de Falha Bloqueadora

- Conteudo institucional vaza entre lojas.
- Checklist contem segredo, token, certificado ou credencial.
- Submissao real e iniciada sem QA gate.
- Fluxo mobile principal fica inutilizavel.
- Conteudo de terceiro aparece sem status editorial.
