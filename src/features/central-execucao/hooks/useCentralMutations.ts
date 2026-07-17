import { useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type {
  CentralMutationResult,
  CreateManualActionInput,
  EscalateActionInput,
  RescheduleActionInput,
  ResolveActionInput,
} from '@/features/central-execucao/types/central-execucao.types'

type CentralRpcName =
  | 'central_create_manual_action'
  | 'central_resolve_action'
  | 'central_reschedule_action'
  | 'central_escalate_action'

type CentralRpcError = { message: string }
type CentralRpcResponse<T> = Promise<{ data: T | null; error: CentralRpcError | null }>
type CentralRpcInvoker = <T>(name: CentralRpcName, args: Record<string, unknown>) => CentralRpcResponse<T>

const invokeCentralRpc = supabase.rpc.bind(supabase) as unknown as CentralRpcInvoker

function invalidSession<T>(): CentralMutationResult<T> {
  return { data: null, error: 'Sessão inválida.' }
}

export function useCentralMutations() {
  const { profile } = useAuth()

  const createManualAction = useCallback(async (
    input: CreateManualActionInput,
  ): Promise<CentralMutationResult<string>> => {
    if (!profile?.id) return invalidSession()

    const { data, error } = await invokeCentralRpc<string>('central_create_manual_action', {
      p_payload: {
        activity_type: input.activityType,
        title: input.title,
        description: input.description ?? null,
        objective: input.objective ?? null,
        due_at: input.dueAt,
        client_id: input.clientId ?? null,
        opportunity_id: input.opportunityId ?? null,
        name_snapshot: input.nameSnapshot ?? null,
        phone_snapshot: input.phoneSnapshot ?? null,
        vehicle_snapshot: input.vehicleSnapshot ?? null,
        priority: input.priority ?? 'medium',
        priority_rank: input.priorityRank ?? 5,
      },
      p_idempotency_key: input.idempotencyKey,
    })

    return { data, error: error?.message ?? null }
  }, [profile?.id])

  const resolveAction = useCallback(async (
    input: ResolveActionInput,
  ): Promise<CentralMutationResult<Record<string, unknown>>> => {
    if (!profile?.id) return invalidSession()

    const { data, error } = await invokeCentralRpc<Record<string, unknown>>('central_resolve_action', {
      p_action_id: input.actionId,
      p_result_code: input.resultCode,
      p_note: input.note ?? null,
      p_payload: input.payload ?? {},
      p_idempotency_key: input.idempotencyKey,
    })

    return { data, error: error?.message ?? null }
  }, [profile?.id])

  const rescheduleAction = useCallback(async (
    input: RescheduleActionInput,
  ): Promise<CentralMutationResult<string>> => {
    if (!profile?.id) return invalidSession()

    const { data, error } = await invokeCentralRpc<string>('central_reschedule_action', {
      p_action_id: input.actionId,
      p_due_at: input.dueAt,
      p_note: input.note ?? null,
      p_idempotency_key: input.idempotencyKey,
    })

    return { data, error: error?.message ?? null }
  }, [profile?.id])

  const escalateAction = useCallback(async (
    input: EscalateActionInput,
  ): Promise<CentralMutationResult<string>> => {
    if (!profile?.id) return invalidSession()

    const { data, error } = await invokeCentralRpc<string>('central_escalate_action', {
      p_action_id: input.actionId,
      p_reason: input.reason,
      p_idempotency_key: input.idempotencyKey,
    })

    return { data, error: error?.message ?? null }
  }, [profile?.id])

  return {
    createManualAction,
    resolveAction,
    rescheduleAction,
    escalateAction,
  }
}
