# Apple/Google Submission Readiness Checklist

**Status:** Operational readiness checklist  
**Origem:** Onda 5 - EPIC-MX-CONS-DEV-20260515  
**Responsaveis:** @pm, @qa, @devops  
**Regra:** nao registrar credenciais, certificados, tokens ou segredos neste arquivo.

## Decisao de Empacotamento

- [ ] Produto decidiu entre PWA, wrapper nativo ou app nativo.
- [ ] Escopo de primeira publicacao foi aprovado por @pm/@po.
- [ ] Fluxos obrigatorios da primeira publicacao estao listados.
- [ ] Limitacoes conhecidas foram registradas.
- [ ] `docs/app-readiness/mobile-pwa-readiness.md` foi revisado antes de decisao nativa.

## Identidade do App

- [ ] Nome publico definido.
- [ ] Descricao curta definida.
- [ ] Descricao longa definida.
- [ ] Categoria definida.
- [ ] URL de suporte definida.
- [ ] Politica de privacidade publicada.
- [ ] Termos de uso publicados, se necessario.
- [ ] Icones preparados nos tamanhos exigidos.
- [ ] Screenshots preparados para os tamanhos exigidos.

## Contas e Acessos

- [ ] Conta Apple Developer ativa.
- [ ] Conta Google Play Console ativa.
- [ ] Bundle ID / package name definido.
- [ ] Responsavel por certificados/perfis definido fora do repositorio.
- [ ] Conta demo de vendedor criada.
- [ ] Conta demo de gerente criada.
- [ ] Conta demo de dono criada.
- [ ] Conta demo de admin MX criada, se exigida pela revisao.

## QA Obrigatorio

- [ ] Login/logout.
- [ ] Recuperacao ou troca de senha.
- [ ] Check-in diario mobile.
- [ ] Notificacoes.
- [ ] Desenvolvimento/Treinamentos.
- [ ] PDI/feedback quando disponivel para o papel.
- [ ] Agenda/visita de consultoria para admin MX.
- [ ] Dashboard do dono.
- [ ] Sem overflow horizontal em mobile.
- [ ] Sem texto cortado em botoes principais.
- [ ] RLS smoke por papel.
- [ ] Sem dados de outra loja aparecendo.

## PWA

- [x] Manifest revisado.
- [x] Nome e short_name revisados.
- [x] Theme color revisado.
- [ ] Icones de PWA revisados visualmente em tamanhos de loja.
- [ ] Instalabilidade validada.
- [ ] Service worker validado em build de producao.
- [x] Comportamento offline/degradado documentado em `mobile-pwa-readiness.md`.

## Privacidade e Seguranca

- [ ] Dados pessoais descritos na politica de privacidade.
- [ ] Uso de dados Google descrito, se Google Calendar continuar no app.
- [ ] Nenhum segredo em frontend ou docs.
- [ ] Tokens e certificados fora do repositorio.
- [ ] Logs nao expoem PII sensivel.
- [ ] Conteudo personalizado por loja respeita multi-tenant.

## Conteudo de Terceiros

- [ ] Direitos de uso de videos/imagens confirmados.
- [ ] Conteudos de fornecedores revisados.
- [ ] Conteudos institucionais de loja aprovados pelo cliente.
- [ ] Canal de reporte/suporte definido.

## Evidencias para Gate

- [ ] Link do ambiente testado.
- [ ] Commit/branch testado.
- [ ] Matriz de papeis testada.
- [ ] Prints ou videos dos fluxos principais.
- [ ] Resultado de `npm run lint`.
- [ ] Resultado de `npm run typecheck`.
- [ ] Resultado de `npm test`.
- [ ] Resultado de `npm run build`.
- [ ] Registro de riscos residuais.

## Gate Final

- [ ] @qa aprovou readiness.
- [ ] @pm/@po aprovou escopo.
- [ ] @devops aprovou estrategia de publicacao.
- [ ] Nao ha credenciais pendentes em docs ou git.
