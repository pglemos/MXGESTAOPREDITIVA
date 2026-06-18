import { describe, it, expect } from 'bun:test'
import { renderHook } from '@testing-library/react'
import { useTacticalPrescription } from './useTacticalPrescription'

const treino = [{ id: 't1', type: 'prospeccao' }] as any

describe('useTacticalPrescription — guard clauses', () => {
  it('retorna null sem checkins', () => {
    const { result } = renderHook(() =>
      useTacticalPrescription({ checkins: [], treinamentos: treino, userId: 'seller-1' }),
    )
    expect(result.current).toBeNull()
  })

  it('retorna null sem treinamentos', () => {
    const checkins = [{ seller_user_id: 'seller-1', reference_date: '2999-01-01' }] as any
    const { result } = renderHook(() =>
      useTacticalPrescription({ checkins, treinamentos: [], userId: 'seller-1' }),
    )
    expect(result.current).toBeNull()
  })

  it('retorna null sem userId', () => {
    const checkins = [{ seller_user_id: 'seller-1', reference_date: '2999-01-01' }] as any
    const { result } = renderHook(() =>
      useTacticalPrescription({ checkins, treinamentos: treino, userId: undefined }),
    )
    expect(result.current).toBeNull()
  })

  it('retorna null quando nao ha checkin recente do usuario (todos fora da semana)', () => {
    const checkins = [{ seller_user_id: 'seller-1', reference_date: '2020-01-01' }] as any
    const { result } = renderHook(() =>
      useTacticalPrescription({ checkins, treinamentos: treino, userId: 'seller-1' }),
    )
    expect(result.current).toBeNull()
  })
})
