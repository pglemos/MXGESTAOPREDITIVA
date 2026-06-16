# EV-5 — Treinamentos (Biblioteca / Trilha / Aulas ao Vivo)

**Objetivo:** desenvolver o vendedor com conteúdo compatível com seu nível e garantir engajamento (provas, pontos no score).

**Fase:** Julho · **Status:** 🔧 Parcial (abas, biblioteca, aulas ao vivo com prova existem; falta trilha automática por maturidade e regra de 6 meses).

**Arquivos atuais:** `src/pages/VendedorTreinamentos.tsx`, `src/features/universidade/sections/AulasAoVivoSection.tsx`, `useAulasAoVivo`, migration `20260610180000_mx_aulas_ao_vivo_foundation.sql`.

---

## EV-5.1 — Visão Geral e Biblioteca
**Status:** ✅ Done

**Critérios de aceitação:**
1. Abas: Visão Geral, Biblioteca, Trilha, Aulas ao Vivo.
2. Cards: Minha Trilha, Progresso, (Horas Estudadas), Frequência/Presenças, Média nas Provas, Impacto no Score.
3. Biblioteca: busca por tema/nível/duração; categorias (Atendimento, Prospecção, WhatsApp, Negociação, Financiamento, Fechamento, Pós-venda); botão "Sugerir Conteúdo".
4. Biblioteca é **consulta livre** — não cobrada.

---

## EV-5.2 — Aulas ao Vivo com prova de presença
**Status:** ✅ Done

**Critérios de aceitação:**
1. Próxima aula, Agenda, Gravações.
2. Presença validada por **prova (5–10 questões)**, critério **70%**.
3. Gabarito nunca exposto ao aluno (RPC `get_prova_aula` sem gabarito; correção server-side `submeter_prova_aula`).
4. Indicadores: Presenças, Média das provas, Pontos conquistados.
5. Pontos de treinamento entram no Score Total (ver EV-9).

---

## EV-5.3 — Trilha automática por maturidade (N1–N4)
**Status:** 🆕 Novo

**Como** vendedor, **quero** entrar automaticamente na trilha do meu nível **para** receber conteúdo compatível com meu perfil.

**Critérios de aceitação:**
1. Níveis: N1 Iniciante, N2 Intermediário, N3 Performance, N4 Alta Performance.
2. Definição **automática** por: tempo de mercado, experiência declarada, cargo (cadastro do Meu Perfil).
3. Ex.: 5 anos de mercado → N4; sem experiência → N1.
4. A Trilha é o conteúdo **obrigatório** (diferente da Biblioteca, livre).

**Notas técnicas:** regra de atribuição de `trilhas_desenvolvimento` por faixa de maturidade; campos de maturidade no perfil (EV-8).

**Dependências:** EV-8 (cadastro de tempo de mercado/experiência/cargo).

---

## EV-5.4 — Regra de conclusão (1 trilha / 6 meses)
**Status:** 🔮 Futuro

**Como** gestor, **quero** que o vendedor conclua 1 trilha a cada 6 meses **para** manter desenvolvimento contínuo.

**Critérios de aceitação:**
1. A cada 6 meses, nova trilha exigida; progresso acompanhado.
2. Impacto no Score se não cumprir.

**Dependências:** EV-5.3, EV-9.

---

## EV-5.5 — Conteúdo recomendado por Funil/Feedback/PDI
**Status:** 🔧 Parcial

**Como** vendedor, **quero** receber conteúdo recomendado com base nas minhas dificuldades **para** estudar o que importa.

**Critérios de aceitação:**
1. Recomendações cruzam Funil (gargalo), Feedback (pontos de desenvolvimento) e PDI (competências baixas).
2. Card "Recomendado para você" na Visão Geral.
