# Story [UI-04]: Login A11y & Contrast Refactor

**Status:** READY
**Agent:** @ux-design-expert
**Effort:** 2h
**Priority:** HIGH (A11y)

## 1. Context
O modo dark da página de Login utiliza labels com opacidade `white/30` sobre fundo escuro, resultando em uma razão de contraste abaixo de 4.5:1 (falha no WCAG AA).

## 2. Acceptance Criteria
- [ ] Labels do formulário de login com contraste mínimo de 4.5:1.
- [ ] Placeholder visível mas semanticamente distinto.
- [ ] Validação via Lighthouse Acessibilidade (Score 100).

## 3. Implementation Tasks
1. Identificar as classes `text-white/30` no arquivo `Login.tsx`.
2. Substituir por um token de texto de baixo contraste mas legível (ex: `text-text-tertiary` ou similar com ajuste de cor).
3. Testar em diferentes níveis de brilho de tela.

## 4. Definition of Done
- Verificação manual com Axe DevTools passando 100%.
- Página visualmente idêntica mas acessível.
