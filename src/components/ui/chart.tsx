import * as React from 'react'
import { Tooltip as ChartTooltip, TooltipContentProps, TooltipPayloadEntry } from 'recharts'
import { cn } from '@/lib/utils'

// Simplified chart components for recharts integration
// These provide theming context for recharts charts

type ChartConfig = Record<string, { label: string; color: string }>

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    config: ChartConfig
    children: React.ReactNode
}

function ChartContainer({ config, className, children, ...props }: ChartContainerProps) {
    const style = Object.entries(config).reduce(
        (acc, [key, value]) => {
            acc[`--color-${key}`] = value.color
            return acc
        },
        {} as Record<string, string>,
    )

    return (
        <div className={cn('w-full', className)} style={style} {...props}>
            {children}
        </div>
    )
}

// Helper types for Recharts Tooltip
type ValueType = number | string | Array<number | string>;
type NameType = number | string;

// Use Partial to allow usage like <ChartTooltipContent /> where props are injected by Recharts
interface ChartTooltipContentProps extends Partial<Omit<TooltipContentProps<ValueType, NameType>, 'payload'>> {
    payload?: TooltipPayloadEntry<ValueType, NameType>[];
}

function ChartTooltipContent({ active, payload, label }: ChartTooltipContentProps) {
    if (!active || !payload?.length) return null

    return (
        <div className="rounded-xl border border-border-default bg-surface-main p-3 shadow-mx-lg">
            {label && <p className="text-xs font-bold text-text-tertiary mb-2">{label}</p>}
            {payload.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="size-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                    <span className="font-semibold text-text-primary">{entry.name || (entry.dataKey as string | number)}:</span>
                    <span className="font-bold text-text-primary">{entry.value}</span>
                </div>
            ))}
        </div>
    )
}

export { ChartContainer, ChartTooltip, ChartTooltipContent }
export type { ChartConfig }
