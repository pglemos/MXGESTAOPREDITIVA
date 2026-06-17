# Story MX-EV5-20260617 - Conteudo Recomendado por Funil Feedback PDI

## Status

Ready for Review

## Story

**As a** vendedor,
**I want** receber conteudos recomendados por funil, feedback e PDI,
**so that** eu estude o conteudo mais relevante para minha dificuldade atual.

## Source Requirements

- PRD EV-5.5: recomendacoes cruzam Funil (gargalo), Feedback (pontos de desenvolvimento) e PDI (competencias baixas).
- PRD EV-5.5: card "Recomendado para voce" na Visao Geral.
- PRD EV-5.5: camada de recomendacao por regras, usando sinais de funil, devolutivas e PDI.
- PRD EV-5.5: explicacao da recomendacao deve ficar visivel ao usuario.

## Acceptance Criteria

1. A camada de recomendacao gera recomendacao de origem `funil` a partir do principal gargalo de cadencia/funil.
2. Recomendacoes persistidas de `feedback` e `pdi` continuam aparecendo antes do fallback generico.
3. Cada card recomendado exibe origem legivel e motivo/explicacao visivel.
4. Conteudo recomendado resolve o treinamento pelo `training_id` ou pelo tema inferido.
5. Lista evita duplicidade de treinamento quando funil, feedback e PDI apontam para o mesmo conteudo.
6. Banco aceita `source_type = 'funil'` para recomendacoes persistidas futuras.
7. Gates obrigatorios passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- Reutilizar `buildCadenciaAnalytics`/`useCadenciaAnalytics` de EV-2.6 para o sinal de funil.
- Nao introduzir IA; recomendacao deve ser deterministica por regras.
- A recomendacao de funil pode ser sintetica na UI enquanto a migration abre o contrato para persistencia futura.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.
- Template/checklist formais do agente SM (`story-tmpl.yaml`, `story-draft-checklist.md`) nao existem neste checkout; usar formato local das stories `story-MX-EV*`.
- Arquivos `devLoadAlwaysFiles` e fallbacks definidos em `.aiox-core/core-config.yaml` nao existem neste checkout; usar padroes observados no codigo.

## Tasks / Subtasks

- [x] Criar testes vermelhos para helper de recomendacao por funil e cards explicaveis (AC: 1-5).
- [x] Criar teste de migration aceitando `source_type = 'funil'` (AC: 6).
- [x] Implementar helper deterministico de cards recomendados (AC: 1-5).
- [x] Integrar funil/feedback/PDI na Visao Geral de Treinamentos (AC: 1-5).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 7).

## File List

- `docs/stories/story-MX-EV5-20260617-conteudo-recomendado-funil-feedback-pdi.md`
- `src/lib/development-content.ts`
- `src/lib/development-content.test.ts`
- `src/lib/development-recommendations-funil-migration.test.ts`
- `src/pages/VendedorTreinamentos.tsx`
- `src/pages/VendedorTreinamentos.test.tsx`
- `src/hooks/useTrainings.ts`
- `supabase/migrations/20260617005000_development_recommendations_funil_source.sql`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- Template/checklist do SM ausentes no checkout; story segue formato local ja usado em `docs/stories/story-MX-EV*.md`.
- Arquivos `docs/framework/*` e fallbacks `docs/architecture/padroes-de-codigo.md`, `docs/architecture/pilha-tecnologica.md`, `docs/architecture/arvore-de-origem.md` ausentes no checkout.
- Red: `bun test src/lib/development-content.test.ts src/lib/development-recommendations-funil-migration.test.ts src/pages/VendedorTreinamentos.test.tsx` falhou por helper/migration ausentes e UI sem origem/motivo.
- Focused pass: `bun test src/lib/development-content.test.ts src/lib/development-recommendations-funil-migration.test.ts src/pages/VendedorTreinamentos.test.tsx` -> 15 pass, 0 fail.
- Gate: `npm run typecheck` -> pass.
- Gate: `npm run lint` -> pass; `lint-tokens-ast` escaneou 516 arquivos.
- Gate: `npm test` -> 529 pass, 0 fail.
- Gate: `npm run build` -> pass.
- Gate: `git diff --check` -> pass.
- Extra: `command -v wsl` e `command -v coderabbit` sem binarios disponiveis no ambiente.
- Ajuste hierarquia final Treinamentos: `bun test src/pages/VendedorTreinamentos.test.tsx` -> 5 pass, 0 fail.
- Gate pos-ajuste: `npm run typecheck` -> pass.
- Gate pos-ajuste: `npm run lint` -> pass; `lint-tokens-ast` escaneou 522 arquivos.
- Gate pos-ajuste: `npm test` -> pass.
- Gate pos-ajuste: `npm run build` -> pass.
- Ajuste aba Biblioteca: `bun test src/pages/VendedorTreinamentos.test.tsx` -> 7 pass, 0 fail.
- Gate Biblioteca: `npm run typecheck` -> pass.
- Gate Biblioteca: `npm run lint` -> pass; `lint-tokens-ast` escaneou 522 arquivos.
- Gate Biblioteca: `npm test` -> 541 pass, 0 fail.
- Gate Biblioteca: `npm run build` -> pass.
- Ajuste aba Trilha: `bun test src/pages/VendedorTreinamentos.test.tsx` -> 9 pass, 0 fail.
- Gate Trilha: `npm run typecheck` -> pass.
- Gate Trilha: `npm run lint` -> pass; `lint-tokens-ast` escaneou 522 arquivos.
- Gate Trilha: `npm test` -> pass.
- Gate Trilha: `npm run build` -> pass.
- Gate Trilha: `git diff --check` -> pass.
- Ajuste aba Aulas ao Vivo: `bun test src/pages/VendedorTreinamentos.test.tsx` -> 10 pass, 0 fail.
- Gate Aulas ao Vivo: `npm run typecheck` -> pass.
- Gate Aulas ao Vivo: `npm run lint` -> pass; `lint-tokens-ast` escaneou 522 arquivos.
- Gate Aulas ao Vivo: `npm test` -> pass.
- Gate Aulas ao Vivo: `npm run build` -> pass.
- Gate Aulas ao Vivo: `git diff --check` -> pass.
- Ajuste aba Provas: `bun test src/pages/VendedorTreinamentos.test.tsx` -> 10 pass, 0 fail.
- Gate Provas: `npm run typecheck` -> pass.
- Gate Provas: `npm run lint` -> pass; `lint-tokens-ast` escaneou 522 arquivos.
- Gate Provas: `npm test` -> pass.
- Gate Provas: `npm run build` -> pass.
- Gate Provas: `git diff --check` -> pass.

