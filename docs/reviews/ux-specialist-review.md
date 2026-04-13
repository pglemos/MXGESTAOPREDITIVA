## UX Specialist Review

### Débitos Validados
| ID | Débito | Severidade | Horas | Prioridade | Impacto UX |
|----|--------|------------|-------|------------|------------|
| UX-01 | Login Page Chaos | Crítica | 3 | Crítica | Quebra de consistência de marca, comportamentos responsivos erráticos em dispositivos menores. |
| UX-02 | Component Library Drift | Alta | 4 | Alta | Elementos pop-over saltando para fora da tela no mobile devido a vw units fixas. |
| UX-03 | Modal/Overlay Viewport Bounds | Alta | 2 | Alta | Impossibilidade de fechar modais no mobile porque a tela corta. |
| UX-04 | Hardcoded Inline Styles / Tooltips | Média | 2 | Média | Menus nativos e gráficos inacessíveis visualmente se houver transição de tema. |

### Débitos Adicionados
- **UX-05 (Novo): Acessibilidade (A11y)** - Vários botões do `PainelConsultor` não possuem tags `aria-label`, o que fere os guidelines WCAG.

### Respostas ao Architect
1. **Saneamento da Shadcn/Radix (UX-02):** Não crie wrappers. Devemos ir diretamente aos arquivos `.tsx` na pasta `src/components/ui/` e substituir as classes Tailwind baseadas em números (como `w-96`, `p-4`) pelos nossos Design Tokens (`w-mx-md`, `p-mx-sm`). Os componentes são nossos, o ownership é local.
2. **Chart Theming (UX-04):** O Recharts é compatível com variáveis CSS dinâmicas. O mapeamento sugerido é: usar `var(--color-surface-elevated)` no contentStyle do Tooltip, `var(--color-text-primary)` para o label, e remover os hexadecimais puros.

### Recomendações de Design
1. Refatorar a página `Login.tsx` *imediatamente*, antes de lançar para o cliente final, para alinhar a estética Elite.
2. Atualizar o `dialog.tsx` e o `scroll-area.tsx` para usar o sistema de grids flexível, substituindo o viewport (`vw/vh`) por constraints de tamanho atômicas.
