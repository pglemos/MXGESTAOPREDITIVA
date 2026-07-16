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
  'FichaClienteSheet.jsx',
  'ModoAtaque.jsx',
  'NovoClienteModal.jsx',
  'WhatsAppRoteiro.jsx',
  'ProximaOportunidadeModal.jsx',
  'RetornoWhatsAppModal.jsx',
  'carteiraUtils.jsx',
  'proximoPassoLib.js',
  'VeiculosChegaram.jsx',
]

for (const filename of exactComponents) {
  const runtime = read(`src/components/carteira/${filename}`)
  const reference = read(`src/base44-reference/components/carteira/${filename}`)
  assert(runtime === reference, `${filename} is byte-for-byte equal to Base44 reference`)
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
  'carteira_salvar_cliente',
  'carteira_iniciar_missao',
  'carteira_atualizar_missao',
  'CarteiraHistorico',
  'CarteiraMissao',
  'mapMxClientToCarteiraVisual',
]) assert(adapter.includes(token), `normalized adapter includes ${token}`)

const migration = read('supabase/migrations/20260716190000_carteira_base44_parity.sql')
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

console.log('\nCarteira Base44 1:1 static verification passed.')
