import { supabase } from '@/lib/supabase';
import { calcularFunil, gerarDiagnosticoMX, formatStructuredWhatsAppFeedback } from '../../calculations';
import { getWeeklyFeedbackEmailTemplate } from '../email/templates/weekly-feedback';
import { sendEmailReport } from '../email/sender';
import { startOfWeek, subWeeks, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function runWeeklyFeedbackWorkflow() {
    console.log('🚀 Iniciando Ciclo de Devolutiva Semanal MX...');

    // 1. Período: Semana Anterior Fechada
    const now = new Date();
    const lastWeek = subWeeks(now, 1);
    const start = startOfWeek(lastWeek, { weekStartsOn: 1 });
    const end = startOfWeek(now, { weekStartsOn: 1 }); // Até o início desta semana
    
    const dateRangeLabel = `${format(start, 'dd/MM', { locale: ptBR })} a ${format(end, 'dd/MM', { locale: ptBR })}`;
    const startKey = format(start, 'yyyy-MM-dd');

    // 2. Buscar lojas e suas regras de entrega
    const { data: lojas, error: storeErr } = await supabase
        .from('lojas')
        .select('*, store_delivery_rules(*), store_meta_rules(*)');

    if (storeErr || !lojas) {
        console.error('❌ Erro ao buscar lojas:', storeErr);
        return;
    }

    for (const store of lojas) {
        console.log(`\n- Processando Loja: ${store.name}`);
        
        // 3. Buscar checkins da semana para esta loja
        const { data: checkins } = await supabase
            .from('lancamentos_diarios')
            .select('*')
            .eq('store_id', store.id)
            .gte('reference_date', startKey)
            .lt('reference_date', format(now, 'yyyy-MM-dd'));

        if (!checkins || checkins.length === 0) {
            console.warn(`  ⚠️ Nenhum checkin localizado para ${store.name}.`);
            continue;
        }

        // 4. Buscar vendedores da loja
        const { data: members } = await supabase
            .from('vinculos_loja')
            .select('user_id, users:usuarios(name)')
            .eq('store_id', store.id)
            .eq('role', 'vendedor');

        if (!members) continue;

        const feedbackData: any[] = [];

        for (const member of members) {
            const sellerCheckins = checkins.filter(c => c.seller_user_id === member.user_id);
            const funnel = calcularFunil(sellerCheckins as any);
            const diag = gerarDiagnosticoMX(funnel);
            
            // Gerar texto do WhatsApp seguindo o novo padrão
            const whatsappText = formatStructuredWhatsAppFeedback({
                sellerName: (member.users as any)?.name || 'Vendedor',
                metrics: funnel,
                diagnostic: diag,
                actions: [diag.sugestao],
                periodLabel: dateRangeLabel
            });

            feedbackData.push({
                seller_id: member.user_id,
                seller_name: (member.users as any)?.name || 'Vendedor',
                whatsapp_text: whatsappText
            });
        }

        // 5. Enviar E-mail Consolidado para o Gerente/Dono
        const recipients = store.store_delivery_rules?.weekly_recipients;
        
        if (recipients && recipients.length > 0) {
            try {
                const html = getWeeklyFeedbackEmailTemplate(store.name, dateRangeLabel, feedbackData);
                // Por enquanto sem anexo para simplificar ou gerar um consolidado depois
                await sendEmailReport(recipients, `📊 Devolutiva Semanal: ${store.name}`, html, Buffer.from(''));
                console.log(`  ✅ E-mail enviado para ${recipients.join(', ')}`);
            } catch (e) {
                console.error(`  ❌ Falha no envio:`, e);
            }
        } else {
            console.warn(`  ⚠️ Sem destinatários configurados para ${store.name}.`);
        }
    }

    console.log('\n✨ Ciclo de Devolutiva Finalizado.');
}
