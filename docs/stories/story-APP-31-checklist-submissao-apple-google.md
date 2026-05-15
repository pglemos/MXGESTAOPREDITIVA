# Story APP-31 - Checklist de Submissao Apple e Google

**Status:** Implemented - checklist operacional criado  
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 5 - Personalizacao por loja e app readiness  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @devops + @qa  
**Quality Gate:** @qa  
**Prioridade:** Medium

## Contexto

Jose mencionou estimativas de validacao: Apple em cerca de um mes e Google em cerca de duas semanas para primeira validacao. Antes de qualquer envio, o projeto precisa de checklist de requisitos, evidencias e responsabilidades.

## User Story

Como responsavel pelo produto,  
quero um checklist de submissao Apple/Google,  
para saber o que precisa estar pronto antes de enviar o app para avaliacao.

## Acceptance Criteria

- [x] Checklist lista requisitos de conta, bundle/app id, nome, icones, screenshots, politica de privacidade e suporte.
- [x] Checklist lista fluxos que precisam de conta demo por papel.
- [x] Checklist define evidencias obrigatorias de QA.
- [x] Checklist define estrategia para PWA, wrapper nativo ou app nativo.
- [x] Checklist define responsaveis AIOX: @qa para gate, @devops para submissao, @pm/@po para decisao de produto.
- [x] Checklist registra riscos: dados sensiveis, permissao, login, conteudo de terceiros e multi-tenant.

## Regras de Negocio

- Esta story cria readiness documental e operacional; submissao real depende de decisao separada.
- Nenhum segredo, certificado ou credencial deve ser salvo em docs.
- @devops e o unico agente autorizado para push/PR/deploy/publicacao.

## Arquivos Provaveis

- `docs/app-readiness/apple-google-submission-checklist.md`
- `docs/stories/story-APP-31-checklist-submissao-apple-google.md`
- `.github`
- `package.json`
- `vite.config.ts`

## Gates

- [ ] Checklist revisado por @pm, @qa e @devops.
- [x] Sem credenciais ou segredos em artefatos.

## File List

- `docs/stories/story-APP-31-checklist-submissao-apple-google.md`
- `docs/app-readiness/apple-google-submission-checklist.md`
- `docs/app-readiness/mobile-pwa-readiness.md`
