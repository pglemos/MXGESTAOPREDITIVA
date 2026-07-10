import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
    derivarNivelMaturidadeVendedor,
    MATURIDADE_VENDEDOR_LABEL,
    type NivelMaturidadeVendedor,
    type VendedorExperienciaDeclarada,
} from '@/features/crm/lib/maturidade'

/**
 * Dados reais da Universidade MX (aulas do vendedor). Substitui:
 * - base44.entities.Training/TrainingProgress (shim que fabricava
 *   quiz_score/hours_studied/attended_live com valores fixos — P0-03).
 * - CLASS_TASKS hardcoded + localStorage mx-training-tasks (P0-03/UNIV-1).
 * - Nível de maturidade por completedCount/3 (UNIV-3) — agora usa a mesma
 *   função canônica de maturidade usada em Meu Perfil (tempo de mercado,
 *   experiência declarada, cargo).
 */

const CATEGORY_BY_TYPE: Record<string, string> = {
    prospeccao: 'Prospecção',
    atendimento: 'Atendimento',
    agendamento: 'WhatsApp',
    apresentacao: 'Atendimento',
    financiamento: 'Financiamento',
    carro_de_troca: 'Negociação',
    fechamento: 'Fechamento',
    funil: 'Mentalidade',
    rotina_diaria: 'Mentalidade',
    crm: 'Carteira',
    institucional: 'Mentalidade',
}

export function categoriaDoTreinamento(type: string | null | undefined): string {
    return CATEGORY_BY_TYPE[(type || '').toLowerCase()] || 'Atendimento'
}

export interface Treinamento {
    id: string
    title: string
    description: string | null
    type: string
    category: string
    level: string
    duration_minutes: number
    video_url: string
    material_url: string | null
    is_live: boolean
    live_date: string | null
}

export interface ProgressoTreinamento {
    id: string
    training_id: string
    status: string
    progress_percent: number
    completed_at: string | null
    completed: boolean
}

export interface TarefaTreinamento {
    id: string
    training_id: string
    descricao: string
    ordem: number
    concluida: boolean
    respostaId: string | null
}

