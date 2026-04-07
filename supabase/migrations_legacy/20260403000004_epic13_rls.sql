-- EPIC-13: Hardening e Aceite Final (RLS)
-- Segurança Nível-Linha para os dados operacionais da Metodologia MX

-- 1. Ativar RLS para todas as tabelas canônicas
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_delivery_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_meta_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reprocess_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_reviews ENABLE ROW LEVEL SECURITY;

-- 2. Políticas Globais Administrativas
-- Admins têm visão irrestrita para comandar a rede
CREATE POLICY "Admins podem ler toda a rede" ON public.stores FOR ALL USING (auth.jwt()->>'role' = 'admin');
CREATE POLICY "Admins leem store_sellers" ON public.store_sellers FOR ALL USING (auth.jwt()->>'role' = 'admin');
CREATE POLICY "Admins leem daily_checkins" ON public.daily_checkins FOR ALL USING (auth.jwt()->>'role' = 'admin');
CREATE POLICY "Admins leem benchmarks" ON public.store_benchmarks FOR ALL USING (auth.jwt()->>'role' = 'admin');
CREATE POLICY "Admins leem reprocess_logs" ON public.reprocess_logs FOR ALL USING (auth.jwt()->>'role' = 'admin');

-- 3. Políticas Nível-Loja (Gerentes e Consultores)
-- Consultores (Regionais) podem ver as lojas as quais estão designados. (Baseado na tabela memberships)
-- Como o RLS antigo cobre a tabela memberships, faremos um join lógico.

-- Check-ins: Vendedor vê o próprio; Gerente vê da loja inteira.
CREATE POLICY "Seller can view own checkins" 
    ON public.daily_checkins FOR SELECT 
    USING (seller_user_id = auth.uid() OR store_id IN (
        SELECT store_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('gerente', 'consultor')
    ));

CREATE POLICY "Seller can insert own checkins" 
    ON public.daily_checkins FOR INSERT 
    WITH CHECK (seller_user_id = auth.uid());

-- PDIs: Vendedor vê o próprio; Gerente vê da loja inteira.
CREATE POLICY "Seller can view own PDI" 
    ON public.pdis FOR SELECT 
    USING (seller_id = auth.uid() OR seller_id IN (
        SELECT user_id FROM public.memberships WHERE store_id IN (
            SELECT store_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('gerente', 'consultor')
        )
    ));

-- Reprocessamento (Apenas Consultores e Admins podem enxergar/criar)
CREATE POLICY "Consultors view reprocess logs" 
    ON public.reprocess_logs FOR SELECT 
    USING (store_id IN (
        SELECT store_id FROM public.memberships WHERE user_id = auth.uid() AND role = 'consultor'
    ));

-- Finalizado Hardening MX
