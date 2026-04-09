-- SQL Migration: Register Official Recipients for PAAY MOTORS
-- Baseado no arquivo CONFIG.html

DO $$
DECLARE
    v_store_id UUID;
BEGIN
    -- Obter ID da loja PAAY MOTORS
    SELECT id INTO v_store_id FROM public.stores WHERE name = 'PAAY MOTORS' LIMIT 1;

    IF v_store_id IS NOT NULL THEN
        INSERT INTO public.store_delivery_rules (
            store_id, 
            matinal_recipients, 
            weekly_recipients, 
            monthly_recipients
        )
        VALUES (
            v_store_id,
            ARRAY['luzdirecaoconsultoria@gmail.com', 'danieljsvendas@gmail.com', 'paaymotors@gmail.com'],
            ARRAY['luzdirecaoconsultoria@gmail.com', 'danieljsvendas@gmail.com', 'paaymotors@gmail.com'],
            ARRAY['luzdirecaoconsultoria@gmail.com', 'danieljsvendas@gmail.com', 'paaymotors@gmail.com']
        )
        ON CONFLICT (store_id) DO UPDATE SET
            matinal_recipients = EXCLUDED.matinal_recipients,
            weekly_recipients = EXCLUDED.weekly_recipients,
            monthly_recipients = EXCLUDED.monthly_recipients,
            updated_at = NOW();
            
        RAISE NOTICE 'Destinatários para PAAY MOTORS registrados com sucesso.';
    ELSE
        RAISE NOTICE 'Loja PAAY MOTORS não encontrada.';
    END IF;
END $$;
