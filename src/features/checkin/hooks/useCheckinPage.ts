import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
    CHECKIN_DEADLINE_LABEL,
    CHECKIN_EDIT_LIMIT_LABEL,
    CHECKIN_EDIT_LIMIT_MINUTES,
    CHECKIN_MAX_INPUT_VALUE,
    MX_TIMEZONE,
    canEditCurrentCheckin,
    isCheckinLate,
    useCheckins,
} from '@/hooks/useCheckins'
import { validarFunil, calcularTotais } from '@/lib/calculations'
import type { DailyCheckin } from '@/types/database'
import { requestToastConfirmation } from '@/lib/ui/confirmAction'
import { useFeedbackActions } from '@/features/crm/hooks/useFeedbackActions'
import { resolveFeedbackActionCloseLock } from '../lib/feedback-action-lock'
import { useCrmDerivedTotals } from './useCrmDerivedTotals'

export interface CheckinForm {
    leads: number
    leads_cart: number
    leads_net: number
    agd_cart_prev: number
    agd_net_prev: number
    agd_cart: number
    agd_net: number
    vnd_porta: number
    vnd_cart: number
    vnd_net: number
    visitas: number
    visitas_porta: number
    visitas_cart: number
    visitas_net: number
    note: string
    zero_reason: string
}

export type NumericCheckinField = Exclude<keyof CheckinForm, 'note' | 'zero_reason'>

export const CHECKIN_MAX_INPUT_HELP = `O teto ${CHECKIN_MAX_INPUT_VALUE} evita erro de digitação, importação duplicada ou lançamento fora da escala operacional.`

/**
 * useCheckinPage — concentra estado, validações, efeitos e handlers da página
 * de lançamento diário. Mantém o comportamento original do `Checkin.tsx`.
 */
