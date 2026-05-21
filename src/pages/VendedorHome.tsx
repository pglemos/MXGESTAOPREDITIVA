/**
 * Re-export shim — VendedorHome decomposto em `src/features/vendedor-home/`
 * seguindo ADR-0050 (Story 3.4 reconciliada, UX-001).
 *
 * A implementação real vive em `src/features/vendedor-home/VendedorHome.container.tsx`.
 */
export { VendedorHome as default } from '@/features/vendedor-home/VendedorHome.container'
