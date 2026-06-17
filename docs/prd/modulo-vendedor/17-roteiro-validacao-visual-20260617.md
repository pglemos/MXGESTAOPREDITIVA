# Roteiro de Validacao Visual — Daniel e Jose

**Data:** 2026-06-17  
**Escopo:** validacao visual do que foi implementado em 2026-06-16 e 2026-06-17 apos a reuniao do Modulo Vendedor.  
**Ambiente local validado:** `http://localhost:3001/`  
**Credenciais:** usar os logins/senhas fornecidos no briefing operacional. Nao registrar senhas neste arquivo.

## Evidencia Tecnica Ja Executada

- `npm run typecheck` — passou.
- `npm run lint` — passou.
- `npm test` — 534 testes passando, 0 falhas.
- `npm run build` — passou.
- `git diff --check` — passou.
- Smoke visual Playwright local: 30 rotas acessiveis com vendedor, gerente, dono e Admin MX.
- Evidencias do smoke: `output/playwright/role-visual-smoke/results.json` e screenshots em `output/playwright/role-visual-smoke/`.

**Ressalva QA:** as telas abriram sem redirect indevido para login e sem bloqueio de permissao, mas o console registrou chamadas API/recurso com status 400/404 em todas as rotas. Para validacao executiva, isso nao bloqueia a navegacao visual; para aceite tecnico final, revisar se esses 400/404 sao estados vazios esperados, dados ausentes no Supabase ou endpoints que precisam de seed/configuracao.

## O Que Foi Feito em 2026-06-16

### EV-1 — Fechamento Diario e Cadastro Rico

**Validar com login de vendedor.**

Rotas:
- `/lancamento-diario`
- `/carteira-clientes`
- `/meu-funil`

O que olhar:
- Fechamento Diario com cards de leads, atendimentos, agendamentos D+1 e formulario oficial D-1 preservado.
- Cadastro opcional de cliente/oportunidade com tipo de veiculo, sinal, financiamento, carro na troca, status de negociacao, data de venda/perda e motivo de perda.
- Trava de fechamento quando existe acao obrigatoria de feedback pendente.

### EV-2 — Carteira, Cadencia e Analytics

**Validar com login de vendedor e gerente.**

Rotas:
- Vendedor: `/carteira-clientes`, `/central-execucao`, `/relatorios-vendedor`
- Gerente: `/funil-vendas`, `/relatorios/performance-vendedor`

O que olhar:
- Carteira com clientes reais por canal e status.
- Cadencia configuravel baseada em fluxo versionado.
- Status de acao de cadencia: Feito, Nao feito, Aguardando.
- Reagendamento automatico de tentativas.
- Analytics de gargalo e relatorios do vendedor.

### EV-3 — Central de Execucao e Rotina Automatica

**Validar com login de vendedor e gerente.**

Rotas:
- Vendedor: `/central-execucao`
- Gerente: `/rotina`, `/home`

O que olhar:
- Rotina do dia auto-preenchida por eventos reais.
- Acoes sugeridas por horario.
- Acoes de feedback aparecendo na Central.
- Visao do gerente para acompanhar rotina/pendencias.

### EV-4 — Funil por Canal Real

**Validar com login de vendedor, gerente e dono.**

Rotas:
- Vendedor: `/meu-funil`
- Gerente: `/funil-vendas`
- Dono: `/lojas` e dashboard da loja

O que olhar:
- Plano de funil ponderado por vendas reais por canal.
- Canais sem operacao ocultos quando aplicavel.
- Mix manual do perfil usado antes do historico quando configurado.
- Indicadores de meta, ritmo, conversao e falta por canal.

### EV-5 — Trilha Automatica por Maturidade

**Validar com login de vendedor, gerente, dono e Admin MX.**

Rotas:
- Vendedor: `/treinamentos`, `/trilhas`, `/perfil`
- Gerente/Dono/Admin: `/treinamentos`

