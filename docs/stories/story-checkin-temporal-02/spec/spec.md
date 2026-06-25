# STORY-02 — Check-in Diario Com Semantica Temporal MX

Status: Ready for Review

## Contexto

O plano operacional `v1.3` congela a regra: o vendedor envia hoje, mas a producao declarada se refere ao dia anterior; apenas os agendamentos se referem ao dia atual. A implementacao anterior mudava `reference_date` para hoje depois das 09:45, criando ambiguidade no banco e nos motores downstream.

## Escopo

- Corrigir `calculateReferenceDate` para sempre retornar o dia anterior.
- Registrar se o envio ocorreu dentro ou fora do prazo operacional de 09:30.
- Bloquear edicao de check-in ja enviado apos a janela de correcao das 09:45.
- Exibir bloco explicito de referencia do registro, loja, vendedor, deadline e janela de correcao.
- Adicionar colunas canonicas de status temporal no Supabase live.
- Adicionar teste unitario para a regra de referencia.

## Fora De Escopo

- Reescrever ranking.
- Reescrever painel da loja.
- Disparar notificacoes de atraso.
- Criar rotina de sem registro automatizada.

## Criterios De Aceite

- [x] `reference_date` e sempre o dia anterior.
- [x] `submitted_at` continua representando o momento real do envio.
- [x] Envio depois das 09:30 grava status `late`.
- [x] Edicao de registro existente apos 09:45 e bloqueada no hook.
- [x] Tela mostra explicitamente referencia, loja, vendedor e deadline.
- [x] Teste unitario cobre referencia antes e depois do prazo.
- [x] Migration validada/aplicada no Supabase live e historico reparado.
- [x] Gates locais passam.

## Validacao Supabase Live

- Migration aplicada: `20260407002000_checkin_temporal_status.sql`.
- Historico reparado com `supabase migration repair --status applied 20260407002000`.
- Colunas live confirmadas: `submitted_late`, `submission_status`, `edit_locked_at`.
- Trigger `sync_daily_checkins_canonical` atualizada para calcular `on_time`/`late`.
- Validacao transacional com rollback:
  - `09:30 America/Sao_Paulo` -> `submission_status = on_time`.
  - `09:31 America/Sao_Paulo` -> `submission_status = late`.

## Gates

- `npm run lint`: passou.
- `npm run typecheck`: passou.
- `npm test`: passou, 26 testes.
- `npm run build`: passou.
- `git diff --check`: passou.

## File List

- `docs/stories/story-checkin-temporal-02/spec/spec.md`
- `docs/stories/story-checkin-temporal-02/plan/implementation.yaml`
- `supabase/migrations/20260407002000_checkin_temporal_status.sql`
- `src/hooks/useCheckins.ts`
- `src/hooks/useCheckins.test.ts`
- `src/pages/Checkin.tsx`
- `src/types/database.ts`

## Refactoring & Refinement (2026-06-24)
Refatoração completa do Fechamento Diário (Terminal MX) para atender às novas regras de negócio e melhorias de UI/UX, incluindo a trava temporal e liberação por gestor.

### Novos Critérios de Aceite Implementados
- [x] **Excelente Hierarquia Visual**: Seções divididas em cards independentes com sombras suaves, cores semânticas e ícones.
- [x] **Contadores (Steppers)**: Botões de incremento sutilmente posicionados abaixo do contador de alta legibilidade, removendo a redundância.
- [x] **Tabela Limpa e Sticky**: Tags em pills de status na tabela, primeira coluna (Nome do Cliente) fixa (`position: sticky`) com sombra lateral, e expansão de linha inline.
- [x] **Modal de Cadastro Dividido**: Form dividido em duas seções ("1. Dados do Cliente", "2. Detalhes da Negociação") para menor carga cognitiva.
- [x] **Segmented Controls**: Substituição de select tradicional por botões de seleção direta no modal para Canal, Compareceu, Carro Avaliado, Financiamento e Venda Realizada.
- [x] **Fidelidade de Dados & Máscara**: Telefone com máscara dinâmica em tempo real no input e no banco.
- [x] **Motivo de Perda**: Adicionado "Não compareceu" à lista de opções.
- [x] **Como Funciona a Disciplina**: Modal completo e premium explicativo das regras matemáticas em formato amigável ao vendedor.
- [x] **Cálculo de Score (70/30)**: 70% básico + 30% detalhamento D+1 proporcional aos canais Carteira e Internet.
- [x] **Trava Temporal de Fechamento**: Bloqueio operacional após 09h30, exibindo o botão para "Avisar gerente no WhatsApp" com link seguro de liberação.
- [x] **Cockpit do Gerente**: Rota segura `/liberacao-fechamento` para autenticação e aprovação de fechamento atrasado com aplicação de penalidade de 10% no score final.
- [x] **Histórico**: Inclusão do contador de vendas e status em badge colorido para fechamento pendente/finalizado.

### Novos Arquivos Adicionados ao Fluxo
- `src/features/checkin/hooks/useCheckinPage.ts` (Regras de score, timezone de Brasília, geração de solicitação e persistência)
- `src/features/checkin/sections/CheckinCrmSection.tsx` (Table sticky, modal de cadastro com segmented controls, hidden selects para compatibilidade e máscaras)
- `src/features/checkin/sections/CheckinForm.tsx` (Contadores stepper, card tooltips, modal premium e informativos)
- `src/features/checkin/sections/CheckinHeader.tsx` (Drawer de Histórico de Fechamento com vendas e regularizações)
- `src/pages/LiberacaoFechamento.tsx` (Cockpit seguro de liberação para perfis de gerente, supervisor, administrador e dono)
- `src/App.tsx` (Nova rota associada)

### Refinamentos e Melhorias Solicitadas (2026-06-25)
Novas melhorias de UI/UX e simplificações funcionais aplicadas de acordo com as observações do vendedor:
- [x] **Renomeação de Agendamento D+1**: Renomeado visualmente para **Agendamento para Amanhã** (ou *Agend. p/ Amanhã*) em todos os informativos, cards, modais e tooltips da tela.
- [x] **Sinalização Dinâmica de Ontem**: O indicador de data exibe a palavra **"Ontem"** quando a referência operacional ativa for o dia anterior, melhorando o senso temporal.
- [x] **Aviso de Fechamento Pendente Interativo**: Banner de aviso sobre fechamento anterior pendente agora conta com um botão/link direto ("Clique aqui para regularizar no Histórico") para abrir o modal de Histórico.
- [x] **Barra de Progresso por Pilar**: Inclusão de uma barra de progresso premium, dividida em 4 segmentos que representam os pilares (**Leads, Atendimentos, Agend. Amanhã, Vendas**), que acendem de acordo com o preenchimento diário (filled vs empty).
- [x] **Remoção da Aba Ajuste Técnico**: Simplificação do cabeçalho removendo a aba separada de Ajuste Técnico e botões redundantes de prazo/status.
- [x] **Regularização Retroativa Integrada**: Ao clicar em "Regularizar" (para dias pendentes) ou "Corrigir" (para dias finalizados) no Histórico, um formulário simplificado abre diretamente no modal ("mesma mini tela"). Ele permite preencher os dados dos 4 pilares, escolher o motivo e registrar a justificativa operacional, enviando para aprovação do gestor. Caso o dia seja pendente e não possua fechamento ativo, o sistema cria automaticamente um rascunho placeholder antes de inserir a solicitação.

