/**
 * Story 3.7 — Tokens canônicos para charts (UX-005).
 *
 * Centraliza a paleta usada em componentes recharts (Line, Bar, Area, Pie,
 * Radar, PolarGrid, ReferenceLine etc.). NUNCA usar hex direto em charts —
 * sempre importar daqui. Lint AST (Story 3.8) bloqueará regressões.
 *
 * Resolução em runtime: lê o valor de `getComputedStyle(document.documentElement)`
 * para que dark/light mode futuros e rebrands se propaguem sem rebuild.
 * Fallback: valor hardcoded sincronizado com `src/index.css` (@theme).
 */

function cssVar(name: string, fallback: string): string {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return fallback
    }
    try {
        const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
        return value || fallback
    } catch {
        return fallback
    }
}

/**
 * Tokens canônicos. Todos são funções: avaliação preguiçosa garante que o
 * CSS já esteja aplicado quando o chart renderiza.
 */
export const chartTokens = {
    /** Marca: verde escuro institucional (séries primárias). */
    primary: () => cssVar('--color-brand-secondary', '#0D3B2E'),
    /** Marca: verde MX (ações positivas / accent). */
    accent: () => cssVar('--color-brand-primary', '#22C55E'),

    /** Status semânticos (compartilham com `--color-status-*`). */
    success: () => cssVar('--color-status-success', '#10b981'),
    warning: () => cssVar('--color-status-warning', '#f59e0b'),
    danger: () => cssVar('--color-status-error', '#ef4444'),
    info: () => cssVar('--color-status-info', '#3b82f6'),

    /** Tons neutros para eixos, grids, ticks. */
    axisTick: () => cssVar('--color-chart-axis-tick', '#6B7280'),
    axisTickMuted: () => cssVar('--color-chart-axis-tick-muted', '#94a3b8'),
    axisTickStrong: () => cssVar('--color-chart-axis-tick-strong', '#64748b'),
    grid: () => cssVar('--color-chart-grid', '#E5E7EB'),
    gridStrong: () => cssVar('--color-chart-grid-strong', '#e2e8f0'),
    gridDark: () => cssVar('--color-chart-grid-dark', '#334155'),
    dotStroke: () => cssVar('--color-chart-dot-stroke', '#ffffff'),

    /** Série categórica (ordem estável para legend/cores consistentes). */
    series: {
        s1: () => cssVar('--color-chart-1', '#0D3B2E'),
        s2: () => cssVar('--color-chart-2', '#22C55E'),
        s3: () => cssVar('--color-chart-3', '#FACC15'),
        s4: () => cssVar('--color-chart-4', '#2563EB'),
        s5: () => cssVar('--color-chart-5', '#EF4444'),
        s6: () => cssVar('--color-chart-6', '#7C3AED'),
        s7: () => cssVar('--color-chart-7', '#F59E0B'),
        s8: () => cssVar('--color-chart-8', '#00E5FF'),
    },
} as const

/** Array helper para componentes que aceitam paleta sequencial. */
export const chartSeriesArray = (): string[] => [
    chartTokens.series.s1(),
    chartTokens.series.s2(),
    chartTokens.series.s3(),
    chartTokens.series.s4(),
    chartTokens.series.s5(),
    chartTokens.series.s6(),
    chartTokens.series.s7(),
    chartTokens.series.s8(),
]

/** Mapa de status (good/warning/bad/neutral) para charts de saúde. */
export const chartStatusColors = () => ({
    good: chartTokens.success(),
    warning: chartTokens.warning(),
    bad: chartTokens.danger(),
    neutral: chartTokens.axisTickMuted(),
})
