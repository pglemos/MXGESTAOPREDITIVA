import type { SupabaseClient } from '@supabase/supabase-js'

export async function resolveStoreId(
  supabaseClient: SupabaseClient,
  sellerId: string
): Promise<string | null> {
  const { data: vinculos } = await supabaseClient
    .from('vinculos_loja')
    .select('store_id')
    .eq('user_id', sellerId)
    .eq('is_active', true)
    .limit(1)

  return vinculos?.[0]?.store_id ?? null
}
