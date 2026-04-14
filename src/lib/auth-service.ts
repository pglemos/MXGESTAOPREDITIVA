import { SupabaseClient } from '@supabase/supabase-js'

export const getUserData = async (
    userId: string,
    client: SupabaseClient,
    timeoutMs: number = 4000
) => {
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_LIMIT')), timeoutMs)
    );

    // Use Promise.race to race the query against the timeout
    const result = await Promise.race([
        client
            .from('team')
            .select('role, agency_id')
            .eq('id', userId)
            .maybeSingle(),
        timeoutPromise
    ]) as { data: any; error: any }

    return result
}
