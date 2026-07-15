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
    primary: () => cssVar('--color-brand-secondary', '#071822'),
    /** Marca: verde MX (ações positivas / accent). */
    accent: () => cssVar('--color-brand-primary', '#00A89D'),

    /** Status semânticos (compartilham com `--color-status-*`). */
    success: () => cssVar('--color-status-success', '#00A89D'),
    warning: () => cssVar('--color-status-warning', '#F59F0A'),
    danger: () => cssVar('--color-status-error', '#EF4343'),
    info: () => cssVar('--color-status-info', '#00A89D'),

    /** Tons neutros para eixos, grids, ticks. */
    axisTick: () => cssVar('--color-chart-axis-tick', '#6B7280'),
    axisTickMuted: () => cssVar('--color-chart-axis-tick-muted', '#526B7A'),
    axisTickStrong: () => cssVar('--color-chart-axis-tick-strong', '#526B7A'),
    /** Cores observáveis do gráfico de previsibilidade do módulo gerencial Base44. */
    managerAxisTick: () => cssVar('--color-chart-manager-axis-tick', '#4B5563'),
    managerPositive: () => cssVar('--color-chart-manager-positive', '#10B981'),
    managerStoreGoal: () => cssVar('--color-chart-manager-store-goal', '#94A3B8'),
    managerStoreProjection: () => cssVar('--color-chart-manager-store-projection', '#A855F7'),
    grid: () => cssVar('--color-chart-grid', '#DFE0E1'),
    gridStrong: () => cssVar('--color-chart-grid-strong', '#DFE0E1'),
    gridDark: () => cssVar('--color-chart-grid-dark', '#334155'),
    dotStroke: () => cssVar('--color-chart-dot-stroke', '#ffffff'),

    /** Série categórica (ordem estável para legend/cores consistentes). */
    series: {
        s1: () => cssVar('--color-chart-1', '#071822'),
        s2: () => cssVar('--color-chart-2', '#00A89D'),
        s3: () => cssVar('--color-chart-3', '#FACC15'),
        s4: () => cssVar('--color-chart-4', '#00A89D'),
        s5: () => cssVar('--color-chart-5', '#EF4343'),
    s6: () => cssVar('--color-chart-6', '#005BFF'),
        s7: () => cssVar('--color-chart-7', '#F59F0A'),
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
