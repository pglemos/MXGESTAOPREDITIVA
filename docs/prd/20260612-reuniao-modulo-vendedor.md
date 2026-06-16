# Reunião Módulo Vendedor — 12/06/2026 (Pedro, Daniel, Mariane)

Decisões e requisitos extraídos da call. Status: ✅ já existe no sistema · 🔧 ajuste · 🆕 novo · 🔮 futuro/estratégico.

## 1. Fechamento Diário e cadastro de cliente

- ✅ Cadastro rico do cliente (sinal, financiamento aprovado, venda realizada, carro avaliado) — campos existem em `oportunidades`.
- 🔧 **Motivação**: esses campos alimentam o cálculo de comissão (lojistas comissionam por faturamento/percentual/valor vendido, não só por unidade). O motor de remuneração deve poder usar valor/faturamento das oportunidades, não apenas contagem de vendas.
- 🔧 **Cadastro de cliente concentrado na Carteira** — não duplicar formulário de cadastro na Central de Execução. Fechamento foca lançamento (leads/agendamento/venda); a Carteira complementa os dados do cliente.
- 🔧 Ordem do menu discutida: Fechamento Diário → **Carteira → Central de Execução** (carteira antes da central).

## 2. Central de Execução (nome confirmado; substitui "Agenda" ✅ já excluída)

- 🆕 **Rotina do dia preenchida AUTOMATICAMENTE** ("não quero dar trabalho ao vendedor"):
  - Atendimento → check automático ao registrar atendimentos (mínimo configurável, ex.: 5).
  - Organização do dia → check ao atualizar status dos clientes na agenda.
  - Contato com novos leads → check ao preencher agendamentos.
  - Itens sem fonte de dado (ex.: Mentalidade) podem "passar batido" (sem check manual obrigatório).
- 🆕 **Status das ações do dia com 3 opções**: Feito / Não feito / Aguardando — o status escolhido realimenta o fluxo de cadência (define para qual etapa volta).
- 🆕 **Reagendamento automático**: tentativa de contato sem sucesso (ex.: 3ª tentativa) reagenda a ação para o dia seguinte — cliente nunca fica no limbo.

## 3. Carteira — Fluxo de Cadência (✅ fundação criada; 🆕 motor de cadência)

- ✅ Etapas com objetivo/o que fazer/script + Persistência Comercial (já implementado).
- 🆕 **Motor de cadência configurável**: sequências tipo "cliente respondeu → msg 1 → msg 2 → msg 3 → sem resposta → retorna em 1 semana". A cadência gera a **próxima ação** automaticamente.
- 🆕 **Integração Carteira → Central de Execução**: as próximas ações da cadência (confirmar visita, ligar, retorno de cliente atendido há 1 semana) aparecem como itens do dia na Central.
- 🔮 Analytics: em qual etapa do fluxo os clientes param (insumo para marketing/gestor); qual fluxo converte em venda (melhoria contínua da cadência).

## 4. Funil de Vendas — estratégia por canal inteligente

- ✅ "O que falta para bater a meta" por canal com benchmarks da loja (implementado).
- 🆕 **Distribuição real por canal**: usar a estatística dos últimos 3 meses do vendedor (ex.: 60% internet) para direcionar a estratégia, em vez de padrão fixo; alternativa: cadastro de % por canal no perfil.
- 🆕 **Canais inexistentes na loja** (ex.: loja sem porta) não devem exibir estatística/estratégia daquele canal.
- ✅ Ritmo ("1 carro a cada 3 dias") — implementado, elogiado na call.

## 5. Treinamentos

- ✅ Abas Biblioteca/Trilha/Aulas ao Vivo; aulas ao vivo com prova de presença (5 questões, pontos no score) — implementado.
- 🆕 **Trilha automática por cadastro**: tempo de mercado/experiência definem N1–N4 na entrada (precisa dos campos de maturidade no perfil + regra de atribuição).
- 🔮 Regra: concluir 1 trilha a cada 6 meses.

## 6. Feedback

