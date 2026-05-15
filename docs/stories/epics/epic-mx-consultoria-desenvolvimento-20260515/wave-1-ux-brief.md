# Wave 1 UX Brief

**Destino:** @ux-design-expert  
**Stories:** CONS-14, CONS-15, CONS-16  
**Status:** Preflight

## Objetivo UX

Fazer a visita PMR virar uma tela de trabalho guiada. O consultor/admin MX deve abrir a visita e conseguir conduzir a reuniao sem procurar metodologia fora do sistema.

## Usuario Primario

Admin/admin master MX em reuniao online ou presencial com lojista/dono.

## Usuarios Secundarios

- Dono/lojista lendo resumo e relatorio.
- Gerente recebendo proximas acoes.

## Estrutura Recomendada da Tela

1. Cabecalho compacto
   - cliente;
   - visita;
   - status;
   - modalidade;
   - data;
   - botao de Meet quando existir.
2. Objetivo da visita
   - objetivo;
   - publico-alvo;
   - evidencia esperada;
   - checklist metodologico.
3. Periodo da conversa
   - presets: mes atual, mes anterior, trimestre atual, customizado;
   - datas inicio/fim;
   - estado "sem periodo definido".
4. Execucao
   - componente especifico por visita;
   - campos de anotacao e resumo.
5. Tarefas e proximos passos
   - quick add de plano de acao;
   - responsavel e prazo quando disponivel.
6. Evidencias/anexos
   - arquivos existentes;
   - CTA para anexar.
7. Revisao e fechamento
   - gerar resumo;
   - revisar relatorio;
   - concluir visita.

## Diretrizes Visuais

- Interface densa, utilitaria e clara.
- Sem hero, sem layout de marketing.
- Evitar cards dentro de cards.
- Usar secoes full-width/containers simples.
- Botoes com icones quando forem acoes claras.
- Mobile deve priorizar ordem vertical e comandos fixos apenas se nao cobrir conteudo.

## Estados Obrigatorios

- Carregando visita.
- Visita sem checklist.
- Visita sem periodo.
- Visita concluida.
- Relatorio com dados incompletos.
- Sem anexos.
- Erro de sincronizacao Google Calendar/Meet.

## Criterio de Aceite UX

Um consultor novo deve conseguir responder em ate 30 segundos:

- qual e o objetivo da visita;
- qual periodo esta sendo discutido;
- o que falta preencher;
- como gerar o resumo;
- como finalizar a visita.

