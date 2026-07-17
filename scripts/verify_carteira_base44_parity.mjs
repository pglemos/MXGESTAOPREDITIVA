import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

function read(path) {
  return readFileSync(path, 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`)
    process.exitCode = 1
  } else {
    console.log(`✓ ${message}`)
  }
}

const route = read('src/pages/CarteiraClientes.tsx')
assert(route.includes('CarteiraClientesBase44Page'), 'route uses CarteiraClientesBase44Page')
assert(!route.includes('CarteiraClientes.container'), 'legacy route is not mounted')

const page = read('src/features/carteira-clientes/pages/CarteiraClientesBase44Page.tsx')
for (const token of [
  'CarteiraClientesReference',
  'installCarteiraBase44Adapter',
  'CarteiraAtivaTab',
  'PlanoAtaqueTab',
  'ExecucaoMissao',
  'NovoClienteModal',
  'WhatsAppRoteiro',
  'FichaClienteSheet',
  'ProximaOportunidadeModal',
  'RetornoWhatsAppModal',
  'ModoAtaque',
]) assert(page.includes(token), `page preserves ${token}`)

const exactComponents = [
  'CarteiraAtivaTab.jsx',
  'ModoAtaque.jsx',
  'ProximaOportunidadeModal.jsx',
  'RetornoWhatsAppModal.jsx',
  'carteiraUtils.jsx',
  'proximoPassoLib.js',
  'VeiculosChegaram.jsx',
]

const integratedComponents = {
  'FichaClienteSheet.jsx': [
    'w-full sm:max-w-xl overflow-y-auto p-0 flex flex-col',
    'Mentor Comercial',
    'Alterar próximo passo',
    'sticky bottom-0 bg-white border-t border-slate-100',
  ],
  'NovoClienteModal.jsx': [
    'max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl',
    'Novo Cliente',
    'Em que momento esse cliente está?',
    'Adicionar cliente',
  ],
  'WhatsAppRoteiro.jsx': [
    'max-w-md rounded-2xl max-h-[92vh] overflow-y-auto',
    'Registrar resultado do contato',
    'animate-in slide-in-from-top-2 duration-200',
    'Registrar resultado',
  ],
}

for (const filename of exactComponents) {
  const runtime = read(`src/components/carteira/${filename}`)
  const reference = read(`src/base44-reference/components/carteira/${filename}`)
  assert(runtime === reference, `${filename} is byte-for-byte equal to Base44 reference`)
}

for (const [filename, visualTokens] of Object.entries(integratedComponents)) {
  const runtime = read(`src/components/carteira/${filename}`)
  const reference = read(`src/base44-reference/components/carteira/${filename}`)
  for (const token of visualTokens) {
    assert(reference.includes(token), `${filename} reference includes ${token}`)
    assert(runtime.includes(token), `${filename} runtime preserves ${token}`)
  }
}

const planTab = read('src/components/carteira/PlanoAtaqueTab.jsx')
for (const token of ['PlanoAtaqueTabBase44', 'CarteiraMissao.filter', 'clientes_ids']) {
  assert(planTab.includes(token), `plan tab includes ${token}`)
}

const mission = read('src/components/carteira/ExecucaoMissao.jsx')
for (const token of [
  'bg-[#005BFF]',
  'rounded-2xl',
  'CarteiraMissao.update',
  'indice_atual',
  'mensagens_enviadas',
  'pulados',
  'Aguardando respostas',
]) assert(mission.includes(token), `mission execution includes ${token}`)

const adapter = read('src/features/carteira-clientes/lib/installCarteiraBase44Adapter.js')
for (const token of [
  'carteira_salvar_cliente_v2',
  'carteira_iniciar_missao_v2',
  'carteira_atualizar_missao_v2',
  'carteiraMutationCoordinator',
  'CarteiraHistorico',
  'CarteiraMissao',
  'mapMxClientToCarteiraVisual',
]) assert(adapter.includes(token), `normalized adapter includes ${token}`)

const hardeningMigration = read('supabase/migrations/20260716210000_carteira_base44_security_hardening.sql')
for (const token of [
  'carteira_salvar_cliente_v2',
  'carteira_iniciar_missao_v2',
  'carteira_atualizar_missao_v2',
  'pg_advisory_xact_lock',
  'expected_revision',
  'REVOKE ALL ON TABLE public.carteira_missoes FROM anon',
]) assert(hardeningMigration.includes(token), `hardening migration includes ${token}`)

for (const functionName of [
  'carteira_salvar_cliente_v2',
  'carteira_iniciar_missao_v2',
  'carteira_atualizar_missao_v2',
]) {
  const marker = `CREATE OR REPLACE FUNCTION public.${functionName}(`
  const start = hardeningMigration.indexOf(marker)
  const end = hardeningMigration.indexOf('$$;', start)
  assert(start >= 0 && end > start, `${functionName} has its own function definition`)
  const definition = start >= 0 && end > start ? hardeningMigration.slice(start, end) : ''
  assert(definition.includes('SECURITY DEFINER'), `${functionName} is SECURITY DEFINER`)
  assert(definition.includes('SET search_path = public, pg_temp'), `${functionName} sets an explicit safe search_path`)
}

const conflictMigration = read('supabase/migrations/20260716214000_carteira_concurrency_conflict_nonretryable.sql')
for (const token of [
  "RAISE sqlstate 'PT409'",
  "message = 'Conflito de concorrência na missão.'",
  'carteira_atualizar_missao_v2(uuid, jsonb, text)',
]) assert(conflictMigration.includes(token), `conflict migration includes ${token}`)

const ledgerMigration = read('supabase/migrations/20260716215000_carteira_mission_idempotency_ledger.sql')
for (const token of [
  'CREATE TABLE IF NOT EXISTS public.carteira_missao_mutations',
  'PRIMARY KEY (missao_id, user_id, idempotency_key)',
  'v_payload_hash text := md5(p_payload::text)',
  'Chave de idempotência reutilizada com payload diferente.',
  'INSERT INTO public.carteira_missao_mutations',
]) assert(ledgerMigration.includes(token), `idempotency ledger migration includes ${token}`)

const ledgerIndexMigration = read('supabase/migrations/20260716215500_carteira_mission_ledger_user_fk_index.sql')
for (const token of [
  'CREATE INDEX IF NOT EXISTS carteira_missao_mutations_user_id_idx',
  'ON public.carteira_missao_mutations (user_id)',
]) assert(ledgerIndexMigration.includes(token), `idempotency ledger index migration includes ${token}`)

const migration = read('supabase/migrations/20260716190050_carteira_base44_parity.sql')
for (const token of [
  'CREATE TABLE IF NOT EXISTS public.carteira_missoes',
  'CREATE TABLE IF NOT EXISTS public.carteira_missao_itens',
  'CREATE OR REPLACE FUNCTION public.carteira_salvar_cliente',
  'CREATE OR REPLACE FUNCTION public.carteira_iniciar_missao',
  'CREATE OR REPLACE FUNCTION public.carteira_atualizar_missao',
  'idempotency_key',
  'FOR UPDATE',
  'do_not_contact',
  'reactivation_at',
]) assert(migration.includes(token), `migration includes ${token}`)
assert(!migration.includes('CREATE TABLE public.CarteiraCliente'), 'monolithic Base44 entity was not imported')

if (process.exitCode) {
  console.error('\nCarteira Base44 1:1 verification failed.')
  process.exit(process.exitCode)
}

console.log('\nCarteira Base44 1:1 source contract verification passed.')
console.log('\nRunning rendered presentation parity...')
execFileSync('bun', [
  'test',
  '--isolate',
  'src/features/carteira-clientes/components/carteira-rendered-parity.test.tsx',
], { stdio: 'inherit' })
console.log('\nRunning behavioral mutation resilience...')
execFileSync('bun', [
  'test',
  '--isolate',
  'src/features/carteira-clientes/components/carteira-resilience.test.tsx',
  'src/features/carteira-clientes/lib/carteira-mutation-coordinator.test.ts',
], { stdio: 'inherit' })
console.log('\nRunning atomic design token lint...')
execFileSync(process.execPath, ['scripts/lint-tokens-ast.mjs'], { stdio: 'inherit' })
