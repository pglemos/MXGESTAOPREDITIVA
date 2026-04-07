import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

type SandboxUserKey = 'admin' | 'owner' | 'manager' | 'seller';

type SandboxUser = {
  key: SandboxUserKey;
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'dono' | 'gerente' | 'vendedor';
};

export type SandboxContext = {
  storeId: string;
  storeName: string;
  pdiId: string;
  feedbackId: string;
  broadcastId: string;
  users: Record<SandboxUserKey, SandboxUser>;
  credentials: {
    password: string;
    emails: Record<SandboxUserKey, string>;
  };
};

const STORE_NAME = process.env.MX_SANDBOX_STORE_NAME || 'SANDBOX MX QA';
const PASSWORD = process.env.MX_SANDBOX_PASSWORD || 'Mx#2026!';
const EMAILS: Record<SandboxUserKey, string> = {
  admin: 'admin@mxgestaopreditiva.com.br',
  owner: 'dono@mxgestaopreditiva.com.br',
  manager: 'gerente@mxgestaopreditiva.com.br',
  seller: 'vendedor@mxgestaopreditiva.com.br',
};
const LEGACY_EMAILS: Record<SandboxUserKey, string> = {
  admin: 'sandbox.admin@mxgestaopreditiva.com.br',
  owner: 'sandbox.dono@mxgestaopreditiva.com.br',
  manager: 'sandbox.gerente@mxgestaopreditiva.com.br',
  seller: 'sandbox.vendedor@mxgestaopreditiva.com.br',
};

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} ausente no ambiente`);
  return value;
}

function createServiceClient() {
  return createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function createSqlClient() {
  return postgres(getEnv('POSTGRES_URL'), { max: 1, ssl: 'require' });
}

async function findUserByEmail(supabase: ReturnType<typeof createServiceClient>, email: string) {
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const users = data?.users || [];
    const found = users.find((user) => user.email === email);
    if (found) return found;
    if (users.length < 200) return null;
    page += 1;
  }
}

async function ensureAuthUser(
  supabase: ReturnType<typeof createServiceClient>,
  user: { email: string; legacyEmail: string; name: string; role: SandboxUser['role'] },
) {
  const existing = await findUserByEmail(supabase, user.email) || await findUserByEmail(supabase, user.legacyEmail);
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      email: user.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: user.name, role: user.role },
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: user.name, role: user.role },
  });
  if (error) throw error;
  return data.user;
}

export async function seedLiveSandbox(): Promise<SandboxContext> {
  const supabase = createServiceClient();
  const sql = createSqlClient();

  try {
    const authUsers = await Promise.all([
      ensureAuthUser(supabase, { email: EMAILS.admin, legacyEmail: LEGACY_EMAILS.admin, name: 'Admin MX', role: 'admin' }),
      ensureAuthUser(supabase, { email: EMAILS.owner, legacyEmail: LEGACY_EMAILS.owner, name: 'Dono MX', role: 'dono' }),
      ensureAuthUser(supabase, { email: EMAILS.manager, legacyEmail: LEGACY_EMAILS.manager, name: 'Gerente MX', role: 'gerente' }),
      ensureAuthUser(supabase, { email: EMAILS.seller, legacyEmail: LEGACY_EMAILS.seller, name: 'Vendedor MX', role: 'vendedor' }),
    ]);

    const users: Record<SandboxUserKey, SandboxUser> = {
      admin: { key: 'admin', id: authUsers[0].id, email: EMAILS.admin, name: 'Admin MX', role: 'admin' },
      owner: { key: 'owner', id: authUsers[1].id, email: EMAILS.owner, name: 'Dono MX', role: 'dono' },
      manager: { key: 'manager', id: authUsers[2].id, email: EMAILS.manager, name: 'Gerente MX', role: 'gerente' },
      seller: { key: 'seller', id: authUsers[3].id, email: EMAILS.seller, name: 'Vendedor MX', role: 'vendedor' },
    };

    const userIds = Object.values(users).map((user) => user.id);
    let storeId = '';
    let pdiId = '';
    let feedbackId = '';

    await sql.begin(async (tx) => {
      const existingStore = await tx<{ id: string }[]>`
        select id
        from public.stores
        where name = ${STORE_NAME}
        limit 1
      `;

      if (existingStore.length > 0) {
        storeId = existingStore[0].id;
        await tx`
          update public.stores
             set manager_email = ${users.manager.email},
                 active = true,
                 source_mode = 'native_app'
           where id = ${storeId}
        `;
      } else {
        const insertedStore = await tx<{ id: string }[]>`
          insert into public.stores (name, manager_email, active, source_mode)
          values (${STORE_NAME}, ${users.manager.email}, true, 'native_app')
          returning id
        `;
        storeId = insertedStore[0].id;
      }

      for (const user of Object.values(users)) {
        await tx`
          insert into public.users (id, name, email, role, active, is_venda_loja, created_at, updated_at)
          values (${user.id}, ${user.name}, ${user.email}, ${user.role}, true, false, now(), now())
          on conflict (id) do update
          set name = excluded.name,
              email = excluded.email,
              role = excluded.role,
              active = true,
              updated_at = now()
        `;
      }

      await tx`delete from public.notification_reads where user_id in ${sql(userIds)}`;
      await tx`delete from public.notifications where recipient_id in ${sql(userIds)} or store_id = ${storeId}`;
      await tx`delete from public.weekly_feedback_reports where store_id = ${storeId}`;
      await tx`delete from public.feedbacks where store_id = ${storeId}`;
      await tx`delete from public.pdi_reviews where pdi_id in (select id from public.pdis where store_id = ${storeId})`;
      await tx`delete from public.pdis where store_id = ${storeId}`;
      await tx`delete from public.daily_checkins where store_id = ${storeId}`;
      await tx`delete from public.training_progress where user_id in ${sql(userIds)}`;
      await tx`delete from public.store_sellers where store_id = ${storeId}`;
      await tx`delete from public.memberships where store_id = ${storeId} and user_id in ${sql([users.owner.id, users.manager.id, users.seller.id])}`;

      await tx`
        insert into public.memberships (user_id, store_id, role)
        values
          (${users.owner.id}, ${storeId}, 'dono'),
          (${users.manager.id}, ${storeId}, 'gerente'),
          (${users.seller.id}, ${storeId}, 'vendedor')
      `;

      await tx`
        insert into public.store_sellers (store_id, seller_user_id, started_at, is_active, closing_month_grace)
        values (${storeId}, ${users.seller.id}, '2026-03-01', true, false)
      `;

      await tx`
        insert into public.store_delivery_rules (
          store_id, matinal_recipients, weekly_recipients, monthly_recipients,
          whatsapp_group_ref, timezone, active
        ) values (
          ${storeId},
          ${[users.owner.email, users.manager.email]},
          ${[users.owner.email, users.manager.email]},
          ${[users.owner.email, users.manager.email]},
          'sandbox-mx-group',
          'America/Sao_Paulo',
          true
        )
        on conflict (store_id) do update
        set matinal_recipients = excluded.matinal_recipients,
            weekly_recipients = excluded.weekly_recipients,
            monthly_recipients = excluded.monthly_recipients,
            whatsapp_group_ref = excluded.whatsapp_group_ref,
            timezone = excluded.timezone,
            active = true
      `;

      await tx`
        insert into public.store_benchmarks (store_id, lead_to_agend, agend_to_visit, visit_to_sale, updated_by)
        values (${storeId}, 20, 60, 33, ${users.admin.id})
        on conflict (store_id) do update
        set lead_to_agend = excluded.lead_to_agend,
            agend_to_visit = excluded.agend_to_visit,
            visit_to_sale = excluded.visit_to_sale,
            updated_by = excluded.updated_by,
            updated_at = now()
      `;

      await tx`
        insert into public.store_meta_rules (
          store_id, monthly_goal, individual_goal_mode,
          include_venda_loja_in_store_total, include_venda_loja_in_individual_goal,
          bench_lead_agd, bench_agd_visita, bench_visita_vnd, updated_by
        ) values (${storeId}, 12, 'even', true, false, 20, 60, 33, ${users.admin.id})
        on conflict (store_id) do update
        set monthly_goal = excluded.monthly_goal,
            individual_goal_mode = excluded.individual_goal_mode,
            include_venda_loja_in_store_total = excluded.include_venda_loja_in_store_total,
            include_venda_loja_in_individual_goal = excluded.include_venda_loja_in_individual_goal,
            bench_lead_agd = excluded.bench_lead_agd,
            bench_agd_visita = excluded.bench_agd_visita,
            bench_visita_vnd = excluded.bench_visita_vnd,
            updated_by = excluded.updated_by,
            updated_at = now()
      `;

      const checkins: Array<[string, number, number, number, number, number, number, number]> = [
        ['2026-03-30', 10, 2, 1, 4, 2, 0, 1],
        ['2026-03-31', 11, 3, 1, 5, 2, 0, 1],
        ['2026-04-01', 12, 3, 1, 5, 2, 0, 1],
        ['2026-04-02', 9, 2, 1, 4, 1, 0, 1],
        ['2026-04-03', 8, 2, 1, 3, 1, 0, 1],
        ['2026-04-04', 13, 4, 2, 6, 2, 1, 2],
        ['2026-04-05', 7, 1, 1, 2, 1, 0, 1],
        ['2026-04-06', 10, 2, 1, 4, 1, 1, 1],
      ];

      for (const [referenceDate, leads, agdCartPrev, agdNetPrev, visitPrev, vndPorta, vndCart, vndNet] of checkins) {
        await tx`
          insert into public.daily_checkins (
            seller_user_id, store_id, reference_date, submitted_at, metric_scope,
            leads_prev_day, agd_cart_prev_day, agd_net_prev_day,
            agd_cart_today, agd_net_today,
            visit_prev_day, vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day,
            created_by, updated_at
          ) values (
            ${users.seller.id},
            ${storeId},
            ${referenceDate},
            ${`${referenceDate}T12:00:00-03:00`},
            'daily',
            ${leads},
            ${agdCartPrev},
            ${agdNetPrev},
            ${agdCartPrev},
            ${agdNetPrev},
            ${visitPrev},
            ${vndPorta},
            ${vndCart},
            ${vndNet},
            ${users.seller.id},
            now()
          )
          on conflict (seller_user_id, store_id, reference_date) do update
          set leads_prev_day = excluded.leads_prev_day,
              agd_cart_prev_day = excluded.agd_cart_prev_day,
              agd_net_prev_day = excluded.agd_net_prev_day,
              agd_cart_today = excluded.agd_cart_today,
              agd_net_today = excluded.agd_net_today,
              visit_prev_day = excluded.visit_prev_day,
              vnd_porta_prev_day = excluded.vnd_porta_prev_day,
              vnd_cart_prev_day = excluded.vnd_cart_prev_day,
              vnd_net_prev_day = excluded.vnd_net_prev_day,
              submitted_at = excluded.submitted_at,
              updated_at = now()
        `;
      }

      const feedbackRows = await tx<{ id: string }[]>`
        insert into public.feedbacks (
          store_id, manager_id, seller_id, week_reference,
          leads_week, agd_week, visit_week, vnd_week,
          tx_lead_agd, tx_agd_visita, tx_visita_vnd,
          meta_compromisso, positives, attention_points, action, notes,
          team_avg_json, diagnostic_json, commitment_suggested, acknowledged, acknowledged_at
        ) values (
          ${storeId}, ${users.manager.id}, ${users.seller.id}, '2026-03-30',
          70, 23, 12, 8,
          32.9, 52.2, 66.7,
          10,
          'Manteve disciplina diária e retomou funil.',
          'A conversão de agendamento em visita ainda oscila.',
          'Travar follow-up no mesmo dia e confirmar agenda na véspera.',
          'Sandbox QA',
          ${JSON.stringify({ tx_lead_agd: 32.9, tx_agd_visita: 52.2, tx_visita_vnd: 66.7 })}::jsonb,
          ${JSON.stringify({ gargalo: 'AGD_VISITA', mensagem: 'Conversão intermediária abaixo do benchmark.' })}::jsonb,
          10,
          false,
          null
        )
        on conflict (seller_id, week_reference) do update
        set positives = excluded.positives,
            attention_points = excluded.attention_points,
            action = excluded.action,
            notes = excluded.notes,
            team_avg_json = excluded.team_avg_json,
            diagnostic_json = excluded.diagnostic_json,
            commitment_suggested = excluded.commitment_suggested,
            acknowledged = false,
            acknowledged_at = null
        returning id
      `;
      feedbackId = feedbackRows[0].id;

      const pdiRows = await tx<{ id: string }[]>`
        insert into public.pdis (
          store_id, manager_id, seller_id,
          objective, action,
          meta_6m, meta_12m, meta_24m,
          comp_prospeccao, comp_abordagem, comp_demonstracao, comp_fechamento,
          comp_crm, comp_digital, comp_disciplina, comp_organizacao, comp_negociacao, comp_produto,
          action_1, action_2, action_3, action_4, action_5,
          due_date, status, acknowledged, created_at, updated_at
        ) values (
          ${storeId}, ${users.manager.id}, ${users.seller.id},
          'Atingir constância de 10 vendas/mês.',
          'Padronizar follow-up em até 30 minutos.',
          'Atingir constância de 10 vendas/mês.',
          'Assumir carteira premium com previsibilidade.',
          'Preparar trilha para liderança comercial.',
          7, 7, 6, 6,
          6, 6, 8, 7, 6, 7,
          'Padronizar follow-up em até 30 minutos.',
          'Reconfirmar agenda no dia anterior.',
          'Treinar apresentação de valor.',
          'Revisar objeções mais frequentes com o gerente.',
          'Fechar rotina semanal de CRM sem pendência.',
          '2026-06-30',
          'em_andamento',
          false,
          now(),
          now()
        )
        returning id
      `;
      pdiId = pdiRows[0].id;

      await tx`
        insert into public.pdi_reviews (pdi_id, evolution, difficulties, adjustments, next_review_date)
        values (${pdiId}, 'Evolução consistente no ritmo de contatos.', 'Oscilação no comparecimento das visitas.', 'Ajustar reconfirmação e roteiro de abordagem.', '2026-05-07')
      `;

      await tx`
        insert into public.weekly_feedback_reports (
          store_id, week_start, week_end, team_avg_json, ranking_json, benchmark_json,
          weekly_goal, report_url, email_status, recipients, warnings
        ) values (
          ${storeId},
          '2026-03-30',
          '2026-04-05',
          ${JSON.stringify({ leads: 70, agd: 23, vis: 12, vnd: 8, tx_lead_agd: 32.9, tx_agd_visita: 52.2, tx_visita_vnd: 66.7 })}::jsonb,
          ${JSON.stringify([{ seller_id: users.seller.id, seller_name: users.seller.name, leads: 70, agd: 23, vis: 12, vnd: 8 }])}::jsonb,
          ${JSON.stringify({ lead_to_agend: 20, agend_to_visit: 60, visit_to_sale: 33 })}::jsonb,
          3,
          null,
          'dry_run',
          ${[users.owner.email, users.manager.email]},
          ${['Sandbox semanal preparado para QA']}
        )
        on conflict (store_id, week_start, week_end) do update
        set team_avg_json = excluded.team_avg_json,
            ranking_json = excluded.ranking_json,
            benchmark_json = excluded.benchmark_json,
            weekly_goal = excluded.weekly_goal,
            email_status = excluded.email_status,
            recipients = excluded.recipients,
            warnings = excluded.warnings,
            updated_at = now()
      `;

      const trainingsCount = await tx<{ count: number }[]>`
        select count(*)::int as count
        from public.trainings
        where title like 'Sandbox MX %'
      `;

      if ((trainingsCount[0]?.count || 0) === 0) {
        await tx`
          insert into public.trainings (title, description, type, video_url, target_audience, active)
          values
            ('Sandbox MX Prospecção', 'Treinamento de prospecção para sandbox.', 'prospeccao', 'https://example.com/prospeccao', 'vendedor', true),
            ('Sandbox MX Atendimento', 'Treinamento de atendimento para sandbox.', 'atendimento', 'https://example.com/atendimento', 'vendedor', true),
            ('Sandbox MX Fechamento', 'Treinamento de fechamento para sandbox.', 'fechamento', 'https://example.com/fechamento', 'vendedor', true)
        `;
      }

      const training = await tx<{ id: string }[]>`
        select id
        from public.trainings
        where title = 'Sandbox MX Prospecção'
        limit 1
      `;

      if (training[0]?.id) {
        await tx`
          insert into public.training_progress (user_id, training_id, watched_at)
          values (${users.seller.id}, ${training[0].id}, now())
          on conflict (user_id, training_id) do update
          set watched_at = excluded.watched_at
        `;
      }
    });

    const { data: broadcastId, error: broadcastError } = await supabase.rpc('send_broadcast_notification', {
      p_title: 'Broadcast Sandbox MX',
      p_message: 'Mensagem de validação operacional da sandbox.',
      p_type: 'system',
      p_priority: 'medium',
      p_store_id: null,
      p_target_role: 'todos',
      p_link: '/notificacoes',
      p_sender_id: users.admin.id,
    });

    if (broadcastError) throw broadcastError;

    return {
      storeId,
      storeName: STORE_NAME,
      pdiId,
      feedbackId,
      broadcastId,
      users,
      credentials: {
        password: PASSWORD,
        emails: EMAILS,
      },
    };
  } finally {
    await sql.end();
  }
}

async function main() {
  const result = await seedLiveSandbox();
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
