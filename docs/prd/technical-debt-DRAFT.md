# Technical Debt Assessment - DRAFT
## Para Revisão dos Especialistas (@dara & @uma)

### 1. Débitos de Sistema (Arquitetura)
- **Duplicação de UI Core**: Existência paralela de `src/components/ui/` (Legacy/Shadcn) e `src/components/atoms/` (Canonical).
- **Gerenciamento de Estado**: Ausência de uma camada de cache/server-state (ex: TanStack Query). Consultas ao Supabase são disparadas diretamente em hooks, dificultando a invalidação global.
- **Acoplamento em Páginas**: Dashboards principais (`VendedorHome.tsx`) possuem lógica de negócio, cálculos de metas e prescrição tática misturados ao rendering.
- **Sincronização de Cálculos**: Presença de arquivos `.orig` em `src/lib/calculations.ts`, indicando conflitos de merge mal resolvidos.

### 2. Débitos de Database (Dados & Segurança)
- **Exposição Analítica**: Mudança de RLS para `authenticated` na tabela `daily_checkins`. Risco de vazamento de dados se a UI não filtrar corretamente por `store_id` ou `user_id`.
- **Complexidade de Legado**: Triggers e funções para manter compatibilidade com colunas antigas (`leads`, `visitas`) aumentam a carga de manutenção.
- **RLS de Registros Filhos**: Necessidade de validar se `pdi_objetivos_pessoais` e `pdi_metas` estão herdando corretamente as restrições da `pdi_sessoes`.
- **Performance**: Falta de particionamento na `daily_checkins`, que é o coração transacional do sistema.

### 3. Débitos de Frontend/UX
- **Inconsistência de Feedback**: Uso variado de Skeletons e estados de loading.
- **Assets Duplicados**: Ícones e variantes de botões não consolidados totalmente entre `ui/` e `atoms/`.
- **Acessibilidade (a11y)**: Algumas páginas complexas podem ter quebrado a navegação por teclado após a refatoração massiva de classes.

### 4. Matriz Preliminar de Débitos
| ID | Débito | Área | Impacto | Esforço | Prioridade |
|----|--------|------|---------|---------|------------|
| DS-01 | Componentes Duplicados (`ui/` vs `atoms/`) | Sistema | Médio | Médio | **Alta** |
| DB-01 | Permissividade RLS `daily_checkins` | Dados | **Alto** | Baixo | **Crítica** |
| FE-01 | Dashboards Monolíticos (>1000 lines) | Frontend | Médio | Alto | Média |
| DB-02 | Triggers de Compatibilidade Legada | Dados | Baixo | Médio | Baixa |
| DS-02 | Falta de Server State (React Query) | Sistema | **Alto** | Alto | **Alta** |

### 5. Perguntas para Especialistas
- **@data-engineer (Dara)**: 
  - Podemos remover as colunas legadas de `daily_checkins` e os triggers de sincronismo agora que a UI foi refatorada?
  - O RLS atual protege adequadamente os dados sensíveis de `feedbacks` entre diferentes gerentes da mesma loja?
- **@ux-design-expert (Uma)**:
  - Qual o plano para migrar os componentes restantes da `ui/` para `atoms/` sem quebrar a responsividade?
  - Temos uma especificação clara de Skeletons para cada tipo de Card de métrica?

Salve em: docs/prd/technical-debt-DRAFT.md
