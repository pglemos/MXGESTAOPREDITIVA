const STORE_REPORT_SELECT = "id, name, active, legal_name, cnpj, address, administrative_phone";

export function buildStoreQuery(supabase: any, storeId?: string) {
  let query = supabase.from("lojas").select(STORE_REPORT_SELECT).eq("active", true).order("name");
  if (storeId) query = query.eq("id", storeId);
  return query;
}
