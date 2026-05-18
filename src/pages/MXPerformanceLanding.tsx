/**
 * Re-export shim — Story 2.1 (UX-001 piloto, ADR-0050).
 *
 * O conteúdo foi decomposto em `src/features/landing/` para manter o
 * container <200 LOC e habilitar visual regression, error boundary por
 * section e onboarding mais rápido. Este arquivo permanece para preservar
 * o import lazy em `src/App.tsx` (`@/pages/MXPerformanceLanding`).
 */
export { MXPerformanceLanding, default } from '@/features/landing'
