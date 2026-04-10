# Prompt de Design: MX Performance Landing Page (SaaS 3.0 Style)

**Objetivo:** Criar uma landing page de altíssimo impacto para o sistema "MX Performance", inspirada na fluidez e minimalismo do SmartList, mas com a robustez de um sistema de gestão preditiva para vendas.

---

### 1. Identidade Visual (Design System)
- **Cores Primárias:** Verde MX `#00b853` (Vibrante) e Azul Escuro Profundo `#0c343d` (Corporativo/Sério).
- **Tipografia:** Inter ou Manrope, pesos 400 (corpo) e 800 (títulos).
- **Estilo:** Bordas muito arredondadas (`rounded-3xl`), sombras suaves (`shadow-2xl`), e padrões de pontos (dot patterns) no fundo para textura.
- **Vibe:** "Limpo, Moderno, Eficiente e Tecnológico".

### 2. Seções da Página

#### A. Hero Section (O Impacto Inicial)
- **Título:** "Bata suas metas com menos **esforço**." (Enfatizar 'esforço' em verde).
- **Subtítulo:** "O MX Performance unifica seu funil e dá previsibilidade real. Pare de gerenciar pelo feeling."
- **Visual:** No lado direito, em vez de uma imagem estática, criar uma composição de **Cartões Flutuantes**:
    1. **Cartão Ranking:** Mostrando "1º Leandro - 111 Leads" com uma barra de progresso verde brilhante.
    2. **Cartão Alerta:** Um alerta flutuante de "Projeção de Meta" com ícone de atenção.
    3. **Indicador de ROI:** Um pequeno badge flutuante com "+24% de conversão".

#### B. Seção de Integrações
- Logo-cloud minimalista: WhatsApp, Google Forms, Planilhas, CRMs. Texto: "Onde seus dados nascem, nós os transformamos."

#### C. Dashboard Showcase (Funcionalidade 1)
- Mockup de uma interface de desktop "vazada" da borda da tela. 
- Cards de métricas: Leads (430), Agendamentos (85), Vendas (24).
- Um gráfico de linhas suave mostrando a "Projeção vs Meta".

#### D. Mobile Experience (Disciplina)
- Mockup de iPhone mostrando a tela de "Relatório Diário". 
- Checklist interativo: "Vendas Ontem [x]", "Agendamentos Hoje [ ]".
- Texto lateral: "Disciplina automatizada. O vendedor sabe o que fazer, o gestor sabe o que vai acontecer."

#### E. Footer CTA
- Fundo escuro (`#0c343d`) com um botão verde neon brilhante.
- Título: "Pronto para dominar seus números?"

---

### 3. Especificações Técnicas para o Código
- **Layout:** Tailwind CSS.
- **Animações:** Preparar classes para GSAP (ex: `.hero-card`, `.fade-in`).
- **Responsividade:** Mobile-first, com os cartões flutuantes se reorganizando em grid no celular.
