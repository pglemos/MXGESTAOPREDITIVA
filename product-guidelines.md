# Product Guidelines: MX PERFORMANCE

**Versão:** 1.0.0
**Última Atualização:** 2026-04-02
**Status:** Ativo
**Responsável:** Orion (Master Orchestrator)

---

## Overview

Este documento define os padrões de usabilidade e experiência do usuário (UX) que regem o desenvolvimento do sistema MX PERFORMANCE. Ele serve como critério de aceitação mandatório para toda nova funcionalidade, componente de interface ou refatoração.

### Objetivos Principais
- **Consistência:** Garantir que o usuário nunca se sinta perdido entre as telas.
- **Resiliência:** Prever falhas e oferecer rotas de fuga seguras ("Ctrl+Z").
- **Eficiência:** Atender tanto o usuário leigo quanto o especialista com a mesma fluidez.

---

## 1. Heurísticas de Usabilidade (O Padrão Synkra)

### 1.1 Controle e Liberdade para o Usuário
Aquele momento em que você acaba deletando um e-mail que tinha um documento importante anexado sem querer e fica desesperado, mas ao ir até a lixeira você o encontra e fica aliviado. O ponto aqui é que quando o usuário realiza ações por engano, algo que é frequente, o sistema deve apresentar ao usuário uma “saída de emergência” daquele estado no qual ele entrou para o estado de segurança em que estava, em outras palavras, dê ao usuário o “Ctrl+Z”, pois essa possibilidade de reverter ações remove a insegurança do usuário ao utilizar o aplicativo, site, etc.

### 1.2 Consistência e Padronização
Essa heurística é um tanto simples, mas muitas vezes não aplicada na construção de interfaces. Manter consistência entre as telas de uma aplicação é essencial para não ser necessário o entendimento de vários padrões e formas de interações diferentes para cada tela, uma vez aprendido será algo replicável em outros contextos. Além disso, a experiência de uso se torna muito mais interessante, pois não existirá aquela sensação de estar perdido. Muitas vezes o motivo pelo qual usuários não interagem com as aplicações é essa sensação causada pela falta de consistência e padronização.

### 1.3 Prevenção de Erros
Existem dois tipos de erros que os usuários normalmente cometem: o deslize e o engano. Pode até parecer a mesma coisa, mas são sutilmente diferentes. O deslize é quando um usuário pretende realizar uma ação, mas acaba realizando outra, isso acontece tipicamente quando ele não está totalmente focado em sua ação dentro da aplicação. Já o engano é quando a compreensão de alguma informação é equivocada ou entendida de outra forma. Portanto, melhor do que mensagens dizendo que o usuário cometeu algum erro é prevenir que o mesmo não cometa esse erro. Caixas de confirmação, como as que aparecem quando você deleta um arquivo, são um exemplo de como evitar erros.

### 1.4 Reconhecimento em vez de Memorização
O cérebro é ótimo em reconhecer padrões e na medida em que objetos, ações e opções ficam expostos para o usuário, mais dicas chegam ao cérebro tornando certas ações familiares, ou seja, é preferível dar ao usuário formas de reconhecer padrões do que ter que obrigá-lo a memorizar várias informações na medida que ele navega pela aplicação. A grande diferença entre reconhecer e memorizar é a quantidade de dicas fornecidas para que um conhecimento seja acessado, reconhecer padrões fornece muito mais dicas do que tentar acessar memórias. Tente lembrar de uma senha (memorização) ou tente salvar um arquivo no Excel (reconhecimento).

### 1.5 Eficiência e Flexibilidade de Uso
O ideal é que a interface seja útil tanto para usuários leigos como para experientes. Leigos precisam de informações mais detalhadas para poderem realizar tarefas, mas na medida que crescem em conhecimento sobre a interface, a necessidade de formas mais rápidas de interação para realizar uma tarefa começam a surgir. “Alt+Tab ou Ctrl+C e Crtl+V ou Windows+D” são exemplos de atalhos que permitem ao usuário mais experiente realizar tarefas mais rapidamente.

### 1.6 Estética e Design Minimalista
Quanto maior a quantidade de informação maior será a quantidade de informações que serão analisadas e decisões que o usuário precisará tomar, por isso, é crucial manter apenas as informações que são realmente necessárias, as informações secundárias podem ser deixadas em segundo plano (menus, abas, etc.) assim a aplicação se torna muito eficiente no quesito transmitir informação aos usuários.

### 1.7 Ajude os Usuários a Reconhecerem, Diagnosticarem e Recuperarem-se de Erros
O ponto aqui é ajudá-lo a reparar um erro depois de ele ter cometido caso o “Cntrl+Z” não tenha funcionado. Um exemplo são aqueles avisos de formulários nos campos que não foram preenchidos corretamente. É uma forma simples de mostrar para o usuário que ele cometeu um erro, onde errou e o que precisa ser feito para corrigir tal erro.

### 1.8 Ajude e Documentação
Normalmente essas são as áreas menos acessadas, mas ainda assim elas são importantes dentro de um sistema, pois nunca se sabe quando um usuário irá precisar de uma ajudinha. É como se fosse uma maneira “faça você mesmo” do usuário resolver suas dúvidas de quais ações tomar dentro da aplicação, tornando-o mais independente do suporte.

---

## 2. Critérios de Aceitação Técnica (DoD UX)

Todo PR (Pull Request) deve validar:
1. **Recuperabilidade:** Existe um caminho de volta para ações destrutivas?
2. **Consistência:** Os novos componentes utilizam os padrões definidos em `src/components/ui`?
3. **Foco:** A informação principal está em destaque ou o usuário será sobrecarregado?
4. **Documentação:** Existe um tooltip ou guia rápido para a nova funcionalidade complexa?

---
_Documento gerado e validado via Framework AIOX - 2026_
