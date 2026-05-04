import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'

export interface PDICargo {
    id: string
    nome: string
    nivel: number
    nota_min: number
    nota_max: number
}

export interface PDIFormTemplate {
    escala: { nota: number; descritor: string; ordem: number }[]
    competencias: { id: string; nome: string; tipo: 'tecnica' | 'comportamental'; descricao_completa: string; indicador: string; ordem: number; alvo: number }[]
    frases: string[]
}

export interface PDISuggestedAction {
    id: string
    descricao_acao: string
}

export interface PDIMeta360 {
    id?: string
    sessao_id?: string
    prazo: '6_meses' | '12_meses' | '24_meses' | string
    tipo: 'pessoal' | 'profissional' | string
    descricao: string
}

export interface PDIAvaliacao360 {
    id?: string
    sessao_id?: string
    competencia_id: string
    competencia: string
    tipo?: string
    nota: number
    alvo: number
    gap: number
}

export interface PDIPlanoAcao360 {
    id?: string
    sessao_id?: string
    competencia_id: string
    competencia: string
    descricao_acao: string
    data_conclusao: string
    impacto: string
    custo: string
    status?: string
}

export interface PDISessionSummary {
    id: string
    colaborador_id: string
    gerente_id: string
    loja_id: string | null
    cargo_id?: string | null
    status: string
    created_at: string
    updated_at?: string | null
    data_realizacao?: string | null
    proxima_revisao_data?: string | null
    due_date?: string | null
    seller_name: string
    seller_avatar_url?: string | null
    manager_name: string
    store_name?: string
    metas: PDIMeta360[]
    avaliacoes: PDIAvaliacao360[]
    plano_acao: PDIPlanoAcao360[]
    top_5_gaps: PDIAvaliacao360[]
    meta_6m: string
    meta_12m: string
    meta_24m: string
    action_1?: string
    action_2?: string
    action_3?: string
    action_4?: string
    action_5?: string
}

function joinMetas(metas: PDIMeta360[], prazo: string) {
    return metas
        .filter(m => m.prazo === prazo)
        .map(m => m.descricao)
        .filter(Boolean)
        .join(' | ')
}

async function fetchPDISessions360(params: {
    profileId?: string
    role?: string | null
    storeId?: string | null
    storeIdOverride?: string
}) {
    const { profileId, role, storeId, storeIdOverride } = params
    if (!profileId) return [] as PDISessionSummary[]
    if (!isPerfilInternoMx(role) && role !== 'vendedor' && !storeId) return [] as PDISessionSummary[]

    const effectiveStoreId = storeIdOverride || storeId
    let query = supabase
        .from('pdi_sessoes')
        .select('*')
        .order('created_at', { ascending: false })

    if (role === 'vendedor') {
        query = query.eq('colaborador_id', profileId)
    } else if ((role === 'gerente' || role === 'dono') && effectiveStoreId) {
        query = query.eq('loja_id', effectiveStoreId)
    } else if (isPerfilInternoMx(role) && effectiveStoreId && effectiveStoreId !== 'all') {
        query = query.eq('loja_id', effectiveStoreId)
    }

    const { data: sessoes, error: sessoesError } = await query
    if (sessoesError) throw sessoesError
    if (!sessoes?.length) return [] as PDISessionSummary[]

    const sessionIds = sessoes.map((s: any) => s.id)
    const userIds = Array.from(new Set(sessoes.flatMap((s: any) => [s.colaborador_id, s.gerente_id]).filter(Boolean)))
    const storeIds = Array.from(new Set(sessoes.map((s: any) => s.loja_id).filter(Boolean)))

    const [metasResp, avaliacoesResp, planoResp, usuariosResp, lojasResp] = await Promise.all([
        supabase.from('pdi_metas').select('*').in('sessao_id', sessionIds).order('created_at', { ascending: true }),
        supabase
            .from('pdi_avaliacoes_competencia')
            .select('*, competencia:pdi_competencias(id,nome,tipo,ordem)')
            .in('sessao_id', sessionIds),
        supabase
            .from('pdi_plano_acao')
            .select('*, competencia:pdi_competencias(id,nome,tipo,ordem)')
            .in('sessao_id', sessionIds)
            .order('data_conclusao', { ascending: true }),
        userIds.length ? supabase.from('usuarios').select('id,name,avatar_url').in('id', userIds) : Promise.resolve({ data: [], error: null }),
        storeIds.length ? supabase.from('lojas').select('id,name').in('id', storeIds) : Promise.resolve({ data: [], error: null }),
    ])

    if (metasResp.error) throw metasResp.error
    if (avaliacoesResp.error) throw avaliacoesResp.error
    if (planoResp.error) throw planoResp.error
    if (usuariosResp.error) throw usuariosResp.error
    if (lojasResp.error) throw lojasResp.error

    const metasBySession = new Map<string, PDIMeta360[]>()
    ;((metasResp.data || []) as any[]).forEach(meta => {
        const list = metasBySession.get(meta.sessao_id) || []
        list.push(meta)
        metasBySession.set(meta.sessao_id, list)
    })

    const avaliacoesBySession = new Map<string, PDIAvaliacao360[]>()
    ;((avaliacoesResp.data || []) as any[]).forEach(av => {
        const list = avaliacoesBySession.get(av.sessao_id) || []
        list.push({
            id: av.id,
            sessao_id: av.sessao_id,
            competencia_id: av.competencia_id,
            competencia: av.competencia?.nome || 'Competencia',
            tipo: av.competencia?.tipo,
            nota: av.nota_atribuida,
            alvo: av.alvo,
            gap: av.alvo - av.nota_atribuida,
        })
        avaliacoesBySession.set(av.sessao_id, list)
    })

    const planoBySession = new Map<string, PDIPlanoAcao360[]>()
    ;((planoResp.data || []) as any[]).forEach(acao => {
        const list = planoBySession.get(acao.sessao_id) || []
        list.push({
            id: acao.id,
            sessao_id: acao.sessao_id,
            competencia_id: acao.competencia_id,
            competencia: acao.competencia?.nome || 'Competencia',
            descricao_acao: acao.descricao_acao,
            data_conclusao: acao.data_conclusao,
            impacto: acao.impacto,
            custo: acao.custo,
            status: acao.status,
        })
        planoBySession.set(acao.sessao_id, list)
    })

    const userNameById = new Map(((usuariosResp.data || []) as any[]).map(u => [u.id, u.name]))
    const userAvatarById = new Map(((usuariosResp.data || []) as any[]).map(u => [u.id, u.avatar_url || null]))
    const storeNameById = new Map(((lojasResp.data || []) as any[]).map(l => [l.id, l.name]))

    return (sessoes as any[]).map(sessao => {
        const metas = metasBySession.get(sessao.id) || []
        const avaliacoes = avaliacoesBySession.get(sessao.id) || []
        const plano = planoBySession.get(sessao.id) || []
        const actions = plano.map(a => a.descricao_acao)

        return {
            id: sessao.id,
            colaborador_id: sessao.colaborador_id,
            gerente_id: sessao.gerente_id,
            loja_id: sessao.loja_id,
            cargo_id: sessao.cargo_id,
            status: sessao.status,
            created_at: sessao.created_at,
            updated_at: sessao.updated_at,
            data_realizacao: sessao.data_realizacao,
            proxima_revisao_data: sessao.proxima_revisao_data,
            due_date: sessao.proxima_revisao_data,
            seller_name: userNameById.get(sessao.colaborador_id) || 'Vendedor',
            seller_avatar_url: userAvatarById.get(sessao.colaborador_id) || null,
            manager_name: userNameById.get(sessao.gerente_id) || 'Gestor',
            store_name: sessao.loja_id ? storeNameById.get(sessao.loja_id) : undefined,
            metas,
            avaliacoes,
            plano_acao: plano,
            top_5_gaps: [...avaliacoes].sort((a, b) => b.gap - a.gap).slice(0, 5),
            meta_6m: joinMetas(metas, '6_meses'),
            meta_12m: joinMetas(metas, '12_meses'),
            meta_24m: joinMetas(metas, '24_meses'),
            action_1: actions[0],
            action_2: actions[1],
            action_3: actions[2],
            action_4: actions[3],
            action_5: actions[4],
        } satisfies PDISessionSummary
    })
}

