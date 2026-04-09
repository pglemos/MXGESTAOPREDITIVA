import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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

export function usePDI_MX() {
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

    const saveSessionBundle = useCallback(async (payload: any) => {
        setLoading(true)
        const { data, error } = await supabase.rpc('create_pdi_session_bundle', { p_payload: payload })
        setLoading(false)
        if (error) throw error
        return data // Returns session UUID
    }, [])

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