export function useVendedorTreinamentos() {
    const { supabaseUser } = useAuth()
    const [trainings, setTrainings] = useState<Treinamento[]>([])
    const [progress, setProgress] = useState<ProgressoTreinamento[]>([])
    const [tarefas, setTarefas] = useState<TarefaTreinamento[]>([])
    const [nivelMaturidade, setNivelMaturidade] = useState<NivelMaturidadeVendedor>('N1')
    const [loading, setLoading] = useState(true)

    const fetchAll = useCallback(async () => {
        if (!supabaseUser?.id) { setLoading(false); return }
        setLoading(true)

        const [treinamentosRes, progressoRes, perfilRes] = await Promise.all([
            supabase
                .from('treinamentos')
                .select('id, title, description, type, curation_notes, target_audience, duration_minutes, video_url, material_url, published_at')
                .eq('active', true),
            supabase
                .from('progresso_treinamentos')
                .select('id, training_id, status, progress_percent, completed_at')
                .eq('user_id', supabaseUser.id),
            supabase
                .from('vendedor_perfil')
                .select('tempo_mercado_anos, experiencia_declarada, cargo_atual')
                .eq('seller_user_id', supabaseUser.id)
                .maybeSingle(),
        ])

        const trainingRows = (treinamentosRes.data || []) as Array<{
            id: string
            title: string
            description: string | null
            type: string
            curation_notes: string | null
            target_audience: string
            duration_minutes: number
            video_url: string
            material_url: string | null
            published_at: string | null
        }>

        const mappedTrainings: Treinamento[] = trainingRows.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            type: t.type,
            category: categoriaDoTreinamento(t.type),
            level: t.curation_notes && t.curation_notes.startsWith('N') ? t.curation_notes : (t.target_audience || 'N1 Iniciante'),
            duration_minutes: t.duration_minutes || 10,
            video_url: t.video_url || '',
            material_url: t.material_url,
            is_live: t.type === 'live',
            live_date: t.published_at,
        }))
        setTrainings(mappedTrainings)

        const progressRows = (progressoRes.data || []) as Array<{
            id: string
            training_id: string
            status: string
            progress_percent: number
            completed_at: string | null
        }>
        setProgress(progressRows.map(p => ({
            ...p,
            completed: p.status === 'completed' || p.status === 'watched' || p.status === 'concluido' || Boolean(p.completed_at),
        })))

        const perfil = perfilRes.data as {
            tempo_mercado_anos: number | null
            experiencia_declarada: VendedorExperienciaDeclarada | null
            cargo_atual: string | null
        } | null
        setNivelMaturidade(derivarNivelMaturidadeVendedor({
            tempo_mercado_anos: perfil?.tempo_mercado_anos ?? null,
            experiencia_declarada: perfil?.experiencia_declarada ?? null,
            cargo_atual: perfil?.cargo_atual ?? null,
        }))

        if (mappedTrainings.length > 0) {
            const [tarefasRes, respostasRes] = await Promise.all([
                supabase
                    .from('treinamento_tarefas')
                    .select('id, training_id, descricao, ordem')
                    .in('training_id', mappedTrainings.map(t => t.id))
                    .eq('active', true)
                    .order('ordem'),
                supabase
                    .from('treinamento_tarefa_respostas')
                    .select('id, tarefa_id, concluida')
                    .eq('seller_user_id', supabaseUser.id),
            ])
            const tarefaRows = (tarefasRes.data || []) as Array<{ id: string; training_id: string; descricao: string; ordem: number }>
            const respostaByTarefa = new Map(
                ((respostasRes.data || []) as Array<{ id: string; tarefa_id: string; concluida: boolean }>)
                    .map(r => [r.tarefa_id, r]),
            )
            setTarefas(tarefaRows.map(t => {
                const resposta = respostaByTarefa.get(t.id)
                return { ...t, concluida: resposta?.concluida ?? false, respostaId: resposta?.id ?? null }
            }))
        } else {
            setTarefas([])
        }

        setLoading(false)
    }, [supabaseUser?.id])

    useEffect(() => { fetchAll() }, [fetchAll])

    const toggleTarefa = useCallback(async (tarefa: TarefaTreinamento, concluida: boolean) => {
        if (!supabaseUser?.id) return { error: 'Sessão inválida.' }
        const { error } = await supabase.from('treinamento_tarefa_respostas').upsert({
            id: tarefa.respostaId ?? undefined,
            tarefa_id: tarefa.id,
            seller_user_id: supabaseUser.id,
            concluida,
            concluida_em: concluida ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'tarefa_id,seller_user_id' })
        if (error) return { error: error.message }
        setTarefas(current => current.map(t => t.id === tarefa.id ? { ...t, concluida } : t))
        return { error: null }
    }, [supabaseUser?.id])

    const markCompleted = useCallback(async (trainingId: string) => {
        if (!supabaseUser?.id) return { error: 'Sessão inválida.' }
        const now = new Date().toISOString()
        const { error } = await supabase.from('progresso_treinamentos').upsert({
            training_id: trainingId,
            user_id: supabaseUser.id,
            status: 'concluido',
            progress_percent: 100,
            watched_at: now,
            completed_at: now,
            source_context: 'universidade_mx',
        }, { onConflict: 'training_id,user_id' })
        if (!error) {
            setProgress(current => [
                ...current.filter(p => p.training_id !== trainingId),
                { id: '', training_id: trainingId, status: 'concluido', progress_percent: 100, completed_at: now, completed: true },
            ])
        }
        return { error: error?.message ?? null }
    }, [supabaseUser?.id])

    const completedIds = useMemo(() => new Set(progress.filter(p => p.completed).map(p => p.training_id)), [progress])
    const completedCount = completedIds.size

    return {
        trainings,
        progress,
        tarefas,
        loading,
        completedIds,
        completedCount,
        nivelMaturidade,
        nivelMaturidadeLabel: MATURIDADE_VENDEDOR_LABEL[nivelMaturidade],
        toggleTarefa,
        markCompleted,
        refetch: fetchAll,
    }
}
