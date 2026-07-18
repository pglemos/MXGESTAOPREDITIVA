create or replace function public.get_resumo_rede_periodo(
  p_start_date date,
  p_end_date date,
  p_scope text default 'daily'
)
returns table (
  store_id uuid,
  sales bigint,
  leads bigint,
  agd bigint,
  vis bigint
)
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_caller_id uuid := auth.uid();
  v_scope public.checkin_scope := coalesce(nullif(p_scope, ''), 'daily')::public.checkin_scope;
begin
  if v_caller_id is null then
    raise exception 'unauthenticated' using errcode = 'P0001';
  end if;

  if not public.eh_area_interna_mx() then
    raise exception 'forbidden_global_read' using errcode = 'P0001';
  end if;

  if p_start_date is null or p_end_date is null or p_end_date < p_start_date then
    raise exception 'invalid_date_range' using errcode = '22007';
  end if;

  if (p_end_date - p_start_date) > 366 then
    raise exception 'date_range_too_large' using errcode = '22023';
  end if;

  return query
    select
      l.store_id,
      coalesce(sum(
        coalesce(l.vnd_net_prev_day, 0)
        + coalesce(l.vnd_porta_prev_day, 0)
        + coalesce(l.vnd_cart_prev_day, 0)
      ), 0)::bigint as sales,
      coalesce(sum(coalesce(l.leads_prev_day, 0)), 0)::bigint as leads,
      coalesce(sum(
        coalesce(l.agd_net_today, 0)
        + coalesce(l.agd_cart_today, 0)
      ), 0)::bigint as agd,
      coalesce(sum(coalesce(l.visit_prev_day, 0)), 0)::bigint as vis
    from public.lancamentos_diarios l
    where l.metric_scope = v_scope
      and l.reference_date between p_start_date and p_end_date
    group by l.store_id
    order by l.store_id;
exception
  when others then
    perform public.log_rpc_error(
      'get_resumo_rede_periodo',
      sqlstate,
      sqlerrm,
      v_caller_id,
      jsonb_build_object('start', p_start_date, 'end', p_end_date, 'scope', p_scope)
    );
    raise;
end;
$function$;

revoke all on function public.get_resumo_rede_periodo(date, date, text) from public;
revoke all on function public.get_resumo_rede_periodo(date, date, text) from anon;
grant execute on function public.get_resumo_rede_periodo(date, date, text) to authenticated;

-- DOWN
-- drop function if exists public.get_resumo_rede_periodo(date, date, text);
