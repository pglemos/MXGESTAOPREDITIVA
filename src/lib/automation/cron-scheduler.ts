import { supabase } from '@/lib/supabase';
import { calcularFunil, somarVendas, calcularProjecao, calcularAtingimento, getDiasInfo } from '../calculations';
import { getMatinalEmailTemplate } from './email/templates/matinal';
import { sendEmailReport } from './email/sender';
import { generateMorningReportXlsx } from './reports/xlsx-generator';
import { calculateReferenceDate } from '@/hooks/useCheckins';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function runMatinalWorkflow() {
    console.log('🚀 Iniciando Ciclo Matinal MX (v2)...');

    const referenceDate = calculateReferenceDate();
    const dateLabel = format(parseISO(referenceDate), 'dd/MM/yyyy', { locale: ptBR });
    const daysInfo = getDiasInfo(referenceDate);

    // 1. Buscar lojas e suas regras
    const { data: lojas } = await supabase
        .from('lojas')
        .select('*, regras_entrega_loja(*), regras_metas_loja(*)');

    if (!lojas) return;

    for (const store of lojas) {
        console.log(`\n- Processando Loja: ${store.name}`);

        // 2. Buscar dados do mês para esta loja
        const { data: monthCheckins } = await supabase
            .from('lancamentos_diarios')
            .select('*')
            .eq('store_id', store.id)
            .gte('reference_date', format(parseISO(referenceDate), 'yyyy-MM-01'));

        if (!monthCheckins) continue;

        // 3. Buscar vendedores
        const { data: members } = await supabase
            .from('vinculos_loja')
            .select('user_id, users:usuarios(name)')
            .eq('store_id', store.id)
            .eq('role', 'vendedor');

        if (!members) continue;

        const ranking: any[] = [];
        const pendingSellers: string[] = [];

        for (const member of members) {
            const sellerCheckins = monthCheckins.filter(c => c.seller_user_id === member.user_id);
            const yesterdayCheckin = sellerCheckins.find(c => c.reference_date === referenceDate);
            
            if (!yesterdayCheckin) {
                pendingSellers.push((member.users as any)?.name || 'Vendedor');
            }

            const sellerFunnel = calcularFunil(sellerCheckins as any);
            const totalSales = somarVendas(sellerCheckins as any);

            ranking.push({
                user_id: member.user_id,
                user_name: (member.users as any)?.name,
                leads: sellerFunnel.leads,
                agd_total: sellerFunnel.agd_total,
                visitas: sellerFunnel.visitas,
                vnd_total: totalSales,
                vnd_yesterday: yesterdayCheckin ? (yesterdayCheckin.vnd_porta_prev_day || 0) + (yesterdayCheckin.vnd_cart_prev_day || 0) + (yesterdayCheckin.vnd_net_prev_day || 0) : 0,
                atingimento: sellerFunnel.vnd_total > 0 ? 100 : 0 // Placeholder simplificado
            });
        }

        const storeSales = somarVendas(monthCheckins as any);
        const storeGoal = store.regras_metas_loja?.monthly_goal || 0;
        
        const metrics = {
            currentSales: storeSales,
            teamGoal: storeGoal,
            projection: calcularProjecao(storeSales, daysInfo.decorridos, daysInfo.total),
            reaching: calcularAtingimento(storeSales, storeGoal),
            gap: Math.max(0, storeGoal - storeSales),
            pendingSellers
        };

        // 4. Gerar XLSX e Enviar E-mail
        const recipients = store.regras_entrega_loja?.matinal_recipients;

        if (recipients && recipients.length > 0) {
            try {
                const xlsxBuffer = await generateMorningReportXlsx(store.name, dateLabel, ranking);
                const html = getMatinalEmailTemplate(store.name, dateLabel, metrics, ranking);
                
                await sendEmailReport(
                    recipients, 
                    `📊 Matinal: ${store.name} - Tendência: ${metrics.projection} carros`, 
                    html, 
                    xlsxBuffer
                );
                console.log(`  ✅ Matinal enviado para ${recipients.join(', ')}`);
            } catch (e) {
                console.error(`  ❌ Falha no envio:`, e);
            }
        }
    }

    console.log('\n✨ Ciclo Matinal Finalizado.');
}