### Completion Notes

- Helper `buildRecommendedDevelopmentCards` consolida feedback, PDI, funil e fallback sem duplicar treinamento.
- Helper `buildFunnelDevelopmentRecommendation` transforma o principal gargalo de cadencia/funil em recomendacao deterministica com motivo visivel.
- Visao Geral de Treinamentos agora consome `useOportunidades` + `useCadenciaAnalytics` e mostra origem/motivo nos cards recomendados.
- Recomendacoes persistidas continuam priorizadas; funil sintetico entra depois e fallback generico so completa espacos restantes.
- Migration amplia o contrato de `recomendacoes_desenvolvimento.source_type` para aceitar `funil` sem alterar dados existentes.
- Tela Treinamentos agora preserva a hierarquia final: abas antes dos indicadores, acoes obrigatorias antes de recomendados, trilha obrigatoria fixa na lateral, banner de prova no rodape e aba Provas com regras de questoes, nota minima, status e pontuacao.
- Ajuste Tecnico permanece fora de Treinamentos, conforme regra do anexo; deve pertencer ao Terminal MX.
- Aba Biblioteca agora tem banner proprio antes dos indicadores, KPIs especificos da biblioteca, categorias fixas, cards com tipo/status/classificacao/pontuacao, lateral com trilha/sugestoes/sugestao/vistos recentemente e bloco "Para aplicar hoje".
- CTA "Aplicar na carteira" direciona para `/carteira-clientes?filtro=sem-resposta`; modal de sugestao coleta tema, categoria, necessidade, exemplo, prioridade e anexo opcional.
- Aba Trilha agora diferencia a area obrigatoria com cards de proxima acao, prova pendente e prazo/ciclo, modulos expansivos com tabela interna e modulo vazio como "Conteudos em preparacao".
- Lateral da Trilha mostra contexto do nivel, progresso, pontos, proxima conquista e vinculo PDI/Feedback; o link "Entenda como seu nivel e definido" abre modal explicativo.
- Bloco final da Trilha explicita certificado, conquista de conclusao e pontos no Score MX desbloqueados ao concluir.
- Aba Aulas ao Vivo agora usa indicadores proprios, card de proxima aula, prova pendente com 5 questoes/70%, agenda lateral, gravacoes com status, fluxo de 5 etapas, historico recente, banner de certificados e pontuacao mensal.
- Indicadores genericos da Trilha ficam ocultos na aba Aulas ao Vivo; a aba permanece depois de Trilha e antes de Provas.
- Aba Provas agora usa indicadores proprios, card de proxima prova obrigatoria, regras 5 questoes/70%/1 tentativa, fluxo de 5 etapas, metricas recentes, tabela "Minhas provas", lateral de agenda/resultados/pontuacao e banner de certificados.
- Prova reprovada mostra somente "Ver resultado" com tentativa 1/1, sem acao "Refazer", mantendo a regra de tentativa unica.

### Change Log

- 2026-06-17: Story criada a partir de PRD EV-5.5 e dependencias EV-2.6, EV-6 e EV-7.
- 2026-06-17: Implementado conteudo recomendado explicavel por feedback/PDI/funil, migration e validacao completa.
- 2026-06-17: Ajustada tela Treinamentos conforme hierarquia final aprovada e ampliada cobertura da tela.
- 2026-06-17: Ajustada aba Biblioteca como area livre, com indicadores proprios, lateral completa e modal de sugestao.
- 2026-06-17: Ajustada aba Trilha como area obrigatoria, com acoes principais, tabela de conteudos, lateral de progresso/pontos e modal de definicao de nivel.
- 2026-06-17: Ajustada aba Aulas ao Vivo como fluxo de inscricao, participacao, prova, presenca validada, pontos, gravacoes e certificados.
- 2026-06-17: Ajustada aba Provas com indicadores proprios, prova obrigatoria, regras, tabela de provas, lateral e bloqueio de refazer reprovada.
