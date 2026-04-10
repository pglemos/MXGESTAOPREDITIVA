# Plano de Redesenho: Login de Alta Performance (MX Performance)

## Objetivo
Abandonar a interface genérica atual por um layout de nível sênior, com foco em ergonomia móvel, reconhecimento imediato de usuário e hierarquia visual agressiva.

## Mudanças de Design (UX/UI)
- **Layout (Zero-based):** Adotar uma estrutura centrada de alto impacto, utilizando *whitespace* de forma proposital para reduzir a carga cognitiva.
- **Micro-interações:** Foco automático e transição suave entre estado de "Usuário Reconhecido" e "Acesso".
- **Design System:** Substituir componentes padrão por átomos customizados com sombras (elevation) e tipografia com *kerning* otimizado.
- **Performance de Login:** Priorizar o *input* de senha como único elemento de entrada necessário para usuários recorrentes.

## Passos da Implementação
1. **Estrutura Base:** Reescrever o container principal (`main` e `section`) para um layout minimalista.
2. **Componentização:** Isolar os inputs e botões em componentes dedicados ao novo padrão visual.
3. **Persistência Visual:** Implementar a lógica de `isHydrated` com feedback visual imediato (o e-mail já aparece como "identidade", não como "campo de entrada").
4. **Hardening de Acessibilidade:** Garantir que o contraste seja AAA e que o foco seja 100% gerenciável via teclado/touch.
5. **Polimento:** Ajustar *letter-spacing* e sombras para eliminar qualquer aspecto "padrão/inútil".

## Verificação
- Validar layout no mobile (Touch target > 48px).
- Testar fluxo de preenchimento automático.
- Validar foco automático em dispositivos móveis reais (Chrome/Safari).
