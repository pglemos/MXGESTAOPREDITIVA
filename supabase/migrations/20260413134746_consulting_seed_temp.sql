-- SEED DATA: CRM de Consultoria (Teste)
-- Use este script no SQL Editor do Supabase apos rodar as migrations CONS-01 e CONS-02.

DO $$
DECLARE
    v_admin_id uuid;
    v_client_id uuid;
BEGIN
    -- 1. Pegar um ID de admin existente (ajuste se necessario)
    SELECT id INTO v_admin_id FROM public.users WHERE role = 'admin' LIMIT 1;

    IF v_admin_id IS NULL THEN
        RAISE NOTICE 'Nenhum usuario admin encontrado para o seed.';
        RETURN;
    END IF;

    -- 2. Inserir Cliente de Teste
    INSERT INTO public.consulting_clients (name, legal_name, cnpj, product_name, status, notes, created_by)
    VALUES (
        'Grupo Automotivo Premium', 
        'GAP VEICULOS LTDA', 
        '12.345.678/0001-90', 
        'MX PERFORMANCE 90D', 
        'ativo', 
        'Cliente focado em alta performance e revisao de processos de vendas.',
        v_admin_id
    )
    RETURNING id INTO v_client_id;

    -- 3. Inserir Unidade
    INSERT INTO public.consulting_client_units (client_id, name, city, state, is_primary)
    VALUES (v_client_id, 'GAP Matriz', 'Sao Paulo', 'SP', true);

    -- 4. Inserir Contato
    INSERT INTO public.consulting_client_contacts (client_id, name, email, phone, role, is_primary)
    VALUES (v_client_id, 'Ricardo Diretor', 'ricardo@gap.com.br', '(11) 99999-8888', 'Diretor Comercial', true);

    -- 5. Vincular Admin como Consultor Responsavel (Essencial para o RLS!)
    INSERT INTO public.consulting_assignments (client_id, user_id, assignment_role, active)
    VALUES (v_client_id, v_admin_id, 'responsavel', true)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Seed de Consultoria concluido com sucesso para o cliente GAP.';
END $$;
