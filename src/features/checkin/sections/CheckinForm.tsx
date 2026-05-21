import { motion, AnimatePresence } from 'motion/react'
import {
    Users, Globe, Car, Eye, Send, MessageSquare, AlertTriangle,
    RefreshCw, History, CalendarDays, Smartphone, UserCheck,
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { CHECKIN_ZERO_REASONS } from '@/hooks/useCheckins'
import { DAILY_ROUTINE_MVP_FIELDS } from '@/lib/daily-routine'
import { NumberInput } from '../components/NumberInput'
import { CheckinValidationBanner } from './CheckinValidationBanner'
import { CheckinSuccessSection } from './CheckinSuccessSection'
import { CheckinSidebar } from './CheckinSidebar'
import type { CheckinPageContext } from '../hooks/useCheckinPage'

interface CheckinFormProps {
    ctx: CheckinPageContext
    totalsAgd: number
    totalsVnd: number
}

/**
 * CheckinForm — corpo principal do lançamento (retrospectiva, agenda, regras
 * de produção zero, observações e botão de submit). Mantém comportamento e
 * markup originais de `Checkin.tsx`.
 */
export function CheckinForm({ ctx, totalsAgd, totalsVnd }: CheckinFormProps) {
    const {
        form,
        saving,
        metricScope,
        fieldErrors,
        numberDrafts,
        changedFields,
        canEditExisting,
        funnelError,
        inputError,
        minutesUntilEditLock,
        allZero,
        saveNotice,
        navigate,
        updateField,
        updateNumberField,
        commitNumberField,
        handleSubmit,
    } = ctx

    const previousDayFieldsCount = DAILY_ROUTINE_MVP_FIELDS.filter(field => field.scope === 'previous_day').length
    const todayFieldsCount = DAILY_ROUTINE_MVP_FIELDS.filter(field => field.scope === 'today').length

    return (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col lg:flex-row gap-mx-lg max-w-mx-elite-canvas mx-auto w-full pb-32">

            {/* Form Core */}
            <div className="flex-1 space-y-mx-lg">
                <CheckinValidationBanner
                    metricScope={metricScope}
                    minutesUntilEditLock={minutesUntilEditLock}
                    funnelError={funnelError}
                    inputError={inputError}
                />

                <Card className="p-mx-md sm:p-mx-lg border border-border-default shadow-mx-sm bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-md">
                        <div className="rounded-mx-xl bg-status-success-surface border border-status-success/10 p-mx-md">
                            <Typography variant="tiny" tone="success" className="font-black uppercase tracking-widest">Dia anterior</Typography>
                            <Typography variant="p" className="font-black mt-1">{previousDayFieldsCount} campos de produção</Typography>
                            <Typography variant="tiny" tone="muted">Leads, visitas, vendas e justificativa quando tudo estiver zerado.</Typography>
                        </div>
                        <div className="rounded-mx-xl bg-brand-primary/5 border border-brand-primary/10 p-mx-md">
                            <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest">Hoje</Typography>
                            <Typography variant="p" className="font-black mt-1">{todayFieldsCount} campos de rotina</Typography>
                            <Typography variant="tiny" tone="muted">Agenda carteira, agenda internet e observação operacional.</Typography>
                        </div>
                    </div>
                </Card>

                {/* Retro Grid */}
                <Card className="p-mx-md sm:p-mx-lg md:p-mx-xl space-y-mx-lg border border-border-default shadow-mx-md bg-white relative overflow-hidden">
                    <header className="flex flex-col gap-mx-md border-b border-border-default pb-8 relative z-10 sm:flex-row sm:items-center sm:justify-between sm:pb-10">
                        <div className="flex items-center gap-mx-md">
                            <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-status-success text-white flex items-center justify-center shadow-mx-md"><History size={28} strokeWidth={2} /></div>
                            <div>
                                <Typography variant="h2" className="text-xl tracking-tight sm:text-2xl md:text-3xl">
                                    Retrospectiva <span className="ml-1 text-mx-green-700">MX</span>
                                </Typography>
                                <Typography variant="caption" tone="success" className="tracking-widest mt-1">CONSOLIDAÇÃO DE PRODUÇÃO: ONTEM</Typography>
                            </div>
                        </div>
                        <div className="text-right">
                            <Typography variant="caption" tone="muted" className="mb-1 block uppercase tracking-widest">SELL-OUT TOTAL</Typography>
                            <Typography variant="h1" tone="success" className="text-5xl tabular-nums leading-none">{totalsVnd}</Typography>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-md relative z-10">
                        <NumberInput label="Leads de Ontem" icon={Users} field="leads" tone="brand" form={form} numberDrafts={numberDrafts} fieldErrors={fieldErrors} changedFields={changedFields} updateField={updateField} updateNumberField={updateNumberField} commitNumberField={commitNumberField} />
                        <NumberInput label="Visitas de Ontem" icon={Eye} field="visitas" tone="warning" form={form} numberDrafts={numberDrafts} fieldErrors={fieldErrors} changedFields={changedFields} updateField={updateField} updateNumberField={updateNumberField} commitNumberField={commitNumberField} />
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-mx-md pt-mx-lg border-t border-border-default">
                            <NumberInput label="Vendas Porta" icon={Car} field="vnd_porta" tone="success" form={form} numberDrafts={numberDrafts} fieldErrors={fieldErrors} changedFields={changedFields} updateField={updateField} updateNumberField={updateNumberField} commitNumberField={commitNumberField} />
                            <NumberInput label="Vendas Carteira" icon={Smartphone} field="vnd_cart" tone="success" form={form} numberDrafts={numberDrafts} fieldErrors={fieldErrors} changedFields={changedFields} updateField={updateField} updateNumberField={updateNumberField} commitNumberField={commitNumberField} />
                            <NumberInput label="Vendas Internet" icon={Globe} field="vnd_net" tone="success" form={form} numberDrafts={numberDrafts} fieldErrors={fieldErrors} changedFields={changedFields} updateField={updateField} updateNumberField={updateNumberField} commitNumberField={commitNumberField} />
                        </div>
                    </div>
                </Card>

                {/* Today Grid */}
                <Card className="p-mx-md sm:p-mx-lg md:p-mx-xl space-y-mx-lg border border-border-default shadow-mx-md bg-white relative overflow-hidden">
                    <header className="flex flex-col gap-mx-md border-b border-border-default pb-8 relative z-10 sm:flex-row sm:items-center sm:justify-between sm:pb-10">
                        <div className="flex items-center gap-mx-md">
                            <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-brand-primary text-white flex items-center justify-center shadow-mx-md"><CalendarDays size={28} strokeWidth={2} /></div>
                            <div>
                                <Typography variant="h2" className="text-xl tracking-tight sm:text-2xl md:text-3xl">Agenda Operacional</Typography>
                                <Typography variant="caption" tone="brand" className="tracking-widest mt-1">COMPROMISSOS FIRMADOS: HOJE</Typography>
                            </div>
                        </div>
                        <div className="text-right">
                            <Typography variant="caption" tone="muted" className="mb-1 block uppercase tracking-widest">TOTAL AGENDADO</Typography>
                            <Typography variant="h1" tone="brand" className="text-5xl tabular-nums leading-none">{totalsAgd}</Typography>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-md relative z-10">
                        <NumberInput label="Agenda Carteira" icon={UserCheck} field="agd_cart" tone="brand" form={form} numberDrafts={numberDrafts} fieldErrors={fieldErrors} changedFields={changedFields} updateField={updateField} updateNumberField={updateNumberField} commitNumberField={commitNumberField} />
                        <NumberInput label="Agenda Internet" icon={Globe} field="agd_net" tone="info" form={form} numberDrafts={numberDrafts} fieldErrors={fieldErrors} changedFields={changedFields} updateField={updateField} updateNumberField={updateNumberField} commitNumberField={commitNumberField} />
                    </div>
                </Card>

                <Card className="p-mx-md border border-border-default bg-white shadow-mx-sm">
                    <div className="flex flex-col gap-mx-xs sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-mx-xs">
                            <Typography variant="h3" className="uppercase tracking-tight">Regra de produção zero</Typography>
                            <Typography variant="p" tone="muted" className="text-sm">
                                Se leads, visitas, agendamentos e vendas ficarem zerados, o motivo passa a ser obrigatório. Se escolher “Outro”, descreva no campo Observações com pelo menos 8 caracteres.
                            </Typography>
                        </div>
                        <Badge variant={allZero ? 'warning' : 'outline'} className="w-fit rounded-mx-full px-4 py-1">
                            {allZero ? 'Justificativa necessária' : 'Sem justificativa agora'}
                        </Badge>
                    </div>
                </Card>

                {/* Zero Reason */}
                <AnimatePresence>
                    {allZero && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                            <Card className="p-mx-10 border-none shadow-mx-xl bg-status-warning text-mx-black space-y-mx-10 relative overflow-hidden group">
                                <div className="absolute top-mx-0 right-mx-0 w-mx-sidebar-expanded h-mx-64 bg-white/20 rounded-mx-full blur-3xl -mr-mx-32 -mt-mx-32" />
                                <header className="flex items-center gap-mx-md relative z-10">
                                    <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-mx-black text-white flex items-center justify-center shadow-mx-lg group-hover:rotate-12 transition-transform"><AlertTriangle size={32} strokeWidth={2} /></div>
                                    <div>
                                        <Typography variant="h2" tone="default">Produção Zero</Typography>
                                        <Typography variant="caption" className="font-black uppercase tracking-widest mt-1 opacity-60">JUSTIFICATIVA OBRIGATÓRIA MX</Typography>
                                    </div>
                                </header>
                                <div className="relative z-10">
                                    <label htmlFor="checkin-zero-reason" className="sr-only">Motivo da produção zero</label>
                                    <select
                                        id="checkin-zero-reason"
                                        name="zero_reason"
                                        value={form.zero_reason} onChange={e => updateField('zero_reason', e.target.value)}
                                        aria-invalid={Boolean(fieldErrors.zero_reason)}
                                        aria-describedby={fieldErrors.zero_reason ? 'checkin-error-zero-reason' : undefined}
                                        className="w-full h-mx-2xl px-8 bg-mx-black text-white rounded-mx-2xl text-lg font-black uppercase tracking-widest outline-none shadow-mx-xl border-none focus:ring-8 focus:ring-white/10 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Selecione o motivo...</option>
                                        {CHECKIN_ZERO_REASONS.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                                    </select>
                                    {fieldErrors.zero_reason && (
                                        <Typography id="checkin-error-zero-reason" variant="tiny" className="mt-mx-sm block font-black uppercase tracking-tight text-mx-black">
                                            {fieldErrors.zero_reason}
                                        </Typography>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <CheckinSuccessSection
                    saveNotice={saveNotice}
                    onHistory={() => navigate('/historico')}
                    onHome={() => navigate('/home')}
                />

                {/* Finalization */}
                <Card className="p-mx-md sm:p-mx-10 md:p-14 space-y-mx-8 md:space-y-mx-10 border-none shadow-mx-lg bg-white">
                    <div className="space-y-mx-sm">
                        <label htmlFor="checkin-note" className="flex items-center gap-mx-xs px-4 text-mx-tiny font-black text-text-tertiary uppercase tracking-mx-wider">
                            <MessageSquare size={16} className="text-brand-primary" /> OBSERVAÇÕES OPERACIONAIS {allZero && form.zero_reason === 'Outro' ? '(Obrigatório)' : '(Opcional)'}
                        </label>
                        <textarea
                            id="checkin-note"
                            name="note"
                            value={form.note} onChange={e => updateField('note', e.target.value)} maxLength={280}
                            aria-invalid={Boolean(fieldErrors.note)}
                            aria-describedby={fieldErrors.note ? 'checkin-error-note' : undefined}
                            placeholder="Descreva aqui eventos críticos ou detalhes de fechamento estratégico..."
                            className="w-full bg-surface-alt border border-border-default rounded-mx-2xl p-mx-10 text-lg font-bold text-text-primary placeholder:text-text-tertiary/30 focus:outline-none focus:border-brand-primary focus:ring-8 focus:ring-brand-primary/5 transition-all resize-none shadow-inner min-h-mx-48"
                        />
                        <div className="flex flex-col gap-mx-xs pr-6 sm:flex-row sm:items-center sm:justify-between">
                            {fieldErrors.note && (
                                <Typography id="checkin-error-note" variant="tiny" tone="error" className="font-black uppercase tracking-tight">
                                    {fieldErrors.note}
                                </Typography>
                            )}
                            <Typography variant="mono" tone="muted" className="text-mx-tiny">{form.note.length}/280</Typography>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={saving || (!canEditExisting && metricScope === 'daily')}
                        className="w-full min-h-mx-20 rounded-mx-2xl px-mx-md text-lg font-black tracking-tight uppercase shadow-mx-elite hover:-translate-y-1 active:scale-95 transition-all sm:min-h-mx-24 sm:text-2xl"
                    >
                        {saving ? <RefreshCw className="w-mx-xl h-mx-xl animate-spin" /> : <><Send size={28} className="mr-2 sm:mr-4" /> Salvar Lançamento</>}
                    </Button>
                </Card>
            </div>

            {/* Info Sidebar */}
            <CheckinSidebar totalsVnd={totalsVnd} />

        </form>
    )
}
