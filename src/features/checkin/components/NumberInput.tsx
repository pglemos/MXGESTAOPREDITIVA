import type { LucideIcon } from 'lucide-react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { cn } from '@/lib/utils'
import { CHECKIN_MAX_INPUT_VALUE } from '@/hooks/useCheckins'
import type { CheckinForm, NumericCheckinField } from '../hooks/useCheckinPage'

type Tone = 'brand' | 'success' | 'warning' | 'info' | 'error'

interface NumberInputProps {
    label: string
    icon: LucideIcon
    field: NumericCheckinField
    tone: Tone
    form: CheckinForm
    numberDrafts: Partial<Record<keyof CheckinForm, string>>
    fieldErrors: Partial<Record<NumericCheckinField | 'note' | 'zero_reason', string>>
    changedFields: Set<keyof CheckinForm>
    updateField: (field: keyof CheckinForm, value: number | string) => void
    updateNumberField: (field: keyof CheckinForm, rawValue: string) => void
    commitNumberField: (field: keyof CheckinForm) => void
}

/**
 * NumberInput — input numérico das métricas com botões +/- e teto operacional.
 * Extraído de `Checkin.tsx` sem mudança visual ou funcional.
 */
export function NumberInput({
    label,
    icon: Icon,
    field,
    tone,
    form,
    numberDrafts,
    fieldErrors,
    changedFields,
    updateField,
    updateNumberField,
    commitNumberField,
}: NumberInputProps) {
    return (
        <Card className={cn(
            'flex min-h-mx-24 flex-col justify-between gap-mx-sm rounded-mx-2xl border bg-white p-mx-md shadow-mx-sm transition-all hover:shadow-mx-md',
            fieldErrors[field]
                ? 'border-status-error/40 ring-2 ring-status-error/10'
                : changedFields.has(field)
                    ? 'border-brand-primary/40 ring-2 ring-brand-primary/10'
                    : 'border-border-default',
        )}>
            <div className="flex items-center gap-mx-sm min-w-0">
                <div className={cn('w-mx-xl h-mx-xl rounded-mx-xl flex items-center justify-center border shrink-0',
                    tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                    tone === 'success' ? 'bg-status-success-surface border-mx-emerald-100 text-status-success' :
                    tone === 'info' ? 'bg-status-info-surface border-status-info/20 text-status-info' :
                    tone === 'warning' ? 'bg-status-warning-surface border-mx-amber-100 text-status-warning' :
                    'bg-status-error-surface border-mx-rose-100 text-status-error',
                )}>
                    <Icon size={20} strokeWidth={2} />
                </div>
                <Typography variant="caption" tone="muted" className="min-w-0 truncate font-black uppercase tracking-mx-wide leading-tight">{label}</Typography>
            </div>
            <div className="flex items-end justify-between gap-mx-sm">
                <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={CHECKIN_MAX_INPUT_VALUE}
                    name={String(field)}
                    aria-label={label}
                    aria-invalid={Boolean(fieldErrors[field])}
                    aria-describedby={fieldErrors[field] ? `checkin-error-${field}` : `checkin-limit-${field}`}
                    value={numberDrafts[field] ?? String(form[field] as number)}
                    onChange={(event) => updateNumberField(field, event.target.value)}
                    onBlur={() => commitNumberField(field)}
                    className="min-w-0 w-mx-24 bg-transparent text-3xl tabular-nums leading-none font-black text-text-primary outline-none focus:ring-2 focus:ring-brand-primary/20 rounded-mx-md sm:text-4xl"
                />
                <div className="flex items-center gap-mx-xs shrink-0">
                    <Button
                        type="button" variant="outline" size="icon"
                        aria-label={`Diminuir ${label}`}
                        disabled={(form[field] as number) <= 0}
                        onClick={() => updateField(field, (form[field] as number) - 1)}
                        className="w-mx-11 h-mx-11 rounded-mx-xl border-border-default hover:bg-status-error-surface hover:text-status-error hover:border-mx-rose-100 shadow-sm"
                    >
                        <Minus size={18} strokeWidth={2} />
                    </Button>
                    <Button
                        type="button" variant="outline" size="icon"
                        aria-label={`Aumentar ${label}`}
                        disabled={(form[field] as number) >= CHECKIN_MAX_INPUT_VALUE}
                        onClick={() => updateField(field, (form[field] as number) + 1)}
                        className="w-mx-11 h-mx-11 rounded-mx-xl border-border-default hover:bg-status-success-surface hover:text-status-success hover:border-mx-emerald-100 shadow-sm"
                    >
                        <Plus size={18} strokeWidth={2} />
                    </Button>
                </div>
            </div>
            {fieldErrors[field] ? (
                <Typography id={`checkin-error-${field}`} variant="tiny" tone="error" className="font-black uppercase tracking-tight">
                    {fieldErrors[field]}
                </Typography>
            ) : (
                <Typography id={`checkin-limit-${field}`} variant="tiny" tone="muted" className="font-black uppercase tracking-tight">
                    Digite direto ou ajuste por unidade. 0 a {CHECKIN_MAX_INPUT_VALUE}.
                </Typography>
            )}
        </Card>
    )
}