export function useCheckinPage() {
    const navigate = useNavigate()
    const [saving, setSaving] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [changedFields, setChangedFields] = useState<Set<keyof CheckinForm>>(new Set())
    const [metricScope, setMetricScope] = useState<'daily' | 'adjustment'>('daily')
    const [currentTime, setCurrentTime] = useState(() => new Date())
    const [inputError, setInputError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<NumericCheckinField | 'note' | 'zero_reason', string>>>({})
    const [numberDrafts, setNumberDrafts] = useState<Partial<Record<keyof CheckinForm, string>>>({})
    const [saveNotice, setSaveNotice] = useState<{ title: string; detail: string } | null>(null)

    const [form, setForm] = useState<CheckinForm>({
        leads: 0, leads_cart: 0, leads_net: 0,
        agd_cart_prev: 0, agd_net_prev: 0, agd_cart: 0, agd_net: 0,
        vnd_porta: 0, vnd_cart: 0, vnd_net: 0,
        visitas: 0, visitas_porta: 0, visitas_cart: 0, visitas_net: 0,
        note: '', zero_reason: '',
    })

    const { todayCheckin, saveCheckin, loading: hookLoading, referenceDate, fetchCheckinByDate, error: checkinLoadError } = useCheckins()
    const {
        acoes: feedbackActions,
        loading: feedbackActionsLoading,
        justificarAcoesFeedback,
    } = useFeedbackActions()
    const [historicalCheckin, setHistoricalCheckin] = useState<DailyCheckin | null>(null)
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [customReferenceDate, setCustomReferenceDate] = useState('')
    const crmDerived = useCrmDerivedTotals(customReferenceDate)

    useEffect(() => {
        if (referenceDate) setCustomReferenceDate(referenceDate)
    }, [referenceDate])

    useEffect(() => {
        if (!customReferenceDate || !referenceDate) return
        if (customReferenceDate === referenceDate && metricScope === 'daily') {
            setHistoricalCheckin(todayCheckin)
        } else {
            setLoadingHistory(true)
            fetchCheckinByDate(customReferenceDate, metricScope)
                .then(res => setHistoricalCheckin(res))
                .catch(() => toast.error('Não foi possível carregar o lançamento selecionado.'))
                .finally(() => setLoadingHistory(false))
        }
    }, [customReferenceDate, metricScope, todayCheckin, referenceDate, fetchCheckinByDate])

    useEffect(() => {
        if (changedFields.size > 0) return
        setNumberDrafts({})
        if (historicalCheckin) {
            setForm({
                leads: historicalCheckin.leads_prev_day || 0,
                leads_cart: historicalCheckin.leads_prev_day || 0,
                leads_net: 0,
                agd_cart_prev: historicalCheckin.agd_cart_prev_day || 0,
                agd_net_prev: historicalCheckin.agd_net_prev_day || 0,
                agd_cart: historicalCheckin.agd_cart_today || 0,
                agd_net: historicalCheckin.agd_net_today || 0,
                vnd_porta: historicalCheckin.vnd_porta_prev_day || 0,
                vnd_cart: historicalCheckin.vnd_cart_prev_day || 0,
                vnd_net: historicalCheckin.vnd_net_prev_day || 0,
                visitas: historicalCheckin.visit_prev_day || 0,
                visitas_porta: historicalCheckin.visit_prev_day || 0,
                visitas_cart: 0,
                visitas_net: 0,
                note: historicalCheckin.note || '',
                zero_reason: historicalCheckin.zero_reason || '',
            })
        } else {
            // No existing checkin — auto-populate from CRM data (seller can override)
            setForm({
                leads: crmDerived.leads,
                leads_cart: crmDerived.leads_cart,
                leads_net: crmDerived.leads_net,
                agd_cart_prev: 0,
                agd_net_prev: 0,
                agd_cart: crmDerived.agd_cart,
                agd_net: crmDerived.agd_net,
                vnd_porta: crmDerived.vnd_porta,
                vnd_cart: crmDerived.vnd_cart,
                vnd_net: crmDerived.vnd_net,
                visitas: crmDerived.visitas,
                visitas_porta: crmDerived.visitas_porta,
                visitas_cart: crmDerived.visitas_cart,
                visitas_net: crmDerived.visitas_net,
                note: '',
                zero_reason: '',
            })
        }
    }, [historicalCheckin, changedFields.size, crmDerived])

    const totals = useMemo(() => calcularTotais(form), [form])

    useEffect(() => {
        const clock = setInterval(() => setCurrentTime(new Date()), 30000)
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (changedFields.size > 0 && !saving) { e.preventDefault(); e.returnValue = '' }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            clearInterval(clock)
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [changedFields, saving])

    const isLate = isCheckinLate(currentTime)
    const canEditExisting = canEditCurrentCheckin(currentTime)

    const minutesUntilEditLock = useMemo(() => {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: MX_TIMEZONE,
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        }).formatToParts(currentTime)
        const byType = new Map(parts.map(part => [part.type, part.value]))
        const currentMinutes = Number(byType.get('hour')) * 60 + Number(byType.get('minute'))
        return CHECKIN_EDIT_LIMIT_MINUTES - currentMinutes
    }, [currentTime])

    const deadlineMessage = useMemo(() => {
        if (minutesUntilEditLock < 0) return `Bloqueado desde ${CHECKIN_EDIT_LIMIT_LABEL}.`
        const lockText = minutesUntilEditLock === 0 ? 'menos de 1 min' : `${minutesUntilEditLock} min`
        return isLate
            ? `Prazo oficial passou às ${CHECKIN_DEADLINE_LABEL}. Edição bloqueia em ${lockText}.`
            : `No prazo. Edição bloqueia em ${lockText}.`
    }, [isLate, minutesUntilEditLock])

    const allZero = useMemo(
        () => form.leads === 0 && totals.agd_total === 0 && form.visitas === 0 && totals.vnd_total === 0,
        [form.leads, form.visitas, totals],
    )
    const funnelError = useMemo(() => {
        try { return validarFunil(form) } catch { return 'Erro de validação' }
    }, [form])
    const mandatoryFeedbackActionsCount = useMemo(
        () => metricScope === 'daily'
            ? feedbackActions.filter(action => action.status === 'pendente' && action.obrigatoria_fechamento).length
            : 0,
        [feedbackActions, metricScope],
    )

    const setFieldError = (field: NumericCheckinField | 'note' | 'zero_reason', message: string | null) => {
        setFieldErrors(prev => {
            const next = { ...prev }
            if (message) next[field] = message
            else delete next[field]
            return next
        })
    }

    const updateField = (field: keyof CheckinForm, value: number | string) => {
        if (typeof value === 'number' && (!Number.isFinite(value) || value < 0 || value > CHECKIN_MAX_INPUT_VALUE)) {
            setInputError(`Informe um valor entre 0 e ${CHECKIN_MAX_INPUT_VALUE}.`)
            setFieldError(field as NumericCheckinField, `Use um número entre 0 e ${CHECKIN_MAX_INPUT_VALUE}.`)
            return
        }
        setInputError(null)
        setFieldError(field as NumericCheckinField, null)
        setSaveNotice(null)
        setForm(prev => {
            const next = { ...prev, [field]: value }
            if (field === 'leads_cart' || field === 'leads_net') {
                next.leads = Number(next.leads_cart) + Number(next.leads_net)
            }
            if (field === 'visitas_porta' || field === 'visitas_cart' || field === 'visitas_net') {
                next.visitas = Number(next.visitas_porta) + Number(next.visitas_cart) + Number(next.visitas_net)
            }
            return next
        })
        setChangedFields(prev => new Set(prev).add(field))
    }

    const updateNumberField = (field: keyof CheckinForm, rawValue: string) => {
        setNumberDrafts(prev => ({ ...prev, [field]: rawValue }))
        setChangedFields(prev => new Set(prev).add(field))
        if (rawValue === '') {
            setInputError(null)
            setFieldError(field as NumericCheckinField, 'Campo obrigatório antes de salvar.')
            return
        }
        const numericValue = Number(rawValue)
        if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > CHECKIN_MAX_INPUT_VALUE) {
            setFieldError(field as NumericCheckinField, `Use um número de 0 a ${CHECKIN_MAX_INPUT_VALUE}.`)
            setInputError(`Revise ${rawValue}: ${CHECKIN_MAX_INPUT_HELP}`)
            return
        }
        setFieldError(field as NumericCheckinField, null)
        updateField(field, numericValue)
    }

    const commitNumberField = (field: keyof CheckinForm) => {
        setNumberDrafts(prev => {
            if (prev[field] !== '') return prev
            const next = { ...prev }
            delete next[field]
            return next
        })
        if (numberDrafts[field] === '') updateField(field, 0)
    }

    const handleExit = () => {
        if (changedFields.size > 0 && !saving) {
            requestToastConfirmation({
                key: 'checkin-unsaved-exit',
                title: 'Sair sem salvar?',
                description: 'Existem alterações no lançamento atual.',
                label: 'Sair',
                onConfirm: async () => navigate('/home'),
            })
            return
        }
        navigate('/home')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (saving) return
        if (Object.values(numberDrafts).some(value => value === '')) {
            const emptyFields = Object.entries(numberDrafts)
                .filter(([, value]) => value === '')
                .map(([field]) => field as NumericCheckinField)
            emptyFields.forEach(field => setFieldError(field, 'Preencha este campo ou use 0.'))
            setInputError('Preencha os campos numéricos vazios antes de salvar.')
            toast.error('Preencha os campos numéricos vazios antes de salvar.')
            return
        }
        if (!canEditExisting && metricScope === 'daily') {
            setInputError(`Lançamentos diários ficam bloqueados após ${CHECKIN_EDIT_LIMIT_LABEL}.`)
            toast.error(`Lançamentos diários ficam bloqueados após ${CHECKIN_EDIT_LIMIT_LABEL}.`); return
        }
        if (allZero && !form.zero_reason) {
            setFieldError('zero_reason', 'Selecione o motivo da produção zero.')
            setInputError('Justificativa obrigatória para produção zero.')
            toast.error('Justificativa obrigatória para produção zero.')
            return
        }
        if (allZero && form.zero_reason === 'Outro' && form.note.trim().length < 8) {
            setFieldError('note', 'Descreva o motivo “Outro” com pelo menos 8 caracteres.')
            setInputError('Descreva o motivo com pelo menos 8 caracteres quando selecionar Outro.')
            toast.error('Descreva o motivo quando selecionar Outro.')
            return
        }
        if (funnelError) { setInputError(funnelError); toast.error(funnelError); return }
        if (metricScope === 'daily' && feedbackActionsLoading) {
            setInputError('Aguarde carregar as ações de feedback antes de finalizar.')
            toast.error('Aguarde carregar as ações de feedback antes de finalizar.')
            return
        }
        const feedbackActionLock = resolveFeedbackActionCloseLock({
            actions: feedbackActions,
            note: form.note,
            metricScope,
        })
        if (feedbackActionLock.blocked) {
            const message = feedbackActionLock.message || 'Existe ação obrigatória de feedback pendente.'
            setFieldError('note', message)
            setInputError(message)
            toast.error(message)
            return
        }

        setSaving(true)
        const { error } = await saveCheckin(form, metricScope, customReferenceDate)
        if (error) { setSaving(false); toast.error(error); return }
        if (feedbackActionLock.actionIdsToJustify.length > 0) {
            const { error: feedbackActionError } = await justificarAcoesFeedback(
                feedbackActionLock.actionIdsToJustify,
                form.note,
            )
            if (feedbackActionError) {
                setSaving(false)
                toast.error(feedbackActionError)
                return
            }
        }
        setChangedFields(new Set())

        setFieldErrors({})
        setSaveNotice({
            title: totals.vnd_total > 0 ? `${totals.vnd_total} vendas consolidadas.` : 'Lançamento salvo.',
            detail: 'Você pode revisar os números, abrir o histórico ou voltar para o início sem espera automática.',
        })
        if (totals.vnd_total > 0) setShowConfetti(true)
        toast.success(totals.vnd_total > 0 ? `${totals.vnd_total} vendas consolidadas.` : 'Lançamento salvo.')
        timerRef.current = setTimeout(() => setShowConfetti(false), 1200)
    }

    const saveTechnicalAdjustment = async (nextForm: CheckinForm, detailNote: string) => {
        if (saving) return { error: 'Salvamento em andamento.' }
        setSaving(true)
        setInputError(null)
        const normalizedForm: CheckinForm = {
            ...nextForm,
            leads: nextForm.leads_cart + nextForm.leads_net,
            visitas: nextForm.visitas_porta + nextForm.visitas_cart + nextForm.visitas_net,
            note: detailNote.trim() || nextForm.note,
        }
        const { error } = await saveCheckin(normalizedForm, 'adjustment', customReferenceDate)
        setSaving(false)
        if (error) {
            setInputError(error)
            toast.error(error)
            return { error }
        }
        setForm(normalizedForm)
        setChangedFields(new Set())
        setFieldErrors({})
        setSaveNotice({
            title: 'Ajustes técnicos registrados.',
            detail: 'O histórico foi atualizado e os indicadores serão recalculados para liderança.',
        })
        toast.success('Ajustes técnicos registrados.')
        return { error: null }
    }

    return {
        // navigation
        navigate,
        // raw state
        form,
        saving,
        showConfetti,
        changedFields,
        metricScope,
        inputError,
        fieldErrors,
        numberDrafts,
        saveNotice,
        currentTime,
        historicalCheckin,
        loadingHistory,
        customReferenceDate,
        // checkins hook
        hookLoading,
        referenceDate,
        checkinLoadError,
        // CRM auto-derived totals
        crmDerived,
        // derived
        totals,
        isLate,
        canEditExisting,
        minutesUntilEditLock,
        deadlineMessage,
        allZero,
        funnelError,
        mandatoryFeedbackActionsCount,
        // setters / handlers
        setMetricScope,
        setCustomReferenceDate,
        updateField,
        updateNumberField,
        commitNumberField,
        handleExit,
        handleSubmit,
        saveTechnicalAdjustment,
    }
}

export type CheckinPageContext = ReturnType<typeof useCheckinPage>
