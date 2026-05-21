/**
 * Re-export do container decomposto em `src/features/lojas/Lojas.container.tsx`.
 * Story 3.5 reconciliada — UX-001, ADR-0050. Mantém compatibilidade com import legado
 * de `@/pages/Lojas` (rotas, lazy-load, etc.).
 */
export { Lojas, Lojas as default } from '@/features/lojas/Lojas.container'
