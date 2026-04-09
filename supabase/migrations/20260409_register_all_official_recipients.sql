-- SQL Migration: Register Official Recipients for ALL Stores
-- Baseado no arquivo CONFIG.html

DO $$
DECLARE
    r RECORD;
    v_store_id UUID;
    v_emails TEXT[];
BEGIN
    -- Lista de lojas e e-mails extraídos do CONFIG.html
    -- Formato: (Nome da Loja, Lista de E-mails)
    FOR r IN 
        SELECT * FROM (VALUES 
            ('PAAY MOTORS', 'luzdirecaoconsultoria@gmail.com,danieljsvendas@gmail.com,paaymotors@gmail.com'),
            ('SEMINOVOS BHZ', 'luzdirecaoconsultoria@gmail.com,danieljsvendas@gmail.com,vendasbhz3@gmail.com,agenciaseminovosbhz@gmail.com,washington2610@icloud.com'),
            ('ACERTTCAR', 'luzdirecaoconsultoria@gmail.com,danieljsvendas@gmail.com,brunohenriqueemi@gmail.com,acerttcar@gmail.com'),
            ('RK2 MOTORS', 'luzdirecaoconsultoria@gmail.com,danieljsvendas@gmail.com,marcelohnogueira@yahoo.com.br,valmir.jjnunes@gmail.com,tavinhobh2@hotmail.com,isabellaxpratique@gmail.com,Thiagodpaul10@gmail.com'),
            ('GANDINI AUTOMOVEIS', 'luzdirecaoconsultoria@gmail.com,danieljsvendas@gmail.com,regandini@gmail.com,gandini.antonio@gmail.com'),
            ('ESPINDOLA AUTOMOVEIS', 'luzdirecaoconsultoria@gmail.com,danieljsvendas@gmail.com,espindolacarros@gmail.com'),
            ('DNA VEICULOS', 'luzdirecaoconsultoria@gmail.com,danieljsvendas@gmail.com,mr.rodrigo@outlook.com.br,pedrosantana784a@gmail.com,theomorato77@gmail.com,leiladias85@icloud.com'),
            ('BROTHERS CAR', 'luzdirecaoconsultoria@gmail.com,danieljsvendas@gmail.com,caiio.ce@hotmail.com,anderson.c.evangelista@hotmail.com'),
            ('LIAL VEICULOS', 'luzdirecaoconsultoria@gmail.com,danieljsvendas@gmail.com,davi@lialveiculos.com.br,jessica@lialveiculos.com.br'),
            ('PISCAR VEICULOS', 'luzdirecaoconsultoria@gmail.com,danieljsvendas@gmail.com,gabrieldcsamp@gmail.com,goncalvesleitevinicius@gmail.com,igor.r97@hotmail.com,gabrieldepaula337@gmail.com,Iago_rm@hotmail.com,adm@piscarveiculos.com.br')
        ) AS t(name, emails)
    LOOP
        -- Buscar ID da loja (ignorando case para maior resiliência)
        SELECT id INTO v_store_id FROM public.stores WHERE UPPER(name) = UPPER(r.name) LIMIT 1;

        IF v_store_id IS NOT NULL THEN
            -- Converter string de e-mails em array, limpando espaços
            v_emails := string_to_array(r.emails, ',');
            
            INSERT INTO public.store_delivery_rules (
                store_id, 
                matinal_recipients, 
                weekly_recipients, 
                monthly_recipients
            )
            VALUES (
                v_store_id,
                v_emails,
                v_emails,
                v_emails
            )
            ON CONFLICT (store_id) DO UPDATE SET
                matinal_recipients = EXCLUDED.matinal_recipients,
                weekly_recipients = EXCLUDED.weekly_recipients,
                monthly_recipients = EXCLUDED.monthly_recipients,
                updated_at = NOW();
                
            RAISE NOTICE 'Destinatários para % registrados.', r.name;
        ELSE
            RAISE NOTICE 'AVISO: Loja % não encontrada no banco.', r.name;
        END IF;
    END LOOP;
END $$;
