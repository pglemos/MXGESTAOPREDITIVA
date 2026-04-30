export function buildStoreQuery(supabase: any, storeId?: string) {
  let query = supabase.from("lojas").select("*").eq("active", true).order("name");
  if (storeId) query = query.eq("id", storeId);
  return query;
}
