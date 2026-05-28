/**
 * Story 3.15 — Web Vitals integration (FE)
 *
 * Captura LCP, INP, CLS, FCP, TTFB via lib `web-vitals` e reporta:
 *   - Sentry tag (`web_vitals.{metric}`) + breadcrumb (categoria `web-vitals`)
 *   - Console em dev (`import.meta.env.DEV`)
 *
 * No-op em SSR (typeof window === 'undefined').
 * Sentry no-op gracioso se SDK não inicializado (Story 0.3).
 */

import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals'
import { Sentry } from './sentry'

function reportMetric(metric: Metric): void {
    // Sentry tag + breadcrumb (no-op se Sentry não inicializado)
    if (Sentry && typeof Sentry === 'object') {
        const s = Sentry as unknown as {
            setTag?: (key: string, value: number) => void
            addBreadcrumb?: (b: Record<string, unknown>) => void
        }
        s.setTag?.(`web_vitals.${metric.name.toLowerCase()}`, metric.value)
        s.addBreadcrumb?.({
            category: 'web-vitals',
            message: metric.name,
            level:
                metric.rating === 'good'
                    ? 'info'
                    : metric.rating === 'needs-improvement'
                    ? 'warning'
                    : 'error',
            data: {
                value: metric.value,
                rating: metric.rating,
                id: metric.id,
                navigationType: metric.navigationType,
            },
        })
    }

    // Console em dev
    if (import.meta.env.DEV) {
        console.info(
            `[web-vitals] ${metric.name}=${metric.value.toFixed(2)} (${metric.rating})`
        )
    }
}

export function initWebVitals(): void {
    if (typeof window === 'undefined') return
    onCLS(reportMetric)
    onINP(reportMetric)
    onLCP(reportMetric)
    onFCP(reportMetric)
    onTTFB(reportMetric)
}
