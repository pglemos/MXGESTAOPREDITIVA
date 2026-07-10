# Story MX-BUGFIX-20260710 — Correções reportadas por Mariana

## Status

Done

## Source

Relatos de produção enviados pela usuária em 10/07/2026, referentes a Cadastro de Cliente, Mentor Comercial e Fechamento Diário.

## Acceptance Criteria

- [ ] O modal de cadastro mantém ações de salvar visíveis e permite rolagem em viewport baixo.
- [ ] Telefone brasileiro é formatado na digitação e entradas inválidas não são salvas.
- [ ] Valor previsto é apresentado em moeda brasileira.
- [ ] O modal de alterar próximo passo fica interativo sobre a ficha do cliente.
- [ ] Executar próximo passo não abre WhatsApp automaticamente; o vendedor escolhe ou altera a ação na ficha.
- [ ] Progresso do fechamento só sobe com dados reais do fechamento; confirmar uma etapa vazia não soma pontos.
- [ ] Regularização permite preencher os dados e enviar a solicitação para aprovação sem aplicar o lançamento antes dela.
- [ ] Sino de notificações é validado no Fechamento Diário em produção.

## Dev Agent Record

### Debug Log References

- Produção com perfil vendedor: `/carteira-clientes` e `/terminal-mx`.
- Reproduções: corpo do modal sem `min-h-0`; sobreposição da ficha interceptando o modal `Alterar próximo passo`; confirmação de etapa vazia persistindo progresso no estado local.
- A política de regularização já permite a solicitação antes da aprovação: os valores seguem como `requested_values` para a RPC e só são aplicados pelo gestor.
- Produção após deploy `69ff6fdc`: modal de cadastro validado em `390x700` com footer visível; máscara de telefone, BRL e uma única opção `Em andamento` confirmadas. `Executar próximo passo` abriu a ficha; a sugestão `Enviar WhatsApp` alterou o campo no modal ativo. Em `/terminal-mx`, sino abriu o menu, etapa vazia preservou `0%` e a regularização expôs inputs editáveis sem submissão.

### File List

- `src/components/organisms/Modal.tsx`
- `src/features/checkin/sections/CheckinHeader.tsx`
- `src/features/checkin/sections/FluxoFechamento.tsx`
- `src/features/checkin/sections/RegularizarFechamentoDrawer.tsx`
- `src/features/crm/AlterarProximoPasso.tsx`
- `src/features/crm/CarteiraClientes.container.tsx`
- `src/lib/schemas/crm.schema.ts`
- `src/test/organisms/Modal.test.tsx`
- `src/features/checkin/sections/FluxoFechamento.test.tsx`
- `src/features/checkin/sections/RegularizarFechamentoDrawer.test.tsx`
- `src/features/crm/AlterarProximoPasso.test.tsx`
- `src/features/crm/CarteiraClientes.container.test.tsx`
- `src/lib/schemas/crm.schema.test.ts`
- `docs/stories/story-MX-BUGFIX-20260710-mariana-cadastro-mentor-fechamento.md`

### Completion Notes List

- Regressões focadas: 27 testes passaram.
- Gates completos: `npm test` (719 testes), `npm run lint` (sem erros; 19 avisos preexistentes), `npm run typecheck` e `npm run build` passaram.
- Revisão local: `git diff --check` passou. O CodeRabbit está instalado, mas não aceita revisão não interativa sem chave própria; nenhuma credencial foi adicionada.
- Publicado em `main` no commit `69ff6fdc`; os checks Gitleaks, Atomic Design e ESLint a11y concluíram com sucesso e o deploy Vercel de produção ficou pronto.
- Smoke autenticado concluído sem salvar alterações nos dados reais.
- 2026-07-10 (revalidação): o fluxo foi conferido com dados preenchidos antes do envio; o botão ficou habilitado sem liberação prévia. A interface agora explicita a aprovação pelo gerente e remove a consulta residual que não interferia mais no fluxo canônico.
- Produção após `87a746be`: em `/terminal-mx` com perfil da Mariana, lançamento, motivo e justificativa foram preenchidos antes da aprovação; `Solicitar aprovação do gerente` ficou habilitado. A tela foi fechada sem submissão e sem alterar dados reais.

### Change Log

- 2026-07-10: Corrige cadastro, mentor comercial e fluxo de fechamento relatados por Mariana; adiciona cobertura de regressão.
- 2026-07-10: Validação de produção concluída e story encerrada.
- 2026-07-10: Clarifica e protege o fluxo de solicitação ao gerente com dados já preenchidos; aguarda publicação e novo smoke de produção.
- 2026-07-10: Publicação e smoke de produção concluídos para a solicitação de aprovação com dados preenchidos.
