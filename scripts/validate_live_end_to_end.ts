import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { seedLiveSandbox, type SandboxContext } from './seed_live_sandbox';

type ValidationResult = {
  ok: boolean;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
  dryRuns: Record<string, unknown>;
  schema: Record<string, unknown>;
  cron: Array<{ jobname: string; schedule: string; active: boolean }>;
  sandbox: SandboxContext;
};

type SqlClient = ReturnType<typeof postgres>;

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} ausente no ambiente`);
  return value;
}

function createAnonClient() {
  return createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function login(email: string, password: string) {
  const client = createAnonClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw error || new Error(`Falha no login de ${email}`);
  return client;
}

async function runDryRun(functionName: string, storeId: string) {
  const response = await fetch(`${getEnv('VITE_SUPABASE_URL')}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getEnv('SUPABASE_SERVICE_ROLE_KEY')}`,
      apikey: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
    },
    body: JSON.stringify({ dry_run: true, store_id: storeId }),
  });

  const payload = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, payload };
}

async function tryDeniedFeedbackInsert(client: SupabaseClient, ctx: SandboxContext, actor: 'owner' | 'seller') {
  const { error } = await client.from('feedbacks').insert({
    store_id: ctx.storeId,
    manager_id: ctx.users.manager.id,
    seller_id: ctx.users.seller.id,
    week_reference: actor === 'owner' ? '2026-04-13' : '2026-04-20',
    leads_week: 1,
    agd_week: 1,
    visit_week: 1,
    vnd_week: 1,
    tx_lead_agd: 100,
    tx_agd_visita: 100,
    tx_visita_vnd: 100,
    meta_compromisso: 1,
    positives: 'sandbox',
    attention_points: 'sandbox',
    action: 'sandbox',
    notes: 'sandbox',
  });
  return Boolean(error);
}

async function validateReprocessIdempotency(sql: SqlClient, ctx: SandboxContext) {
  const fileHash = `sandbox-hash-${crypto.randomUUID()}`;
  const sourceOne = `sandbox-import-${crypto.randomUUID()}`;
  const sourceTwo = `sandbox-import-${crypto.randomUUID()}`;

  const firstLog = await sql<{ id: string }[]>`
    insert into public.reprocess_logs (
      store_id, source_type, triggered_by, status, rows_processed,
      records_processed, records_failed, warnings, errors, error_log,
      started_at, file_hash
    ) values (
      ${ctx.storeId}, ${sourceOne}, ${ctx.users.admin.id}, 'pending', 0,
      0, 0, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
      now(), ${fileHash}
    )
    returning id
  `;

  await sql`
    insert into public.raw_imports (log_id, raw_data)
    values (
      ${firstLog[0].id},
      ${JSON.stringify({
        store_id: ctx.storeId,
        seller_id: ctx.users.seller.id,
        DATA: '2026-04-07',
        LEADS: '3',
        AGD_CART: '1',
        AGD_NET: '1',
        VISITA: '1',
        VND_PORTA: '0',
        VND_CART: '0',
        VND_NET: '0'
      })}::jsonb
    )
  `;

  await sql`select public.process_import_data(${firstLog[0].id})`;

  const processed = await sql<{ status: string; processed_at: string | null }[]>`
    select status, processed_at
    from public.reprocess_logs
    where id = ${firstLog[0].id}
  `;

  const secondLog = await sql<{ id: string }[]>`
    insert into public.reprocess_logs (
      store_id, source_type, triggered_by, status, rows_processed,
      records_processed, records_failed, warnings, errors, error_log,
      started_at, file_hash
    ) values (
      ${ctx.storeId}, ${sourceTwo}, ${ctx.users.admin.id}, 'pending', 0,
      0, 0, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
      now(), ${fileHash}
    )
    returning id
  `;

  let duplicateBlocked = false;
  try {
    await sql`select public.process_import_data(${secondLog[0].id})`;
  } catch (error) {
    duplicateBlocked = String(error).includes('Arquivo ja processado anteriormente para este hash');
  }

  return {
    processed: processed[0]?.status === 'completed' && Boolean(processed[0]?.processed_at),
    duplicateBlocked,
  };
}

async function validate() {
  const sandbox = await seedLiveSandbox();
  const sql = postgres(getEnv('POSTGRES_URL'), { max: 1, ssl: 'require' });

  try {
    const admin = await login(sandbox.credentials.emails.admin, sandbox.credentials.password);
    const owner = await login(sandbox.credentials.emails.owner, sandbox.credentials.password);
    const manager = await login(sandbox.credentials.emails.manager, sandbox.credentials.password);
    const seller = await login(sandbox.credentials.emails.seller, sandbox.credentials.password);

    const checks: ValidationResult['checks'] = [];

    const adminUsers = await admin.from('users').select('id', { count: 'exact', head: true });
    checks.push({
      name: 'admin_global_access',
      ok: !adminUsers.error && (adminUsers.count || 0) >= 4,
      detail: adminUsers.error?.message || `users visíveis: ${adminUsers.count || 0}`,
    });

    const ownerStores = await owner.from('stores').select('id, name').eq('id', sandbox.storeId);
    checks.push({
      name: 'owner_reads_linked_store',
      ok: !ownerStores.error && (ownerStores.data?.length || 0) === 1,
      detail: ownerStores.error?.message || `stores visíveis: ${ownerStores.data?.length || 0}`,
    });

    checks.push({
      name: 'owner_cannot_create_feedback',
      ok: await tryDeniedFeedbackInsert(owner, sandbox, 'owner'),
      detail: 'insert feedback bloqueado para dono',
    });

    const managerReview = await manager.from('pdi_reviews').insert({
      pdi_id: sandbox.pdiId,
      evolution: 'Validação mensal live executada.',
      difficulties: 'Nenhuma crítica nova.',
      adjustments: 'Acompanhar follow-up até o próximo ciclo.',
      next_review_date: '2026-05-14',
    }).select('id').single();
    checks.push({
      name: 'manager_creates_pdi_review',
      ok: !managerReview.error && Boolean(managerReview.data?.id),
      detail: managerReview.error?.message || `review_id: ${managerReview.data?.id}`,
    });

    const sellerPdis = await seller.from('pdis').select('id, seller_id, meta_6m, action_1').eq('seller_id', sandbox.users.seller.id);
    checks.push({
      name: 'seller_reads_own_pdi',
      ok: !sellerPdis.error && (sellerPdis.data?.length || 0) >= 1,
      detail: sellerPdis.error?.message || `pdis visíveis: ${sellerPdis.data?.length || 0}`,
    });

    const sellerFeedbacks = await seller.from('feedbacks').select('id, seller_id, acknowledged').eq('seller_id', sandbox.users.seller.id);
    checks.push({
      name: 'seller_reads_own_feedback',
      ok: !sellerFeedbacks.error && (sellerFeedbacks.data?.length || 0) >= 1,
      detail: sellerFeedbacks.error?.message || `feedbacks visíveis: ${sellerFeedbacks.data?.length || 0}`,
    });

    const sellerNotifications = await seller.from('notifications').select('id, read, title').eq('recipient_id', sandbox.users.seller.id).order('created_at', { ascending: false });
    const firstNotificationId = sellerNotifications.data?.[0]?.id || null;
    if (firstNotificationId) {
      await seller.from('notifications').update({ read: true }).eq('id', firstNotificationId).eq('recipient_id', sandbox.users.seller.id);
    }
    const sellerUnread = await seller.from('notifications').select('id').eq('recipient_id', sandbox.users.seller.id).eq('read', false);
    checks.push({
      name: 'seller_reads_and_acknowledges_notifications',
      ok: !sellerNotifications.error && (sellerNotifications.data?.length || 0) >= 1 && !sellerUnread.error,
      detail: sellerNotifications.error?.message || `notifications visíveis: ${sellerNotifications.data?.length || 0}, unread restantes: ${sellerUnread.data?.length || 0}`,
    });

    checks.push({
      name: 'seller_cannot_create_feedback',
      ok: await tryDeniedFeedbackInsert(seller, sandbox, 'seller'),
      detail: 'insert feedback bloqueado para vendedor',
    });

    const teamProgress = await manager.from('training_progress').select('training_id').eq('user_id', sandbox.users.seller.id);
    checks.push({
      name: 'training_progress_available',
      ok: !teamProgress.error && (teamProgress.data?.length || 0) >= 1,
      detail: teamProgress.error?.message || `treinamentos assistidos: ${teamProgress.data?.length || 0}`,
    });

    const reprocess = await validateReprocessIdempotency(sql, sandbox);
    checks.push({
      name: 'reprocess_hash_idempotency',
      ok: reprocess.processed && reprocess.duplicateBlocked,
      detail: `processed=${reprocess.processed}, duplicateBlocked=${reprocess.duplicateBlocked}`,
    });

    const dryRuns = {
      matinal: await runDryRun('relatorio-matinal', sandbox.storeId),
      semanal: await runDryRun('feedback-semanal', sandbox.storeId),
      mensal: await runDryRun('relatorio-mensal', sandbox.storeId),
    };

    checks.push({
      name: 'dry_run_matinal',
      ok: (dryRuns.matinal as { ok: boolean }).ok,
      detail: JSON.stringify((dryRuns.matinal as { payload: unknown }).payload),
    });
    checks.push({
      name: 'dry_run_semanal',
      ok: (dryRuns.semanal as { ok: boolean }).ok,
      detail: JSON.stringify((dryRuns.semanal as { payload: unknown }).payload),
    });
    checks.push({
      name: 'dry_run_mensal',
      ok: (dryRuns.mensal as { ok: boolean }).ok,
      detail: JSON.stringify((dryRuns.mensal as { payload: unknown }).payload),
    });

    const schemaRows = await sql<{
      pdi_reviews_exists: boolean;
      has_notification_inbox: boolean;
      has_broadcast_rpc: boolean;
      has_reprocess_hash: boolean;
      has_daily_team_status_view: boolean;
      has_seller_tenure_view: boolean;
    }[]>`
      select
        exists(select 1 from information_schema.tables where table_schema = 'public' and table_name = 'pdi_reviews') as pdi_reviews_exists,
        exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notifications' and column_name = 'recipient_id') as has_notification_inbox,
        exists(select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'send_broadcast_notification') as has_broadcast_rpc,
        exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'reprocess_logs' and column_name = 'file_hash') as has_reprocess_hash,
        exists(select 1 from information_schema.views where table_schema = 'public' and table_name = 'view_daily_team_status') as has_daily_team_status_view,
        exists(select 1 from information_schema.views where table_schema = 'public' and table_name = 'view_seller_tenure_status') as has_seller_tenure_view
    `;

    const cron = await sql<Array<{ jobname: string; schedule: string; active: boolean }>>`
      select jobname, schedule, active
      from cron.job
      where jobname in ('mx-morning-report-1030', 'mx-weekly-feedback-1230', 'mx-monthly-report')
      order by jobname
    `;

    const result: ValidationResult = {
      ok: checks.every((check) => check.ok) && Object.values(schemaRows[0] || {}).every(Boolean) && cron.length === 3,
      checks,
      dryRuns,
      schema: schemaRows[0] || {},
      cron,
      sandbox,
    };

    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

validate().catch((error) => {
  console.error(error);
  process.exit(1);
});