O que olhar:
- Nivel sugerido N1-N4 com base em tempo de mercado, experiencia declarada e cargo.
- Trilha obrigatoria separada da biblioteca livre.
- Autoatribuicao da trilha de maturidade quando nao existe trilha ativa.

### EV-6 — Feedback Estruturado, Acoes e Autonomo

**Validar com login de vendedor, gerente e Admin MX.**

Rotas:
- Vendedor: `/devolutivas`, `/central-execucao`, `/lancamento-diario`
- Gerente/Admin: `/devolutivas`

O que olhar:
- Caso/motivo obrigatorio no feedback do gerente.
- Banco de acoes selecionaveis nos modais de feedback.
- Acao de feedback virando tarefa na Central.
- Feedback sistemico/autonomo quando houver gargalo elegivel.
- Badge de pendencias no menu de vendedor.

### EV-7 — PDI com Evolucao e Autoavaliacao

**Validar com login de vendedor, gerente, dono e Admin MX.**

Rota:
- `/pdi`

O que olhar:
- Evolucao temporal das notas por competencia.
- Autoavaliacao visivel apenas para vendedor autonomo.
- Vendedor de loja continua no fluxo de avaliacao do gestor.

### EV-8 e EV-12 — Perfil, Vinculo e Remuneracao

**Validar com login de vendedor, gerente, dono e Admin MX.**

Rotas:
- Vendedor: `/perfil`, `/minha-remuneracao`, `/meu-funil`
- Gerente/Dono/Admin: `/configuracoes`, `/configuracoes/remuneracao`

O que olhar:
- Campos de maturidade no Meu Perfil.
- Fonte canonica de vinculo: loja vs autonomo.
- Remuneracao configuravel por fixo, percentual, categoria de veiculo, patamar, equipe e bonus.
- Oportunidades de carreira ocultas para vendedor de loja.

## O Que Foi Feito em 2026-06-17

### Conteudo Recomendado por Funil, Feedback e PDI

**Validar com login de vendedor, gerente, dono e Admin MX.**

Rota:
- `/treinamentos`

O que olhar:
- Recomendacoes explicaveis de desenvolvimento.
- Origem da recomendacao visivel: funil, feedback ou PDI.
- Sem duplicar conteudos ja recomendados.

### Tipografia Leve nas Telas do Vendedor

**Validar com login de vendedor.**

Rotas:
- `/home`
- `/lancamento-diario`
- `/central-execucao`
- `/carteira-clientes`
- `/meu-funil`
- `/devolutivas`
- `/pdi`
- `/treinamentos`
- `/perfil`

O que olhar:
- Reducao de `font-black` em componentes atomicos e telas do vendedor.
- Botao, badge e typography com peso visual mais leve.
- Layout ainda legivel em desktop e mobile.

### Form D-1 Derivado Automaticamente do CRM

**Validar com login de vendedor.**

Rota:
- `/lancamento-diario`

O que olhar:
- Quando nao existe lancamento salvo para a data, o formulario D-1 recebe valores derivados do CRM.
- Fontes esperadas:
  - `clientes.created_at` -> leads D-1.
  - `atendimentos.data` -> visitas D-1.
  - `oportunidades.closed_at` com `etapa='ganho'` -> vendas por canal.
  - `agendamentos.data_hora` em D0 (`referenceDate + 1`) -> agenda carteira/internet.
- Campos derivados podem ser sobrescritos pelo vendedor antes de salvar.
- Campos derivados aparecem com indicacao visual "via CRM" quando houver dado.

## Roteiro por Perfil

### Vendedor

Login: `vendedor@mxgestaopreditiva.com.br`

Validar:
1. `/home` — Meu Dia, meta, ranking, feedbacks e atalhos.
2. `/lancamento-diario` — Fechamento Diario, Form D-1 derivado do CRM, cadastro rico e trava de feedback.
3. `/central-execucao` — rotina auto-preenchida, cadencia e acoes de feedback.
4. `/carteira-clientes` — carteira, cadencia, status e novo cliente.
5. `/meu-funil` — plano de funil por canal real e recomendacoes.
6. `/devolutivas` — feedbacks recebidos, pendencias e responsavel sistemico quando aplicavel.
7. `/pdi` — evolucao e autoavaliacao quando o vinculo permitir.
8. `/treinamentos` e `/trilhas` — trilha N1-N4 e conteudo recomendado.
9. `/perfil` — maturidade, jornada, mix de canais e vinculo.

