#!/usr/bin/env node
/**
 * Story 0.6 — Smoke Tests "POST Direto → 403/401"
 * T-03 (qa-review §6) / DB-016 / DB-019
 *
 * Valida via HTTP real (PostgREST) que tabelas sensíveis bloqueiam
 * POST direto de usuário authenticated não-admin.
 *
 * Uso:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_ANON_KEY=eyJ... \
 *   SUPABASE_TEST_JWT=eyJ...  # JWT de role 'vendedor' não-admin
 *   node scripts/smoke_403_postgrest.mjs
 *
 * Exit codes: 0 = todos rejeitados como esperado | 1 = pelo menos um vazou (BUG)
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const TEST_JWT = process.env.SUPABASE_TEST_JWT;

if (!SUPABASE_URL || !ANON_KEY) {
    console.error('❌ Falta env: SUPABASE_URL e SUPABASE_ANON_KEY');
    process.exit(2);
}

// Sem JWT, smoke usa apenas anon. Útil para validar bloqueio de não-autenticado também.
if (!TEST_JWT) {
    console.warn('⚠️  SUPABASE_TEST_JWT ausente — smoke roda com anon (esperado: 401/403 em todas).');
}

const HEADERS_BASE = {
    'apikey': ANON_KEY,
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_JWT ?? ANON_KEY}`,
    'Prefer': 'return=representation',
};

/**
 * Tabelas alvo + payload sintético + status esperado.
 *
 * Status esperado:
 *   401 = não autenticado (anon sem JWT)
 *   403 = autenticado mas RLS rejeita
 *   42501 = PostgREST sometimes returns 401 with code 42501 for RLS denials
 *
 *  xfail=true significa que ainda esperamos vazar até fix da story relacionada.
 */
const TARGETS = [
    {
        table: 'lancamentos_diarios',
        body: {
            seller_user_id: '00000000-0000-0000-0000-000000000001',
            store_id: '00000000-0000-0000-0000-000000000001',
            reference_date: '2025-01-01',
            metric_scope: 'daily',
        },
        debito: 'DB-016',
        xfail: false, // após Story 1.5/1.6 + canary REVOKE da Story 1.3 fica em true
    },
    {
        table: 'role_assignments_audit',
        body: { user_id: '00000000-0000-0000-0000-000000000001', role_name: 'administrador_geral', action: 'test' },
        debito: 'DB-019',
        xfail: false,
    },
    {
        table: 'usuarios',
        body: { name: 'pwned', email: 'pwn@x.com', role: 'administrador_geral' },
        debito: 'DB-021 (RLS usuarios)',
        xfail: false,
    },
    {
        table: 'vendedores_loja',
        body: { seller_user_id: '00000000-0000-0000-0000-000000000001', store_id: '00000000-0000-0000-0000-000000000001', is_active: true },
        debito: 'DB-022 (USING(true))',
        xfail: true, // ainda não tratado (Sprint 1 escopo)
    },
    {
        table: 'historico_regras_metas_loja',
        body: { store_id: '00000000-0000-0000-0000-000000000001', changed_by: '00000000-0000-0000-0000-000000000001', old_values: {}, new_values: {} },
        debito: 'DB-019 (Story 1.8)',
        xfail: false,
    },
    {
        table: 'roles',
        body: { name: 'pwned_role' },
        debito: 'DB-019 (Story 1.8)',
        xfail: false,
    },
];

function isRejected(status) {
    return status === 401 || status === 403;
}

async function probe({ table, body }) {
    const url = `${SUPABASE_URL}/rest/v1/${table}`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: HEADERS_BASE,
            body: JSON.stringify(body),
        });
        const text = await res.text().catch(() => '');
        return { status: res.status, body: text.slice(0, 200) };
    } catch (err) {
        return { status: 0, body: `network: ${err.message}` };
    }
}

(async () => {
    console.log(`🔥 Smoke 403 — ${TARGETS.length} alvos contra ${SUPABASE_URL}\n`);
    let failures = 0;
    let xfails = 0;
    let passed = 0;

    for (const target of TARGETS) {
        const { status, body } = await probe(target);
        const rejected = isRejected(status);
        const ok = target.xfail ? !rejected : rejected;

        if (ok && target.xfail) {
            console.log(`  ⚠️  ${target.table}: status ${status} (xfail aguardado — ainda vaza, ${target.debito})`);
            xfails++;
        } else if (ok) {
            console.log(`  ✅ ${target.table}: status ${status} (rejeitado ${target.debito})`);
            passed++;
        } else if (target.xfail) {
            console.log(`  🎉 ${target.table}: status ${status} (xfail virou pass! ${target.debito} fechado)`);
            passed++;
        } else {
            console.error(`  ❌ ${target.table}: status ${status} (VAZOU — esperado 401/403) ${target.debito}`);
            console.error(`     body: ${body}`);
            failures++;
        }
    }

    console.log('');
    console.log(`Resultado: ${passed} OK · ${xfails} xfail · ${failures} FAIL`);
    if (failures > 0) {
        console.error('\n❌ Smoke 403 FALHOU — pelo menos uma tabela aceitou POST direto inesperadamente.');
        process.exit(1);
    }
    console.log('\n✅ Smoke 403 OK — tabelas críticas bloqueiam POST direto.');
    process.exit(0);
})();
