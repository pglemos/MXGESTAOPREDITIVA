import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'

interface CheckinSuccessSectionProps {
    saveNotice: { title: string; detail: string } | null
    onHome: () => void
}

/**
 * CheckinSuccessSection — confirmação pós-submit com retorno ao início.
 * Substitui o redirect automático original.
 */
export function CheckinSuccessSection({ saveNotice, onHome }: CheckinSuccessSectionProps) {
    if (!saveNotice) return null
    return (
        <Card className="p-mx-md border border-status-success/20 bg-status-success-surface shadow-mx-sm">
            <div className="flex flex-col gap-mx-md sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Typography variant="h3" tone="success" className="uppercase tracking-tight">{saveNotice.title}</Typography>
                    <Typography variant="p" tone="success" className="text-sm font-bold">{saveNotice.detail}</Typography>
                </div>
                <Button type="button" onClick={onHome} className="rounded-mx-xl">
                    Voltar ao início
                </Button>
            </div>
        </Card>
    )
}
