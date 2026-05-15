# Wave 5 Kickoff - Personalizacao por Loja e App Readiness

**Status:** Ready for PO review  
**Onda:** 5  
**Stories:** APP-28, APP-29, APP-30, APP-31  
**Objetivo:** preparar personalizacao institucional por loja e readiness mobile/PWA, sem submeter app antes de QA e DevOps aprovarem.

## Resultado Esperado

Ao final da Onda 5, a equipe MX deve conseguir demonstrar:

1. Conteudo institucional vinculado a loja, sem vazamento entre tenants.
2. Conteudos de especialistas/fornecedores com status editorial.
3. Fluxos criticos revisados para mobile/PWA.
4. Checklist Apple/Google preenchido, sem credenciais no repositorio.
5. Decisao clara entre PWA, wrapper nativo ou app nativo antes de submissao real.

## Ordem de Execucao

1. `APP-30` - App readiness mobile e PWA.
2. `APP-31` - Checklist de submissao Apple e Google.
3. `APP-28` - Trilha institucional personalizada por loja.
4. `APP-29` - Curadoria de conteudos com especialistas e fornecedores.

## Por que essa ordem

- `APP-30` valida se os fluxos principais estao prontos para uso mobile.
- `APP-31` transforma readiness em checklist operacional de submissao.
- `APP-28` depende da base de biblioteca/trilha da Onda 4 e exige RLS forte.
- `APP-29` amplia curadoria sem virar marketplace.

## Decisoes que Precisam Estar Fechadas

| Decisao | Dono | Recomendacao |
|---|---|---|
| PWA, wrapper nativo ou app nativo | @devops + @pm | Validar PWA primeiro. |
| Pacote comercial de personalizacao | @pm + @po | Tratar como add-on, sem bloquear trilha padrao. |
| Modelo multi-tenant de conteudo por loja | @data-engineer | Conteudo personalizado sempre vinculado a loja. |
| Conteudos de terceiros | @pm + @qa | Exigir status editorial e aprovacao de uso. |
| Submissao real Apple/Google | @devops + @qa + @pm | Fora do MVP ate checklist e evidencias passarem. |

## Definition of Ready

- [ ] Onda 4 entregou base de biblioteca/trilha suficiente.
- [ ] Estrategia PWA/wrapper/nativo esta definida.
- [ ] @qa aprovou matriz mobile/PWA.
- [ ] @data-engineer aprovou isolamento multi-tenant de conteudo por loja.
- [ ] @devops aprovou checklist sem segredos.
- [ ] @pm/@po aprovaram pacote comercial de personalizacao.

## Definition of Done

- [ ] APP-28 a APP-31 atualizadas com checklist e File List.
- [ ] `npm run lint` passou quando houver codigo.
- [ ] `npm run typecheck` passou quando houver codigo.
- [ ] `npm test` passou quando houver codigo.
- [ ] Conteudo institucional nao vaza entre lojas.
- [ ] PWA/mobile readiness revisado.
- [ ] Checklist Apple/Google revisado por @qa e @devops.
- [ ] Nenhum segredo, token, certificado ou credencial foi salvo em docs/git.

## Arquivos de Referencia

- `docs/stories/story-APP-28-trilha-institucional-personalizada-loja.md`
- `docs/stories/story-APP-29-curadoria-conteudos-especialistas-fornecedores.md`
- `docs/stories/story-APP-30-app-readiness-mobile-pwa.md`
- `docs/stories/story-APP-31-checklist-submissao-apple-google.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-5-app-readiness-notes.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-5-qa-test-plan.md`
- `docs/app-readiness/apple-google-submission-checklist.md`
