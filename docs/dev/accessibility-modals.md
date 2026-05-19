# Acessibilidade em Modais — WCAG 2.1 AA

Story de referência: `docs/stories/sprint-3/story-3.12-focus-traps-modals.md` (Débito UX-024).

## Decisão de uso

| Caso | Solução | Motivo |
|------|---------|--------|
| Novo modal/dialog/sheet | **Radix Dialog/AlertDialog** (via `src/components/organisms/Modal.tsx`) | Focus trap, restore focus, Escape, scroll lock, ARIA — tudo built-in |
| Modal custom legado (não pode trocar agora) | Hook `useFocusTrap` em `src/hooks/useFocusTrap.ts` + handler de Escape + `role="dialog"` + `aria-modal="true"` + `aria-labelledby` | Cobre os requisitos WCAG sem refactor estrutural |
| Drawer/sheet mobile | `useFocusTrap` é suficiente; ver `src/components/Layout.tsx` (mobileMenu) |

## Critérios WCAG 2.1 AA cobertos

- **2.1.2 No Keyboard Trap** — usuário consegue sair do modal (Escape) e o trap só captura Tab/Shift+Tab.
- **2.4.3 Focus Order** — primeiro elemento focável recebe foco ao abrir; ciclo Tab respeitado.
- **2.4.7 Focus Visible** — depende dos estilos `:focus-visible` dos atoms (já cobertos por Story 3.11).
- **4.1.2 Name, Role, Value** — `role="dialog"` + `aria-modal="true"` + `aria-labelledby` (ou `aria-label`) obrigatórios.

## Checklist para revisar um modal custom

- [ ] Container do dialog tem `ref` conectado a `useFocusTrap(ref, isOpen)`.
- [ ] `role="dialog"` (ou `role="alertdialog"` para confirmações destrutivas).
- [ ] `aria-modal="true"`.
- [ ] `aria-labelledby` aponta para o título visível, ou `aria-label` se não houver título.
- [ ] Listener de `Escape` no `document` (dentro de `useEffect`) chamando `onClose` enquanto aberto.
- [ ] Botão de fechar tem `aria-label` em ícones-only.
- [ ] Não há `tabindex` positivo dentro do modal.
- [ ] Ao fechar, foco retorna ao elemento que abriu (já garantido pelo hook).

## Modais atualmente cobertos (Sprint 3 — Story 3.12)

Custom modals com `useFocusTrap`:
- `src/features/auth/components/ForcePasswordChange.tsx`
- `src/features/equipe/components/UserCreationModal.tsx`
- `src/features/lojas/components/StoreTeamPanel.tsx` (edição de membro + confirmação)
- `src/features/ranking/components/SellerProfileModal.tsx`
- `src/pages/GerenteFeedback.tsx` (variantes admin + loja)
- `src/pages/Lojas.tsx` (criação de loja)
- `src/components/Layout.tsx` (menu mobile)

Baseados em Radix Dialog (focus trap nativo):
- `src/components/organisms/Modal.tsx` (e todos os modais que o usam:
  `CreateStoreModal`, `EditUserModal`, `StoreEditModal`, etc.)

## Testes

Testes unitários do hook: `src/hooks/useFocusTrap.test.tsx` (4 cenários — bun test).
