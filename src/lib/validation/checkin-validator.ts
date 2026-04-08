import { DailyCheckin } from '@/types/database';

/**
 * Validates raw data against the canonical Checkin model requirements.
 * Used primarily by the Aggressive Importer to sanitize and validate input.
 */

export interface ValidationResult {
    success: boolean;
    data?: Partial<DailyCheckin>;
    errors?: string[];
}

export function validateCheckinPayload(raw: Record<string, any>): ValidationResult {
    const errors: string[] = [];

    // Mapping and validating mandatory fields
    const validatedData: Partial<DailyCheckin> = {
        leads_prev_day: Number(raw.LEADS) || 0,
        agd_cart_today: Number(raw.AGD_CART) || 0,
        agd_net_today: Number(raw.AGD_NET) || 0,
        vnd_porta_prev_day: Number(raw.VND_PORTA) || 0,
        vnd_cart_prev_day: Number(raw.VND_CART) || 0,
        vnd_net_prev_day: Number(raw.VND_NET) || 0,
        visit_prev_day: Number(raw.VISITA) || 0,
        // We expect store_id and seller_user_id to be resolved by the importer before calling this
    };

    // Sanity Checks
    if (isNaN(Number(raw.LEADS))) errors.push("LEADS must be a number");
    if (isNaN(Number(raw.VND_PORTA))) errors.push("VND_PORTA must be a number");
    if (isNaN(Number(raw.AGD_CART))) errors.push("AGD_CART must be a number");
    if (isNaN(Number(raw.AGD_NET))) errors.push("AGD_NET must be a number");
    if (isNaN(Number(raw.VND_CART))) errors.push("VND_CART must be a number");
    if (isNaN(Number(raw.VND_NET))) errors.push("VND_NET must be a number");
    if (isNaN(Number(raw.VISITA))) errors.push("VISITA must be a number");

    if (errors.length > 0) {
        return { success: false, errors };
    }

    return { success: true, data: validatedData };
}
