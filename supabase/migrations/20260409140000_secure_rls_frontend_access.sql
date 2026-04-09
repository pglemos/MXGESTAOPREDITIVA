-- SEGURANÇA CRÍTICA: Remoção do supabaseAdmin no frontend
-- Essa migração substitui a necessidade do bypass de segurança via Service Role Key (supabaseAdmin),
-- permitindo explicitamente que a camada frontend (logada) realize consultas analíticas em tabelas transacionais chave.

-- 1. daily_checkins: Para gerar as métricas de performance globais e análises da rede,
--    usuários da organização (consultores, gerentes, diretores e admins) precisam do SELECT nessas métricas.
DROP POLICY IF EXISTS "daily_checkins_select" ON public.daily_checkins;
CREATE POLICY "daily_checkins_select" ON public.daily_checkins
    FOR SELECT TO authenticated
    USING (true); -- Leitura aberta para autenticados; UI filtra. Operações de ESCRITA permanecem restritas.

-- 2. store_sellers: Relacionamento de vendedores vinculados às suas lojas e cotas
--    Essencial para cálculo de ranking e absorção disciplinar do Painel do Consultor.
DROP POLICY IF EXISTS "store_sellers_select" ON public.store_sellers;
CREATE POLICY "store_sellers_select" ON public.store_sellers
    FOR SELECT TO authenticated
    USING (true);

-- Garante que o RLS continua ativo
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_sellers ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.daily_checkins IS 'Dados operacionais sensíveis: Leituras em painéis agora feitas com token do usuário em vez de bypass Admin.';
COMMENT ON TABLE public.store_sellers IS 'Vínculo especialista x loja: Liberado para leituras analíticas.';