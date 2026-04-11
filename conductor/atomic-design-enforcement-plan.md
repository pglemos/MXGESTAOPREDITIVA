# Plano de Operação: Governança Atômica & Design System Enforcement

**Objetivo:** Transformar a arquitetura front-end do MX Performance de uma construção "Top-Down" (reinvenção por página) para uma arquitetura baseada em Atomic Design, eliminando redundâncias, centralizando tokens e impondo restrições técnicas (linting) para garantir escalabilidade e consistência perfeita em Web e Mobile.

**Responsável:** Orion (aiox-master) orquestrando Uma (@ux-design-expert) e Dex (@dev).

---

## 📋 Escopo de Auditoria (Phased)

### Fase 1: Auditoria Forense & Mapeamento de Caos [DONE]
- [x] **Módulo Admin (18+ páginas/abas):** Invocação de `*audit` para inventariar átomos customizados (Buttons, Cards, Badges, Headers).
- [x] **Módulos Dono, Gerente e Vendedor:** Mapeamento completo de componentes redundantes.
- [x] **Identificação de Hardcoded Values:** Extração de todas as instâncias de `#hex`, `rgb()` e classes Tailwind arbitrárias.
- [x] **Geração do Shock Report:** Relatório visual demonstrando a redundância atual e o ROI da consolidação.

### Fase 2: Definição da "Lei" (Design Tokens & Gates) [IN PROGRESS]
- [x] **Extração de Tokens:** Criação do contrato central de tokens (`tokens.yaml` e `tailwind.config.js` -> `index.css`).
- [ ] **Enforcement Automatizado:**
    - [ ] Configuração de regras ESLint/Stylelint para bloquear cores hardcoded.
    - [ ] Implementação de gate no pipeline para barrar uso de classes não-tokenizadas.
    - [x] Setup da estrutura de pastas: `src/components/atoms`, `molecules`, `organisms`.

### Fase 3: Reconstrução Atômica (Library Build) [IN PROGRESS]
- [x] **Atoms:** Botões, Badges, Typography (Refatorados para tokens 100%).
- [ ] **Molecules:** Form Fields, Stat Cards, Empty States, Page Headers.
- [ ] **Organisms:** Data Tables, Modais de Ritual, Gráficos de Performance.
- [ ] **Responsividade Extrema:** Validação de break-points para Mobile (navegador celular).

### Fase 4: Migração Sistêmica (Refactoring) [IN PROGRESS]
- [x] **Core Layout:** `Layout.tsx` migrado para tokens.
- [x] **Security/Auth:** `Login.tsx` migrado para tokens (fim do Buraco Negro).
- [ ] Substituição gradual nas 18 páginas Admin.

### Fase 5: Validação Visual Final (Driftx)
- [ ] **Automated Browser Audit:** Captura de screenshots de todas as telas em Desktop e Mobile.
- [ ] **Pixel-Perfect Review:** Comparação visual contra os padrões do Design System.
- [ ] **Acessibilidade Check:** Validação final de contraste e semântica.

---

## 🛠️ Ferramentas & Agentes
- **@ux-design-expert (Uma):** `*audit`, `*tokenize`, `*build`, `*shock-report`.
- **@dev (Dex):** Implementação da migração em massa.
- **Orion (Orchestrator):** Governança IDS e orquestração de rituais.
- **Driftx:** Captura e comparação visual.

---

## ⚠️ Bloqueios Detectados
- **Espaço em Disco:** `/dev/disk3s5` está operando no limite (814Mi livres). Operações que geram grandes volumes de dados (como builds pesados ou muitos screenshots temporários) devem ser monitoradas.

---

**Assinatura:** — Orion, orquestrando o sistema 🎯