- ✅ "Li e compreendi" + comentário do vendedor + badge de pendentes (implementado).
- 🆕 **Campo "caso/motivo" OBRIGATÓRIO no form do GERENTE** ao registrar feedback ("o que motivou: falta de argumentação na negociação X") — sem feedback solto; também documenta para eventual desligamento.
- 🆕 **Ação do feedback vinculada à Central de Execução**: ex. "agendar 3 retornos/dia" vira item na rotina com alerta/destaque até concluir.
- 🆕 **Trava no fechamento do dia**: se a ação do feedback não foi cumprida, exigir observação com o motivo para conseguir fechar.
- 🔮 Banco de ações pré-definidas para o gestor selecionar; feedback autônomo gerado pelo sistema (para vendedor avulso).

## 7. PDI

- 🆕 **Evolução da nota**: visão de progresso das competências ao longo do tempo (gráfico de evolução entre sessões de PDI).
- 🔮 Autoavaliação por formulário para vendedor autônomo (sistema "confia" no que ele declara).
- ⚠️ **DECISÃO QUE MUDA A SPEC §15**: **PDI NÃO entra no score comparativo** — "PDI é à parte, é o polimento/refinamento do score" (para manter igualdade na comparação entre vendedores). Os pesos 35/25/15/10/**15 (PDI)** da spec precisam ser redefinidos antes de implementar o Score composto. Gerente atua "refinando" o score.

## 8. Mercado de Trabalho MX (🔮 estratégico)

- Aba "Mercado": vagas na região; vendedor se cadastra (opt-in) e expõe seu score como currículo vivo; dono da loja contratante enxerga o score.
- **Regra comercial**: vendedores vinculados a loja com pacote principal NÃO aparecem no mercado de trabalho (proteção ao lojista).
- Vendedor avulso: R$ 49,90/mês; migração de dados por CPF/e-mail ao trocar de loja; histórico/carteira viajam com ele.
- Telas sem fonte (gestor) ficam desabilitadas/cinza para o autônomo.

---

# Parte 2 da reunião

## 9. Meu Perfil — comissionamento e carreira

- 🆕 **Modelo de comissionamento configurável**: valor fixo por carro · percentual sobre valor vendido · por categoria de veículo (carro/moto/caminhão — exige campo "tipo de veículo" no cadastro da venda) · regras de premiação/bônus por patamar (ex.: atingiu 6 carros → bônus X) · comissão de equipe vinculada à meta da loja (só p/ vendedor de loja).
- 🔧 **Fonte do plano**: vendedor DE LOJA herda o plano de remuneração cadastrado pelo RH/gestor (departamento RH já existente) — ele NÃO configura; vendedor AUTÔNOMO cadastra o próprio modelo nas configurações.
- ⚠️ **DECISÃO IMEDIATA**: card "Oportunidades de Carreira" do Meu Perfil **não pode aparecer para vendedor vinculado a loja** ("o cara que tá dentro de uma empresa não pode enxergar aquilo") — recurso exclusivo do futuro autônomo. Ocultar já.
- Formação no perfil = currículo (base do Mercado de Trabalho).

## 10. Design / tipografia

- 🔧 Daniel achou a tipografia "carregada" (negrito muito forte / font-black) — quer tom mais leve ("mais Arial"). **Mariane é a validadora oficial de layout** daqui em diante; ajustes de peso tipográfico passam por ela.

## 11. PDI / Ranking

- ✅ Confirmado: única pendência do PDI é a **visão de evolução** da nota.
- 📐 Tela de **Ranking**: Daniel ainda vai desenhar o mock ("tenho que fazer ainda") — aguardar.

## 12. Cronograma e operação

- **Início de julho**: lançar módulo Vendedor em produção ("semana que vem funcionando em produção" — meta interna).
- **Julho**: construir módulo Gerente · **Agosto**: módulo Dono (evento com donos de loja) · **Set/Out**: testes e ajustes · **Novembro**: Mercado de Trabalho.
- Reunião fixa de alinhamento semanal (terça); semana que vem Daniel/José viajam seg–qui.
- **Rollout**: grupo pequeno primeiro (José + mentoria), canal de erros (print + áudio) com Mariane validando, depois expandir p/ ~20-30 lojas / ~100 vendedores. Possível dia presencial de teste com vendedores.

## 13. Aplicativo mobile (React Native)

- Retomar o app DEPOIS da validação das telas web do vendedor; Android primeiro (~1 semana, reaproveita código React).
- Foco do app: lançamento diário, Central de Execução com horários, **notificações/lembretes push** ("o aplicativo é ouro").
