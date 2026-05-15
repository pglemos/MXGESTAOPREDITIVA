# Onda 4 - Notas de Desenvolvimento de Pessoas

**Data:** 2026-05-15  
**Origem:** reuniao Jose Roberto + Daniel Santos MX  
**Orquestracao:** @aiox-master  
**Status:** Draft para PM/PO

## Base Existente

- `src/pages/VendedorTreinamentos.tsx` ja apresenta "Minha Evolucao", busca, progresso e prescricoes por gargalos de funil.
- `src/pages/GerenteTreinamentos.tsx` ja apresenta progresso da equipe, lembretes e matriz de absorcao.
- `src/pages/GerentePDI.tsx` ja apresenta evolucao do vendedor e fluxo de PDI.
- `docs/stories/story-pdi-complete-09/spec/spec.md` define PDI 2.0.
- `docs/stories/story-structured-feedback-08/spec/spec.md` define feedback estruturado.
- `docs/stories/story-training-notifications-12/spec/spec.md` define notificacoes e progresso de treinamento.

## Corte MVP

1. Reposicionar Treinamentos como Desenvolvimento, sem quebrar rotas existentes.
2. Tornar biblioteca pesquisavel por temas e adicionar avaliacao/sugestao de conteudo.
3. Criar trilha obrigatoria de novo colaborador, atribuida por gerente ou admin MX.
4. Conectar feedback/PDI a recomendacoes deterministicas de conteudo.

## Fora do MVP

- Marketplace de conteudo.
- IA para recomendacao automatica.
- Personalizacao institucional por loja.
- Produto comercial separado de gravacao de videos.
- Trilha de seis meses completa.
- Processo de contratacao/recrutamento.

## Decisoes Pendentes

- Nome final da area: Desenvolvimento, Evolucao ou Meu Plano de Carreira.
- Lista inicial de temas oficiais da biblioteca.
- Conteudos obrigatorios da trilha de entrada.
- Escala de avaliacao: 1 a 5 estrelas, nota simples ou positivo/neutro/negativo.
- Quem recebe sugestoes de conteudo: admin MX, admin master MX ou gerente da loja.

## Recomendacao do Orquestrador

Comecar por `DEV-24`, porque ela organiza a linguagem e a navegacao. Em seguida executar `DEV-25`, pois biblioteca e metadados viram base para trilha e recomendacoes. `DEV-26` e `DEV-27` devem vir depois, para evitar criar fluxo obrigatorio sem catalogo de conteudo minimo.
