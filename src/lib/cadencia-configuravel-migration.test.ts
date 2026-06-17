import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const migrationPath = new URL('../../supabase/migrations/20260616203000_cadencia_configuravel_vendedor.sql', import.meta.url)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8')
}

describe('cadencia configuravel migration contract', () => {
  test('cria catalogo versionado e estado por cliente', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.cadencia_fluxos')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.cadencia_estado_cliente')
    expect(sql).toContain('version        integer NOT NULL DEFAULT 1 CHECK (version > 0)')
    expect(sql).toContain('passos         jsonb NOT NULL CHECK')
    expect(sql).toContain('CONSTRAINT cadencia_estado_cliente_unique UNIQUE (cliente_id)')
    expect(sql).toContain('fluxo_version')
    expect(sql).toContain('passo_atual_key')
    expect(sql).toContain('tentativas_passo integer NOT NULL DEFAULT 0')
    expect(sql).toContain('tentativa_limite integer NOT NULL DEFAULT 1')
    expect(sql).toContain('reagendamentos_sem_sucesso integer NOT NULL DEFAULT 0')
  })

  test('semeia fluxos globais para internet, carteira e porta', () => {
    const sql = readMigration()

    expect(sql).toContain("'internet'::public.crm_canal")
    expect(sql).toContain("'carteira'::public.crm_canal")
    expect(sql).toContain("'porta'::public.crm_canal")
    expect(sql).toContain('internet_mensagem_1')
    expect(sql).toContain('carteira_retorno_1')
    expect(sql).toContain('porta_pos_atendimento')
    expect(sql).toContain("'limiteTentativas',3")
    expect(sql).toContain('WHERE NOT EXISTS')
  })

  test('declara RPC idempotente que preenche proxima acao do cliente', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.inicializar_cadencia_cliente')
    expect(sql).toContain('SECURITY DEFINER')
    expect(sql).toContain('ON CONFLICT (cliente_id) DO UPDATE')
    expect(sql).toContain('proxima_acao = COALESCE(proxima_acao, v_proxima_acao)')
    expect(sql).toContain('proxima_acao_em = COALESCE(proxima_acao_em, CURRENT_DATE + GREATEST(v_prazo_dias, 0))')
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.inicializar_cadencia_cliente(uuid) TO authenticated')
  })

  test('declara RPC de status que avanca ou mantem cliente vivo na cadencia', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.registrar_status_acao_cadencia')
    expect(sql).toContain("IF p_status NOT IN ('feito', 'nao_feito', 'aguardando') THEN")
    expect(sql).toContain("WHEN 'feito' THEN v_passo_atual->>'aoFazer'")
    expect(sql).toContain("WHEN 'nao_feito' THEN v_passo_atual->>'aoNaoFazer'")
    expect(sql).toContain("ELSE v_passo_atual->>'aoAguardar'")
    expect(sql).toContain("v_status_sem_sucesso := p_status IN ('nao_feito', 'aguardando')")
    expect(sql).toContain('v_tentativas_passo < v_limite_atual')
    expect(sql).toContain('v_proxima_data := CURRENT_DATE + 1')
    expect(sql).toContain('historico = COALESCE(historico')
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.registrar_status_acao_cadencia(uuid, text, text) TO authenticated')
  })

  test('RPC de status registra tentativas e encerra ou reagenda conforme limite', () => {
    const sql = readMigration()

    expect(sql).toContain('tentativas_passo = v_tentativas_passo')
    expect(sql).toContain('tentativa_limite = v_limite_proximo')
    expect(sql).toContain('reagendamentos_sem_sucesso = reagendamentos_sem_sucesso + CASE')
    expect(sql).toContain("'tentativa', CASE WHEN v_status_sem_sucesso THEN v_tentativa_registrada ELSE NULL END")
    expect(sql).toContain("'limiteTentativas', v_limite_atual")
    expect(sql).toContain("'reagendamentoAutomatico', v_reagendamento_automatico")
    expect(sql).toContain("'limiteEstourado', v_limite_estourado")
    expect(sql).toContain("'proximaAcaoEm', v_proxima_data")
    expect(sql).toContain("WHEN v_status_sem_sucesso THEN 'Cadencia encerrada por limite de tentativas'")
    expect(sql).toContain("WHEN v_status_sem_sucesso THEN 'cancelado'")
  })

  test('declara RPC compartilhada para listar agenda de cadencia da Central', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.listar_acoes_cadencia_vendedor')
    expect(sql).toContain('RETURNS TABLE')
    expect(sql).toContain('cadencia_estado_id uuid')
    expect(sql).toContain('cliente_nome text')
    expect(sql).toContain("WHERE estado.status = 'ativo'")
    expect(sql).toContain('p_data_inicio IS NULL OR estado.proxima_acao_em >= p_data_inicio')
    expect(sql).toContain('p_data_fim IS NULL OR estado.proxima_acao_em <= p_data_fim')
    expect(sql).toContain('estado.seller_user_id = auth.uid()')
    expect(sql).toContain('ORDER BY estado.proxima_acao_em ASC, cliente.nome ASC')
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.listar_acoes_cadencia_vendedor(date, date) TO authenticated')
  })

  test('mantem vendedor como consumidor e restringe configuracao a lideranca', () => {
    const sql = readMigration()

    expect(sql).toContain('cadencia_fluxos_write')
    expect(sql).toContain("public.user_has_role(ARRAY['admin_mx','master','consultant'])")
    expect(sql).toContain('public.is_manager_of(loja_id)')
    expect(sql).toContain('cadencia_estado_seller_rw')
    expect(sql).toContain('seller_user_id = auth.uid()')
  })
})