### Gerente

Login: `gerente@mxgestaopreditiva.com.br`

Validar:
1. `/home` — cockpit da loja.
2. `/rotina` — acompanhamento operacional da rotina.
3. `/funil-vendas` — funil da equipe.
4. `/devolutivas` — registro de feedback com caso/motivo e banco de acoes.
5. `/pdi` — acompanhamento dos PDIs.
6. `/treinamentos` — desenvolvimento da equipe.
7. `/relatorio-matinal` — leitura gerencial consolidada.

### Dono

Login: `dono@mxgestaopreditiva.com.br`

Validar:
1. `/lojas` — entrada para dashboards de loja.
2. Dashboard da loja — Central MX, alertas, planejamento, resultados e departamentos.
3. `/treinamentos` — visao de desenvolvimento.
4. `/devolutivas` — visao de feedbacks.
5. `/pdi` — acompanhamento de desenvolvimento.
6. `/relatorio-matinal` — leitura executiva.
7. `/configuracoes` — dados de perfil/configuracao permitidos ao papel.

### Admin MX

Login: `synvollt@gmail.com`

Validar:
1. `/painel` — painel geral interno.
2. `/lojas` — gestao de lojas e acesso aos dashboards.
3. `/consultoria/clientes` — CRM de consultoria.
4. `/agenda` — agenda administrativa.
5. `/treinamentos` — gestao/visao de desenvolvimento.
6. `/devolutivas` — visao administrativa de feedback.
7. `/configuracoes` — configuracoes gerais.
8. `/auditoria` — diagnostico operacional.
9. `/simulacao/vendedor`, `/simulacao/gerente`, `/simulacao/dono` — validar experiencia por perfil sem trocar usuario.

## Resultado do Smoke Visual Local

Todas as rotas abaixo abriram com o perfil correto, sem redirect para login e sem tela de permissao negada:

| Perfil | Rotas validadas |
|--------|------------------|
| Vendedor | `/home`, `/lancamento-diario`, `/central-execucao`, `/carteira-clientes`, `/meu-funil`, `/devolutivas`, `/pdi`, `/treinamentos`, `/perfil` |
| Gerente | `/home`, `/rotina`, `/funil-vendas`, `/devolutivas`, `/pdi`, `/treinamentos`, `/relatorio-matinal` |
| Dono | `/lojas`, `/treinamentos`, `/devolutivas`, `/pdi`, `/relatorio-matinal`, `/configuracoes` |
| Admin MX | `/painel`, `/lojas`, `/consultoria/clientes`, `/agenda`, `/treinamentos`, `/devolutivas`, `/configuracoes`, `/auditoria` |

## Criterio de Aceite Visual

Daniel e Jose podem considerar a validacao visual aprovada quando:

1. Os quatro perfis acessam as rotas do roteiro sem cair em login ou permissao indevida.
2. O vendedor consegue ver o fluxo ponta a ponta: Meu Dia -> Fechamento Diario -> Central -> Carteira -> Funil -> Feedback -> PDI -> Treinamentos -> Perfil.
3. O gerente consegue visualizar rotina, funil, devolutivas, PDI e treinamentos da equipe.
4. O dono consegue entrar por Lojas e enxergar o painel executivo da loja.
5. O Admin MX consegue acessar painel, lojas, consultoria, agenda, configuracoes e simulacao por perfil.
6. Os dados vazios aparecem como estado honesto, sem mocks ou numeros fake.
7. Eventuais erros 400/404 do console sao classificados: esperado por ausencia de dados/configuracao ou bug a corrigir antes do aceite tecnico final.