export function usePDI_MX() {
    const queryClient = useQueryClient()
    const [cargos, setCargos] = useState<PDICargo[]>([])
    const [template, setTemplate] = useState<PDIFormTemplate | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchCargos = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase.from('pdi_niveis_cargo').select('*').order('nivel', { ascending: true })
        if (error) setError(error.message)
        else setCargos(data || [])
        setLoading(false)
        return data
    }, [])

    const fetchTemplate = useCallback(async (cargoId: string) => {
        setLoading(true)
        const { data, error } = await supabase.rpc('get_pdi_form_template', { p_cargo_id: cargoId })
        if (error) setError(error.message)
        else setTemplate(data as PDIFormTemplate)
        setLoading(false)
        return data as PDIFormTemplate
    }, [])

    const fetchSuggestedActions = useCallback(async (competenciaId: string) => {
        const { data, error } = await supabase.rpc('get_suggested_actions', { p_competencia_id: competenciaId })
        if (error) {
            console.error(error)
            return []
        }
        return data as PDISuggestedAction[]
    }, [])

    const saveSessionBundle = useCallback(async (payload: Record<string, unknown>) => {
        setLoading(true)
        const { data, error } = await supabase.rpc('create_pdi_session_bundle', { p_payload: payload })
        setLoading(false)
        if (error) throw error
        queryClient.invalidateQueries({ queryKey: ['pdi-sessions'] })
        return data // Returns session UUID
    }, [queryClient])

    const fetchPrintBundle = useCallback(async (sessaoId: string) => {
        setLoading(true)
        const { data, error } = await supabase.rpc('get_pdi_print_bundle', { p_sessao_id: sessaoId })
        setLoading(false)
        if (error) throw error
        return data
    }, [])

    return {
        cargos,
        template,
        loading,
        error,
        fetchCargos,
        fetchTemplate,
        fetchSuggestedActions,
        saveSessionBundle,
        fetchPrintBundle
    }
}

export function usePDISessions(storeIdOverride?: string) {
    const { profile, storeId, role } = useAuth()

    const { data, isLoading: loading, refetch } = useQuery({
        queryKey: ['pdi-sessions', storeIdOverride || storeId || 'all', role, profile?.id],
        queryFn: () => fetchPDISessions360({
            profileId: profile?.id,
            role,
            storeId,
            storeIdOverride,
        }),
        enabled: !!profile,
    })

    return {
        pdis: data || [],
        sessions: data || [],
        loading,
        refetch,
    }
}

export function useMyPDISessions() {
    return usePDISessions()
}
