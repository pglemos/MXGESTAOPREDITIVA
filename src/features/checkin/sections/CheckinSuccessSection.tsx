import { History } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'

interface CheckinSuccessSectionProps {
    saveNotice: { title: string; detail: string } | null
    onHistory: () => void
    onHome: () => void
}

/**
 * CheckinSuccessSection — confirmação pós-submit com atalhos para histórico
 * e retorno ao início. Substitui o redirect automático original.
 */
export function CheckinSuccessSection({ saveNotice, onHistory, onHome }: CheckinSuccessSectionProps) {
    if (!saveNotice) return null
    return (
        <Card className="p-mx-md border border-status-success/20 bg-status-success-surface shadow-mx-sm">
            <div className="flex flex-col gap-mx-md sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Typography variant="h3" tone="success" className="uppercase tracking-tight">{saveNotice.title}</Typography>
                    <Typography variant="p" tone="success" className="text-sm font-bold">{saveNotice.detail}</Typography>
                </div>
                <div className="flex flex-col gap-mx-xs sm:flex-row">
                    <Button type="button" variant="outline" onClick={onHistory} className="rounded-mx-xl bg-white">
                        <History size={16} className="mr-2" /> Histórico
                    </Button>
                    <Button type="button" onClick={onHome} className="rounded-mx-xl">
                        Voltar ao início
                    </Button>
                </div>
            </div>
        </Card>
    )
}
