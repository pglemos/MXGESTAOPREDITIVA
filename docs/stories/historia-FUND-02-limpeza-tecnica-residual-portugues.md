# Historia FUND-02: Limpeza tecnica residual em portugues

**Status:** Em andamento
**Agente:** aiox-master
**Prioridade:** ALTA
**Branch:** main

## Contexto

A FUND-01 padronizou o dominio principal, permissoes, rotas centrais e evidencias de visita. Ainda existem nomes tecnicos antigos em areas secundarias e historicas do codigo, como `consulting_*`, `seller_*`, `store_*`, `user_*` e termos equivalentes fora do nucleo principal.

Esses nomes residuais nao bloqueiam a entrega FUND-01, mas precisam de uma story propria para evitar uma mudanca ampla sem mapa completo de impacto.

## User Story

Como equipe MX,
quero remover nomenclaturas tecnicas antigas de modulos secundarios,
para manter o codigo, banco, testes e Edge Functions em portugues tecnico padronizado sem misturar ingles e portugues.

## Escopo

- Mapear ocorrencias residuais de nomes tecnicos em ingles fora do dominio principal migrado na FUND-01.
- Classificar cada ocorrencia como funcional, legado, teste, comentario, fixture ou integracao externa.
- Renomear apenas o que for dominio interno MX.
- Manter marcas, fornecedores e siglas oficiais: Google Calendar, Supabase, Vercel, PDI, PMR, DRE, ROI e RTA.
- Atualizar hooks, paginas, schemas, testes, scripts, Edge Functions, migrations futuras e documentacao impactada.

## Acceptance Criteria

- [x] Inventario residual versionado com ocorrencias e decisao de manter/renomear.
- [x] Comandos e scripts operacionais ativos de consultoria renomeados para portugues sem acento tecnico.
- [ ] Nenhuma referencia funcional interna a `consulting_*`, `seller_*`, `store_*` ou `user_*` permanece sem justificativa.
- [ ] UI continua usando portugues normal, com acentuacao quando apropriado.
- [ ] Codigo e banco novos continuam em portugues sem acento tecnico.
- [ ] Testes, build e E2E passam apos as renomeacoes.
- [ ] File list atualizado antes de concluir.

## Plano de Execucao

1. Rodar auditoria por `rg` nos prefixos antigos e termos correlatos.
2. Separar nomes que pertencem a bibliotecas, fornecedores ou contratos externos.
3. Planejar migrations pequenas e reversiveis quando houver impacto em banco.
4. Atualizar codigo TypeScript, Edge Functions, testes e documentos por area.
5. Rodar gates completos antes de qualquer deploy.

## Plano de Rollback

1. Para alteracoes somente de codigo, reverter o commit da story.
2. Para migrations de banco, criar migration reversa antes do deploy.
3. Se login, RLS, lancamento diario, visitas ou agenda falharem no smoke, interromper deploy e restaurar versao anterior.

## Validacao Obrigatoria

- [x] `npm run validate:structure`
- [ ] `npm run validate:agents`
- [ ] `npm run lint`
- [x] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run test:e2e`

## File List

- `docs/stories/historia-FUND-02-limpeza-tecnica-residual-portugues.md`
- `docs/architecture/inventario-nomenclatura-residual.md`
- `package.json`
- `scripts/README.md`
- `scripts/consultoria_carregar_parametros.ts`
- `scripts/consultoria_importar_fechamento_mensal.ts`
- `scripts/consultoria_gerar_planejamento_estrategico.ts`
- `scripts/consultoria_gerar_resumo_executivo.ts`
- `docs/stories/story-CONS-06-pmr-parameters.md`
- `docs/stories/story-CONS-07-pmr-operational-inputs.md`
- `docs/stories/story-CONS-09-pmr-cli-artifacts.md`
- `docs/stories/story-CONS-11-pmr-full-workflow-sync.md`
