# Epic: Correções e Melhorias em Treinamentos (/treinamentos)

**Description:**
Restaurar as fundações estruturais do ambiente educacional (Treinamentos), corrigindo iframes mudos, erros 500 no carregamento e bugs de visualização de aulas.

## Stories & Tasks

### Story 1: Infraestrutura de Inicialização e Falhas (Network & Auth)
- [ ] Task 1.1: [Erro 1] Solucionar a falha crítica de fetch `TypeError: Failed to fetch [...] SupabaseAuthClient.signInWithPassword` no componente principal desta página.
- [ ] Task 1.2: [Erro 2] Mitigar o loop massivo de "Audit Warn [ProtectedRoute]" (8x) responsável pela latência e travamento no First Contentful Paint.
- [ ] Task 1.3: [Erro 6] Prover um componente `<div role="alert">Error State</div>` amigável caso ocorram falhas de conexão de rede, abolindo a página branca muda.
- [ ] Task 1.4: [Erro 19] Inserir `skeletons` visuais (esboços de cards) durante a inatividade do LCP para anular a trepidação de Layout Shift.

### Story 2: Semântica em Mídia e Hierarquia Base
- [ ] Task 2.1: [Erro 3] Abraçar o conteúdo educacional inteiro num macrocontainer `<main>` orientando as leituras de Voice Over.
- [ ] Task 2.2: [Erro 4] Formular uma subtitulação consistente com as quebras `<h2/h3>` a partir do solitário `<h1 Count: 1>`.
- [ ] Task 2.3: [Erro 5] Rotular iframes de Youtube e Players embutidos com atribuições obrigatórias de acessibilidade `title="Vídeo aula XYZ"`.
- [ ] Task 2.4: [Erro 13] Agrupar blocos iterativos de listagem de módulos através da formatação de listas adequadas em bloco `<ol>`/`<ul>`.
- [ ] Task 2.5: [Erro 8] Retirar divs puras com widths flexíveis e emular as progressões do aluno via meta-tags `<progress>` ou `aria-valuenow`.
- [ ] Task 2.6: [Erro 14] Prover tratamento adequado a caminhos de arquivos anexos estáticos ignorados (`robots.txt` NotFound).

### Story 3: Experiência Interativa, UX e Telas de Acesso
- [ ] Task 3.1: [Erro 7] Desvincular e elevar os padrões minúsculos `text-[10px] text-gray-400` na exibição das metadados da aula (Autor, Datas, Categorias).
- [ ] Task 3.2: [Erro 9] Assegurar comportamentos de contorno ativos `:focus-visible` nos cartões de vídeo ao usar o teclado via `Tab`.
- [ ] Task 3.3: [Erro 10] Acoplar a tag de Focus Trap no modal de reprodução interativa de Curso, com `aria-modal="true"`.
- [ ] Task 3.4: [Erro 11] Integrar mecânica de expansão semântica "Ler mais" descritivo (`aria-expanded`) sobre textos descritivos truncados com `line-clamp`.
- [ ] Task 3.5: [Erro 12] Eliminar botões visuais que dependem só de SVGs (trilhas de conhecimento), trocando por inputs com rótulo.
- [ ] Task 3.6: [Erro 15] Deletar e alterar a base de botões internos falsos de abas formatadas sobre strings soltas e `href="#"`.
- [ ] Task 3.7: [Erro 16] Redefinir as margens/paddings laterais móveis do carrossel para facilitar rolagens via touch (evitando miss-clicks).

### Story 4: Formulários Internos
- [ ] Task 4.1: [Erro 17] Ligar os seletores descritivos `id` e sua respectiva `<label>` do campo da Pesquisa Global de Treinamentos.
- [ ] Task 4.2: [Erro 18] Se houver Checkin da aula/Avaliação de estrelas, transformar as divs interativas por Radios acessíveis e `fieldset`.
- [ ] Task 4.3: [Erro 20] Limpar o uso constante de duplicação de `id`s em componentes montados repetidamente por um map React na visualização dos módulos.